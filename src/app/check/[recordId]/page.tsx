'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Send, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProgressBar } from '@/components/check/ProgressBar';
import { CheckSection } from '@/components/check/CheckSection';
import { CheckItem } from '@/components/check/CheckItem';
import { RepeatableTable } from '@/components/check/RepeatableTable';
import { createClient } from '@/lib/supabase/client';
import { logOperation } from '@/lib/operationLog';
import {
  makeRepeatableKey,
  makeExistingKey,
  expandAllItems,
  buildRepeatableSectionIds,
} from '@/lib/repeatable';
import Link from 'next/link';
import type {
  User,
  Product,
  Section,
  Item,
  Template,
  RecordItem,
  RecordStatus,
} from '@/types';

// エラー型定義
interface CheckError {
  formKey: string;
  itemId: string;
  itemName: string;
  type: 'out_of_range' | 'required' | 'invalid_date' | 'ng_selected';
  message: string;
  severity: 'error' | 'warning';
  value?: string | number | null;
  range?: { min?: number; max?: number };
}

// 重要項目（範囲外時にポップアップ警告を出す項目）
// テンプレートからvalidation付きのnumber項目を自動検出
function getCriticalItemIds(sections: Section[]): string[] {
  return sections
    .flatMap((s) => s.items ?? [])
    .filter((item) => item.type === 'number' && item.validation)
    .map((item) => item.id);
}

type ItemValue = string | number | null;
type FormData = Record<string, ItemValue>;

