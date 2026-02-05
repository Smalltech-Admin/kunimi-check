import type { Item, ValidationRule, Section, ItemValue } from '@/types';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * 項目値のバリデーション
 */
export function validateItemValue(
  item: Item,
  value: string | number | null | undefined
): ValidationResult {
  // 必須チェック
  if (item.required && (value === '' || value === null || value === undefined)) {
    return { valid: false, message: 'この項目は必須です' };
  }

  // 値が空の場合、必須でなければOK
  if (value === '' || value === null || value === undefined) {
    return { valid: true };
  }

  // 数値型チェック
  if (item.type === 'number') {
    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) {
      return { valid: false, message: '数値を入力してください' };
    }
  }

  // バリデーションルールがない場合
  if (!item.validation) {
    return { valid: true };
  }

  return validateWithRule(item.validation, value);
}

/**
 * バリデーションルールによる検証
 */
function validateWithRule(
  rule: ValidationRule,
  value: string | number | null | undefined
): ValidationResult {
  const { type, value: ruleValue, min, max, regex, message } = rule;
  const numValue = parseFloat(String(value));

  switch (type) {
    case 'min':
      if (isNaN(numValue) || numValue < ruleValue!) {
        return {
          valid: false,
          message: message || `${ruleValue}以上の値を入力してください`,
        };
      }
      break;

    case 'max':
      if (isNaN(numValue) || numValue > ruleValue!) {
        return {
          valid: false,
          message: message || `${ruleValue}以下の値を入力してください`,
        };
      }
      break;

    case 'range':
      if (isNaN(numValue) || numValue < min! || numValue > max!) {
        return {
          valid: false,
          message: message || `${min}〜${max}の範囲で入力してください`,
        };
      }
      break;

    case 'expiry_date':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(String(value));
      if (inputDate < today) {
        return { valid: false, message: message || '期限切れです' };
      }
      break;

    case 'equals':
      if (value !== ruleValue) {
        return { valid: false, message: message || '値が正しくありません' };
      }
      break;

    case 'pattern':
      const re = new RegExp(regex!);
      if (!re.test(String(value))) {
        return {
          valid: false,
          message: message || '入力形式が正しくありません',
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * レコード完了チェック（全必須項目が入力されているか）
 */
export function validateRecordCompletion(
  sections: Section[],
  itemValues: Record<string, ItemValue>
): ValidationResult {
  const missingItems: string[] = [];
  const invalidItems: string[] = [];

  sections.forEach((section) => {
    if (section.repeatable) {
      // 繰り返しセクションの場合、最低1行は必要
      const hasAnyRow = section.items?.some((item) => {
        const value = itemValues[item.id];
        return value && value.value !== '' && value.value !== null;
      });

      if (!hasAnyRow && section.items?.some((item) => item.required)) {
        missingItems.push(section.name);
      }
    } else {
      // 通常セクション
      section.items?.forEach((item) => {
        if (item.required) {
          const value = itemValues[item.id];
          if (!value || value.value === '' || value.value === null) {
            missingItems.push(item.label);
          } else if (value.is_valid === false) {
            invalidItems.push(item.label);
          }
        }
      });
    }
  });

  if (missingItems.length > 0) {
    return {
      valid: false,
      message: `未入力の必須項目があります: ${missingItems.slice(0, 3).join(', ')}${missingItems.length > 3 ? '...' : ''}`,
    };
  }

  if (invalidItems.length > 0) {
    return {
      valid: false,
      message: `異常値のある項目があります: ${invalidItems.slice(0, 3).join(', ')}${invalidItems.length > 3 ? '...' : ''}`,
    };
  }

  return { valid: true };
}

/**
 * 入力進捗率の計算
 */
export function calculateProgress(
  sections: Section[],
  itemValues: Record<string, ItemValue>
): { completed: number; total: number; percentage: number } {
  let completed = 0;
  let total = 0;

  sections.forEach((section) => {
    section.items?.forEach((item) => {
      if (item.required) {
        total++;
        const value = itemValues[item.id];
        if (value && value.value !== '' && value.value !== null) {
          completed++;
        }
      }
    });
  });

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
