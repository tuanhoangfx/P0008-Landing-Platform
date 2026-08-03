import { HubHeaderOpsPanels } from "@tool-workspace/hub-ui";
import { useEffect, useState } from "react";
import { readAppScreen, type AppScreen } from "../lib/app-screen";
import { SCREEN_DISPLAY_PREFS } from "../lib/display-prefs-registry";
import { DisplayPrefs } from "./DisplayPrefs";

/** HUB_SHELL_SCAFFOLD — P0004/P0006 golden header ops (Log · Settings). */
export function TabHeaderActions() {
  const [screen, setScreen] = useState<AppScreen>(() => readAppScreen());

  useEffect(() => {
    const sync = () => setScreen(readAppScreen());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const hasTabSettings = Boolean(SCREEN_DISPLAY_PREFS[screen]);

  return (
    <HubHeaderOpsPanels
      log={{ variant: "tab", emptyMessage: "No actions logged in this session yet." }}
      trailing={hasTabSettings ? <DisplayPrefs scope="tab" screen={screen} /> : null}
    />
  );
}
