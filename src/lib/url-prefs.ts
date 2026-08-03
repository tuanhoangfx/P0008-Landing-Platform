import { patchHubListPrefs, readHubListPrefsCore } from "@tool-workspace/hub-ui";

export function readHubListPrefs() {
  return readHubListPrefsCore();
}

export { patchHubListPrefs };
