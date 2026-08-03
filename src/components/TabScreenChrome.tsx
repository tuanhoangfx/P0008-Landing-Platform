import type { ReactNode } from "react";
import { HubTabChrome, HubTabScreenBody, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import { ConsoleTabHeader } from "./ConsoleTabHeader";
import type { AppScreen } from "../lib/app-screen";

type Props = {
  screen: AppScreen;
  actions?: ReactNode;
  centerStats?: TabHeaderStatItem[];
  filterBar?: ReactNode;
  children: ReactNode;
};

/** HUB_SHELL_SCAFFOLD — HubTabChrome + HubTabScreenBody (P0024 PlacesTabScreen parity). */
export function TabScreenChrome({ screen, actions, centerStats, filterBar, children }: Props) {
  return (
    <HubTabChrome
      header={<ConsoleTabHeader screen={screen} actions={actions} centerStats={centerStats} />}
      filterBar={filterBar}
    >
      <HubTabScreenBody>{children}</HubTabScreenBody>
    </HubTabChrome>
  );
}
