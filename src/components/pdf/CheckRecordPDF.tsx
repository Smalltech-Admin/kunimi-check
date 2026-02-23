import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Section } from '@/types';

// Noto Sans JP フォント登録
Font.register({
  family: 'NotoSansJP',
  src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY0rw-oME.ttf',
});

// 項目ごとの入力メタデータ
export interface ItemMeta {
  inputByName: string;
  inputAt: string | null;
}

// PDF用データ型
export interface CheckRecordPDFData {
  productName: string;
  productIcon: string | null;
  productionDate: string;
  batchNumber: number;
  lineName: string;
  submittedByName: string;
  submittedAt: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedByName: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  status: string;
  sections: Section[];
  formData: Record<string, string | number | null>;
  itemMeta: Record<string, ItemMeta>;
  userMap: Map<string, string>;
  lineMap: Map<string, string>;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: '#1e293b',
  },
  // Header
  headerContainer: {
    marginBottom: 20,
    borderBottom: '2px solid #059669',
    paddingBottom: 12,
  },
  companyName: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerMetaLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  headerMetaItem: {
    fontSize: 10,
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusApproved: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusOther: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  // Basic info
  infoCard: {
    marginBottom: 16,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  infoCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  infoItem: {
    width: '50%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 10,
    color: '#1e293b',
  },
  // Section
  sectionContainer: {
    marginBottom: 12,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 22,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#fafbfc',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  colLabel: {
    width: '35%',
  },
  colValue: {
    width: '20%',
  },
  colUnit: {
    width: '10%',
  },
  colInput: {
    width: '35%',
    textAlign: 'right' as const,
  },
  inputMeta: {
    fontSize: 7,
    color: '#94a3b8',
  },
  valueOk: {
    color: '#059669',
    fontWeight: 'bold',
  },
  valueNg: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  valueEmpty: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  photoRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottom: '1px solid #f1f5f9',
  },
  photoLabel: {
    fontSize: 9,
    color: '#334155',
    marginBottom: 4,
  },
  photoImage: {
    maxHeight: 120,
    objectFit: 'contain' as const,
  },
  // Approval info
  approvalCard: {
    marginTop: 16,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  approvalRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottom: '1px solid #f1f5f9',
  },
  approvalLabel: {
    fontSize: 9,
    color: '#64748b',
    width: '30%',
  },
  approvalValue: {
    fontSize: 9,
    color: '#1e293b',
    width: '70%',
  },
  rejectReasonBox: {
    margin: 10,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    border: '1px solid #fecaca',
  },
  rejectReasonLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 2,
  },
  rejectReasonText: {
    fontSize: 9,
    color: '#7f1d1d',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

// Date formatting helpers
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDisplayValue(
  type: string,
  value: string | number | null,
  userMap: Map<string, string>,
  lineMap: Map<string, string>
): string {
  if (value === null || value === undefined || value === '') return '';

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
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return '承認済み';
    case 'rejected':
      return '差戻し';
    case 'submitted':
      return '承認待ち';
    case 'draft':
      return '下書き';
    default:
      return status;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'approved':
      return styles.statusApproved;
    case 'rejected':
      return styles.statusRejected;
    default:
      return styles.statusOther;
  }
}

