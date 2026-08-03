import { HubTocSectionNav, type HubTocNavItem } from "@tool-workspace/hub-ui";
import { OVERVIEW_TOC } from "./overview-toc";

type Props = {
  idPrefix?: string;
  scrollRootSelector?: string;
};

export function OverviewTocNav({ idPrefix = "", scrollRootSelector = ".hub-main" }: Props) {
  const items: HubTocNavItem[] = OVERVIEW_TOC.map((item) => ({
    id: item.id,
    label: item.label,
    emoji: item.emoji,
  }));

  return (
    <div className="overview-toc-nav relative z-10 w-[var(--overview-toc-w)] shrink-0 rounded-2xl border border-indigo-300/10 bg-[var(--panel)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)] ring-1 ring-white/[.025]">
      <HubTocSectionNav items={items} sectionIdPrefix={idPrefix} scrollRootSelector={scrollRootSelector} />
    </div>
  );
}
