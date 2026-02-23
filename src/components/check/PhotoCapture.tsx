'use client';

import { useRef, useCallback } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoCaptureProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

function resizeAndToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export function PhotoCapture({
  value,
  onChange,
  disabled = false,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const dataUrl = await resizeAndToDataUrl(file, 1200, 0.8);
        onChange(dataUrl);
      } catch (err) {
        console.error('[PhotoCapture] Resize error:', err);
      } finally {
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onChange]
  );

  const handleDelete = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="撮影した写真"
            className="w-full max-h-64 object-contain bg-slate-100 dark:bg-slate-800"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-9 px-3"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Capture button */}
      {!disabled && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="w-5 h-5 mr-2" />
            {value ? '写真を撮り直す' : '写真を撮影'}
          </Button>
        </div>
      )}
    </div>
  );
}
