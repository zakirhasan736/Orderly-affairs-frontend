'use client';

import React from 'react';
import { FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { toast } from 'sonner';
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
  const handleExport = async (format: VaultExportFormat) => {
    try {
      await exportVaultData(payload, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuLabel>Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV spreadsheet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport('txt')}>
          <FileText className="mr-2 h-4 w-4" />
          TXT document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport('pdf')}>
          <FileType className="mr-2 h-4 w-4" />
          PDF document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
