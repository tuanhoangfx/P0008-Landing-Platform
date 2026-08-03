import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

type Props = {
  client: QueryClient;
  children: ReactNode;
};

export function HubQueryProvider({ client, children }: Props) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
