/**
 * Display prefs — per-screen KPI / filter visibility (HubDirectoryDisplayPanel `subTabDisplay` adapter),
 * so toggling a KPI on Sections never hides the Templates band. Stored per browser (localStorage).
 */
import { useEffect, useState } from "react";
import type { SubTabDisplayConfig, SystemDisplayAdapter } from "@tool-workspace/hub-ui";
import type { AppScreen } from "./screens";

export const P0008_DISPLAY_CHANGE = "p0008:display-change";
const STORAGE_PREFIX = "p0008:display:v1:";

type Stored = { kpi?: string[] | null; charts?: string[] | null; filters?: string[] | null };

function readStored(tab: string): Stored {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + tab) ?? "{}") as Stored;
  } catch {
    return {};
  }
}

const toSet = (v: string[] | null | undefined) => (Array.isArray(v) ? new Set(v) : null);

export const P0008_SUBTAB_DISPLAY: SubTabDisplayConfig = {
  screens: ["templates", "sections", "sites"],
  changeEvent: P0008_DISPLAY_CHANGE,
  logScope: (tab) => `Display / ${tab}`,
  adapter: {
    read(tab): ReturnType<SystemDisplayAdapter["read"]> {
      const s = readStored(tab);
      return { kpi: toSet(s.kpi), charts: toSet(s.charts), filters: toSet(s.filters) };
    },
    patch(tab, patch) {
      const next = { ...readStored(tab), ...patch };
      try {
        window.localStorage.setItem(STORAGE_PREFIX + tab, JSON.stringify(next));
      } catch {
        /* private mode — prefs stay session-only */
      }
    },
    reset(tab) {
      try {
        window.localStorage.removeItem(STORAGE_PREFIX + tab);
      } catch {
        /* ignore */
      }
    },
  },
};

export type PrefItem = { key: string; label: string };

/** Visible keys for one screen — stored set, or defaults when never toggled. */
export function useScreenDisplaySet(
  screen: AppScreen,
  field: "kpi" | "filters",
  defaults: ReadonlySet<string>,
): ReadonlySet<string> {
  const read = () => P0008_SUBTAB_DISPLAY.adapter.read(screen)?.[field] ?? null;
  const [stored, setStored] = useState<Set<string> | null>(read);
  useEffect(() => {
    const sync = () => setStored(read());
    window.addEventListener(P0008_DISPLAY_CHANGE, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(P0008_DISPLAY_CHANGE, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- screen/field are static per mount
  }, []);
  return stored ?? defaults;
}
