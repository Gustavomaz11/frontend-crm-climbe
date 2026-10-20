import type { Notificacao } from "./useNotificacoes";

const titulos: Record<string, string> = {
  TAREFA_ATRIBUIDA: "Uma nova tarefa para você",
  TAREFA_CRIADA: "Nova tarefa no Kanban",
  TAREFA_A_FAZER: "Uma tarefa voltou para a fila",
  TAREFA_CONCLUIDA: "Tarefa concluída!",
  PROPOSTA_ACEITA: "Boa notícia: proposta aceita!",
  PROPOSTA_REVISAO_SOLICITADA: "O cliente pediu ajustes na proposta",
  PROPOSTA_REPROVADA: "O cliente não aprovou a proposta",
  CONTRATO_CRIADO: "Novo contrato para acompanhar",
  CONTRATO_APROVADO: "Tudo certo: contrato aprovado!",
  CONTRATO_REVISAO_SOLICITADA: "O cliente pediu ajustes no contrato",
  CONTRATO_REPROVADO: "O cliente não aprovou o contrato",
  CONTRATO_ENVIADO: "Contrato enviado ao cliente",
  CONTRATO_VENCIMENTO: "Atenção ao prazo do contrato",
  CONTRATO: "Novidades do seu contrato",
};

/** Apresenta também os avisos antigos sem expor os caminhos internos de navegação. */
export const getNotificacaoApresentacao = ({ tipo, mensagem: original }: Pick<Notificacao, "tipo" | "mensagem">) => {
  let titulo = titulos[tipo] ?? "Tem novidade para você";
  let mensagem = original.trim();

  const equipe = mensagem.match(/^Você foi selecionado para a (equipe fixa|equipe de apoio, até concluir as tarefas atribuídas) do contrato de (.+)\. Acesse \/contratos\/kanban\?contrato=\d+ para trabalhar nas tarefas\.$/s);
  if (equipe) {
    const apoio = equipe[1] !== "equipe fixa";
    titulo = apoio ? "Seu apoio faz a diferença!" : "Você faz parte da equipe!";
    mensagem = `Você agora faz parte da equipe ${apoio ? "de apoio " : ""}da ${equipe[2]}. `
      + (apoio ? "Seu apoio vai até a conclusão das tarefas atribuídas. " : "")
      + "Acompanhe suas tarefas no Kanban.";
    return { titulo, mensagem };
  }

  mensagem = mensagem
    .replace(/^A proposta #\d+ da empresa (.+) foi aceita\.$/s,
      "O cliente aceitou a proposta da $1. Você já pode seguir com os próximos passos.")
    .replace(/^O contrato CT-\d+ da empresa (.+) foi aprovado\.$/s,
      "O contrato da $1 foi aprovado. Tudo pronto para seguir com o trabalho!")
    .replace(/^Novo contrato CT-\d+ da empresa (.+) disponível para preparação e acompanhamento\.$/s,
      "O contrato da $1 já está disponível. Você pode começar a preparar os próximos passos.")
    .replace(/^O contrato CT-\d+ da empresa (.+) já foi enviado por e-mail para o cliente\.$/s,
      "O cliente já recebeu o contrato da $1 por e-mail. Agora é só acompanhar a resposta.")
    .replace(/^O cliente (reprovou o documento|solicitou revisão do documento)\.\n(Proposta #|Contrato CT-)\d+ da empresa (.+) \(versão (\d+)\)\.(?=\n|$)/,
      (_, resposta: string, documento: string, empresa: string, versao: string) => {
        const item = documento.startsWith("Proposta") ? "a proposta" : "o contrato";
        return `O cliente ${resposta.startsWith("reprovou") ? `não aprovou ${item}` : `pediu ajustes n${item}`} da ${empresa} (versão ${versao}).`;
      })
    .replace(/^Você foi atribuído como responsável pela tarefa "(.+)"\.\nContrato\/negociação: (.+)\.\nPrazo: (.+)\.$/,
      (_, tarefa: string, empresa: string, prazo: string) => `A tarefa "${tarefa}" da ${empresa} está com você.`
        + (prazo === "Não informado" ? "" : ` O prazo é ${prazo}.`))
    .replace(/ Acesse \/(?:contratos\/kanban|pipeline-vendas|pipeline-pre-vendas|agenda)\?[A-Za-z0-9=&_-]+(?: para trabalhar nas tarefas)?\.$/, "");

  return { titulo, mensagem };
};
