import { useMemo, type ReactNode } from "react";
import systemParams from "virtual:hub-system-params";
import { HubSystemParamsScreen, type HubSystemExtraSection } from "@tool-workspace/hub-ui/shell/HubSystemParamsScreen";
import type { HubSystemEndpoint } from "@tool-workspace/hub-ui/shell/hub-system-params";
import { LdpHeaderActions } from "../../components/LdpHeaderActions";
import { useCatalogState } from "../../lib/catalog-context";
import { DesignTemplatePage } from "./design-template/DesignTemplatePage";

/** Same-origin data the admin reads — catalog.json + one engine preview. */
const P0008_EXTRA_ENDPOINTS: HubSystemEndpoint[] = [
  { id: "catalog", label: "catalog.json", url: "/catalog.json", kind: "api" },
  { id: "preview", label: "Section preview", url: "/preview/sections/hero/", kind: "app" },
];

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ldp-info-card">
      <h4 className="ldp-info-card__title">{title}</h4>
      <div className="ldp-info-card__body">{children}</div>
    </div>
  );
}

/** System — shared HubSystemParamsScreen (P0002 golden) + Platform section + empty Design Template. */
export function SystemScreen() {
  const { catalog } = useCatalogState();
  const extraSections = useMemo<HubSystemExtraSection[]>(
    () => [
      {
        id: "p0008-platform",
        label: "Platform",
        emoji: "🧱",
        content: (
          <div className="ldp-info-grid">
            <Card title="⚙️ Engine">
              <p>
                <code>engine/render.mjs</code> renders every page at build time (blocks, <code>{"{{c.*}}"}</code> tokens, i18n,
                base path). <code>engine/site.mjs</code> turns a site folder into a Vite build; <code>engine/catalog.mjs</code>{" "}
                renders each section alone under <code>/preview/</code> and writes <code>catalog.json</code>.
              </p>
            </Card>
            <Card title="📊 Library">
              <ul>
                <li>{catalog ? catalog.counts.templates : "…"} templates</li>
                <li>{catalog ? catalog.counts.sections : "…"} sections</li>
                <li>{catalog ? catalog.counts.sites : "…"} sites</li>
                <li>
                  Sample content: <strong>{catalog?.sample.siteName ?? "…"}</strong>
                </li>
                <li>Catalog generated: {catalog ? new Date(catalog.generatedAt).toLocaleString() : "…"}</li>
              </ul>
            </Card>
            <Card title="🚦 Gate">
              <code className="ldp-cmd">node Tool/P0008-Landing-Platform/scripts/audit-sites.mjs</code>
              <code className="ldp-cmd">node Tool/scripts/gate.mjs --code P0008 --stage post</code>
            </Card>
            <Card title="➕ Add a site">
              <code className="ldp-cmd">
                node Tool/P0008-Landing-Platform/scripts/new-site.mjs --id &lt;id&gt; --name "&lt;Product&gt;" --product P00xx --origin
                https://&lt;host&gt;
              </code>
              <p>Fill content/*.json, capture shots with the P0003 pool, add the &lt;CODE&gt;-SITE hosting key, then audit.</p>
            </Card>
            <Card title="🧩 Add a section">
              <p>
                Create <code>sections/&lt;name&gt;/section.html</code> + <code>section.json</code> (title, description, group),
                then place <code>{"<!--@section name-->"}</code> in a template page. The next build lists it here with a live
                preview.
              </p>
            </Card>
            <Card title="🚀 Deploy">
              <code className="ldp-cmd">node Tool/scripts/deploy-lenovo-static.mjs --code P0008</code>
              <p>
                Builds <code>scripts/build-home.mjs</code>: catalog (previews + catalog.json) then this admin into the same{" "}
                <code>dist/</code>.
              </p>
            </Card>
          </div>
        ),
      },
    ],
    [catalog],
  );

  return (
    <HubSystemParamsScreen
      params={systemParams}
      extraEndpoints={P0008_EXTRA_ENDPOINTS}
      extraSections={extraSections}
      designTemplate={<DesignTemplatePage />}
      titleEmoji="⚙️"
      actions={<LdpHeaderActions screen="system" />}
    />
  );
}
