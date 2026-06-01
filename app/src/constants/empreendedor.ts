export const EMPREENDEDOR_ONBOARDING_STEPS = 6;

export const CORES_INSTANCIA = [
  "#1D9E75",
  "#1557FF",
  "#D97706",
  "#7C3AED",
  "#D85A30",
  "#0891B2",
] as const;

export const TIPO_PESSOA = [
  { id: "mei" as const, label: "MEI" },
  { id: "cnpj" as const, label: "CNPJ" },
  { id: "pf" as const, label: "Pessoa Física" },
];

export type TipoPessoaEmpreendedor = (typeof TIPO_PESSOA)[number]["id"];

export const PIX_TIPOS = [
  { id: "cpf" as const, label: "CPF" },
  { id: "cnpj" as const, label: "CNPJ" },
  { id: "celular" as const, label: "Celular" },
  { id: "email" as const, label: "E-mail" },
  { id: "aleatoria" as const, label: "Chave aleatória" },
] as const;

export type PixTipo = (typeof PIX_TIPOS)[number]["id"];

export const REF_LINK_BASE = "https://diaria-da-cidade.vercel.app/ref";
