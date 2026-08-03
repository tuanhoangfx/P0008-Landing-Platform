import { canonicalLoginId, looksLikeEmail, sanitizeHubLoginInput } from "./hub-login";

export type FetchResolvedHubAuthEmailsOptions = {
  /** Same-origin Tool Hub API — default `/api/hub/auth/resolve-login`. */
  resolveLoginApiUrl?: string;
};

/** Map User ID → real auth.users email via Hub profiles (server-side API). */
export async function fetchResolvedHubAuthEmails(
  loginInput: string,
  options: FetchResolvedHubAuthEmailsOptions = {},
): Promise<string[]> {
  const login = sanitizeHubLoginInput(loginInput);
  if (!login || looksLikeEmail(login)) return [];
  const loginId = canonicalLoginId(login);
  if (!loginId) return [];

  const apiUrl = options.resolveLoginApiUrl ?? "/api/hub/auth/resolve-login";
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId }),
    });
    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; authEmails?: string[] }
      | null;
    const emails = Array.isArray(payload?.authEmails) ? payload.authEmails : [];
    return emails
      .map((email) => String(email ?? "").trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return [];
  }
}
