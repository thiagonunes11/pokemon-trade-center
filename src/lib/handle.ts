/** Slug público do treinador (único). */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;

const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RESERVED = new Set([
  "admin",
  "api",
  "app",
  "card",
  "cards",
  "catalog",
  "colecao",
  "collection",
  "comunidade",
  "login",
  "me",
  "perfil",
  "profile",
  "settings",
  "ajustes",
  "trade",
  "trades",
  "trocas",
  "u",
  "user",
  "users",
  "null",
  "undefined",
  "treinador",
]);

/** Normaliza input do usuário para o formato canônico do slug. */
export function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type HandleValidationError =
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid"
  | "reserved";

export function validateHandle(
  raw: string,
): { ok: true; handle: string } | { ok: false; error: HandleValidationError } {
  const handle = normalizeHandle(raw);
  if (!handle) return { ok: false, error: "empty" };
  if (handle.length < HANDLE_MIN) return { ok: false, error: "too_short" };
  if (handle.length > HANDLE_MAX) return { ok: false, error: "too_long" };
  if (!HANDLE_RE.test(handle)) return { ok: false, error: "invalid" };
  if (RESERVED.has(handle)) return { ok: false, error: "reserved" };
  return { ok: true, handle };
}

export function handleValidationMessage(error: HandleValidationError): string {
  switch (error) {
    case "empty":
      return "Informe um nome de usuário.";
    case "too_short":
      return `Use pelo menos ${HANDLE_MIN} caracteres.`;
    case "too_long":
      return `Use no máximo ${HANDLE_MAX} caracteres.`;
    case "invalid":
      return "Use só letras minúsculas, números e hífen (sem começar/terminar com hífen).";
    case "reserved":
      return "Esse nome está reservado. Escolha outro.";
  }
}

/** Firebase UIDs costumam ter ~28 chars; slugs têm no máx. 20. */
export function looksLikeFirebaseUid(value: string): boolean {
  return /^[A-Za-z0-9]{20,128}$/.test(value);
}

export function profilePathFor(handleOrUid: string): string {
  return `/u/${handleOrUid}`;
}
