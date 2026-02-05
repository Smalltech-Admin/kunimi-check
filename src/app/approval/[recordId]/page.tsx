'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  X,
  Calendar,
  User as UserIcon,
  Package,
  AlertTriangle,
  CheckCircle,
  Hash,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { generateCheckRecordPdf } from '@/lib/generatePdf';
import type { CheckRecordPDFData, ItemMeta } from '@/components/pdf/CheckRecordPDF';
import type { User, Section } from '@/types';

interface RecordDetail {
  id: string;
  template_id: string;
  product_id: string;
  line_id: string | null;
  production_date: string;
  batch_number: number;
  status: string;
  submitted_at: string | null;
  submitted_by: string | null;
  product_name: string;
  product_icon: string | null;
  line_name: string;
  submitted_by_name: string;
}

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const recordId = params.recordId as string;

  const [user, setUser] = useState<User | null>(null);
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState<Record<string, string | number | null>>({});
  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [lineMap, setLineMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // ユーザー情報取得
  useEffect(() => {
    const sessionData = localStorage.getItem('kunimi_check_session');
    if (sessionData) {
      try {
        const userData = JSON.parse(sessionData) as User;
        setUser(userData);

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

  // Supabaseからレコード詳細・テンプレート・入力値を取得
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      // 1. レコード取得
      const { data: recordData, error: recordError } = await supabase
        .from('check_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (recordError || !recordData) {
        console.error('[ApprovalDetail] Record fetch error:', recordError);
        setIsLoading(false);
        return;
      }

      const raw = recordData as unknown as {
        id: string;
        template_id: string;
        product_id: string;
        line_id: string | null;
        production_date: string;
        batch_number: number;
        status: string;
        submitted_at: string | null;
        submitted_by: string | null;
      };

      // 2. 製品・ユーザー一覧・ライン一覧・テンプレート・入力値を並列取得
      const [productRes, usersRes, linesRes, templateRes, itemsRes] = await Promise.all([
        supabase.from('products').select('id, name, icon').eq('id', raw.product_id).single(),
        supabase.from('users').select('id, user_id, name').eq('is_active', true),
        supabase.from('lines').select('id, line_code, name').eq('is_active', true),
        supabase.from('templates').select('*').eq('id', raw.template_id).single(),
        supabase.from('record_items').select('*').eq('record_id', recordId),
      ]);

      // ライン名を個別取得
      let lineRes: { data: unknown } = { data: null };
      if (raw.line_id) {
        lineRes = await supabase.from('lines').select('id, name').eq('id', raw.line_id).single();
      }

      // 製品情報
      const product = productRes.data as { id: string; name: string; icon: string | null } | null;

      // ライン情報
      const line = lineRes.data as { id: string; name: string } | null;

      // ユーザーマップ（UUID → 名前、user_id → 名前）
      const uMap = new Map<string, string>();
      if (usersRes.data) {
        (usersRes.data as Array<{ id: string; user_id: string; name: string }>).forEach((u) => {
          uMap.set(u.id, u.name);
          uMap.set(u.user_id, u.name);
        });
      }
      setUserMap(uMap);

      // ラインマップ（UUID → 名前、line_code → 名前）
      const lMap = new Map<string, string>();
      if (linesRes.data) {
        (linesRes.data as Array<{ id: string; line_code: string; name: string }>).forEach((l) => {
          lMap.set(l.id, l.name);
          lMap.set(l.line_code, l.name);
        });
      }
      setLineMap(lMap);

      // 提出者名
      const submitterName = raw.submitted_by ? (uMap.get(raw.submitted_by) || '不明') : '不明';

      setRecord({
        ...raw,
        product_name: product?.name || '不明な製品',
        product_icon: product?.icon || null,
        line_name: line?.name || '不明',
        submitted_by_name: submitterName,
      });

      // 3. テンプレートからセクション定義
      const templateData = templateRes.data as unknown as { sections: Section[] } | null;
      if (templateData?.sections) {
        setSections(templateData.sections);
      }

      // 4. record_itemsからフォームデータ + 入力メタデータを復元
      const itemsData = itemsRes.data as unknown as Array<{
        item_id: string;
        value: string | null;
        input_by: string | null;
        input_at: string | null;
      }> | null;
      if (itemsData) {
        const restored: Record<string, string | number | null> = {};
        const meta: Record<string, ItemMeta> = {};
        itemsData.forEach((ri) => {
          restored[ri.item_id] = ri.value;
          if (ri.input_by || ri.input_at) {
            meta[ri.item_id] = {
              inputByName: ri.input_by ? (uMap.get(ri.input_by) || '不明') : '不明',
              inputAt: ri.input_at,
            };
          }
        });
        setFormData(restored);
        setItemMeta(meta);
      }

      setIsLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recordId]);

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

  // 値の表示形式を取得
  const getDisplayValue = (
    type: string,
    value: string | number | null
  ): string => {
    if (value === null || value === undefined || value === '') return '未入力';

    switch (type) {
      case 'ok_ng':
        return value === 'ok' ? 'OK' : 'NG';
      case 'user_select': {
        return userMap.get(String(value)) || String(value);
      }
      case 'line_select': {
        return lineMap.get(String(value)) || String(value);
      }
      case 'date':
        return formatDate(String(value));
      default:
        return String(value);
    }
  };

  // 範囲チェック
  const isOutOfRange = (
    value: string | number | null,
    validation?: { type: string; min?: number; max?: number }
  ): boolean => {
    if (!validation || value === null || value === undefined) return false;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;

    if (validation.type === 'range') {
      return (
        (validation.min !== undefined && numValue < validation.min) ||
        (validation.max !== undefined && numValue > validation.max)
      );
    }
    if (validation.type === 'min') {
      return validation.min !== undefined && numValue < validation.min;
    }
    if (validation.type === 'max') {
      return validation.max !== undefined && numValue > validation.max;
    }
    return false;
  };

  // PDF出力
  const handleDownloadPdf = useCallback(async () => {
    if (!record) return;
    setPdfGenerating(true);

    try {
      const pdfData: CheckRecordPDFData = {
        productName: record.product_name,
        productIcon: record.product_icon,
        productionDate: record.production_date,
        batchNumber: record.batch_number,
        lineName: record.line_name,
        submittedByName: record.submitted_by_name,
        submittedAt: record.submitted_at,
        approvedByName: null,
        approvedAt: null,
        rejectedByName: null,
        rejectedAt: null,
        rejectReason: null,
        status: record.status,
        sections,
        formData,
        itemMeta,
        userMap,
        lineMap,
      };

      await generateCheckRecordPdf(pdfData);
    } catch (err) {
      console.error('[ApprovalDetail] PDF generation error:', err);
    } finally {
      setPdfGenerating(false);
    }
  }, [record, sections, formData, itemMeta, userMap, lineMap]);

  // 承認処理
  const handleApprove = async () => {
    if (!user || !record) return;
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const { error } = await (supabase.from('check_records') as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    }).update({
      status: 'approved',
      approved_by: user.id,
      approved_at: now,
    }).eq('id', record.id);

    if (error) {
      console.error('[ApprovalDetail] Approve failed:', error);
      setIsSubmitting(false);
      return;
    }

    // 操作ログ（id, created_at は自動生成）
    await (supabase.from('operation_logs') as unknown as {
      insert: (values: Record<string, unknown>) => Promise<{ error: unknown }>;
    }).insert({
      user_id: user.id,
      action: 'approve_record',
      target_type: 'check_record',
      target_id: record.id,
      details: {
        product_name: record.product_name,
        production_date: record.production_date,
        batch_number: record.batch_number,
      },
      ip_address: null,
      user_agent: null,
    });

    setShowApproveDialog(false);
    router.push('/approval');
  };

  // 差戻し処理
  const handleReject = async () => {
    if (!user || !record || !rejectReason.trim()) return;
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const { error } = await (supabase.from('check_records') as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    }).update({
      status: 'rejected',
      rejected_by: user.id,
      rejected_at: now,
      reject_reason: rejectReason.trim(),
    }).eq('id', record.id);

    if (error) {
      console.error('[ApprovalDetail] Reject failed:', error);
      setIsSubmitting(false);
      return;
    }

    // 操作ログ（id, created_at は自動生成）
    await (supabase.from('operation_logs') as unknown as {
      insert: (values: Record<string, unknown>) => Promise<{ error: unknown }>;
    }).insert({
      user_id: user.id,
      action: 'reject_record',
      target_type: 'check_record',
      target_id: record.id,
      details: {
        product_name: record.product_name,
        production_date: record.production_date,
        batch_number: record.batch_number,
        reject_reason: rejectReason.trim(),
      },
      ip_address: null,
      user_agent: null,
    });

    setShowRejectDialog(false);
    router.push('/approval');
  };

  // 戻る
  const handleBack = () => {
    router.push('/approval');
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

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-muted-foreground">レコードが見つかりません</p>
          <Button onClick={handleBack} className="mt-4">
            戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Fixed Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-muted-foreground -ml-2"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              戻る
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={pdfGenerating}
                className="text-muted-foreground"
              >
                {pdfGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
              </Button>
              <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                承認待ち
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            {record.product_icon && (
              <span className="text-3xl">{record.product_icon}</span>
            )}
            <div>
              <h1 className="font-bold text-xl text-foreground">
                {record.product_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                バッチ #{record.batch_number}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Record Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4"
          >
            <h2 className="font-bold text-lg mb-3 text-foreground">基本情報</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">製造日</p>
                  <p className="font-medium">{formatDate(record.production_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">バッチ番号</p>
                  <p className="font-medium">#{record.batch_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">製造ライン</p>
                  <p className="font-medium">{record.line_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">提出者</p>
                  <p className="font-medium">{record.submitted_by_name}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-muted-foreground">
                提出日時: {formatDateTime(record.submitted_at)}
              </p>
            </div>
          </motion.div>

          {/* Check Items from template sections */}
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-foreground">{section.name}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {(section.items ?? []).map((item) => {
                  const value = formData[item.id];
                  const displayValue = getDisplayValue(item.type, value);
                  const outOfRange = isOutOfRange(value, item.validation);
                  const meta = itemMeta[item.id];

                  return (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{item.label}</span>
                          {item.unit && (
                            <span className="text-xs text-muted-foreground">
                              ({item.unit})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {outOfRange && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              outOfRange
                                ? 'text-amber-600 dark:text-amber-400'
                                : value === 'ok'
                                  ? 'text-emerald-600'
                                  : value === 'ng'
                                    ? 'text-red-600'
                                    : 'text-foreground'
                            }`}
                          >
                            {displayValue}
                          </span>
                          {item.type === 'ok_ng' && value === 'ok' && (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                      {meta && (
                        <p className="text-xs text-muted-foreground mt-1">
                          入力: {meta.inputByName}{meta.inputAt ? ` / ${formatDateTime(meta.inputAt)}` : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Fixed Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-14 text-base border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => setShowRejectDialog(true)}
          >
            <X className="w-5 h-5 mr-2" />
            差戻し
          </Button>
          <Button
            className="flex-1 h-14 text-base bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowApproveDialog(true)}
          >
            <Check className="w-5 h-5 mr-2" />
            承認する
          </Button>
        </div>
      </motion.footer>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              承認確認
            </DialogTitle>
            <DialogDescription>
              このチェック表を承認しますか？承認後は編集できなくなります。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {record.product_icon && (
                  <span className="text-2xl">{record.product_icon}</span>
                )}
                <div>
                  <p className="font-bold">{record.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    バッチ #{record.batch_number}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                提出者: {record.submitted_by_name}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  処理中...
                </>
              ) : (
                '承認する'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              差戻し
            </DialogTitle>
            <DialogDescription>
              差戻し理由を入力してください。提出者に通知されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="差戻し理由を入力..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || !rejectReason.trim()}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  処理中...
                </>
              ) : (
                '差戻す'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
