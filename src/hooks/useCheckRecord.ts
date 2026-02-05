'use client';

import { useState, useCallback } from 'react';
import type { CheckRecord, Section, ItemValue } from '@/types';
import { validateItemValue, validateRecordCompletion, calculateProgress } from '@/lib/validation';

interface UseCheckRecordOptions {
  record: CheckRecord | null;
  sections: Section[];
  initialValues?: Record<string, ItemValue>;
}

export function useCheckRecord({ record, sections, initialValues = {} }: UseCheckRecordOptions) {
  const [values, setValues] = useState<Record<string, ItemValue>>(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update a single item value
  const updateValue = useCallback(async (
    itemId: string,
    value: string,
    item: { required?: boolean; validation?: unknown }
  ) => {
    // Validate the value
    const validationResult = validateItemValue(
      item as Parameters<typeof validateItemValue>[0],
      value
    );

    const newValue: ItemValue = {
      value,
      is_valid: validationResult.valid,
      input_by: null, // Will be set by the component
      input_at: new Date().toISOString(),
    };

    setValues((prev) => ({
      ...prev,
      [itemId]: newValue,
    }));

    // Auto-save (in real app, this would call the API)
    setIsSaving(true);
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }

    return validationResult;
  }, []);

  // Get value for an item
  const getValue = useCallback((itemId: string): string => {
    return values[itemId]?.value || '';
  }, [values]);

  // Check if record is ready for submission
  const canSubmit = useCallback((): { valid: boolean; message?: string } => {
    return validateRecordCompletion(sections, values);
  }, [sections, values]);

  // Calculate progress
  const progress = calculateProgress(sections, values);

  return {
    values,
    updateValue,
    getValue,
    canSubmit,
    progress,
    isSaving,
    lastSaved,
  };
}
