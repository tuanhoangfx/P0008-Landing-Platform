import { crmScreenLabel, pathForCrmScreen, type TocCrmScreen } from "@/lib/crm-screen";

const NAV: TocCrmScreen[] = ["orders", "customers", "products"];

type Props = {
  screen: TocCrmScreen;
  onNavigate: (screen: TocCrmScreen) => void;
};

export function TocCrmSidebar({ screen, onNavigate }: Props) {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-[#0b1020] py-3 md:w-48 md:items-stretch md:px-2">
      <div className="hidden px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/50 md:block">
        TOC CRM
      </div>
      {NAV.map((item) => {
        const active = item === screen;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onNavigate(item)}
            className={`rounded-lg px-2 py-2 text-left text-xs font-medium transition md:px-3 ${
              active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="md:hidden">{item === "orders" ? "📦" : item === "customers" ? "👤" : "🏷️"}</span>
            <span className="hidden md:inline">{crmScreenLabel(item)}</span>
          </button>
        );
      })}
      <a
        href="/ldp01"
        className="mt-auto rounded-lg px-2 py-2 text-center text-[11px] text-white/50 hover:bg-white/10 hover:text-white md:px-3"
      >
        ← Landing
      </a>
      <span className="hidden truncate px-2 text-[10px] text-white/30 md:block">{pathForCrmScreen(screen)}</span>
    </aside>
  );
}
