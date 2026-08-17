/**
 * P0008 Landing Platform version clock — hub-ui `resolveHubProductVersionMeta` SSOT
 * (card: hub-version-clock-ssot).
 */
import {
  formatTabHeaderTimestamp,
  resolveHubProductVersionMeta,
  type AppVersionReleaseMeta,
  type ToolManifestReleaseSlice,
} from "@tool-workspace/hub-ui";
import { APP_VERSION } from "./app-meta";
import toolManifest from "../../tool.manifest.json";

function readBuiltAtIso(): string | undefined {
  const raw = import.meta.env.VITE_APP_BUILT_AT;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

export function landingHostVersionMeta() {
  return resolveHubProductVersionMeta({
    appVersion: APP_VERSION,
    releaseNotesCode: "P0008",
    manifest: toolManifest as ToolManifestReleaseSlice,
    builtAtIso: readBuiltAtIso(),
  });
}

/** HUB_SHELL_SCAFFOLD — thin re-export; logic lives in hub-ui SSOT. */
export function resolveAppVersionReleaseMetaFromManifest(): AppVersionReleaseMeta {
  const meta = landingHostVersionMeta();
  return {
    shortLabel: meta.publishedAt ? formatTabHeaderTimestamp(meta.publishedAt) : "—",
    live: meta.live,
    publishedAt: meta.publishedAt,
  };
}
