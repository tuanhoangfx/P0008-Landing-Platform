import { resolveHubToolIconSrcForVite } from "@tool-workspace/hub-ui";
import packageJson from "../../package.json";
import toolManifest from "../../tool.manifest.json";

/** Product release label (package.json = tool.manifest.json release.version). */
export const APP_VERSION = packageJson.version;

export const LDP_PRODUCT = {
  code: toolManifest.code,
  name: toolManifest.name,
} as const;

export const LDP_BRAND_ICON = resolveHubToolIconSrcForVite(LDP_PRODUCT.code);
