import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import { autofillSectionFromDocument } from '@/services/aiAutofill';
import { ensureFreshSession } from '@/libs/secureFetch';
import {
  AiDocumentMismatchError,
  AiDocumentUnavailableError,
} from '@/utils/aiDocumentRouting';
import {
  buildUploadedAiFile,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import {
  AI_SECTION_BY_ID,
  AI_SECTION_BY_KEY,
} from '@/utils/aiSectionRegistry';
import {
  stashDashboardAiPatch,
  markDashboardAiPatchPersisted,
  listDashboardAiPatchesForSection,
  takeDashboardAiPatch,
} from '@/utils/aiDashboardPatchCache';
import {
  aiPatchHasValues,
  unwrapAiAutofillPatch,
} from '@/utils/aiPatchNormalizer';
import {
  flattenDetectedFactsFromPatch,
  type DetectedFact,
} from '@/utils/aiSemanticFieldMatch';
import { persistAiResultToSectionBackground } from '@/services/aiBackgroundSectionPersist';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { getSectionFieldCatalog } from '@/utils/aiSectionFieldCatalog';
import { markAiSectionFilled } from '@/utils/aiSectionFillGuard';
import {
  clearAiAutofillDoneForFileSection,
  markAiAutofillDoneForSection,
} from '@/utils/aiAutofillDoneSections';
import { resolveUploadDisplayTitle } from '@/utils/aiUploadDisplayTitle';
import {
  applyReplacedAiDocuments,
  linkAiUploadHistorySections,
  toVaultSectionId,
  upsertAiUploadHistory,
} from '@/utils/aiUploadHistory';
import {
  AI_GENERIC_FAIL_USER_MESSAGE,
  isAiBusyMessage,
  toAiUserFacingMessage,
} from '@/utils/aiUserFacingError';
import { isHealthInsuranceCardCandidate, isVehicleInsuranceDocument } from '@/utils/aiInsuranceDocument';
import { correctBankStatementSectionKey } from '@/utils/aiBankDocument';
// Person/section approval happens in AiOverviewReadMatchDialog after stash.

/** Always also fill related sections when one of the pair is targeted. */
const FORCE_BACKGROUND_PARTNERS: Record<string, string[]> = {
  // Only document-kind partners. Conceptual pairs (employment→bank,
  // residence→insurance, legal↔estate) wait for Sol's fill_section_keys.
  vehicles: ['insurance_policies'],
  health_information: ['insurance_policies'],
};

function factsFromFill(filled: {
  detected_facts?: DetectedFact[];
  result?: unknown;
  section?: string;
}): DetectedFact[] {
  if (Array.isArray(filled.detected_facts) && filled.detected_facts.length) {
    return filled.detected_facts;
  }
  return flattenDetectedFactsFromPatch(
    unwrapAiAutofillPatch(filled.result),
    filled.section,
  );
}

/** Build a Healthcare 15A summary card from a HEALTH insurance extract only. */
function seedHealthFromInsuranceResult(insuranceResult: unknown): unknown | null {
  if (
    !isHealthInsuranceCardCandidate({
      sectionKey: 'insurance_policies',
      result: insuranceResult,
    })
  ) {
    return null;
  }
  const patch = unwrapAiAutofillPatch(insuranceResult);
  const raw = patch?.['7A'];
  const policy =
    (Array.isArray(raw) ? raw[0] : raw) && typeof (Array.isArray(raw) ? raw[0] : raw) === 'object'
      ? ((Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>)
      : null;
  if (!policy) return null;

  const lines = [
    policy.policy_company || policy.insurance_company || policy.member_name,
    policy.plan_name,
    policy.member_id ? `Member ID: ${policy.member_id}` : '',
    policy.group_number ? `Group: ${policy.group_number}` : '',
    policy.policy_number ? `Policy: ${policy.policy_number}` : '',
  ]
    .map(value => String(value || '').trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return {
    section: 'health_information',
    patch: {
      '15A': {
        primary_health_insurance: lines.join('\n'),
      },
    },
  };
}

async function stashAndPersist(args: {
  file_id: string;
  fileName: string;
  sectionId: string;
  sectionKey: string;
  subsection?: string | null;
  result: unknown;
  detectedFields?: DetectedFact[];
  documentSummary?: string;
  /** When false, stash for inbox review and wait for Accept before vault save. */
  persistNow?: boolean;
  onFilled?: (meta: {
    file_id: string;
    sectionId: string;
    fileName: string;
  }) => void;
}) {
  const persistNow = args.persistNow !== false;

  stashDashboardAiPatch({
    file_id: args.file_id,
    section_id: args.sectionId,
    section_key: args.sectionKey,
    subsection: args.subsection || null,
    result: args.result,
    patch: unwrapAiAutofillPatch(args.result),
    detectedFields: args.detectedFields,
    document_summary: args.documentSummary,
    file_name: args.fileName,
    createdAt: Date.now(),
    pending_accept: !persistNow,
  });

  linkAiUploadHistorySections({
    fileId: args.file_id,
    fileName: args.fileName,
    sectionIds: [args.sectionId],
  });

  // Stash-only path (rare): keep review badge without vault write.
  if (!persistNow) {
    args.onFilled?.({
      file_id: args.file_id,
      sectionId: args.sectionId,
      fileName: args.fileName,
    });
    return { sectionId: args.sectionId, sectionKey: args.sectionKey, ok: true };
  }

  // Access token may expire during long Gemini reads — refresh before save.
  await ensureFreshSession();

  // Background: merge into saved section data — user does not open the section.
  const persistResult = await persistAiResultToSectionBackground({
    sectionId: args.sectionId,
    sectionKey: args.sectionKey,
    result: args.result,
    subsection: args.subsection,
  });

  if (persistResult.ok) {
    markDashboardAiPatchPersisted(args.sectionId, args.file_id);
    markAiSectionFilled(args.sectionId);
    markAiAutofillDoneForSection({
      sectionId: args.sectionId,
      fileId: args.file_id,
      fileName: args.fileName,
    });
    args.onFilled?.({
      file_id: args.file_id,
      sectionId: args.sectionId,
      fileName: args.fileName,
    });
  } else {
    // Keep a pending_accept stash so Accept can retry after vault unlock.
    stashDashboardAiPatch({
      file_id: args.file_id,
      section_id: args.sectionId,
      section_key: args.sectionKey,
      subsection: args.subsection || null,
      result: args.result,
      patch: unwrapAiAutofillPatch(args.result),
      detectedFields: args.detectedFields,
      document_summary: args.documentSummary,
      file_name: args.fileName,
      createdAt: Date.now(),
      pending_accept: true,
      vault_persisted: false,
    });
    args.onFilled?.({
      file_id: args.file_id,
      sectionId: args.sectionId,
      fileName: args.fileName,
    });
    console.warn(
      'AI vault save deferred (will retry on Accept):',
      persistResult.error,
    );
  }

  return persistResult;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fillPartnerSectionsFast(args: {
  jobId: string;
  file_id: string;
  fileName: string;
  mime_type?: string;
  sectionKey: string;
  documentSummary?: string;
  additionalSections?: any[];
  skipSectionKeys?: string[];
  partnerResults?: Record<string, unknown>;
  patchJob: (id: string, patch: Record<string, unknown>) => void;
  notifySectionFilled: (sectionId: string) => void;
  routing?: ReturnType<typeof useOptionalAiDocumentRouting>;
  baseProgress?: number;
}) {
  const {
    jobId,
    file_id,
    fileName,
    mime_type,
    sectionKey,
    documentSummary,
    additionalSections,
    skipSectionKeys,
    partnerResults,
    patchJob,
    notifySectionFilled,
    routing,
  } = args;

  const partnerKeys = new Set<string>([
    ...(additionalSections || [])
      .map((item: any) => item?.section_key)
      .filter(Boolean),
    ...(FORCE_BACKGROUND_PARTNERS[sectionKey] || []),
    ...Object.keys(partnerResults || {}),
  ]);
  partnerKeys.delete(sectionKey);
  for (const skipped of skipSectionKeys || []) {
    partnerKeys.delete(skipped);
  }

  const looksVehicle = isVehicleInsuranceDocument({
    sectionKey,
    documentSummary,
    fileName,
  });
  const looksHealth = isHealthInsuranceCardCandidate({
    sectionKey,
    documentSummary,
    fileName,
  });
  if (looksVehicle || !looksHealth) {
    partnerKeys.delete('health_information');
  }
  if (looksHealth) {
    partnerKeys.add('health_information');
    partnerKeys.delete('vehicles');
  }

  const partnerList = [...partnerKeys].slice(0, 4);
  if (!partnerList.length) return;

  // Soft progress nudge only — job may already be marked done.
  patchJob(jobId, {
    message: 'Filling related sections together…',
  });

  const fillOnePartner = async (partnerKey: string) => {
    const partnerMeta = AI_SECTION_BY_KEY[partnerKey];
    if (!partnerMeta) return;

    let seedHint = partnerResults?.[partnerKey];
    if (
      !seedHint &&
      partnerKey === 'health_information' &&
      sectionKey === 'insurance_policies' &&
      looksHealth
    ) {
      const insuranceStash = listDashboardAiPatchesForSection('7').find(
        item => item.file_id === file_id,
      );
      seedHint =
        seedHealthFromInsuranceResult(insuranceStash?.result) || undefined;
    }
    const summaryFallback = documentSummary;

    if (seedHint && aiPatchHasValues(unwrapAiAutofillPatch(seedHint))) {
      try {
        await stashAndPersist({
          file_id,
          fileName,
          sectionId: partnerMeta.id,
          sectionKey: partnerKey,
          subsection: partnerMeta.defaultSubsection || null,
          result: seedHint,
          detectedFields: factsFromFill({
            result: seedHint,
            section: partnerKey,
          }),
          documentSummary: summaryFallback,
          persistNow: false,
          onFilled: () => notifySectionFilled(partnerMeta.id),
        });
        routing?.queueRoutedSectionsSilently(
          {
            code: 'section_mismatch',
            message: 'Partner section seeded',
            requested_section: sectionKey,
            suggested_section: partnerKey,
            suggested_section_id: partnerMeta.id,
            suggested_section_label: partnerMeta.label,
            suggested_subsection: partnerMeta.defaultSubsection,
            document_summary: summaryFallback,
            file_id,
            mime_type,
            additional_sections: [],
          },
          {
            currentSectionId: 'dashboard',
            navigateIntent: 'review',
          },
        );
      } catch (seedError) {
        console.warn('Partner seed stash failed', partnerKey, seedError);
      }
    }

    try {
      await ensureFreshSession();
      patchJob(jobId, {
        activeFillSectionId: partnerMeta.id,
        message: `Filling ${partnerMeta.label} from the document…`,
      });

      const partnerFilled = await withTimeout(
        autofillSectionFromDocument(
          {
            section: partnerKey,
            file_id,
            subsection: partnerMeta.defaultSubsection || null,
            use_routed_cache: true,
            defer_persist: true,
            field_catalog: catalogForSection(partnerKey, null),
          },
          {
            onWaiting: () =>
              patchJob(jobId, { message: 'Mapping to your vault…' }),
          },
        ),
        PARTNER_FILL_TIMEOUT_MS,
        `Partner fill ${partnerKey}`,
      );
      applyReplacedAiDocuments(
        (partnerFilled as { replaced_file_ids?: string[] }).replaced_file_ids,
      );

      let result = partnerFilled.result;
      const extractPatch = unwrapAiAutofillPatch(result);
      if (!aiPatchHasValues(extractPatch) && seedHint) {
        result = seedHint;
      }

      if (!aiPatchHasValues(unwrapAiAutofillPatch(result))) {
        console.warn(
          'Partner fill produced no values; skipping empty stash',
          partnerKey,
        );
        return;
      }

      const summary = partnerFilled.document_summary || summaryFallback;

      await withTimeout(
        stashAndPersist({
          file_id,
          fileName,
          sectionId: partnerMeta.id,
          sectionKey: partnerKey,
          subsection: partnerMeta.defaultSubsection || null,
          result,
          detectedFields: factsFromFill({
            result,
            section: partnerKey,
          }),
          documentSummary: summary,
          persistNow: false,
          onFilled: () => notifySectionFilled(partnerMeta.id),
        }),
        30000,
        `Partner persist ${partnerKey}`,
      );

      routing?.queueRoutedSectionsSilently(
        {
          code: 'section_mismatch',
          message: 'Partner section filled',
          requested_section: sectionKey,
          suggested_section: partnerKey,
          suggested_section_id: partnerMeta.id,
          suggested_section_label: partnerMeta.label,
          suggested_subsection: partnerMeta.defaultSubsection,
          document_summary: summary,
          file_id,
          mime_type,
          additional_sections: [],
        },
        {
          currentSectionId: 'dashboard',
          navigateIntent: 'review',
        },
      );
    } catch (partnerError) {
      console.warn(
        'Dashboard partner background fill failed',
        partnerKey,
        partnerError,
      );
      if (
        isAiBusyMessage(
          partnerError instanceof Error
            ? partnerError.message
            : String(partnerError || ''),
        )
      ) {
        return;
      }
      if (
        partnerKey === 'health_information' &&
        looksHealth &&
        !listDashboardAiPatchesForSection('15').some(
          item => item.file_id === file_id,
        )
      ) {
        const insuranceStash = listDashboardAiPatchesForSection('7').find(
          item => item.file_id === file_id,
        );
        const fallback =
          seedHint || seedHealthFromInsuranceResult(insuranceStash?.result);
        if (fallback && aiPatchHasValues(unwrapAiAutofillPatch(fallback))) {
          try {
            await stashAndPersist({
              file_id,
              fileName,
              sectionId: partnerMeta.id,
              sectionKey: partnerKey,
              subsection: partnerMeta.defaultSubsection || null,
              result: fallback,
              detectedFields: factsFromFill({
                result: fallback,
                section: partnerKey,
              }),
              documentSummary: summaryFallback,
              persistNow: false,
              onFilled: () => notifySectionFilled(partnerMeta.id),
            });
            routing?.queueRoutedSectionsSilently(
              {
                code: 'section_mismatch',
                message: 'Partner section seeded from insurance',
                requested_section: sectionKey,
                suggested_section: partnerKey,
                suggested_section_id: partnerMeta.id,
                suggested_section_label: partnerMeta.label,
                suggested_subsection: partnerMeta.defaultSubsection,
                document_summary: summaryFallback,
                file_id,
                mime_type,
                additional_sections: [],
              },
              {
                currentSectionId: 'dashboard',
                navigateIntent: 'review',
              },
            );
          } catch (seedError) {
            console.warn('Partner fallback seed failed', partnerKey, seedError);
          }
        }
      }
    }
  };

  await Promise.allSettled(partnerList.map(fillOnePartner));

  patchJob(jobId, {
    activeFillSectionId: undefined,
  });
}


export type DashboardAiJobStatus =
  | 'queued'
  | 'starting'
  | 'uploading'
  | 'reading'
  | 'almost'
  | 'routing'
  | 'filling'
  | 'needs_section_choice'
  | 'done'
  | 'error';

export type DashboardAiJob = {
  id: string;
  file?: File | null;
  fileName: string;
  status: DashboardAiJobStatus;
  progress: number;
  message: string;
  file_id?: string;
  mime_type?: string;
  targetSectionId?: string;
  targetSectionKey?: string;
  targetSubsection?: string;
  targetSectionLabel?: string;
  documentSummary?: string;
  error?: string;
  /** How the file bytes were read before field matching. */
  readSource?: 'system' | 'gemini' | 'cache';
  extractMethod?: string;
  terraInvoked?: boolean;
  pipelinePath?: string;
  /** Section currently being filled (primary or partner). */
  activeFillSectionId?: string;
  /** When the file was queued / uploaded. */
  createdAt: string;
  /** Last status change (reading, filled, error, …). */
  updatedAt: string;
};

const MAX_CONCURRENT = 3;
const CLASSIFY_TIMEOUT_MS = 240000;
const FILL_TIMEOUT_MS = 240000;
const PARTNER_FILL_TIMEOUT_MS = 240000;
const JOB_WATCHDOG_MS = 600000;
const PROBE_SECTION_KEY = 'vital_information';
const PROBE_SECTION_ID = '1';

function catalogForSection(sectionKey: string, subsection?: string | null) {
  // Prefer full-section catalogs so multi-subsection sections (12A/12B, etc.)
  // get every field key/label/option — not only the default subsection.
  return getSectionFieldCatalog(sectionKey, subsection ?? null).catalog;
}

const ACTIVE_STATUSES: DashboardAiJobStatus[] = [
  'queued',
  'starting',
  'uploading',
  'reading',
  'almost',
  'routing',
  'filling',
];

function statusLabel(status: DashboardAiJobStatus) {
  switch (status) {
    case 'queued':
      return 'Waiting for the next document…';
    case 'starting':
      return 'Preparing secure upload…';
    case 'uploading':
      return 'Scanning document…';
    case 'reading':
      return 'Reading with OCR…';
    case 'almost':
      return 'Filling in missing text…';
    case 'routing':
      return 'Mapping to your vault…';
    case 'filling':
      return 'Matching information…';
    case 'needs_section_choice':
      return 'Choose a section';
    case 'done':
      return 'Ready to review';
    case 'error':
      return 'Needs attention';
    default:
      return 'Mapping to your vault…';
  }
}

function createJobId() {
  return `ai-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useDashboardAiBatchRunner() {
  const routing = useOptionalAiDocumentRouting();
  const [jobs, setJobs] = useState<DashboardAiJob[]>([]);
  const jobsRef = useRef<DashboardAiJob[]>([]);
  const activeIdsRef = useRef<Set<string>>(new Set());
  const almostTimersRef = useRef<Record<string, number>>({});
  const pumpRef = useRef<() => void>(() => undefined);
  const processRef = useRef<(job: DashboardAiJob) => Promise<void>>(
    async () => undefined,
  );

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const patchJob = useCallback((id: string, patch: Partial<DashboardAiJob>) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === id
          ? { ...job, ...patch, updatedAt: new Date().toISOString() }
          : job,
      ),
    );
  }, []);

  const clearAlmostTimer = useCallback((id: string) => {
    const timer = almostTimersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete almostTimersRef.current[id];
    }
  }, []);

  const finishWithSection = useCallback(
    async (args: {
      jobId: string;
      file_id: string;
      mime_type: string;
      fileName: string;
      sectionKey: string;
      sectionId: string;
      subsection?: string;
      sectionLabel?: string;
      documentSummary?: string;
      additionalSections?: any[];
      skipSectionKeys?: string[];
      alreadyExtracted?: boolean;
      extractedResult?: unknown;
      readSource?: 'system' | 'gemini' | 'cache';
      extractMethod?: string;
    }) => {
      const {
        jobId,
        file_id,
        mime_type,
        fileName,
        sectionKey,
        sectionId,
        subsection,
        sectionLabel,
        documentSummary,
        additionalSections,
        skipSectionKeys,
        alreadyExtracted,
        extractedResult,
        readSource,
        extractMethod,
      } = args;

      // Stamp vault section ids immediately so each matching section's document
      // popup lists this overview upload (keys → ids handled in history utils).
      linkAiUploadHistorySections({
        fileId: file_id,
        fileName,
        sectionIds: [
          sectionId,
          ...(additionalSections || []).flatMap(
            (item: {
              section_id?: string;
              section_key?: string;
            }) => [
              item?.section_id,
              item?.section_key
                ? AI_SECTION_BY_KEY[item.section_key]?.id
                : undefined,
            ],
          ),
        ],
      });

      const notifySectionFilled = (filledSectionId: string) => {
        routing?.handleAutofillSuccess({
          file_id,
          mime_type,
          currentSectionId: filledSectionId,
          uploadScope: 'full',
          document_deleted: false,
          deferAdditionalDialog: true,
          document_summary: documentSummary,
          additional_sections: [],
        });
      };

      const queueReviewForFilledSections = (opts?: {
        documentSummary?: string;
        additionalSections?: any[];
      }) => {
        // Only after a successful fill — never queue "New data" on classify alone.
        routing?.queueRoutedSectionsSilently(
          {
            code: 'section_mismatch',
            message: 'Dashboard routed document',
            requested_section: sectionKey,
            suggested_section: sectionKey,
            suggested_section_id: sectionId,
            suggested_section_label: sectionLabel,
            suggested_subsection: subsection,
            document_summary: opts?.documentSummary || documentSummary,
            file_id,
            mime_type,
            additional_sections:
              opts?.additionalSections || additionalSections || [],
          },
          {
            currentSectionId: 'dashboard',
            navigateIntent: 'review',
          },
        );
      };

      const markPrimaryDone = (
        extra?: Partial<
          Pick<DashboardAiJob, 'readSource' | 'extractMethod' | 'documentSummary'>
        >,
      ) => {
        const summary = extra?.documentSummary ?? documentSummary;
        const label =
          sectionLabel || AI_SECTION_BY_ID[sectionId]?.label || 'Section';
        const displayTitle = resolveUploadDisplayTitle({
          documentSummary: summary,
          fileName,
          mimeType: mime_type,
          sectionId,
          targetSectionLabel: label,
          fileId: file_id,
        });
        patchJob(jobId, {
          status: 'done',
          progress: 100,
          message: statusLabel('done'),
          file_id,
          mime_type,
          fileName,
          targetSectionId: sectionId,
          targetSectionKey: sectionKey,
          targetSubsection: subsection,
          targetSectionLabel: label,
          documentSummary: summary,
          activeFillSectionId: undefined,
          readSource: extra?.readSource ?? readSource,
          extractMethod: extra?.extractMethod ?? extractMethod,
        });
        upsertAiUploadHistory({
          id: jobId,
          fileName,
          status: 'done',
          progress: 100,
          fileId: file_id,
          mimeType: mime_type,
          sectionId,
          sectionIds: [sectionId],
          targetSectionLabel: label,
          documentSummary: summary,
          displayTitle,
          source: 'overview',
        });
      };

      const markPrimaryFailed = (error: unknown) => {
        const message = toAiUserFacingMessage(
          error instanceof Error
            ? error.message
            : 'We could not fill this document. Please try again.',
        );
        // Drop any premature "New data" badges for this upload.
        routing?.clearAllPendingForFile(file_id);
        patchJob(jobId, {
          status: 'error',
          progress: 100,
          message: statusLabel('error'),
          file_id,
          mime_type,
          fileName,
          targetSectionId: sectionId,
          targetSectionKey: sectionKey,
          targetSubsection: subsection,
          targetSectionLabel:
            sectionLabel || AI_SECTION_BY_ID[sectionId]?.label || 'Section',
          documentSummary,
          activeFillSectionId: undefined,
          error: message,
        });
      };

      const runPartnersThenFinish = async (opts: {
        documentSummary?: string;
        additionalSections?: any[];
        partnerResults?: Record<string, unknown>;
        donePatch?: Record<string, unknown>;
      }) => {
        // Await partners BEFORE marking done so Accept finds Vehicles stash
        // when Insurance was primary (auto docs).
        try {
          await fillPartnerSectionsFast({
            jobId,
            file_id,
            fileName,
            mime_type,
            sectionKey,
            documentSummary: opts.documentSummary || documentSummary,
            additionalSections:
              opts.additionalSections || additionalSections || [],
            skipSectionKeys: skipSectionKeys || [],
            partnerResults: opts.partnerResults,
            patchJob,
            notifySectionFilled,
            routing,
          });
        } catch (err) {
          console.warn('Partner fill failed', err);
        }
        markPrimaryDone(opts.donePatch);
      };

      if (alreadyExtracted && extractedResult) {
        patchJob(jobId, {
          status: 'filling',
          progress: 90,
          message: statusLabel('filling'),
          targetSectionId: sectionId,
          targetSectionLabel: sectionLabel,
          activeFillSectionId: sectionId,
        });

        try {
          // Stash for dashboard Review & fill — ask person/sections there, not mid-batch.
          await withTimeout(
            stashAndPersist({
              file_id,
              fileName,
              sectionId,
              sectionKey,
              subsection,
              result: extractedResult,
              detectedFields: flattenDetectedFactsFromPatch(
                unwrapAiAutofillPatch(extractedResult),
                sectionKey,
              ),
              documentSummary,
              persistNow: false,
              onFilled: () => notifySectionFilled(sectionId),
            }),
            35000,
            'Primary persist',
          );
        } catch (persistError) {
          console.warn('Dashboard primary persist failed', persistError);
          markPrimaryFailed(persistError);
          return;
        }

        queueReviewForFilledSections({ documentSummary, additionalSections });
        await runPartnersThenFinish({ documentSummary, additionalSections });
        return;
      }

      patchJob(jobId, {
        status: 'filling',
        progress: 88,
        message: statusLabel('filling'),
        targetSectionId: sectionId,
        targetSectionLabel: sectionLabel,
        activeFillSectionId: sectionId,
      });

      try {
        await ensureFreshSession();
        const filled = await withTimeout(
          autofillSectionFromDocument(
            {
              section: sectionKey,
              file_id,
              subsection: subsection || null,
              use_routed_cache: true,
              // Server cannot merge E2EE v3 ciphertext — client persists immediately.
              defer_persist: true,
              field_catalog: catalogForSection(sectionKey, null),
            },
            {
              onWaiting: () =>
                patchJob(jobId, { message: 'Matching information…' }),
            },
          ),
          FILL_TIMEOUT_MS,
          'Primary autofill',
        );
        applyReplacedAiDocuments(
          (filled as { replaced_file_ids?: string[] }).replaced_file_ids,
        );

        patchJob(jobId, {
          status: 'filling',
          progress: 94,
          message: 'Validating information…',
          activeFillSectionId: sectionId,
        });

        const summaryForReview = filled.document_summary || documentSummary;

        // Stash for dashboard Review & fill — person/section choices happen there.
        await withTimeout(
          stashAndPersist({
            file_id,
            fileName,
            sectionId,
            sectionKey,
            subsection,
            result: filled.result,
            detectedFields: factsFromFill(filled),
            documentSummary: summaryForReview,
            persistNow: false,
            onFilled: () => notifySectionFilled(sectionId),
          }),
          35000,
          'Primary persist',
        );

        queueReviewForFilledSections({
          documentSummary: summaryForReview,
          additionalSections:
            filled.additional_sections || additionalSections || [],
        });

        const filledRead =
          filled.read_source === 'system' ||
          filled.read_source === 'gemini' ||
          filled.read_source === 'cache'
            ? filled.read_source
            : filled.from_cache
              ? 'cache'
              : readSource;

        await runPartnersThenFinish({
          documentSummary: filled.document_summary || documentSummary,
          additionalSections:
            filled.additional_sections || additionalSections || [],
          partnerResults: (
            filled as { partner_results?: Record<string, unknown> }
          ).partner_results,
          donePatch: {
            documentSummary: filled.document_summary || documentSummary,
            readSource: filledRead,
            extractMethod:
              typeof filled.extract_method === 'string'
                ? filled.extract_method
                : extractMethod,
          },
        });
      } catch (fillError) {
        if (fillError instanceof AiDocumentMismatchError) {
          // Re-route handled by caller / classify path — treat as recoverable.
          throw fillError;
        }
        console.warn('Dashboard autofill failed', fillError);
        markPrimaryFailed(fillError);
      }
    },
    [patchJob, routing],
  );

  processRef.current = async (job: DashboardAiJob) => {
    clearAlmostTimer(job.id);
    routing?.setBatchSilentMode(true);
    let watchdog: number | undefined;

    try {
      // Access cookies expire during long Gemini batches — refresh first.
      await ensureFreshSession();

      patchJob(job.id, {
        status: 'starting',
        progress: 8,
        message: statusLabel('starting'),
      });

      if (!job.file) throw new Error('Upload file is missing.');
      const validationError = validateAiDocumentFile(job.file);
      if (validationError) throw new Error(validationError);

      patchJob(job.id, {
        status: 'uploading',
        progress: 20,
        message: statusLabel('uploading'),
      });

      const uploaded = await uploadAIDocument(job.file);
      const dropReplaced = (raw: unknown) => {
        const list = Array.isArray(raw)
          ? raw.map(id => String(id || '')).filter(Boolean)
          : [];
        const ids = applyReplacedAiDocuments(list);
        if (!ids.length) return;
        const gone = new Set(ids);
        setJobs(prev =>
          prev.filter(
            item =>
              item.id === job.id ||
              !item.file_id ||
              !gone.has(String(item.file_id)),
          ),
        );
      };
      dropReplaced(uploaded.replaced_file_ids);
      buildUploadedAiFile(uploaded, job.file, {
        sectionId: 'overview',
        source: 'overview',
      });

      const terraInvoked = Boolean(uploaded.terra_invoked);
      const reuseMessage = uploaded.unchanged || uploaded.extract_reuse
        ? 'Reusing a prior read of this file…'
        : terraInvoked
          ? 'Filling in missing text…'
          : 'Reading with OCR…';

      const uploadReadSource: DashboardAiJob['readSource'] =
        uploaded.unchanged || uploaded.extract_reuse
          ? 'cache'
          : terraInvoked
            ? 'gemini'
            : uploaded.needs_vision === false
              ? 'system'
              : undefined;

      patchJob(job.id, {
        status: terraInvoked ? 'almost' : 'reading',
        progress: terraInvoked ? 72 : 45,
        message: reuseMessage,
        file_id: uploaded.file_id,
        mime_type: uploaded.mime_type,
        readSource: uploadReadSource,
        extractMethod: uploaded.extract_method,
        terraInvoked,
        pipelinePath: uploaded.pipeline_path,
      });

      almostTimersRef.current[job.id] = window.setTimeout(() => {
        setJobs(prev =>
          prev.map(item =>
            item.id === job.id && item.status === 'reading' && !item.terraInvoked
              ? {
                  ...item,
                  status: 'almost',
                  progress: Math.max(item.progress, 72),
                  message: statusLabel('almost'),
                }
              : item,
          ),
        );
      }, 4000);

      // Hard safety: never leave a job spinning forever in the UI.
      watchdog = window.setTimeout(() => {
        setJobs(prev =>
          prev.map(item =>
            item.id === job.id &&
            item.status !== 'done' &&
            item.status !== 'error'
              ? {
                  ...item,
                  status: 'error',
                  progress: 100,
                  message: statusLabel('error'),
                  error: item.error || AI_GENERIC_FAIL_USER_MESSAGE,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        activeIdsRef.current.delete(job.id);
        pumpRef.current();
      }, JOB_WATCHDOG_MS);

      try {
        await ensureFreshSession();
        // Classify first — never extract into Vital unless the doc is actually Vital.
        const classified = await withTimeout(
          autofillSectionFromDocument(
            {
              section: PROBE_SECTION_KEY,
              file_id: uploaded.file_id,
              subsection: null,
              use_routed_cache: false,
              classify_only: true,
            },
            {
              onWaiting: () =>
                patchJob(job.id, { message: 'Mapping to your vault…' }),
            },
          ),
          CLASSIFY_TIMEOUT_MS,
          'Document classify',
        );
        dropReplaced(
          (classified as { replaced_file_ids?: string[] }).replaced_file_ids,
        );

        clearAlmostTimer(job.id);

        let bestKey =
          classified.best_section ||
          (classified.matches_requested_section ? PROBE_SECTION_KEY : null) ||
          null;

        // Never dump non-vital docs into Vital just because the probe key was Vital.
        if (
          bestKey === PROBE_SECTION_KEY &&
          classified.matches_requested_section === false
        ) {
          const alt = classified.additional_sections?.find(
            (item: { section_key?: string }) =>
              item?.section_key && item.section_key !== PROBE_SECTION_KEY,
          );
          bestKey = alt?.section_key || null;
        }

        // Health cards → Insurance (structured member ID / group # fields).
        const looksHealthCard = isHealthInsuranceCardCandidate({
          documentSummary: classified.document_summary,
          fileName: job.fileName,
          sectionKey: bestKey,
          documentKind: classified.document_kind,
        });
        if (looksHealthCard) {
          bestKey = 'insurance_policies';
        }

        bestKey =
          correctBankStatementSectionKey(bestKey, {
            documentSummary: classified.document_summary,
            fileName: job.fileName,
          }) || bestKey;

        const pauseForSectionChoice = (summary?: string) => {
          patchJob(job.id, {
            status: 'needs_section_choice',
            progress: 80,
            message: statusLabel('needs_section_choice'),
            file_id: uploaded.file_id,
            mime_type: uploaded.mime_type,
            documentSummary: summary || classified.document_summary,
            readSource:
              classified.extract_reuse || classified.from_cache
                ? 'cache'
                : uploadReadSource,
            extractMethod: uploaded.extract_method,
            error: undefined,
          });
        };

        if (!bestKey) {
          pauseForSectionChoice();
          return;
        }

        const bestMeta =
          AI_SECTION_BY_KEY[bestKey] ||
          (classified.best_section_id
            ? AI_SECTION_BY_ID[classified.best_section_id]
            : null);

        const sectionId = bestMeta?.id || classified.best_section_id || '';
        const sectionKey = bestMeta?.key || bestKey;
        const subsection =
          classified.best_subsection || bestMeta?.defaultSubsection || undefined;

        if (!sectionId || !sectionKey) {
          pauseForSectionChoice();
          return;
        }

        patchJob(job.id, {
          status: 'routing',
          progress: 82,
          message: statusLabel('routing'),
          targetSectionId: sectionId,
          targetSectionKey: sectionKey,
          targetSubsection: subsection,
          targetSectionLabel:
            classified.best_section_label || bestMeta?.label,
        });

        await finishWithSection({
          jobId: job.id,
          file_id: uploaded.file_id,
          mime_type: uploaded.mime_type,
          fileName: job.fileName,
          sectionKey,
          sectionId,
          subsection,
          sectionLabel: classified.best_section_label || bestMeta?.label,
          documentSummary: classified.document_summary,
          additionalSections: (classified.additional_sections || []).filter(
            (item: { section_key?: string }) => {
              const key = item?.section_key;
              if (!key) return false;
              if ((classified.skip_section_keys || []).includes(key)) return false;
              if (
                isVehicleInsuranceDocument({
                  fileName: job.fileName,
                  documentSummary: classified.document_summary,
                  documentKind: classified.document_kind,
                }) &&
                key === 'health_information'
              ) {
                return false;
              }
              return true;
            },
          ),
          skipSectionKeys: classified.skip_section_keys || [],
          alreadyExtracted: false,
          readSource:
            classified.extract_reuse || classified.from_cache
              ? 'cache'
              : uploadReadSource,
          extractMethod: uploaded.extract_method,
        });
      } catch (error) {
        clearAlmostTimer(job.id);

        if (error instanceof AiDocumentMismatchError) {
          patchJob(job.id, {
            status: 'routing',
            progress: 80,
            message: statusLabel('routing'),
          });

          let suggestedKey = error.detail.suggested_section;
          const looksHealthCard = isHealthInsuranceCardCandidate({
            documentSummary: error.detail.document_summary,
            fileName: job.fileName,
            sectionKey: suggestedKey,
            documentKind: (error.detail as { document_kind?: string }).document_kind,
          });
          if (looksHealthCard) {
            suggestedKey = 'insurance_policies';
          }

          const suggestedMeta =
            AI_SECTION_BY_KEY[suggestedKey] ||
            (error.detail.suggested_section_id
              ? AI_SECTION_BY_ID[error.detail.suggested_section_id]
              : null);
          const sectionId =
            suggestedMeta?.id || error.detail.suggested_section_id || '';
          const sectionKey = suggestedMeta?.key || suggestedKey;

          if (!sectionId || !sectionKey) {
            patchJob(job.id, {
              status: 'needs_section_choice',
              progress: 80,
              message: statusLabel('needs_section_choice'),
              file_id: uploaded.file_id,
              mime_type:
                uploaded.mime_type || error.detail.mime_type || 'application/pdf',
              documentSummary: error.detail.document_summary,
              readSource: uploadReadSource,
              extractMethod: uploaded.extract_method,
              error: undefined,
            });
            return;
          }

          // Point the matching overview task card at this job while filling.
          patchJob(job.id, {
            status: 'routing',
            progress: 82,
            message: statusLabel('routing'),
            targetSectionId: sectionId,
            targetSectionKey: sectionKey,
            targetSubsection:
              error.detail.suggested_subsection ||
              suggestedMeta?.defaultSubsection,
            targetSectionLabel:
              error.detail.suggested_section_label || suggestedMeta?.label,
          });

          await finishWithSection({
            jobId: job.id,
            file_id: uploaded.file_id,
            mime_type: uploaded.mime_type || error.detail.mime_type || 'application/pdf',
            fileName: job.fileName,
            sectionKey,
            sectionId,
            subsection:
              error.detail.suggested_subsection ||
              suggestedMeta?.defaultSubsection,
            sectionLabel:
              error.detail.suggested_section_label || suggestedMeta?.label,
            documentSummary: error.detail.document_summary,
            additionalSections: error.detail.additional_sections,
            alreadyExtracted: false,
            readSource: uploadReadSource,
            extractMethod: uploaded.extract_method,
          });
          return;
        }

        if (error instanceof AiDocumentUnavailableError) throw error;
        throw error;
      }
    } catch (error: any) {
      clearAlmostTimer(job.id);
      if (job.file_id) {
        routing?.clearAllPendingForFile(job.file_id);
      }
      patchJob(job.id, {
        status: 'error',
        progress: 100,
        message: statusLabel('error'),
        error: toAiUserFacingMessage(
          error?.message || 'We could not process this document.',
        ),
      });
    } finally {
      if (watchdog) window.clearTimeout(watchdog);
      activeIdsRef.current.delete(job.id);
      pumpRef.current();
    }
  };

  pumpRef.current = () => {
    const snapshot = jobsRef.current;
    while (activeIdsRef.current.size < MAX_CONCURRENT) {
      const next = snapshot.find(
        job => job.status === 'queued' && !activeIdsRef.current.has(job.id),
      );
      if (!next) break;

      activeIdsRef.current.add(next.id);
      patchJob(next.id, {
        status: 'starting',
        progress: 5,
        message: statusLabel('starting'),
      });
      void processRef.current(next);
    }

    const stillWorking = jobsRef.current.some(job =>
      ACTIVE_STATUSES.includes(job.status),
    );
    if (!stillWorking) {
      routing?.setBatchSilentMode(false);
    }
  };

  const enqueueFiles = useCallback(
    (
      files: FileList | File[],
      opts?: { sectionId?: string; source?: 'overview' | 'section' },
    ) => {
      const list = Array.from(files);
      if (!list.length) return;

      const sectionId = opts?.sectionId
        ? toVaultSectionId(opts.sectionId) || String(opts.sectionId).trim()
        : undefined;
      const source = opts?.source || (sectionId ? 'section' : 'overview');
      const now = new Date().toISOString();
      const nextJobs: DashboardAiJob[] = list.map(file => ({
        id: createJobId(),
        file,
        fileName: file.name,
        status: 'queued' as const,
        progress: 0,
        message: statusLabel('queued'),
        createdAt: now,
        updatedAt: now,
      }));

      // Stamp footprints immediately so older uploads are never dropped from history.
      nextJobs.forEach(job => {
        upsertAiUploadHistory({
          id: job.id,
          fileName: job.fileName,
          status: job.status,
          progress: 0,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          sectionId: sectionId || undefined,
          sectionIds: sectionId ? [sectionId] : undefined,
          source,
        });
      });

      routing?.setBatchSilentMode(true);
      setJobs(prev => {
        const merged = [...nextJobs, ...prev];
        jobsRef.current = merged;
        return merged;
      });

      window.setTimeout(() => pumpRef.current(), 0);
    },
    [routing],
  );

  const clearFinished = useCallback(() => {
    setJobs(prev =>
      prev.filter(job => job.status !== 'done' && job.status !== 'error'),
    );
  }, []);

  const dismissJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  }, []);

  const resolveSectionChoice = useCallback(
    async (jobId: string, sectionId: string) => {
      const job = jobsRef.current.find(item => item.id === jobId);
      if (!job?.file_id) {
        throw new Error('Document is not ready to assign yet.');
      }
      const meta = AI_SECTION_BY_ID[sectionId];
      if (!meta?.key) {
        throw new Error('Choose a valid vault section.');
      }

      if (activeIdsRef.current.has(jobId)) {
        throw new Error('This document is already being processed.');
      }

      activeIdsRef.current.add(jobId);
      routing?.setBatchSilentMode(true);
      patchJob(jobId, {
        status: 'routing',
        progress: 82,
        message: statusLabel('routing'),
        targetSectionId: meta.id,
        targetSectionKey: meta.key,
        targetSubsection: meta.defaultSubsection,
        targetSectionLabel: meta.label,
        error: undefined,
      });

      try {
        await finishWithSection({
          jobId,
          file_id: job.file_id,
          mime_type: job.mime_type || 'application/pdf',
          fileName: job.fileName,
          sectionKey: meta.key,
          sectionId: meta.id,
          subsection: meta.defaultSubsection,
          sectionLabel: meta.label,
          documentSummary: job.documentSummary,
          additionalSections: [],
          alreadyExtracted: false,
          readSource: job.readSource,
          extractMethod: job.extractMethod,
        });
      } catch (error: any) {
        patchJob(jobId, {
          status: 'needs_section_choice',
          progress: 80,
          message: statusLabel('needs_section_choice'),
          error: toAiUserFacingMessage(
            error?.message || 'Could not fill that section. Try another.',
          ),
        });
        throw error;
      } finally {
        activeIdsRef.current.delete(jobId);
        const stillWorking = jobsRef.current.some(item =>
          ACTIVE_STATUSES.includes(item.status),
        );
        if (!stillWorking) {
          routing?.setBatchSilentMode(false);
        }
        pumpRef.current();
      }
    },
    [finishWithSection, patchJob, routing],
  );

  /**
   * Move an already-uploaded document into a different vault section
   * when AI routed it incorrectly (or the user prefers another home).
   */
  const reassignDocumentSection = useCallback(
    async (args: {
      fileId: string;
      fileName: string;
      mimeType?: string;
      sectionId: string;
      documentSummary?: string | null;
      historyId?: string;
      previousSectionId?: string | null;
    }) => {
      const fileId = String(args.fileId || '').trim();
      if (!fileId) throw new Error('Document file is missing.');
      const meta = AI_SECTION_BY_ID[args.sectionId];
      if (!meta?.key) throw new Error('Choose a valid vault section.');

      // Allow a fresh fill for this document × target section.
      clearAiAutofillDoneForFileSection(meta.id, fileId);
      takeDashboardAiPatch(meta.id, fileId);
      if (args.previousSectionId && args.previousSectionId !== meta.id) {
        clearAiAutofillDoneForFileSection(args.previousSectionId, fileId);
      }

      const jobId = args.historyId || createJobId();
      const now = new Date().toISOString();
      const nextJob: DashboardAiJob = {
        id: jobId,
        file: null,
        fileName: args.fileName || 'Uploaded document',
        status: 'routing',
        progress: 82,
        message: statusLabel('routing'),
        createdAt: now,
        updatedAt: now,
        file_id: fileId,
        mime_type: args.mimeType || 'application/pdf',
        targetSectionId: meta.id,
        targetSectionKey: meta.key,
        targetSubsection: meta.defaultSubsection,
        targetSectionLabel: meta.label,
        documentSummary: args.documentSummary || undefined,
      };

      if (activeIdsRef.current.has(jobId)) {
        throw new Error('This document is already being processed.');
      }

      activeIdsRef.current.add(jobId);
      routing?.setBatchSilentMode(true);
      setJobs(prev => {
        const without = prev.filter(item => item.id !== jobId);
        const merged = [nextJob, ...without];
        jobsRef.current = merged;
        return merged;
      });

      try {
        await finishWithSection({
          jobId,
          file_id: fileId,
          mime_type: args.mimeType || 'application/pdf',
          fileName: args.fileName || 'Uploaded document',
          sectionKey: meta.key,
          sectionId: meta.id,
          subsection: meta.defaultSubsection,
          sectionLabel: meta.label,
          documentSummary: args.documentSummary || undefined,
          additionalSections: [],
          alreadyExtracted: false,
        });
      } catch (error: any) {
        patchJob(jobId, {
          status: 'error',
          progress: 100,
          message: statusLabel('error'),
          error: toAiUserFacingMessage(
            error?.message || 'Could not move this document. Try again.',
          ),
        });
        throw error;
      } finally {
        activeIdsRef.current.delete(jobId);
        const stillWorking = jobsRef.current.some(item =>
          ACTIVE_STATUSES.includes(item.status),
        );
        if (!stillWorking) {
          routing?.setBatchSilentMode(false);
        }
        pumpRef.current();
      }
    },
    [finishWithSection, patchJob, routing],
  );

  const readingCount = jobs.filter(
    job =>
      job.status !== 'queued' &&
      job.status !== 'done' &&
      job.status !== 'error' &&
      job.status !== 'needs_section_choice',
  ).length;
  const waitingCount = jobs.filter(job => job.status === 'queued').length;
  const doneJobs = jobs.filter(
    job => job.status === 'done' && job.targetSectionId,
  );
  const needsSectionChoiceJobs = jobs.filter(
    job => job.status === 'needs_section_choice',
  );
  const processingJobs = jobs.filter(
    job =>
      job.status !== 'done' &&
      job.status !== 'needs_section_choice' &&
      job.status !== 'error',
  );

  return {
    jobs,
    processingJobs,
    doneJobs,
    needsSectionChoiceJobs,
    activeCount: readingCount,
    waitingCount,
    doneCount: doneJobs.length,
    enqueueFiles,
    clearFinished,
    dismissJob,
    resolveSectionChoice,
    reassignDocumentSection,
    maxConcurrent: MAX_CONCURRENT,
  };
}
