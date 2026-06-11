"use client";

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ExternalLink, ImagePlus, Link as LinkIcon, MapPin, ShieldCheck, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import { getApiBaseUrl } from '../../lib/api';
import {
  eventCategories,
  formatDate,
  getCommunityEvents,
  getStoredCommunityEvents,
  normalizeApiEvents,
  submitCommunityEvent,
  updateCommunityEventStatus,
  type CommunityEvent,
  type EventCategory
} from '../../lib/magelang-data';

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loading } = useAuth();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [apiEvents, setApiEvents] = useState<CommunityEvent[]>([]);
  const [status, setStatus] = useState('');
  const [formState, setFormState] = useState<{
    title: string;
    date: string;
    typeLabel: EventCategory;
    location: string;
    description: string;
    image: string;
    link: string;
  }>({
    title: '',
    date: '',
    typeLabel: 'Agenda Lokal',
    location: '',
    description: '',
    image: '',
    link: ''
  });

  const isDeveloper = user?.role === 'ADMIN';

  useEffect(() => {
    if (!loading && isDeveloper) {
      router.push('/developer');
    }
  }, [isDeveloper, loading, router]);

  const refreshLocalEvents = () => {
    setEvents(getCommunityEvents(apiEvents));
  };

  useEffect(() => {
    setEvents(getCommunityEvents(apiEvents));
  }, [apiEvents]);

  useEffect(() => {
    const refresh = () => setEvents(getCommunityEvents(apiEvents));
    window.addEventListener('magelangverse-events-updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('magelangverse-events-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [apiEvents]);

  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/events?includePending=true`);
        if (!response.ok) return;
        const payload = await response.json();
        const records = Array.isArray(payload) ? payload : payload.events;
        if (mounted) setApiEvents(normalizeApiEvents(records));
      } catch {
        if (mounted) setApiEvents([]);
      }
    }

    fetchEvents();

    return () => {
      mounted = false;
    };
  }, []);

  const userSubmissions = useMemo(
    () => getStoredCommunityEvents().filter((item) => item.submittedBy === user?.email || item.source === 'user'),
    [events, user?.email]
  );

  const pendingEvents = useMemo(
    () => events.filter((item) => item.status === 'pending'),
    [events]
  );

  const approvedEvents = useMemo(
    () => events.filter((item) => item.status === 'approved'),
    [events]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Menyimpan event komunitas...');

    const saved = submitCommunityEvent({
      ...formState,
      submittedBy: user?.email
    });

    setFormState({
      title: '',
      date: '',
      typeLabel: 'Agenda Lokal',
      location: '',
      description: '',
      image: '',
      link: ''
    });
    refreshLocalEvents();

    try {
      await fetch(`${getApiBaseUrl()}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: saved.title,
          date: saved.date,
          location: saved.location,
          description: saved.description,
          image: saved.image,
          link: saved.link,
          latitude: saved.latitude,
          longitude: saved.longitude,
          typeLabel: saved.typeLabel,
          category: saved.typeLabel,
          status: 'pending',
          submittedBy: user?.email
        })
      });

      setStatus('Event tersimpan dan masuk antrean persetujuan developer.');
    } catch {
      setStatus('Event tersimpan lokal dan menunggu persetujuan developer. Backend belum tersambung.');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((current) => ({ ...current, image: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleModeration = (id: string, nextStatus: 'approved' | 'rejected') => {
    updateCommunityEventStatus(id, nextStatus);
    refreshLocalEvents();
    setStatus(nextStatus === 'approved'
      ? 'Event disetujui dan akan tampil di Smart Map.'
      : 'Event ditolak dari daftar publik.'
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Memuat...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <GradientBg>
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6 py-16 text-center text-white">
          <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-8">
            <h1 className="text-3xl font-bold text-cyan-300">Community Event</h1>
            <p className="mt-3 text-slate-300">Login diperlukan untuk mengirim event komunitas agar pengirimnya bisa dilacak saat proses approval.</p>
            <a href="/login" className="mt-6 inline-block rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Login
            </a>
          </section>
        </main>
        <Footer />
      </GradientBg>
    );
  }

  return (
    <GradientBg>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-8">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            <ShieldCheck className="h-4 w-4" />
            Community Event
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Ajukan event warga Magelang</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Isi judul, tanggal, lokasi, deskripsi, dan link Instagram, Google Maps, atau WhatsApp. Event masuk antrean review dulu, lalu tampil otomatis di Smart Map dan list event setelah disetujui developer.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-semibold text-white">Form Event</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <label className="block text-sm font-semibold text-slate-200">
                Judul
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) => setFormState({ ...formState, title: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Contoh: Pasar Seni Magelang"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Tanggal
                <input
                  type="date"
                  value={formState.date}
                  onChange={(event) => setFormState({ ...formState, date: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Kategori Event
                <select
                  value={formState.typeLabel}
                  onChange={(event) => setFormState({ ...formState, typeLabel: event.target.value as EventCategory })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {eventCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Lokasi
                <input
                  type="text"
                  value={formState.location}
                  onChange={(event) => setFormState({ ...formState, location: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Contoh: Alun-alun Magelang"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Deskripsi
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  rows={5}
                  placeholder="Ceritakan agenda, penyelenggara, dan info penting event."
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                URL Gambar / Pamflet Event
                <input
                  type="url"
                  value={formState.image}
                  onChange={(event) => setFormState({ ...formState, image: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="https://..."
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Upload Gambar / Pamflet
                <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
                  <ImagePlus className="h-5 w-5 text-cyan-300" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Link Instagram / Google Maps / WhatsApp
                <input
                  type="url"
                  value={formState.link}
                  onChange={(event) => setFormState({ ...formState, link: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="https://..."
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Kirim untuk Review
              </button>
            </form>
            {status && <p className="mt-4 text-sm text-cyan-200">{status}</p>}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-2xl font-semibold text-white">Submission Saya</h2>
              <div className="mt-5 space-y-4">
                {userSubmissions.map((item) => (
                  <EventCard key={item.id} item={item} />
                ))}
                {userSubmissions.length === 0 && (
                  <p className="text-sm text-slate-400">Belum ada event yang dikirim dari perangkat ini.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-2xl font-semibold text-white">Event Publik</h2>
              <p className="mt-2 text-sm text-slate-400">{approvedEvents.length} event sudah tampil di Smart Map.</p>
              <div className="mt-5 space-y-4">
                {approvedEvents.slice(0, 4).map((item) => (
                  <EventCard key={item.id} item={item} compact />
                ))}
              </div>
            </div>
          </div>
        </section>

        {isDeveloper && (
          <section className="mt-8 rounded-lg border border-cyan-400/30 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-semibold text-cyan-200">Developer Approval</h2>
            <p className="mt-2 text-sm text-slate-400">Event pending dari user disetujui dulu sebelum masuk map publik.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingEvents.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/80 p-5">
                  <EventCard item={item} compact />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleModeration(item.id, 'approved')}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeration(item.id, 'rejected')}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-300"
                    >
                      <XCircle className="h-4 w-4" />
                      Tolak
                    </button>
                  </div>
                </article>
              ))}
              {pendingEvents.length === 0 && (
                <p className="text-sm text-slate-400">Tidak ada event pending.</p>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </GradientBg>
  );
}

function EventCard({ item, compact = false }: { item: CommunityEvent; compact?: boolean }) {
  const statusClass = item.status === 'approved'
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
    : item.status === 'pending'
      ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
      : 'border-rose-400/40 bg-rose-500/10 text-rose-200';

  return (
    <article className={compact ? '' : 'rounded-lg border border-slate-800 bg-slate-950/80 p-4'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{item.title}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <CalendarDays className="h-4 w-4" />
            {formatDate(item.date)}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {item.status}
        </span>
      </div>
      <p className="mt-3 flex gap-2 text-sm text-slate-400">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
        <span>{item.location}</span>
      </p>
      {!compact && <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={`/smart-map?focus=${item.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
          <MapPin className="h-4 w-4" />
          Lihat Detail
        </a>
        {item.link && (
          <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            <LinkIcon className="h-4 w-4" />
            Open Link
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
