import { useEffect, useState } from "react";
import { TocCrmAuthGate } from "@/crm/TocCrmAuthGate";
import { TocCrmSidebar } from "@/crm/TocCrmSidebar";
import { TocRemoteEmbedFrame } from "@/crm/TocRemoteEmbedFrame";
import {
  pathForCrmScreen,
  readCrmScreenFromPath,
  writeCrmScreenToUrl,
  type TocCrmScreen,
} from "@/lib/crm-screen";

export function TocCrmPortal() {
  const [screen, setScreen] = useState<TocCrmScreen>(() => readCrmScreenFromPath());

  useEffect(() => {
    writeCrmScreenToUrl(screen);
  }, [screen]);

  useEffect(() => {
    const onPop = () => setScreen(readCrmScreenFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(next: TocCrmScreen) {
    setScreen(next);
    window.history.pushState({}, "", pathForCrmScreen(next));
  }

  return (
    <TocCrmAuthGate>
      <div className="flex h-dvh min-h-dvh w-full overflow-hidden bg-[#0b1020] text-white">
        <TocCrmSidebar screen={screen} onNavigate={navigate} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TocRemoteEmbedFrame screen={screen} />
        </main>
      </div>
    </TocCrmAuthGate>
  );
}
