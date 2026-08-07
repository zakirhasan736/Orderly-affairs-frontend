import {
  getVaultSectionDisplayNumber,
  getVaultSubsectionDisplayId,
  VAULT_NAVIGATION,
} from '@/utils/vaultNavigation';

export type VaultExportFormat = 'csv' | 'txt' | 'pdf';

export type VaultExportPayload = {
  formData: Record<string, unknown>;
  disabledSections?: Record<string, boolean>;
  disabledSubsections?: Record<string, boolean>;
};

export type VaultExportRow = {
  sectionId: string;
  sectionTitle: string;
  subsectionId: string;
  subsectionTitle: string;
  fieldPath: string;
  fieldLabel: string;
  value: string;
};

const SKIP_KEYS = new Set(['_deleted_files', '__rowId']);

function humanizeKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function getSectionTitle(sectionId: string) {
  return VAULT_NAVIGATION.find(section => section.id === sectionId)?.title || '';
}

function getSubsectionTitle(sectionId: string, subsectionId: string) {
  const section = VAULT_NAVIGATION.find(item => item.id === sectionId);
  return (
    section?.subsections?.find(subsection => subsection.id === subsectionId)
      ?.title || subsectionId
  );
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    if (value.every(item => item === null || typeof item !== 'object')) {
      return value.map(item => String(item ?? '')).filter(Boolean).join('; ');
    }
    return '';
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if ('text' in record || 'files' in record) {
      const text = typeof record.text === 'string' ? record.text.trim() : '';
      const fileCount = Array.isArray(record.files) ? record.files.length : 0;

      if (text && fileCount > 0) {
        return `${text} (${fileCount} attached file${fileCount === 1 ? '' : 's'})`;
      }

      if (text) return text;
      if (fileCount > 0) {
        return `${fileCount} attached file${fileCount === 1 ? '' : 's'}`;
      }

      return '';
    }

    return '';
  }

  return String(value);
}

function appendRowsFromValue(
  rows: VaultExportRow[],
  sectionId: string,
  sectionTitle: string,
  subsectionId: string,
  subsectionTitle: string,
  fieldPath: string,
  value: unknown,
) {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value.every(item => item && typeof item === 'object' && !Array.isArray(item))
    ) {
      value.forEach((item, index) => {
        appendRowsFromObject(
          rows,
          sectionId,
          sectionTitle,
          subsectionId,
          subsectionTitle,
          `${fieldPath}[${index + 1}]`,
          item as Record<string, unknown>,
        );
      });
      return;
    }
  }

  const formatted = formatFieldValue(value);
  if (!formatted) return;

  const leafKey = fieldPath.split('.').pop() || fieldPath;

  rows.push({
    sectionId,
    sectionTitle,
    subsectionId,
    subsectionTitle,
    fieldPath,
    fieldLabel: humanizeKey(leafKey),
    value: formatted,
  });
}

function appendRowsFromObject(
  rows: VaultExportRow[],
  sectionId: string,
  sectionTitle: string,
  subsectionId: string,
  subsectionTitle: string,
  prefix: string,
  value: Record<string, unknown>,
) {
  Object.entries(value).forEach(([key, childValue]) => {
    if (SKIP_KEYS.has(key)) return;

    const nextPath = prefix ? `${prefix}.${key}` : key;

    if (
      childValue &&
      typeof childValue === 'object' &&
      !Array.isArray(childValue) &&
      !('text' in (childValue as Record<string, unknown>))
    ) {
      appendRowsFromObject(
        rows,
        sectionId,
        sectionTitle,
        subsectionId,
        subsectionTitle,
        nextPath,
        childValue as Record<string, unknown>,
      );
      return;
    }

    appendRowsFromValue(
      rows,
      sectionId,
      sectionTitle,
      subsectionId,
      subsectionTitle,
      nextPath,
      childValue,
    );
  });
}

export function buildVaultExportRows({
  formData,
  disabledSections = {},
  disabledSubsections = {},
}: VaultExportPayload): VaultExportRow[] {
  const rows: VaultExportRow[] = [];

  Object.keys(formData)
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))
    .forEach(sectionId => {
      if (disabledSections[sectionId]) return;

      const sectionTitle = getSectionTitle(sectionId) || `Section ${sectionId}`;
      const sectionData = formData[sectionId];

      if (!sectionData || typeof sectionData !== 'object') return;

      Object.entries(sectionData as Record<string, unknown>).forEach(
        ([subsectionId, subsectionValue]) => {
          if (disabledSubsections[subsectionId]) return;
          if (subsectionValue === null || subsectionValue === undefined) return;

          const subsectionTitle = getSubsectionTitle(sectionId, subsectionId);

          if (Array.isArray(subsectionValue)) {
            subsectionValue.forEach((item, index) => {
              if (!item || typeof item !== 'object') return;

              appendRowsFromObject(
                rows,
                sectionId,
                sectionTitle,
                subsectionId,
                subsectionTitle,
                `Item ${index + 1}`,
                item as Record<string, unknown>,
              );
            });
            return;
          }

          if (typeof subsectionValue === 'object') {
            appendRowsFromObject(
              rows,
              sectionId,
              sectionTitle,
              subsectionId,
              subsectionTitle,
              '',
              subsectionValue as Record<string, unknown>,
            );
            return;
          }

          appendRowsFromValue(
            rows,
            sectionId,
            sectionTitle,
            subsectionId,
            subsectionTitle,
            subsectionId,
            subsectionValue,
          );
        },
      );
    });

  return rows;
}

