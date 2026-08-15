import type { ReactNode } from "react";
import {
  HubListChromeHeader,
  buildConsoleVersionMetaItems,
  flatMapNavScreenItems,
  navBadgeIconClass,
  type TabHeaderStatItem,
} from "@tool-workspace/hub-ui";
import { APP_VERSION } from "../lib/app-meta";
import toolManifest from "../../tool.manifest.json";
import { NAV_STRUCTURE } from "../lib/nav-structure";
import { SCREEN_LABELS, type AppScreen } from "../lib/app-screen";

const NAV_ITEMS = flatMapNavScreenItems(NAV_STRUCTURE);

type Props = {
  screen: AppScreen;
  actions?: ReactNode;
  centerStats?: TabHeaderStatItem[];
};

/** HUB_SHELL_SCAFFOLD — directory tab header (HubListChromeHeader + version meta). */
export function ConsoleTabHeader({ screen, actions, centerStats = [] }: Props) {
  const nav = NAV_ITEMS.find((n) => n.screen === screen);
  const TitleIcon = nav?.icon ?? NAV_ITEMS[0]?.icon;

  return (
    <HubListChromeHeader
      ariaLabel={SCREEN_LABELS[screen]}
      titleIcon={TitleIcon}
      titleIconClass={nav?.iconTone ? navBadgeIconClass(nav.iconTone) : "text-indigo-300"}
      title={SCREEN_LABELS[screen]}
      metaItems={buildConsoleVersionMetaItems(APP_VERSION, toolManifest)}
      versionReleaseNotesCode="P0008"
      centerStats={centerStats}
      actions={actions}
    />
  );
}
