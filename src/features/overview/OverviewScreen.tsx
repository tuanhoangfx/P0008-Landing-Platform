/** no-form-directory document-toc — P0024 / P0004 overview golden */
import { Files, Gauge, Layers } from "lucide-react";
import { LANDING_PAGES, TEMPLATE_REGISTRY } from "@/config/pages-registry";
import { TabScreenChrome } from "@/components/TabScreenChrome";
import { TabHeaderActions } from "@/components/TabHeaderActions";
import { publicPageUrl } from "@/lib/app-zone";
import { OverviewTocNav } from "./OverviewTocNav";

export function OverviewScreen() {
  const pageCount = LANDING_PAGES.length;
  const templateCount = Object.keys(TEMPLATE_REGISTRY).length;

  return (
    <TabScreenChrome
      screen="overview"
      centerStats={[
        { key: "pages", icon: Files, label: "pages", value: pageCount, toneClass: "text-emerald-300" },
        { key: "templates", icon: Layers, label: "templates", value: templateCount, toneClass: "text-violet-300" },
      ]}
      actions={<TabHeaderActions />}
    >
      <div className="grid gap-3 lg:grid-cols-[var(--overview-toc-w)_minmax(0,1fr)]">
        <OverviewTocNav scrollRootSelector=".hub-main" />
        <div className="grid min-w-0 gap-4 xl:grid-cols-[1.2fr_1fr]">
          <article id="architecture" className="rounded-2xl border border-white/6 bg-[var(--panel)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <Gauge size={16} className="text-sky-300" />
              Landing Platform
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Admin console for COD landing pages at <code>ldp.infi.io.vn</code>. Public pages use numeric paths
              (<code>/001</code>, <code>/002</code>…). CRM stays on brand portals (e.g. TOC → P0005).
            </p>
          </article>
          <article id="quick-links" className="rounded-2xl border border-white/6 bg-[var(--panel)] p-5">
            <div className="text-sm font-semibold text-[var(--text)]">Quick links</div>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {LANDING_PAGES.map((page) => (
                <li key={page.pathCode}>
                  <a className="text-sky-300 underline" href={publicPageUrl(page.pathCode)} target="_blank" rel="noreferrer">
                    {publicPageUrl(page.pathCode)}
                  </a>
                  <span className="ml-2 text-[var(--muted)]">— {page.title}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </TabScreenChrome>
  );
}
