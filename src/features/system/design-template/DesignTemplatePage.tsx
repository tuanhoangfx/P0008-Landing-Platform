import { HubDesignTemplateEmpty } from "@tool-workspace/hub-ui";
import { ACTIVE_DESIGN_COUNT } from "./design-registry";

/** System → Design — empty state (no active reviews). P0022 golden. */
export function DesignTemplatePage() {
  return (
    <div className="design-template-page space-y-3">
      <p className="text-xs text-[var(--muted)]">
        Active reviews: <strong className="text-cyan-200">{ACTIVE_DESIGN_COUNT}</strong>
      </p>
      <HubDesignTemplateEmpty />
    </div>
  );
}
