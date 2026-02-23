'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Hash,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { generateCheckRecordPdf, isIOSDevice } from '@/lib/generatePdf';
import type { CheckRecordPDFData, ItemMeta } from '@/components/pdf/CheckRecordPDF';
import type { User, Section } from '@/types';
import { Monitor } from 'lucide-react';

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
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
  product_name: string;
  product_icon: string | null;
  line_name: string;
  submitted_by_name: string;
  approved_by_name: string | null;
  rejected_by_name: string | null;
}

export default function HistoryDetailPage() {
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
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // iOS判定（クライアントサイドのみ）
  useEffect(() => {
    setIsIOS(isIOSDevice());
  }, []);

  // Session
  useEffect(() => {
    const sessionData = localStorage.getItem('kunimi_check_session');
    if (sessionData) {
      try {
        setUser(JSON.parse(sessionData) as User);
      } catch {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  // Fetch record detail
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      const { data: recordData, error: recordError } = await supabase
        .from('check_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (recordError || !recordData) {
        console.error('[HistoryDetail] Record fetch error:', recordError);
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
        approved_by: string | null;
        approved_at: string | null;
        rejected_by: string | null;
        rejected_at: string | null;
        reject_reason: string | null;
      };

      const [productRes, usersRes, linesRes, templateRes, itemsRes] = await Promise.all([
        supabase.from('products').select('id, name, icon').eq('id', raw.product_id).single(),
        supabase.from('users').select('id, user_id, name').eq('is_active', true),
        supabase.from('lines').select('id, line_code, name').eq('is_active', true),
        supabase.from('templates').select('*').eq('id', raw.template_id).single(),
        supabase.from('record_items').select('*').eq('record_id', recordId),
      ]);

      // Line name
      let lineName = '不明';
      if (raw.line_id) {
        const lineRes = await supabase.from('lines').select('id, name').eq('id', raw.line_id).single();
        const lineData = lineRes.data as { id: string; name: string } | null;
        if (lineData) lineName = lineData.name;
      }

      const product = productRes.data as { id: string; name: string; icon: string | null } | null;

      // User map
      const uMap = new Map<string, string>();
      if (usersRes.data) {
        (usersRes.data as Array<{ id: string; user_id: string; name: string }>).forEach((u) => {
          uMap.set(u.id, u.name);
          uMap.set(u.user_id, u.name);
        });
      }
      setUserMap(uMap);

      // Line map
      const lMap = new Map<string, string>();
      if (linesRes.data) {
        (linesRes.data as Array<{ id: string; line_code: string; name: string }>).forEach((l) => {
          lMap.set(l.id, l.name);
          lMap.set(l.line_code, l.name);
        });
      }
      setLineMap(lMap);

      setRecord({
        ...raw,
        product_name: product?.name || '不明な製品',
        product_icon: product?.icon || null,
        line_name: lineName,
        submitted_by_name: raw.submitted_by ? (uMap.get(raw.submitted_by) || '不明') : '不明',
        approved_by_name: raw.approved_by ? (uMap.get(raw.approved_by) || null) : null,
        rejected_by_name: raw.rejected_by ? (uMap.get(raw.rejected_by) || null) : null,
      });

      // Template sections
      const templateData = templateRes.data as unknown as { sections: Section[] } | null;
      if (templateData?.sections) {
        setSections(templateData.sections);
      }

      // Record items (value + input metadata)
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

  // PDF（PC専用）
  const handleDownloadPdf = useCallback(async () => {
    if (!record || isIOS) return;
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
        approvedByName: record.approved_by_name,
        approvedAt: record.approved_at,
        rejectedByName: record.rejected_by_name,
        rejectedAt: record.rejected_at,
        rejectReason: record.reject_reason,
        status: record.status,
        sections,
        formData,
        itemMeta,
        userMap,
        lineMap,
      };

      await generateCheckRecordPdf(pdfData);
    } catch (err) {
      console.error('[HistoryDetail] PDF generation error:', err);
    } finally {
      setPdfGenerating(false);
    }
  }, [record, sections, formData, itemMeta, userMap, lineMap, isIOS]);

  // Date formatting
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

  const getDisplayValue = (type: string, value: string | number | null): string => {
    if (value === null || value === undefined || value === '') return '未入力';
    switch (type) {
      case 'ok_ng':
        return value === 'ok' ? 'OK' : 'NG';
      case 'user_select':
        return userMap.get(String(value)) || String(value);
      case 'line_select':
        return lineMap.get(String(value)) || String(value);
      case 'date':
        return formatDate(String(value));
      default:
        return String(value);
    }
  };

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
    if (validation.type === 'min') return validation.min !== undefined && numValue < validation.min;
    if (validation.type === 'max') return validation.max !== undefined && numValue > validation.max;
    return false;
  };

  const handleBack = () => {
    router.push('/history');
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
          <Button onClick={handleBack} className="mt-4">戻る</Button>
        </div>
      </div>
    );
  }

  const statusBadge = record.status === 'approved' ? (
    <span className="px-3 py-1 text-lg font-medium bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
      <CheckCircle className="w-4 h-4" />
      承認済み
    </span>
  ) : (
    <span className="px-3 py-1 text-lg font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
      <XCircle className="w-4 h-4" />
      差戻し
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
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
              履歴
            </Button>
            <div className="flex items-center gap-2">
              {/* PDFボタン（PC専用） */}
              {!isIOS && (
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
              )}
              {statusBadge}
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
              <p className="text-xl text-muted-foreground">
                バッチ #{record.batch_number}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4"
          >
            <h2 className="font-bold text-lg mb-3 text-foreground">基本情報</h2>
            <div className="grid grid-cols-2 gap-4 text-xl">
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
              <p className="text-xl text-muted-foreground">
                提出日時: {formatDateTime(record.submitted_at)}
              </p>
            </div>
          </motion.div>

          {/* Reject reason */}
          {record.status === 'rejected' && record.reject_reason && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-700 dark:text-red-400">差戻し理由</h3>
              </div>
              <p className="text-xl text-red-600 dark:text-red-300">
                {record.reject_reason}
              </p>
            </motion.div>
          )}

          {/* Check Sections */}
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
                  <p className="text-xl text-muted-foreground">{section.description}</p>
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
                          <span className="text-xl text-foreground">{item.label}</span>
                          {item.unit && (
                            <span className="text-lg text-muted-foreground">({item.unit})</span>
                          )}
                        </div>
                        {item.type !== 'photo' && (
                        <div className="flex items-center gap-2">
                          {outOfRange && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          <span
                            className={`text-xl font-medium ${
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
                        )}
                      </div>
                      {item.type === 'photo' && value && typeof value === 'string' && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={value}
                            alt={item.label}
                            className="w-full max-h-64 object-contain bg-slate-100 dark:bg-slate-800"
                          />
                        </div>
                      )}
                      {item.type === 'photo' && (!value || value === '') && (
                        <p className="mt-2 text-lg text-muted-foreground">未撮影</p>
                      )}
                      {meta && (
                        <p className="text-lg text-muted-foreground mt-1">
                          入力: {meta.inputByName}{meta.inputAt ? ` / ${formatDateTime(meta.inputAt)}` : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Approval Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections.length * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4"
          >
            <h2 className="font-bold text-lg mb-3 text-foreground">承認情報</h2>
            <div className="space-y-3 text-xl">
              <div className="flex justify-between">
                <span className="text-muted-foreground">提出者</span>
                <span className="font-medium">{record.submitted_by_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">提出日時</span>
                <span className="font-medium">{formatDateTime(record.submitted_at)}</span>
              </div>
              {record.status === 'approved' && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
                    <span className="text-muted-foreground">承認者</span>
                    <span className="font-medium text-emerald-600">{record.approved_by_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">承認日時</span>
                    <span className="font-medium">{formatDateTime(record.approved_at)}</span>
                  </div>
                </>
              )}
              {record.status === 'rejected' && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between">
                    <span className="text-muted-foreground">差戻し者</span>
                    <span className="font-medium text-red-600">{record.rejected_by_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">差戻し日時</span>
                    <span className="font-medium">{formatDateTime(record.rejected_at)}</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* PDF Download (large button at bottom) - PC専用 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sections.length + 1) * 0.05 }}
          >
            {isIOS ? (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 text-center">
                <Monitor className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">
                  PDF出力はPCから行ってください
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-14 text-base gap-2"
                onClick={handleDownloadPdf}
                disabled={pdfGenerating}
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    PDF生成中...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    PDF出力
                  </>
                )}
              </Button>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
