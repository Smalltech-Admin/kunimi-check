'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Clean up local preview URL on unmount
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  // Display source: local preview (immediate) → uploaded URL (after upload)
  const displaySrc = localPreview || value;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show local preview immediately
      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(previewUrl);
      setUploadError(false);
      setIsUploading(true);

      try {
        // Ensure record exists before uploading
        let recId = recordId;
        if (!recId) {
          recId = await onEnsureRecord();
          if (!recId) {
            console.error('[PhotoCapture] Failed to create record');
            setUploadError(true);
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
        const { error: upErr } = await supabase.storage
          .from('check-photos')
          .upload(path, resized, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (upErr) {
          console.error('[PhotoCapture] Upload error:', upErr);
          setUploadError(true);
          setIsUploading(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('check-photos')
          .getPublicUrl(path);

        onChange(urlData.publicUrl);

        // Clear local preview (now using uploaded URL)
        URL.revokeObjectURL(previewUrl);
        setLocalPreview(null);
      } catch (err) {
        console.error('[PhotoCapture] Error:', err);
        setUploadError(true);
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [recordId, itemId, value, onChange, onEnsureRecord, supabase]
  );

  const handleDelete = useCallback(async () => {
    if (!value && !localPreview) return;
    setIsDeleting(true);
    try {
      if (value) {
        const path = extractStoragePath(value);
        if (path) {
          await supabase.storage.from('check-photos').remove([path]);
        }
      }
      onChange(null);
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      }
      setUploadError(false);
    } catch (err) {
      console.error('[PhotoCapture] Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [value, localPreview, onChange, supabase]);

  return (
    <div className="space-y-3">
      {/* Preview - shows immediately after photo selection */}
      {displaySrc && (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt="撮影した写真"
            className="w-full max-h-64 object-contain bg-slate-100 dark:bg-slate-800"
          />
          {/* Upload status overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-base font-medium">保存中...</span>
              </div>
            </div>
          )}
          {/* Upload complete badge */}
          {!isUploading && value && !localPreview && (
            <div className="absolute top-2 left-2 bg-emerald-500 text-white rounded-full p-1">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
          {/* Upload error badge */}
          {uploadError && !isUploading && (
            <div className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {/* Delete button */}
          {!disabled && !isUploading && (
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

      {/* Error message */}
      {uploadError && (
        <p className="text-base text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          アップロードに失敗しました。再度撮影してください。
        </p>
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
            <Camera className="w-5 h-5 mr-2" />
            {displaySrc ? '写真を撮り直す' : '写真を撮影'}
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
