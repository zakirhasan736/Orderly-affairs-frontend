import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '@/libs/baseQueryWithReauth';
import type { OwnerAiDocument } from '@/services/aiDocumentUpload';

type DocumentsListResponse = {
  documents?: OwnerAiDocument[];
};

/**
 * Cached owner AI document list — avoids refetching GET /ai/documents
 * every time the upload history popup opens or polls.
 */
export const aiDocumentsApi = createApi({
  reducerPath: 'aiDocumentsApi',
  baseQuery: createSecureBaseQuery('/ai'),
  tagTypes: ['AiDocuments'],
  keepUnusedDataFor: 120,
  endpoints: builder => ({
    listOwnerAiDocuments: builder.query<OwnerAiDocument[], void>({
      query: () => ({ url: '/documents', method: 'GET' }),
      transformResponse: (response: DocumentsListResponse | OwnerAiDocument[]) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.documents)) return response.documents;
        return [];
      },
      providesTags: ['AiDocuments'],
    }),
  }),
});

export const {
  useListOwnerAiDocumentsQuery,
  useLazyListOwnerAiDocumentsQuery,
} = aiDocumentsApi;
