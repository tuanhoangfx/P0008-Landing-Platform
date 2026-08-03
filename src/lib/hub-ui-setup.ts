import { configureHubChromePrefs } from "@tool-workspace/hub-ui";
import { readHubListPrefs } from "./url-prefs";

/** HUB_SHELL_SCAFFOLD — extend with configureFilterIcons / configureChartLegend when directory tabs exist. */
export function setupHubUi() {
  configureHubChromePrefs(() => ({
    headerPin: readHubListPrefs().headerPin,
    searchPin: readHubListPrefs().searchPin,
  }));
}
