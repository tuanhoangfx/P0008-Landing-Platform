/**
 * section.json `group` is authored in Vietnamese (content). The admin chrome is English — map the
 * known groups to an English label + sticker; unknown groups pass through unchanged.
 */
const GROUPS: Record<string, { label: string; emoji: string }> = {
  "Đầu trang": { label: "Header", emoji: "🧭" },
  "Giới thiệu": { label: "Intro", emoji: "✨" },
  "Hướng dẫn": { label: "Guide", emoji: "📘" },
  Media: { label: "Media", emoji: "🎬" },
  "Chuyển đổi": { label: "Conversion", emoji: "🎯" },
  "Hỗ trợ": { label: "Support", emoji: "🛟" },
  "Hệ thống": { label: "System", emoji: "⚙️" },
};

export function sectionGroupLabel(group: string): string {
  return GROUPS[group]?.label ?? group;
}

export function sectionGroupEmoji(group: string): string {
  return GROUPS[group]?.emoji ?? "🧩";
}
