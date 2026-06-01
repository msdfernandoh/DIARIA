import * as Linking from "expo-linking";
import { CONFIG } from "../constants/config";

const PENDING_REF_KEY = "pending_ref_codigo";

export { PENDING_REF_KEY };

function pathSegments(url: string): string[] {
  const parsed = Linking.parse(url);
  const path = (parsed.path ?? "").replace(/^\//, "");
  if (parsed.scheme === "http" || parsed.scheme === "https") {
    return path.split("/").filter(Boolean);
  }
  const host = parsed.hostname;
  const parts: string[] = [];
  if (host && !host.includes(".")) {
    parts.push(host);
  }
  if (path) parts.push(...path.split("/").filter(Boolean));
  return parts;
}

/** Converte URL universal / custom scheme em rota Expo Router. */
export function resolveIncomingLink(url: string): string | null {
  if (!url?.trim()) return null;

  const segs = pathSegments(url);
  if (!segs.length) return null;

  const [kind, arg] = segs;

  if (kind === "ref" && arg) {
    const codigo = decodeURIComponent(arg).trim().toUpperCase();
    return `/(auth)/choose-profile?codigo=${encodeURIComponent(codigo)}`;
  }
  if (kind === "qr" && arg) {
    return `/(app)/oportunidades/qrcode/confirmar?token=${encodeURIComponent(arg)}`;
  }
  if (kind === "vaga" && arg) {
    return `/(app)/(empregado)/vagas/${encodeURIComponent(arg)}`;
  }
  if (kind === "chat" && arg) {
    return `/(app)/(empregado)/chat/${encodeURIComponent(arg)}`;
  }

  return null;
}

export function deepLinkFromPath(kind: "ref" | "qr" | "vaga" | "chat", arg: string): string {
  return `${CONFIG.DEEP_SCHEME}://${kind}/${encodeURIComponent(arg)}`;
}
