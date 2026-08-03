import type { AppScreen } from "./app-screen";

/** HUB_SHELL_SCAFFOLD — per-tab Display panel config; extend when adding directory tabs. */
export const SCREEN_DISPLAY_PREFS: Partial<
  Record<
    AppScreen,
    {
      kpis: string[];
      charts: string[];
      filters: string[];
      headerStats: string[];
      defaultKpiKeys?: string[];
      defaultChartKeys?: string[];
      defaultFilterKeys?: string[];
      defaultHeaderStatKeys?: string[];
    }
  >
> = {};
