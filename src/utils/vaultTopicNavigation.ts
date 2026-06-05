import { useEffect } from 'react';

import { getTopicElementId } from '@/utils/dynamicVaultTopics';

export const VAULT_TOPIC_ACTIVE_CLASS =
  'scroll-mt-28 border-blue-300 ring-2 ring-blue-100 transition';

export function getTopicCardProps(
  subsectionId: string,
  index: number,
  activeTopicId?: string | null,
  topicGroupKey?: string,
) {
  const topicId = topicGroupKey
    ? `${subsectionId}:${topicGroupKey}:${index}`
    : `${subsectionId}:${index}`;
  const isActive = activeTopicId === topicId;

  return {
    topicId,
    id: getTopicElementId(topicId),
    isActive,
    className: `${
      isActive
        ? VAULT_TOPIC_ACTIVE_CLASS
        : 'scroll-mt-28 border-slate-200 shadow-sm'
    } overflow-hidden`,
  };
}

export function useScrollToVaultTopic(
  activeTopicId?: string | null,
  watchKey?: unknown,
) {
  useEffect(() => {
    if (!activeTopicId) return;

    const element = document.getElementById(getTopicElementId(activeTopicId));
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTopicId, watchKey]);
}
