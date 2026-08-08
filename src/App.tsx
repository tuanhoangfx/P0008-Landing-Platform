import { Suspense, lazy } from "react";
import { HubToolLoadingProvider } from "@tool-workspace/hub-ui";
import { readAppZone, readPageCode } from "@/lib/app-zone";
import { resolvePageConfig } from "@/config";
import { AdminConsoleApp } from "@/features/admin/AdminConsoleApp";
import { P0008_BRAND_ICON, P0008_PRODUCT } from "@/lib/product-brand";

const HairLandingPage = lazy(() =>
  import("@/landing/HairLandingPage").then((m) => ({ default: m.HairLandingPage })),
);

export default function App() {
  const zone = readAppZone();

  if (zone === "admin") {
    return (
      <HubToolLoadingProvider toolCode={P0008_PRODUCT.code} toolName={P0008_PRODUCT.name} iconSrc={P0008_BRAND_ICON}>
        <AdminConsoleApp />
      </HubToolLoadingProvider>
    );
  }

  const pathCode = readPageCode();
  const config = resolvePageConfig(pathCode);
  return (
    <Suspense fallback={null}>
      <HairLandingPage config={config} />
    </Suspense>
  );
}
