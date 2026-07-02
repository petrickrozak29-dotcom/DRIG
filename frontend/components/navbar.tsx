'use client';

import Link from 'next/link';
import { Bell, LayoutDashboard, LogOut, Menu, ShieldCheck, UserCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../lib/api';
import { useEffect, useState } from 'react';

const links = [
  ['Wisata', '/wisata'],
  ['Kuliner', '/kuliner'],
  ['Budaya', '/budaya'],
  ['Sejarah', '/sejarah'],
  ['Event', '/event'],
  ['Smart Magelang', '/smart-magelang'],
  ['Smart Map', '/smart-map'],
] as const;

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDeveloper = user?.role === 'ADMIN';

  useEffect(() => {
    let mounted = true;
    async function fetchNotifications() {
      if (!user) return;
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) setUnreadCount(Array.isArray(data) ? data.filter((item: { isRead?: boolean }) => !item.isRead).length : 0);
      } catch { /* notifikasi tidak boleh mengganggu navigasi */ }
    }
    if (isAuthenticated) fetchNotifications();
    window.addEventListener('magelangverse-notifications-updated', fetchNotifications);
    return () => {
      mounted = false;
      window.removeEventListener('magelangverse-notifications-updated', fetchNotifications);
    };
  }, [isAuthenticated, user]);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="brand" aria-label="Future Magelang">Future <span>Magelang</span></Link>
        <button className="mobile-toggle" onClick={() => setMobileOpen((value) => !value)} aria-label="Buka navigasi">
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <nav className={mobileOpen ? 'nav-links nav-open' : 'nav-links'}>
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)}>{label}</Link>)}
          {!isDeveloper && (
            <Link href="/community-form" className="community-badge-link" onClick={() => setMobileOpen(false)}>
              <ShieldCheck /> Community Form
            </Link>
          )}
          {isDeveloper && <Link href="/developer" className="developer-link"><LayoutDashboard /> Dashboard</Link>}
        </nav>
        <div className="nav-account">
          {!loading && (isAuthenticated ? (
            <>
              <Link href="/notifications" className="icon-button" aria-label="Notifikasi">
                <Bell />{unreadCount > 0 && <span>{unreadCount}</span>}
              </Link>
              <Link href={isDeveloper ? '/developer' : '/profile'} className="profile-pill" title={user?.name || 'Profil'}>
                <UserCircle />
                <span className="profile-name">{user?.name}</span>
              </Link>
              <button onClick={logout} className="logout-button" aria-label="Logout"><LogOut /></button>
            </>
          ) : <Link href="/login" className="login-button">Login</Link>)}
        </div>
      </div>
    </header>
  );
}
