import { readAppZone, readPageCode } from "@/lib/app-zone";
import { resolvePageConfig } from "@/config";
import { AdminConsoleApp } from "@/features/admin/AdminConsoleApp";
import { HairLandingPage } from "@/landing/HairLandingPage";

export default function App() {
  const zone = readAppZone();

  if (zone === "admin") {
    return <AdminConsoleApp />;
  }

  const pathCode = readPageCode();
  const config = resolvePageConfig(pathCode);
  return <HairLandingPage config={config} />;
}
