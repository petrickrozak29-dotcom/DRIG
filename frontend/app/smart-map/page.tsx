'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  Filter,
  LocateFixed,
  MapPin,
  Navigation,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import LeafletMap from '../../components/leaflet-map';
import { getApiBaseUrl } from '../../lib/api';
import {
  MAGELANG_CENTER,
  buildSmartMapItems,
  buildSmartMapItemsAsync,
  eventCategories,
  formatDate,
  fetchEvents,
  withDistances,
  type CommunityEvent,
  type EventCategory,
  type MapCategory,
  type SmartMapItemWithDistance,
} from '../../lib/magelang-data';

type SmartFilter = 'semua' | 'event-nearby' | EventCategory;
type CategoryFilter = 'semua' | MapCategory;

const smartFilters: Array<{ value: SmartFilter; label: string }> = [
  { value: 'semua', label: 'Semua marker' },
  { value: 'event-nearby', label: 'Event dekat saya' },
  ...eventCategories.map((category) => ({ value: category, label: category })),
];

const categoryFilters: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'semua', label: 'Semua kategori' },
  { value: 'event', label: 'Event' },
  { value: 'wisata', label: 'Wisata' },
  { value: 'kuliner', label: 'Kuliner' },
  { value: 'budaya', label: 'Budaya' },
  { value: 'sejarah', label: 'Sejarah' },
];

function categoryClass(category: string) {
  if (category === 'event') return 'border-rose-400/40 bg-rose-500/10 text-rose-200';
  if (category === 'kuliner') return 'border-amber-400/40 bg-amber-500/10 text-amber-200';
  if (category === 'budaya') return 'border-violet-400/40 bg-violet-500/10 text-violet-200';
  if (category === 'sejarah') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
  return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200';
}

