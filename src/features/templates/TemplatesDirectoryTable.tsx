/** table-only-directory body-only-directory — FilterBar on HubDirectoryScreen parent. */
import { useMemo } from "react";
import {
  HubDirectoryTableShell,
  buildDirectoryColgroup,
  buildDirectoryColgroupForShell,
  buildDirectoryColumns,
  hubDirectoryTableClass,
  useHubTablePageSize,
  type HubSortDir,
} from "@tool-workspace/hub-ui";
import {
  TEMPLATE_HUB_COLUMN_META,
  TEMPLATE_TABLE_COLUMN_KEYS,
  type TemplateDirectoryRow,
  type TemplateTableColumnKey,
} from "./template-column-meta";
import { renderTemplateDirectoryBodyCell } from "./templates-directory-cells";

void buildDirectoryColgroup([]);

type Props = {
  rows: TemplateDirectoryRow[];
  sortKey: TemplateTableColumnKey;
  sortDir: HubSortDir;
  onSort: (key: TemplateTableColumnKey) => void;
  resetKey?: string | number | boolean | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  pageSize?: number;
};

export function TemplatesDirectoryTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  resetKey,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected,
  pageSize = 25,
}: Props) {
  const resolvedPageSize = useHubTablePageSize(pageSize);
  const columns = useMemo(() => buildDirectoryColumns(TEMPLATE_TABLE_COLUMN_KEYS, TEMPLATE_HUB_COLUMN_META), []);
  const colgroup = useMemo(() => buildDirectoryColgroupForShell(columns, { showSelect: true }), [columns]);

  return (
    <HubDirectoryTableShell
      items={rows}
      ariaLabel="Landing templates directory"
      tableClassName={`${hubDirectoryTableClass("6")} p0008-templates-directory-table`}
      colgroup={colgroup}
      columns={columns}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(row) => row.templateId}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onToggleSelectAll={onToggleSelectAll}
      allVisibleSelected={allVisibleSelected}
      selectAllLabel="Select all visible templates"
      emptyMessage="No templates registered."
      pageSize={resolvedPageSize}
      resetKey={resetKey}
      renderRowCells={(row) => (
        <>{columns.map((col) => renderTemplateDirectoryBodyCell(col, row))}</>
      )}
    />
  );
}
