'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Link as LinkIcon,
  MapPin,
  ShieldCheck,
  Star,
  XCircle,
  CalendarDays,
  Ticket,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import { getApiBaseUrl } from '../../lib/api';

type FeatureType = 'EVENT' | 'WISATA' | 'KULINER';

interface Category {
  id: string;
  name: string;
  featureType: string;
}

// Categories will be fetched from the backend so developers can manage them dynamically

export default function CommunityFormPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loading } = useAuth();

  const [featureType, setFeatureType] = useState<FeatureType>('EVENT');
  const [status, setStatus] = useState('');
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    categoryName: '',
    location: '',
    image: '',
    link: '',
    date: '',
    priceRange: '',
    rating: '',
  });

  const [preview, setPreview] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromQuery = new URLSearchParams(window.location.search).get('feature')?.toUpperCase();
    if (fromQuery === 'EVENT' || fromQuery === 'WISATA' || fromQuery === 'KULINER') {
      setFeatureType(fromQuery);
    }
  }, []);

  // Fetch categories for the current featureType and set default
  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/categories?featureType=${featureType}`);
        if (!res.ok) return;
        const cats = await res.json();
        const names = Array.isArray(cats) ? cats.map((c: any) => c.name) : [];
        if (mounted) {
          setCategoryOptions(names);
          if (names.length) setFormState((s) => ({ ...s, categoryName: names[0] }));
        }
      } catch (err) {
        // ignore
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, [featureType]);

  const isDeveloper = user?.role === 'ADMIN';

  useEffect(() => {
    if (!loading && isDeveloper) {
      router.push('/developer');
    }
  }, [isDeveloper, loading, router]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    // If authenticated, attempt to upload to backend uploads endpoint
    (async () => {
      try {
        if (token) {
          const fd = new FormData();
          fd.append('image', file);

          const res = await fetch(`${getApiBaseUrl()}/api/uploads/image`, {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: fd,
          });

          if (res.ok) {
            const body = await res.json();
            setFormState((current) => ({ ...current, image: body.url }));
            setStatus('');
            setIsUploadingImage(false);
            return;
          }
        }

        // Fallback to base64 when not authenticated or upload failed
        const reader = new FileReader();
        reader.onload = () => {
          setFormState((current) => ({ ...current, image: String(reader.result || '') }));
          setStatus('');
          setIsUploadingImage(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormState((current) => ({ ...current, image: String(reader.result || '') }));
          setStatus('');
          setIsUploadingImage(false);
        };
        reader.readAsDataURL(file);
      }
    })();
  };

  const removeImage = () => {
    setFormState((current) => ({ ...current, image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) {
      setPreview(true);
      return;
    }

    // If user is not authenticated, require login before final submit
    if (!isAuthenticated) {
      router.push(
        `/login?next=${encodeURIComponent(`/community-form?feature=${featureType}`)}`
      );
      return;
    }

    setStatus('Mengirim submission...');

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formState,
          featureType,
          submittedById: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Gagal menyimpan');

      setStatus('Berhasil! Submission masuk antrean review developer.');
      setFormState({
        title: '',
        description: '',
        categoryName: formState.categoryName,
        location: '',
        image: '',
        link: '',
        date: '',
        priceRange: '',
        rating: '',
      });
      setPreview(false);
      window.dispatchEvent(new Event('magelangverse-submissions-updated'));
    } catch {
      setStatus('Gagal menyimpan submission. Silakan coba lagi.');
    }
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
            <h1 className="text-3xl font-bold text-cyan-300">Community Form</h1>
            <p className="mt-3 text-slate-300">
              Login diperlukan untuk mengirim rekomendasi event, wisata, atau kuliner.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Login
            </a>
          </section>
        </main>
        <Footer />
      </GradientBg>
    );
  }

  // options returned from API
  // use `categoryOptions` state populated by effect above

  return (
    <GradientBg>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            <ShieldCheck className="h-4 w-4" />
            Community Form
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Ajukan Konten ke Smart Map</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Pilih jenis konten, isi detailnya, lalu preview. Konten akan tampil publik setelah
            disetujui.
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-6 md:p-8">
          {!preview ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setFeatureType('EVENT')}
                  className={`rounded-lg border p-4 text-center transition ${featureType === 'EVENT' ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <h3 className="font-bold text-white">Event</h3>
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureType('WISATA')}
                  className={`rounded-lg border p-4 text-center transition ${featureType === 'WISATA' ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <h3 className="font-bold text-white">Wisata</h3>
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureType('KULINER')}
                  className={`rounded-lg border p-4 text-center transition ${featureType === 'KULINER' ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <h3 className="font-bold text-white">Kuliner</h3>
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label={`Nama ${featureType}`}
                  value={formState.title}
                  onChange={(v) => setFormState({ ...formState, title: v })}
                  required
                />

                <label className="block text-sm font-semibold text-slate-200">
                  Kategori
                  <select
                    value={formState.categoryName}
                    onChange={(e) => setFormState({ ...formState, categoryName: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <Field
                  label="Lokasi"
                  value={formState.location}
                  onChange={(v) => setFormState({ ...formState, location: v })}
                  required
                />

                {featureType === 'EVENT' && (
                  <Field
                    label="Tanggal Event"
                    type="date"
                    value={formState.date}
                    onChange={(v) => setFormState({ ...formState, date: v })}
                    required
                  />
                )}

                {featureType === 'KULINER' && (
                  <Field
                    label="Rentang Harga"
                    placeholder="Contoh: Rp 15.000 - Rp 50.000"
                    value={formState.priceRange}
                    onChange={(v) => setFormState({ ...formState, priceRange: v })}
                    required
                  />
                )}

                <Field
                  label="Rating"
                  type="number"
                  placeholder="Contoh: 4.8"
                  value={formState.rating}
                  onChange={(v) => setFormState({ ...formState, rating: v })}
                  min="1"
                  max="5"
                  step="0.1"
                />

                <label className="block text-sm font-semibold text-slate-200 md:col-span-2">
                  Deskripsi
                  <textarea
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    rows={4}
                    required
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-200">
                  Upload Gambar
                  <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
                    <ImagePlus className="h-5 w-5 text-cyan-300" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-sm"
                    />
                  </span>
                  <span className="mt-2 block text-xs font-normal text-slate-400">
                    {isUploadingImage
                      ? 'Mengunggah gambar...'
                      : 'Upload gambar lalu cek preview sebelum submit.'}
                  </span>
                  {formState.image && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                      <img
                        src={formState.image}
                        alt="Preview upload"
                        className="h-48 w-full object-cover"
                      />
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <p className="text-xs font-normal text-slate-400">
                          Gambar sudah siap. Kamu masih bisa ganti atau hapus sebelum submit.
                        </p>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-300 hover:bg-rose-500/10"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </label>

                <Field
                  label="Link Terkait (Opsional)"
                  value={formState.link}
                  onChange={(v) => setFormState({ ...formState, link: v })}
                  placeholder="https://..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Lanjutkan ke Preview
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b border-slate-700 pb-2">
                Preview Submission
              </h2>

              <article className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                {formState.image ? (
                  <img src={formState.image} alt="Preview" className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-900 text-slate-500">
                    <Camera className="h-8 w-8" />
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {formState.categoryName} ({featureType})
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{formState.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{formState.description}</p>

                  <div className="mt-4 space-y-2 text-sm text-slate-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cyan-300" /> {formState.location}
                    </p>
                    {featureType === 'EVENT' && (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-amber-300" /> {formState.date}
                      </p>
                    )}
                    {featureType === 'KULINER' && (
                      <p className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-emerald-300" /> {formState.priceRange}
                      </p>
                    )}
                    {formState.rating && (
                      <p className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                        {Number(formState.rating).toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              </article>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setPreview(false)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
                >
                  Edit Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Submit Sekarang
                </button>
              </div>
            </div>
          )}

          {status && (
            <p
              className={`mt-5 rounded-lg p-4 text-center font-semibold ${status.includes('Gagal') ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}
            >
              {status}
            </p>
          )}
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
  required = false,
  type = 'text',
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-200">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}
