// src/libs/tokenUtils.ts
import Cookies from 'js-cookie';

export async function refreshAccessToken(): Promise<string | null> {
  const token = Cookies.get('auth_token');
  if (!token) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh-token`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      }
    );

    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();

    if (data.access_token) {
      Cookies.set('auth_token', data.access_token, {
        expires: 7,
        secure: true,
        sameSite: 'strict',
        path: '/',
      });
      return data.access_token;
    }
  } catch (err) {
    console.error('Token refresh error:', err);
    Cookies.remove('auth_token');
  }

  return null;
}
