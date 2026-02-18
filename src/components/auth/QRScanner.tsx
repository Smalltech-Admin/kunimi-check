'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, CheckCircle, AlertCircle, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannedRef = useRef(false);

  const cleanup = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startScanning = useCallback(async () => {
    setStatus('starting');
    setErrorMessage(null);
    scannedRef.current = false;

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');

      const scannerId = 'qr-reader';
      const scanner = new Html5Qrcode(scannerId);

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'user' },  // 内カメラ（フロントカメラ）を使用
        {
          fps: 10,
          // qrboxをコンテナサイズの比率で動的計算（PC/iPad差異を解消）
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minDimension * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Prevent double-scan
          if (scannedRef.current) return;
          scannedRef.current = true;

          setStatus('success');

          // Stop scanner, then notify parent
          scanner.stop().catch(() => {}).finally(() => {
            scannerRef.current = null;
            setTimeout(() => {
              onScan(decodedText);
            }, 600);
          });
        },
        () => {
          // QR not found in frame - this fires frequently, ignore
        }
      );

      setStatus('scanning');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      let userMessage = 'カメラの起動に失敗しました';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        userMessage = 'カメラの使用が許可されていません。ブラウザの設定を確認してください。';
      } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found')) {
        userMessage = 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
      } else if (msg.includes('NotReadableError')) {
        userMessage = 'カメラが他のアプリで使用中です。';
      }

      setStatus('error');
      setErrorMessage(userMessage);
      onError?.(msg);
    }
  }, [onScan, onError]);

  const handleRetry = () => {
    cleanup().then(() => {
      setStatus('idle');
      setErrorMessage(null);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera Preview Area */}
      <div
        ref={containerRef}
        className="relative w-[300px] h-[300px] bg-slate-800 rounded-2xl overflow-hidden qr-scanner-container"
      >
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Camera className="w-16 h-16 mb-4" />
            <p className="text-lg">社員証のQRコードを</p>
            <p className="text-lg">かざしてください</p>
          </div>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg">カメラを起動中...</p>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600 text-white z-10"
          >
            <CheckCircle className="w-20 h-20 mb-4" />
            <p className="text-lg font-bold">認証成功</p>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 px-4 text-center">
            <VideoOff className="w-12 h-12 mb-4 text-red-400" />
            <p className="text-lg text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* html5-qrcode renders the video here */}
        <div
          id="qr-reader"
          className={`w-full h-full ${status === 'scanning' ? '' : 'invisible absolute'}`}
        />
      </div>

      {/* Action Buttons */}
      {status === 'idle' && (
        <Button
          onClick={startScanning}
          className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
        >
          <Camera className="w-5 h-5 mr-2" />
          カメラを起動
        </Button>
      )}

      {status === 'error' && (
        <div className="w-full space-y-2">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full h-12"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            再試行
          </Button>
        </div>
      )}
    </div>
  );
}
