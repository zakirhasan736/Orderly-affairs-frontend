import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export const kitApi = createApi({
  reducerPath: 'kitApi',
  baseQuery: fetchBaseQuery({
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '') + '/kit',
    credentials: 'include',
    prepareHeaders: (h, api) => {
      const isNok = api.endpoint === 'getKitForNok';
      const token = isNok
        ? Cookies.get('nok_auth_token')
        : Cookies.get('auth_token');
      if (token) h.set('Authorization', `Bearer ${token}`);
      h.set('Content-Type', 'application/json');
      return h;
    },
  }),
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
      { sectionId: string; subId: string; data: any }
    >({
      query: ({ sectionId, subId, data }) => ({
        url: `/section/${sectionId}/subsection/${subId}`,
        method: 'PUT',
        body: { data },
      }),
      invalidatesTags: ['Kit'],
    }),
    updateToggles: b.mutation<
      { message: string },
      { disabled_sections: any; disabled_subsections: any }
    >({
      query: body => ({ url: `/toggles`, method: 'PUT', body }),
      invalidatesTags: ['Kit'],
    }),
    migrateFromForms: b.mutation<{ message: string }, any>({
      query: body => ({ url: `/migrate-from-forms`, method: 'POST', body }),
      invalidatesTags: ['Kit'],
    }),
  }),
});

export const {
  useGetKitQuery,
  useGetKitForNokQuery,
  useUpsertSectionMutation,
  useUpsertSubsectionMutation,
  useUpdateTogglesMutation,
  useMigrateFromFormsMutation,
} = kitApi;
