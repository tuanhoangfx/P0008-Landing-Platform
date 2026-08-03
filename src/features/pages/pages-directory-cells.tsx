import type { LandingPageRecord } from "@/config/pages-registry";
import { DirectoryTableBodyCell, type HubDirectoryColumnDef } from "@tool-workspace/hub-ui";
import type { PageTableColumnKey } from "./page-column-meta";
import { publicPageUrl } from "@/lib/app-zone";

export function pageSortableValue(row: LandingPageRecord, key: PageTableColumnKey): string {
  if (key === "publicUrl") return publicPageUrl(row.pathCode);
  return String(row[key] ?? "");
}

export function renderPageDirectoryBodyCell(
  col: HubDirectoryColumnDef<PageTableColumnKey>,
  row: LandingPageRecord,
) {
  const { key, colClass } = col;
  const cc = colClass ?? "";

  switch (key) {
    case "pathCode":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          /{row.pathCode}
        </DirectoryTableBodyCell>
      );
    case "title":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.title}
        </DirectoryTableBodyCell>
      );
    case "templateId":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.templateId}
        </DirectoryTableBodyCell>
      );
    case "brandId":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.brandId}
        </DirectoryTableBodyCell>
      );
    case "status":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.status}
        </DirectoryTableBodyCell>
      );
    case "publicUrl": {
      const href = publicPageUrl(row.pathCode);
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          <a className="text-sky-300 underline" href={href} target="_blank" rel="noreferrer">
            {href}
          </a>
        </DirectoryTableBodyCell>
      );
    }
    default:
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          —
        </DirectoryTableBodyCell>
      );
  }
}
