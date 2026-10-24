import { HubHeaderOpsPanels } from "@tool-workspace/hub-ui";
import { useLdpNotify } from "../lib/ldp-notify";
import type { AppScreen } from "../lib/screens";
import { LdpDisplayPrefs } from "./LdpDisplayPrefs";

/** Header ops ONLY: Notify · Log · Settings (hub-header-footer-chrome SSOT). No domain CTA here. */
export function LdpHeaderActions({ screen }: { screen: AppScreen }) {
  const notify = useLdpNotify();
  return (
    <HubHeaderOpsPanels
      notify={notify}
      log={{ variant: "tab" }}
      trailing={<LdpDisplayPrefs screen={screen} scope="tab" />}
    />
  );
}
