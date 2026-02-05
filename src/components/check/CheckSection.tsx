'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Section } from '@/types';

interface CheckSectionProps {
  section: Section;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isComplete?: boolean;
  completedCount?: number;
  totalCount?: number;
  errorCount?: number;
}

export function CheckSection({
  section,
  children,
  defaultOpen = false,
  isComplete = false,
  completedCount = 0,
  totalCount = 0,
  errorCount = 0,
}: CheckSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasErrors = errorCount > 0;

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden',
        hasErrors
          ? 'border-red-300 dark:border-red-700'
          : 'border-slate-200 dark:border-slate-700'
      )}
    >
      {/* Header - Clickable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-4 flex items-center justify-between transition-colors',
          hasErrors
            ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Complete/Error indicator */}
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              hasErrors
                ? 'bg-red-500 text-white'
                : isComplete
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
            )}
          >
            {hasErrors ? (
              <AlertTriangle className="w-4 h-4" />
            ) : isComplete ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">
                {completedCount}/{totalCount}
              </span>
            )}
          </div>

          {/* Section title */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'font-bold',
                  hasErrors ? 'text-red-700 dark:text-red-300' : 'text-foreground'
                )}
              >
                {section.name}
              </h3>
              {hasErrors && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                  {errorCount}件エラー
                </span>
              )}
            </div>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            className={cn(
              'w-5 h-5',
              hasErrors ? 'text-red-500' : 'text-muted-foreground'
            )}
          />
        </motion.div>
      </button>

      {/* Content - Collapsible */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
