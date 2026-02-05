import type { Section, Item } from '@/types';

const SEPARATOR = '__';

/**
 * repeatableセクション用のformDataキーを生成
 * 例: makeRepeatableKey("S12-1", 0) → "S12-1__0"
 */
export function makeRepeatableKey(itemId: string, rowIndex: number): string {
  return `${itemId}${SEPARATOR}${rowIndex}`;
}

/**
 * repeatableキーを解析
 * 例: parseRepeatableKey("S12-1__0") → { itemId: "S12-1", rowIndex: 0 }
 */
export function parseRepeatableKey(key: string): { itemId: string; rowIndex: number } {
  const idx = key.lastIndexOf(SEPARATOR);
  if (idx === -1) {
    return { itemId: key, rowIndex: 0 };
  }
  return {
    itemId: key.substring(0, idx),
    rowIndex: parseInt(key.substring(idx + SEPARATOR.length), 10),
  };
}

/**
 * repeatableキーかどうか判定
 */
export function isRepeatableKey(key: string): boolean {
  return key.includes(SEPARATOR);
}

/**
 * existingItemsRefのキー生成（item_id + row_index でユニーク）
 */
export function makeExistingKey(itemId: string, rowIndex: number): string {
  return `${itemId}${SEPARATOR}${rowIndex}`;
}

export interface ExpandedItem {
  item: Item;
  sectionId: string;
  formKey: string;
  rowIndex: number;
}

/**
 * 全セクションの全項目をフラットに展開（repeatable考慮）
 * 進捗計算・バリデーション用
 */
export function expandAllItems(
  sections: Section[],
  rowCounts: Record<string, number>
): ExpandedItem[] {
  const result: ExpandedItem[] = [];

  sections.forEach((section) => {
    const items = section.items ?? [];
    if (section.repeatable) {
      const rows = rowCounts[section.id] || section.min_rows || 1;
      for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        items.forEach((item) => {
          result.push({
            item,
            sectionId: section.id,
            formKey: makeRepeatableKey(item.id, rowIdx),
            rowIndex: rowIdx,
          });
        });
      }
    } else {
      items.forEach((item) => {
        result.push({
          item,
          sectionId: section.id,
          formKey: item.id,
          rowIndex: 0,
        });
      });
    }
  });

  return result;
}

/**
 * セクションがrepeatableかどうかをIDで判定するためのセットを構築
 */
export function buildRepeatableSectionIds(sections: Section[]): Set<string> {
  const ids = new Set<string>();
  sections.forEach((s) => {
    if (s.repeatable) ids.add(s.id);
  });
  return ids;
}
