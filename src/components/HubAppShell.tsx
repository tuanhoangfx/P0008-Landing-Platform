import { useLayoutEffect, useRef, type ReactNode } from "react";
import { HubLoaderRoot, hubMainShellClassFromManifest } from "@tool-workspace/hub-ui";
import { HubShellSidebar } from "./HubShellSidebar";
import { P0008_UI_SHELL } from "../lib/p0008-ui-shell";
import type { AppScreen } from "../lib/app-screen";

type Props = {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  children: ReactNode;
};

/** P0020 golden app chrome — sidebar + hubMainShellClassFromManifest main (P0024 parity). */
export function HubAppShell({ screen, onNavigate, children }: Props) {
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (main) {
      main.scrollTop = 0;
      main.scrollLeft = 0;
    }
  }, [screen]);

  return (
    <div className="hub-app theme-hub p0008-hub-app flex h-full min-h-0 w-full overflow-hidden">
      <HubShellSidebar screen={screen} onNavigate={onNavigate} />
      <main
        ref={mainRef}
        className={hubMainShellClassFromManifest(screen, P0008_UI_SHELL, "p0008-hub-main flex flex-col")}
      >
        <HubLoaderRoot mainRef={mainRef} />
        {children}
      </main>
    </div>
  );
}
