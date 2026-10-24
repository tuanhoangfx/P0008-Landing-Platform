/**
 * Query-string routes — every screen is `/index.html` so the nginx `staticSite` block
 * (`try_files $uri $uri/index.html $uri/ =404`) serves the app without an SPA fallback.
 */
export type AppScreen = "templates" | "sections" | "sites" | "system";

export const APP_SCREENS: readonly AppScreen[] = ["templates", "sections", "sites", "system"];
export const DEFAULT_SCREEN: AppScreen = "sections";

export function readScreenFromUrl(): AppScreen {
  const value = new URL(window.location.href).searchParams.get("screen");
  return APP_SCREENS.includes(value as AppScreen) ? (value as AppScreen) : DEFAULT_SCREEN;
}

/** Selected row id per screen (`?id=`) — deep link to a section / template / site. */
export function readSelectedIdFromUrl(): string | null {
  return new URL(window.location.href).searchParams.get("id");
}

export function writeScreenToUrl(screen: AppScreen, mode: "push" | "replace" = "replace") {
  const url = new URL(window.location.href);
  if (url.searchParams.get("screen") === screen) return;
  url.searchParams.set("screen", screen);
  url.searchParams.delete("id");
  if (mode === "push") window.history.pushState({ screen }, "", url);
  else window.history.replaceState({ screen }, "", url);
}

export function writeSelectedIdToUrl(id: string | null) {
  const url = new URL(window.location.href);
  if ((url.searchParams.get("id") ?? null) === id) return;
  if (id) url.searchParams.set("id", id);
  else url.searchParams.delete("id");
  window.history.replaceState(window.history.state, "", url);
}
