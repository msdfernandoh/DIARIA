export const SKILLS = [
  { id: "diarista", label: "Diarista/Limpeza", emoji: "🧹" },
  { id: "garcom", label: "Garçom/Eventos", emoji: "🍽️" },
  { id: "churrasqueiro", label: "Churrasqueiro", emoji: "🔥" },
  { id: "chapa", label: "Chapa/Carregador", emoji: "💪" },
  { id: "obras", label: "Obras e Reparos", emoji: "🔨" },
  { id: "mudancas", label: "Fretes/Mudanças", emoji: "📦" },
  { id: "motoboy", label: "Motoboy/Entregador", emoji: "🏍️" },
  { id: "baba", label: "Babá/Cuidador", emoji: "👶" },
  { id: "cabo_eleitoral", label: "Cabo Eleitoral", emoji: "🗳️" },
  { id: "home_office", label: "Home Office", emoji: "🏠" },
  { id: "vendas", label: "Vendas/Captação", emoji: "💼" },
  { id: "jardim", label: "Jardineiro", emoji: "🌿" },
  { id: "educacao", label: "Educação/Ensino", emoji: "🎓" },
  { id: "beleza", label: "Beleza/Bem-estar", emoji: "💆" },
  { id: "eventos", label: "Eventos", emoji: "🎉" },
  { id: "eletricista", label: "Eletricista", emoji: "🔌" },
  { id: "pintor", label: "Pintor", emoji: "🖌️" },
  { id: "pets", label: "Cuidador de pets", emoji: "🐕" },
  { id: "digital", label: "Digital/Conteúdo", emoji: "📱" },
  { id: "cabeleireiro", label: "Cabeleireiro", emoji: "✂️" },
] as const;

export const HIGHLIGHT_TAGS = [
  { id: "pontual", label: "Pontual", emoji: "✅" },
  { id: "confiavel", label: "Confiável", emoji: "🔒" },
  { id: "organizado", label: "Organizado", emoji: "🧹" },
  { id: "comunicativo", label: "Comunicativo", emoji: "💬" },
  { id: "transporte", label: "Tem transporte", emoji: "🚗" },
  { id: "informatica", label: "Sabe informática", emoji: "💻" },
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

export const RAIO_OPTIONS = [
  { label: "Até 5 km", value: 5 },
  { label: "Até 10 km", value: 10 },
  { label: "Até 20 km", value: 20 },
  { label: "Até 50 km", value: 50 },
  { label: "Sem limite", value: 0 },
] as const;

export const TURNOS = [
  { id: "manha", label: "Manhã (6h–12h)", emoji: "☀️" },
  { id: "tarde", label: "Tarde (12h–18h)", emoji: "🌤️" },
  { id: "noite", label: "Noite (18h–22h)", emoji: "🌙" },
  { id: "madrugada", label: "Madrugada (22h–6h)", emoji: "🌃" },
  { id: "qualquer", label: "Qualquer período", emoji: "🕐" },
] as const;

export const HORAS_DIA_OPTIONS = [
  { label: "4h", value: 4 },
  { label: "6h", value: 6 },
  { label: "8h", value: 8 },
  { label: "10h", value: 10 },
  { label: "12h", value: 12 },
  { label: "Flexível", value: 0 },
] as const;

export const HORAS_SEMANA_OPTIONS = [
  { label: "Até 20h", value: 20 },
  { label: "Até 40h", value: 40 },
  { label: "Até 60h", value: 60 },
  { label: "Sem limite", value: 0 },
] as const;

export const TIPO_JORNADA = [
  { id: "diarias_avulsas", label: "Diárias avulsas" },
  { id: "dias_fixos", label: "Dias fixos por semana" },
  { id: "emprego_fixo", label: "Emprego fixo" },
  { id: "home_office", label: "Home office" },
  { id: "qualquer", label: "Qualquer" },
] as const;

export const TRANSPORTE_OPTIONS = [
  { id: "sem", label: "Não tenho (a pé / transporte público)", emoji: "🚶" },
  { id: "moto", label: "Tenho moto", emoji: "🏍️" },
  { id: "carro", label: "Tenho carro", emoji: "🚗" },
  { id: "van", label: "Tenho van / caminhonete", emoji: "🚐" },
  { id: "bicicleta", label: "Tenho bicicleta", emoji: "🚲" },
] as const;

export const ONBOARDING_STEPS = 10;

export const EMPREGADO_ACCENT = "#1D9E75";
