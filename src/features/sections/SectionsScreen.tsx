import { useCallback, useMemo } from "react";
import { Blocks, ExternalLink, FileCode2 } from "lucide-react";
import {
  HubBulkActionButton,
  HubDirectoryCardHeader,
  HubDirectoryInteractiveCard,
  HubDirectorySearchHighlightText,
  type FilterDef,
  type FilterValues,
  type KpiTileData,
} from "@tool-workspace/hub-ui";
import { LdpDirectoryScreen } from "../../components/LdpDirectoryScreen";
import { LdpChip, LdpRail, LdpRailFacts, LdpRailSection } from "../../components/LdpRail";
import { LdpScaledFrame } from "../../components/LdpScaledFrame";
import { absoluteUrl, type Catalog, type CatalogSection } from "../../lib/catalog";
import { sectionGroupEmoji, sectionGroupLabel } from "../../lib/section-groups";
import {
  SECTION_HUB_COLUMN_META,
  SECTION_SORT_ROWS,
  SECTION_TABLE_PREFS,
  type SectionColumnKey,
} from "./section-columns";
import { renderSectionCell } from "./section-directory-cells";

const KPI_ITEMS = [
  { key: "sections", label: "Sections" },
  { key: "groups", label: "Groups" },
  { key: "used", label: "Used" },
  { key: "unused", label: "Unused" },
  { key: "chapter", label: "Chapter scope" },
];
const DEFAULT_KPI_KEYS = new Set(KPI_ITEMS.map((k) => k.key));

const openPreview = (row: CatalogSection) => window.open(absoluteUrl(row.previewUrl), "_blank", "noopener");

function sortValue(row: CatalogSection, key: SectionColumnKey): string | number {
  if (key === "group") return `${sectionGroupLabel(row.group)}\u0000${row.name}`;
  if (key === "usedIn") return row.usedIn.length;
  if (key === "blocks") return row.blocks.length;
  if (key === "keys") return row.tokens.length;
  return row[key];
}

/** Sections — directory grouped/filterable by group + rail with the live engine render (/preview/…). */
export function SectionsScreen({
  catalog,
  tabActive,
  focus,
}: {
  catalog: Catalog;
  tabActive: boolean;
  focus?: { id: string; nonce: number } | null;
}) {
  const rows = catalog.sections;

  const filters = useMemo<FilterDef[]>(() => {
    const groups = [...new Set(rows.map((s) => s.group))];
    return [
      {
        key: "group",
        label: "Group",
        triggerEmoji: "🗂️",
        options: groups.map((g) => ({ value: g, label: sectionGroupLabel(g), emoji: sectionGroupEmoji(g) })),
      },
      {
        key: "usage",
        label: "Usage",
        triggerEmoji: "📄",
        options: [
          { value: "used", label: "Used by a page", emoji: "✅" },
          { value: "unused", label: "Not used", emoji: "🚫" },
        ],
      },
      {
        key: "scope",
        label: "Scope",
        triggerEmoji: "🧭",
        options: [
          { value: "page", label: "Page section", emoji: "📄" },
          { value: "chapter", label: "Chapter section", emoji: "📘" },
        ],
      },
    ];
  }, [rows]);

  const matches = useCallback((row: CatalogSection, values: FilterValues) => {
    const group = values.group ?? [];
    const usage = values.usage ?? [];
    const scope = values.scope ?? [];
    if (group.length && !group.includes(row.group)) return false;
    if (usage.length && !usage.includes(row.usedIn.length ? "used" : "unused")) return false;
    if (scope.length && !scope.includes(row.chapter ? "chapter" : "page")) return false;
    return true;
  }, []);

  const kpis = useCallback(
    (all: readonly CatalogSection[], shown: readonly CatalogSection[]): KpiTileData[] => [
      { prefKey: "sections", label: "Sections", value: shown.length, emojiGlyph: "🧩", tone: "emerald" },
      { prefKey: "groups", label: "Groups", value: new Set(all.map((s) => s.group)).size, emojiGlyph: "🗂️", tone: "indigo" },
      { prefKey: "used", label: "Used", value: all.filter((s) => s.usedIn.length).length, emojiGlyph: "✅", tone: "sky" },
      { prefKey: "unused", label: "Unused", value: all.filter((s) => !s.usedIn.length).length, emojiGlyph: "🚫", tone: "amber" },
      { prefKey: "chapter", label: "Chapter scope", value: all.filter((s) => s.chapter).length, emojiGlyph: "📘", tone: "violet" },
    ],
    [],
  );

  return (
    <LdpDirectoryScreen<CatalogSection, SectionColumnKey>
      screen="sections"
      tabActive={tabActive}
      title="Sections"
      titleIcon={Blocks}
      titleEmojiGlyph="🧩"
      titleIconClass="text-emerald-300"
      noun="sections"
      countIcon={Blocks}
      searchPlaceholder="Search sections, titles, blocks, content keys…"
      rows={rows}
      getId={(row) => row.name}
      haystack={(row) => [row.name, row.title, row.description, row.group, sectionGroupLabel(row.group), ...row.blocks, ...row.tokens, ...row.usedIn].join(" ")}
      columnMeta={SECTION_HUB_COLUMN_META}
      tablePrefs={SECTION_TABLE_PREFS}
      renderCell={renderSectionCell}
      sortValue={sortValue}
      defaultSort={{ key: "group", dir: "asc" }}
      sortRows={SECTION_SORT_ROWS}
      filters={filters}
      matches={matches}
      kpis={kpis}
      kpiItems={KPI_ITEMS}
      defaultKpiKeys={DEFAULT_KPI_KEYS}
      emptyMessage="No sections match the current search and filters."
      layoutClassName="ldp-split-layout--wide-rail"
      focus={focus}
      moreActions={(selected, active) => {
        const target = selected[0] ?? active;
        return [
          {
            key: "open-preview",
            label: "Open preview",
            icon: ExternalLink,
            disabled: !target,
            title: target ? `Open ${target.previewUrl} in a new tab` : "Select a section",
            onClick: () => target && openPreview(target),
          },
        ];
      }}
      renderCard={(row, ctx) => (
        <HubDirectoryInteractiveCard
          key={row.name}
          ariaLabel={row.name}
          onActivate={ctx.onActivate}
          selected={ctx.selected || ctx.active}
          variant="grid"
          className="ldp-section-card p-3"
        >
          <LdpScaledFrame src={row.previewUrl} title={row.name} className="ldp-section-card__frame" inert />
          <HubDirectoryCardHeader
            title={
              ctx.terms.length ? (
                <span className="min-w-0 truncate text-sm font-medium text-[var(--text)]">
                  <HubDirectorySearchHighlightText text={row.name} terms={[...ctx.terms]} />
                </span>
              ) : (
                row.name
              )
            }
            subtitle={`${sectionGroupEmoji(row.group)} ${sectionGroupLabel(row.group)} · ${row.usedIn.length} page(s)`}
          />
        </HubDirectoryInteractiveCard>
      )}
      renderRail={(row) => <SectionRail row={row} />}
    />
  );
}

