'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Calendar,
  User as UserIcon,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle,
  XCircle,
  Filter,
  Search,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { User, Product } from '@/types';

interface HistoryFilter {
  productId: string;
  status: 'approved' | 'rejected' | 'all';
  startDate: string;
  endDate: string;
}

interface HistoryRecord {
  id: string;
  product_id: string;
  line_id: string | null;
  production_date: string;
  batch_number: number;
  status: string;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  // resolved names
  product_name: string;
  product_icon: string | null;
  line_name: string;
  submitted_by_name: string;
  approved_by_name: string | null;
  rejected_by_name: string | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [lineMap, setLineMap] = useState<Map<string, string>>(new Map());

  const [filter, setFilter] = useState<HistoryFilter>({
    productId: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  // ユーザー情報取得
  useEffect(() => {
    const sessionData = localStorage.getItem('kunimi_check_session');
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData) as User;
        setUser(userData);
      } catch {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }
  }, [router]);

  // マスタデータ取得
  useEffect(() => {
    if (!user) return;

    const fetchMaster = async () => {
      const [productsRes, usersRes, linesRes, pendingRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('users').select('id, user_id, name').eq('is_active', true),
        supabase.from('lines').select('id, line_code, name').eq('is_active', true),
        supabase.from('check_records').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data as unknown as Product[]);
      }

      const uMap = new Map<string, string>();
      if (usersRes.data) {
        (usersRes.data as Array<{ id: string; user_id: string; name: string }>).forEach((u) => {
          uMap.set(u.id, u.name);
          uMap.set(u.user_id, u.name);
        });
      }
      setUserMap(uMap);

      const lMap = new Map<string, string>();
      if (linesRes.data) {
        (linesRes.data as Array<{ id: string; line_code: string; name: string }>).forEach((l) => {
          lMap.set(l.id, l.name);
          lMap.set(l.line_code, l.name);
        });
      }
      setLineMap(lMap);

      if (pendingRes.count !== null && pendingRes.count !== undefined) {
        setPendingCount(pendingRes.count);
      }
    };

    fetchMaster();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 履歴レコード取得
  useEffect(() => {
    if (!user) return;

    const fetchRecords = async () => {
      setIsLoading(true);

      let query = supabase
        .from('check_records')
        .select('id, product_id, line_id, production_date, batch_number, status, submitted_by, submitted_at, approved_by, approved_at, rejected_by, rejected_at')
        .in('status', filter.status === 'all' ? ['approved', 'rejected'] : [filter.status])
        .order('production_date', { ascending: false });

      if (filter.productId && filter.productId !== 'all') {
        query = query.eq('product_id', filter.productId);
      }
      if (filter.startDate) {
        query = query.gte('production_date', filter.startDate);
      }
      if (filter.endDate) {
        query = query.lte('production_date', filter.endDate);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('[History] Records fetch error:', error);
        setRecords([]);
        setIsLoading(false);
        return;
      }

      const productMap = new Map<string, { name: string; icon: string | null }>();
      products.forEach((p) => productMap.set(p.id, { name: p.name, icon: p.icon }));

      const rawRecords = data as Array<{
        id: string;
        product_id: string;
        line_id: string | null;
        production_date: string;
        batch_number: number;
        status: string;
        submitted_by: string | null;
        submitted_at: string | null;
        approved_by: string | null;
        approved_at: string | null;
        rejected_by: string | null;
        rejected_at: string | null;
      }>;

      const combined: HistoryRecord[] = rawRecords.map((r) => {
        const product = productMap.get(r.product_id);
        return {
          ...r,
          product_name: product?.name || '不明な製品',
          product_icon: product?.icon || null,
          line_name: r.line_id ? (lineMap.get(r.line_id) || '不明') : '不明',
          submitted_by_name: r.submitted_by ? (userMap.get(r.submitted_by) || '不明') : '不明',
          approved_by_name: r.approved_by ? (userMap.get(r.approved_by) || null) : null,
          rejected_by_name: r.rejected_by ? (userMap.get(r.rejected_by) || null) : null,
        };
      });

      setRecords(combined);
      setIsLoading(false);
    };

    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter, products, userMap, lineMap]);

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

  const handleResetFilter = () => {
    setFilter({
      productId: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
    });
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header userName={user?.name} />

      <main className="pb-24 pt-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">履歴</h1>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilter(!showFilter)}
                className="gap-2 h-12 text-base"
              >
                <Filter className="w-5 h-5" />
                絞り込み
                {showFilter ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-lg">
              承認済み・差戻しのチェック表を確認
            </p>
          </motion.div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-base font-medium mb-2 block">製品</Label>
                      <Select
                        value={filter.productId}
                        onValueChange={(value) =>
                          setFilter((prev) => ({ ...prev, productId: value }))
                        }
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="すべての製品" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべての製品</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.icon} {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-2 block">ステータス</Label>
                      <Select
                        value={filter.status}
                        onValueChange={(value) =>
                          setFilter((prev) => ({
                            ...prev,
                            status: value as HistoryFilter['status'],
                          }))
                        }
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="すべて" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          <SelectItem value="approved">承認済み</SelectItem>
                          <SelectItem value="rejected">差戻し</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-2 block">期間（開始）</Label>
                      <Input
                        type="date"
                        value={filter.startDate}
                        onChange={(e) =>
                          setFilter((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="h-12"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-2 block">期間（終了）</Label>
                      <Input
                        type="date"
                        value={filter.endDate}
                        onChange={(e) =>
                          setFilter((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button variant="ghost" onClick={handleResetFilter}>
                      フィルターをリセット
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div className="mb-4 flex items-center gap-2 text-base text-muted-foreground">
            <Search className="w-5 h-5" />
            <span>{records.length} 件の履歴</span>
          </div>

          {/* Records List */}
          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => router.push(`/history/${record.id}`)}
                >
                  <div className="p-5">
                    {/* Product & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {record.product_icon && (
                          <span className="text-4xl">{record.product_icon}</span>
                        )}
                        <div>
                          <h3 className="font-bold text-xl text-foreground">
                            {record.product_name}
                          </h3>
                          <p className="text-base text-muted-foreground">
                            バッチ #{record.batch_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {record.status === 'approved' ? (
                          <span className="px-4 py-1.5 text-xl font-medium bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            承認済み
                          </span>
                        ) : (
                          <span className="px-4 py-1.5 text-xl font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" />
                            差戻し
                          </span>
                        )}
                        <ChevronRight className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-5 h-5" />
                        <span>{formatDate(record.production_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="w-5 h-5" />
                        <span>提出: {record.submitted_by_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="w-5 h-5" />
                        <span>{record.line_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {record.status === 'approved' ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span>承認: {record.approved_by_name}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span>差戻: {record.rejected_by_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xl text-muted-foreground">
                        {record.status === 'approved'
                          ? `承認日時: ${formatDateTime(record.approved_at)}`
                          : `差戻し日時: ${formatDateTime(record.rejected_at)}`}
                      </p>
                    </div>
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
              <History className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-xl text-muted-foreground">
                履歴がありません
              </p>
              <p className="text-base text-muted-foreground mt-2">
                承認または差戻しされたチェック表がここに表示されます
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <BottomNav isManager={user?.role === 'manager'} pendingCount={pendingCount} />
    </div>
  );
}
