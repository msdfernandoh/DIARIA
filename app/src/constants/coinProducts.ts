export type CoinProduct = {
  id: string;
  emoji: string;
  title: string;
  cost: number;
  duration: string;
  reason: string;
};

export const COIN_PRODUCTS_EMPREGADO: CoinProduct[] = [
  { id: "curriculo_topo", emoji: "🔝", title: "Currículo no topo", cost: 100, duration: "7 dias", reason: "curriculo_topo" },
  { id: "badge_verificado", emoji: "✅", title: "Badge verificado", cost: 80, duration: "30 dias", reason: "badge_verificado" },
  { id: "candidatura_express", emoji: "⚡", title: "Candidatura express", cost: 30, duration: "uso único", reason: "candidatura_express" },
];

export const COIN_PRODUCTS_EMPREGADOR: CoinProduct[] = [
  { id: "vaga_destaque", emoji: "📌", title: "Vaga em destaque", cost: 200, duration: "7 dias", reason: "vaga_destaque" },
  { id: "filtro_avancado", emoji: "🔍", title: "Filtro avançado", cost: 150, duration: "30 dias", reason: "filtro_avancado" },
];

export const EARN_TIPS = [
  { emoji: "👥", text: "Indicar um profissional que ficou ativo", coins: "+50" },
  { emoji: "🏢", text: "Indicar um empregador que publicou vaga", coins: "+80" },
  { emoji: "✅", text: "Concluir uma diária com avaliação", coins: "+10" },
  { emoji: "⭐", text: "Receber avaliação 5 estrelas", coins: "+5" },
  { emoji: "👤", text: "Completar perfil 100%", coins: "+20" },
  { emoji: "📅", text: "Usar o app 7 dias seguidos", coins: "+15" },
] as const;
