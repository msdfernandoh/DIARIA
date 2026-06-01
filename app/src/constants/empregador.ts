export const EMPREGADOR_ONBOARDING_STEPS = 3;

export const TIPO_CONTRATANTE_OPTIONS = [
  {
    id: "pessoa_fisica" as const,
    emoji: "👤",
    title: "Pessoa física / Família",
    subtitle: "Contratar para minha residência ou uso pessoal",
  },
  {
    id: "mei" as const,
    emoji: "🏪",
    title: "MEI / Autônomo",
    subtitle: "Tenho um pequeno negócio",
  },
  {
    id: "empresa" as const,
    emoji: "🏢",
    title: "Empresa (CNPJ)",
    subtitle: "Tenho uma empresa registrada",
  },
];

export const SEGMENTOS = [
  "Restaurante",
  "Eventos",
  "Construção",
  "Varejo",
  "Saúde",
  "Educação",
  "Outro",
] as const;

export type TipoContratante = (typeof TIPO_CONTRATANTE_OPTIONS)[number]["id"];
export type Segmento = (typeof SEGMENTOS)[number];
