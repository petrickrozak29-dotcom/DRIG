'use client';

import Link from 'next/link';
import { LogOut, UserCircle, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../lib/api';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const isDeveloper = user?.role === 'ADMIN';
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function fetchNotifications() {
      if (!user) return;
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const unread = Array.isArray(data) ? data.filter((n: any) => !n.isRead).length : 0;
        setUnreadCount(unread);
      } catch {
        // ignore
      }
    }

    if (isAuthenticated) fetchNotifications();
    const onStorage = () => {
      if (isAuthenticated) fetchNotifications();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('magelangverse-content-updated', onStorage);
    window.addEventListener('magelangverse-notifications-updated', onStorage);

    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('magelangverse-content-updated', onStorage);
      window.removeEventListener('magelangverse-notifications-updated', onStorage);
    };
  }, [user, isAuthenticated]);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 text-sm text-slate-100 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="font-semibold text-white">
          Future Magelang
        </Link>
        <nav className="flex flex-wrap items-center gap-3 lg:justify-end">
          {isDeveloper ? (
            <Link href="/developer">Dashboard Developer</Link>
          ) : (
            <>
              <Link href="/wisata">Wisata</Link>
              <Link href="/kuliner">Kuliner</Link>
              <Link href="/budaya">Budaya</Link>
              <Link href="/sejarah">Sejarah</Link>
              <Link href="/event">Event</Link>
              <Link href="/smart-magelang">Smart Magelang</Link>
              <Link href="/smart-map">Smart Map</Link>
            </>
          )}
          {isAuthenticated && (
            <>
              {!isDeveloper && <Link href="/community-form">Community Form</Link>}
              <Link
                href="/notifications"
                className="ml-2 inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800 relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}
          {!loading &&
            (isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-3 py-1.5 font-medium text-cyan-200 transition hover:border-cyan-300"
                >
                  <UserCircle className="h-4 w-4" />
                  {user?.name}
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-1.5 text-white transition hover:bg-slate-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-cyan-500 px-4 py-1.5 font-semibold text-black transition hover:bg-cyan-400"
              >
                Login
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
