import Cookies from 'js-cookie';

export const getAuthToken = () => Cookies.get('auth_token');
export const setAuthToken = (token: string) =>
  Cookies.set('auth_token', token, { secure: true, sameSite: 'strict' });
export const clearAuthToken = () => Cookies.remove('auth_token');
