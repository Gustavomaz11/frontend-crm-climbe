import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api";

export const mensagemConvite = "Olá, sócio!\n\nSeja bem-vindo ao CRM da Climbe, nosso espaço para conectar pessoas, organizar oportunidades e acompanhar os negócios.\n\nClique no botão abaixo e entre com sua conta Google para solicitar acesso ao sistema. Após a aprovação do seu cadastro, você poderá começar a usar o CRM.\n\nVamos construir novas oportunidades juntos!\nEquipe Climbe";

export const analisarDestinatarios = (texto: string) => {
  const informados = texto.split(/[\s,;]+/).map(email => email.trim().toLowerCase()).filter(Boolean);
  const emails = [...new Set(informados)];
  const invalidos = emails.filter(email => email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return { emails, invalidos, duplicados: informados.length - emails.length };
};

export const useEnviarConvites = () => useMutation({
  mutationFn: async (emails: string[]) => {
    try {
      const { data } = await api.post<{ agendados: number; duplicadosIgnorados: number }>("/convites", { emails });
      return data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Não foi possível agendar os convites. Confira os e-mails e tente novamente.");
      }
      throw error;
    }
  },
});
