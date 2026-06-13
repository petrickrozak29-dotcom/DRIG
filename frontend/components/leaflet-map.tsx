'use client';

import { useEffect, useRef } from 'react';

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
}

interface LeafletMapProps {
  markers: MarkerItem[];
  center?: { lat: number; lng: number };
  focusId?: string | null;
}

const markerColor: Record<string, string> = {
  event: '#f43f5e',
  wisata: '#06b6d4',
  kuliner: '#f59e0b',
  budaya: '#8b5cf6',
  sejarah: '#10b981',
  lokasi: '#22c55e',
};

function escapeHtml(value?: string | number) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPopupHtml(marker: MarkerItem) {
  const title = escapeHtml(marker.title);
  const typeLabel = escapeHtml(marker.typeLabel || marker.category);
  const location = escapeHtml(marker.location);
  const description = escapeHtml(marker.description);
  const distance = typeof marker.distance === 'number' ? `${marker.distance.toFixed(1)} km` : '';
  const detailUrl = marker.detailUrl || `/smart-map?focus=${encodeURIComponent(String(marker.id))}`;
  const openUrl =
    marker.link ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marker.location || marker.title)}`;
  const image = marker.image
    ? `<img src="${escapeHtml(marker.image)}" alt="${title}" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:10px;" />`
    : '';

  return `
    <div style="width:240px;color:#0f172a;font-family:Inter,Arial,sans-serif;">
      ${image}
      <strong style="display:block;font-size:15px;line-height:1.25;margin-bottom:4px;">${title}</strong>
      <span style="display:inline-block;font-size:11px;font-weight:700;color:#075985;background:#e0f2fe;border-radius:999px;padding:3px 8px;margin-bottom:8px;">${typeLabel}</span>
      <p style="font-size:12px;line-height:1.45;margin:0 0 8px;color:#334155;">${description}</p>
      <p style="font-size:11px;line-height:1.35;margin:0 0 10px;color:#64748b;">${location}${distance ? ` • ${distance}` : ''}</p>
      <div style="display:flex;gap:8px;">
        <a href="${escapeHtml(detailUrl)}" style="flex:1;text-align:center;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700;">Lihat Detail</a>
        <a href="${escapeHtml(openUrl)}" target="_blank" rel="noreferrer" style="flex:1;text-align:center;background:#0891b2;color:#fff;text-decoration:none;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700;">Open Link</a>
      </div>
    </div>
  `;
}

export default function LeafletMap({ markers, center, focusId }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any | null>(null);
  const markerLayer = useRef<any | null>(null);
  const leafletRef = useRef<any | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (!mapRef.current || mapInstance.current || !mounted) return;

      const L = (await import('leaflet')).default;
      // @ts-ignore - dynamic CSS import for client-only Leaflet styles
      await import('leaflet/dist/leaflet.css');

      leafletRef.current = L;

      mapInstance.current = L.map(mapRef.current, {
        center: center ? [center.lat, center.lng] : [-7.4797, 110.2177],
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance.current);

      markerLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    initMap();

    return () => {
      mounted = false;
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!markerLayer.current || !leafletRef.current) return;

    markerLayer.current.clearLayers();
    const bounds: any[] = [];
    let focusMarker: any | null = null;

    markers.forEach((marker) => {
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
        .addTo(markerLayer.current!);

      bounds.push([marker.latitude, marker.longitude]);

      if (focusId && String(marker.id) === focusId) {
        focusMarker = leafletMarker;
      }
    });

    if (center) {
      bounds.push([center.lat, center.lng]);
    }

    if (focusMarker) {
      mapInstance.current.setView(focusMarker.getLatLng(), 14, { animate: true });
      focusMarker.openPopup();
      return;
    }

    if (bounds.length > 1) {
      mapInstance.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }, [markers, center, focusId]);

  return <div ref={mapRef} className="h-[560px] w-full rounded-lg border border-slate-800" />;
}
