export type RatingTopic = { id: string; label: string; emoji: string };

export const RATING_TOPICS_EMPREGADO: RatingTopic[] = [
  { id: "pontual", label: "Pontual", emoji: "✅" },
  { id: "confiavel", label: "Confiável", emoji: "🔒" },
  { id: "comunicativo", label: "Comunicativo", emoji: "💬" },
  { id: "caprichoso", label: "Caprichoso", emoji: "🧹" },
  { id: "respeitoso", label: "Respeitoso", emoji: "🤝" },
  { id: "transporte", label: "Tem transporte", emoji: "🚗" },
];

export const RATING_TOPICS_EMPREGADOR: RatingTopic[] = [
  { id: "pagou_prazo", label: "Pagou no prazo", emoji: "💰" },
  { id: "explicou_tarefa", label: "Explicou bem a tarefa", emoji: "📋" },
  { id: "respeitoso", label: "Respeitoso", emoji: "🤝" },
  { id: "organizado", label: "Organizado", emoji: "✅" },
  { id: "contrataria_novo", label: "Contrataria de novo", emoji: "🔄" },
];
