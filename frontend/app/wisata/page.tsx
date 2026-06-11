"use client";

import { useEffect, useMemo, useState } from 'react';
import { Camera, ExternalLink, ImagePlus, MapPin, Mountain, PlusCircle, Star, Ticket } from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { useAuth } from '../../contexts/AuthContext';
import {
  getManagedTourismItems,
  getStoredCommunityTourism,
  submitCommunityTourism,
  type CommunityTourism,
  type SmartMapItem
} from '../../lib/magelang-data';

export default function WisataPage() {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('Semua');
  const [items, setItems] = useState<SmartMapItem[]>([]);
  const [submissions, setSubmissions] = useState<CommunityTourism[]>([]);
  const [status, setStatus] = useState('');
  const [formState, setFormState] = useState({
    title: '',
    location: '',
    description: '',
    image: '',
    link: ''
  });

  useEffect(() => {
    const refresh = () => {
      setItems(getManagedTourismItems());
      setSubmissions(getStoredCommunityTourism());
    };
    refresh();
    window.addEventListener('magelangverse-tourism-updated', refresh);
    window.addEventListener('magelangverse-content-updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('magelangverse-tourism-updated', refresh);
      window.removeEventListener('magelangverse-content-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(items.map((item) => item.typeLabel)))],
    [items]
  );

  const filtered = useMemo(
    () => filter === 'Semua' ? items : items.filter((item) => item.typeLabel === filter),
    [filter, items]
  );

  const userSubmissions = useMemo(
    () => submissions.filter((item) => item.submittedBy === user?.email || item.source === 'user'),
    [submissions, user?.email]
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((current) => ({ ...current, image: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setStatus('Login diperlukan untuk mengajukan Spot Populer.');
      return;
    }

    const saved = submitCommunityTourism({
      ...formState,
      submittedBy: user?.email
    });

    setFormState({ title: '', location: '', description: '', image: '', link: '' });
    setSubmissions(getStoredCommunityTourism());
    setStatus(`${saved.title} masuk antrean review developer sebagai Spot Populer.`);
  };

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-10 text-center">
          <div className="mb-4 flex justify-center gap-3">
            <Mountain className="h-10 w-10 text-cyan-300" />
            <Camera className="h-10 w-10 text-emerald-300" />
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">Destinasi Wisata Magelang</h1>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            Wisata sejarah, alam, taman kota, dan museum kini tersambung langsung ke Smart Map. Klik peta untuk membuka marker, foto, jarak, dan link rute.
          </p>
        </section>

        <section className="mb-8 flex flex-wrap justify-center gap-3">
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

        <section className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <PlusCircle className="h-6 w-6 text-cyan-300" />
              Tambah Spot Populer
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Khusus wisata buatan modern, view point, atau spot foto estetik. Setelah disetujui developer, spot tampil di Wisata, Smart Map, dan rekomendasi AI.
            </p>

            {!isAuthenticated ? (
              <a href="/login" className="mt-5 inline-flex rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
                Login untuk Mengajukan
              </a>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Nama Spot" value={formState.title} onChange={(value) => setFormState({ ...formState, title: value })} required />
                <Field label="Lokasi" value={formState.location} onChange={(value) => setFormState({ ...formState, location: value })} required />
                <label className="block text-sm font-semibold text-slate-200 md:col-span-2">
                  Deskripsi
                  <textarea
                    value={formState.description}
                    onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    rows={4}
                    required
                  />
                </label>
                <Field label="URL Gambar" value={formState.image} onChange={(value) => setFormState({ ...formState, image: value })} placeholder="https://..." />
                <label className="block text-sm font-semibold text-slate-200">
                  Upload Gambar
                  <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
                    <ImagePlus className="h-5 w-5 text-cyan-300" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
                  </span>
                </label>
                <Field label="Link Google Maps / Sosial Media" value={formState.link} onChange={(value) => setFormState({ ...formState, link: value })} placeholder="https://..." />
                <button type="submit" className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 md:self-end">
                  Kirim untuk Review
                </button>
              </form>
            )}
            {status && <p className="mt-4 text-sm text-cyan-200">{status}</p>}
          </div>

          <aside className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-semibold">Spot Saya</h2>
            <div className="mt-5 space-y-4">
              {userSubmissions.slice(0, 4).map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.location}</p>
                    </div>
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
              {userSubmissions.length === 0 && (
                <p className="text-sm text-slate-400">Belum ada Spot Populer yang dikirim dari akun ini.</p>
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
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
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
                    <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item.openingHours}</span>
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
                    Lihat di Smart Map
                  </a>
                  <a
                    href={item.link}
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
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}
