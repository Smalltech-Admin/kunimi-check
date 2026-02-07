import type { CheckRecordPDFData } from '@/components/pdf/CheckRecordPDF';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

export async function generateCheckRecordPdf(data: CheckRecordPDFData): Promise<{ openedInNewTab: boolean }> {
  // Dynamic import to avoid SSR issues with @react-pdf/renderer
  const [{ pdf }, { CheckRecordPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/pdf/CheckRecordPDF'),
  ]);

  const blob = await pdf(CheckRecordPDF({ data })).toBlob();

  // Build filename
  const dateStr = data.productionDate.replace(/-/g, '');
  const fileName = `チェック表_${data.productName}_${dateStr}_B${data.batchNumber}.pdf`;

  if (isIOS()) {
    // iOS Safari: 新しいタブでPDFを表示
    // ユーザーはSafariの共有ボタンからファイルに保存/印刷が可能
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // iOS Safariではタブが閉じるまでrevokeしない（遅延解放）
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { openedInNewTab: true };
  } else {
    // PC: 従来のダウンロード方式
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { openedInNewTab: false };
  }
}
