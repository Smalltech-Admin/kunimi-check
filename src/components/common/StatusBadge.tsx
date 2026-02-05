'use client';

import { Badge } from '@/components/ui/badge';
import type { RecordStatus } from '@/types';

interface StatusBadgeProps {
  status: RecordStatus;
  className?: string;
}

const statusConfig: Record<RecordStatus, { label: string; className: string }> = {
  draft: {
    label: '入力中',
    className: 'bg-muted text-muted-foreground',
  },
  submitted: {
    label: '承認待ち',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  },
  approved: {
    label: '承認済',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  },
  rejected: {
    label: '差戻し',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={`${config.className} ${className || ''}`} variant="secondary">
      {config.label}
    </Badge>
  );
}