export function CheckRecordPDF({ data }: { data: CheckRecordPDFData }) {
  const exportDateTime = new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.companyName}>くにみ農産加工</Text>
          <Text style={styles.title}>製造工程チェック表</Text>
          <View style={styles.headerMeta}>
            <View style={styles.headerMetaLeft}>
              <Text style={styles.headerMetaItem}>
                {data.productName}
              </Text>
              <Text style={styles.headerMetaItem}>
                {formatDate(data.productionDate)}
              </Text>
              <Text style={styles.headerMetaItem}>
                Batch #{data.batchNumber}
              </Text>
            </View>
            <View style={[styles.statusBadge, getStatusStyle(data.status)]}>
              <Text>{getStatusLabel(data.status)}</Text>
            </View>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>基本情報</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>製造日</Text>
              <Text style={styles.infoValue}>
                {formatDate(data.productionDate)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>バッチ番号</Text>
              <Text style={styles.infoValue}>#{data.batchNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>製造ライン</Text>
              <Text style={styles.infoValue}>{data.lineName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>担当者</Text>
              <Text style={styles.infoValue}>{data.submittedByName}</Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        {data.sections.map((section) => (
          <View key={section.id} style={styles.sectionContainer} wrap={false}>
            <Text style={styles.sectionHeader}>{section.name}</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colLabel]}>
                項目
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colValue]}>値</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>
                単位
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colInput]}>
                入力者 / 日時
              </Text>
            </View>
            {(section.items ?? []).map((item, idx) => {
              const rawValue = data.formData[item.id];

              // Photo type: render image instead of table row
              if (item.type === 'photo') {
                return (
                  <View key={item.id} style={styles.photoRow}>
                    <Text style={styles.photoLabel}>{item.label}</Text>
                    {rawValue && typeof rawValue === 'string' ? (
                      <Image src={rawValue} style={styles.photoImage} />
                    ) : (
                      <Text style={styles.valueEmpty}>未撮影</Text>
                    )}
                  </View>
                );
              }

              const displayValue = getDisplayValue(
                item.type,
                rawValue,
                data.userMap,
                data.lineMap
              );
              const isEmpty = rawValue === null || rawValue === undefined || rawValue === '';
              const isOk = item.type === 'ok_ng' && rawValue === 'ok';
              const isNg = item.type === 'ok_ng' && rawValue === 'ng';
              const meta = data.itemMeta[item.id];

              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colLabel]}>
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colValue,
                      isOk ? styles.valueOk : {},
                      isNg ? styles.valueNg : {},
                      isEmpty ? styles.valueEmpty : {},
                    ]}
                  >
                    {isEmpty ? '未入力' : displayValue}
                  </Text>
                  <Text style={[styles.tableCell, styles.colUnit]}>
                    {item.unit || ''}
                  </Text>
                  <View style={[styles.colInput]}>
                    {meta ? (
                      <Text style={styles.inputMeta}>
                        {meta.inputByName}{meta.inputAt ? ` / ${formatDateTime(meta.inputAt)}` : ''}
                      </Text>
                    ) : (
                      <Text style={styles.inputMeta}>-</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Approval Info */}
        <View style={styles.approvalCard} wrap={false}>
          <Text style={styles.infoCardTitle}>承認情報</Text>
          <View style={styles.approvalRow}>
            <Text style={styles.approvalLabel}>提出者</Text>
            <Text style={styles.approvalValue}>
              {data.submittedByName}
            </Text>
          </View>
          <View style={styles.approvalRow}>
            <Text style={styles.approvalLabel}>提出日時</Text>
            <Text style={styles.approvalValue}>
              {formatDateTime(data.submittedAt)}
            </Text>
          </View>
          {data.status === 'approved' && (
            <>
              <View style={styles.approvalRow}>
                <Text style={styles.approvalLabel}>承認者</Text>
                <Text style={styles.approvalValue}>
                  {data.approvedByName || '-'}
                </Text>
              </View>
              <View style={styles.approvalRow}>
                <Text style={styles.approvalLabel}>承認日時</Text>
                <Text style={styles.approvalValue}>
                  {formatDateTime(data.approvedAt)}
                </Text>
              </View>
            </>
          )}
          {data.status === 'rejected' && (
            <>
              <View style={styles.approvalRow}>
                <Text style={styles.approvalLabel}>差戻し者</Text>
                <Text style={styles.approvalValue}>
                  {data.rejectedByName || '-'}
                </Text>
              </View>
              <View style={styles.approvalRow}>
                <Text style={styles.approvalLabel}>差戻し日時</Text>
                <Text style={styles.approvalValue}>
                  {formatDateTime(data.rejectedAt)}
                </Text>
              </View>
              {data.rejectReason && (
                <View style={styles.rejectReasonBox}>
                  <Text style={styles.rejectReasonLabel}>差戻し理由</Text>
                  <Text style={styles.rejectReasonText}>
                    {data.rejectReason}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            出力日時: {exportDateTime}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
