'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Building2,
  Clock,
  Cpu,
  ExternalLink,
  History,
  Lightbulb,
  LocateFixed,
  MapPin,
  Navigation,
  Network,
  Rocket,
  Send,
  Sparkles,
  ScrollText,
  Utensils,
  Wifi,
} from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBaseUrl } from '../../lib/api';
import { MAGELANG_CENTER } from '../../lib/magelang-data';

type SmartTab = 'ai' | 'technology' | 'potential';

interface ItineraryItem {
  order: number;
  destination: {
    id?: string | number;
    name: string;
    description?: string;
    category?: string;
    priceRange?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
    link?: string;
    detailUrl?: string;
    mapId?: string;
  };
  startTime: string;
  endTime: string;
  stayDuration: number;
  travelTime: number;
  distance: number;
  estimatedCost: number;
  notes: string;
  directions: string;
}

interface ItineraryResult {
  itinerary: ItineraryItem[];
  totalDistance: number;
  totalCost: number;
  totalDuration: number;
  summary: string;
  tips: string[];
}

interface SmartMapRoutePayload {
  source: 'ai-assistant';
  generatedAt: string;
  summary: string;
  totalDistance: number;
  totalDuration: number;
  stops: Array<{
    id: string;
    order: number;
    title: string;
    description?: string;
    category?: string;
    latitude: number;
    longitude: number;
    location?: string;
    link?: string;
    detailUrl?: string;
  }>;
}

const tabs: Array<{ key: SmartTab; label: string; icon: any }> = [
  { key: 'ai', label: 'AI Assistant', icon: Bot },
  { key: 'technology', label: 'Teknologi Kota', icon: Cpu },
  { key: 'potential', label: 'Potensi Modern', icon: Rocket },
];

const technologyItems = [
  {
    title: 'Infrastruktur Teknologi',
    description:
      'DataGO, big data, geoportal, dan tata kelola data menjadi fondasi pengambilan keputusan kota yang lebih cepat, terukur, dan berbasis kebutuhan warga.',
    icon: Building2,
    href: 'https://pilarstatistik.magelangkota.go.id/artikel/sinergi-data-teknologi-dan-kebijakan-menuju-kota-magelang-yang-berkelanjutan',
    details: [
      'Data terintegrasi lintas sektor',
      'Geoportal untuk peta kondisi wilayah',
      'Kebijakan berbasis bukti',
    ],
  },
  {
    title: 'Internet dan Jaringan Komunikasi',
    description:
      'Konektivitas fiber dan layanan internet berkualitas mendukung aktivitas digital pemerintah, masyarakat, UMKM, hingga kebutuhan wisatawan.',
    icon: Wifi,
    href: 'https://www.biznetnetworks.com/portfolio/kota-magelang',
    details: [
      'Jaringan internet cepat',
      'Dukungan aktivitas digital kota',
      'Layanan untuk rumah, UMKM, dan bisnis',
    ],
  },
  {
    title: 'Digitalisasi Layanan Publik',
    description:
      'Pelayanan publik digital diarahkan agar lebih mudah diakses, berdampak nyata, dan membantu masyarakat mendapat informasi maupun layanan kota secara lebih cepat.',
    icon: Network,
    href: 'https://magelangkota.go.id/view/wali-kota-magelang-pelayanan-publik-harus-berdampak-nyata-bagi-masyarakat-2',
    details: [
      'Layanan yang dekat dengan warga',
      'Akses informasi lebih cepat',
      'Dampak nyata untuk masyarakat',
    ],
  },
  {
    title: 'Pengembangan Smart City',
    description:
      'Smart city Magelang bertumpu pada data cerdas, layanan publik digital, ekonomi kreatif, pariwisata, infrastruktur kota, dan partisipasi masyarakat.',
    icon: Lightbulb,
    href: 'https://pilarstatistik.magelangkota.go.id/artikel/smart-data-smart-city-bagaimana-membangun-daya-saing-kota-magelang',
    details: [
      'Masterplan Smart City 2024-2033',
      'Ekosistem ekonomi cerdas',
      'Partisipasi warga berbasis data',
    ],
  },
];

const potentialItems = [
  {
    title: 'Potensi Pariwisata Magelang',
    description:
      'Magelang punya kekuatan heritage Borobudur, wisata alam, ruang kota, event, dan jalur budaya yang bisa dikemas sebagai perjalanan digital.',
    href: '/wisata',
  },
  {
    title: 'Ekonomi Kreatif Magelang',
    description:
      'Kuliner khas, UMKM, produk kreatif, dan agenda komunitas menjadi ruang promosi lokal yang dapat ditemukan lewat fitur publik Magelang.',
    href: '/kuliner',
  },
];

