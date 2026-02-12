'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  userName?: string;
  showLogout?: boolean;
}

export function Header({ userName, showLogout = true }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    // セッションをクリア
    localStorage.removeItem('kunimi_check_session');
    router.push('/');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between h-18 px-4 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo-kunimix.png"
            alt="KUNIMIX"
            className="h-8 w-auto -translate-y-[1px]"
          />
          <span className="font-bold text-emerald-600 text-xl translate-y-[1px]">
            くにみ農産加工
          </span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          {userName && (
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <User className="w-5 h-5" />
              <span>{userName}</span>
            </div>
          )}
          {showLogout && (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-11 px-4 text-base font-medium border-2 border-slate-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              ログアウト
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
