/**
 * One split directory for Templates · Sections · Sites — P0024 Places / P0003 Profiles golden:
 * HubSplitWorkspaceScreen → [HubSplitDirectoryPane (FilterBar row-1/2 · KPI · table|cards)] + right rail.
 *
 * Read-only catalog: row-2 bulk = Select/Unselect · Detail · More (no New / Delete — nothing to create or
 * remove from the browser; sections/templates/sites are files in the repo).
 * no-read-only-table · no-form-directory — catalog rows are view-only (P0024 Places golden): the table keeps
 * HubDirectoryTableShell for selection + bulk rail, and detail is the right rail (no form fields anywhere).
 */
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  DirectorySearchToolbar,
  DirectoryTableLegacyDisplaySettings,
  HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS,
  HUB_DIRECTORY_TABLE_SCROLL_FLEX_CLASS,
  HubDirectoryCatalogBulkBar,
  HubDirectoryDisplayPanel,
  HubDirectoryTableShell,
  HubPaginatedCardGrid,
  HubSplitDirectoryFilterBar,
  HubSplitDirectoryPane,
  KpiStrip,
  asDirectoryTableColumnPresetManagerProp,
  buildDirectoryColgroupForShell,
  buildDirectoryColumns,
  hubDirectoryListResetKey,
  hubDirectoryTableClass,
  useDirectoryTableSort,
  useHubDirectorySelection,
  useHubTablePageSize,
  useStableDirectoryFilterToolbar,
  type DirectoryDefaultSortRow,
  type FilterDef,
  type FilterValues,
  type HubDirectoryBulkMoreAction,
  type HubDirectoryColumnDef,
  type HubDirectoryColumnMetaInput,
  type HubSortDir,
  type HubViewMode,
  type KpiTileData,
  type TabHeaderStatItem,
} from "@tool-workspace/hub-ui";
import { P0008_SUBTAB_DISPLAY, useScreenDisplaySet, type PrefItem } from "../lib/display-prefs";
import type { LdpTablePrefs } from "../lib/ldp-table-prefs";
import { directorySearchHighlightTerms, useP0008DirectorySearchQuery } from "../lib/p0008-directory-search";
import { readScreenFromUrl, readSelectedIdFromUrl, writeSelectedIdToUrl, type AppScreen } from "../lib/screens";
import { LdpHeaderActions } from "./LdpHeaderActions";
import { LdpHubChrome } from "./LdpHubChrome";

const TABLE_WRAP_CLASS = `${HUB_DIRECTORY_TABLE_SCROLL_FLEX_CLASS} ${HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS}`;
const PAGE_SIZE_DEFAULT = 25;

export type LdpCardContext = { selected: boolean; active: boolean; onActivate: () => void; terms: readonly string[] };

export type LdpDirectoryScreenProps<T, K extends string> = {
  screen: Exclude<AppScreen, "system">;
  tabActive: boolean;
  title: string;
  titleIcon: LucideIcon;
  titleEmojiGlyph: string;
  titleIconClass: string;
  noun: string;
  countIcon: LucideIcon;
  searchPlaceholder: string;
  rows: readonly T[];
  getId: (row: T) => string;
  haystack: (row: T) => string;
  columnMeta: Record<string, HubDirectoryColumnMetaInput>;
  tablePrefs: LdpTablePrefs<K>;
  renderCell: (col: HubDirectoryColumnDef<K>, row: T, terms: readonly string[]) => ReactNode;
  sortValue: (row: T, key: K) => string | number;
  defaultSort: { key: K; dir: HubSortDir };
  sortRows: readonly DirectoryDefaultSortRow[];
  filters: FilterDef[];
  matches: (row: T, values: FilterValues) => boolean;
  kpis: (all: readonly T[], shown: readonly T[]) => KpiTileData[];
  kpiItems: PrefItem[];
  defaultKpiKeys: ReadonlySet<string>;
  centerStats?: (all: readonly T[], shown: readonly T[]) => TabHeaderStatItem[];
  renderCard: (row: T, ctx: LdpCardContext) => ReactNode;
  renderRail: (row: T | null) => ReactNode;
  moreActions: (selected: readonly T[], active: T | null) => HubDirectoryBulkMoreAction[];
  emptyMessage: string;
  layoutClassName?: string;
  /** Cross-screen jump (Templates rail → a section): select this row in the rail. */
  focus?: { id: string; nonce: number } | null;
};

