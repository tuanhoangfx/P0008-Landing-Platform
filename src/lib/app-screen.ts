/** Admin console routes — SSOT for sidebar + URL. */
export type AppScreen = "overview" | "pages" | "templates";

export const SCREEN_LABELS: Record<AppScreen, string> = {
  overview: "Overview",
  pages: "Pages",
  templates: "Templates",
};

export const DEFAULT_APP_SCREEN: AppScreen = "pages";

export function readAppScreen(): AppScreen {
  if (typeof window === "undefined") return DEFAULT_APP_SCREEN;
  const seg = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/")[0]?.toLowerCase();
  if (seg === "templates") return "templates";
  if (seg === "pages") return "pages";
  if (seg === "overview") return "overview";
  if (!seg) return "overview";
  return DEFAULT_APP_SCREEN;
}

export function appScreenPath(screen: AppScreen): string {
  if (screen === "overview") return "/";
  return `/${screen}`;
}

export function writeAppScreen(screen: AppScreen, replace = false) {
  const path = appScreenPath(screen);
  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}
