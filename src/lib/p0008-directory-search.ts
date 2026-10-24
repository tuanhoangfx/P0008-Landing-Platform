/**
 * P0008 directory search SSOT — hub-ui client search aliases (hub-shell-ssot § Search performance).
 * FilterBar binds `queryInput`; filtering / KPI use the debounced `query`.
 */
export {
  DIRECTORY_SEARCH_CLIENT_FILTER_OPTS,
  directorySearchHighlightTerms,
  HubDirectorySearchHighlightText,
  useHubClientDirectorySearchQuery as useP0008DirectorySearchQuery,
} from "@tool-workspace/hub-ui";
