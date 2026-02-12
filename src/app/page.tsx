'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanner from '@/components/auth/QRScanner';
import { LoginForm } from '@/components/auth/LoginForm';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

type LoginMode = 'qr' | 'password';

interface UserOption {
  id: string;
  user_id: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<LoginMode>('qr');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userList, setUserList] = useState<UserOption[]>([]);

  // Supabaseからアクティブユーザー一覧を取得
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, user_id, name')
        .eq('is_active', true)
        .order('name');

      if (data && !error) {
        setUserList(data);
      }
    };
    fetchUsers();
  }, [supabase]);

  // QRコードスキャン成功時
  const handleQRScan = useCallback(
    async (qrCode: string) => {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('is_active', true)
        .single();

      const user = data as User | null;
      if (user && !dbError) {
        localStorage.setItem('kunimi_check_session', JSON.stringify(user));
        router.push('/home');
      } else {
        setIsLoading(false);
        setError('QRコードが無効です。パスワードでログインしてください。');
      }
    },
    [supabase, router]
  );

  // QRスキャンエラー時
  const handleQRError = useCallback((errorMessage: string) => {
    console.log('QR Error:', errorMessage);
  }, []);

  // パスワードログイン
  const handlePasswordLogin = useCallback(
    async (userId: string, password: string) => {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      const user = data as User | null;
      if (user && !dbError) {
        // パスワード検証（デモ段階: demo123で全ユーザーログイン可能）
        // 本番ではサーバーサイドAPI経由でbcrypt検証を行う
        if (user.password_hash === password || password === 'demo123' || password === 'demo') {
          localStorage.setItem('kunimi_check_session', JSON.stringify(user));
          setTimeout(() => {
            router.push('/home');
          }, 500);
        } else {
          setIsLoading(false);
          setError('パスワードが正しくありません');
        }
      } else {
        setIsLoading(false);
        setError('ユーザーが見つかりません');
      }
    },
    [supabase, router]
  );

  // モード切り替え
  const toggleMode = () => {
    setMode(mode === 'qr' ? 'password' : 'qr');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo Area */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mb-3"
          >
            <img
              src="/logo-kunimix.png"
              alt="KUNIMIX"
              className="h-24 w-auto mx-auto"
            />
          </motion.div>
          <h1 className="text-4xl font-bold text-emerald-600">
            くにみ農産加工
          </h1>
          <p className="text-slate-500 text-xl">
            製造工程チェックシステム
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6"
        >
          {/* Mode Indicator */}
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            {mode === 'qr' ? (
              <>
                <QrCode className="w-6 h-6" />
                <span className="font-medium text-lg">QRコードでログイン</span>
              </>
            ) : (
              <>
                <KeyRound className="w-6 h-6" />
                <span className="font-medium text-lg">ID・パスワードでログイン</span>
              </>
            )}
          </div>

          {/* Login Content */}
          <AnimatePresence mode="wait">
            {mode === 'qr' ? (
              <motion.div
                key="qr"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <QRScanner
                  onScan={handleQRScan}
                  onError={handleQRError}
                />
              </motion.div>
            ) : (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm
                  users={userList}
                  onSubmit={handlePasswordLogin}
                  isLoading={isLoading}
                  error={error || undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error for QR mode */}
          {mode === 'qr' && error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base text-destructive text-center bg-destructive/10 py-3 px-4 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-base">
              <span className="px-4 bg-white dark:bg-slate-800 text-muted-foreground">
                または
              </span>
            </div>
          </div>

          {/* Mode Toggle Button */}
          <button
            onClick={toggleMode}
            className="w-full py-4 text-primary hover:text-primary/80 font-medium text-lg transition-colors flex items-center justify-center gap-3"
          >
            {mode === 'qr' ? (
              <>
                <KeyRound className="w-5 h-5" />
                IDとパスワードでログイン
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                QRコードでログイン
              </>
            )}
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground"
        >
          &copy; 2026 くにみ農産加工 - FSSC22000認証工場
        </motion.p>
      </motion.div>
    </div>
  );
}
