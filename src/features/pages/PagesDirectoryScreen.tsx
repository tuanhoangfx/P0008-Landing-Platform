/* table-only-directory */
import { useMemo, useState } from "react";
import {
  DIRECTORY_SEARCH_CLIENT_FILTER_OPTS,
  HubDirectoryBulkActionBar,
  HubDirectoryScreen,
  hubDirectoryListResetKey,
  useDirectoryHaystackFilter,
  useDirectorySearchQuery,
  useDirectoryTableSort,
  useHubDirectorySelection,
  useHubTablePageSize,
  type FilterValues,
  type KpiTileData,
} from "@tool-workspace/hub-ui";
import { LANDING_PAGES, type LandingPageRecord } from "@/config/pages-registry";
import { ConsoleTabHeader } from "@/components/ConsoleTabHeader";
import { TabHeaderActions } from "@/components/TabHeaderActions";
import { PagesDirectoryTable } from "./PagesDirectoryTable";
import type { PageTableColumnKey } from "./page-column-meta";
import { pageSortableValue } from "./pages-directory-cells";

function pageHaystack(row: LandingPageRecord): string {
  return [row.pathCode, row.title, row.templateId, row.brandId, row.status].join(" ").toLowerCase();
}

export function PagesDirectoryScreen() {
  const rows = LANDING_PAGES;
  const search = useDirectorySearchQuery(DIRECTORY_SEARCH_CLIENT_FILTER_OPTS);
  const [filterValues] = useState<FilterValues>({});
  const pageSize = useHubTablePageSize(25);

  const { haystackOf: pageHaystackOf } = useDirectoryHaystackFilter(
    rows,
    (row) => row.pathCode,
    pageHaystack,
  );

  const filtered = useMemo(() => {
    const q = search.query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => pageHaystackOf(row).includes(q));
  }, [pageHaystackOf, rows, search.query]);

  const { sortKey, sortDir, onSort, sorted } = useDirectoryTableSort<PageTableColumnKey, LandingPageRecord>(
    filtered,
    "pathCode",
    pageSortableValue,
  );

  const selection = useHubDirectorySelection(sorted, (row) => row.pathCode);
  const listResetKey = hubDirectoryListResetKey(search.query, filterValues, sortKey, sortDir);

  const kpis: KpiTileData[] = useMemo(
    () => [
      { prefKey: "total", label: "Pages", value: rows.length, tone: "emerald" },
      {
        prefKey: "published",
        label: "Published",
        value: rows.filter((p) => p.status === "published").length,
        tone: "sky",
      },
    ],
    [rows],
  );

  const header = (
    <ConsoleTabHeader
      screen="pages"
      centerStats={[{ key: "shown", label: "shown", value: sorted.length, toneClass: "text-emerald-300" }]}
      actions={<TabHeaderActions />}
    />
  );

  return (
    <HubDirectoryScreen
      header={header}
      kpis={kpis}
      sectionRuleLabel="Pages"
      query={search.queryInput}
      onQueryChange={search.setQueryInput}
      queryPending={search.queryPending}
      filterPlaceholder="Search path, title, template, brand…"
      filterSelectionToolbar={{
        visibleCount: sorted.length,
        selectedCount: selection.selectedIds.size,
        noun: "pages",
      }}
      filterRowActions={
        <HubDirectoryBulkActionBar
          selectAll={{
            visibleCount: sorted.length,
            selectedCount: selection.selectedIds.size,
            allVisibleSelected: selection.allVisibleSelected,
            onToggleSelectAll: selection.toggleSelectAll,
            noun: "pages",
          }}
        />
      }
    >
      <PagesDirectoryTable
        rows={sorted}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        resetKey={listResetKey}
        selectedIds={selection.selectedIds}
        onToggleSelect={selection.toggleSelect}
        onToggleSelectAll={selection.toggleSelectAll}
        allVisibleSelected={selection.allVisibleSelected}
        pageSize={pageSize}
        onRowClick={(row) => window.open(`/${row.pathCode}`, "_blank", "noopener,noreferrer")}
      />
    </HubDirectoryScreen>
  );
}
