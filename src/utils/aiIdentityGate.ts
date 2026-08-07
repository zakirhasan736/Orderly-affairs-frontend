/**
 * Shared gate: if this looks like an ID document, ask whose it is and remap.
 */

import {
  applyIdentityPersonChoice,
  extractIdentityPersonName,
  inferIdentityDocumentLabel,
  isIdentityDocumentCandidate,
  type IdentityPersonChoice,
  type IdentityRouteTarget,
} from '@/utils/aiIdentityDocument';
import { promptIdentityDocumentPerson } from '@/utils/aiIdentityPersonPrompt';

export type IdentityGateInput = {
  sectionId: string;
  sectionKey: string;
  subsection?: string | null;
  sectionLabel?: string;
  result: unknown;
  documentSummary?: string | null;
  fileName?: string | null;
};

export type IdentityGateResult =
  | { skipped: true }
  | { skipped: false; choice: IdentityPersonChoice; target: IdentityRouteTarget };

export async function gateIdentityDocumentPerson(
  input: IdentityGateInput,
): Promise<IdentityGateResult> {
  if (
    !isIdentityDocumentCandidate({
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
    fileName: input.fileName,
    documentSummary: input.documentSummary,
    personName: extractIdentityPersonName(input.result),
    documentLabel: inferIdentityDocumentLabel({
      documentSummary: input.documentSummary,
      fileName: input.fileName,
    }),
  });

  if (!choice) {
    return { skipped: true };
  }

  return {
    skipped: false,
    choice,
    target: applyIdentityPersonChoice(choice, input),
  };
}
