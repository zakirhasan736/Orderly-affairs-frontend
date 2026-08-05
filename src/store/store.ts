'use client';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import { authApi } from '@/services/authApi';
import { kitApi } from '@/services/kitApi';
import { nokLetterApi } from '@/services/nokLetterApi';
import { billingApi } from '@/services/billingApi';
import { tourApi } from '@/services/onboardingApi';
import { aiDocumentsApi } from '@/services/aiDocumentsApi';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [kitApi.reducerPath]: kitApi.reducer,
    [billingApi.reducerPath]: billingApi.reducer,
    [nokLetterApi.reducerPath]: nokLetterApi.reducer,
    [tourApi.reducerPath]: tourApi.reducer,
    [aiDocumentsApi.reducerPath]: aiDocumentsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(kitApi.middleware)
      .concat(billingApi.middleware)
      .concat(nokLetterApi.middleware)
      .concat(tourApi.middleware)
      .concat(aiDocumentsApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
