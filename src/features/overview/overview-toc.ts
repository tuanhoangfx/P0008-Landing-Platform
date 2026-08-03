export type OverviewTocItem = {
  id: string;
  label: string;
  emoji: string;
};

/** document-toc SSOT — left TOC anchors (P0024 / P0004 overview golden). */
export const OVERVIEW_TOC: readonly OverviewTocItem[] = [
  { id: "architecture", label: "Architecture", emoji: "1" },
  { id: "quick-links", label: "Quick links", emoji: "2" },
] as const;
