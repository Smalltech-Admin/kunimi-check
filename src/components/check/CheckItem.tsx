'use client';

import { Clock, User, AlertCircle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OkNgToggle } from './OkNgToggle';
import { NumberInput } from './NumberInput';
import { PhotoCapture } from './PhotoCapture';
import { cn } from '@/lib/utils';
import type { Item } from '@/types';

type OkNgValue = 'ok' | 'ng' | null;

interface CheckItemProps {
  item: Item;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  onSelfSelect?: () => void;
  users?: Array<{ user_id: string; name: string }>;
  lines?: Array<{ id: string; line_code: string; name: string }>;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  compact?: boolean;
  recordId?: string | null;
  onEnsureRecord?: () => Promise<string | null>;
}

export function CheckItem({
  item,
  value,
  onChange,
  onSelfSelect,
  users = [],
  lines = [],
  disabled = false,
  hasError = false,
  errorMessage,
  compact = false,
  recordId,
  onEnsureRecord,
}: CheckItemProps) {
  const inputHeight = compact ? 'h-10' : 'h-12';
  const inputText = compact ? 'text-lg' : 'text-base';
  const btnHeight = compact ? 'h-10 px-3' : 'h-12 px-4';

  const renderInput = () => {
    switch (item.type) {
      case 'ok_ng':
        return (
          <OkNgToggle
            value={value as OkNgValue}
            onChange={(v) => onChange(v)}
            disabled={disabled}
            size={compact ? 'compact' : 'default'}
          />
        );

      case 'number': {
        // validation.value は min/max 単独指定時の閾値
        const v = item.validation;
        const numMin = v?.type === 'min' ? (v.min ?? v.value) : v?.min;
        const numMax = v?.type === 'max' ? (v.max ?? v.value) : v?.max;
        return (
          <NumberInput
            value={value as number | null}
            onChange={(v2) => onChange(v2)}
            unit={item.unit ?? undefined}
            min={numMin}
            max={numMax}
            disabled={disabled}
          />
        );
      }

      case 'time':
        return (
          <div className="flex gap-2">
            <Input
              type="time"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value || null)}
              disabled={disabled}
              className={cn('flex-1', inputHeight, compact ? 'text-lg' : 'text-lg')}
            />
            {item.allow_now_button && (
              <Button
                type="button"
                variant="outline"
                className={btnHeight}
                disabled={disabled}
                onClick={() => {
                  const now = new Date();
                  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                  onChange(timeStr);
                }}
              >
                <Clock className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4 mr-1'} />
                {!compact && '現在'}
              </Button>
            )}
          </div>
        );

      case 'user_select':
        return (
          <div className="flex gap-2">
            <Select
              value={(value as string) || ''}
              onValueChange={(v) => onChange(v || null)}
              disabled={disabled}
            >
              <SelectTrigger className={cn('flex-1', inputHeight, inputText)}>
                <SelectValue placeholder={compact ? '選択' : '担当者を選択'} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {item.allow_self && onSelfSelect && (
              <Button
                type="button"
                variant="outline"
                className={btnHeight}
                disabled={disabled}
                onClick={onSelfSelect}
              >
                <User className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4 mr-1'} />
                {!compact && '自分'}
              </Button>
            )}
          </div>
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => onChange(v || null)}
            disabled={disabled}
          >
            <SelectTrigger className={cn(inputHeight, inputText)}>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {item.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'line_select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => onChange(v || null)}
            disabled={disabled}
          >
            <SelectTrigger className={cn(inputHeight, inputText)}>
              <SelectValue placeholder="ラインを選択" />
            </SelectTrigger>
            <SelectContent>
              {lines.map((line) => (
                <SelectItem key={line.line_code} value={line.line_code}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value || null)}
              disabled={disabled}
              className={cn('flex-1', inputHeight, inputText)}
            />
            {item.allow_today_button && (
              <Button
                type="button"
                variant="outline"
                className={btnHeight}
                disabled={disabled}
                onClick={() => {
                  const today = new Date();
                  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
                  onChange(dateStr);
                }}
              >
                <CalendarDays className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4 mr-1'} />
                {!compact && '今日'}
              </Button>
            )}
          </div>
        );

      case 'photo':
        return (
          <PhotoCapture
            value={(value as string) || null}
            onChange={(url) => onChange(url)}
            recordId={recordId ?? null}
            itemId={item.id}
            disabled={disabled}
            onEnsureRecord={onEnsureRecord ?? (() => Promise.resolve(null))}
          />
        );

      case 'text':
      default:
        return (
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={item.hint ?? undefined}
            disabled={disabled}
            className={cn(inputHeight, inputText)}
          />
        );
    }
  };

  if (compact) {
    return (
      <div className={cn(
        'transition-colors',
        hasError ? 'bg-red-50 dark:bg-red-950/30' : ''
      )}>
        {renderInput()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'py-4 border-b last:border-b-0 transition-colors',
        hasError
          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 -mx-4 px-4 border-l-4 border-l-red-500'
          : 'border-slate-100 dark:border-slate-800'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <Label
          className={cn(
            'text-base font-medium',
            hasError ? 'text-red-700 dark:text-red-300' : 'text-foreground'
          )}
        >
          {item.label}
          {item.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {hasError && (
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        )}
      </div>

      {renderInput()}

      {/* エラーメッセージ */}
      {hasError && errorMessage && (
        <p className="text-base text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {errorMessage}
        </p>
      )}

      {/* ヒント（エラーがない場合のみ表示） */}
      {!hasError && item.hint && item.type !== 'text' && (
        <p className="text-lg text-muted-foreground mt-2">{item.hint}</p>
      )}
    </div>
  );
}
