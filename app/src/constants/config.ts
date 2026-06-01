/**
 * URLs oficiais — alinhado a diariadacidade.com.br (web) e diariadacidade.app.br (app / deep links).
 * Fase 3: subdomínios por cidade via instanceLink().
 */

export const CONFIG = {
  WEB_URL: "https://diariadacidade.com.br",
  APP_URL: "https://diariadacidade.app.br",
  DEEP_SCHEME: "diariadacidade",

  /** Lojas — atualize os IDs quando publicar nas stores */
  APP_STORE_URL: "https://apps.apple.com/app/id0000000000",
  PLAY_STORE_URL:
    "https://play.google.com/store/apps/details?id=com.diariacidade.app",

  refLink: (codigo: string) => `${CONFIG.APP_URL}/ref/${encodeURIComponent(codigo.trim())}`,

  qrLink: (token: string) => `${CONFIG.APP_URL}/qr/${encodeURIComponent(token)}`,

  vagaLink: (jobId: string) => `${CONFIG.APP_URL}/vaga/${encodeURIComponent(jobId)}`,

  /** Fase 3 — wildcard *.diariadacidade.com.br na Vercel */
  instanceLink: (cidade: string) =>
    `https://${cidade.toLowerCase().replace(/\s+/g, "")}.diariadacidade.com.br`,
} as const;

/** @deprecated use CONFIG.refLink(codigo) ou CONFIG.APP_URL + '/ref' */
export const REF_LINK_BASE = `${CONFIG.APP_URL}/ref`;
