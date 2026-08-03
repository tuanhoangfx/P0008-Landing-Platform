/** Hierarchical query keys — enable surgical invalidation per tool/tab. */
export const hubQueryKeys = {
  all: ["hub"] as const,
  directory: (toolCode: string) => [...hubQueryKeys.all, toolCode, "directory"] as const,
  directoryList: (toolCode: string, resource: string) =>
    [...hubQueryKeys.directory(toolCode), resource, "list"] as const,
  directoryDetail: (toolCode: string, resource: string, id: string) =>
    [...hubQueryKeys.directory(toolCode), resource, "detail", id] as const,
};
