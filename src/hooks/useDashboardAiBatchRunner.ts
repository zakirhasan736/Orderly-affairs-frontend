import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadAIDocument } from '@/services/aiDocumentUpload';
import { autofillSectionFromDocument } from '@/services/aiAutofill';
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
import { stashDashboardAiPatch } from '@/utils/aiDashboardPatchCache';
import { unwrapAiAutofillPatch } from '@/utils/aiPatchNormalizer';
import {
  flattenDetectedFactsFromPatch,
  type DetectedFact,
} from '@/utils/aiSemanticFieldMatch';
import { persistAiResultToSectionBackground } from '@/services/aiBackgroundSectionPersist';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import { getSectionFieldCatalog } from '@/utils/aiSectionFieldCatalog';
import { markAiSectionFilled } from '@/utils/aiSectionFillGuard';
import { markAiAutofillDoneForSection } from '@/utils/aiAutofillDoneSections';
import { upsertAiUploadHistory } from '@/utils/aiUploadHistory';

/** Always also fill related sections in background when one of the pair is targeted. */
const FORCE_BACKGROUND_PARTNERS: Record<string, string[]> = {
  vehicles: ['insurance_policies'],
  insurance_policies: ['vehicles', 'main_residence'],
  health_information: ['insurance_policies'],
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

async function stashAndPersist(args: {
  file_id: string;
  fileName: string;
  sectionId: string;
  sectionKey: string;
  subsection?: string | null;
  result: unknown;
  detectedFields?: DetectedFact[];
  documentSummary?: string;
  onFilled?: (meta: {
    file_id: string;
    sectionId: string;
    fileName: string;
  }) => void;
}) {
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
  });

  // Background: merge into saved section data — user does not open the section.
  const persistResult = await persistAiResultToSectionBackground({
    sectionId: args.sectionId,
    sectionKey: args.sectionKey,
    result: args.result,
    subsection: args.subsection,
  });

  if (persistResult.ok) {
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
    message: 'Filling related sections in background…',
  });

  await Promise.allSettled(
    partnerList.map(async partnerKey => {
      const partnerMeta = AI_SECTION_BY_KEY[partnerKey];
      if (!partnerMeta) return;

      try {
        const cached = partnerResults?.[partnerKey];
        let result = cached;
        let summary = documentSummary;

        if (!result) {
          const partnerFilled = await withTimeout(
            autofillSectionFromDocument({
              section: partnerKey,
              file_id,
              subsection: partnerMeta.defaultSubsection || null,
              use_routed_cache: true,
              field_catalog: catalogForSection(partnerKey, null),
            }),
            45000,
            `Partner fill ${partnerKey}`,
          );
          result = partnerFilled.result;
          summary = partnerFilled.document_summary || documentSummary;
        }

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
      }
    }),
  );
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
      return 'Waiting…';
    case 'starting':
      return 'Starting…';
    case 'uploading':
      return 'Uploading…';
    case 'reading':
      return 'Reading document…';
    case 'almost':
      return 'Almost done…';
    case 'routing':
      return 'Finding the right section…';
    case 'filling':
      return 'Auto-filling matched sections…';
    case 'done':
      return 'Filled automatically';
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
      } = args;

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

      // Already filling in background — only guide user to review, never re-run autofill.
      routing?.queueRoutedSectionsSilently(
        {
          code: 'section_mismatch',
          message: 'Dashboard routed document',
          requested_section: sectionKey,
          suggested_section: sectionKey,
          suggested_section_id: sectionId,
          suggested_section_label: sectionLabel,
          suggested_subsection: subsection,
          document_summary: documentSummary,
          file_id,
          mime_type,
          additional_sections: additionalSections,
        },
        {
          currentSectionId: 'dashboard',
          navigateIntent: 'review',
        },
      );

      const markPrimaryDone = () => {
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
          documentSummary,
          activeFillSectionId: undefined,
        });
      };

      const runPartnersInBackground = (opts: {
        documentSummary?: string;
        additionalSections?: any[];
        partnerResults?: Record<string, unknown>;
      }) => {
        void fillPartnerSectionsFast({
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
        }).catch(err => {
          console.warn('Background partner fill failed', err);
        });
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
              onFilled: () => notifySectionFilled(sectionId),
            }),
            35000,
            'Primary persist',
          );
        } catch (persistError) {
          console.warn('Dashboard primary persist failed', persistError);
        }

        markPrimaryDone();
        runPartnersInBackground({ documentSummary, additionalSections });
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
        const filled = await withTimeout(
          autofillSectionFromDocument({
            section: sectionKey,
            file_id,
            subsection: subsection || null,
            use_routed_cache: true,
            field_catalog: catalogForSection(sectionKey, null),
          }),
          90000,
          'Primary autofill',
        );

        patchJob(jobId, {
          status: 'filling',
          progress: 94,
          message: 'Saving filled fields…',
          activeFillSectionId: sectionId,
        });

        await withTimeout(
          stashAndPersist({
            file_id,
            fileName,
            sectionId,
            sectionKey,
            subsection,
            result: filled.result,
            detectedFields: factsFromFill(filled),
            documentSummary: filled.document_summary || documentSummary,
            onFilled: () => notifySectionFilled(sectionId),
          }),
          35000,
          'Primary persist',
        );

        if (filled.additional_sections?.length) {
          routing?.queueRoutedSectionsSilently(
            {
              code: 'section_mismatch',
              message: 'Additional sections found',
              requested_section: sectionKey,
              suggested_section: sectionKey,
              suggested_section_id: sectionId,
              suggested_section_label: sectionLabel,
              document_summary: filled.document_summary,
              file_id,
              mime_type,
              additional_sections: filled.additional_sections,
            },
            {
              currentSectionId: 'dashboard',
              navigateIntent: 'review',
            },
          );
        }

        markPrimaryDone();
        runPartnersInBackground({
          documentSummary: filled.document_summary || documentSummary,
          additionalSections:
            filled.additional_sections || additionalSections || [],
          partnerResults: (
            filled as { partner_results?: Record<string, unknown> }
          ).partner_results,
        });
      } catch (fillError) {
        if (!(fillError instanceof AiDocumentMismatchError)) {
          console.warn('Dashboard autofill warm failed', fillError);
        }
        // Still mark done so the UI never hangs at 95% "Reading".
        markPrimaryDone();
        runPartnersInBackground({ documentSummary, additionalSections });
      }
    },
    [patchJob, routing],
  );

  processRef.current = async (job: DashboardAiJob) => {
    clearAlmostTimer(job.id);
    routing?.setBatchSilentMode(true);
    let watchdog: number | undefined;

    try {
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
      buildUploadedAiFile(uploaded, job.file, {
        sectionId: 'overview',
        source: 'overview',
      });

      patchJob(job.id, {
        status: 'reading',
        progress: 45,
        message: statusLabel('reading'),
        file_id: uploaded.file_id,
        mime_type: uploaded.mime_type,
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
                    'Document processing took too long. Please try uploading again.',
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        activeIdsRef.current.delete(job.id);
        pumpRef.current();
      }, 180000);

      try {
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
          });
          return;
        }

        if (error instanceof AiDocumentUnavailableError) throw error;
        throw error;
      }
    } catch (error: any) {
      clearAlmostTimer(job.id);
      patchJob(job.id, {
        status: 'error',
        progress: 100,
        message: statusLabel('error'),
        error: error?.message || 'Could not process this document',
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
