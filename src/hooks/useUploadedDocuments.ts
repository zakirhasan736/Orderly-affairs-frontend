'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOptionalDashboardAiBatch } from '@/contexts/DashboardAiBatchContext';
import { useListOwnerAiDocumentsQuery } from '@/services/aiDocumentsApi';
import {
  hydrateAiUploadHistoryFromServer,
  itemMatchesSection,
  listAiUploadHistory,
  mapServerDocumentsToHistory,
  type AiUploadHistoryItem,
} from '@/utils/aiUploadHistory';

const SHARED_LIST_OPTIONS = {
  pollingInterval: 45_000,
  refetchOnMountOrArgChange: 15,
  refetchOnFocus: true,
  refetchOnReconnect: true,
} as const;

export function useUploadedDocuments(sectionId?: string | null) {
  const [tick, setTick] = useState(0);
  const batch = useOptionalDashboardAiBatch();
  const jobs = batch?.jobs || [];

  const refresh = useCallback(() => setTick(value => value + 1), []);

  const { data: serverDocs, isLoading, isFetching, isSuccess } =
    useListOwnerAiDocumentsQuery(undefined, SHARED_LIST_OPTIONS);

  useEffect(() => {
    if (!isSuccess || !serverDocs) return;
    hydrateAiUploadHistoryFromServer(serverDocs);
    refresh();
  }, [isSuccess, serverDocs, refresh]);

  useEffect(() => {
    refresh();
    const onHistory = () => refresh();
    window.addEventListener('orderly-ai-upload-history', onHistory);
    return () => {
      window.removeEventListener('orderly-ai-upload-history', onHistory);
    };
  }, [refresh]);

  const items = useMemo(() => {
    void tick;
    const serverItems = mapServerDocumentsToHistory(serverDocs || []);
    const history = listAiUploadHistory(
      sectionId ? { sectionId } : undefined,
    );
    const scopedServer = sectionId
      ? serverItems.filter(item => itemMatchesSection(item, sectionId))
      : serverItems;

    const merged: AiUploadHistoryItem[] = [];
    const seen = new Set<string>();
    const mark = (item: AiUploadHistoryItem) => {
      seen.add(item.id);
      if (item.fileId) seen.add(item.fileId);
      seen.add(`${item.fileName}|${item.sectionId || ''}`);
    };

    for (const item of scopedServer) {
      merged.push(item);
      mark(item);
    }
    for (const item of history) {
      if (seen.has(item.id) || (item.fileId && seen.has(item.fileId))) continue;
      merged.push(item);
      mark(item);
    }

    const extras: AiUploadHistoryItem[] = [];
    for (const job of jobs) {
      if (sectionId) {
        const want = String(sectionId);
        const jobSection = String(job.targetSectionId || '');
        if (jobSection && jobSection !== want) continue;
      }
      if (seen.has(job.id) || (job.file_id && seen.has(job.file_id))) continue;
      extras.push({
        id: job.id,
        fileName: job.fileName,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        fileId: job.file_id,
        mimeType: job.mime_type,
        sectionId: job.targetSectionId,
        targetSectionLabel: job.targetSectionLabel,
        source: job.targetSectionId ? 'section' : 'overview',
      });
    }
    return [...extras, ...merged];
  }, [jobs, sectionId, serverDocs, tick]);

  const processingCount = items.filter(item => {
    const status = String(item.status || '').toLowerCase();
    return (
      status === 'queued' ||
      status === 'processing' ||
      status === 'uploading' ||
      status === 'starting' ||
      status === 'reading' ||
      status === 'almost' ||
      status === 'routing' ||
      status === 'filling'
    );
  }).length;

  const linkedFromOverview = Boolean(
    sectionId &&
      items.some(
        item =>
          item.source === 'overview' &&
          String(item.status || '').toLowerCase() !== 'error',
      ),
  );

  return {
    items,
    count: items.length,
    processingCount,
    previewItems: items.slice(0, 3),
    linkedFromOverview,
    isLoading: isLoading && !serverDocs,
    isFetching,
    refresh,
  };
}
