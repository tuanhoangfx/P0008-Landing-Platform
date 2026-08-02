export type TocCrmScreen = "orders" | "customers" | "products";

const SCREENS: TocCrmScreen[] = ["orders", "customers", "products"];

export function isTocCrmScreen(value: string | null): value is TocCrmScreen {
  return value !== null && (SCREENS as readonly string[]).includes(value);
}

export function readCrmScreenFromPath(): TocCrmScreen {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/crm/customers" || path.startsWith("/crm/customers/")) return "customers";
  if (path === "/crm/products" || path.startsWith("/crm/products/")) return "products";
  return "orders";
}

export function pathForCrmScreen(screen: TocCrmScreen): string {
  if (screen === "customers") return "/crm/customers";
  if (screen === "products") return "/crm/products";
  return "/crm/orders";
}

export function writeCrmScreenToUrl(screen: TocCrmScreen) {
  const next = pathForCrmScreen(screen);
  if (window.location.pathname !== next) {
    window.history.replaceState({}, "", next);
  }
}

export function crmScreenLabel(screen: TocCrmScreen): string {
  if (screen === "customers") return "Customers";
  if (screen === "products") return "Products";
  return "Orders";
}
