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
import { LANDING_PAGES, TEMPLATE_REGISTRY } from "@/config/pages-registry";
import { ConsoleTabHeader } from "@/components/ConsoleTabHeader";
import { TabHeaderActions } from "@/components/TabHeaderActions";
import { TemplatesDirectoryTable } from "./TemplatesDirectoryTable";
import type { TemplateDirectoryRow, TemplateTableColumnKey } from "./template-column-meta";
import { templateSortableValue } from "./templates-directory-cells";

const TEMPLATE_ROWS: TemplateDirectoryRow[] = Object.keys(TEMPLATE_REGISTRY).map((templateId) => ({
  templateId,
  description: "Mie Hair COD funnel — hero, pricing tickets, gallery, order form, reviews.",
  pageCount: LANDING_PAGES.filter((p) => p.templateId === templateId).length,
  status: "active" as const,
}));

function templateHaystack(row: TemplateDirectoryRow): string {
  return [row.templateId, row.description, row.status].join(" ").toLowerCase();
}

export function TemplatesDirectoryScreen() {
  const rows = TEMPLATE_ROWS;
  const search = useDirectorySearchQuery(DIRECTORY_SEARCH_CLIENT_FILTER_OPTS);
  const [filterValues] = useState<FilterValues>({});
  const pageSize = useHubTablePageSize(25);

  const { haystackOf: templateHaystackOf } = useDirectoryHaystackFilter(
    rows,
    (row) => row.templateId,
    templateHaystack,
  );

  const filtered = useMemo(() => {
    const q = search.query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => templateHaystackOf(row).includes(q));
  }, [rows, search.query, templateHaystackOf]);

  const { sortKey, sortDir, onSort, sorted } = useDirectoryTableSort<
    TemplateTableColumnKey,
    TemplateDirectoryRow
  >(filtered, "templateId", templateSortableValue);

  const selection = useHubDirectorySelection(sorted, (row) => row.templateId);
  const listResetKey = hubDirectoryListResetKey(search.query, filterValues, sortKey, sortDir);

  const kpis: KpiTileData[] = useMemo(
    () => [{ key: "templates", label: "Templates", value: rows.length, toneClass: "text-violet-300" }],
    [rows.length],
  );

  const header = (
    <ConsoleTabHeader
      screen="templates"
      centerStats={[{ key: "shown", label: "shown", value: sorted.length, toneClass: "text-violet-300" }]}
      actions={<TabHeaderActions />}
    />
  );

  return (
    <HubDirectoryScreen
      header={header}
      kpis={kpis}
      sectionRuleLabel="Templates"
      query={search.queryInput}
      onQueryChange={search.setQueryInput}
      queryPending={search.queryPending}
      filterPlaceholder="Search template id or description…"
      filterSelectionToolbar={{
        visibleCount: sorted.length,
        selectedCount: selection.selectedIds.size,
        noun: "templates",
      }}
      filterRowActions={
        <HubDirectoryBulkActionBar
          selectAll={{
            visibleCount: sorted.length,
            selectedCount: selection.selectedIds.size,
            allVisibleSelected: selection.allVisibleSelected,
            onToggleSelectAll: selection.toggleSelectAll,
            noun: "templates",
          }}
        />
      }
    >
      <TemplatesDirectoryTable
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
      />
    </HubDirectoryScreen>
  );
}
