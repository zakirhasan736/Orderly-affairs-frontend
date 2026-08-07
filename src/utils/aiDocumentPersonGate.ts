/**
 * Single entry point: health insurance cards vs identity documents.
 */

import {
  gateIdentityDocumentPerson,
  type IdentityGateInput,
  type IdentityGateResult,
} from '@/utils/aiIdentityGate';
import { isHealthInsuranceCardCandidate } from '@/utils/aiInsuranceDocument';
import { gateInsuranceCardPerson } from '@/utils/aiInsuranceGate';

export async function gateUploadedDocumentPerson(
  input: IdentityGateInput,
): Promise<IdentityGateResult> {
  if (
    isHealthInsuranceCardCandidate({
      sectionKey: input.sectionKey,
      sectionId: input.sectionId,
      documentSummary: input.documentSummary,
      fileName: input.fileName,
      result: input.result,
    })
  ) {
    return gateInsuranceCardPerson(input);
  }
  return gateIdentityDocumentPerson(input);
}
