import { createHubIdentitySupabaseClient } from "@tool-workspace/hub-identity";

const hubIdentity = createHubIdentitySupabaseClient({
  defaultUrl: import.meta.env.VITE_HUB_SUPABASE_URL ?? "",
  defaultAnonKey: import.meta.env.VITE_HUB_SUPABASE_ANON_KEY ?? "",
});

export const { getIdentitySupabase } = hubIdentity;
