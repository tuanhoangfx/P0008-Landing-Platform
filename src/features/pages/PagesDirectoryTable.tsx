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
import type { LandingPageRecord } from "@/config/pages-registry";
import {
  PAGE_HUB_COLUMN_META,
  PAGE_TABLE_COLUMN_KEYS,
  type PageTableColumnKey,
} from "./page-column-meta";
import { renderPageDirectoryBodyCell } from "./pages-directory-cells";

void buildDirectoryColgroup([]);

type Props = {
  rows: LandingPageRecord[];
  sortKey: PageTableColumnKey;
  sortDir: HubSortDir;
  onSort: (key: PageTableColumnKey) => void;
  resetKey?: string | number | boolean | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  pageSize?: number;
  onRowClick?: (row: LandingPageRecord) => void;
};

export function PagesDirectoryTable({
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
  onRowClick,
}: Props) {
  const resolvedPageSize = useHubTablePageSize(pageSize);
  const columns = useMemo(() => buildDirectoryColumns(PAGE_TABLE_COLUMN_KEYS, PAGE_HUB_COLUMN_META), []);
  const colgroup = useMemo(() => buildDirectoryColgroupForShell(columns, { showSelect: true }), [columns]);

  return (
    <HubDirectoryTableShell
      items={rows}
      ariaLabel="Landing pages directory"
      tableClassName={`${hubDirectoryTableClass("6")} p0008-pages-directory-table`}
      colgroup={colgroup}
      columns={columns}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(row) => row.pathCode}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onToggleSelectAll={onToggleSelectAll}
      allVisibleSelected={allVisibleSelected}
      selectAllLabel="Select all visible pages"
      emptyMessage="No landing pages yet — add entries to pages-registry.ts or Supabase plane."
      pageSize={resolvedPageSize}
      resetKey={resetKey}
      onRowClick={onRowClick}
      renderRowCells={(row) => (
        <>{columns.map((col) => renderPageDirectoryBodyCell(col, row))}</>
      )}
    />
  );
}
