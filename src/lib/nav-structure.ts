import type { NavStructureEntry } from "@tool-workspace/hub-ui";
import { Files, Gauge, Layers } from "lucide-react";
import type { AppScreen } from "./app-screen";

export const NAV_SUBNAV_PREFIX = "p0008";

export const NAV_GROUP_IDS = [] as const;

export const NAV_STRUCTURE: NavStructureEntry<AppScreen, (typeof NAV_GROUP_IDS)[number]>[] = [
  { kind: "screen", screen: "overview", label: "Overview", icon: Gauge, iconTone: "sky" },
  { kind: "screen", screen: "pages", label: "Pages", icon: Files, iconTone: "emerald" },
  { kind: "screen", screen: "templates", label: "Templates", icon: Layers, iconTone: "violet" },
];