export default function SmartMapPage() {
  const { token, isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(MAGELANG_CENTER);
  const [locationStatus, setLocationStatus] = useState('Mode pusat Kota Magelang aktif');
  const [radius, setRadius] = useState(40);
  const [smartFilter, setSmartFilter] = useState<SmartFilter>('semua');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('semua');
  const [apiEvents, setApiEvents] = useState<CommunityEvent[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation tidak tersedia, memakai pusat Kota Magelang');
      return;
    }

    setLocationStatus('Mengambil lokasi perangkat...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(coords);
        setLocationStatus('Lokasi perangkat aktif untuk filter terdekat');

        if (token) {
          try {
            await fetch(`${getApiBaseUrl()}/api/locations/update`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: coords.lat,
                longitude: coords.lng,
                accuracy: position.coords.accuracy,
              }),
            });
          } catch {
            setLocationStatus('Lokasi aktif, sinkron backend belum tersedia');
          }
        }
      },
      () => {
        setLocationStatus('Izin lokasi belum aktif, memakai pusat Kota Magelang');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    setFocusId(new URLSearchParams(window.location.search).get('focus'));
    requestLocation();

    const updateVersion = () => setDataVersion((version) => version + 1);
    window.addEventListener('magelangverse-events-updated', updateVersion);
    window.addEventListener('magelangverse-culinary-updated', updateVersion);
    window.addEventListener('magelangverse-tourism-updated', updateVersion);
    window.addEventListener('magelangverse-content-updated', updateVersion);
    window.addEventListener('storage', updateVersion);

    return () => {
      window.removeEventListener('magelangverse-events-updated', updateVersion);
      window.removeEventListener('magelangverse-culinary-updated', updateVersion);
      window.removeEventListener('magelangverse-tourism-updated', updateVersion);
      window.removeEventListener('magelangverse-content-updated', updateVersion);
      window.removeEventListener('storage', updateVersion);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const records = await fetchEvents(false);
        if (mounted) setApiEvents(records);
      } catch {
        if (mounted) setApiEvents([]);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [dataVersion]);

  const [asyncItems, setAsyncItems] = useState<SmartMapItemWithDistance[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await buildSmartMapItemsAsync();
        if (!mounted) return;
        setAsyncItems(withDistances(items, userLocation));
      } catch {
        if (!mounted) return;
        setAsyncItems(withDistances(buildSmartMapItems(apiEvents), userLocation));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [apiEvents, userLocation, dataVersion]);

  const allItems = asyncItems;

  const filteredItems = useMemo(() => {
    let next: SmartMapItemWithDistance[] = allItems.filter((item) => item.distance <= radius);

    if (smartFilter === 'event-nearby') {
      next = next.filter((item) => item.category === 'event');
    }

    if (smartFilter !== 'semua' && smartFilter !== 'event-nearby') {
      next = allItems.filter((item) => item.category === 'event' && item.typeLabel === smartFilter);
    }

    if (categoryFilter !== 'semua') {
      next = next.filter((item) => item.category === categoryFilter);
    }

    return next;
  }, [allItems, radius, smartFilter, categoryFilter]);

  const nearestEvents = useMemo(
    () =>
      allItems.filter((item) => item.category === 'event' && item.distance <= radius).slice(0, 5),
    [allItems, radius]
  );

  const mapMarkers = useMemo(
    () => [
      {
        id: 'lokasi-saya',
        title: 'Lokasi referensi',
        category: 'lokasi',
        typeLabel: 'Titik Anda',
        description: locationStatus,
        location: 'Pusat radius pencarian',
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        detailUrl: '/smart-map',
        link: `https://www.google.com/maps/search/?api=1&query=${userLocation.lat},${userLocation.lng}`,
      },
      ...filteredItems,
    ],
    [filteredItems, locationStatus, userLocation]
  );

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />
      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
                <MapPin className="h-4 w-4" />
                Smart Map Magelang
              </p>
              <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
                Event, wisata, kuliner, sejarah, dan budaya dalam satu peta
              </h1>
              <p className="mt-4 max-w-3xl text-slate-300">
                Radius diperbesar 30-50 km untuk menjangkau Kota Magelang, Borobudur, Ketep, dan
                titik sekitar. Marker dari semua fitur muncul setelah disetujui developer.
              </p>
            </div>

            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <LocateFixed className="h-5 w-5" />
              Gunakan Lokasi Saya
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-slate-300">
              {locationStatus}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-slate-300">
              {isAuthenticated
                ? 'Login aktif, event komunitas bisa dikirim'
                : 'Peta bisa dipakai tanpa login'}
            </span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <SlidersHorizontal className="h-5 w-5 text-cyan-300" />
                Radius
              </div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>30 km</span>
                <span className="font-semibold text-cyan-300">{radius} km</span>
                <span>50 km</span>
              </div>
              <input
                type="range"
                min={30}
                max={50}
                step={5}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                className="mt-4 w-full accent-cyan-400"
              />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Filter className="h-5 w-5 text-cyan-300" />
                Filter
              </div>

              <div className="grid gap-2">
                {smartFilters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setSmartFilter(item.value);
                      if (item.value !== 'semua') setCategoryFilter('semua');
                    }}
                    className={`rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                      smartFilter === item.value
                        ? 'bg-cyan-400 text-slate-950'
                        : 'border border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-400/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {categoryFilters.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <CalendarDays className="h-5 w-5 text-rose-300" />
                Event Terdekat
              </div>
              <div className="space-y-3">
                {nearestEvents.map((item) => (
                  <a
                    key={item.id}
                    href={`/smart-map?focus=${item.id}`}
                    className="block rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition hover:border-rose-300/60"
                  >
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(item.date)} - {item.distance.toFixed(1)} km
                    </p>
                  </a>
                ))}
                {nearestEvents.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Belum ada event dalam radius {radius} km.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80">
              <LeafletMap markers={mapMarkers} center={userLocation} focusId={focusId} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
              <span>{filteredItems.length} marker aktif dalam filter saat ini</span>
              <a href="/community-form" className="font-semibold text-cyan-300 hover:text-cyan-200">
                Tambah Community Event
              </a>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80"
                >
                  <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryClass(item.category)}`}
                      >
                        {item.typeLabel}
                      </span>
                      <span className="text-xs text-slate-400">{item.distance.toFixed(1)} km</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{item.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                      {item.description}
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      <p className="flex gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                        <span>{item.location}</span>
                      </p>
                      {item.date && (
                        <p className="flex gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                          <span>
                            {formatDate(item.date)}
                            {item.time ? `, ${item.time}` : ''}
                          </span>
                        </p>
                      )}
                      <p className="flex gap-2">
                        <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>Estimasi {item.estimatedTravelTime} menit perjalanan</span>
                      </p>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <a
                        href={`/smart-map?focus=${item.id}`}
                        className="rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Lihat Detail
                      </a>
                      <a
                        href={
                          item.link ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Open Link
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </GradientBg>
  );
}
