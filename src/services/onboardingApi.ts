import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export interface TourStatus {
  version: string | null;
  has_completed: boolean;
  manually_started: boolean;
  last_run_at: string | null;
}

export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: fetchBaseQuery({
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '') + '/onboarding',
    prepareHeaders: headers => {
      const token = Cookies.get('auth_token') || Cookies.get('nok_auth_token');

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Tour'],
  endpoints: builder => ({
    getTourStatus: builder.query<TourStatus, void>({
      query: () => ({
        url: '/status',
        method: 'GET',
      }),
      providesTags: ['Tour'],
    }),

    updateTourStatus: builder.mutation<
      { message: string },
      Partial<TourStatus>
    >({
      query: body => ({
        url: '/status',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tour'],
    }),
  }),
});

export const { useGetTourStatusQuery, useUpdateTourStatusMutation } = tourApi;
