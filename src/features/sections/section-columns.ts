import {
  applyStandardDirectoryColumnHints,
  createDirectoryColumnMetaHelpers,
  type DirectoryDefaultSortRow,
} from "@tool-workspace/hub-ui";
import { createLdpTablePrefs } from "../../lib/ldp-table-prefs";

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

/** One value per column, single-line cells (p00xx-directory-table body cell contract). */
export const SECTION_COLUMN_META = applyStandardDirectoryColumnHints(
  {
    name: col("Name", "hub-users-col--ldp-section-name", "name", "col.directory.name", "11rem", { headerEmoji: "🏷️" }),
    title: col("Title", "hub-users-col--ldp-section-title", "name", "col.directory.notes", "14rem", { headerEmoji: "📝" }),
    group: col("Group", "hub-users-col--ldp-section-group", "category", "col.directory.category", "8.5rem", { headerEmoji: "🗂️" }),
    usedIn: col("Used in", "hub-users-col--ldp-section-used", "path", "col.directory.pages", "13rem", { headerEmoji: "📄" }),
    blocks: col("Blocks", "hub-users-col--ldp-section-blocks", "kind", "col.directory.code", "9rem", { headerEmoji: "🧱" }),
    keys: col("Keys", "hub-users-col--ldp-section-keys", "lines", "col.directory.number", "9rem", { headerEmoji: "🔑", enableFit: false }),
  },
  {
    name: "Folder name under sections/ — the id used in <!--@section name--> markers.",
    title: "section.json title (authored copy).",
    group: "section.json group — library grouping.",
    usedIn: "Template pages that place this section (read from the page files).",
    blocks: "Engine blocks the section calls (<!--@block-->), rendered by engine/render.mjs.",
    keys: "{{c.*}} copy tokens the section reads from content/landing.json.",
  },
);

export const SECTION_HUB_COLUMN_META = toHubDirectoryColumnMeta(SECTION_COLUMN_META);

export type SectionColumnKey = keyof typeof SECTION_COLUMN_META;

export const SECTION_TABLE_PREFS = createLdpTablePrefs<SectionColumnKey>("sections", [
  { key: "name", label: "Name", emoji: "🏷️", required: true },
  { key: "title", label: "Title", emoji: "📝" },
  { key: "group", label: "Group", emoji: "🗂️" },
  { key: "usedIn", label: "Used in", emoji: "📄" },
  { key: "blocks", label: "Blocks", emoji: "🧱" },
  { key: "keys", label: "Keys", emoji: "🔑" },
]);

export const SECTION_SORT_ROWS: DirectoryDefaultSortRow[] = [
  { id: "group", label: "Group", directionHint: "A → Z" },
];
