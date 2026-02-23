'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface PhotoCaptureProps {
  value: string | null;
  onChange: (url: string | null) => void;
  recordId: string | null;
  itemId: string;
  disabled?: boolean;
  onEnsureRecord: () => Promise<string | null>;
}

function resizeImage(file: File, maxSize: number, quality: number): Promise<Blob> {
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
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('toBlob failed'));
        },
        'image/jpeg',
        quality
      );
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
  recordId,
  itemId,
  disabled = false,
  onEnsureRecord,
}: PhotoCaptureProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        // Ensure record exists before uploading
        let recId = recordId;
        if (!recId) {
          recId = await onEnsureRecord();
          if (!recId) {
            console.error('[PhotoCapture] Failed to create record');
            setIsUploading(false);
            return;
          }
        }

        // Resize image client-side
        const resized = await resizeImage(file, 1200, 0.8);

        // Build storage path
        const timestamp = Date.now();
        const path = `${recId}/${itemId}/${timestamp}.jpg`;

        // Delete old photo if exists
        if (value) {
          const oldPath = extractStoragePath(value);
          if (oldPath) {
            await supabase.storage.from('check-photos').remove([oldPath]);
          }
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('check-photos')
          .upload(path, resized, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('[PhotoCapture] Upload error:', uploadError);
          setIsUploading(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('check-photos')
          .getPublicUrl(path);

        onChange(urlData.publicUrl);
      } catch (err) {
        console.error('[PhotoCapture] Error:', err);
      } finally {
        setIsUploading(false);
        // Reset input so same file can be re-selected
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [recordId, itemId, value, onChange, onEnsureRecord, supabase]
  );

  const handleDelete = useCallback(async () => {
    if (!value) return;
    setIsDeleting(true);
    try {
      const path = extractStoragePath(value);
      if (path) {
        await supabase.storage.from('check-photos').remove([path]);
      }
      onChange(null);
    } catch (err) {
      console.error('[PhotoCapture] Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [value, onChange, supabase]);

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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
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
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                {value ? '写真を撮り直す' : '写真を撮影'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Extract the storage path from a Supabase public URL */
function extractStoragePath(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/check-photos/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
