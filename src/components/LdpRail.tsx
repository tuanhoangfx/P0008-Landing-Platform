import type { ReactNode } from "react";
import { HubSplitDirectoryPane } from "@tool-workspace/hub-ui";

type RailProps = {
  /** Rail heading — emoji + title of the selected row. */
  title: ReactNode;
  subtitle?: ReactNode;
  /** Rail actions (HubBulkActionButton ghost) — open preview / open site. */
  actions?: ReactNode;
  emptyMessage?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Right rail — P0003 `stealth-workflow-rail` + `HubSplitDirectoryPane variant="rail"` (P0024 PlacesMapRail parity).
 * The header row lives in the pane's filter band so the rail frame matches the directory frame.
 */
export function LdpRail({ title, subtitle, actions, emptyMessage = "Select a row to see its detail.", children, className = "" }: RailProps) {
  return (
    <aside className={`stealth-workflow-rail ldp-rail ${className}`.trim()} aria-label="Detail rail">
      <HubSplitDirectoryPane
        variant="rail"
        className="ldp-rail__frame hub-directory-frame"
        filterBar={
          <div className="ldp-rail__head">
            <div className="min-w-0">
              <div className="ldp-rail__title">{title}</div>
              {subtitle ? <div className="ldp-rail__subtitle">{subtitle}</div> : null}
            </div>
            {actions ? <div className="ldp-rail__actions">{actions}</div> : null}
          </div>
        }
      >
        {children ?? <p className="ldp-rail__empty">{emptyMessage}</p>}
      </HubSplitDirectoryPane>
    </aside>
  );
}

/** Key / value rows inside a rail section. */
export function LdpRailFacts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="ldp-rail__facts">
      {rows
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([label, value]) => (
          <div key={label} className="ldp-rail__fact">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export function LdpRailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ldp-rail__section">
      <h3 className="ldp-rail__section-title">{title}</h3>
      {children}
    </section>
  );
}

export function LdpChip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" }) {
  return <span className={`ldp-chip ldp-chip--${tone}`}>{children}</span>;
}
