import { useEffect, useState } from "react";
import { LANDING_PAGES, TEMPLATE_REGISTRY } from "@/config/pages-registry";
import { publicPageUrl } from "@/lib/app-zone";

type AdminScreen = "overview" | "pages" | "templates";

function readScreen(): AdminScreen {
  const seg = window.location.pathname.replace(/\/+$/, "").split("/").filter(Boolean)[0];
  if (seg === "pages") return "pages";
  if (seg === "templates") return "templates";
  return "overview";
}

function navTo(screen: AdminScreen) {
  const path = screen === "overview" ? "/" : `/${screen}`;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function LandingAdminApp() {
  const [screen, setScreen] = useState<AdminScreen>(() => readScreen());

  useEffect(() => {
    const onPop = () => setScreen(readScreen());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setScreenAndNav = (next: AdminScreen) => {
    setScreen(next);
    navTo(next);
  };

  const templateIds = Object.keys(TEMPLATE_REGISTRY);

  return (
    <div className="ldp-admin min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-sky-400">P0008</p>
            <h1 className="text-xl font-semibold">Landing Platform</h1>
            <p className="text-sm text-slate-400">ldp.infi.io.vn — templates, pages, asset slots</p>
          </div>
          <nav className="flex gap-2">
            {(
              [
                ["overview", "Overview"],
                ["pages", "Pages"],
                ["templates", "Templates"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setScreenAndNav(id)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  screen === id ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {screen === "overview" && (
          <section className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-medium">Quick start</h2>
              <p className="mt-2 text-sm text-slate-400">
                Public landings live at numeric paths — e.g.{" "}
                <a className="text-sky-400 underline" href={publicPageUrl("001")}>
                  /001
                </a>
                . Admin stays on root and reserved routes.
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
                <li>
                  <strong>{LANDING_PAGES.length}</strong> published page(s)
                </li>
                <li>
                  <strong>{templateIds.length}</strong> template(s) in registry
                </li>
                <li>Slot CMS (Option A) — Supabase plane next phase</li>
              </ul>
            </div>
          </section>
        )}

        {screen === "pages" && (
          <section>
            <h2 className="mb-4 text-lg font-medium">Pages</h2>
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Path</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Template</th>
                    <th className="px-4 py-3 font-medium">Brand</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {LANDING_PAGES.map((page) => (
                    <tr key={page.pathCode} className="border-t border-slate-800">
                      <td className="px-4 py-3 font-mono text-sky-300">/{page.pathCode}</td>
                      <td className="px-4 py-3">{page.title}</td>
                      <td className="px-4 py-3 font-mono text-xs">{page.templateId}</td>
                      <td className="px-4 py-3">{page.brandId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            page.status === "published"
                              ? "bg-emerald-900/50 text-emerald-300"
                              : "bg-amber-900/50 text-amber-300"
                          }`}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          className="text-sky-400 underline"
                          href={publicPageUrl(page.pathCode)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {screen === "templates" && (
          <section>
            <h2 className="mb-4 text-lg font-medium">Templates</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {templateIds.map((id) => (
                <li key={id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="font-mono text-sm text-sky-300">{id}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Mie Hair COD funnel — hero, pricing tickets, gallery, order form, reviews.
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
