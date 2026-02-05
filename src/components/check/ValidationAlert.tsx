'use client';

import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ValidationAlertProps {
  type: 'error' | 'warning' | 'success';
  title: string;
  message: string;
  className?: string;
}

export function ValidationAlert({ type, title, message, className }: ValidationAlertProps) {
  const config = {
    error: {
      icon: XCircle,
      variant: 'destructive' as const,
    },
    warning: {
      icon: AlertTriangle,
      variant: 'default' as const,
    },
    success: {
      icon: CheckCircle,
      variant: 'default' as const,
    },
  };

  const { icon: Icon, variant } = config[type];

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
