import { useCallback, useMemo } from "react";
import { ExternalLink, LayoutTemplate } from "lucide-react";
import {
  DIRECTORY_CELL_TRUNCATE,
  DirectoryTableBodyCell,
  HubBulkActionButton,
  HubDirectoryCardHeader,
  HubDirectoryCardLeadingIcon,
  HubDirectoryInteractiveCard,
  HubDirectorySearchHighlightText,
  applyStandardDirectoryColumnHints,
  createDirectoryColumnMetaHelpers,
  type DirectoryDefaultSortRow,
  type FilterDef,
  type FilterValues,
  type HubDirectoryColumnDef,
  type KpiTileData,
} from "@tool-workspace/hub-ui";
import { LdpDirectoryScreen } from "../../components/LdpDirectoryScreen";
import { LdpChip, LdpRail, LdpRailFacts, LdpRailSection } from "../../components/LdpRail";
import { absoluteUrl, type Catalog, type CatalogSection, type CatalogTemplate } from "../../lib/catalog";
import { createLdpTablePrefs } from "../../lib/ldp-table-prefs";
import { sectionGroupEmoji } from "../../lib/section-groups";

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

const TEMPLATE_COLUMN_META = applyStandardDirectoryColumnHints(
  {
    name: col("Name", "hub-users-col--ldp-template-name", "name", "col.directory.name", "11rem", { headerEmoji: "🏷️" }),
    description: col("Description", "hub-users-col--ldp-template-desc", "path", "col.directory.notes", "22rem", { headerEmoji: "🧾" }),
    pages: col("Pages", "hub-users-col--ldp-template-pages", "lines", "col.directory.pages", "6rem", { headerEmoji: "📄" }),
    sections: col("Sections", "hub-users-col--ldp-template-sections", "lines", "col.directory.number", "7rem", { headerEmoji: "🧩" }),
    sites: col("Sites", "hub-users-col--ldp-template-sites", "tools", "col.directory.links", "11rem", { headerEmoji: "🌐" }),
  },
  {
    name: "Folder under templates/ — sites pick it with site.config.json `template`.",
    description: "template.json description (authored copy).",
    pages: "HTML pages under templates/<id>/pages/ — one file serves every language.",
    sections: "Distinct sections placed across all pages of the template.",
    sites: "Sites whose site.config.json uses this template.",
  },
);
const TEMPLATE_HUB_COLUMN_META = toHubDirectoryColumnMeta(TEMPLATE_COLUMN_META);
type TemplateColumnKey = keyof typeof TEMPLATE_COLUMN_META;

const TEMPLATE_TABLE_PREFS = createLdpTablePrefs<TemplateColumnKey>("templates", [
  { key: "name", label: "Name", emoji: "🏷️", required: true },
  { key: "description", label: "Description", emoji: "🧾" },
  { key: "pages", label: "Pages", emoji: "📄" },
  { key: "sections", label: "Sections", emoji: "🧩" },
  { key: "sites", label: "Sites", emoji: "🌐" },
]);
const SORT_ROWS: DirectoryDefaultSortRow[] = [{ id: "name", label: "Name", directionHint: "A → Z" }];

const KPI_ITEMS = [
  { key: "templates", label: "Templates" },
  { key: "pages", label: "Pages" },
  { key: "sections", label: "Sections placed" },
  { key: "sites", label: "Sites" },
];
const DEFAULT_KPI_KEYS = new Set(KPI_ITEMS.map((k) => k.key));

function sortValue(row: CatalogTemplate, key: TemplateColumnKey): string | number {
  if (key === "name") return row.id;
  if (key === "description") return row.description;
  if (key === "pages") return row.pages.length;
  if (key === "sections") return row.sectionCount;
  return row.sites.length;
}