function escapeCsvValue(value: string) {
  const normalized = value.replace(/\r?\n/g, ' ').trim();
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function buildVaultCsv(rows: VaultExportRow[], exportDate: string) {
  const header = ['Section ID', 'Section', 'Subsection ID', 'Subsection', 'Field', 'Value'];
  const lines = [
    header.join(','),
    ...rows.map(row =>
      [
        escapeCsvValue(getVaultSectionDisplayNumber(row.sectionId)),
        escapeCsvValue(row.sectionTitle),
        escapeCsvValue(
          getVaultSubsectionDisplayId(row.sectionId, row.subsectionId),
        ),
        escapeCsvValue(row.subsectionTitle),
        escapeCsvValue(row.fieldLabel),
        escapeCsvValue(row.value),
      ].join(','),
    ),
  ];

  return `Orderly Affairs Vault Export\nExported,${escapeCsvValue(exportDate)}\n\n${lines.join('\n')}`;
}

export function buildVaultTxt(rows: VaultExportRow[], exportDate: string) {
  const lines = [
    'Orderly Affairs Vault Export',
    `Exported: ${exportDate}`,
    '',
  ];

  let currentSection = '';
  let currentSubsection = '';

  rows.forEach(row => {
    const sectionHeading = `Section ${getVaultSectionDisplayNumber(row.sectionId)}: ${row.sectionTitle}`;
    if (sectionHeading !== currentSection) {
      currentSection = sectionHeading;
      currentSubsection = '';
      lines.push(sectionHeading);
      lines.push('='.repeat(sectionHeading.length));
      lines.push('');
    }

    const subsectionHeading = `${getVaultSubsectionDisplayId(row.sectionId, row.subsectionId)} - ${row.subsectionTitle}`;
    if (subsectionHeading !== currentSubsection) {
      currentSubsection = subsectionHeading;
      lines.push(subsectionHeading);
      lines.push('-'.repeat(subsectionHeading.length));
    }

    lines.push(`${row.fieldLabel}: ${row.value}`);
  });

  if (rows.length === 0) {
    lines.push('No exportable vault data found.');
  }

  return lines.join('\n');
}

function downloadBlob(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function buildVaultPdf(rows: VaultExportRow[], exportDate: string) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Orderly Affairs Vault Export', margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Exported: ${exportDate}`, margin, y);
  y += 24;

  if (rows.length === 0) {
    doc.text('No exportable vault data found.', margin, y);
    return doc;
  }

  let currentSection = '';
  let currentSubsection = '';

  rows.forEach(row => {
    const sectionHeading = `Section ${getVaultSectionDisplayNumber(row.sectionId)}: ${row.sectionTitle}`;
    if (sectionHeading !== currentSection) {
      currentSection = sectionHeading;
      currentSubsection = '';
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(sectionHeading, margin, y);
      y += 18;
    }

    const subsectionHeading = `${getVaultSubsectionDisplayId(row.sectionId, row.subsectionId)} - ${row.subsectionTitle}`;
    if (subsectionHeading !== currentSubsection) {
      currentSubsection = subsectionHeading;
      ensureSpace(22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(subsectionHeading, margin, y);
      y += 14;
    }

    const line = `${row.fieldLabel}: ${row.value}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize(line, contentWidth);

    wrapped.forEach((textLine: string) => {
      ensureSpace(12);
      doc.text(textLine, margin, y);
      y += 12;
    });

    y += 4;
  });

  return doc;
}

export type VaultExportResult = {
  filename: string;
  format: VaultExportFormat;
  fieldCount: number;
};

export async function exportVaultData(
  payload: VaultExportPayload,
  format: VaultExportFormat,
): Promise<VaultExportResult> {
  const exportDate = new Date().toLocaleString();
  const rows = buildVaultExportRows(payload);
  const stamp = new Date().toISOString().slice(0, 10);
  const fieldCount = rows.length;

  if (format === 'csv') {
    const filename = `orderly-affairs-export-${stamp}.csv`;
    downloadBlob(
      buildVaultCsv(rows, exportDate),
      filename,
      'text/csv;charset=utf-8',
    );
    return { filename, format, fieldCount };
  }

  if (format === 'txt') {
    const filename = `orderly-affairs-export-${stamp}.txt`;
    downloadBlob(
      buildVaultTxt(rows, exportDate),
      filename,
      'text/plain;charset=utf-8',
    );
    return { filename, format, fieldCount };
  }

  const filename = `orderly-affairs-export-${stamp}.pdf`;
  const doc = await buildVaultPdf(rows, exportDate);
  doc.save(filename);
  return { filename, format, fieldCount };
}
