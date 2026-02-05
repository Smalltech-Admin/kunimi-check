import type { CheckRecordPDFData } from '@/components/pdf/CheckRecordPDF';

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

  // Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
