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
      <div className="flex items-center justify-between h-16 px-4 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo-kunimix.png"
            alt="KUNIMIX"
            className="h-7 w-auto -translate-y-[1px]"
          />
          <span className="font-bold text-emerald-600 text-lg translate-y-[1px]">
            くにみ農産加工
          </span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          {userName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{userName}</span>
            </div>
          )}
          {showLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">ログアウト</span>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
