'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type OkNgValue = 'ok' | 'ng' | null;

interface OkNgToggleProps {
  value: OkNgValue;
  onChange: (value: OkNgValue) => void;
  disabled?: boolean;
  size?: 'default' | 'compact';
}

export function OkNgToggle({ value, onChange, disabled = false, size = 'default' }: OkNgToggleProps) {
  const isCompact = size === 'compact';
  const handleOkClick = () => {
    if (disabled) return;
    onChange(value === 'ok' ? null : 'ok');
  };

  const handleNgClick = () => {
    if (disabled) return;
    onChange(value === 'ng' ? null : 'ng');
  };

  return (
    <div className="flex gap-3">
      {/* OK Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={handleOkClick}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center font-bold transition-all border-2',
          isCompact
            ? 'gap-1 w-16 h-10 rounded-lg text-sm'
            : 'gap-2 w-24 h-14 rounded-xl text-lg',
          value === 'ok'
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg'
            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 hover:border-emerald-400 hover:text-emerald-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Check className={isCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        OK
      </motion.button>

      {/* NG Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={handleNgClick}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center font-bold transition-all border-2',
          isCompact
            ? 'gap-1 w-16 h-10 rounded-lg text-sm'
            : 'gap-2 w-24 h-14 rounded-xl text-lg',
          value === 'ng'
            ? 'bg-red-500 border-red-500 text-white shadow-lg'
            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 hover:border-red-400 hover:text-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <X className={isCompact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        NG
      </motion.button>
    </div>
  );
}