const interestOptions = [
  { value: 'wisata', label: 'Wisata', icon: MapPin },
  { value: 'kuliner', label: 'Kuliner', icon: Utensils },
  { value: 'event', label: 'Event', icon: Sparkles },
  { value: 'sejarah', label: 'Sejarah', icon: History },
  { value: 'budaya', label: 'Budaya', icon: ScrollText },
];

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeRouteCategory(value?: string) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('kuliner')) return 'kuliner';
  if (normalized.includes('event')) return 'event';
  if (normalized.includes('budaya')) return 'budaya';
  if (normalized.includes('sejarah')) return 'sejarah';
  return 'wisata';
}

export default function SmartMagelangPage() {
  const { token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<SmartTab>('ai');
  const [duration, setDuration] = useState('4');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [interests, setInterests] = useState<string[]>(['wisata', 'kuliner']);
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number }>(MAGELANG_CENTER);
  const [locationStatus, setLocationStatus] = useState('Aktifkan lokasi untuk rekomendasi terdekat');

  const requestLocation = () => {
    if (!('geolocation' in navigator)) return;

    setLocationStatus('Meminta izin lokasi perangkat...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('Lokasi perangkat aktif');
      },
      () => setLocationStatus('Izin lokasi belum aktif, memakai pusat Magelang'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const tripWindow = useMemo(() => {
    const start = new Date();
    const [hour, minute] = departureTime.split(':').map(Number);
    start.setHours(hour || 0, minute || 0, 0, 0);
    const end = new Date(start.getTime() + Number(duration || 0) * 60 * 60 * 1000);
    return `${timeLabel(start.toISOString())} - ${timeLabel(end.toISOString())}`;
  }, [departureTime, duration]);

  const toggleInterest = (value: string) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!isAuthenticated) {
      setError('Silakan login terlebih dahulu untuk memakai AI Assistant.');
      return;
    }

    if (Number(duration) <= 0) {
      setError('Waktu perjalanan harus lebih dari 0 jam.');
      return;
    }

    if (interests.length === 0) {
      setError('Pilih minimal satu minat.');
      return;
    }

    const start = new Date();
    const [hour, minute] = departureTime.split(':').map(Number);
    start.setHours(hour || 0, minute || 0, 0, 0);

    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/recommendations/generate-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          duration: Number(duration),
          startTime: start.toISOString(),
          interests,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Gagal membuat itinerary.');
      }

      setResult(await response.json());
    } catch (err: any) {
      setError(err.message || 'Gagal membuat itinerary.');
    } finally {
      setLoading(false);
    }
  };

  const storeItineraryForSmartMap = () => {
    if (!result || typeof window === 'undefined') return;

    const payload: SmartMapRoutePayload = {
      source: 'ai-assistant',
      generatedAt: new Date().toISOString(),
      summary: result.summary,
      totalDistance: result.totalDistance,
      totalDuration: result.totalDuration,
      stops: result.itinerary
        .map((item) => ({
          id: String(item.destination.mapId || item.destination.id || `${item.order}-${item.destination.name}`),
          order: item.order,
          title: item.destination.name,
          description: item.destination.description,
          category: normalizeRouteCategory(item.destination.category),
          latitude: Number(item.destination.latitude),
          longitude: Number(item.destination.longitude),
          location: item.destination.location || 'Magelang',
          link: item.destination.link,
          detailUrl:
            item.destination.detailUrl ||
            `/smart-map?focus=${item.destination.mapId || item.destination.id || encodeURIComponent(item.destination.name)}`,
        }))
        .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)),
    };

    window.sessionStorage.setItem('magelangverse.smartMap.itinerary', JSON.stringify(payload));
  };

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-8">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            <Cpu className="h-4 w-4" />
            Perkembangan Teknologi dan Potensi Modern
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Smart Magelang</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Pusat fitur digital Magelang untuk AI itinerary, teknologi kota, potensi pariwisata,
            dan ekonomi kreatif berbasis UMKM.
          </p>
        </section>

        <section className="mb-8 flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-cyan-400 text-slate-950'
                    : 'border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-300/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </section>

        {activeTab === 'ai' && (
          <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-slate-800 bg-slate-900/85 p-6"
            >
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <Bot className="h-6 w-6 text-cyan-300" />
                AI Assistant
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Masukkan jam mulai, waktu yang tersedia, dan minat. AI akan menyusun rekomendasi
                dari titik terdekat dulu.
              </p>

              <div className="mt-6 space-y-5">
                <label className="block text-sm font-semibold text-slate-200">
                  Jam awal keberangkatan
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(event) => setDepartureTime(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    required
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-200">
                  Waktu yang dimiliki
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    placeholder="Contoh: 1, 2, 3, 4, 6"
                    required
                  />
                </label>

                <div>
                  <p className="text-sm font-semibold text-slate-200">Minat</p>
                  <div className="mt-3 grid gap-3">
                    {interestOptions.map((item) => {
                      const Icon = item.icon;
                      const checked = interests.includes(item.value);
                      return (
                        <label
                          key={item.value}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                            checked
                              ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
                              : 'border-slate-700 bg-slate-950/70 text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleInterest(item.value)}
                            className="h-4 w-4 accent-cyan-400"
                          />
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-300" />
                    Jadwal: {tripWindow}
                  </p>
                  <p className="mt-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    {locationStatus}
                  </p>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300"
                  >
                    <LocateFixed className="h-4 w-4" />
                    Aktifkan Lokasi
                  </button>
                </div>

                {error && <p className="text-sm text-rose-300">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                  {loading ? 'Menyusun itinerary...' : 'Buat Itinerary'}
                </button>
              </div>
            </form>

            <section className="rounded-lg border border-slate-800 bg-slate-900/85 p-6">
              {!result ? (
                <div className="flex min-h-[420px] flex-col justify-center">
                  <Navigation className="h-12 w-12 text-cyan-300" />
                  <h2 className="mt-5 text-3xl font-semibold">
                    Rekomendasi rute akan tampil di sini
                  </h2>
                  <p className="mt-3 max-w-xl text-slate-400">
                    Hasil akan berisi itinerary, jarak, waktu tempuh, estimasi durasi, dan urutan
                    destinasi yang diprioritaskan dari yang terdekat.
                  </p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mb-6">
                    <h2 className="text-3xl font-semibold">Itinerary Smart Magelang</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{result.summary}</p>
                  </div>

                  <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    <Stat label="Jarak Total" value={`${result.totalDistance.toFixed(1)} km`} />
                    <Stat
                      label="Waktu Rute"
                      value={`${Math.floor(result.totalDuration / 60)}j ${result.totalDuration % 60}m`}
                    />
                    <Stat
                      label="Estimasi Biaya"
                      value={`Rp ${result.totalCost.toLocaleString('id-ID')}`}
                    />
                  </div>

                  <a
                    href="/smart-map?itinerary=ai"
                    onClick={storeItineraryForSmartMap}
                    className="mb-6 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <MapPin className="h-4 w-4" />
                    Lihat di Smart Map
                  </a>

                  <div className="space-y-4">
                    {result.itinerary.map((item) => (
                      <article
                        key={`${item.order}-${item.destination.name}`}
                        className="rounded-lg border border-slate-800 bg-slate-950/75 p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-cyan-300">
                              {item.order}. {timeLabel(item.startTime)} - {timeLabel(item.endTime)}
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-white">
                              {item.destination.name}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {item.destination.description}
                            </p>
                          </div>
                          <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                            {item.destination.category || 'Rekomendasi'}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                          <p>Jarak: {item.distance.toFixed(1)} km</p>
                          <p>Tempuh: {item.travelTime} menit</p>
                          <p>Singgah: {item.stayDuration} menit</p>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">{item.directions}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <a
                            href={
                              item.destination.detailUrl ||
                              `/smart-map?focus=${item.destination.mapId || item.destination.id || encodeURIComponent(item.destination.name)}`
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                          >
                            <MapPin className="h-4 w-4" />
                            Lihat di Smart Map
                          </a>
                          <a
                            href={
                              item.destination.link ||
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.destination.name)}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-200 hover:border-cyan-300"
                          >
                            <Navigation className="h-4 w-4" />
                            Sumber
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>

                  {result.tips.length > 0 && (
                    <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-5">
                      <h3 className="font-semibold text-white">Tips</h3>
                      <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {result.tips.map((tip) => (
                          <li key={tip}>- {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </section>
          </section>
        )}

        {activeTab === 'technology' && (
          <section className="grid gap-5 md:grid-cols-2">
            {technologyItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-800 bg-slate-900/85 p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
                    {item.title}
                    <ExternalLink className="h-4 w-4 text-cyan-200" />
                  </h2>
                  <p className="mt-3 leading-7 text-slate-300">{item.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.details.map((detail) => (
                      <span
                        key={detail}
                        className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-100"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </a>
              );
            })}
          </section>
        )}

        {activeTab === 'potential' && (
          <section className="grid gap-5 md:grid-cols-2">
            {potentialItems.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="rounded-lg border border-slate-800 bg-slate-900/85 p-6 transition hover:border-cyan-300/60"
              >
                <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 leading-7 text-slate-300">{item.description}</p>
              </a>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </GradientBg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
