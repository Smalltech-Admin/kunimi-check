'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProductCard } from '@/components/common/ProductCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { User, Product } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftList, setDraftList] = useState<Array<{
    id: string;
    production_date: string;
    batch_number: number;
    created_at: string;
  }>>([]);
  const [selectedProductCode, setSelectedProductCode] = useState<string>('');

  // セッションからユーザー情報を取得
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

  // Supabaseから製品一覧を取得
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (data && !error) {
        setProducts(data);
      }
      setIsLoading(false);
    };
    fetchProducts();
  }, [supabase]);

  // 承認待ちレコード数を取得
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('check_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };
    fetchPendingCount();
  }, [supabase]);

  // 下書きレコード数を製品ごとに取得
  useEffect(() => {
    const fetchDraftCounts = async () => {
      const { data, error } = await supabase
        .from('check_records')
        .select('product_id')
        .in('status', ['draft', 'rejected']);

      if (data && !error) {
        const counts: Record<string, number> = {};
        (data as Array<{ product_id: string }>).forEach((r) => {
          counts[r.product_id] = (counts[r.product_id] || 0) + 1;
        });
        setDraftCounts(counts);
      }
    };
    fetchDraftCounts();
  }, [supabase]);

  // 新規作成（product_codeで遷移）
  const handleNewCreate = (productCode: string) => {
    router.push(`/check/new?product=${productCode}`);
  };

  // 下書き一覧 → 1件なら直接編集画面、複数ならモーダルで選択
  const handleViewDrafts = async (productCode: string) => {
    const product = products.find((p) => p.product_code === productCode);
    if (!product) return;

    const { data, error } = await supabase
      .from('check_records')
      .select('id, production_date, batch_number, created_at')
      .eq('product_id', product.id)
      .in('status', ['draft', 'rejected'])
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return;

    if (data.length === 1) {
      const record = data[0] as { id: string };
      router.push(`/check/${record.id}?product=${productCode}`);
    } else {
      setDraftList(data as Array<{ id: string; production_date: string; batch_number: number; created_at: string }>);
      setSelectedProductCode(productCode);
      setDraftModalOpen(true);
    }
  };

  if (isLoading) {
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
      {/* Header */}
      <Header userName={user?.name} />

      {/* Main Content */}
      <main className="pb-24 pt-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground">製品を選択</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              チェック表を開始する製品を選んでください
            </p>
          </motion.div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-5">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard
                  productId={product.product_code}
                  name={product.name}
                  icon={product.icon ?? undefined}
                  draftCount={draftCounts[product.id] || 0}
                  onNewCreate={handleNewCreate}
                  onViewDrafts={handleViewDrafts}
                />
              </motion.div>
            ))}
          </div>

          {/* No Products Message */}
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">製品が登録されていません</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        isManager={user?.role === 'manager'}
        pendingCount={pendingCount}
      />

      {/* 下書き選択モーダル */}
      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編集する下書きを選択</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {draftList.map((draft) => (
              <Button
                key={draft.id}
                variant="outline"
                className="w-full justify-start h-auto py-4 px-5"
                onClick={() => {
                  router.push(`/check/${draft.id}?product=${selectedProductCode}`);
                  setDraftModalOpen(false);
                }}
              >
                <div className="text-left">
                  <p className="font-medium text-lg">
                    {draft.production_date || '日付未設定'} / バッチ#{draft.batch_number || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    作成: {new Date(draft.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
