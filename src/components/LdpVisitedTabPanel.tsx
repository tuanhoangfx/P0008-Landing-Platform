import type { ReactNode } from "react";
import { HubVisitedTabPanel } from "@tool-workspace/hub-ui";
import type { AppScreen } from "../lib/screens";

type Props = {
  tabId: AppScreen;
  active: boolean;
  visited: ReadonlySet<AppScreen>;
  children: ReactNode;
};

/** Keep-mounted tab panel on first visit — search / filters / selected row survive a tab switch. */
export function LdpVisitedTabPanel({ tabId, active, visited, children }: Props) {
  return (
    <HubVisitedTabPanel
      tabId={tabId}
      active={active}
      visited={visited}
      mountMode="visited"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      dataScreen={tabId}
    >
      {children}
    </HubVisitedTabPanel>
  );
}
