import { createContext, useContext } from "react";
import type { CatalogState } from "./catalog";

export const CatalogContext = createContext<CatalogState>({ status: "loading", catalog: null, error: null });

export function useCatalogState(): CatalogState {
  return useContext(CatalogContext);
}
