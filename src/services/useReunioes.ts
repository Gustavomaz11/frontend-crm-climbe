import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";
import {
  GOOGLE_ACCESS_TOKEN_STORAGE_KEY,
  syncGoogleAccessToken,
} from "@/lib/googleAccessToken";

export interface Reuniao {
  id: number;
  idReuniao?: number;
  titulo: string;
  descricao?: string;
  pauta?: string;
  dataHora: string;
  data?: string;
  hora?: string;
  local: string;
  empresaId: number;
  empresa?: {
    id?: number;
    idEmpresa?: number;
    nome?: string;
    nomeFantasia?: string;
    razaoSocial?: string;
  };
  presencial?: boolean;
  status?: string;
  googleEventId?: string;
  /** Evento de dia inteiro (ex.: Google Calendar com start.date). */
  diaInteiro?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface CreateReuniaoDTO {
  titulo: string;
  pauta?: string;
  data: string;
  hora: string;
  presencial: boolean;
  local?: string;
  empresaId: number;
  status?: string;
  participanteIds?: number[];
}

type ReuniaoApi = Reuniao & {
  idReuniao?: number;
  /** Resposta bruta da API (Jackson pode enviar data/hora em formatos variados). */
  data?: unknown;
  hora?: unknown;
  dataHora?: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function normalizeDatePart(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (typeof input === "string") {
    const s = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.length >= 10) return s.slice(0, 10);
    return undefined;
  }
  if (Array.isArray(input) && input.length >= 3) {
    const y = Number(input[0]);
    const m = Number(input[1]);
    const d = Number(input[2]);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return `${y}-${pad2(m)}-${pad2(d)}`;
    }
  }
  if (typeof input === "object" && input !== null) {
    const o = input as { year?: number; month?: number; day?: number };
    if (
      o.year != null &&
      o.month != null &&
      o.day != null &&
      Number.isFinite(o.year) &&
      Number.isFinite(o.month) &&
      Number.isFinite(o.day)
    ) {
      return `${o.year}-${pad2(o.month)}-${pad2(o.day)}`;
    }
  }
  return undefined;
}

function normalizeTimePart(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (typeof input === "string") {
    const s = input.trim();
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const h = Number(m[1]);
      const min = Number(m[2]);
      const sec = m[3] != null ? Number(m[3]) : 0;
      if (Number.isFinite(h) && Number.isFinite(min) && Number.isFinite(sec)) {
        return `${pad2(h)}:${pad2(min)}:${pad2(sec)}`;
      }
    }
    return undefined;
  }
  if (Array.isArray(input) && input.length >= 2) {
    const h = Number(input[0]);
    const min = Number(input[1]);
    const sec = input.length > 2 ? Number(input[2]) : 0;
    if (Number.isFinite(h) && Number.isFinite(min) && Number.isFinite(sec)) {
      return `${pad2(h)}:${pad2(min)}:${pad2(sec)}`;
    }
  }
  return undefined;
}

/** Preferência: dataHora ISO da API (integration-pages). Fallback: data + hora normalizados. */
function buildDataHora(reuniao: ReuniaoApi): string {
  if (typeof reuniao.dataHora === "string") {
    const t = reuniao.dataHora.trim();
    if (t) return t;
  }

  const datePart = normalizeDatePart(reuniao.data);
  const timePart = normalizeTimePart(reuniao.hora);
  if (datePart && timePart) {
    return `${datePart}T${timePart}`;
  }
  return "";
}

function normalizeReuniao(reuniao: ReuniaoApi): Reuniao {
  const empresaId =
    reuniao.empresaId ??
    reuniao.empresa?.id ??
    reuniao.empresa?.idEmpresa ??
    0;

  return {
    ...reuniao,
    id: reuniao.id ?? reuniao.idReuniao ?? 0,
    idReuniao: reuniao.idReuniao ?? reuniao.id,
    empresaId,
    dataHora: buildDataHora(reuniao),
    descricao: reuniao.descricao ?? reuniao.pauta ?? "",
    local: reuniao.local ?? "",
  };
}

function upsertReuniaoInCache(current: Reuniao[] | undefined, reuniao: Reuniao) {
  const list = current ?? [];
  const exists = list.some((item) => item.id === reuniao.id);
  const next = exists
    ? list.map((item) => (item.id === reuniao.id ? reuniao : item))
    : [...list, reuniao];

  return next.sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

function buildCreatePayload(data: CreateReuniaoDTO) {
  return {
    titulo: data.titulo,
    pauta: data.pauta,
    data: data.data,
    hora: data.hora,
    presencial: data.presencial,
    local: data.local,
    empresaId: data.empresaId,
    status: data.status ?? "AGENDADA",
    participanteIds: data.participanteIds ?? [],
    empresa: {
      idEmpresa: data.empresaId,
    },
  };
}

function buildHeaders() {
  const googleAccessToken = getGoogleAccessToken();
  return googleAccessToken
    ? { "X-Google-Access-Token": googleAccessToken }
    : undefined;
}

function getGoogleAccessToken() {
  return localStorage.getItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY);
}

