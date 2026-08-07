/**
 * Ask whose health insurance card this is before saving.
 */

import type { IdentityPersonChoice } from '@/utils/aiIdentityDocument';
import { promptIdentityDocumentPerson } from '@/utils/aiIdentityPersonPrompt';
import {
  applyInsurancePersonChoice,
  extractInsuranceMemberName,
  isHealthInsuranceCardCandidate,
} from '@/utils/aiInsuranceDocument';

export type InsuranceGateInput = {
  sectionId: string;
  sectionKey: string;
  subsection?: string | null;
  sectionLabel?: string;
  result: unknown;
  documentSummary?: string | null;
  fileName?: string | null;
};

export type InsuranceGateResult =
  | { skipped: true }
  | {
      skipped: false;
      choice: IdentityPersonChoice;
      target: ReturnType<typeof applyInsurancePersonChoice>;
    };

export async function gateInsuranceCardPerson(
  input: InsuranceGateInput,
): Promise<InsuranceGateResult> {
  if (
    !isHealthInsuranceCardCandidate({
      sectionKey: input.sectionKey,
      sectionId: input.sectionId,
      documentSummary: input.documentSummary,
      fileName: input.fileName,
      result: input.result,
    })
  ) {
    return {
      skipped: false,
      choice: 'self',
      target: {
        sectionId: input.sectionId,
        sectionKey: input.sectionKey,
        subsection: input.subsection || undefined,
        sectionLabel: input.sectionLabel,
        result: input.result,
      },
    };
  }

  const choice = await promptIdentityDocumentPerson({
    kind: 'insurance',
    fileName: input.fileName,
    documentSummary: input.documentSummary,
    personName: extractInsuranceMemberName(input.result),
    documentLabel: 'Health insurance card',
  });

  if (!choice) {
    return { skipped: true };
  }

  return {
    skipped: false,
    choice,
    target: applyInsurancePersonChoice(choice, input),
  };
}
