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
import { markAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import {
  linkAiUploadHistorySections,
  removeReplacedAiUploadFileIds,
  upsertAiUploadHistory,
} from '@/utils/aiUploadHistory';
import { toAiUserFacingMessage } from '@/utils/aiUserFacingError';
// Person/section approval happens in AiOverviewReadMatchDialog after stash.

/** Always also fill related sections when one of the pair is targeted. */
const FORCE_BACKGROUND_PARTNERS: Record<string, string[]> = {
  // Vehicles docs always carry policy fields → fill Insurance.
  vehicles: ['insurance_policies'],
  // Insurance → Vehicles only via classifier additional_sections (auto docs).
  health_information: ['insurance_policies'],
  // Health cards often classify as insurance first — also fill Health.
  insurance_policies: ['health_information'],
  employment_business: ['banking_financial_accounts'],
  banking_financial_accounts: ['investment_accounts'],
  investment_accounts: ['banking_financial_accounts'],
  main_residence: ['insurance_policies'],
  legal_documents_records: ['estate_planning_final_wishes'],
  estate_planning_final_wishes: ['legal_documents_records'],
  assets_valuables: ['insurance_policies'],
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

/** Build a Healthcare 15A summary card from an Insurance policy extract. */
function seedHealthFromInsuranceResult(insuranceResult: unknown): unknown | null {
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

  const partnerList = [...partnerKeys].slice(0, 4);
  if (!partnerList.length) return;

  // Soft progress nudge only — job may already be marked done.
  patchJob(jobId, {
    message: 'Filling related sections one by one…',
  });

  // Sequential: full document → related section A (catalog map) → B → …
  // Prefer a full extract; fall back to insurance→vehicles cross-seed so
  // "New data" still appears when the partner LLM returns empty.
  for (const partnerKey of partnerList) {
    const partnerMeta = AI_SECTION_BY_KEY[partnerKey];
    if (!partnerMeta) continue;

    let seedHint = partnerResults?.[partnerKey];
    // Health cards often fill Insurance first; if partner extract fails later,
    // still badge Healthcare from the insurance policy fields.
    if (
      !seedHint &&
      partnerKey === 'health_information' &&
      sectionKey === 'insurance_policies'
    ) {
      const insuranceStash = listDashboardAiPatchesForSection('7').find(
        item => item.file_id === file_id,
      );
      seedHint =
        seedHealthFromInsuranceResult(insuranceStash?.result) || undefined;
    }
    const summaryFallback = documentSummary;

    // Stash seed immediately so Vehicles badges before the slower partner extract.
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
        autofillSectionFromDocument({
          section: partnerKey,
          file_id,
          subsection: partnerMeta.defaultSubsection || null,
          use_routed_cache: true,
          // Server cannot merge E2EE v3 ciphertext — client persists immediately.
          defer_persist: true,
          field_catalog: catalogForSection(partnerKey, null),
        }),
        60000,
        `Partner fill ${partnerKey}`,
      );

      let result = partnerFilled.result;
      const extractPatch = unwrapAiAutofillPatch(result);
      // Empty / missing extract → keep the cross-seed bridge.
      if (!aiPatchHasValues(extractPatch) && seedHint) {
        result = seedHint;
      }

      if (!aiPatchHasValues(unwrapAiAutofillPatch(result))) {
        console.warn(
          'Partner fill produced no values; skipping empty stash',
          partnerKey,
        );
        continue;
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
      // If live partner extract 404'd (doc status ready) but we have a seed,
      // ensure Healthcare still has a reviewable stash.
      if (
        partnerKey === 'health_information' &&
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
  }

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
  | 'done'
  | 'error';

export type DashboardAiJob = {
  id: string;
  file: File;
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
  /** Section currently being filled (primary or partner). */
  activeFillSectionId?: string;
  /** When the file was queued / uploaded. */
  createdAt: string;
  /** Last status change (reading, filled, error, …). */
  updatedAt: string;
};

const MAX_CONCURRENT = 1;
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
      return 'In queue…';
    case 'starting':
      return 'Preparing secure upload…';
    case 'uploading':
      return 'Uploading securely…';
    case 'reading':
      return 'Reading your document…';
    case 'almost':
      return 'Finishing the read…';
    case 'routing':
      return 'Matching vault sections…';
    case 'filling':
      return 'Filling matched fields…';
    case 'done':
      return 'Ready to review';
    case 'error':
      return 'Needs attention';
    default:
      return 'Working…';
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
          targetSectionLabel:
            sectionLabel || AI_SECTION_BY_ID[sectionId]?.label || 'Section',
          documentSummary: extra?.documentSummary ?? documentSummary,
          activeFillSectionId: undefined,
          readSource: extra?.readSource ?? readSource,
          extractMethod: extra?.extractMethod ?? extractMethod,
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
          autofillSectionFromDocument({
            section: sectionKey,
            file_id,
            subsection: subsection || null,
            use_routed_cache: true,
            // Server cannot merge E2EE v3 ciphertext — client persists immediately.
            defer_persist: true,
            field_catalog: catalogForSection(sectionKey, null),
          }),
          90000,
          'Primary autofill',
        );

        patchJob(jobId, {
          status: 'filling',
          progress: 94,
          message: 'Ready for your review…',
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

      const validationError = validateAiDocumentFile(job.file);
      if (validationError) throw new Error(validationError);

      patchJob(job.id, {
        status: 'uploading',
        progress: 20,
        message: statusLabel('uploading'),
      });

      const uploaded = await uploadAIDocument(job.file);
      if (Array.isArray(uploaded.replaced_file_ids) && uploaded.replaced_file_ids.length) {
        removeReplacedAiUploadFileIds(uploaded.replaced_file_ids.map(String));
      }
      buildUploadedAiFile(uploaded, job.file, {
        sectionId: 'overview',
        source: 'overview',
      });

      const reuseMessage =
        uploaded.unchanged || uploaded.extract_reuse
          ? 'Reusing a prior read of this file…'
          : uploaded.needs_vision === false
            ? 'Our system is reading the text…'
            : 'Virtual Assistant is reading the document…';

      const uploadReadSource: DashboardAiJob['readSource'] =
        uploaded.unchanged || uploaded.extract_reuse
          ? 'cache'
          : uploaded.needs_vision === false
            ? 'system'
            : uploaded.needs_vision === true
              ? 'gemini'
              : undefined;

      patchJob(job.id, {
        status: 'reading',
        progress: 45,
        message: reuseMessage,
        file_id: uploaded.file_id,
        mime_type: uploaded.mime_type,
        readSource: uploadReadSource,
        extractMethod: uploaded.extract_method,
      });

      almostTimersRef.current[job.id] = window.setTimeout(() => {
        setJobs(prev =>
          prev.map(item =>
            item.id === job.id &&
            (item.status === 'reading' || item.status === 'routing')
              ? {
                  ...item,
                  status: 'almost',
                  progress: Math.max(item.progress, 72),
                  message: statusLabel('almost'),
                }
              : item,
          ),
        );
      }, 700);

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
                  error:
                    item.error ||
                    toAiUserFacingMessage(
                      'Document processing took too long. Please try uploading again.',
                    ),
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        activeIdsRef.current.delete(job.id);
        pumpRef.current();
      }, 180000);

      try {
        await ensureFreshSession();
        // Classify first — never extract into Vital unless the doc is actually Vital.
        const classified = await withTimeout(
          autofillSectionFromDocument({
            section: PROBE_SECTION_KEY,
            file_id: uploaded.file_id,
            subsection: null,
            use_routed_cache: false,
            classify_only: true,
          }),
          75000,
          'Document classify',
        );

        clearAlmostTimer(job.id);

        let bestKey =
          classified.best_section ||
          (classified.matches_requested_section ? PROBE_SECTION_KEY : null) ||
          PROBE_SECTION_KEY;

        // Never dump non-vital docs into Vital just because the probe key was Vital.
        if (
          bestKey === PROBE_SECTION_KEY &&
          classified.matches_requested_section === false
        ) {
          const alt = classified.additional_sections?.find(
            (item: { section_key?: string }) =>
              item?.section_key && item.section_key !== PROBE_SECTION_KEY,
          );
          if (alt?.section_key) {
            bestKey = alt.section_key;
          } else {
            throw new Error(
              'Could not tell which section this document belongs to. Open the matching section and upload there.',
            );
          }
        }

        const bestMeta =
          AI_SECTION_BY_KEY[bestKey] ||
          (classified.best_section_id
            ? AI_SECTION_BY_ID[classified.best_section_id]
            : null);

        const sectionId = bestMeta?.id || classified.best_section_id || PROBE_SECTION_ID;
        const sectionKey = bestMeta?.key || bestKey;
        const subsection =
          classified.best_subsection || bestMeta?.defaultSubsection || undefined;

        if (!sectionId || !sectionKey) {
          throw new Error('Could not classify this document to a section.');
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
          additionalSections: classified.additional_sections,
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

          const suggestedKey = error.detail.suggested_section;
          const suggestedMeta =
            AI_SECTION_BY_KEY[suggestedKey] ||
            (error.detail.suggested_section_id
              ? AI_SECTION_BY_ID[error.detail.suggested_section_id]
              : null);
          const sectionId =
            suggestedMeta?.id || error.detail.suggested_section_id || '';
          const sectionKey = suggestedMeta?.key || suggestedKey;

          if (!sectionId || !sectionKey) {
            throw new Error('Could not classify this document to a section.');
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
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;

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
          source: 'overview',
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

  const readingCount = jobs.filter(
    job =>
      job.status !== 'queued' &&
      job.status !== 'done' &&
      job.status !== 'error',
  ).length;
  const waitingCount = jobs.filter(job => job.status === 'queued').length;
  const doneJobs = jobs.filter(
    job => job.status === 'done' && job.targetSectionId,
  );
  const processingJobs = jobs.filter(job => job.status !== 'done');

  return {
    jobs,
    processingJobs,
    doneJobs,
    activeCount: readingCount,
    waitingCount,
    doneCount: doneJobs.length,
    enqueueFiles,
    clearFinished,
    dismissJob,
    maxConcurrent: MAX_CONCURRENT,
  };
}
