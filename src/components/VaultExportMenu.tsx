'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { BrandSuccessScreen } from '@/components/BrandSuccessScreen';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/ui/dropdown-menu';
import {
  exportVaultData,
  type VaultExportFormat,
  type VaultExportPayload,
  type VaultExportResult,
} from '@/utils/vaultExport';

type VaultExportMenuProps = {
  payload: VaultExportPayload;
  trigger: React.ReactNode;
  align?: 'start' | 'center' | 'end';
};

export function VaultExportMenu({
  payload,
  trigger,
  align = 'end',
}: VaultExportMenuProps) {
  const [exportResult, setExportResult] = useState<VaultExportResult | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: VaultExportFormat) => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportVaultData(payload, format);
      setExportResult(result);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatLabel = exportResult?.format.toUpperCase() ?? 'FILE';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-52">
          <DropdownMenuLabel>Export format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={exporting}
            onClick={() => void handleExport('csv')}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV spreadsheet
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={exporting}
            onClick={() => void handleExport('txt')}
          >
            <FileText className="mr-2 h-4 w-4" />
            TXT document
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={exporting}
            onClick={() => void handleExport('pdf')}
          >
            <FileType className="mr-2 h-4 w-4" />
            PDF document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BrandSuccessScreen
        open={Boolean(exportResult)}
        variant="export"
        title="Export ready"
        description={
          exportResult
            ? `${exportResult.filename} · ${formatLabel} with ${exportResult.fieldCount} field${
                exportResult.fieldCount === 1 ? '' : 's'
              }.`
            : undefined
        }
        primaryAction={{
          label: 'Download',
          onClick: () => setExportResult(null),
          variant: 'primary',
        }}
        onClose={() => setExportResult(null)}
      />
    </>
  );
}
