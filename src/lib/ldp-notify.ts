import { useMemo } from "react";
import type { HubNotifyAlert, HubNotifyPanelProps } from "@tool-workspace/hub-ui";
import { useCatalogState } from "./catalog-context";

/**
 * Notify feed — derived from catalog.json only (no backend):
 * catalog load failure · sections no template page uses · templates no site uses.
 */
export function useLdpNotify(): HubNotifyPanelProps {
  const state = useCatalogState();
  return useMemo(() => {
    const alerts: HubNotifyAlert[] = [];
    if (state.status === "error") {
      alerts.push({ id: "catalog-error", severity: "bad", label: "catalog.json failed to load", detail: state.error });
    }
    const catalog = state.catalog;
    if (catalog) {
      for (const s of catalog.sections) {
        if (s.usedIn.length) continue;
        alerts.push({
          id: `section-unused:${s.name}`,
          severity: "warn",
          label: `Section ${s.name} is not used by any page`,
          detail: `Add <!--@section ${s.name}--> to a template page, or remove sections/${s.name}/.`,
          at: catalog.generatedAt,
        });
      }
      for (const t of catalog.templates) {
        if (t.sites.length) continue;
        alerts.push({
          id: `template-unused:${t.id}`,
          severity: "ok",
          label: `Template ${t.id} has no site yet`,
          at: catalog.generatedAt,
        });
      }
    }
    return {
      scopeKey: "p0008-notify",
      title: "Notify",
      subtitle: catalog
        ? `${catalog.counts.templates} templates · ${catalog.counts.sections} sections · ${catalog.counts.sites} sites`
        : "Library alerts",
      emptyMessage: "Every section is used and every template has a site.",
      trackUnread: true,
      alerts,
    };
  }, [state]);
}
