'use client';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // 🧹 Remove JWT cookie
    Cookies.remove('auth_token', { path: '/' });

    // Optional: clear any local storage
    localStorage.clear();

    // 🔁 Redirect to login
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
}
