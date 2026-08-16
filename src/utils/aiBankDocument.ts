/**
 * Bank / checking / savings statements belong in Bank Accounts.
 * A mailing address on the statement is not a Main Residence document.
 */

const BANK_STMT_RE =
  /\b(bank\s*statement|checking\s*(?:account|statement)|savings\s*(?:account|statement)|monthly\s*bank\s*statement|routing\s*(?:number|#)|beginning\s*balance|ending\s*balance|voided\s*check|credit\s*union|national\s*bank|direct\s*deposit)\b/i;

const PROPERTY_PRIMARY_RE =
  /\b(mortgage|deed|homeowner|home\s*insurance|property\s*tax|utility\s*bill|closing\s*disclosure)\b/i;

const BANK_MISROUTE_SECTIONS = new Set([
  'main_residence',
  'vital_information',
  'vehicles',
  'family_treasured_connections',
  'assets_valuables',
]);

export function isBankStatementCandidate(args: {
  documentSummary?: string | null;
  fileName?: string | null;
  sectionKey?: string | null;
}): boolean {
  const text = `${args.documentSummary || ''} ${args.fileName || ''}`;
  if (!BANK_STMT_RE.test(text)) return false;
  if (PROPERTY_PRIMARY_RE.test(text)) return false;
  return true;
}

/** If AI summarized a bank statement but routed it to Residence, send it to Bank Accounts. */
export function correctBankStatementSectionKey(
  sectionKey: string | null | undefined,
  args: {
    documentSummary?: string | null;
    fileName?: string | null;
  },
): string | null | undefined {
  if (!isBankStatementCandidate(args)) return sectionKey;
  if (!sectionKey || BANK_MISROUTE_SECTIONS.has(sectionKey)) {
    return 'banking_financial_accounts';
  }
  return sectionKey;
}
