import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { HubSplitWorkspaceScreen, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import type { AppScreen } from "../lib/screens";
import { LdpTabHeader } from "./LdpTabHeader";

type Props = {
  screen: AppScreen;
  title: string;
  titleIcon: LucideIcon;
  titleEmojiGlyph: string;
  titleIconClass: string;
  centerStats?: TabHeaderStatItem[];
  /** LdpHeaderActions — Notify · Log · Settings. */
  headerActions: ReactNode;
  children: ReactNode;
};

/** Split-workspace chrome (P0024 PlacesHubChrome / P0003 ProfilesHubChrome golden) — header lives in HubTabChrome. */
export function LdpHubChrome({ screen: _screen, title, titleIcon, titleEmojiGlyph, titleIconClass, centerStats, headerActions, children }: Props) {
  return (
    <HubSplitWorkspaceScreen
      bodyClassName="ldp-workspace__body flex min-h-0 flex-1 overflow-hidden"
      header={
        <LdpTabHeader
          ariaLabel={`${title} directory header`}
          title={title}
          titleIcon={titleIcon}
          titleEmojiGlyph={titleEmojiGlyph}
          titleIconClass={titleIconClass}
          centerStats={centerStats}
          actions={headerActions}
        />
      }
      sectionRuleLabel={title}
    >
      {children}
    </HubSplitWorkspaceScreen>
  );
}
