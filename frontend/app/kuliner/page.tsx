"use client";

import { useEffect, useMemo, useState } from 'react';
import { ChefHat, DollarSign, ExternalLink, ImagePlus, MapPin, PlusCircle, Star, Utensils } from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBaseUrl } from '../../lib/api';
import { getStoredCommunityCulinary, submitCommunityCulinary, submitCommunityCulinaryAsync, fetchCulinaryItems } from '../../lib/magelang-data';

type CommunityCulinary = {
  id: string;
  title: string;
  location?: string;
  description?: string;
  priceRange?: string;
  image?: string;
  link?: string;
  status?: string;
  submittedBy?: string;
};

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
  status?: string;
  submittedBy?: string;
};

const culinaryCategories = ['Makanan Khas', 'Pusat Kuliner', 'UMKM', 'Kopi dan Kafe'];

export default function KulinerPage() {
  const { user, isAuthenticated, token } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [items, setItems] = useState<SmartMapItem[]>([]);
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<CommunityCulinary[]>([]);
  const [status, setStatus] = useState('');
  const [formState, setFormState] = useState({
    title: '',
    typeLabel: 'UMKM',
    location: '',
    description: '',
    priceRange: '',
    image: '',
    link: ''
  });

  useEffect(() => {
    let mounted = true;

    let timer: any;
    async function fetchCulinary(q?: string) {
      try {
        const params = new URLSearchParams();
        params.set('includePending', 'false');
        if (q) params.set('q', q);
        const res = await fetch(`${getApiBaseUrl()}/api/culinary?${params.toString()}`);
        if (!res.ok) return setItems([]);
        const data = await res.json();
        setItems(data as SmartMapItem[]);
      } catch (err) {
        setItems([]);
      }
    }

    timer = setTimeout(() => fetchCulinary(search || undefined), 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };

    return () => {
      mounted = false;
    };
  }, []);

  const filters = useMemo(() => {
    const types = items.map((item) => item.typeLabel ?? 'Lainnya');
    return ['Semua', ...Array.from(new Set(types))];
  }, [items]);

  const filtered = useMemo(
    () => selectedFilter === 'Semua'
      ? items
      : items.filter((item) => item.typeLabel === selectedFilter),
    [selectedFilter, items]
  );

  const userSubmissions = useMemo(
    () => submissions,
    [submissions]
  );

  useEffect(() => {
    let mounted = true;
    async function fetchMySubmissions() {
      if (!isAuthenticated || !user) {
        setSubmissions([]);
        return;
      }

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/submissions?submittedById=${user.id}`);
        if (!res.ok) {
          setSubmissions([]);
          return;
        }
        const data = await res.json();
        if (mounted) setSubmissions(data as CommunityCulinary[]);
      } catch (err) {
        if (mounted) setSubmissions([]);
      }
    }

    fetchMySubmissions();

    return () => { mounted = false; };
  }, [isAuthenticated, user]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enforce client-side size limit for submission images (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatus('Gagal: Ukuran gambar maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((current) => ({ ...current, image: String(reader.result || '') }));
      setStatus('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setStatus('Login diperlukan untuk mengajukan kuliner atau UMKM.');
      return;
    }

    (async () => {
      try {
        const payload = await submitCommunityCulinaryAsync({ ...formState, submittedBy: user?.email }, token ?? undefined);
        setStatus(`${payload.title} berhasil dikirim dan menunggu moderasi.`);
      } catch (err: any) {
        // fallback to local storage when network fails
        const saved = submitCommunityCulinary({ ...formState, submittedBy: user?.email } as any);
        setStatus(`${saved.title} masuk antrean review developer (offline).`);
      } finally {
        setFormState({
          title: '',
          typeLabel: 'UMKM',
          location: '',
          description: '',
          priceRange: '',
          image: '',
          link: ''
        });
        setSubmissions(getStoredCommunityCulinary());
      }
    })();
  };

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
            Rekomendasi makanan khas, oleh-oleh, dan titik kuliner bisa dibuka di Smart Map atau langsung diarahkan ke Google Maps.
          </p>
        </section>

        <section className="mb-8 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kuliner..." className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none focus:border-amber-400" />
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
                  selectedFilter === filter
                    ? 'bg-amber-400 text-slate-950'
                    : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-amber-300/60'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <PlusCircle className="h-6 w-6 text-amber-300" />
              Tambah Kuliner
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Semua pengajuan kuliner sekarang difokuskan melalui satu fitur "Community Form". Klik tombol untuk mengajukan Kuliner atau UMKM.
            </p>

            <div className="mt-6">
              <a href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-300">
                Ajukan via Community Form
              </a>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-semibold">Submission Saya</h2>
            <div className="mt-5 space-y-4">
              {userSubmissions.slice(0, 4).map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.location}</p>
                    </div>
                    <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
              {userSubmissions.length === 0 && (
                <p className="text-sm text-slate-400">Belum ada kuliner atau UMKM yang dikirim dari perangkat ini.</p>
              )}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80">
              <img src={item.image} alt={item.title} className="h-48 w-full object-cover" />
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                    {item.typeLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-200">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {item.rating}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>

                <div className="mt-5 space-y-3 text-sm text-slate-400">
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{item.location}</span>
                  </p>
                  <p className="flex gap-2">
                    <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item.priceRange}</span>
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tags?.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
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
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                  >
                    Google Maps
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </GradientBg>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-200">
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
      />
    </label>
  );
}
