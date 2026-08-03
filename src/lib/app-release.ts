import {
  resolveAppVersionReleaseMeta,
  type ToolManifestReleaseSlice,
} from "@tool-workspace/hub-ui";
import { APP_VERSION } from "./app-meta";
import toolManifest from "../../tool.manifest.json";

/** HUB_SHELL_SCAFFOLD — thin re-export; logic lives in hub-ui SSOT. */
export function resolveAppVersionReleaseMetaFromManifest(): ReturnType<typeof resolveAppVersionReleaseMeta> {
  return resolveAppVersionReleaseMeta({
    appVersion: APP_VERSION,
    manifest: toolManifest as ToolManifestReleaseSlice,
    builtAtIso: typeof import.meta.env.VITE_APP_BUILT_AT === "string" ? import.meta.env.VITE_APP_BUILT_AT : undefined,
  });
}
