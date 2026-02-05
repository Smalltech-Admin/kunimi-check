'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardCheck, ChevronRight, Calendar, User as UserIcon, Package } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface SubmittedRecord {
  id: string;
  production_date: string;
  batch_number: number;
  submitted_at: string | null;
  submitted_by: string | null;
  product_name: string;
  product_icon: string | null;
  submitted_by_name: string;
}

export default function ApprovalListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<SubmittedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザー情報取得
  useEffect(() => {
    const sessionData = localStorage.getItem('kunimi_check_session');
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData) as User;
        setUser(userData);

        // 管理者でなければホームへ
        if (userData.role !== 'manager') {
          router.push('/home');
          return;
        }
      } catch {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }
  }, [router]);

  // 承認待ちレコードをSupabaseから取得
  useEffect(() => {
    if (!user) return;

    const fetchRecords = async () => {
      setIsLoading(true);

      // check_records + products を結合取得
      const { data: recordsData, error: recordsError } = await supabase
        .from('check_records')
        .select('id, production_date, batch_number, submitted_at, submitted_by, product_id')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (recordsError || !recordsData) {
        console.error('[Approval] Records fetch error:', recordsError);
        setIsLoading(false);
        return;
      }

      if (recordsData.length === 0) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      // 製品IDの一覧を取得
      const rawRecords = recordsData as Array<{
        id: string;
        production_date: string;
        batch_number: number;
        submitted_at: string | null;
        submitted_by: string | null;
        product_id: string;
      }>;
      const productIds = [...new Set(rawRecords.map((r) => r.product_id))];
      const submitterIds = [...new Set(rawRecords.map((r) => r.submitted_by).filter(Boolean))] as string[];

      // 製品名とアイコンを取得
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, icon')
        .in('id', productIds);

      const productMap = new Map<string, { name: string; icon: string | null }>();
      if (productsData) {
        (productsData as Array<{ id: string; name: string; icon: string | null }>).forEach((p) => {
          productMap.set(p.id, { name: p.name, icon: p.icon });
        });
      }

      // 提出者名を取得
      const userMap = new Map<string, string>();
      if (submitterIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', submitterIds);

        if (usersData) {
          (usersData as Array<{ id: string; name: string }>).forEach((u) => {
            userMap.set(u.id, u.name);
          });
        }
      }

      // 結合
      const combined: SubmittedRecord[] = rawRecords.map((r) => {
        const product = productMap.get(r.product_id);
        return {
          id: r.id,
          production_date: r.production_date,
          batch_number: r.batch_number,
          submitted_at: r.submitted_at,
          submitted_by: r.submitted_by,
          product_name: product?.name || '不明な製品',
          product_icon: product?.icon || null,
          submitted_by_name: r.submitted_by ? (userMap.get(r.submitted_by) || '不明') : '不明',
        };
      });

      setRecords(combined);
      setIsLoading(false);
    };

    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 詳細画面へ
  const handleViewDetail = (recordId: string) => {
    router.push(`/approval/${recordId}`);
  };

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <Header userName={user?.name} />

      {/* Main Content */}
      <main className="pb-24 pt-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">承認待ち一覧</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              提出されたチェック表を確認・承認してください
            </p>
          </motion.div>

          {/* Records List */}
          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4">
                    {/* Product & Batch */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {record.product_icon && (
                          <span className="text-3xl">{record.product_icon}</span>
                        )}
                        <div>
                          <h3 className="font-bold text-lg text-foreground">
                            {record.product_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            バッチ #{record.batch_number}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                        承認待ち
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>製造日: {formatDate(record.production_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="w-4 h-4" />
                        <span>提出: {record.submitted_by_name}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                        <Package className="w-4 h-4" />
                        <span>提出日時: {formatDateTime(record.submitted_at)}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleViewDetail(record.id)}
                      className="w-full h-12 text-base"
                    >
                      確認する
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <ClipboardCheck className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-lg text-muted-foreground">
                承認待ちのチェック表はありません
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                新しい提出があると、ここに表示されます
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav isManager={user?.role === 'manager'} pendingCount={records.length} />
    </div>
  );
}
