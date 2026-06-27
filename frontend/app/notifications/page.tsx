'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import { useAuth } from '../../contexts/AuthContext';
import { apiJson, getApiBaseUrl } from '../../lib/api';

export default function NotificationsPage() {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchNotifications() {
      setLoading(true);
      try {
        const data = await apiJson<any[]>('/api/notifications', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (mounted) {
          setItems(data);
          window.dispatchEvent(new Event('magelangverse-notifications-updated'));
        }
      } catch (err) {
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (isAuthenticated) fetchNotifications();
    else {
      setItems([]);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, token]);

  const markRead = async (id: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (res.ok) {
        setItems((cur) => cur.map((it) => (it.id === id ? { ...it, isRead: true } : it)));
        window.dispatchEvent(new Event('magelangverse-notifications-updated'));
      }
    } catch {}
  };

  const deleteAll = async () => {
    if (!confirm('Hapus semua notifikasi?')) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/notifications`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (res.ok) {
        setItems([]);
        window.dispatchEvent(new Event('magelangverse-notifications-updated'));
      }
    } catch {}
  };

  return (
    <GradientBg>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notifikasi</h1>
          {items.length > 0 && (
            <button
              onClick={deleteAll}
              className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-200 hover:border-rose-300"
            >
              Hapus Semua
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400">Memuat...</p>
        ) : (
          <div className="space-y-4">
            {items.length === 0 && <p className="text-slate-400">Tidak ada notifikasi.</p>}
            {items.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border p-4 ${n.isRead ? 'bg-slate-900/60' : 'bg-emerald-500/6 border-emerald-400'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white">{n.message}</div>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="rounded bg-emerald-400 px-3 py-1 text-sm font-semibold text-slate-900"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </GradientBg>
  );
}
