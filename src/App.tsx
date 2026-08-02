import { readAppZone, readPageCode } from "@/lib/app-zone";
import { resolvePageConfig } from "@/config";
import { HairLandingPage } from "@/landing/HairLandingPage";
import { LandingAdminApp } from "@/admin/LandingAdminApp";

export default function App() {
  const zone = readAppZone();

  if (zone === "admin") {
    return <LandingAdminApp />;
  }

  const pathCode = readPageCode();
  const config = resolvePageConfig(pathCode);
  return <HairLandingPage config={config} />;
}
