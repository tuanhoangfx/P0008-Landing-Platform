import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { HubListChromeHeader, buildConsoleVersionMetaItems, type TabHeaderStatItem } from "@tool-workspace/hub-ui";
import toolManifest from "../../tool.manifest.json";
import { APP_VERSION } from "../lib/app-meta";
import { readBuiltAtIso } from "../lib/app-release";

type Props = {
  ariaLabel: string;
  title: string;
  titleIcon: LucideIcon;
  titleEmojiGlyph?: string;
  titleIconClass?: string;
  centerStats?: TabHeaderStatItem[];
  actions?: ReactNode;
};

/** Tab header — title · `vX.Y.Z · age` · Session (left) · stats (center) · Notify · Log · Settings (right). */
export function LdpTabHeader({
  ariaLabel,
  title,
  titleIcon,
  titleEmojiGlyph,
  titleIconClass = "text-sky-300",
  centerStats = [],
  actions,
}: Props) {
  return (
    <HubListChromeHeader
      ariaLabel={ariaLabel}
      title={title}
      titleIcon={titleIcon}
      titleEmojiGlyph={titleEmojiGlyph}
      titleIconClass={titleIconClass}
      metaItems={buildConsoleVersionMetaItems(APP_VERSION, toolManifest, { builtAtIso: readBuiltAtIso() })}
      versionReleaseNotesCode="P0008"
      centerStats={centerStats}
      actions={actions}
    />
  );
}
