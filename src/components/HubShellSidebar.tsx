import { useCallback, useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { hubSessionLabels } from "@tool-workspace/hub-identity";
import { getIdentitySupabase } from "../lib/supabase-identity";
import {
  HubLogButton,
  HubSidebarBrandIcon,
  HubSidebarFooterButton,
  HubSidebarNavList,
  HubSidebarShell,
  HubUiZoomControl,
  HubWorkspaceUserShell,
  applyFirstVisitNavGroupDefaults,
  useNavGroupOpenState,
  useWorkspaceRoleKey,
} from "@tool-workspace/hub-ui";
import { DisplayPrefs } from "./DisplayPrefs";
import { P0008_BRAND_ICON, P0008_PRODUCT } from "../lib/product-brand";
import { NAV_GROUP_IDS, NAV_STRUCTURE, NAV_SUBNAV_PREFIX } from "../lib/nav-structure";
import type { AppScreen } from "../lib/app-screen";

type Props = {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
};

export function HubShellSidebar({ screen, onNavigate }: Props) {
  const { groupOpen, setGroupSubnavOpen } = useNavGroupOpenState(NAV_SUBNAV_PREFIX, NAV_GROUP_IDS);
  const [refreshing, setRefreshing] = useState(false);
  const labels = hubSessionLabels(null);
  const { roleKey } = useWorkspaceRoleKey(null);

  useEffect(() => {
    applyFirstVisitNavGroupDefaults({
      prefix: NAV_SUBNAV_PREFIX,
      structure: NAV_STRUCTURE,
      activeScreen: screen,
      setGroupSubnavOpen,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-time route only
  }, [setGroupSubnavOpen]);

  const onRefreshAll = useCallback(() => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <HubSidebarShell
      brandLeading={<HubSidebarBrandIcon src={P0008_BRAND_ICON} alt={P0008_PRODUCT.name} />}
      brandTitle={P0008_PRODUCT.name}
      nav={
        <HubSidebarNavList
          structure={NAV_STRUCTURE}
          activeScreen={screen}
          groupOpen={groupOpen}
          setGroupSubnavOpen={setGroupSubnavOpen}
          showToggleIcon={false}
          onNavigateScreen={onNavigate}
          onSelectView={() => {}}
        />
      }
      footer={
        <>
          <HubWorkspaceUserShell
            session={null}
            labels={labels}
            roleKey={roleKey}
            profileRoleClient={getIdentitySupabase()}
            profileRoleUserId={undefined}
            footerTitle="Open workspace user information"
            emptyEmailLabel="Not signed in"
          />
          <HubSidebarFooterButton
            icon={RefreshCcw}
            iconClass={`text-emerald-300 ${refreshing ? "animate-spin" : ""}`}
            label={refreshing ? "Updating…" : "Refresh"}
            onClick={onRefreshAll}
            title="Refresh workspace data"
          />
          <HubLogButton variant="global" />
          <DisplayPrefs scope="global" screen={screen} sidebarRow />
          <HubUiZoomControl />
        </>
      }
    />
  );
}
