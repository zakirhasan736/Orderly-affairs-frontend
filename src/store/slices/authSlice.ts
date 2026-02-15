import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppMode } from '@/types/app';
import * as jose from 'jose';
import Cookies from 'js-cookie';

interface UserPayload {
  email?: string;
  role?: 'owner' | 'nextkin';
  owner_id?: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken?: string | null; 
  user: UserPayload | null;
  appMode: AppMode;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  appMode: 'owner_login',
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ============================================================
    // ✅ Set login credentials (Owner or NextKin)
    // ============================================================
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        appMode?: AppMode;
      }>
    ) => {
      const { token, refreshToken, appMode } = action.payload;
      state.token = token;
      if (refreshToken) state.refreshToken = refreshToken;

      try {
        const payload = jose.decodeJwt(token);
        state.user = {
          email: payload.sub as string,
          role: payload.role as 'owner' | 'nextkin',
          owner_id: payload.owner_id ? String(payload.owner_id) : null,
        };

        // auto-detect app mode
        state.appMode =
          appMode || (payload.role === 'nextkin' ? 'nok_dashboard' : 'owner');

        state.isAuthenticated = true;

        // persist tokens
        Cookies.set('auth_token', token, { expires: 7 });
        if (refreshToken)
          Cookies.set('refresh_token', refreshToken, { expires: 7 });
      } catch (err) {
        console.error('JWT decode failed in setCredentials:', err);
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        Cookies.remove('auth_token');
        Cookies.remove('refresh_token');
      }
    },

    // ============================================================
    // ✅ Load credentials from cookie (auto-login)
    // ============================================================
    loadFromCookie: state => {
      const token = Cookies.get('auth_token');
      if (!token) {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        return;
      }

      try {
        const payload = jose.decodeJwt(token);
        const exp = payload.exp ? payload.exp * 1000 : null;
        if (exp && exp < Date.now()) {
          // token expired
          Cookies.remove('auth_token');
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          return;
        }

        state.token = token;
        state.user = {
          email: payload.sub as string,
          role: payload.role as 'owner' | 'nextkin',
          owner_id: payload.owner_id ? String(payload.owner_id) : null,
        };
        state.appMode =
          payload.role === 'nextkin' ? 'nextkin_login' : 'owner_login';
        state.isAuthenticated = true;
      } catch (err) {
        console.error('Failed to decode token from cookie:', err);
        Cookies.remove('auth_token');
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      }
    },

    // ============================================================
    // ✅ Update token silently (after refresh)
    // ============================================================
    updateToken: (state, action: PayloadAction<string>) => {
      const newToken = action.payload;
      state.token = newToken;
      Cookies.set('auth_token', newToken, { expires: 7 });
      try {
        const payload = jose.decodeJwt(newToken);
        state.user = {
          email: payload.sub as string,
          role: payload.role as 'owner' | 'nextkin',
          owner_id: payload.owner_id ? String(payload.owner_id) : null,
        };
      } catch (err) {
        console.error('Token update decode failed:', err);
      }
    },

    // ============================================================
    // ✅ Logout (manual or expired)
    // ============================================================
    logout: state => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.appMode = 'owner_login';
      state.isAuthenticated = false;
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
    },
  },
});

export const { setCredentials, updateToken, loadFromCookie, logout } =
  authSlice.actions;
export default authSlice.reducer;
