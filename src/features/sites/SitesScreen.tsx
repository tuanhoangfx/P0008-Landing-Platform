import { useCallback, useMemo } from "react";
import { ExternalLink, Globe } from "lucide-react";
import {
  DIRECTORY_CELL_TRUNCATE,
  DirectoryTableBodyCell,
  HubBulkActionButton,
  HubCopyBadge,
  HubDirectoryCardHeader,
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
import type { Catalog, CatalogSite } from "../../lib/catalog";
import { createLdpTablePrefs } from "../../lib/ldp-table-prefs";

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

const SITE_COLUMN_META = applyStandardDirectoryColumnHints(
  {
    name: col("Name", "hub-users-col--ldp-site-name", "name", "col.directory.name", "8.5rem", { headerEmoji: "🏷️" }),
    product: col("Product", "hub-users-col--ldp-site-product", "code", "col.directory.code", "6.5rem", { headerEmoji: "📦", enableFit: false }),
    url: col("URL", "hub-users-col--ldp-site-url", "path", "col.directory.url", "11rem", { headerEmoji: "🔗" }),
    template: col("Template", "hub-users-col--ldp-site-template", "kind", "col.directory.type", "9.5rem", { headerEmoji: "🧱", enableFit: false }),
    langs: col("Langs", "hub-users-col--ldp-site-langs", "scope", "col.directory.region", "8.5rem", { headerEmoji: "🌐", enableFit: false }),
    steps: col("Steps", "hub-users-col--ldp-site-steps", "lines", "col.directory.number", "6rem", { headerEmoji: "👣", enableFit: false }),
    registryKey: col("Registry", "hub-users-col--ldp-site-registry", "code", "col.directory.code", "9.5rem", { headerEmoji: "🗝️", enableFit: false }),
  },
  {
    name: "site.config.json name.",
    product: "Product code the site introduces (site.config.json product).",
    url: "Public URL — origin + base. The domain root stays the product's own app.",
    template: "templates/<id> the site renders with.",
    langs: "Languages built for the site; the first one lives at the base path.",
    steps: "content/steps.json — guided-tour steps.",
    registryKey: "Lenovo hosting key in Tool/scripts/lib/lenovo-spa-products.mjs (Deploy <key>).",
  },
);
const SITE_HUB_COLUMN_META = toHubDirectoryColumnMeta(SITE_COLUMN_META);
type SiteColumnKey = keyof typeof SITE_COLUMN_META;

const SITE_TABLE_PREFS = createLdpTablePrefs<SiteColumnKey>("sites", [
  { key: "name", label: "Name", emoji: "🏷️", required: true },
  { key: "product", label: "Product", emoji: "📦" },
  { key: "url", label: "URL", emoji: "🔗" },
  { key: "template", label: "Template", emoji: "🧱" },
  { key: "langs", label: "Langs", emoji: "🌐" },
  { key: "steps", label: "Steps", emoji: "👣" },
  { key: "registryKey", label: "Registry", emoji: "🗝️" },
]);
const SORT_ROWS: DirectoryDefaultSortRow[] = [{ id: "name", label: "Name", directionHint: "A → Z" }];

const KPI_ITEMS = [
  { key: "sites", label: "Sites" },
  { key: "products", label: "Products" },
  { key: "languages", label: "Languages" },
  { key: "steps", label: "Guide steps" },
];
const DEFAULT_KPI_KEYS = new Set(KPI_ITEMS.map((k) => k.key));

const openSite = (row: CatalogSite) => window.open(row.url, "_blank", "noopener");

function sortValue(row: CatalogSite, key: SiteColumnKey): string | number {
  if (key === "langs") return row.langs.join(",");
  if (key === "steps") return row.steps;
  return String(row[key] ?? "");
}

function renderSiteCell(col: HubDirectoryColumnDef<SiteColumnKey>, row: CatalogSite, terms: readonly string[]) {
  const { key, colClass } = col;
  const text = (value: string, cls: string) => (
    <span className={`${DIRECTORY_CELL_TRUNCATE} ${cls}`}>
      {value && terms.length ? <HubDirectorySearchHighlightText text={value} terms={[...terms]} /> : value || "—"}
    </span>
  );
  switch (key) {
    case "name":
      return <DirectoryTableBodyCell key={key} colClass={colClass}>{text(row.name, "hub-users-name-title")}</DirectoryTableBodyCell>;
    case "product":
      return <DirectoryTableBodyCell key={key} colClass={colClass}>{text(row.product ?? "", "hub-users-directory-body-text font-mono")}</DirectoryTableBodyCell>;
    case "url":
      return <DirectoryTableBodyCell key={key} colClass={colClass}>{text(row.domain, "hub-users-directory-body-text")}</DirectoryTableBodyCell>;
    case "template":
      return <DirectoryTableBodyCell key={key} colClass={colClass}>{text(row.template, "hub-users-directory-body-text")}</DirectoryTableBodyCell>;
    case "langs":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-directory-body-text`}>{row.langs.map((l) => l.toUpperCase()).join(" / ")}</span>
        </DirectoryTableBodyCell>
      );
    case "steps":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className={`${DIRECTORY_CELL_TRUNCATE} hub-users-cell-num`}>{row.steps}</span>
        </DirectoryTableBodyCell>
      );
    case "registryKey":
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          {row.registryKey ? <HubCopyBadge value={row.registryKey} display="chip" /> : <span className="hub-users-cell-muted">—</span>}
        </DirectoryTableBodyCell>
      );
    default:
      return null;
  }
}

/** Sites — every sites/<id> on the platform, with open-site action and og image in the rail. */
export function SitesScreen({ catalog, tabActive }: { catalog: Catalog; tabActive: boolean }) {
  const rows = catalog.sites;

  const filters = useMemo<FilterDef[]>(() => {
    const templates = [...new Set(rows.map((s) => s.template))];
    const langs = [...new Set(rows.flatMap((s) => s.langs))];
    return [
      { key: "template", label: "Template", triggerEmoji: "🧱", options: templates.map((t) => ({ value: t, label: t, emoji: "🧱" })) },
      { key: "lang", label: "Language", triggerEmoji: "🌐", options: langs.map((l) => ({ value: l, label: l.toUpperCase(), emoji: "🌐" })) },
    ];
  }, [rows]);

  const matches = useCallback((row: CatalogSite, values: FilterValues) => {
    const template = values.template ?? [];
    const lang = values.lang ?? [];
    if (template.length && !template.includes(row.template)) return false;
    if (lang.length && !row.langs.some((l) => lang.includes(l))) return false;
    return true;
  }, []);

  const kpis = useCallback(
    (_all: readonly CatalogSite[], shown: readonly CatalogSite[]): KpiTileData[] => [
      { prefKey: "sites", label: "Sites", value: shown.length, emojiGlyph: "🌐", tone: "amber" },
      { prefKey: "products", label: "Products", value: new Set(shown.map((s) => s.product).filter(Boolean)).size, emojiGlyph: "📦", tone: "indigo" },
      { prefKey: "languages", label: "Languages", value: new Set(shown.flatMap((s) => s.langs)).size, emojiGlyph: "🗣️", tone: "sky" },
      { prefKey: "steps", label: "Guide steps", value: shown.reduce((n, s) => n + s.steps, 0), emojiGlyph: "👣", tone: "emerald" },
    ],
    [],
  );

  return (
    <LdpDirectoryScreen<CatalogSite, SiteColumnKey>
      screen="sites"
      tabActive={tabActive}
      title="Sites"
      titleIcon={Globe}
      titleEmojiGlyph="🌐"
      titleIconClass="text-amber-300"
      noun="sites"
      countIcon={Globe}
      searchPlaceholder="Search sites, products, domains…"
      rows={rows}
      getId={(row) => row.id}
      haystack={(row) => [row.id, row.name, row.product ?? "", row.domain, row.template, row.registryKey ?? "", row.lead].join(" ")}
      columnMeta={SITE_HUB_COLUMN_META}
      tablePrefs={SITE_TABLE_PREFS}
      renderCell={renderSiteCell}
      sortValue={sortValue}
      defaultSort={{ key: "name", dir: "asc" }}
      sortRows={SORT_ROWS}
      filters={filters}
      matches={matches}
      kpis={kpis}
      kpiItems={KPI_ITEMS}
      defaultKpiKeys={DEFAULT_KPI_KEYS}
      emptyMessage="No sites match the current search and filters."
      moreActions={(selected, active) => {
        const target = selected[0] ?? active;
        return [
          {
            key: "open-site",
            label: "Open site",
            icon: ExternalLink,
            disabled: !target,
            title: target ? `Open ${target.url}` : "Select a site",
            onClick: () => target && openSite(target),
          },
        ];
      }}
      renderCard={(row, ctx) => (
        <HubDirectoryInteractiveCard
          key={row.id}
          ariaLabel={row.name}
          onActivate={ctx.onActivate}
          selected={ctx.selected || ctx.active}
          variant="grid"
          className="ldp-site-card p-3"
        >
          <img className="ldp-site-card__og" src={row.ogImage} alt="" loading="lazy" width={1200} height={630} />
          <HubDirectoryCardHeader title={row.name} subtitle={`${row.product ?? "—"} · ${row.domain}`} />
        </HubDirectoryInteractiveCard>
      )}
      renderRail={(row) => <SiteRail row={row} />}
    />
  );
}

function SiteRail({ row }: { row: CatalogSite | null }) {
  if (!row) return <LdpRail title="Site" emptyMessage="No site selected." />;
  return (
    <LdpRail
      title={
        <>
          <span aria-hidden>🌐</span> {row.name}
        </>
      }
      subtitle={row.domain}
      actions={
        <HubBulkActionButton
          icon={<ExternalLink size={14} aria-hidden />}
          label="Open site"
          title={`Open ${row.url}`}
          tone="amber"
          variant="ghost"
          onClick={() => openSite(row)}
        />
      }
    >
      <div className="ldp-rail__scroll hub-split-scroll">
        <a className="ldp-og" href={row.url} target="_blank" rel="noreferrer" aria-label={`Open ${row.name}`}>
          <img
            key={row.ogImage}
            src={row.ogImage}
            alt=""
            width={1200}
            height={630}
            onError={(e) => {
              e.currentTarget.parentElement?.setAttribute("data-missing", "og.png not deployed yet");
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        </a>
        <LdpRailSection title="📝 Lead">
          <p className="ldp-rail__text">{row.lead || "—"}</p>
        </LdpRailSection>
        <LdpRailSection title="📌 Facts">
          <LdpRailFacts
            rows={[
              ["Product", row.product],
              ["Template", row.template],
              ["Registry key", row.registryKey ? <code key="r">{row.registryKey}</code> : null],
              ["Content", `${row.chapters} chapters · ${row.steps} steps · ${row.features} features · ${row.faq} FAQ`],
              ["Dev port", row.devPort ? <code key="d">{`:${row.devPort}`}</code> : null],
              ["Releases", row.releasesRepo],
              ["Config", <code key="c">{row.configPath}</code>],
            ]}
          />
        </LdpRailSection>
        <LdpRailSection title={`🗣️ Languages (${row.langUrls.length})`}>
          <ul className="ldp-lang-list">
            {row.langUrls.map((l) => (
              <li key={l.lang}>
                <LdpChip tone="accent">{l.lang.toUpperCase()}</LdpChip>
                <a className="ldp-link" href={l.url} target="_blank" rel="noreferrer">
                  {l.url}
                </a>
              </li>
            ))}
          </ul>
        </LdpRailSection>
        <LdpRailSection title="🚀 Deploy">
          <code className="ldp-cmd">{`node Tool/scripts/deploy-lenovo-static.mjs --code ${row.registryKey ?? "<CODE>-SITE"}`}</code>
        </LdpRailSection>
      </div>
    </LdpRail>
  );
}
