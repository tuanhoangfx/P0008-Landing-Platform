import {
  HubDisplayPrefs,
  readHubListPrefsCore,
  type HubDisplayPrefsProps,
} from "@tool-workspace/hub-ui";
import { patchHubListPrefs, readHubListPrefs } from "../lib/url-prefs";
import type { AppScreen } from "../lib/app-screen";

type Props = {
  scope?: HubDisplayPrefsProps["scope"];
  screen?: AppScreen;
  sidebarRow?: boolean;
};

/** HUB_SHELL_SCAFFOLD — wire tab/global display prefs; extend with registry keys. */
export function DisplayPrefs({ scope = "tab", screen, sidebarRow }: Props) {
  return (
    <HubDisplayPrefs
      title="Settings"
      scope={scope}
      sidebarRow={sidebarRow}
      showRange={false}
      showLimit={false}
      showNavToggle={false}
      readPrefs={scope === "global" ? readHubListPrefsCore : readHubListPrefs}
      patchPrefs={patchHubListPrefs}
      getScreen={() => screen ?? "overview"}
      getSubTab={() => ""}
    />
  );
}
