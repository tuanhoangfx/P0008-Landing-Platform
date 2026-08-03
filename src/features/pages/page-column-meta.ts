import { createDirectoryColumnMetaHelpers, applyStandardDirectoryColumnHints } from "@tool-workspace/hub-ui";

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

export const PAGE_COLUMN_META = applyStandardDirectoryColumnHints({
  pathCode: col("Path", "hub-users-col--code", "code", "col.directory.placeName", "5.5rem"),
  title: col("Title", "hub-users-col--name", "name", "col.directory.placeName", "minmax(180px, 1.4fr)"),
  templateId: col("Template", "hub-users-col--path", "path", "col.directory.category", "minmax(140px, 1fr)"),
  brandId: col("Brand", "hub-users-col--brand", "status", "col.directory.status", "7.5rem"),
  status: col("Status", "hub-users-col--status", "status", "col.directory.status", "6.25rem"),
  publicUrl: col("Public URL", "hub-users-col--link", "path", "col.directory.address", "minmax(120px, 0.9fr)"),
});

export const PAGE_HUB_COLUMN_META = toHubDirectoryColumnMeta(PAGE_COLUMN_META);

export type PageTableColumnKey = keyof typeof PAGE_COLUMN_META;

export const PAGE_TABLE_COLUMN_KEYS: PageTableColumnKey[] = [
  "pathCode",
  "title",
  "templateId",
  "brandId",
  "status",
  "publicUrl",
];
