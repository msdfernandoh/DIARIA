/** Catálogo de tipos de push — payloads em `data.tipo` */

export type NotificationDataTipo =
  | "nova_vaga"
  | "chat"
  | "candidatura"
  | "vaga"
  | "painel"
  | "grupo";

export type NotificationPayload = {
  tipo: NotificationDataTipo;
  jobId?: string;
  applicationId?: string;
  [key: string]: unknown;
};

export const NOTIFICATION_TYPES = {
  EMPREGADO: {
    NOVA_VAGA_URGENTE: {
      tipo: "nova_vaga" as const,
      buildTitle: (titulo: string) => `Nova vaga urgente: ${titulo}`,
      buildBody: (empresa: string, valor: number | null, cidade: string | null) => {
        const v =
          valor != null
            ? `R$${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
            : "A combinar";
        return `${empresa} · ${v} · ${cidade ?? "Remoto"}`;
      },
      data: (jobId: string): NotificationPayload => ({ tipo: "nova_vaga", jobId }),
    },
    NOVA_VAGA: {
      tipo: "nova_vaga" as const,
      buildTitle: (titulo: string) => `Nova vaga: ${titulo}`,
      buildBody: (empresa: string, valor: number | null, cidade: string | null) => {
        const v =
          valor != null
            ? `R$${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
            : "A combinar";
        return `${empresa} · ${v} · ${cidade ?? "Remoto"}`;
      },
      data: (jobId: string): NotificationPayload => ({ tipo: "nova_vaga", jobId }),
    },
    CANDIDATURA_ACEITA: {
      tipo: "chat" as const,
      buildTitle: (empresa: string) => `${empresa} aceitou sua candidatura! 🎉`,
      buildBody: () => "Fale agora pelo chat do app",
      data: (applicationId: string): NotificationPayload => ({ tipo: "chat", applicationId }),
    },
    MENSAGEM_NOVA: {
      tipo: "chat" as const,
      buildTitle: (nome: string) => `${nome} te mandou uma mensagem`,
      buildBody: (preview: string) => preview,
      data: (applicationId: string): NotificationPayload => ({ tipo: "chat", applicationId }),
    },
  },
  EMPREGADOR: {
    NOVA_CANDIDATURA: {
      tipo: "candidatura" as const,
      buildTitle: (titulo: string) => `Nova candidatura para ${titulo}`,
      buildBody: (nome: string, nota: string | number) => `${nome} · ${nota}★ se candidatou`,
      data: (applicationId: string, jobId: string): NotificationPayload => ({
        tipo: "candidatura",
        applicationId,
        jobId,
      }),
    },
    VAGA_VENCENDO: {
      tipo: "vaga" as const,
      buildTitle: (titulo: string) => `Sua vaga de ${titulo} é amanhã!`,
      buildBody: (vagasRestantes: number) => `${vagasRestantes} vagas ainda em aberto`,
      data: (jobId: string): NotificationPayload => ({ tipo: "vaga", jobId }),
    },
  },
  EMPREENDEDOR: {
    NOVO_USUARIO_GRUPO: {
      tipo: "grupo" as const,
      buildTitle: () => "Novo usuário no seu grupo! 🎉",
      buildBody: (count: number) => `Total: ${count} pessoas`,
      data: (): NotificationPayload => ({ tipo: "grupo" }),
    },
    META_EM_RISCO: {
      tipo: "painel" as const,
      buildTitle: (dias: number) => `⚠️ Meta em risco: ${dias} dias restantes`,
      buildBody: (pessoas: number, vagas: number) => `Faltam ${pessoas} pessoas e ${vagas} vagas`,
      data: (): NotificationPayload => ({ tipo: "painel" }),
    },
    META_BATIDA: {
      tipo: "painel" as const,
      buildTitle: () => "🎉 Meta do mês batida! Parabéns!",
      buildBody: () => "Continue crescendo seu ecossistema",
      data: (): NotificationPayload => ({ tipo: "painel" }),
    },
    MICROFRANQUIA: {
      tipo: "painel" as const,
      buildTitle: () => "🏆 Microfranquia conquistada!",
      buildBody: () => "Seu negócio agora é vitalício!",
      data: (): NotificationPayload => ({ tipo: "painel" }),
    },
  },
} as const;
