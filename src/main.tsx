import { createRoot } from "react-dom/client";
import { HubQueryProvider } from "@tool-workspace/hub-query";
import { initHubUserZoom, mountHubApp } from "@tool-workspace/hub-ui";
import App from "./App";
import { AppErrorBoundary } from "./ui/AppErrorBoundary";
import { hubQueryClient } from "./lib/hub-query-client";
import { setupHubUi } from "./lib/hub-ui-setup";
import "./theme/p0008-globals.css";
import "./styles.css";

initHubUserZoom();
setupHubUi();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

mountHubApp(rootEl, () => {
  createRoot(rootEl).render(
    <HubQueryProvider client={hubQueryClient}>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </HubQueryProvider>,
  );
});
