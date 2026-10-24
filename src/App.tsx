import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  HubAppLogProvider,
  HubLoaderRoot,
  HubToastShell,
  HubToolLoadingProvider,
  HubToolLoadingView,
  HubToolScreenChunkFallback,
  hubAppShellClassName,
  hubMainShellClassFromManifest,
  hubShellColumnClassName,
  resolveHubActiveScreenId,
  useHubActiveScreenSync,
} from "@tool-workspace/hub-ui";
import { LdpSidebar } from "./components/LdpSidebar";
import { LdpVisitedTabPanel } from "./components/LdpVisitedTabPanel";
import { LdpWorkspaceFooter } from "./components/LdpWorkspaceFooter";
import { LDP_BRAND_ICON, LDP_PRODUCT } from "./lib/app-meta";
import { useCatalog } from "./lib/catalog";
import { CatalogContext } from "./lib/catalog-context";
import { P0008_UI_SHELL } from "./lib/p0008-ui-shell";
import { readScreenFromUrl, writeScreenToUrl, type AppScreen } from "./lib/screens";
import { SectionsScreen } from "./features/sections/SectionsScreen";
import { SitesScreen } from "./features/sites/SitesScreen";
import { TemplatesScreen } from "./features/templates/TemplatesScreen";

const SystemScreen = lazy(() => import("./features/system/SystemScreen").then((m) => ({ default: m.SystemScreen })));

function LandingPlatformApp() {
  const catalogState = useCatalog();
  const [screen, setScreen] = useState<AppScreen>(() => readScreenFromUrl());
  const [visited, setVisited] = useState<Set<AppScreen>>(() => new Set([readScreenFromUrl()]));
  const [sectionFocus, setSectionFocus] = useState<{ id: string; nonce: number } | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setVisited((prev) => (prev.has(screen) ? prev : new Set(prev).add(screen)));
  }, [screen]);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (main) {
      main.scrollTop = 0;
      main.scrollLeft = 0;
    }
  }, [screen]);

  useEffect(() => {
    const onPop = () => setScreen(readScreenFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useHubActiveScreenSync(screen);

  const navigate = useCallback((next: AppScreen) => {
    writeScreenToUrl(next, "push");
    setScreen(next);
  }, []);

  const openSection = useCallback(
    (name: string) => {
      setSectionFocus({ id: name, nonce: Date.now() });
      navigate("sections");
    },
    [navigate],
  );

  const catalog = catalogState.catalog;
  const directoryBody = (render: (c: NonNullable<typeof catalog>) => ReactNode) =>
    catalog ? (
      render(catalog)
    ) : catalogState.status === "error" ? (
      <div className="ldp-catalog-error" role="alert">
        <h2>catalog.json is not available</h2>
        <p>{catalogState.error}</p>
      </div>
    ) : (
      <HubToolLoadingView ariaLabel="Loading catalog" variant="overlay" />
    );

  return (
    <CatalogContext.Provider value={catalogState}>
      <HubAppLogProvider
        persistKey="P0008:anon"
        activeScreen={resolveHubActiveScreenId(screen)}
        bootLog={{ scope: "P0008", message: "Landing Platform started", screen }}
      >
        <div className={hubAppShellClassName("ldp-hub-app")}>
          <LdpSidebar screen={screen} onNavigate={navigate} />
          <div className={hubShellColumnClassName()}>
            <main ref={mainRef} className={hubMainShellClassFromManifest(screen, P0008_UI_SHELL, "ldp-hub-main flex min-h-0 flex-1 flex-col")}>
              <HubLoaderRoot mainRef={mainRef} />
              <LdpVisitedTabPanel tabId="templates" active={screen === "templates"} visited={visited}>
                {directoryBody((c) => (
                  <TemplatesScreen catalog={c} tabActive={screen === "templates"} onOpenSection={openSection} />
                ))}
              </LdpVisitedTabPanel>
              <LdpVisitedTabPanel tabId="sections" active={screen === "sections"} visited={visited}>
                {directoryBody((c) => (
                  <SectionsScreen catalog={c} tabActive={screen === "sections"} focus={sectionFocus} />
                ))}
              </LdpVisitedTabPanel>
              <LdpVisitedTabPanel tabId="sites" active={screen === "sites"} visited={visited}>
                {directoryBody((c) => (
                  <SitesScreen catalog={c} tabActive={screen === "sites"} />
                ))}
              </LdpVisitedTabPanel>
              <LdpVisitedTabPanel tabId="system" active={screen === "system"} visited={visited}>
                <Suspense fallback={<HubToolScreenChunkFallback ariaLabel="Loading system" enabled={screen === "system"} />}>
                  <SystemScreen />
                </Suspense>
              </LdpVisitedTabPanel>
            </main>
            <LdpWorkspaceFooter />
          </div>
        </div>
      </HubAppLogProvider>
    </CatalogContext.Provider>
  );
}

export default function App() {
  return (
    <HubToastShell>
      <HubToolLoadingProvider toolCode={LDP_PRODUCT.code} toolName={LDP_PRODUCT.name} iconSrc={LDP_BRAND_ICON}>
        <LandingPlatformApp />
      </HubToolLoadingProvider>
    </HubToastShell>
  );
}