function renderTemplateCell(
  col: HubDirectoryColumnDef<TemplateColumnKey>,
  row: CatalogTemplate,
  terms: readonly string[],
  siteNames: ReadonlyMap<string, string>,
) {
  const { key, colClass } = col;
  const text = (value: string, cls: string) => (
    <span className={`${DIRECTORY_CELL_TRUNCATE} ${cls}`}>
      {value && terms.length ? <HubDirectorySearchHighlightText text={value} terms={[...terms]} /> : value || "—"}
    </span>
  );
  switch (key) {
    case "name":
      return <DirectoryTableBodyCell key={key} colClass={colClass}>{text(row.id, "hub-users-name-title")}</DirectoryTableBodyCell>;
    case "description":
      return <DirectoryTableBodyCell key={key} colClass={colClass}>{text(row.description, "hub-users-directory-body-text")}</DirectoryTableBodyCell>;
    case "pages":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-cell-num`}>{row.pages.length}</span>
        </DirectoryTableBodyCell>
      );
    case "sections":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-cell-num`}>{row.sectionCount}</span>
        </DirectoryTableBodyCell>
      );
    case "sites":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-directory-body-text`}>
            {row.sites.length ? row.sites.map((id) => siteNames.get(id) ?? id).join(", ") : "— none yet"}
          </span>
        </DirectoryTableBodyCell>
      );
    default:
      return null;
  }
}

/** Templates — directory + rail with the page → section chain of the selected template. */
export function TemplatesScreen({
  catalog,
  tabActive,
  onOpenSection,
}: {
  catalog: Catalog;
  tabActive: boolean;
  onOpenSection: (name: string) => void;
}) {
  const rows = catalog.templates;
  const siteNames = useMemo(() => new Map(catalog.sites.map((s) => [s.id, s.name])), [catalog.sites]);
  const sectionsByName = useMemo(() => new Map(catalog.sections.map((s) => [s.name, s])), [catalog.sections]);

  const filters = useMemo<FilterDef[]>(
    () => [
      {
        key: "usage",
        label: "Usage",
        triggerEmoji: "🌐",
        options: [
          { value: "in-use", label: "Used by a site", emoji: "✅" },
          { value: "unused", label: "No site yet", emoji: "🚫" },
        ],
      },
    ],
    [],
  );
  const matches = useCallback((row: CatalogTemplate, values: FilterValues) => {
    const usage = values.usage ?? [];
    return !usage.length || usage.includes(row.sites.length ? "in-use" : "unused");
  }, []);

  const kpis = useCallback(
    (_all: readonly CatalogTemplate[], shown: readonly CatalogTemplate[]): KpiTileData[] => [
      { prefKey: "templates", label: "Templates", value: shown.length, emojiGlyph: "🧱", tone: "indigo" },
      { prefKey: "pages", label: "Pages", value: shown.reduce((n, t) => n + t.pages.length, 0), emojiGlyph: "📄", tone: "sky" },
      {
        prefKey: "sections",
        label: "Sections placed",
        value: new Set(shown.flatMap((t) => t.pages.flatMap((p) => p.sections))).size,
        emojiGlyph: "🧩",
        tone: "emerald",
      },
      { prefKey: "sites", label: "Sites", value: new Set(shown.flatMap((t) => t.sites)).size, emojiGlyph: "🌐", tone: "amber" },
    ],
    [],
  );

  return (
    <LdpDirectoryScreen<CatalogTemplate, TemplateColumnKey>
      screen="templates"
      tabActive={tabActive}
      title="Templates"
      titleIcon={LayoutTemplate}
      titleEmojiGlyph="🧱"
      titleIconClass="text-indigo-300"
      noun="templates"
      countIcon={LayoutTemplate}
      searchPlaceholder="Search templates, pages, sections…"
      rows={rows}
      getId={(row) => row.id}
      haystack={(row) => [row.id, row.title, row.description, row.origin ?? "", ...row.pages.map((p) => `${p.rel} ${p.sections.join(" ")}`)].join(" ")}
      columnMeta={TEMPLATE_HUB_COLUMN_META}
      tablePrefs={TEMPLATE_TABLE_PREFS}
      renderCell={(c, row, terms) => renderTemplateCell(c, row, terms, siteNames)}
      sortValue={sortValue}
      defaultSort={{ key: "name", dir: "asc" }}
      sortRows={SORT_ROWS}
      filters={filters}
      matches={matches}
      kpis={kpis}
      kpiItems={KPI_ITEMS}
      defaultKpiKeys={DEFAULT_KPI_KEYS}
      emptyMessage="No templates match the current search and filters."
      moreActions={(selected, active) => {
        const target = selected[0] ?? active;
        const firstSite = target ? catalog.sites.find((s) => s.id === target.sites[0]) : undefined;
        return [
          {
            key: "open-site",
            label: "Open first site",
            icon: ExternalLink,
            disabled: !firstSite,
            title: firstSite ? `Open ${firstSite.url}` : "No site uses this template yet",
            onClick: () => firstSite && window.open(firstSite.url, "_blank", "noopener"),
          },
        ];
      }}
      renderCard={(row, ctx) => (
        <HubDirectoryInteractiveCard
          key={row.id}
          ariaLabel={row.id}
          onActivate={ctx.onActivate}
          selected={ctx.selected || ctx.active}
          variant="grid"
          className="p-4"
        >
          <HubDirectoryCardHeader
            leading={<HubDirectoryCardLeadingIcon icon={LayoutTemplate} tone="indigo" />}
            title={row.id}
            subtitle={`${row.pages.length} pages · ${row.sectionCount} sections · ${row.sites.length} site(s)`}
          />
          <p className="mt-2 line-clamp-3 text-xs text-[var(--muted)]">{row.description}</p>
        </HubDirectoryInteractiveCard>
      )}
      renderRail={(row) => (
        <TemplateRail row={row} siteNames={siteNames} sectionsByName={sectionsByName} onOpenSection={onOpenSection} catalog={catalog} />
      )}
    />
  );
}

function TemplateRail({
  row,
  siteNames,
  sectionsByName,
  onOpenSection,
  catalog,
}: {
  row: CatalogTemplate | null;
  siteNames: ReadonlyMap<string, string>;
  sectionsByName: ReadonlyMap<string, CatalogSection>;
  onOpenSection: (name: string) => void;
  catalog: Catalog;
}) {
  if (!row) return <LdpRail title="Template" emptyMessage="No template selected." />;
  const firstSite = catalog.sites.find((s) => s.id === row.sites[0]);
  return (
    <LdpRail
      title={
        <>
          <span aria-hidden>🧱</span> {row.id}
        </>
      }
      subtitle={row.title}
      actions={
        firstSite ? (
          <HubBulkActionButton
            icon={<ExternalLink size={14} aria-hidden />}
            label="Open site"
            title={`Open ${firstSite.url}`}
            tone="amber"
            variant="ghost"
            onClick={() => window.open(firstSite.url, "_blank", "noopener")}
          />
        ) : undefined
      }
    >
      <div className="ldp-rail__scroll hub-split-scroll">
        <LdpRailSection title="📝 Description">
          <p className="ldp-rail__text">{row.description || "—"}</p>
        </LdpRailSection>
        <LdpRailSection title="📌 Facts">
          <LdpRailFacts
            rows={[
              ["Origin", row.origin],
              ["Source", <code key="s">{row.sourcePath}</code>],
              ["Sites", row.sites.length ? row.sites.map((id) => siteNames.get(id) ?? id).join(", ") : "None yet"],
            ]}
          />
        </LdpRailSection>
        <LdpRailSection title={`📄 Pages → sections (${row.pages.length})`}>
          <ol className="ldp-chain">
            {row.pages.map((page) => (
              <li key={page.rel} className="ldp-chain__page">
                <div className="ldp-chain__rel">
                  <code>{page.rel}</code>
                  <span className="ldp-chain__count">{page.sections.length}</span>
                </div>
                <div className="ldp-chain__sections">
                  {page.sections.map((name, i) => {
                    const section = sectionsByName.get(name);
                    return (
                      <button
                        key={`${name}-${i}`}
                        type="button"
                        className="ldp-chain__section"
                        title={section ? `${section.title} — open in Sections` : name}
                        onClick={() => onOpenSection(name)}
                      >
                        <span className="ldp-chain__step">{i + 1}</span>
                        <span aria-hidden>{section ? sectionGroupEmoji(section.group) : "🧩"}</span>
                        <span className="truncate">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </LdpRailSection>
        {firstSite ? (
          <LdpRailSection title="🔗 Live page">
            <a className="ldp-link" href={absoluteUrl(firstSite.url)} target="_blank" rel="noreferrer">
              {firstSite.url}
            </a>
          </LdpRailSection>
        ) : (
          <LdpRailSection title="🔗 Live page">
            <LdpChip>No site uses this template yet</LdpChip>
          </LdpRailSection>
        )}
      </div>
    </LdpRail>
  );
}
