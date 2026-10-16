import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api";
import type { CnpjEmpresa } from "@/services/useCnpjEmpresa";
import CadastroEmpresa from "./CadastroEmpresa";

const mocks = vi.hoisted(() => ({ empresa: null as object | null, create: vi.fn(), update: vi.fn() }));
vi.mock("@/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/components/layout/AppSidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/layout/AppHeaderUser", () => ({ AppHeaderUser: () => null }));
vi.mock("@/store/useAuthStore", () => ({ useAuthStore: (selector: (state: object) => unknown) => selector({}) }));
vi.mock("@/services", async () => ({
  ...await vi.importActual<typeof import("@/services/useEmpresas")>("@/services/useEmpresas"),
  useEmpresaById: () => ({ data: mocks.empresa }),
  useCreateEmpresa: () => ({ mutate: mocks.create }),
  useUpdateEmpresa: () => ({ mutate: mocks.update }),
}));

const cadastro: CnpjEmpresa = { cnpj: "37335118000180", razaoSocial: "Empresa Exemplo Ltda.", nomeFantasia: "Exemplo", logradouro: "Rua Central", numero: "123", bairro: "Centro", cidade: "Aracaju", uf: "SE", cep: "49010000", telefone: "79999991234", email: "contato@example.test" };
const clients: QueryClient[] = [];
const setup = (path = "/empresas/nova") => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path="/empresas/nova" element={<CadastroEmpresa />} /><Route path="/empresas/:id/editar" element={<CadastroEmpresa />} /></Routes></MemoryRouter></QueryClientProvider>);
};
const digitar = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => { vi.clearAllMocks(); mocks.empresa = null; vi.stubGlobal("fetch", vi.fn()); vi.mocked(api.get).mockResolvedValue({ data: cadastro }); });
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; vi.unstubAllGlobals(); });

describe("cadastro de empresa pelo CNPJ", () => {
  it("sinaliza empresa inativa no cadastro e identifica MEI sem importar histórico", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...cadastro, tipoEmpresa: "MEI", dadosCadastrais: { status: { id: 8, text: "Baixada" }, company: { simples: { optant: true, since: "2024-01-01", history: [{ since: "2000-01-01" }] }, simei: { optant: true } }, mainActivity: { id: 6201501, text: "Desenvolvimento de sistemas" } } } });
    setup();
    digitar("CNPJ", cadastro.cnpj);
    expect(await screen.findByRole("alert")).toHaveTextContent("empresa baixada na Receita Federal");
    expect(screen.getByLabelText("Tipo / enquadramento da empresa")).toHaveValue("MEI");
    expect(screen.queryByText(/2000-01-01|history/)).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledOnce();
  });

  it("começa pelo CNPJ e preenche os dados sem substituir o endereço com a consulta de CEP", async () => {
    const { container } = setup();
    expect(container.querySelector("form input")).toHaveAttribute("aria-label", "CNPJ");
    expect(screen.getByLabelText("CNPJ")).toHaveFocus();
    digitar("CNPJ", cadastro.cnpj);
    await waitFor(() => expect(screen.getByLabelText("Razão Social")).toHaveValue(cadastro.razaoSocial));
    expect(api.get).toHaveBeenCalledWith("/empresas/consulta-cnpj/37335118000180", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    for (const [label, value] of [["Nome Fantasia", cadastro.nomeFantasia], ["Logradouro", cadastro.logradouro], ["Número", "123"], ["Bairro", "Centro"], ["Cidade", "Aracaju"], ["UF", "SE"], ["CEP", "49010-000"], ["Telefone", "(79) 99999-1234"], ["E-mail", cadastro.email]]) {
      expect(screen.getByLabelText(label)).toHaveValue(value);
    }
    expect(screen.getByLabelText("Nome completo")).toHaveValue("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("não consulta CNPJs incompletos ou com dígitos verificadores inválidos", async () => {
    setup();
    digitar("CNPJ", "123");
    digitar("CNPJ", "37335118000181");
    expect(screen.getByRole("status")).toHaveTextContent("Informe um CNPJ válido");
    await act(() => new Promise(resolve => setTimeout(resolve, 600)));
    expect(api.get).not.toHaveBeenCalled();
  });

  it("preserva uma alteração manual feita enquanto a consulta está em andamento", async () => {
    let resolve!: (value: object) => void;
    vi.mocked(api.get).mockReturnValue(new Promise(done => { resolve = done; }));
    setup();
    digitar("CNPJ", cadastro.cnpj);
    await waitFor(() => expect(api.get).toHaveBeenCalledOnce());
    digitar("Nome Fantasia", "Nome revisado pelo usuário");
    await act(async () => { resolve({ data: cadastro }); });
    await waitFor(() => expect(screen.getByLabelText("Razão Social")).toHaveValue(cadastro.razaoSocial));
    expect(screen.getByLabelText("Nome Fantasia")).toHaveValue("Nome revisado pelo usuário");
  });

  it("ignora a resposta antiga após trocar o CNPJ", async () => {
    let first!: (value: object) => void;
    vi.mocked(api.get).mockReturnValueOnce(new Promise(done => { first = done; })).mockResolvedValue({ data: { ...cadastro, cnpj: "11222333000181", razaoSocial: "Segunda Empresa" } });
    setup();
    digitar("CNPJ", cadastro.cnpj);
    await waitFor(() => expect(api.get).toHaveBeenCalledOnce());
    const signal = vi.mocked(api.get).mock.calls[0][1]!.signal!;
    digitar("CNPJ", "11222333000181");
    await waitFor(() => expect(screen.getByLabelText("Razão Social")).toHaveValue("Segunda Empresa"));
    expect(signal.aborted).toBe(true);
    await act(async () => { first({ data: cadastro }); });
    expect(screen.getByLabelText("Razão Social")).toHaveValue("Segunda Empresa");
  });

  it("permite preenchimento manual e nova tentativa se a consulta falhar", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Indisponível"));
    setup();
    digitar("CNPJ", cadastro.cnpj);
    const retry = await screen.findByRole("button", { name: "Tentar novamente" });
    digitar("Razão Social", "Empresa preenchida manualmente");
    expect(screen.getByRole("button", { name: "Cadastrar Empresa" })).toBeEnabled();
    fireEvent.click(retry);
    await waitFor(() => expect(screen.getByLabelText("Nome Fantasia")).toHaveValue(cadastro.nomeFantasia));
    expect(screen.getByLabelText("Razão Social")).toHaveValue("Empresa preenchida manualmente");
  });

  it("preserva o cadastro existente ao editar sem fazer consulta automática", async () => {
    mocks.empresa = { id: 7, ...cadastro, representanteNome: "Ana", representanteCpf: "000.000.000-00", representanteContato: "ana@example.test" };
    setup("/empresas/7/editar");
    expect(screen.getByLabelText("Razão Social")).toHaveValue(cadastro.razaoSocial);
    await act(() => new Promise(resolve => setTimeout(resolve, 600)));
    expect(api.get).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
