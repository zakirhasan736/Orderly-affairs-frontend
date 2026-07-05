'use client';
import { useLogout } from '@/libs/logoutHandler';

export default function LogoutButton() {
  const logout = useLogout();

  return (
    <button
      onClick={() => void logout()}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
}
