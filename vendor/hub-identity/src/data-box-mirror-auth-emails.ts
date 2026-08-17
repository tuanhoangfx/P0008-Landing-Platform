/**
 * Data Box mirror auth emails — one Hub identity, one preferred Data Box login.
 * Prefer username-derived `@infix1` / legacy rows before opaque `@auth.infi.internal`
 * so dual sign-in does not create a second orphan auth user.
 */
import {
  hubAuthEmailFromLogin,
  HUB_ID_EMAIL_LEGACY_DOMAIN,
  isHubOpaqueAuthEmail,
  looksLikeEmail,
  sanitizeHubLoginInput,
} from "./hub-login";

export function resolveDataBoxMirrorAuthEmails(opts: {
  /** Hub GoTrue email after successful identity sign-in (often opaque). */
  mirrorEmail?: string | null;
  loginInput: string;
}): string[] {
  const login = sanitizeHubLoginInput(opts.loginInput);
  const mirror = String(opts.mirrorEmail ?? "").trim().toLowerCase();
  const primary = mirror || (login ? hubAuthEmailFromLogin(login) : "");
  const out: string[] = [];
  const push = (value: string) => {
    const next = String(value ?? "").trim().toLowerCase();
    if (!next || !next.includes("@") || out.includes(next)) return;
    out.push(next);
  };

  const synthetics: string[] = [];
  if (login && !looksLikeEmail(login)) {
    synthetics.push(hubAuthEmailFromLogin(login));
    synthetics.push(`${login.toLowerCase()}${HUB_ID_EMAIL_LEGACY_DOMAIN}`);
  }

  if (primary && isHubOpaqueAuthEmail(primary)) {
    for (const email of synthetics) push(email);
    push(primary);
    return out;
  }

  push(primary);
  for (const email of synthetics) push(email);
  return out;
}
