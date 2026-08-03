import { QueryClient } from "@tanstack/react-query";

export type HubQueryClientOptions = {
  staleTimeMs?: number;
  gcTimeMs?: number;
  refetchOnWindowFocus?: boolean;
};

/** Shared QueryClient defaults for Hub directory tools. */
export function createHubQueryClient(options: HubQueryClientOptions = {}): QueryClient {
  const staleTime = options.staleTimeMs ?? 60_000;
  const gcTime = options.gcTimeMs ?? 5 * 60_000;
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        gcTime,
        retry: 2,
        refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}