async function fetchReuniaoList(path: string): Promise<Reuniao[]> {
  const hadGoogleToken = !!getGoogleAccessToken();
  try {
    const response = await api.get<Reuniao[]>(path, {
      headers: buildHeaders(),
    });
    return response.data.map(normalizeReuniao);
  } catch (err) {
    if (
      hadGoogleToken &&
      isAxiosError(err) &&
      (err.response?.status === 401 || err.response?.status === 403)
    ) {
      syncGoogleAccessToken(null);
      const response = await api.get<Reuniao[]>(path);
      return response.data.map(normalizeReuniao);
    }
    throw err;
  }
}

async function fetchReuniaoOne(id: number): Promise<Reuniao> {
  const path = `/reunioes/${id}`;
  const hadGoogleToken = !!getGoogleAccessToken();
  try {
    const response = await api.get<Reuniao>(path, {
      headers: buildHeaders(),
    });
    return normalizeReuniao(response.data);
  } catch (err) {
    if (
      hadGoogleToken &&
      isAxiosError(err) &&
      (err.response?.status === 401 || err.response?.status === 403)
    ) {
      syncGoogleAccessToken(null);
      const response = await api.get<Reuniao>(path);
      return normalizeReuniao(response.data);
    }
    throw err;
  }
}

export function useReunioes() {
  return useQuery<Reuniao[]>({
    queryKey: ["reunioes"],
    queryFn: () => fetchReuniaoList("/reunioes"),
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });
}

export function useReuniaoById(id: number) {
  return useQuery<Reuniao>({
    queryKey: ["reunioes", id],
    queryFn: () => fetchReuniaoOne(id),
    enabled: !!id,
  });
}

export function useReunioesByEmpresa(empresaId: number) {
  return useQuery<Reuniao[]>({
    queryKey: ["reunioes", "empresa", empresaId],
    queryFn: () => fetchReuniaoList(`/reunioes/empresa/${empresaId}`),
    enabled: !!empresaId,
  });
}

export function useCreateReuniao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReuniaoDTO) => {
      const response = await api.post<ReuniaoApi>(
        "/reunioes",
        buildCreatePayload(data),
        {
          headers: buildHeaders(),
        },
      );
      return normalizeReuniao(response.data);
    },
    onSuccess: (reuniao) => {
      queryClient.setQueryData<Reuniao[]>(["reunioes"], (current) => upsertReuniaoInCache(current, reuniao));
      queryClient.refetchQueries({ queryKey: ["reunioes"], type: "active" });
    },
  });
}

export function useUpdateReuniao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateReuniaoDTO }) => {
      const response = await api.put<ReuniaoApi>(
        `/reunioes/${id}`,
        buildCreatePayload(data),
        {
          headers: buildHeaders(),
        },
      );
      return normalizeReuniao(response.data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["reunioes"] });
      const previous = queryClient.getQueryData<Reuniao[]>(["reunioes"]);
      queryClient.setQueryData<Reuniao[]>(["reunioes"], (current) =>
        (current ?? []).map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            titulo: data.titulo,
            pauta: data.pauta ?? "",
            descricao: data.pauta ?? "",
            data: data.data,
            hora: data.hora,
            dataHora: `${data.data}T${data.hora}`,
            presencial: data.presencial,
            local: data.local ?? "",
            empresaId: data.empresaId,
            status: data.status ?? item.status ?? "AGENDADA",
          };
        }),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["reunioes"], context.previous);
      }
    },
    onSuccess: (reuniao) => {
      queryClient.setQueryData<Reuniao[]>(["reunioes"], (current) => upsertReuniaoInCache(current, reuniao));
      queryClient.refetchQueries({ queryKey: ["reunioes"], type: "active" });
    },
  });
}

export function useDeleteReuniao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reunioes/${id}`, {
        headers: buildHeaders(),
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["reunioes"] });
      const previous = queryClient.getQueryData<Reuniao[]>(["reunioes"]);
      queryClient.setQueryData<Reuniao[]>(["reunioes"], (current) => (current ?? []).filter((item) => item.id !== id));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["reunioes"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["reunioes"], type: "active" });
    },
  });
}
