import { describe, expect, it } from "vitest";
import { getNotificacaoApresentacao } from "./notificacaoApresentacao";
import { getNotificacaoDestino } from "./useNotificacoes";

describe("apresentação das notificações existentes", () => {
  it("mantém o prazo e o nome da tarefa ao tornar a atribuição mais natural", () => {
    const aviso = { tipo: "TAREFA_ATRIBUIDA", mensagem: 'Você foi atribuído como responsável pela tarefa "Fechamento mensal".\nContrato/negociação: Datawer Tec.\nPrazo: 30/10/2026.' };
    expect(getNotificacaoApresentacao(aviso).mensagem).toBe('A tarefa "Fechamento mensal" da Datawer Tec está com você. O prazo é 30/10/2026.');
    expect(getNotificacaoApresentacao({ ...aviso, mensagem: aviso.mensagem.replace("30/10/2026", "Não informado") }).mensagem).not.toContain("prazo");
  });

  it.each(["PROPOSTA", "CONTRATO"])("preserva a versão e a justificativa de recusa de %s, inclusive links do cliente", tipo => {
    const documento = tipo === "PROPOSTA" ? "Proposta #12" : "Contrato CT-12";
    const comentario = "Justificativa: Confira os valores em https://cliente.example/contratos.";
    const mensagem = `O cliente reprovou o documento.\n${documento} da empresa Datawer Tec (versão 2).\n${comentario}`;
    const exibida = getNotificacaoApresentacao({ tipo: `${tipo}_REPROVADA`, mensagem }).mensagem;
    expect(exibida).toContain("não aprovou"); expect(exibida).toContain("Datawer Tec (versão 2)"); expect(exibida).toContain(comentario);
  });

  it.each(["Proposta #12", "Contrato CT-12"])("explica o pedido de ajustes de %s sem perder o comentário", documento => {
    const mensagem = `O cliente solicitou revisão do documento.\n${documento} da empresa Datawer Tec (versão 3).\nComentário do cliente: Alterar o prazo.`;
    expect(getNotificacaoApresentacao({ tipo: "REVISAO", mensagem }).mensagem).toBe(`O cliente pediu ajustes n${documento.startsWith("Proposta") ? "a proposta" : "o contrato"} da Datawer Tec (versão 3).\nComentário do cliente: Alterar o prazo.`);
  });

  it("mantém a duração da participação temporária e o destino dos avisos antigos", () => {
    const mensagem = "Você foi selecionado para a equipe de apoio, até concluir as tarefas atribuídas do contrato de Datawer Tec. Acesse /contratos/kanban?contrato=10 para trabalhar nas tarefas.";
    const exibida = getNotificacaoApresentacao({ tipo: "CONTRATO", mensagem }).mensagem;
    expect(exibida).toContain("equipe de apoio da Datawer Tec"); expect(exibida).toContain("até a conclusão das tarefas atribuídas");
    expect(exibida).not.toContain("/contratos/"); expect(getNotificacaoDestino(mensagem)).toBe("/contratos/kanban?contrato=10");
  });

  it("preserva o conteúdo de tipos ainda desconhecidos", () => {
    const mensagem = "Uma mensagem importante com detalhes do seu trabalho.";
    expect(getNotificacaoApresentacao({ tipo: "NOVO_EVENTO", mensagem }).mensagem).toBe(mensagem);
  });
});
