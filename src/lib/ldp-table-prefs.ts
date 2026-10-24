/**
 * Column visibility + presets per directory (skill p00xx-directory-table § Column visibility + presets).
 * One factory so the three screens cannot drift (golden: P0024 place-table-prefs.ts).
 */
import {
  createDirectoryTableColumnPrefs,
  createDirectoryTableColumnPresetManager,
  type DirectoryTableColumnItem,
  type DirectoryTableColumnPrefs,
} from "@tool-workspace/hub-ui";

export type LdpTablePrefs<K extends string> = {
  items: readonly DirectoryTableColumnItem<K>[];
  defaultVisible: ReadonlySet<K>;
  prefs: DirectoryTableColumnPrefs<K>;
  presets: ReturnType<typeof createDirectoryTableColumnPresetManager<K>>;
  countHidden: () => number;
};

export function createLdpTablePrefs<K extends string>(
  screen: string,
  items: readonly DirectoryTableColumnItem<K>[],
): LdpTablePrefs<K> {
  const defaultVisible = new Set(items.map((item) => item.key));
  const prefs = createDirectoryTableColumnPrefs<K>({
    storageKey: `p0008:${screen}-table-columns:v1`,
    items,
    defaultKeys: defaultVisible,
    changeEvent: `p0008:${screen}-table-columns-change`,
  });
  const presets = createDirectoryTableColumnPresetManager<K>({
    prefs,
    presetsStorageKey: `p0008:${screen}-table-column-presets:v1`,
    itemKeys: items.map((item) => item.key),
    defaultVisible,
  });
  return {
    items,
    defaultVisible,
    prefs,
    presets,
    countHidden: () => {
      const visible = prefs.read();
      return items.filter((item) => !visible.has(item.key)).length;
    },
  };
}
