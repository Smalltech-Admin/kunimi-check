'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  errorCount?: number;
  warningCount?: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  errorCount = 0,
  warningCount = 0,
  showLabel = true,
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  // エラー状態に応じた色を決定
  const getBarColor = () => {
    if (errorCount > 0) return 'bg-red-500';
    if (warningCount > 0) return 'bg-amber-500';
    return 'bg-primary';
  };

  const getTextColor = () => {
    if (errorCount > 0) return 'text-red-600';
    if (warningCount > 0) return 'text-amber-600';
    return 'text-primary';
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className={cn('font-medium', getTextColor())}>
            {current}/{total}項目
          </span>
          <span className={cn('font-medium', getTextColor())}>
            {total > 0 ? Math.round((current / total) * 100) : 0}%
          </span>
        </div>
      )}
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getBarColor())}
        />
      </div>
    </div>
  );
}
