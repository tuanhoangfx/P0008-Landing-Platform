/**
 * P0008 version clock — hub-ui `resolveHubProductVersionMeta` SSOT (card: hub-version-clock-ssot).
 */
import { resolveHubProductVersionMeta, type ToolManifestReleaseSlice } from "@tool-workspace/hub-ui";
import toolManifest from "../../tool.manifest.json";
import { APP_VERSION, LDP_PRODUCT } from "./app-meta";

export function readBuiltAtIso(): string | undefined {
  const raw = import.meta.env.VITE_APP_BUILT_AT;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

export function ldpHostVersionMeta() {
  return resolveHubProductVersionMeta({
    appVersion: APP_VERSION,
    releaseNotesCode: LDP_PRODUCT.code,
    manifest: toolManifest as ToolManifestReleaseSlice,
    builtAtIso: readBuiltAtIso(),
  });
}

export function resolveAppVersionReleaseMeta() {
  const meta = ldpHostVersionMeta();
  return { publishedAt: meta.publishedAt, live: meta.live };
}