function SectionRail({ row }: { row: CatalogSection | null }) {
  if (!row) return <LdpRail title="Preview" emptyMessage="No section selected." />;
  return (
    <LdpRail
      title={
        <>
          <span aria-hidden>🧩</span> {row.name}
        </>
      }
      subtitle={row.title}
      actions={
        <HubBulkActionButton
          icon={<ExternalLink size={14} aria-hidden />}
          label="Open preview"
          title={`Open ${row.previewUrl} in a new tab`}
          tone="emerald"
          variant="ghost"
          onClick={() => openPreview(row)}
        />
      }
    >
      <div className="ldp-rail__scroll hub-split-scroll">
        <LdpScaledFrame src={row.previewUrl} title={`${row.name} preview`} className="ldp-preview" />
        <LdpRailSection title="📝 Description">
          <p className="ldp-rail__text">{row.description || "—"}</p>
        </LdpRailSection>
        <LdpRailSection title="📌 Facts">
          <LdpRailFacts
            rows={[
              ["Group", `${sectionGroupEmoji(row.group)} ${sectionGroupLabel(row.group)}`],
              ["Scope", row.chapter ? "Chapter (rendered inside a guide chapter route)" : "Page"],
              ["Preview", <code key="p">{row.previewUrl}</code>],
              [
                "Source",
                <span key="s" className="inline-flex items-center gap-1">
                  <FileCode2 size={12} aria-hidden />
                  <code>{row.sourcePath}</code>
                </span>,
              ],
            ]}
          />
        </LdpRailSection>
        <LdpRailSection title={`📄 Used in (${row.usedIn.length})`}>
          <div className="ldp-chip-row">
            {row.usedIn.length ? row.usedIn.map((p) => <LdpChip key={p}>{p}</LdpChip>) : <span className="ldp-rail__text">Not used by any page.</span>}
          </div>
        </LdpRailSection>
        <LdpRailSection title={`🧱 Blocks (${row.blocks.length})`}>
          <div className="ldp-chip-row">
            {row.blocks.length ? row.blocks.map((b) => <LdpChip key={b} tone="accent">{b}</LdpChip>) : <span className="ldp-rail__text">Static markup — no engine block.</span>}
          </div>
        </LdpRailSection>
        <LdpRailSection title={`🔑 Content keys (${row.tokens.length})`}>
          <div className="ldp-chip-row">
            {row.tokens.length ? row.tokens.map((t) => <LdpChip key={t}>{`c.${t}`}</LdpChip>) : <span className="ldp-rail__text">Reads no landing.json copy.</span>}
          </div>
        </LdpRailSection>
      </div>
    </LdpRail>
  );
}
