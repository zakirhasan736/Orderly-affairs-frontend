import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppMode } from '@/types/app';

interface UserPayload {
  email?: string;
  role?: 'owner' | 'nextkin';
  owner_id?: string | null;
}

interface AuthState {
  user: UserPayload | null;
  appMode: AppMode;
  isAuthenticated: boolean;
  sessionChecked: boolean;
}

const initialState: AuthState = {
  user: null,
  appMode: 'owner_login',
  isAuthenticated: false,
  sessionChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<{
        user: UserPayload;
        appMode?: AppMode;
      }>,
    ) => {
      state.user = action.payload.user;
      state.appMode =
        action.payload.appMode ||
        (action.payload.user.role === 'nextkin' ? 'nok_dashboard' : 'owner');
      state.isAuthenticated = true;
      state.sessionChecked = true;
    },

    clearSession: state => {
      state.user = null;
      state.appMode = 'owner_login';
      state.isAuthenticated = false;
      state.sessionChecked = true;
    },

    setSessionChecked: (state, action: PayloadAction<boolean>) => {
      state.sessionChecked = action.payload;
    },
  },
});

export const { setSession, clearSession, setSessionChecked } = authSlice.actions;
export default authSlice.reducer;
