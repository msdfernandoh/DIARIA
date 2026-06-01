export type JobRow = {
  id: string;
  empregador_id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  tipo: string | null;
  formato: string | null;
  valor: number | null;
  cidade: string | null;
  estado: string | null;
  lat: number | null;
  lng: number | null;
  urgente: boolean;
  recorrente: boolean;
  vagas_restantes: number;
  destaque_nivel: string;
  destaque_grupo_id: string | null;
  criado_em: string;
  empregador_nome?: string;
  empregador_nota?: number | null;
  total_avaliacoes?: number;
  prioridade?: number;
  distancia_km?: number | null;
  data_inicio?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  requisitos?: string | null;
  beneficios?: string[] | null;
  endereco?: string | null;
  empregador_cidade?: string | null;
  empregador_desde?: string | null;
};

export type JobDetail = JobRow & {
  empregador_nome: string;
  empregador_nota: number | null;
  total_avaliacoes: number;
  empregador_top_topics?: { tag: string; count: number }[];
};

export type FeedFilters = {
  q?: string;
  categoria?: string;
  urgente?: boolean;
  formato?: "presencial" | "remoto" | "home_office";
};
