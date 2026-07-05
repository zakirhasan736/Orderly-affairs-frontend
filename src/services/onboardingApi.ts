import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '@/libs/baseQueryWithReauth';

export interface TourStatus {
  version: string | null;
  has_completed: boolean;
  manually_started: boolean;
  last_run_at: string | null;
}

export const tourApi = createApi({
  reducerPath: 'tourApi',
  baseQuery: createSecureBaseQuery('/onboarding'),
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
