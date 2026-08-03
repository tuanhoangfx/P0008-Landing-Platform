import { createDirectoryColumnMetaHelpers, applyStandardDirectoryColumnHints } from "@tool-workspace/hub-ui";

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

export const TEMPLATE_COLUMN_META = applyStandardDirectoryColumnHints({
  templateId: col("Template ID", "hub-users-col--code", "code", "col.directory.placeName", "minmax(160px, 1fr)"),
  description: col("Description", "hub-users-col--name", "name", "col.directory.placeName", "minmax(220px, 2fr)"),
  pageCount: col("Pages", "hub-users-col--count", "tools", "col.directory.reviews", "5.5rem"),
  status: col("Status", "hub-users-col--status", "status", "col.directory.status", "6.25rem"),
});

export const TEMPLATE_HUB_COLUMN_META = toHubDirectoryColumnMeta(TEMPLATE_COLUMN_META);

export type TemplateTableColumnKey = keyof typeof TEMPLATE_COLUMN_META;

export const TEMPLATE_TABLE_COLUMN_KEYS: TemplateTableColumnKey[] = [
  "templateId",
  "description",
  "pageCount",
  "status",
];

export type TemplateDirectoryRow = {
  templateId: string;
  description: string;
  pageCount: number;
  status: "active" | "draft";
};
