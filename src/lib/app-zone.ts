export type AppZone = "admin" | "public";

/** Paths reserved for admin/API — never treated as public page codes. */
export const RESERVED_PATH_SEGMENTS = new Set([
  "api",
  "preview",
  "templates",
  "pages",
  "admin",
  "assets",
]);

/** Public landing pages use numeric path codes: /001, /002, … */
export const PAGE_CODE_PATTERN = /^\d{3,4}$/;

export function readAppZone(): AppZone {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const first = path.split("/").filter(Boolean)[0] ?? "";
  if (!first || RESERVED_PATH_SEGMENTS.has(first)) return "admin";
  if (PAGE_CODE_PATTERN.test(first)) return "public";
  return "admin";
}

export function readPageCode(): string | null {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  const first = path.split("/")[0] ?? "";
  if (PAGE_CODE_PATTERN.test(first)) return first;
  return null;
}

export function publicPageUrl(pathCode: string): string {
  return `/${pathCode}`;
}
