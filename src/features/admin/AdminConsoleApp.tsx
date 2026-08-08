import { StrictMode, useCallback, useEffect, useMemo, useState } from "react";
import {
  HubAppLogProvider,
  resolveHubActiveScreenId,
  useHubActiveScreenSync,
} from "@tool-workspace/hub-ui";
import { HubAppShell } from "@/components/HubAppShell";
import { OverviewScreen } from "@/features/overview/OverviewScreen";
import { PagesDirectoryScreen } from "@/features/pages/PagesDirectoryScreen";
import { TemplatesDirectoryScreen } from "@/features/templates/TemplatesDirectoryScreen";
import { readAppScreen, writeAppScreen, type AppScreen } from "@/lib/app-screen";

function AdminConsoleInner() {
  const [screen, setScreen] = useState<AppScreen>(() => readAppScreen());
  useHubActiveScreenSync(screen);

  useEffect(() => {
    const onPop = () => setScreen(readAppScreen());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const onNavigate = useCallback((next: AppScreen) => {
    setScreen(next);
    writeAppScreen(next);
  }, []);

  const content = useMemo(() => {
    if (screen === "templates") return <TemplatesDirectoryScreen />;
    if (screen === "pages") return <PagesDirectoryScreen />;
    return <OverviewScreen />;
  }, [screen]);

  return (
    <HubAppLogProvider
      activeScreen={resolveHubActiveScreenId(screen)}
      bootLog={{ scope: "P0008", message: "Landing Platform admin", screen }}
    >
      <HubAppShell screen={screen} onNavigate={onNavigate}>
        {content}
      </HubAppShell>
    </HubAppLogProvider>
  );
}

export function AdminConsoleApp() {
  return (
    <StrictMode>
      <AdminConsoleInner />
    </StrictMode>
  );
}
