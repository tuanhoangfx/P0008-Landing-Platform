import {
  DIRECTORY_CELL_TRUNCATE,
  DirectoryTableBodyCell,
  HubDirectorySearchHighlightText,
  type HubDirectoryColumnDef,
} from "@tool-workspace/hub-ui";
import type { CatalogSection } from "../../lib/catalog";
import { sectionGroupEmoji, sectionGroupLabel } from "../../lib/section-groups";
import type { SectionColumnKey } from "./section-columns";

function Text({ text, terms, className }: { text: string; terms: readonly string[]; className: string }) {
  return (
    <span className={`${DIRECTORY_CELL_TRUNCATE} ${className}`}>
      {text && terms.length ? <HubDirectorySearchHighlightText text={text} terms={[...terms]} /> : text || "—"}
    </span>
  );
}

/** Table body — one truncated line per column (no stacked subtitles, no body hover tooltips). */
export function renderSectionCell(col: HubDirectoryColumnDef<SectionColumnKey>, row: CatalogSection, terms: readonly string[]) {
  const { key, colClass } = col;
  switch (key) {
    case "name":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <Text text={row.name} terms={terms} className="hub-users-name-title" />
        </DirectoryTableBodyCell>
      );
    case "title":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <Text text={row.title} terms={terms} className="hub-users-directory-body-text" />
        </DirectoryTableBodyCell>
      );
    case "group":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-directory-body-text`}>
            {sectionGroupEmoji(row.group)} {sectionGroupLabel(row.group)}
          </span>
        </DirectoryTableBodyCell>
      );
    case "usedIn":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-directory-body-text`}>
            {row.usedIn.length ? row.usedIn.map((p) => p.split("/").slice(1).join("/")).join(" · ") : "— not used"}
          </span>
        </DirectoryTableBodyCell>
      );
    case "blocks":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-cell-muted font-mono`}>
            {row.blocks.length ? row.blocks.join(", ") : "—"}
          </span>
        </DirectoryTableBodyCell>
      );
    case "keys":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-cell-num`}>{row.tokens.length}</span>
        </DirectoryTableBodyCell>
      );
    default:
      return null;
  }
}
