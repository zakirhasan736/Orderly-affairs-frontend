// src/services/nokLetterApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export type NOKLetter = {
  id: string;
  owner_id: string;
  letter_date?: string | null;
  letter_to?: string;
  letter_greeting?: string;
  letter_opening?: string;
  kit_description?: string;
  access_url?: string;
  login_credentials_text?: string;
  nok_email?: string;
  nok_phone?: string;
  password_card_location?: string;
  accessible_sections?: string;
  key_bag_info?: string;
  key_bag_location?: string;
  documents_bag_info?: string;
  documents_bag_location?: string;
  incomplete_kit_message?: string;
  closing_message?: string;
  letter_signature?: string;
  delivery_trigger?: 'death' | 'date';
  delivery_status?: 'pending' | 'processing' | 'scheduled' | 'sent';
  scheduled_send_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type NOKLetterIn = Omit<NOKLetter, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;
export const nokLetterApi = createApi({
  reducerPath: 'nokLetterApi',
  baseQuery: fetchBaseQuery({
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || '') + '/nok-letter',
    credentials: 'include',
    prepareHeaders: h => {
      const token = Cookies.get('auth_token');
      if (token) h.set('Authorization', `Bearer ${token}`);
      h.set('Content-Type', 'application/json');
      return h;
    },
  }),
  endpoints: b => ({
    // accept optional nokId
    getNokLetter: b.query<NOKLetter, { nokId?: string } | void>({
      query: arg => {
        const nokId =
          arg && 'nokId' in (arg as any) ? (arg as any).nokId : undefined;
        return {
          url: nokId ? `?nok_id=${encodeURIComponent(nokId)}` : '',
          method: 'GET',
        };
      },
    }),
    saveNokLetter: b.mutation<NOKLetter, { body: any; nokId?: string }>({
      query: ({ body, nokId }) => ({
        url: nokId ? `?nok_id=${encodeURIComponent(nokId)}` : '',
        method: 'POST',
        body,
      }),
    }),
    updateNokLetter: b.mutation<NOKLetter, { body: any; nokId?: string }>({
      query: ({ body, nokId }) => ({
        url: nokId ? `?nok_id=${encodeURIComponent(nokId)}` : '',
        method: 'PUT',
        body,
      }),
    }),
  }),
});

export const {
  useGetNokLetterQuery,
  useSaveNokLetterMutation,
  useUpdateNokLetterMutation,
} = nokLetterApi;
