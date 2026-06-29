'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('../../components/leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[560px] w-full rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-400">
      Memuat peta...
    </div>
  ),
});
import { getApiBaseUrl } from '../../lib/api';
import { getImageObjectPosition, getImageSrc } from '../../lib/image-position';
import {
  MAGELANG_CENTER,
  buildSmartMapItems,
  buildSmartMapItemsAsync,
  formatDate,
  fetchEvents,
  getActiveCommunityEvents,
  withDistances,
  type CommunityEvent,
  type MapCategory,
  type SmartMapItemWithDistance,
} from '../../lib/magelang-data';

const SMART_MAP_ITINERARY_KEY = 'magelangverse.smartMap.itinerary';

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
    category?: MapCategory | string;
    latitude: number;
    longitude: number;
    location?: string;
    link?: string;
    detailUrl?: string;
  }>;
}

const fallbackMapImage: Record<string, string> = {
  event:
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80',
  wisata:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
  kuliner:
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
  budaya:
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1000&q=80',
  sejarah:
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1000&q=80',
};

function categoryClass(category: string) {
  if (category === 'event') return 'border-rose-400/40 bg-rose-500/10 text-rose-200';
  if (category === 'kuliner') return 'border-amber-400/40 bg-amber-500/10 text-amber-200';
  if (category === 'budaya') return 'border-violet-400/40 bg-violet-500/10 text-violet-200';
  if (category === 'sejarah') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
  return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200';
}

function normalizeMapCategory(value?: string): MapCategory {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('event')) return 'event';
  if (normalized.includes('kuliner')) return 'kuliner';
  if (normalized.includes('budaya')) return 'budaya';
  if (normalized.includes('sejarah')) return 'sejarah';
  return 'wisata';
}

function readItineraryPayload(): SmartMapRoutePayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('itinerary') !== 'ai') return null;

    const raw = window.sessionStorage.getItem(SMART_MAP_ITINERARY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SmartMapRoutePayload;
    if (!Array.isArray(parsed.stops)) return null;

    const stops = parsed.stops
      .map((stop) => ({
        ...stop,
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude),
        category: normalizeMapCategory(String(stop.category || 'wisata')),
      }))
      .filter(
        (stop) =>
          Number.isFinite(stop.latitude) &&
          Number.isFinite(stop.longitude) &&
          stop.latitude !== 0 &&
          stop.longitude !== 0
      );

    if (stops.length === 0) return null;
    return { ...parsed, stops };
  } catch {
    return null;
  }
}

