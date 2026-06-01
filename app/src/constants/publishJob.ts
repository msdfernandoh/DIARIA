export const PUBLISH_STEPS = 4;

export const JOB_CATEGORIES = [
  { id: "limpeza", label: "Limpeza", emoji: "🧹" },
  { id: "garcom", label: "Garçom", emoji: "🍽️" },
  { id: "churrasco", label: "Churrasco", emoji: "🔥" },
  { id: "chapa", label: "Chapa", emoji: "💪" },
  { id: "obras", label: "Obras", emoji: "🔨" },
  { id: "fretes", label: "Fretes", emoji: "📦" },
  { id: "motoboy", label: "Motoboy", emoji: "🏍️" },
  { id: "cuidador", label: "Cuidador", emoji: "👶" },
  { id: "eleitoral", label: "Eleitoral", emoji: "🗳️" },
  { id: "home_office", label: "Home Office", emoji: "🏠" },
  { id: "vendas", label: "Vendas", emoji: "💼" },
  { id: "jardineiro", label: "Jardineiro", emoji: "🌿" },
  { id: "educacao", label: "Educação", emoji: "🎓" },
  { id: "beleza", label: "Beleza", emoji: "💆" },
  { id: "eventos", label: "Eventos", emoji: "🎉" },
  { id: "outro", label: "Outro", emoji: "✨" },
] as const;

export const PRICE_HINTS: Record<string, string> = {
  limpeza: "R$120–200",
  garcom: "R$150–250",
  churrasco: "R$200–350",
  chapa: "R$130–280",
  obras: "R$120–280",
  motoboy: "R$120–220",
  eleitoral: "R$150–400",
  home_office: "R$80–200",
};

export const BENEFICIOS_PUBLISH = [
  { id: "refeicao", label: "Refeição", emoji: "🍽️" },
  { id: "uniforme", label: "Uniforme", emoji: "👕" },
  { id: "transporte", label: "Vale-transporte", emoji: "🚌" },
  { id: "pagamento_dia", label: "Pagamento no dia", emoji: "💰" },
  { id: "acomodacao", label: "Acomodação", emoji: "🏠" },
] as const;

export const CONTRATO_OPTIONS = [
  { id: "clt", label: "CLT" },
  { id: "pj", label: "PJ" },
  { id: "estagio", label: "Estágio" },
  { id: "aprendiz", label: "Aprendiz" },
] as const;

export const CARGA_OPTIONS = [
  { id: "full", label: "Full-time" },
  { id: "part", label: "Part-time" },
  { id: "combinar", label: "A combinar" },
] as const;

export const WEEKDAYS = [
  { id: 0, label: "Dom" },
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
] as const;

/** Skills em user_skills compatíveis com cada categoria de vaga */
export const CATEGORY_SKILL_IDS: Record<string, string[]> = {
  limpeza: ["diarista"],
  garcom: ["garcom", "cozinha"],
  churrasco: ["cozinha"],
  chapa: ["cozinha"],
  obras: ["obras", "pintura", "eletricista"],
  fretes: ["mudancas", "motorista"],
  motoboy: ["motorista"],
  cuidador: ["cuidador"],
  eleitoral: ["atendimento"],
  home_office: ["ti", "redacao", "atendimento"],
  vendas: ["atendimento"],
  jardineiro: ["jardim"],
  educacao: ["atendimento"],
  beleza: ["atendimento"],
  eventos: ["eventos"],
  outro: [],
};

export function categoryLabel(id: string): string {
  return JOB_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
