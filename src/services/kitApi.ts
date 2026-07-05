import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '@/libs/baseQueryWithReauth';

export const kitApi = createApi({
  reducerPath: 'kitApi',
  baseQuery: createSecureBaseQuery('/kit'),
  tagTypes: ['Kit'],
  endpoints: b => ({
    getKit: b.query<any, void>({
      query: () => ({ url: '', method: 'GET' }),
      providesTags: ['Kit'],
    }),
    getKitForNok: b.query<any, void>({
      query: () => ({ url: '/nok', method: 'GET' }),
      providesTags: ['Kit'],
    }),
    upsertSection: b.mutation<
      { message: string },
      { sectionId: string; data: any }
    >({
      query: ({ sectionId, data }) => ({
        url: `/section/${sectionId}`,
        method: 'PUT',
        body: { data },
      }),
      invalidatesTags: ['Kit'],
    }),
    upsertSubsection: b.mutation<
      { message: string },
      { sectionId: string; subsectionId: string; data: any }
    >({
      query: ({ sectionId, subsectionId, data }) => ({
        url: `/section/${sectionId}/subsection/${subsectionId}`,
        method: 'PUT',
        body: { data },
      }),
      invalidatesTags: ['Kit'],
    }),
    deleteSection: b.mutation<{ message: string }, string>({
      query: sectionId => ({
        url: `/section/${sectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Kit'],
    }),
    deleteSubsection: b.mutation<
      { message: string },
      { sectionId: string; subsectionId: string }
    >({
      query: ({ sectionId, subsectionId }) => ({
        url: `/section/${sectionId}/subsection/${subsectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Kit'],
    }),
  }),
});

export const {
  useGetKitQuery,
  useGetKitForNokQuery,
  useUpsertSectionMutation,
  useUpsertSubsectionMutation,
  useDeleteSectionMutation,
  useDeleteSubsectionMutation,
} = kitApi;
