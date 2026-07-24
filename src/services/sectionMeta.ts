import { secureFetch } from '@/libs/secureFetch';
import {
  listSectionLastUpdated,
  mergeSectionLastUpdated,
} from '@/utils/sectionLastUpdated';

export async function fetchSectionsUpdatedAt(): Promise<Record<string, string>> {
  try {
    const res = await secureFetch('/sections/updated-at', { method: 'GET' });
    if (!res.ok) return listSectionLastUpdated();
    const json = (await res.json()) as { sections?: Record<string, string> };
    const sections =
      json?.sections && typeof json.sections === 'object' ? json.sections : {};
    mergeSectionLastUpdated(sections);
    return { ...listSectionLastUpdated() };
  } catch {
    return listSectionLastUpdated();
  }
}
