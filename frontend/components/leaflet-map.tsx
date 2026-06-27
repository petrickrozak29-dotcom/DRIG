'use client';

import { useEffect, useRef, useState } from 'react';

interface MarkerItem {
  id: string | number;
  latitude: number;
  longitude: number;
  title: string;
  category: string;
  typeLabel?: string;
  description?: string;
  location?: string;
  image?: string;
  link?: string;
  detailUrl?: string;
  distance?: number;
  estimatedTravelTime?: number;
  priceRange?: string;
  ticketPrice?: string;
  openingHours?: string;
}

interface LeafletMapProps {
  markers: MarkerItem[];
  center?: { lat: number; lng: number };
  focusId?: string | null;
}

type TileStyle = 'street' | 'satellite';

const markerColor: Record<string, string> = {
  event: '#f43f5e',
  wisata: '#06b6d4',
  kuliner: '#f59e0b',
  budaya: '#8b5cf6',
  sejarah: '#10b981',
  lokasi: '#22c55e',
};

const GOOGLE_SUBDOMAINS = ['mt0', 'mt1', 'mt2', 'mt3'];

const TILE_CONFIGS: Record<TileStyle, { url: string; attribution: string; subdomains: string[] }> = {
  street: {
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=id&gl=ID&apistyle=s.t:2|s.e:l|p.v:off',
    attribution: '&copy; 2026 Google',
    subdomains: GOOGLE_SUBDOMAINS,
  },
  satellite: {
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&hl=id&gl=ID',
    attribution: '&copy; 2026 Google',
    subdomains: GOOGLE_SUBDOMAINS,
  },
};

const fallbackImage: Record<string, string> = {
  event: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
  wisata: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  kuliner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  budaya: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
  sejarah: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80',
};

function getPopupHtml(marker: MarkerItem) {
  const title = escapeHtml(String(marker.title ?? ''));
  const typeLabel = escapeHtml(String(marker.typeLabel || marker.category));
  const location = escapeHtml(String(marker.location ?? ''));
  const description = escapeHtml(String(marker.description ?? ''));
  const distance = typeof marker.distance === 'number' ? `${marker.distance.toFixed(1)} km` : '';
  const detailUrl = escapeAttr(marker.detailUrl || `/smart-map?focus=${encodeURIComponent(String(marker.id))}`);
  const linkUrl = getSafeMapHref(marker);
  const sourceButton = linkUrl
    ? `<a href="${linkUrl}" target="_blank" rel="noreferrer" style="flex:1;text-align:center;background:#0891b2;color:#fff;text-decoration:none;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700;">Sumber</a>`
    : `<span style="flex:1;text-align:center;background:#e2e8f0;color:#64748b;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700;">Sumber</span>`;
  const extra = [marker.openingHours, marker.ticketPrice || marker.priceRange]
    .filter(Boolean)
    .map((item) => `<p style="font-size:11px;line-height:1.35;margin:0 0 6px;color:#64748b;">${escapeHtml(String(item))}</p>`)
    .join('');
  const cat = String(marker.category).toLowerCase();
  const imgSrc = marker.image || fallbackImage[cat] || fallbackImage.wisata;
  const fallbackSrc = fallbackImage[cat] || fallbackImage.wisata;
  const image = `<img src="${escapeAttr(imgSrc)}" alt="${title}" onerror="this.onerror=null;this.src='${escapeAttr(fallbackSrc)}';" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:10px;background:#e2e8f0;" />`;

  return `
    <div style="width:240px;color:#0f172a;font-family:Inter,Arial,sans-serif;">
      ${image}
      <strong style="display:block;font-size:15px;line-height:1.25;margin-bottom:4px;">${title}</strong>
      <span style="display:inline-block;font-size:11px;font-weight:700;color:#075985;background:#e0f2fe;border-radius:999px;padding:3px 8px;margin-bottom:8px;">${typeLabel}</span>
      <p style="font-size:12px;line-height:1.45;margin:0 0 8px;color:#334155;">${description}</p>
      <p style="font-size:11px;line-height:1.35;margin:0 0 10px;color:#64748b;">${location}${distance ? ` - ${distance}` : ''}</p>
      ${extra}
      <div style="display:flex;gap:8px;">
        <a href="${detailUrl}" style="flex:1;text-align:center;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700;">Lihat Detail</a>
        ${sourceButton}
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#039;';
  });
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function extractCoordinatePair(value?: string | null) {
  const raw = String(value || '').trim();
  const match = raw.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return { latitude, longitude };
  }

  return null;
}

function getSafeMapHref(marker: MarkerItem) {
  const rawLink = String(marker.link || '').trim();
  const linkCoords = extractCoordinatePair(rawLink);
  if (linkCoords) {
    return escapeAttr(
      `https://www.google.com/maps/search/?api=1&query=${linkCoords.latitude},${linkCoords.longitude}`
    );
  }

  if (/^https?:\/\//i.test(rawLink)) {
    return escapeAttr(rawLink);
  }

  if (Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude)) {
    return escapeAttr(
      `https://www.google.com/maps/search/?api=1&query=${marker.latitude},${marker.longitude}`
    );
  }

  return '';
}

