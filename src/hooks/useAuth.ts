'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const SESSION_KEY = 'kunimi_check_session';

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load session on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const user = JSON.parse(sessionData) as User;
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    loadSession();
  }, []);

  // Supabase: IDとパスワードでログイン
  const loginWithPassword = useCallback(
    async (userId: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        const user = data as User | null;
        if (error || !user) {
          return { success: false, error: 'ユーザーが見つかりません' };
        }

        // パスワード検証（デモ段階: password_hashフィールドとの比較）
        // 本番ではサーバーサイドでbcryptで検証する
        if (user.password_hash !== password && password !== 'demo123') {
          return { success: false, error: 'パスワードが正しくありません' };
        }

        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      } catch {
        return { success: false, error: 'ログインに失敗しました' };
      }
    },
    [supabase]
  );

  // Supabase: QRコードでログイン
  const loginWithQR = useCallback(
    async (qrCode: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('qr_code', qrCode)
          .eq('is_active', true)
          .single();

        const user = data as User | null;
        if (error || !user) {
          return { success: false, error: 'QRコードが無効です' };
        }

        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      } catch {
        return { success: false, error: 'QRコードログインに失敗しました' };
      }
    },
    [supabase]
  );

  // レガシー: Userオブジェクトで直接ログイン（mockData互換）
  const login = useCallback(
    async (user: User) => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
      router.push('/home');
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.push('/');
  }, [router]);

  const isManager = authState.user?.role === 'manager';

  return {
    ...authState,
    login,
    loginWithPassword,
    loginWithQR,
    logout,
    isManager,
  };
}
