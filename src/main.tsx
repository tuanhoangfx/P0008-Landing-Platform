import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureHubChromePrefs, initHubUserZoom, installHubPerfBlackbox, mountHubApp } from "@tool-workspace/hub-ui";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./styles.css";

initHubUserZoom();
// Freeze/crash diagnostics readable from the console (hub-perf blackbox SSOT).
installHubPerfBlackbox({ code: "P0008" });
// Split-directory chrome: filter lives in the pane (P0003 Profiles / P0024 Places).
configureHubChromePrefs(() => ({ headerPin: true, searchPin: true }));
if (typeof document !== "undefined") document.documentElement.classList.add("theme-hub", "theme-blue");

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

mountHubApp(rootEl, () => {
  createRoot(rootEl).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
});