export function LdpDirectoryScreen<T, K extends string>(props: LdpDirectoryScreenProps<T, K>) {
  const {
    screen,
    tabActive,
    rows,
    getId,
    haystack,
    columnMeta,
    tablePrefs,
    renderCell,
    sortValue,
    defaultSort,
    filters,
    matches,
    kpiItems,
    defaultKpiKeys,
  } = props;

  const search = useP0008DirectorySearchQuery();
  const terms = useMemo(() => directorySearchHighlightTerms(search.queryInput), [search.queryInput]);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [viewMode, setViewMode] = useState<HubViewMode>("table");
  const pageSize = useHubTablePageSize(PAGE_SIZE_DEFAULT);
  const [activeId, setActiveId] = useState<string | null>(() =>
    readScreenFromUrl() === screen ? readSelectedIdFromUrl() : null,
  );

  useEffect(() => {
    if (props.focus) setActiveId(props.focus.id);
  }, [props.focus]);

  // Column visibility / order (Display → Table columns).
  const [visibleCols, setVisibleCols] = useState(() => tablePrefs.prefs.read());
  const [colOrder, setColOrder] = useState(() => tablePrefs.prefs.readOrder());
  const [hiddenCols, setHiddenCols] = useState(() => tablePrefs.countHidden());
  useEffect(() => {
    const sync = () => {
      setVisibleCols(tablePrefs.prefs.read());
      setColOrder(tablePrefs.prefs.readOrder());
      setHiddenCols(tablePrefs.countHidden());
    };
    window.addEventListener(tablePrefs.prefs.changeEvent, sync);
    return () => window.removeEventListener(tablePrefs.prefs.changeEvent, sync);
  }, [tablePrefs]);

  const visibleKpiKeys = useScreenDisplaySet(screen, "kpi", defaultKpiKeys);
  const filterDefaults = useMemo(() => new Set(filters.map((f) => f.key)), [filters]);
  const visibleFilterKeys = useScreenDisplaySet(screen, "filters", filterDefaults);
  const visibleFilters = useMemo(() => filters.filter((f) => visibleFilterKeys.has(f.key)), [filters, visibleFilterKeys]);

  const filtered = useMemo(() => {
    const q = search.query.trim().toLowerCase();
    return rows.filter((row) => (!q || haystack(row).toLowerCase().includes(q)) && matches(row, filterValues));
  }, [rows, search.query, haystack, matches, filterValues]);

  const { sortKey, sortDir, onSort, sorted } = useDirectoryTableSort<K, T>(
    filtered as T[],
    defaultSort.key,
    sortValue,
    defaultSort.dir,
  );

  const selection = useHubDirectorySelection(sorted, getId);
  const activeRow = useMemo(
    () => (activeId ? (rows.find((row) => getId(row) === activeId) ?? null) : null),
    [rows, activeId, getId],
  );
  // Rail never stays empty: fall back to the first visible row.
  const railRow = activeRow ?? sorted[0] ?? null;

  useLayoutEffect(() => {
    if (tabActive) writeSelectedIdToUrl(activeRow ? getId(activeRow) : null);
  }, [tabActive, activeRow, getId]);

  const listResetKey = useMemo(
    () => hubDirectoryListResetKey({ query: search.query, filters: filterValues, sortKey, sortDir, viewMode }),
    [search.query, filterValues, sortKey, sortDir, viewMode],
  );

  const columns = useMemo(() => {
    const keys = colOrder.filter((key) => visibleCols.has(key));
    return buildDirectoryColumns(keys, columnMeta);
  }, [colOrder, visibleCols, columnMeta]);
  const colgroup = useMemo(() => buildDirectoryColgroupForShell(columns, { showSelect: true }), [columns]);

  const allKpis = useMemo(() => props.kpis(rows, filtered), [props, rows, filtered]);
  const kpis = useMemo(
    () => allKpis.filter((tile) => !tile.prefKey || visibleKpiKeys.has(tile.prefKey)),
    [allKpis, visibleKpiKeys],
  );
  const centerStats = useMemo(() => props.centerStats?.(rows, filtered) ?? [], [props, rows, filtered]);

  const selectedRows = useMemo(
    () => sorted.filter((row) => selection.selectedIds.has(getId(row))),
    [sorted, selection.selectedIds, getId],
  );

  const displayBand = (
    <HubDirectoryDisplayPanel
      kpis={kpiItems}
      defaultKpiKeys={new Set(defaultKpiKeys)}
      filters={filters.map((f) => ({ key: f.key, label: f.label }))}
      defaultFilterKeys={filterDefaults}
      getScreen={() => screen}
      getSubTab={() => screen}
      subTabDisplay={P0008_SUBTAB_DISPLAY}
      tablePanel={
        <DirectoryTableLegacyDisplaySettings
          id={`p0008-${screen}`}
          items={tablePrefs.items}
          prefs={tablePrefs.prefs}
          primaryDefault={{ sortKey: defaultSort.key, sortDir: defaultSort.dir }}
          sortRows={props.sortRows}
          showReset
        />
      }
      tableColumnPresets={asDirectoryTableColumnPresetManagerProp(tablePrefs.presets)}
      tableActiveCount={hiddenCols}
    />
  );

  const toolbar = useStableDirectoryFilterToolbar(
    { showResultCount: viewMode === "card", shown: filtered.length, total: rows.length },
    () => (
      <DirectorySearchToolbar
        showPeriod={false}
        showTimeRange={false}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        countIcon={props.countIcon}
        shown={filtered.length}
        total={rows.length}
        countLabel={props.noun}
        showResultCount={viewMode === "card"}
        displayBand={displayBand}
      />
    ),
    [viewMode, hiddenCols, kpiItems, filters],
  );

  const headerActions = <LdpHeaderActions screen={screen} />;

  const onDetail = () => {
    const first = selectedRows[0];
    if (first) setActiveId(getId(first));
  };

  const filterBar = (
    <HubSplitDirectoryFilterBar
      shortcutScope={screen}
      placeholder={props.searchPlaceholder}
      filters={visibleFilters}
      query={search.queryInput}
      onQueryChange={search.setQueryInput}
      queryPending={search.queryPending}
      values={filterValues}
      onValuesChange={setFilterValues}
      filterSelectionToolbar={{
        visibleCount: sorted.length,
        selectedCount: selection.selectedIds.size,
        noun: props.noun,
      }}
      directoryViewMode={viewMode}
      toolbar={toolbar}
      row2Actions={
        <HubDirectoryCatalogBulkBar
          noun={props.noun}
          visibleCount={sorted.length}
          selectedCount={selection.selectedIds.size}
          allVisibleSelected={selection.allVisibleSelected}
          onToggleSelectAll={selection.toggleSelectAll}
          onDetail={onDetail}
          singleTitle="Show the selected row in the rail"
          bulkTitle="Show the first selected row in the rail"
          moreActions={props.moreActions(selectedRows, railRow)}
        />
      }
    />
  );

  return (
    <LdpHubChrome
      screen={screen}
      title={props.title}
      titleIcon={props.titleIcon}
      titleEmojiGlyph={props.titleEmojiGlyph}
      titleIconClass={props.titleIconClass}
      centerStats={centerStats}
      headerActions={headerActions}
    >
      <div className={`stealth-profile-layout ldp-split-layout ${props.layoutClassName ?? ""} min-h-0 flex-1 overflow-hidden`}>
        <div className="stealth-profile-directory-pane flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <HubSplitDirectoryPane
            className="stealth-profile-directory-frame ldp-directory-frame hub-directory-frame"
            filterBar={filterBar}
            kpiBand={kpis.length ? <KpiStrip items={kpis} /> : undefined}
          >
            {viewMode === "table" ? (
              <HubDirectoryTableShell
                items={sorted}
                ariaLabel={`${props.title} directory`}
                tableClassName={`${hubDirectoryTableClass("6")} hub-directory-frame-table ldp-directory-table ldp-directory-table--${screen}`}
                wrapClassName={TABLE_WRAP_CLASS}
                flushWrap
                colgroup={colgroup}
                columns={columns}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                getRowKey={getId}
                selectedIds={selection.selectedIds}
                onToggleSelect={selection.toggleSelect}
                onToggleSelectAll={selection.toggleSelectAll}
                allVisibleSelected={selection.allVisibleSelected}
                selectAllLabel={`Select all visible ${props.noun}`}
                emptyMessage={props.emptyMessage}
                pageSize={pageSize}
                resetKey={listResetKey}
                onRowClick={(row) => setActiveId(getId(row))}
                getRowClassName={(row) =>
                  `cursor-pointer${railRow && getId(railRow) === getId(row) ? " ldp-row--active" : ""}`
                }
                renderRowCells={(row) => <>{columns.map((col) => renderCell(col, row, terms))}</>}
              />
            ) : (
              <div className="hub-split-scroll hub-split-scroll--panel min-h-0 flex-1 overflow-auto">
                <HubPaginatedCardGrid items={sorted} pageSize={12} resetKey={listResetKey} ariaLabel={`${props.title} cards`}>
                  {(pageItems) =>
                    pageItems.map((row) =>
                      props.renderCard(row, {
                        selected: selection.selectedIds.has(getId(row)),
                        active: railRow ? getId(railRow) === getId(row) : false,
                        onActivate: () => setActiveId(getId(row)),
                        terms,
                      }),
                    )
                  }
                </HubPaginatedCardGrid>
              </div>
            )}
          </HubSplitDirectoryPane>
        </div>
        {props.renderRail(railRow)}
      </div>
    </LdpHubChrome>
  );
}
