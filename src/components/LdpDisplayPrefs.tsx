import {
  HubDisplayPrefs,
  patchHubListPrefs,
  readHubListPrefsCore,
  type HubDisplayPrefsProps,
} from "@tool-workspace/hub-ui";
import type { AppScreen } from "../lib/screens";

type Props = {
  screen: AppScreen;
  sidebarRow?: boolean;
  scope?: HubDisplayPrefsProps["scope"];
};

/**
 * Settings — P0022/P0005 parity:
 * - global (sidebar footer): Display (zoom · pin header · pin search) + keyboard shortcuts
 * - tab (header): same modal scoped to the active screen
 * KPI / filters / columns / rows per page live in the searchbar Display band (`HubDirectoryDisplayPanel`).
 */
export function LdpDisplayPrefs({ screen, sidebarRow = false, scope = "tab" }: Props) {
  return (
    <HubDisplayPrefs
      title="Settings"
      scope={scope}
      sidebarRow={sidebarRow}
      showRange={false}
      showLimit={false}
      showPageSize={false}
      showHeaderPin={scope === "global"}
      filters={[]}
      defaultFilterKeys={new Set()}
      filtersFromUrl={false}
      readPrefs={readHubListPrefsCore}
      patchPrefs={(patch) => patchHubListPrefs(patch)}
      getScreen={() => screen}
      getSubTab={() => ""}
    />
  );
}
