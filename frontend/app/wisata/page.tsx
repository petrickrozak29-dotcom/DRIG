'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, ExternalLink, MapPin, Mountain, PlusCircle, Star, Ticket } from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { fetchCategories } from '../../lib/content-api';

interface TourismItem {
  id: string;
  title: string;
  description: string;
  location: string;
  image: string;
  link?: string;
  typeLabel: string;
  rating?: number;
  openingHours?: string;
  tags?: string[];
}

export default function WisataPage() {
  const [filter, setFilter] = useState('Semua');
  const [items, setItems] = useState<TourismItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    let timer: any;
    async function fetchTourism(q?: string) {
      try {
        const items = await (await import('../../lib/magelang-data')).fetchTourismItems(false);
        if (!mounted) return;
        const formatted = items.map((item: any) => ({
          ...item,
          rating: item.rating || 4.5,
          openingHours: item.openingHours || '08:00 - 17:00',
          tags: item.tags || [item.typeLabel],
        }));

        if (q) {
          const lower = q.toLowerCase();
          setItems(
            formatted.filter(
              (i: any) =>
                (i.title || '').toLowerCase().includes(lower) ||
                (i.typeLabel || '').toLowerCase().includes(lower)
            )
          );
        } else {
          setItems(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch tourism data:', error);
      }
    }

    timer = setTimeout(() => fetchTourism(search || undefined), 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    let mounted = true;

    fetchCategories('WISATA')
      .then((records) => {
        if (mounted) {
          setCategoryOptions(records.map((item) => item.name));
        }
      })
      .catch(() => {
        if (mounted) setCategoryOptions([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      'Semua',
      ...Array.from(
        new Set([...categoryOptions, ...items.map((item) => item.typeLabel).filter(Boolean)])
      ),
    ],
    [categoryOptions, items]
  );

  const filtered = useMemo(
    () => (filter === 'Semua' ? items : items.filter((item) => item.typeLabel === filter)),
    [filter, items]
  );

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-10">
          <div className="mb-4 flex gap-3">
            <Mountain className="h-8 w-8 text-cyan-300" />
            <Camera className="h-8 w-8 text-emerald-300" />
          </div>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold sm:text-5xl">Destinasi Wisata Magelang</h1>
              <p className="mt-4 max-w-3xl text-slate-300">
                Wisata sejarah, alam, taman kota, dan museum kini tersambung langsung ke Smart Map.
                Klik peta untuk membuka marker, foto, jarak, dan link rute.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari wisata..."
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-cyan-400"
              />
              <a
                href="/community-form?feature=WISATA"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                <PlusCircle className="h-5 w-5" />
                Tambah Wisata
              </a>
            </div>
          </div>
        </section>

        <section className="mb-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
                filter === category
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-300/60'
              }`}
            >
              {category}
            </button>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80"
            >
              <img
                src={
                  item.image ||
                  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'
                }
                alt={item.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {item.typeLabel || 'Wisata'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {item.rating}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>

                <div className="mt-5 space-y-3 text-sm text-slate-400">
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{item.location}</span>
                  </p>
                  <p className="flex gap-2">
                    <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item.openingHours}</span>
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <a
                    href={`/smart-map?focus=${item.id}`}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Lihat di Smart Map
                  </a>
                  <a
                    href={
                      item.link ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Rute
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>

        {filtered.length === 0 && (
          <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
            Belum ada destinasi wisata pada filter ini.
          </section>
        )}
      </main>

      <Footer />
    </GradientBg>
  );
}
