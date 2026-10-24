import type { ReactNode } from "react";
import { Blocks, Clock3, Cpu, Globe, LayoutTemplate } from "lucide-react";
import { formatHubActivityRelativeAge } from "@tool-workspace/hub-ui";
import { useCatalogState } from "../lib/catalog-context";

function FooterChip({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <span className="ldp-workspace-footer__chip" title={title}>
      {children}
    </span>
  );
}

/** Workspace footer strip (P0022 StoreWorkspaceFooter structure) — library facts from catalog.json. */
export function LdpWorkspaceFooter() {
  const { catalog } = useCatalogState();
  return (
    <footer
      className="ldp-workspace-footer shrink-0 bg-[var(--hub-panel)]/80 text-[var(--hub-muted)]"
      aria-label="Landing Platform footer"
    >
      <div className="ldp-workspace-footer__row">
        <FooterChip>
          <span>© {new Date().getFullYear()} Infi · Landing Platform</span>
        </FooterChip>
        <FooterChip title="Every page is rendered by engine/render.mjs at build time">
          <Cpu size={13} strokeWidth={2.2} aria-hidden />
          <span>Engine render.mjs</span>
        </FooterChip>
        {catalog ? (
          <>
            <FooterChip title="templates/<id>/template.json">
              <LayoutTemplate size={13} strokeWidth={2.2} aria-hidden />
              <span>{catalog.counts.templates} templates</span>
            </FooterChip>
            <FooterChip title="sections/<name>/section.html">
              <Blocks size={13} strokeWidth={2.2} aria-hidden />
              <span>{catalog.counts.sections} sections</span>
            </FooterChip>
            <FooterChip title="sites/<id>/site.config.json">
              <Globe size={13} strokeWidth={2.2} aria-hidden />
              <span>{catalog.counts.sites} sites</span>
            </FooterChip>
            <FooterChip title={`catalog.json generated ${catalog.generatedAt}`}>
              <Clock3 size={13} strokeWidth={2.2} aria-hidden />
              <span>Catalog {formatHubActivityRelativeAge(Date.parse(catalog.generatedAt))}</span>
            </FooterChip>
          </>
        ) : null}
      </div>
    </footer>
  );
}
