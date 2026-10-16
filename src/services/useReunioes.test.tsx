import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import { useCreateReuniao, useUpdateReuniao } from "./useReunioes";

vi.mock("@/api", () => ({ api: { post: vi.fn(), put: vi.fn() } }));

const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
const data = { titulo: "Alinhamento", data: "2026-10-20", hora: "10:00", presencial: true, salaEmail: "sala@resource.calendar.google.com" };

describe("agendamento de reuniões", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normaliza reunião com local como presencial e preserva o link do Meet recebido", async () => {
    const linkMeet = "https://meet.google.com/abc-defg-hij";
    vi.mocked(api.post).mockResolvedValue({ data: { ...data, idReuniao: 1, presencial: false, local: "Sala 1", linkMeet } });
    const { result } = renderHook(() => useCreateReuniao(), { wrapper });
    await act(async () => {
      const criada = await result.current.mutateAsync(data);
      expect(criada.presencial).toBe(true);
      expect(criada.linkMeet).toBe(linkMeet);
    });
  });

  it("envia reunião da equipe sem empresa e preserva sala e usuários selecionados", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ...data, idReuniao: 1, empresa: null } });
    const { result } = renderHook(() => useCreateReuniao(), { wrapper });
    await act(async () => {
      const created = await result.current.mutateAsync({ ...data, participanteIds: [2, 3] });
      expect(created.empresaId).toBeNull();
      expect(created.salaEmail).toBe(data.salaEmail);
    });
    expect(api.post).toHaveBeenCalledWith("/reunioes", expect.objectContaining({ empresaId: null, empresa: null, salaEmail: data.salaEmail, participanteIds: [2, 3] }), expect.any(Object));
  });

  it("alterar status não envia lista vazia de participantes", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { ...data, idReuniao: 1 } });
    const { result } = renderHook(() => useUpdateReuniao(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: 1, data: { ...data, status: "CONFIRMADA" } }); });
    const payload = vi.mocked(api.put).mock.calls[0][1];
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty("participanteIds");
    expect(payload).toMatchObject({ empresaId: null, salaEmail: data.salaEmail, status: "CONFIRMADA" });
  });
});
