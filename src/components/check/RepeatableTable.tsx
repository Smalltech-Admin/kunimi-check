'use client';

import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckItem } from './CheckItem';
import { makeRepeatableKey } from '@/lib/repeatable';
import { cn } from '@/lib/utils';
import type { Section } from '@/types';

type ItemValue = string | number | null;

interface RepeatableTableProps {
  section: Section;
  formData: Record<string, ItemValue>;
  rowCount: number;
  onItemChange: (formKey: string, value: ItemValue) => void;
  onSelfSelect: (formKey: string) => void;
  onAddRow: () => void;
  onRemoveRow: () => void;
  users: Array<{ user_id: string; name: string }>;
  lines: Array<{ id: string; line_code: string; name: string }>;
  errorMap: Record<string, string>;
  canAddRow: boolean;
  canRemoveRow: boolean;
  disabled?: boolean;
  recordId?: string | null;
  onEnsureRecord?: () => Promise<string | null>;
}

export function RepeatableTable({
  section,
  formData,
  rowCount,
  onItemChange,
  onSelfSelect,
  onAddRow,
  onRemoveRow,
  users,
  lines,
  errorMap,
  canAddRow,
  canRemoveRow,
  disabled = false,
  recordId,
  onEnsureRecord,
}: RepeatableTableProps) {
  const items = section.items ?? [];
  const hasFixedLabels = section.fixed_labels && section.fixed_labels.length > 0;

  return (
    <div className="space-y-3">
      {/* Horizontal scroll table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {/* Row label header */}
              <th className="text-left text-lg font-medium text-muted-foreground py-2 px-2 w-[120px] min-w-[120px] sticky left-0 bg-white dark:bg-slate-800 z-10">
                {hasFixedLabels ? '' : '#'}
              </th>
              {/* Item column headers */}
              {items.map((item) => (
                <th
                  key={item.id}
                  className="text-left text-lg font-medium text-muted-foreground py-2 px-2 min-w-[140px]"
                >
                  {item.label}
                  {item.required && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                  {item.hint && (
                    <span className="block text-lg text-muted-foreground/70 font-normal">
                      {item.hint}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, rowIdx) => {
              const rowLabel = hasFixedLabels
                ? section.fixed_labels![rowIdx] || `${rowIdx + 1}回目`
                : `${rowIdx + 1}回目`;

              return (
                <tr
                  key={rowIdx}
                  className={cn(
                    'border-b border-slate-100 dark:border-slate-800',
                    rowIdx % 2 === 1 && 'bg-slate-50/50 dark:bg-slate-800/30'
                  )}
                >
                  {/* Row label (sticky left) */}
                  <td className="py-2 px-2 text-lg font-medium text-slate-600 dark:text-slate-400 w-[120px] min-w-[120px] sticky left-0 bg-inherit z-10">
                    <div className="truncate">{rowLabel}</div>
                  </td>
                  {/* Item cells */}
                  {items.map((item) => {
                    const formKey = makeRepeatableKey(item.id, rowIdx);
                    const cellError = errorMap[formKey];
                    return (
                      <td
                        key={item.id}
                        className={cn(
                          'py-2 px-2 min-w-[140px]',
                          cellError && 'bg-red-50/50 dark:bg-red-950/20'
                        )}
                      >
                        <CheckItem
                          item={item}
                          value={formData[formKey] ?? null}
                          onChange={(v) => onItemChange(formKey, v)}
                          onSelfSelect={() => onSelfSelect(formKey)}
                          users={users}
                          lines={lines}
                          compact
                          disabled={disabled}
                          hasError={!!cellError}
                          recordId={recordId}
                          onEnsureRecord={onEnsureRecord}
                        />
                        {cellError && (
                          <p className="text-lg text-red-500 mt-0.5 truncate">
                            {cellError}
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Remove row buttons */}
      {!disabled && (canAddRow || canRemoveRow) && (
        <div className="flex gap-2 justify-end">
          {canRemoveRow && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemoveRow}
              className="text-lg"
            >
              <Minus className="w-4 h-4 mr-1" />
              行を削除
            </Button>
          )}
          {canAddRow && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddRow}
              className="text-lg"
            >
              <Plus className="w-4 h-4 mr-1" />
              行を追加
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
