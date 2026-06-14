'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, ExternalLink, History, MapPin, ScrollText, Ticket } from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { fetchPublicContent, type ManagedContentItem } from '../../lib/content-api';

const fallbackImage =
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80';

export default function SejarahPage() {
  const [items, setItems] = useState<ManagedContentItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    fetchPublicContent('/api/history')
      .then((records) => {
        if (mounted) setItems(records);
      })
      .catch(() => {
        if (mounted) setItems([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const query = search.toLowerCase();
    return items.filter((item) =>
      `${item.title} ${item.description} ${item.typeLabel || ''}`.toLowerCase().includes(query)
    );
  }, [items, search]);

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-10 text-center">
          <div className="mb-4 flex justify-center gap-3">
            <History className="h-10 w-10 text-rose-300" />
            <ScrollText className="h-10 w-10 text-cyan-300" />
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">Perjalanan Sejarah Magelang</h1>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            Konten sejarah yang ditambahkan developer akan tampil otomatis untuk seluruh user
            lengkap dengan foto dan sumber bacaan.
          </p>
          <div className="mt-4 flex justify-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari sejarah..."
              className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-rose-400"
            />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80"
            >
              <img
                src={item.image || fallbackImage}
                alt={item.title}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
                className="h-52 w-full object-cover"
              />
              <div className="p-6">
                <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                  {item.typeLabel || 'Sejarah'}
                </span>
                <h2 className="mt-4 text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                <div className="mt-5 space-y-2 text-sm text-slate-400">
                  {item.location && (
                    <p className="flex gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                      <span>{item.location}</span>
                    </p>
                  )}
                  {item.openingHours && (
                    <p className="flex gap-2">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <span>{item.openingHours}</span>
                    </p>
                  )}
                  {item.ticketPrice && (
                    <p className="flex gap-2">
                      <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{item.ticketPrice}</span>
                    </p>
                  )}
                </div>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300"
                  >
                    Baca Sumber
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>

        {filteredItems.length === 0 && (
          <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
            Belum ada konten sejarah yang dipublish.
          </section>
        )}
      </main>

      <Footer />
    </GradientBg>
  );
}
