'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Link as LinkIcon,
  MapPin,
  PlusCircle,
  Ticket,
} from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { fetchCategories } from '../../lib/content-api';
import {
  fetchEvents,
  formatDate,
  type CommunityEvent,
  type EventCategory,
} from '../../lib/magelang-data';
import { getImageObjectPosition, getImageSrc } from '../../lib/image-position';

export default function EventPage() {
  const [apiEvents, setApiEvents] = useState<CommunityEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<'semua' | EventCategory>('semua');
  const [dataVersion, setDataVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<EventCategory[]>([]);

  useEffect(() => {
    const refresh = () => setDataVersion((version) => version + 1);
    window.addEventListener('magelangverse-events-updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('magelangverse-events-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    let timer: any;
    async function load(q?: string) {
      try {
        const records = await fetchEvents(false);
        if (!mounted) return;

        if (!q) {
          setApiEvents(records);
          return;
        }

        const lower = q.toLowerCase();
        setApiEvents(
          records.filter(
            (item) =>
              item.title.toLowerCase().includes(lower) ||
              item.description.toLowerCase().includes(lower) ||
              item.typeLabel.toLowerCase().includes(lower)
          )
        );
      } catch {
        if (mounted) setApiEvents([]);
      }
    }

    timer = setTimeout(() => load(search || undefined), 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [dataVersion, search]);

  useEffect(() => {
    let mounted = true;

    fetchCategories('EVENT')
      .then((records) => {
        if (mounted) {
          setCategoryOptions(records.map((item) => item.name as EventCategory));
        }
      })
      .catch(() => {
        if (mounted) setCategoryOptions([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filters: Array<{ label: string; value: 'semua' | EventCategory }> = useMemo(
    () => [
      { label: 'Semua Event', value: 'semua' },
      ...categoryOptions.map((category) => ({ label: category, value: category })),
    ],
    [categoryOptions]
  );

  const events = useMemo(() => {
    const approved = apiEvents.filter((item) => {
      if (item.status !== 'approved') return false;
      if (!item.date) return false;
      return new Date(item.date).getTime() >= Date.now() - 86400000;
    });

    return activeFilter === 'semua'
      ? approved
      : approved.filter((item) => item.typeLabel === activeFilter);
  }, [apiEvents, activeFilter, dataVersion]);

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-10">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-300">
            <CalendarDays className="h-4 w-4" />
            Event Magelang
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold sm:text-5xl">
                Agenda festival, konser, expo, dan event warga
              </h1>
              <p className="mt-4 max-w-3xl text-slate-300">
                Temukan agenda publik, festival, konser, expo, dan event warga Magelang yang
                terhubung dengan Smart Map.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari event..."
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-rose-400"
              />
              <a
                href="/community-form?feature=EVENT"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-rose-300"
              >
                <PlusCircle className="h-5 w-5" />
                Tambah Event
              </a>
            </div>
          </div>
        </section>

        <section className="mb-8 flex flex-wrap gap-3">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveFilter(item.value)}
              className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
                activeFilter === item.value
                  ? 'bg-rose-400 text-slate-950'
                  : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-rose-300/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80"
            >
              <img
                src={getImageSrc(
                  item.image,
                  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80'
                )}
                alt={item.title}
                onError={(event) => {
                  event.currentTarget.src =
                    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80';
                }}
                style={{ objectPosition: getImageObjectPosition(item.image) }}
                className="h-44 w-full object-cover"
              />
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                    {item.typeLabel}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                    {item.scope === 'around' ? 'Sekitar' : 'Magelang'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>

                <div className="mt-5 space-y-3 text-sm text-slate-400">
                  <p className="flex gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                    <span>
                      {formatDate(item.date)}
                      {item.time ? `, ${item.time}` : ''}
                    </span>
                  </p>
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{item.location}</span>
                  </p>
                  <p className="flex gap-2">
                    <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <span>{item.ticketPrice || 'Harga tiket menyesuaikan'}</span>
                  </p>
                  {item.openingHours && (
                    <p className="flex gap-2">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <span>{item.openingHours}</span>
                    </p>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <a
                    href={`/smart-map?focus=${item.id}`}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Lihat Detail
                  </a>
                  {item.link || item.sourceUrl ? (
                    <a
                      href={item.link || item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Sumber
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-500">
                      Sumber
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        {events.length === 0 && (
          <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
            Belum ada event pada filter ini.
          </section>
        )}
      </main>

      <Footer />
    </GradientBg>
  );
}
