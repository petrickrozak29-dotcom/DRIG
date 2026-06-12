'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChefHat, DollarSign, ExternalLink, MapPin, PlusCircle, Star, Utensils } from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { fetchCategories } from '../../lib/content-api';
import { fetchCulinaryItems } from '../../lib/magelang-data';

type SmartMapItem = {
  id: string;
  title: string;
  typeLabel?: string;
  location?: string;
  description?: string;
  priceRange?: string;
  image?: string;
  link?: string;
  rating?: number;
  tags?: string[];
};

const fallbackImage =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80';

export default function KulinerPage() {
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [items, setItems] = useState<SmartMapItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(async () => {
      try {
        const records = await fetchCulinaryItems(false);
        if (!mounted) return;

        const normalized = records.map((item) => ({
          ...item,
          rating: item.rating || 4.5,
          priceRange: item.priceRange || 'Harga menyesuaikan',
          tags: item.tags || [item.typeLabel || 'Kuliner'],
        })) as SmartMapItem[];

        if (!search) {
          setItems(normalized);
          return;
        }

        const lower = search.toLowerCase();
        setItems(
          normalized.filter(
            (item) =>
              (item.title || '').toLowerCase().includes(lower) ||
              (item.typeLabel || '').toLowerCase().includes(lower)
          )
        );
      } catch {
        if (mounted) setItems([]);
      }
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    let mounted = true;

    fetchCategories('KULINER')
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

  const filters = useMemo(
    () => [
      'Semua',
      ...Array.from(
        new Set([...categoryOptions, ...items.map((item) => item.typeLabel || 'Kuliner')])
      ),
    ],
    [categoryOptions, items]
  );

  const filtered = useMemo(
    () =>
      selectedFilter === 'Semua'
        ? items
        : items.filter((item) => (item.typeLabel || 'Kuliner') === selectedFilter),
    [items, selectedFilter]
  );

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-10 text-center">
          <div className="mb-4 flex justify-center gap-3">
            <ChefHat className="h-10 w-10 text-amber-300" />
            <Utensils className="h-10 w-10 text-rose-300" />
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">Kuliner Khas Magelang</h1>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            Rekomendasi makanan khas, UMKM, dan titik kuliner Magelang yang sudah dipublish kini
            muncul langsung dari backend.
          </p>
        </section>

        <section className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kuliner..."
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-400"
          />
          <a
            href="/community-form?feature=KULINER"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300"
          >
            <PlusCircle className="h-5 w-5" />
            Tambah Kuliner
          </a>
        </section>

        <section className="mb-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedFilter === filter
                    ? 'bg-amber-400 text-slate-950'
                    : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-amber-300/60'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <aside className="rounded-lg border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-lg font-semibold text-white">Alur Publish Kuliner</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Gunakan tombol tambah kuliner untuk mengirim foto, deskripsi, kategori, dan lokasi.
              Setelah disetujui developer, data otomatis tampil di halaman ini.
            </p>
          </aside>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80"
            >
              <img
                src={item.image || fallbackImage}
                alt={item.title}
                className="h-44 w-full object-cover"
              />
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                    {item.typeLabel || 'Kuliner'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {item.rating || 4.5}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>

                <div className="mt-5 space-y-3 text-sm text-slate-400">
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{item.location || 'Magelang'}</span>
                  </p>
                  <p className="flex gap-2">
                    <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item.priceRange || 'Harga menyesuaikan'}</span>
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(item.tags || []).map((tag) => (
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
                    Smart Map
                  </a>
                  <a
                    href={
                      item.link ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                  >
                    Maps
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>

        {filtered.length === 0 && (
          <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
            Belum ada kuliner pada filter ini.
          </section>
        )}
      </main>

      <Footer />
    </GradientBg>
  );
}