export default function CheckPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const recordId = params.recordId as string;
  const productId = searchParams.get('product');

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<Array<{ user_id: string; name: string }>>([]);
  const [lines, setLines] = useState<Array<{ id: string; line_code: string; name: string }>>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [showErrorWarning, setShowErrorWarning] = useState(false);
  const [productionDateWarning, setProductionDateWarning] = useState<{
    show: boolean;
    date: string;
    formKey: string;
  }>({ show: false, date: '', formKey: '' });

  // Supabaseに作成されたrecord_id
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(
    recordId !== 'new' ? recordId : null
  );
  // テンプレートID
  const [templateId, setTemplateId] = useState<string | null>(null);
  // レコードのステータス（FSSC22000: 承認後の編集制限）
  const [recordStatus, setRecordStatus] = useState<RecordStatus | null>(null);

  // 既存のrecord_items（変更履歴用に前の値を保持）
  const existingItemsRef = useRef<Record<string, RecordItem>>({});

  // 各項目の入力時刻を記録（FSSC22000対応: 入力された瞬間の時刻を保持）
  const [inputTimestamps, setInputTimestamps] = useState<Record<string, string>>({});

  // 重要項目の範囲外警告用
  const [criticalWarning, setCriticalWarning] = useState<{
    show: boolean;
    item: Item | null;
    value: number | null;
  }>({ show: false, item: null, value: null });

  // 賞味期限エラー警告用（赤いダイアログ）
  const [expiryWarning, setExpiryWarning] = useState<{
    show: boolean;
    item: Item | null;
    expiryDate: string | null;
    productionDate: string | null;
  }>({ show: false, item: null, expiryDate: null, productionDate: null });

  // 承認済みの範囲外値（警告を「このまま続ける」で閉じた項目）
  const [acknowledgedErrors, setAcknowledgedErrors] = useState<Set<string>>(new Set());

  // ユーザー情報取得
  useEffect(() => {
    const sessionData = localStorage.getItem('kunimi_check_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData) as User;
        console.log('[Check] Session user:', { id: parsed.id, user_id: parsed.user_id, name: parsed.name });
        setUser(parsed);
      } catch {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  // Supabaseからマスタデータ取得（製品・ユーザー・ライン・テンプレート）
  useEffect(() => {
    if (!productId) return;

    const fetchMasterData = async () => {
      setIsLoading(true);

      // 製品取得（product_codeで検索）
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_code', productId)
        .eq('is_active', true)
        .single();
      if (productError) {
        console.error('[Check] Product fetch error:', productError, 'product_code:', productId);
      }
      if (productData) {
        setProduct(productData as unknown as Product);
      }

      // ユーザー・ライン一覧を並列取得
      const [usersRes, linesRes] = await Promise.all([
        supabase
          .from('users')
          .select('user_id, name')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('lines')
          .select('id, line_code, name')
          .eq('is_active', true)
          .order('sort_order'),
      ]);
      if (usersRes.data) {
        setUsers(usersRes.data as unknown as Array<{ user_id: string; name: string }>);
      }
      if (linesRes.data) {
        setLines(linesRes.data as unknown as Array<{ id: string; line_code: string; name: string }>);
      }

      // テンプレート取得（製品UUID → テンプレート検索）
      const productUUID = (productData as unknown as Product)?.id;
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('product_id', productUUID || '')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      if (templateError) {
        console.error('[Check] Template fetch error:', templateError, 'product UUID:', productUUID);
      }
      if (templateData) {
        const template = templateData as unknown as Template;
        setTemplateId(template.id);
        if (template.sections) {
          setSections(template.sections);
          // repeatableセクションの行数を初期化
          const initialRowCounts: Record<string, number> = {};
          template.sections.forEach((s: Section) => {
            if (s.repeatable) {
              initialRowCounts[s.id] = s.min_rows || 1;
            }
          });
          setRowCounts(initialRowCounts);
        }
      } else {
        console.warn('[Check] No template found for product UUID:', productUUID);
      }

      // 既存レコードの場合、check_recordsのステータスとrecord_itemsを読み込む
      if (recordId !== 'new') {
        // レコードのステータスを取得（FSSC22000: 承認後の編集制限判定に使用）
        const { data: recordData } = await supabase
          .from('check_records')
          .select('status')
          .eq('id', recordId)
          .single();
        if (recordData) {
          setRecordStatus((recordData as unknown as { status: RecordStatus }).status);
        }

        const { data: recordItems } = await supabase
          .from('record_items')
          .select('*')
          .eq('record_id', recordId);

        if (recordItems) {
          const items = recordItems as unknown as RecordItem[];
          const restoredFormData: FormData = {};
          const existingMap: Record<string, RecordItem> = {};
          const restoredTimestamps: Record<string, string> = {};
          // repeatableセクションIDのセット（テンプレートから構築）
          const repeatableSectionIds = templateData
            ? buildRepeatableSectionIds(
                (templateData as unknown as Template).sections || []
              )
            : new Set<string>();
          // row_indexの最大値を追跡（行数復元用）
          const maxRowBySection: Record<string, number> = {};

          items.forEach((ri) => {
            const rowIdx = ri.row_index ?? 0;
            if (repeatableSectionIds.has(ri.section_id)) {
              // repeatable項目
              const formKey = makeRepeatableKey(ri.item_id, rowIdx);
              restoredFormData[formKey] = ri.value;
              existingMap[makeExistingKey(ri.item_id, rowIdx)] = ri;
              // 入力時刻も復元（FSSC22000対応）
              if (ri.input_at) {
                restoredTimestamps[formKey] = ri.input_at;
              }
              // 最大行数を追跡
              const current = maxRowBySection[ri.section_id] ?? 0;
              maxRowBySection[ri.section_id] = Math.max(current, rowIdx + 1);
            } else {
              // 非repeatable項目
              restoredFormData[ri.item_id] = ri.value;
              existingMap[ri.item_id] = ri;
              // 入力時刻も復元（FSSC22000対応）
              if (ri.input_at) {
                restoredTimestamps[ri.item_id] = ri.input_at;
              }
            }
          });

          setFormData(restoredFormData);
          existingItemsRef.current = existingMap;
          setInputTimestamps(restoredTimestamps);

          // 保存済みデータから行数を復元
          if (Object.keys(maxRowBySection).length > 0) {
            setRowCounts((prev) => {
              const restored = { ...prev };
              Object.entries(maxRowBySection).forEach(([sectionId, maxRow]) => {
                restored[sectionId] = Math.max(restored[sectionId] || 1, maxRow);
              });
              return restored;
            });
          }
        }
      } else {
        // 新規作成時のデフォルト値
        setFormData({});
      }

      setIsLoading(false);
    };

    fetchMasterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, recordId]);

  // 重要項目ID（テンプレートから自動検出）
  const criticalItemIds = useMemo(() => getCriticalItemIds(sections), [sections]);

  // 製造日の項目ID（テンプレートから動的に特定）
  const productionDateItemId = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items ?? []) {
        if (item.type === 'date' && item.label === '製造日') {
          return item.id;
        }
      }
    }
    return null;
  }, [sections]);

  // 全項目（repeatable展開済み）
  const expandedItems = useMemo(
    () => expandAllItems(sections, rowCounts),
    [sections, rowCounts]
  );

  // 範囲チェック関数
  // テンプレートの validation は2形式ある:
  //   range: { type: "range", min: 1, max: 12 }
  //   min/max: { type: "max", value: 10 } または { type: "min", value: 3.5 }
  //   expiry_date: 賞味期限が過去の日付でないか＋製造日以降であるかチェック
  // "value" プロパティは min/max 単独指定時の閾値として使用される
  const isOutOfRange = useCallback(
    (item: Item, value: ItemValue): { invalid: boolean; message?: string } => {
      if (!item.validation || value === null || value === undefined || value === '') {
        return { invalid: false };
      }

      const v = item.validation;

      // 賞味期限チェック（製造日より過去はNG）
      if (v.type === 'expiry_date') {
        const inputDate = new Date(String(value));
        if (isNaN(inputDate.getTime())) return { invalid: false };

        // テンプレートの製造日項目IDからformDataを参照
        const prodDateStr = productionDateItemId
          ? (formData[productionDateItemId] as string | undefined)
          : undefined;
        if (prodDateStr) {
          const prodDate = new Date(prodDateStr);
          prodDate.setHours(0, 0, 0, 0);
          inputDate.setHours(0, 0, 0, 0);
          // 賞味期限が製造日より前（1日以上前）の場合はNG、同日はOK
          if (inputDate < prodDate) {
            return { invalid: true, message: '賞味期限が製造日より前です' };
          }
        }

        return { invalid: false };
      }

      // 数値チェック
      const numValue = Number(value);
      if (isNaN(numValue)) return { invalid: false };

      if (v.type === 'range') {
        const out = (v.min !== undefined && numValue < v.min) || (v.max !== undefined && numValue > v.max);
        return { invalid: out, message: out ? v.message : undefined };
      }
      if (v.type === 'min') {
        const threshold = v.min ?? v.value;
        const out = threshold !== undefined && numValue < threshold;
        return { invalid: out, message: out ? v.message : undefined };
      }
      if (v.type === 'max') {
        const threshold = v.max ?? v.value;
        const out = threshold !== undefined && numValue > threshold;
        return { invalid: out, message: out ? v.message : undefined };
      }
      return { invalid: false };
    },
    [formData, productionDateItemId]
  );

  // エラー一覧を計算
  const errors = useMemo((): CheckError[] => {
    const errorList: CheckError[] = [];

    expandedItems.forEach(({ item, formKey }) => {
      const value = formData[formKey];

      // OK/NGでNGが選択された場合
      if (item.type === 'ok_ng' && value === 'ng') {
        errorList.push({
          formKey,
          itemId: item.id,
          itemName: item.label,
          type: 'ng_selected',
          message: `${item.label}がNGです`,
          severity: 'error',
          value,
        });
      }

      // 範囲外・賞味期限チェック
      if (item.validation && value !== null && value !== undefined && value !== '') {
        const result = isOutOfRange(item, value);
        if (result.invalid) {
          errorList.push({
            formKey,
            itemId: item.id,
            itemName: item.label,
            type: 'out_of_range',
            message: result.message || item.validation.message,
            severity: 'error',
            value,
            range: { min: item.validation.min, max: item.validation.max },
          });
        }
      }
    });

    return errorList;
  }, [formData, expandedItems, isOutOfRange]);

  // セクションごとのエラー数
  const getSectionErrorCount = useCallback(
    (section: Section): number => {
      const sectionItemIds = new Set((section.items ?? []).map((i) => i.id));
      return errors.filter((e) => sectionItemIds.has(e.itemId)).length;
    },
    [errors]
  );

  // セクションのエラーマップ（formKey → message）— RepeatableTable用
  const getSectionErrorMap = useCallback(
    (section: Section): Record<string, string> => {
      const sectionItemIds = new Set((section.items ?? []).map((i) => i.id));
      const map: Record<string, string> = {};
      errors.forEach((e) => {
        if (sectionItemIds.has(e.itemId)) {
          map[e.formKey] = e.message;
        }
      });
      return map;
    },
    [errors]
  );

  // 項目値の更新（formKeyを直接受け取る）
  const handleItemChange = useCallback(
    (formKey: string, value: ItemValue) => {
      // 製造日の入力チェック
      if (productionDateItemId && formKey === productionDateItemId && value && typeof value === 'string') {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);

        // 未来日付はNG → 値を設定しない
        if (inputDate > today) {
          return;
        }

        // 今日以外の日付は確認ポップアップ
        if (inputDate.getTime() !== today.getTime()) {
          setProductionDateWarning({ show: true, date: value, formKey });
          return;
        }
      }

      setFormData((prev) => ({ ...prev, [formKey]: value }));

      // 入力時刻を記録（FSSC22000対応: 各項目の実際の入力時刻を保持）
      // 既存の入力時刻がなく、新しい値が入力された場合のみ記録
      if (value !== null && value !== '') {
        setInputTimestamps((prev) => {
          // 既に入力時刻が記録されている場合は更新しない（初回入力時刻を保持）
          // ただし、値がクリアされて再入力された場合は更新する
          if (!prev[formKey]) {
            return { ...prev, [formKey]: new Date().toISOString() };
          }
          return prev;
        });
      }

      // 対応するテンプレート項目を検索
      const expanded = expandedItems.find((e) => e.formKey === formKey);
      if (!expanded) return;
      const { item } = expanded;

      // 重要項目の範囲外チェック
      if (criticalItemIds.includes(item.id) && value !== null && value !== '') {
        if (item.validation) {
          const result = isOutOfRange(item, value);
          if (result.invalid) {
            if (!acknowledgedErrors.has(formKey)) {
              setCriticalWarning({ show: true, item, value: Number(value) || 0 });
            }
          } else {
            setAcknowledgedErrors((prev) => {
              const next = new Set(prev);
              next.delete(formKey);
              return next;
            });
          }
        }
      }

      // 賞味期限チェック（製造日より前の場合は赤いポップアップ）
      if (item.validation?.type === 'expiry_date' && value !== null && value !== '') {
        const result = isOutOfRange(item, value);
        if (result.invalid) {
          if (!acknowledgedErrors.has(formKey)) {
            const prodDateStr = productionDateItemId
              ? (formData[productionDateItemId] as string | undefined)
              : undefined;
            setExpiryWarning({
              show: true,
              item,
              expiryDate: String(value),
              productionDate: prodDateStr || null,
            });
          }
        } else {
          setAcknowledgedErrors((prev) => {
            const next = new Set(prev);
            next.delete(formKey);
            return next;
          });
        }
      }
    },
    [expandedItems, isOutOfRange, acknowledgedErrors, criticalItemIds, productionDateItemId, formData]
  );

  // 自分を選択（formKeyを直接受け取る）
  const handleSelfSelect = useCallback(
    (formKey: string) => {
      if (user) {
        setFormData((prev) => ({ ...prev, [formKey]: user.user_id }));
        // 入力時刻を記録（FSSC22000対応）
        setInputTimestamps((prev) => {
          if (!prev[formKey]) {
            return { ...prev, [formKey]: new Date().toISOString() };
          }
          return prev;
        });
      }
    },
    [user]
  );

  // 全項目数と入力済み数を計算（repeatable展開済み）
  const totalItems = expandedItems.filter((e) => e.item.required).length;
  const completedItems = expandedItems.filter(
    (e) =>
      e.item.required &&
      formData[e.formKey] !== undefined &&
      formData[e.formKey] !== null &&
      formData[e.formKey] !== ''
  ).length;

  // セクションごとの完了状態（repeatable対応）
  const getSectionCompletion = (section: Section) => {
    const sectionExpanded = expandedItems.filter((e) => e.sectionId === section.id);
    const requiredExpanded = sectionExpanded.filter((e) => e.item.required);
    const completed = requiredExpanded.filter(
      (e) =>
        formData[e.formKey] !== undefined &&
        formData[e.formKey] !== null &&
        formData[e.formKey] !== ''
    ).length;
    return {
      completed,
      total: requiredExpanded.length,
      isComplete: completed === requiredExpanded.length && requiredExpanded.length > 0,
    };
  };

  // 編集可能かどうか（FSSC22000: 承認後の編集制限）
  // draft（下書き）とrejected（差戻し）のみ編集可能。新規作成時（recordStatus === null）も編集可能。
  const isEditable = recordStatus === null || recordStatus === 'draft' || recordStatus === 'rejected';

  // 提出可能かどうか
  const canSubmit = isEditable && completedItems >= totalItems && errors.length === 0;

  // line_codeからUUIDを解決するヘルパー
  const resolveLineId = useCallback(
    (lineCode: string | null): string | null => {
      if (!lineCode) return null;
      const line = lines.find((l) => l.line_code === lineCode);
      return line?.id || null;
    },
    [lines]
  );

  // レコード作成（新規の場合、初回保存時にcheck_recordsテーブルにinsert）
  // id は Supabase が自動生成するので指定しない
  const ensureRecord = useCallback(async (): Promise<string | null> => {
    if (currentRecordId) return currentRecordId;
    if (!user || !productId || !templateId) return null;

    const now = new Date().toISOString();
    const lineUUID = resolveLineId(formData['line'] as string | null);

    // デバッグ: UUID値を確認
    console.log('[ensureRecord] product.id:', product?.id);
    console.log('[ensureRecord] templateId:', templateId);
    console.log('[ensureRecord] user.id:', user.id);
    console.log('[ensureRecord] lineUUID:', lineUUID);

    // 必須UUIDの検証
    if (!product?.id || !user.id) {
      console.error('[ensureRecord] Missing required UUID:', {
        product_id: product?.id,
        user_id: user.id,
      });
      return null;
    }

    const { data, error } = await (supabase.from('check_records') as unknown as {
      insert: (values: Record<string, unknown>) => { select: (cols: string) => { single: () => Promise<{ data: { id: string } | null; error: unknown }> } };
    }).insert({
      template_id: templateId,
      product_id: product.id,
      line_id: lineUUID || null, // 空文字列ではなくnull
      production_date: ((productionDateItemId ? formData[productionDateItemId] : formData['production_date']) as string) || now.split('T')[0],
      batch_number: Number(formData['batch_number']) || 0,
      status: 'draft',
      current_editor_id: user.id,
      created_by: user.id,
      submitted_by: null,
      submitted_at: null,
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      reject_reason: null,
    }).select('id').single();

    if (error || !data) {
      console.error('[ensureRecord] Record creation failed:', error);
      return null;
    }

    const newRecordId = data.id;
    setCurrentRecordId(newRecordId);
    return newRecordId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRecordId, user, productId, product, templateId, formData, lines, resolveLineId]);

  // 写真（data URL）をSupabase Storageにアップロードし、formData内のURLを差し替え
  const uploadPendingPhotos = useCallback(
    async (recId: string) => {
      // photo型の項目IDを収集
      const photoItemIds = new Set<string>();
      sections.forEach((section) => {
        (section.items ?? []).forEach((item) => {
          if (item.type === 'photo') photoItemIds.add(item.id);
        });
      });
      if (photoItemIds.size === 0) return;

      const updates: Record<string, string> = {};

      for (const [formKey, value] of Object.entries(formData)) {
        if (typeof value !== 'string') continue;
        if (!value.startsWith('data:')) continue;

        // formKeyからitemIdを抽出（repeatable: "itemId__row0" → "itemId"）
        const baseItemId = formKey.includes('__') ? formKey.split('__')[0] : formKey;
        if (!photoItemIds.has(baseItemId)) continue;

        try {
          // data URL → Blob変換
          const res = await fetch(value);
          const blob = await res.blob();
          const timestamp = Date.now();
          const path = `${recId}/${baseItemId}/${timestamp}.jpg`;

          const { error: uploadError } = await supabase.storage
            .from('check-photos')
            .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

          if (uploadError) {
            console.error('[uploadPendingPhotos] Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('check-photos')
            .getPublicUrl(path);

          if (urlData?.publicUrl) {
            updates[formKey] = urlData.publicUrl;
          }
        } catch (err) {
          console.error('[uploadPendingPhotos] Error uploading photo:', err);
        }
      }

      // formDataを一括更新
      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
        // saveItemsToSupabaseが最新のformDataを使えるよう、直接返す
        return updates;
      }
      return {};
    },
    [formData, sections, supabase]
  );

  // record_itemsをSupabaseに保存（upsert + 変更履歴）— repeatable対応
  // photoOverrides: uploadPendingPhotosから返されたURL差し替えマップ
  const saveItemsToSupabase = useCallback(
    async (recId: string, photoOverrides?: Record<string, string>) => {
      if (!user) return;
      const now = new Date().toISOString();

      // 写真のdata URLをアップロード後のURLに差し替えたformDataを使用
      const effectiveFormData = photoOverrides
        ? { ...formData, ...photoOverrides }
        : formData;

      // DEBUG: 保存時の状態確認
      const formDataKeys = Object.keys(effectiveFormData).filter((k) => effectiveFormData[k] !== undefined);
      console.log('[saveItems] recId:', recId);
      console.log('[saveItems] sections count:', sections.length);
      console.log('[saveItems] formData keys with values:', formDataKeys.length, formDataKeys);
      console.log('[saveItems] rowCounts:', rowCounts);

      const upsertItems: Array<{
        id: string;
        record_id: string;
        section_id: string;
        item_id: string;
        row_index: number;
        value: string | null;
        input_by: string | null;
        input_at: string;
        updated_by: string | null;
        updated_at: string | null;
      }> = [];
      const changeLogs: Array<{
        id: string;
        record_id: string;
        record_item_id: string | null;
        section_id: string;
        item_id: string;
        old_value: string | null;
        new_value: string | null;
        changed_by: string;
        changed_at: string;
        change_reason: string | null;
        change_type: 'create' | 'update';
      }> = [];

      const processItem = (
        sectionId: string,
        itemId: string,
        formKey: string,
        existingKey: string,
        rowIndex: number
      ) => {
        const rawValue = effectiveFormData[formKey];
        if (rawValue === undefined) return;

        const value = rawValue === null ? null : String(rawValue);
        const existing = existingItemsRef.current[existingKey];

        if (existing) {
          if (existing.value !== value) {
            upsertItems.push({
              id: existing.id,
              record_id: recId,
              section_id: sectionId,
              item_id: itemId,
              row_index: rowIndex,
              value,
              input_by: existing.input_by,
              input_at: existing.input_at,
              updated_by: user.id,
              updated_at: now,
            });
            changeLogs.push({
              id: crypto.randomUUID(),
              record_id: recId,
              record_item_id: existing.id,
              section_id: sectionId,
              item_id: itemId,
              old_value: existing.value,
              new_value: value,
              changed_by: user.id,
              changed_at: now,
              change_reason: null,
              change_type: 'update',
            });
          }
        } else {
          const newId = crypto.randomUUID();
          // FSSC22000対応: 入力時刻は実際に入力された時刻を使用
          // inputTimestampsに記録されていればそれを使用、なければ現在時刻
          const actualInputAt = inputTimestamps[formKey] || now;
          upsertItems.push({
            id: newId,
            record_id: recId,
            section_id: sectionId,
            item_id: itemId,
            row_index: rowIndex,
            value,
            input_by: user.id,
            input_at: actualInputAt,
            updated_by: null,
            updated_at: null,
          });
          changeLogs.push({
            id: crypto.randomUUID(),
            record_id: recId,
            record_item_id: newId,
            section_id: sectionId,
            item_id: itemId,
            old_value: null,
            new_value: value,
            changed_by: user.id,
            changed_at: actualInputAt,
            change_reason: null,
            change_type: 'create',
          });
        }
      };

      sections.forEach((section) => {
        const items = section.items ?? [];
        if (section.repeatable) {
          const rows = rowCounts[section.id] || section.min_rows || 1;
          for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
            items.forEach((item) => {
              const formKey = makeRepeatableKey(item.id, rowIdx);
              const existingKey = makeExistingKey(item.id, rowIdx);
              processItem(section.id, item.id, formKey, existingKey, rowIdx);
            });
          }
        } else {
          items.forEach((item) => {
            processItem(section.id, item.id, item.id, item.id, 0);
          });
        }
      });

      console.log('[saveItems] upsertItems.length:', upsertItems.length);
      if (upsertItems.length > 0) {
        console.log('[saveItems] first 3 upsertItems:', JSON.stringify(upsertItems.slice(0, 3), null, 2));
      } else {
        // upsertItemsが空の場合、formDataキーとsectionアイテムの不一致を調査
        console.warn('[saveItems] upsertItems is EMPTY. Diagnosing...');
        sections.forEach((section) => {
          const items = section.items ?? [];
          console.log(`[saveItems] Section ${section.id} (${section.name}): ${items.length} items, repeatable=${section.repeatable}`);
          items.slice(0, 3).forEach((item) => {
            const fk = section.repeatable ? makeRepeatableKey(item.id, 0) : item.id;
            console.log(`  item ${item.id} → formKey="${fk}" → formData value:`, effectiveFormData[fk]);
          });
        });
      }

      if (upsertItems.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error, status } = await (supabase.from('record_items') as any)
          .upsert(upsertItems, { onConflict: 'id' })
          .select('id');
        console.log('[saveItems] upsert response:', { dataCount: data?.length, error, status });
        if (error) {
          console.error('record_items upsert failed:', error);
        }
      }

      if (changeLogs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: logData, error: logError } = await (supabase.from('item_change_logs') as any)
          .insert(changeLogs)
          .select('id');
        console.log('[saveItems] changeLogs insert response:', { dataCount: logData?.length, error: logError });
        if (logError) {
          console.error('item_change_logs insert failed:', logError);
        }
      }

      // existingItemsRefを更新
      upsertItems.forEach((upserted) => {
        const key =
          upserted.row_index > 0 || sections.find((s) => s.id === upserted.section_id)?.repeatable
            ? makeExistingKey(upserted.item_id, upserted.row_index)
            : upserted.item_id;
        existingItemsRef.current[key] = upserted as unknown as RecordItem;
      });
    },
    [user, sections, formData, rowCounts, supabase, inputTimestamps]
  );

  // 一時保存
  const handleSave = async () => {
    setIsSaving(true);
    console.log('[handleSave] START. formData keys:', Object.keys(formData).length);
    console.log('[handleSave] sections:', sections.length, 'rowCounts:', JSON.stringify(rowCounts));

    const recId = await ensureRecord();
    if (!recId) {
      console.error('[handleSave] ensureRecord returned null');
      setIsSaving(false);
      return;
    }
    console.log('[handleSave] recId:', recId);

    // 写真をSupabase Storageにアップロード（data URL → 公開URL）
    const photoOverrides = await uploadPendingPhotos(recId) || {};
    console.log('[handleSave] photoOverrides:', Object.keys(photoOverrides).length);

    // record_itemsを保存（写真URLの差し替え適用済み）
    await saveItemsToSupabase(recId, photoOverrides);
    console.log('[handleSave] saveItemsToSupabase completed');

    // レコードの基本情報も更新（ライン・日付・バッチ番号）
    const lineUUID = resolveLineId(formData['line'] as string | null);
    await (supabase.from('check_records') as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    }).update({
      line_id: lineUUID || null,
      production_date: ((productionDateItemId ? formData[productionDateItemId] : formData['production_date']) as string) || new Date().toISOString().split('T')[0],
      batch_number: Number(formData['batch_number']) || 0,
      current_editor_id: user?.id || null,
    }).eq('id', recId);

    setIsSaving(false);
    setShowSaveSuccess(true);
  };

  // 提出確認
  const handleSubmitClick = () => {
    if (completedItems < totalItems) {
      setShowIncompleteWarning(true);
      return;
    }
    if (errors.length > 0) {
      setShowErrorWarning(true);
      return;
    }
    setShowSubmitConfirm(true);
  };

  // 提出実行
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowSubmitConfirm(false);

    const recId = await ensureRecord();
    if (!recId || !user) {
      setIsSubmitting(false);
      return;
    }

    // 写真をSupabase Storageにアップロード（data URL → 公開URL）
    const photoOverrides = await uploadPendingPhotos(recId) || {};

    // まず全項目を保存（写真URLの差し替え適用済み）
    await saveItemsToSupabase(recId, photoOverrides);

    const now = new Date().toISOString();

    // レコードステータスをsubmittedに更新
    const submitLineUUID = resolveLineId(formData['line'] as string | null);
    const { error } = await (supabase.from('check_records') as unknown as {
      update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    }).update({
      status: 'submitted',
      submitted_by: user.id,
      submitted_at: now,
      current_editor_id: null,
      line_id: submitLineUUID || null,
      production_date: ((productionDateItemId ? formData[productionDateItemId] : formData['production_date']) as string) || now.split('T')[0],
      batch_number: Number(formData['batch_number']) || 0,
    }).eq('id', recId);

    if (error) {
      console.error('Submit failed:', error);
      setIsSubmitting(false);
      return;
    }

    // 操作ログ（API経由でIP/User-Agentを記録）
    await logOperation({
      user_id: user.id,
      action: 'submit_record',
      target_type: 'check_record',
      target_id: recId,
      details: {
        product_id: product?.id,
        product_code: productId,
        production_date: (productionDateItemId ? formData[productionDateItemId] : formData['production_date']),
        batch_number: formData['batch_number'],
      },
    });

    setIsSubmitting(false);
    setShowSubmitSuccess(true);
  };

  // 成功ダイアログを閉じてホームへ
  const handleSuccessClose = () => {
    setShowSubmitSuccess(false);
    router.push('/home');
  };

  // 戻る
  const handleBack = () => {
    router.push('/home');
  };

  // 重要項目警告を「このまま続ける」で閉じる
  const handleAcknowledgeCriticalWarning = () => {
    if (criticalWarning.item) {
      // formKeyベースで承認（repeatable考慮: 同一item.idでも異なるformKey）
      // ここでは該当item.idの全formKeyを承認する
      const itemId = criticalWarning.item.id;
      setAcknowledgedErrors((prev) => {
        const next = new Set(prev);
        expandedItems
          .filter((e) => e.item.id === itemId)
          .forEach((e) => next.add(e.formKey));
        return next;
      });
    }
    setCriticalWarning({ show: false, item: null, value: null });
  };

  // 重要項目警告を「確認して修正」で閉じる
  const handleFixCriticalWarning = () => {
    setCriticalWarning({ show: false, item: null, value: null });
  };

  // 賞味期限警告を「このまま続ける」で閉じる
  const handleAcknowledgeExpiryWarning = () => {
    if (expiryWarning.item) {
      const itemId = expiryWarning.item.id;
      setAcknowledgedErrors((prev) => {
        const next = new Set(prev);
        expandedItems
          .filter((e) => e.item.id === itemId)
          .forEach((e) => next.add(e.formKey));
        return next;
      });
    }
    setExpiryWarning({ show: false, item: null, expiryDate: null, productionDate: null });
  };

  // 賞味期限警告を「確認して修正」で閉じる
  const handleFixExpiryWarning = () => {
    setExpiryWarning({ show: false, item: null, expiryDate: null, productionDate: null });
  };

  // repeatable行の追加
  const handleAddRow = useCallback(
    (sectionId: string) => {
      setRowCounts((prev) => ({
        ...prev,
        [sectionId]: (prev[sectionId] || 1) + 1,
      }));
    },
    []
  );

  // repeatable行の削除
  const handleRemoveRow = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      const minRows = section?.min_rows || 1;
      setRowCounts((prev) => {
        const currentRows = prev[sectionId] || 1;
        if (currentRows <= minRows) return prev;
        const newRows = currentRows - 1;
        // 削除行のformDataをクリア
        const items = section?.items ?? [];
        setFormData((fd) => {
          const updated = { ...fd };
          items.forEach((item) => {
            const key = makeRepeatableKey(item.id, newRows);
            delete updated[key];
          });
          return updated;
        });
        return { ...prev, [sectionId]: newRows };
      });
    },
    [sections]
  );

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

  if (sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <XCircle className="w-14 h-14 text-red-400 mx-auto" />
          <p className="text-xl font-medium text-foreground">テンプレートが見つかりません</p>
          <p className="text-muted-foreground text-lg">この製品のチェック表テンプレートが登録されていません。</p>
          <Button onClick={handleBack}>ホームに戻る</Button>
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
            {/* Back button */}
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 px-5 text-base font-medium border-2 border-slate-300 hover:border-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              戻る
            </Button>

            {/* Progress with error badge */}
            <div className="flex items-center gap-3">
              <span
                className={`text-xl font-bold ${
                  errors.length > 0 ? 'text-red-600' : 'text-primary'
                }`}
              >
                {completedItems}/{totalItems}項目 {totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%
              </span>
              {errors.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-base font-medium rounded-full">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.length}
                </span>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-3 flex items-center gap-3">
            {product?.icon && <span className="text-3xl">{product.icon}</span>}
            <div>
              <h1 className="font-bold text-xl text-foreground">
                {product?.name || '新規チェック表'}
              </h1>
              <p className="text-base text-muted-foreground">
                {(productionDateItemId ? formData[productionDateItemId] : formData['production_date']) || '日付未設定'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <ProgressBar
              current={completedItems}
              total={totalItems}
              errorCount={errors.length}
              showLabel={false}
            />
          </div>
        </div>
      </motion.header>

      {/* Scrollable Content - pb-56 ensures content doesn't hide behind fixed footer */}
      <main className="flex-1 overflow-y-auto pb-56">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* FSSC22000: 編集不可時のバナー */}
          {!isEditable && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
              <p className="text-lg font-medium text-amber-800">
                このチェック表は
                {recordStatus === 'approved' ? '承認済み' : '提出済み'}
                のため編集できません。
              </p>
              <Link
                href={`/history/${recordId}`}
                className="text-lg text-primary underline mt-1 inline-block"
              >
                履歴画面で確認する →
              </Link>
            </div>
          )}
          {sections.map((section, index) => {
            const completion = getSectionCompletion(section);
            const sectionErrorCount = getSectionErrorCount(section);
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CheckSection
                  section={section}
                  defaultOpen={index === 0}
                  isComplete={completion.isComplete}
                  completedCount={completion.completed}
                  totalCount={completion.total}
                  errorCount={sectionErrorCount}
                >
                  {section.repeatable ? (
                    <RepeatableTable
                      section={section}
                      formData={formData}
                      rowCount={rowCounts[section.id] || section.min_rows || 1}
                      onItemChange={handleItemChange}
                      onSelfSelect={handleSelfSelect}
                      onAddRow={() => handleAddRow(section.id)}
                      onRemoveRow={() => handleRemoveRow(section.id)}
                      users={users}
                      lines={lines}
                      errorMap={getSectionErrorMap(section)}
                      canAddRow={
                        (rowCounts[section.id] || section.min_rows || 1) <
                        (section.max_rows || 999)
                      }
                      canRemoveRow={
                        (rowCounts[section.id] || section.min_rows || 1) >
                        (section.min_rows || 1)
                      }
                      disabled={!isEditable}
                    />
                  ) : (
                    (section.items ?? []).map((item) => {
                      const itemError = errors.find((e) => e.formKey === item.id);
                      // 製造日項目には「今日」ボタンを自動付与
                      const enhancedItem = item.type === 'date' && item.label === '製造日'
                        ? { ...item, allow_today_button: true }
                        : item;
                      return (
                        <CheckItem
                          key={item.id}
                          item={enhancedItem}
                          value={formData[item.id] ?? null}
                          onChange={(value) => handleItemChange(item.id, value)}
                          onSelfSelect={() => handleSelfSelect(item.id)}
                          users={users}
                          lines={lines}
                          disabled={!isEditable}
                          hasError={!!itemError}
                          errorMessage={itemError?.message}
                        />
                      );
                    })
                  )}
                </CheckSection>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Fixed Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          {/* FSSC22000: 編集不可時は操作ボタンの代わりに案内を表示 */}
          {!isEditable ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 text-base"
                onClick={handleBack}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                ホームに戻る
              </Button>
              <Link href={`/history/${recordId}`} className="flex-1">
                <Button className="w-full h-14 text-base bg-primary hover:bg-primary/90">
                  履歴画面で確認
                </Button>
              </Link>
            </div>
          ) : (
          <>
          {/* エラーメッセージ */}
          {errors.length > 0 && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-base text-red-700 dark:text-red-300">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>範囲外の値が {errors.length} 件あります。修正してください。</span>
            </div>
          )}

          <div className="flex gap-3">
            {/* Save button */}
            <Button
              variant="outline"
              className="flex-1 h-14 text-base"
              onClick={handleSave}
              disabled={isSubmitting || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  一時保存
                </>
              )}
            </Button>

            {/* Submit button */}
            <Button
              className={`flex-1 h-14 text-base ${
                canSubmit
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-slate-400 hover:bg-slate-400 cursor-not-allowed'
              }`}
              onClick={handleSubmitClick}
              disabled={isSubmitting || isSaving || !canSubmit}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  提出する
                </>
              )}
            </Button>
          </div>
          </>
          )}
        </div>
      </motion.footer>

      {/* 重要項目範囲外警告ダイアログ */}
      <Dialog
        open={criticalWarning.show}
        onOpenChange={(open) => {
          if (!open) handleFixCriticalWarning();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              確認してください
            </DialogTitle>
            <DialogDescription>
              {criticalWarning.item && (
                <>
                  <span className="font-medium text-foreground">
                    {criticalWarning.item.label}
                  </span>
                  が基準値（
                  {criticalWarning.item.validation?.min !== undefined &&
                  criticalWarning.item.validation?.max !== undefined
                    ? `${criticalWarning.item.validation.min}〜${criticalWarning.item.validation.max}${criticalWarning.item.unit || ''}`
                    : criticalWarning.item.validation?.min !== undefined
                      ? `${criticalWarning.item.validation.min}${criticalWarning.item.unit || ''}以上`
                      : `${criticalWarning.item.validation?.max}${criticalWarning.item.unit || ''}以下`}
                  ）を超えています。
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {criticalWarning.value}
                {criticalWarning.item?.unit || ''}
              </p>
              <p className="text-base text-amber-600 dark:text-amber-400 mt-1">入力値</p>
            </div>
          </div>
          <div className="text-base text-muted-foreground mb-4">
            このまま続けますか？それとも確認して修正しますか？
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleFixCriticalWarning}>
              確認して修正
            </Button>
            <Button
              onClick={handleAcknowledgeCriticalWarning}
              className="bg-amber-600 hover:bg-amber-700"
            >
              このまま続ける
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 賞味期限エラー警告 - 大葉ミンチP001はフルスクリーン、大葉ミンチ（簡易版）P002は通常ダイアログ */}
      {expiryWarning.show && (product?.product_code === 'P001' || productId === 'P001') ? (
        /* 大葉ミンチ用: フルスクリーン警告オーバーレイ（Dialogを使わない） */
        <div
          className="fixed inset-0 z-[9999] bg-red-600 flex flex-col"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          {/* 上部: 警告アイコンとタイトル */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center mb-8 shadow-2xl animate-pulse">
              <XCircle className="w-20 h-20 md:w-28 md:h-28 text-red-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white text-center mb-4">
              ⚠️ 賞味期限エラー ⚠️
            </h1>
            <p className="text-xl md:text-3xl text-red-100 font-bold text-center">
              賞味期限が製造日より前の日付です！
            </p>
          </div>

          {/* 中央: 日付表示（情報表示のみ、ボタンではない） */}
          <div className="px-6 md:px-16 py-6 space-y-6">
            <div className="text-center">
              <span className="text-lg md:text-2xl font-bold text-red-200 uppercase tracking-wider">賞味期限</span>
              <div className="text-5xl md:text-7xl font-black text-white mt-2 border-b-4 border-red-300/50 pb-4">
                {expiryWarning.expiryDate || '-'}
              </div>
            </div>
            <div className="text-center">
              <span className="text-base md:text-xl font-semibold text-red-200/80">製造日</span>
              <div className="text-3xl md:text-5xl font-bold text-red-100 mt-2">
                {expiryWarning.productionDate || '未入力'}
              </div>
            </div>
          </div>

          {/* 下部: ボタン */}
          <div className="px-6 md:px-16 pb-10 pt-4 space-y-4">
            <Button
              onClick={handleFixExpiryWarning}
              className="w-full h-20 md:h-24 text-2xl md:text-3xl font-black bg-white hover:bg-gray-100 text-red-600 rounded-3xl shadow-2xl animate-pulse"
            >
              確認して修正する
            </Button>
            <Button
              variant="ghost"
              onClick={handleAcknowledgeExpiryWarning}
              className="w-full h-14 md:h-16 text-lg md:text-xl text-red-200 hover:text-white hover:bg-red-500/50 rounded-2xl"
            >
              このまま続ける（非推奨）
            </Button>
          </div>
        </div>
      ) : expiryWarning.show ? (
        /* 大葉ミンチ（簡易版）P002およびその他製品用: 通常の警告ダイアログ */
        <Dialog
          open={expiryWarning.show}
          onOpenChange={(open) => {
            if (!open) handleFixExpiryWarning();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                賞味期限エラー
              </DialogTitle>
              <DialogDescription>
                {expiryWarning.item && (
                  <>
                    <span className="font-medium text-foreground">
                      {expiryWarning.item.label}
                    </span>
                    が製造日より前の日付になっています。
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-base text-red-600 dark:text-red-400">賞味期限</span>
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">
                    {expiryWarning.expiryDate || '-'}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-base text-muted-foreground">製造日</span>
                  <span className="text-lg font-medium text-foreground">
                    {expiryWarning.productionDate || '未入力'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-base text-muted-foreground mb-4">
              このまま続けますか？それとも確認して修正しますか？
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleFixExpiryWarning}>
                確認して修正
              </Button>
              <Button
                onClick={handleAcknowledgeExpiryWarning}
                className="bg-red-600 hover:bg-red-700"
              >
                このまま続ける
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* 保存成功ダイアログ */}
      <Dialog open={showSaveSuccess} onOpenChange={setShowSaveSuccess}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              保存完了
            </DialogTitle>
            <DialogDescription className="text-center">
              チェック表を一時保存しました。
              <br />
              続きはいつでも入力できます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSaveSuccess(false)} className="w-full">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 未完了警告ダイアログ */}
      <Dialog open={showIncompleteWarning} onOpenChange={setShowIncompleteWarning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              入力未完了
            </DialogTitle>
            <DialogDescription className="text-center">
              すべての必須項目を入力してください。
              <br />
              <span className="font-medium text-amber-600">
                残り {totalItems - completedItems} 項目
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowIncompleteWarning(false)} className="w-full">
              入力を続ける
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 製造日確認ダイアログ */}
      <Dialog
        open={productionDateWarning.show}
        onOpenChange={(open) => {
          if (!open) setProductionDateWarning({ show: false, date: '', formKey: '' });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              確認してください
            </DialogTitle>
            <DialogDescription>
              製造日が本日の日付ではありません。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {productionDateWarning.date}
              </p>
              <p className="text-base text-amber-600 dark:text-amber-400 mt-1">入力された製造日</p>
            </div>
          </div>
          <div className="text-base text-muted-foreground mb-4">
            この日付で続けますか？それとも修正しますか？
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setProductionDateWarning({ show: false, date: '', formKey: '' })}
            >
              修正する
            </Button>
            <Button
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  [productionDateWarning.formKey]: productionDateWarning.date,
                }));
                setProductionDateWarning({ show: false, date: '', formKey: '' });
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              このまま続ける
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* エラーあり警告ダイアログ */}
      <Dialog open={showErrorWarning} onOpenChange={setShowErrorWarning}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center text-red-600">
              <XCircle className="w-6 h-6" />
              範囲外エラー
            </DialogTitle>
            <DialogDescription className="text-center">
              範囲外の値があるため提出できません。
              <br />
              <span className="font-medium text-red-600">{errors.length} 件のエラー</span>
              を修正してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="max-h-40 overflow-y-auto space-y-2">
              {errors.map((error) => (
                <div
                  key={error.formKey}
                  className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-base"
                >
                  <p className="font-medium text-red-700 dark:text-red-300">
                    {error.itemName}
                  </p>
                  <p className="text-red-600 dark:text-red-400">{error.message}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowErrorWarning(false)} className="w-full">
              修正する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提出確認ダイアログ */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-6 h-6 text-primary" />
              提出確認
            </DialogTitle>
            <DialogDescription>
              チェック表を提出しますか？提出後は管理者の承認が必要です。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {product?.icon && <span className="text-2xl">{product.icon}</span>}
                <div>
                  <p className="font-bold">{product?.name}</p>
                  <p className="text-base text-muted-foreground">
                    {(productionDateItemId ? formData[productionDateItemId] : formData['production_date']) || '日付未設定'}
                  </p>
                </div>
              </div>
              <div className="text-base text-muted-foreground">
                <p>バッチ番号: #{formData['batch_number'] || '-'}</p>
                <p>
                  入力項目: {completedItems}/{totalItems} 完了
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit}>提出する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提出成功ダイアログ */}
      <Dialog open={showSubmitSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
              </motion.div>
            </div>
            <DialogTitle className="text-center text-xl">提出完了</DialogTitle>
            <DialogDescription className="text-center">
              チェック表を提出しました。
              <br />
              管理者の承認をお待ちください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
              <p className="text-base text-emerald-700 dark:text-emerald-300">
                承認されるとホーム画面の履歴から
                <br />
                確認できるようになります。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSuccessClose} className="w-full h-12 text-base">
              ホームに戻る
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