export default function SmartMapPage() {
  const { token, isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(MAGELANG_CENTER);
  const [locationStatus, setLocationStatus] = useState('Mode pusat Magelang aktif');
  const [apiEvents, setApiEvents] = useState<CommunityEvent[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [itineraryRoute, setItineraryRoute] = useState<SmartMapRoutePayload | null>(null);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation tidak tersedia, memakai pusat Magelang');
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
        setLocationStatus('Lokasi perangkat aktif untuk estimasi jarak');

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
            setLocationStatus('Lokasi perangkat aktif');
          }
        }
      },
      () => {
        setLocationStatus('Izin lokasi belum aktif, memakai pusat Magelang');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    setFocusId(new URLSearchParams(window.location.search).get('focus'));
    setItineraryRoute(readItineraryPayload());

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

  const eventAgendaItems = useMemo(
    () =>
      withDistances(
        getActiveCommunityEvents(apiEvents).filter(
          (event) => event.category === 'event' && event.status === 'approved'
        ),
        userLocation
      ),
    [apiEvents, dataVersion, userLocation]
  );

  const monthlyAgenda = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return eventAgendaItems
      .filter((item) => {
        if (!item.date) return false;
        const date = new Date(item.date);
        return (
          date.getMonth() === month &&
          date.getFullYear() === year &&
          date.getTime() >= Date.now() - 86400000
        );
      })
      .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
      .slice(0, 5);
  }, [eventAgendaItems]);

  const itineraryMapMarkers = useMemo(
    () =>
      itineraryRoute?.stops.map((stop) => {
        const category = normalizeMapCategory(String(stop.category || 'wisata'));
        return {
          id: `itinerary-${stop.order}-${stop.id}`,
          title: `${stop.order}. ${stop.title}`,
          category,
          typeLabel: 'Itinerary AI',
          description: stop.description || 'Destinasi dari itinerary AI Assistant.',
          location: stop.location || 'Magelang',
          latitude: stop.latitude,
          longitude: stop.longitude,
          image: fallbackMapImage[category],
          link: stop.link,
          detailUrl: stop.detailUrl || `/smart-map?focus=${stop.id}`,
        };
      }) || [],
    [itineraryRoute]
  );

  const routeStops = useMemo(
    () =>
      itineraryRoute?.stops.map((stop) => ({
        id: stop.id,
        order: stop.order,
        title: stop.title,
        latitude: stop.latitude,
        longitude: stop.longitude,
      })) || [],
    [itineraryRoute]
  );

  const clearItineraryRoute = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SMART_MAP_ITINERARY_KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete('itinerary');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
    setItineraryRoute(null);
  };

  const mapMarkers = useMemo(
    () => [
      ...itineraryMapMarkers,
      ...allItems,
    ],
    [allItems, itineraryMapMarkers]
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
                Jelajahi titik wisata, kuliner, budaya, sejarah, dan event Magelang dengan foto,
                sumber informasi, serta estimasi jarak dari lokasi Anda.
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

        <section className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80">
            {itineraryRoute && (
              <div className="border-b border-slate-800 bg-slate-950/80 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                      <Navigation className="h-4 w-4" />
                      Rute itinerary AI aktif
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                      {itineraryRoute.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      {itineraryRoute.stops.map((stop) => (
                        <span
                          key={`${stop.order}-${stop.id}`}
                          className="rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-blue-100"
                        >
                          {stop.order}. {stop.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearItineraryRoute}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300"
                  >
                    Tutup Rute
                  </button>
                </div>
              </div>
            )}
            <LeafletMap
              markers={mapMarkers}
              center={MAGELANG_CENTER}
              focusId={focusId}
              routeStops={routeStops}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
            <span>{allItems.length} marker aktif di Smart Map</span>
            <a href="/community-form" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Tambah Konten Komunitas
            </a>
          </div>

          <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <CalendarDays className="h-5 w-5 text-rose-300" />
              Agenda Bulan Ini
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {monthlyAgenda.map((item) => (
                <a
                  key={item.id}
                  href={`/smart-map?focus=${item.id}`}
                  className="block rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition hover:border-rose-300/60"
                >
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryClass(item.category)}`}>
                    {item.typeLabel}
                  </span>
                  <p className="mt-3 font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatDate(item.date)} - {item.distance.toFixed(1)} km
                  </p>
                </a>
              ))}
              {monthlyAgenda.length === 0 && (
                <p className="text-sm text-slate-400">Belum ada agenda bulan ini.</p>
              )}
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {allItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80"
              >
                <img
                  src={getImageSrc(item.image, fallbackMapImage[item.category])}
                  alt={item.title}
                  onError={(event) => {
                    event.currentTarget.src = fallbackMapImage[item.category] || fallbackMapImage.wisata;
                  }}
                  style={{ objectPosition: getImageObjectPosition(item.image) }}
                  className="h-40 w-full object-cover"
                />
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
                      <span>{item.location || 'Magelang'}</span>
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
                    {item.openingHours && <p>Jam: {item.openingHours}</p>}
                    {(item.ticketPrice || item.priceRange) && (
                      <p>Harga: {item.ticketPrice || item.priceRange}</p>
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
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Sumber
                        <ExternalLink className="h-4 w-4" />
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
          </div>
        </section>
      </main>
      <Footer />
    </GradientBg>
  );
}
