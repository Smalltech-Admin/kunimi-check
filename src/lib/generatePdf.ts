import type { CheckRecordPDFData } from '@/components/pdf/CheckRecordPDF';

/**
 * iOS/iPadOS判定（PWA含む）
 * iPadOS 13+は "Macintosh" と表示されるため、タッチ対応も併せて判定
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

/**
 * PDF生成・ダウンロード（PC専用）
 * iPadではこの関数を呼び出さない（UIで非表示にする）
 */
export async function generateCheckRecordPdf(data: CheckRecordPDFData): Promise<void> {
  // Dynamic import to avoid SSR issues with @react-pdf/renderer
  const [{ pdf }, { CheckRecordPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/pdf/CheckRecordPDF'),
  ]);

  const blob = await pdf(CheckRecordPDF({ data })).toBlob();

  // Build filename
  const dateStr = data.productionDate.replace(/-/g, '');
  const fileName = `チェック表_${data.productName}_${dateStr}_B${data.batchNumber}.pdf`;

  // PC: ダウンロード方式
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 少し遅延してからrevokeすることで確実にダウンロードを完了させる
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