export default function LeafletMap({ markers, center, focusId }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerLayerRef = useRef<any | null>(null);
  const leafletRef = useRef<any | null>(null);
  const [tileStyle, setTileStyle] = useState<TileStyle>('street');
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  // SSR guard: only run on client after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize map once after DOM is ready
  useEffect(() => {
    if (!mounted || mapInstanceRef.current || !mapContainerRef.current) return;

    let cancelled = false;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      const container = mapContainerRef.current;
      if (cancelled || !container || !container.isConnected) return;

      leafletRef.current = L;

      const initCenter: [number, number] =
        center && Number.isFinite(center.lat) && Number.isFinite(center.lng)
          ? [center.lat, center.lng]
          : [-7.4797, 110.2177];

      const map = L.map(container, {
        center: initCenter,
        zoom: 12,
        scrollWheelZoom: true,
      });

      const cfg = TILE_CONFIGS[tileStyle];
      L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains,
        maxZoom: 20,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markerLayerRef.current = layerGroup;
      setReady(true);

      // Invalidate size after mount to fix container-not-found issues
      invalidateTimer = setTimeout(() => {
        if (mapInstanceRef.current && mapContainerRef.current?.isConnected) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    })();

    return () => {
      cancelled = true;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      setReady(false);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
        markerLayerRef.current = null;
      }
    };
  }, [mounted]);

  // Switch tile style
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current || !mapContainerRef.current?.isConnected) return;

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer._url) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    const cfg = TILE_CONFIGS[tileStyle];
    leafletRef.current
      .tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains,
        maxZoom: 20,
      })
      .addTo(mapInstanceRef.current);
  }, [tileStyle]);

  // Sync markers (depends on `ready` so it re-runs after map init)
  useEffect(() => {
    if (
      !ready ||
      !markerLayerRef.current ||
      !leafletRef.current ||
      !mapInstanceRef.current ||
      !mapContainerRef.current?.isConnected
    ) {
      return;
    }

    markerLayerRef.current.clearLayers();
    const bounds: any[] = [];
    let focusMarker: any | null = null;

    markers.forEach((marker) => {
      if (!Number.isFinite(marker.latitude) || !Number.isFinite(marker.longitude)) return;
      if (marker.latitude === 0 && marker.longitude === 0) return;

      const color = markerColor[String(marker.category).toLowerCase()] || '#38bdf8';
      const icon = leafletRef.current.divIcon({
        className: '',
        html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 8px 18px rgba(15,23,42,.35);"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -8],
      });

      const leafletMarker = leafletRef.current
        .marker([marker.latitude, marker.longitude], { icon })
        .bindPopup(getPopupHtml(marker))
        .addTo(markerLayerRef.current);

      bounds.push([marker.latitude, marker.longitude]);

      if (focusId && String(marker.id) === focusId) {
        focusMarker = leafletMarker;
      }
    });

    if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
      bounds.push([center.lat, center.lng]);
    }

    if (focusMarker) {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.setView(focusMarker.getLatLng(), 14, { animate: false });
      focusMarker.openPopup();
      return;
    }

    try {
      if (mapInstanceRef.current && bounds.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [36, 36],
          maxZoom: 13,
          animate: false,
        });
      } else if (mapInstanceRef.current && bounds.length === 1) {
        mapInstanceRef.current.setView(bounds[0], 13, { animate: false });
      }
    } catch {
      // Ignore fitBounds errors on empty bounds
    }
  }, [markers, center, focusId, ready]);

  // If not mounted yet (SSR), render an invisible placeholder with the same dimensions
  if (!mounted) {
    return (
      <div className="relative">
        <div className="h-[560px] w-full rounded-lg border border-slate-800 bg-slate-900/50" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-[1000] flex gap-1">
        <button
          type="button"
          onClick={() => setTileStyle('street')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold shadow-lg transition ${
            tileStyle === 'street'
              ? 'bg-cyan-400 text-slate-950'
              : 'bg-slate-800/80 text-white hover:bg-slate-700'
          }`}
        >
          Jalan
        </button>
        <button
          type="button"
          onClick={() => setTileStyle('satellite')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold shadow-lg transition ${
            tileStyle === 'satellite'
              ? 'bg-cyan-400 text-slate-950'
              : 'bg-slate-800/80 text-white hover:bg-slate-700'
          }`}
        >
          Satelit
        </button>
      </div>
      <div ref={mapContainerRef} className="h-[560px] w-full rounded-lg border border-slate-800" />
    </div>
  );
}
