import { DirectoryTableBodyCell, type HubDirectoryColumnDef } from "@tool-workspace/hub-ui";
import type { TemplateDirectoryRow, TemplateTableColumnKey } from "./template-column-meta";

export function templateSortableValue(row: TemplateDirectoryRow, key: TemplateTableColumnKey): string | number {
  if (key === "pageCount") return row.pageCount;
  return String(row[key] ?? "");
}

export function renderTemplateDirectoryBodyCell(
  col: HubDirectoryColumnDef<TemplateTableColumnKey>,
  row: TemplateDirectoryRow,
) {
  const { key, colClass } = col;
  const cc = colClass ?? "";

  switch (key) {
    case "templateId":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.templateId}
        </DirectoryTableBodyCell>
      );
    case "description":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.description}
        </DirectoryTableBodyCell>
      );
    case "pageCount":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.pageCount}
        </DirectoryTableBodyCell>
      );
    case "status":
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          {row.status}
        </DirectoryTableBodyCell>
      );
    default:
      return (
        <DirectoryTableBodyCell key={key} colClass={cc}>
          —
        </DirectoryTableBodyCell>
      );
  }
}
