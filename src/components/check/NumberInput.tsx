'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  placeholder = '入力',
  disabled = false,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState<string>(value?.toString() ?? '');
  const [isOutOfRange, setIsOutOfRange] = useState(false);

  useEffect(() => {
    setInputValue(value?.toString() ?? '');
  }, [value]);

  useEffect(() => {
    if (value !== null && value !== undefined) {
      const outOfRange =
        (min !== undefined && value < min) || (max !== undefined && value > max);
      setIsOutOfRange(outOfRange);
    } else {
      setIsOutOfRange(false);
    }
  }, [value, min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === '') {
      onChange(null);
    } else {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  const rangeText =
    min !== undefined && max !== undefined
      ? `${min}〜${max}`
      : min !== undefined
        ? `${min}以上`
        : max !== undefined
          ? `${max}以下`
          : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-28 h-12 px-3 text-lg text-center font-medium rounded-xl border-2 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            isOutOfRange
              ? 'bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {unit && (
          <span className="text-lg text-muted-foreground font-medium">{unit}</span>
        )}
      </div>

      {/* Range indicator / Warning */}
      <div className="flex items-center gap-1 text-base">
        {isOutOfRange ? (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400">
              範囲外（{rangeText}）
            </span>
          </>
        ) : rangeText ? (
          <span className="text-muted-foreground">基準値: {rangeText}</span>
        ) : null}
      </div>
    </div>
  );
}
