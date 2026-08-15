import type { HubNotifyPanelProps } from "@tool-workspace/hub-ui";

export type P0008NotifyInput = {
  /** Optional route/data refresh in flight. */
  refreshing?: boolean;
};

/** System Notify for Landing Platform admin — load/sync only (no product CRUD noise). */
export function buildP0008NotifyProps(input: P0008NotifyInput = {}): HubNotifyPanelProps {
  const alerts: HubNotifyPanelProps["alerts"] = [];

  if (input.refreshing) {
    alerts.push({
      id: "refresh-busy",
      severity: "warn",
      label: "Refreshing workspace",
      detail: "Reloading landing pages and templates…",
    });
  }

  return {
    scopeKey: "p0008-landing-platform-notify",
    title: "Notify",
    subtitle: "System alerts for Landing Platform",
    emptyMessage: "No system alerts.",
    trackUnread: true,
    alerts,
  };
}
