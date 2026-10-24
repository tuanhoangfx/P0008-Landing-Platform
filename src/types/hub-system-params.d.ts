/** Build-time System snapshot from hubAppVersionPlugin (Tool/scripts/lib/hub-system-params.mjs). */
declare module "virtual:hub-system-params" {
  import type { HubSystemParams } from "@tool-workspace/hub-ui/shell/hub-system-params";

  const params: HubSystemParams;
  export default params;
}
