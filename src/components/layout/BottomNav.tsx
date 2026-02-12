'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardCheck, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface BottomNavProps {
  isManager?: boolean;
  pendingCount?: number;
}

export function BottomNav({ isManager = false, pendingCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/home',
      label: 'ホーム',
      icon: <Home className="h-8 w-8" />,
    },
  ];

  // 管理者のみ承認メニューを表示
  if (isManager) {
    navItems.push({
      href: '/approval',
      label: '承認待ち',
      icon: <ClipboardCheck className="h-8 w-8" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    });
  }

  navItems.push({
    href: '/history',
    label: '履歴',
    icon: <History className="h-8 w-8" />,
  });

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-20 max-w-4xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-base mt-1 font-medium',
                isActive && 'text-primary'
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-0 h-0.5 w-12 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
