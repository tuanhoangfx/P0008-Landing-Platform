import { Blocks, Globe, LayoutTemplate, Settings2 } from "lucide-react";
import { hubSessionLabels } from "@tool-workspace/hub-identity";
import {
  HubLogButton,
  HubSidebarBrandIcon,
  HubSidebarNavScreenButton,
  HubSidebarShell,
  HubWorkspaceUserShell,
  useWorkspaceRoleKey,
  type NavIconTone,
} from "@tool-workspace/hub-ui";
import { LDP_BRAND_ICON, LDP_PRODUCT } from "../lib/app-meta";
import type { AppScreen } from "../lib/screens";
import { LdpDisplayPrefs } from "./LdpDisplayPrefs";

type NavItem = { screen: AppScreen; label: string; icon: typeof Blocks; iconTone: NavIconTone };

const NAV_ITEMS: NavItem[] = [
  { screen: "templates", label: "Templates", icon: LayoutTemplate, iconTone: "indigo" },
  { screen: "sections", label: "Sections", icon: Blocks, iconTone: "emerald" },
  { screen: "sites", label: "Sites", icon: Globe, iconTone: "amber" },
  { screen: "system", label: "System", icon: Settings2, iconTone: "cyan" },
];

type Props = { screen: AppScreen; onNavigate: (screen: AppScreen) => void };

/**
 * Sidebar — HubSidebarShell (P0022/P0024 golden): brand · nav · footer Account · Log · Settings.
 * Public read-only catalog (hub-login-auth tier "exempt", same as P0022/P0024) — Account is the guest shell.
 */
export function LdpSidebar({ screen, onNavigate }: Props) {
  const labels = hubSessionLabels(null);
  const { roleKey } = useWorkspaceRoleKey(null);
  return (
    <HubSidebarShell
      brandLeading={<HubSidebarBrandIcon src={LDP_BRAND_ICON} alt={LDP_PRODUCT.name} />}
      brandTitle={LDP_PRODUCT.name}
      nav={
        <>
          {NAV_ITEMS.map(({ screen: id, label, icon, iconTone }) => (
            <HubSidebarNavScreenButton
              key={id}
              label={label}
              icon={icon}
              iconTone={iconTone}
              active={screen === id}
              onClick={() => onNavigate(id)}
            />
          ))}
        </>
      }
      footer={
        <>
          <HubWorkspaceUserShell
            session={null}
            labels={labels}
            roleKey={roleKey}
            profileRoleClient={null}
            workspaceNote="Landing Platform — public read-only library of templates, sections and sites."
          />
          <HubLogButton variant="global" emptyMessage="No actions logged in this session yet." />
          <LdpDisplayPrefs screen={screen} sidebarRow scope="global" />
        </>
      }
    />
  );
}
