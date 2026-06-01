export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatJobDate(iso: string | null | undefined): string {
  if (!iso) return "A combinar";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(t: string | null | undefined): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

export function jobDurationLabel(
  inicio: string | null | undefined,
  fim: string | null | undefined
): string {
  if (!inicio || !fim) return "A combinar";
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);
  if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return "A combinar";
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

export function formatoLabel(formato: string | null | undefined): string {
  if (formato === "remoto") return "Remoto";
  if (formato === "hibrido") return "Híbrido";
  return "Presencial";
}

export function formatMoney(valor: number | null | undefined): string {
  if (valor == null) return "A combinar";
  return `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

export function staticMapUrl(lat: number, lng: number, width = 600, height = 280): string | null {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=${width}x${height}&scale=2&markers=color:0x1D9E75|${lat},${lng}&key=${key}`;
}

export const BENEFICIO_ICONS: Record<string, string> = {
  refeicao: "🍽️",
  uniforme: "👕",
  transporte: "🚌",
  pagamento_dia: "💰",
  acomodacao: "🏠",
};
