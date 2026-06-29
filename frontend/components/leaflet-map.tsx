'use client';

import { useEffect, useRef, useState } from 'react';
import { getImageObjectPosition, getImageSrc } from '../lib/image-position';

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

interface RouteStop {
  id: string | number;
  order: number;
  title: string;
  latitude: number;
  longitude: number;
}

interface LeafletMapProps {
  markers: MarkerItem[];
  center?: { lat: number; lng: number };
  focusId?: string | null;
  routeStops?: RouteStop[];
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

const MAGELANG_BOUNDARIES: Array<{
  id: string;
  name: string;
  color: string;
  coordinates: Array<[number, number]>;
}> = [
  {
    id: 'kota-magelang',
    name: 'Batas Kota Magelang',
    color: '#ef4444',
    coordinates: [[110.2015152,-7.4905805],[110.2028809,-7.4925065],[110.2060928,-7.4921794],[110.2040405,-7.4938125],[110.2029877,-7.4975419],[110.2019348,-7.4986515],[110.2040634,-7.5025329],[110.2066513,-7.5040439],[110.2101726,-7.5007226],[110.2142631,-7.504653],[110.2128442,-7.5069337],[110.2156227,-7.5074596],[110.2159497,-7.5049354],[110.2181998,-7.5014351],[110.2203319,-7.5014389],[110.2195635,-7.5026677],[110.2217937,-7.5037023],[110.2205248,-7.5053624],[110.2236804,-7.5041801],[110.2241204,-7.5030854],[110.2319247,-7.504672],[110.2361145,-7.504383],[110.2379608,-7.5053134],[110.2343997,-7.5015386],[110.2335892,-7.4995045],[110.2338022,-7.4978833],[110.236763,-7.4960537],[110.2373734,-7.4935574],[110.2360077,-7.4923434],[110.2365723,-7.4910721],[110.2355635,-7.4894726],[110.2371445,-7.4881949],[110.235252,-7.4856991],[110.2363739,-7.4840803],[110.2344742,-7.4831571],[110.2346135,-7.4821413],[110.233757,-7.4813552],[110.2346802,-7.480174],[110.2327652,-7.4793563],[110.2333221,-7.4782924],[110.2317581,-7.4773306],[110.2305917,-7.474936],[110.2309952,-7.4736647],[110.2299521,-7.473332],[110.2283607,-7.470296],[110.2286606,-7.4692931],[110.2278105,-7.4687569],[110.2273254,-7.4663672],[110.2288513,-7.4658622],[110.2273712,-7.4653306],[110.2284317,-7.4651489],[110.2287521,-7.4642143],[110.2292252,-7.4621482],[110.2285919,-7.4622678],[110.2286377,-7.4609985],[110.2301254,-7.4610543],[110.2289734,-7.4602866],[110.2296238,-7.4579836],[110.2287369,-7.4571009],[110.2300568,-7.4553418],[110.2296066,-7.4537944],[110.2282557,-7.453547],[110.2278366,-7.4493274],[110.2297821,-7.4461565],[110.2309418,-7.4456501],[110.2273712,-7.4426264],[110.2280985,-7.4384078],[110.2251663,-7.4376888],[110.223938,-7.4378461],[110.2231331,-7.4389885],[110.219223,-7.4386935],[110.2177429,-7.4414574],[110.2188467,-7.4441875],[110.2162712,-7.4435931],[110.2119452,-7.4463468],[110.2119027,-7.4478261],[110.213888,-7.4513932],[110.2117386,-7.4532089],[110.2120489,-7.455727],[110.209975,-7.4598179],[110.2118966,-7.4623064],[110.2104645,-7.4680967],[110.2087919,-7.4714035],[110.2086807,-7.4724855],[110.2098804,-7.4740564],[110.2082962,-7.4765735],[110.2062988,-7.4768023],[110.20607,-7.4796671],[110.2076458,-7.4818172],[110.2043756,-7.4883462],[110.2015152,-7.4905805]],
  },
  {
    id: 'kabupaten-magelang',
    name: 'Batas Kabupaten Magelang',
    color: '#2563eb',
    coordinates: [[110.0434647,-7.527492],[110.0457411,-7.5321517],[110.0440986,-7.5374791],[110.052672,-7.548097],[110.0509914,-7.5517226],[110.0590439,-7.5593214],[110.0564423,-7.5726204],[110.0599899,-7.5756793],[110.0623307,-7.5721374],[110.0642777,-7.5733533],[110.0678272,-7.570983],[110.0805973,-7.5770423],[110.0897652,-7.5689663],[110.1003568,-7.5692265],[110.0978856,-7.5745859],[110.1016148,-7.5795472],[110.1031552,-7.5779487],[110.1072159,-7.5938563],[110.1202397,-7.6083915],[110.1213707,-7.6236137],[110.1258163,-7.6310324],[110.1384001,-7.6403245],[110.1380454,-7.642969],[110.1436414,-7.645169],[110.1443253,-7.6503344],[110.1514108,-7.6463091],[110.1602455,-7.6459828],[110.1657807,-7.6489371],[110.1916943,-7.644966],[110.2052396,-7.6520116],[110.2133307,-7.6480299],[110.2323001,-7.6505768],[110.240545,-7.6544205],[110.2518872,-7.6423639],[110.2633952,-7.645782],[110.2661466,-7.6499268],[110.2629141,-7.660523],[110.2671771,-7.6645508],[110.2629785,-7.6788547],[110.2643884,-7.68204],[110.2608532,-7.6870595],[110.2656206,-7.6909207],[110.2723104,-7.7069662],[110.2735911,-7.7015599],[110.2847467,-7.6872675],[110.2915088,-7.6723189],[110.2998474,-7.6647877],[110.304227,-7.6550609],[110.3224731,-7.6455172],[110.3434444,-7.6262778],[110.3553032,-7.6225264],[110.3762972,-7.6066176],[110.379567,-7.6012614],[110.3883028,-7.5976362],[110.3909927,-7.595127],[110.3900611,-7.5924693],[110.4001452,-7.5849686],[110.40188,-7.5792033],[110.4153177,-7.5630262],[110.4462006,-7.5412887],[110.4052273,-7.5164406],[110.3780044,-7.5126501],[110.3893239,-7.5061496],[110.3956579,-7.4977277],[110.4056039,-7.4964513],[110.4081751,-7.4983976],[110.4138642,-7.4964022],[110.426698,-7.4850248],[110.4331024,-7.4770662],[110.434286,-7.4639627],[110.4392752,-7.4526731],[110.4319611,-7.445827],[110.4249191,-7.4348716],[110.4241943,-7.4296894],[110.4143448,-7.4166426],[110.4132309,-7.4079303],[110.4052734,-7.3895912],[110.4066467,-7.3769631],[110.4042053,-7.3749571],[110.403566,-7.3653318],[110.3907089,-7.3530178],[110.3815384,-7.3540549],[110.3792954,-7.3465917],[110.376774,-7.3453686],[110.3775976,-7.3383734],[110.3803555,-7.3376785],[110.3791428,-7.3345523],[110.3626175,-7.3311267],[110.3551407,-7.3261652],[110.3432083,-7.3259287],[110.3280182,-7.3202505],[110.326294,-7.3274097],[110.3195343,-7.3310742],[110.3191528,-7.3369732],[110.3248673,-7.3413124],[110.3167038,-7.3526044],[110.2885058,-7.3628261],[110.2731323,-7.3734817],[110.2672967,-7.3812321],[110.2573929,-7.3773951],[110.2552647,-7.3709331],[110.249527,-7.3691053],[110.2364273,-7.3727388],[110.231781,-7.3821425],[110.2262573,-7.3833642],[110.2234039,-7.3790383],[110.224968,-7.3865771],[110.2224198,-7.3915524],[110.2164001,-7.3950476],[110.2151184,-7.4022255],[110.2132873,-7.3971743],[110.2162926,-7.3881088],[110.211853,-7.3854923],[110.2051926,-7.3871064],[110.2004241,-7.382358],[110.1927822,-7.3799833],[110.1891098,-7.383852],[110.1729508,-7.3811202],[110.1599808,-7.3860769],[110.1467529,-7.3836271],[110.1391879,-7.3884974],[110.1277184,-7.3871275],[110.1207674,-7.3903155],[110.093478,-7.3878421],[110.0786067,-7.3833874],[110.0742111,-7.385705],[110.0626755,-7.4083104],[110.0586548,-7.4281558],[110.0596223,-7.4340214],[110.0530909,-7.435358],[110.0574558,-7.4530529],[110.0649567,-7.4595122],[110.0521088,-7.4817877],[110.0538096,-7.4919068],[110.0495217,-7.4991744],[110.0505724,-7.5055531],[110.0469818,-7.5096831],[110.0492097,-7.5126682],[110.0467682,-7.5140671],[110.0477009,-7.5166521],[110.0444636,-7.5200654],[110.0434647,-7.527492]],
  },
];

function getPopupHtml(marker: MarkerItem) {
  const title = escapeHtml(String(marker.title ?? ''));
  const typeLabel = escapeHtml(String(marker.typeLabel || marker.category));
  const location = escapeHtml(String(marker.location ?? ''));
  const description = escapeHtml(String(marker.description ?? ''));
  const distance = typeof marker.distance === 'number' ? `${marker.distance.toFixed(1)} km` : '';
  const detailUrl = escapeAttr(marker.detailUrl || `/smart-map?focus=${encodeURIComponent(String(marker.id))}`);
  const linkUrl = getSafeSourceHref(marker);
  const sourceButton = linkUrl
    ? `<a href="${linkUrl}" target="_blank" rel="noreferrer" style="flex:1;text-align:center;background:#0891b2;color:#fff;text-decoration:none;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700;">Sumber</a>`
    : `<span style="flex:1;text-align:center;background:#e2e8f0;color:#64748b;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700;">Sumber</span>`;
  const extra = [marker.openingHours, marker.ticketPrice || marker.priceRange]
    .filter(Boolean)
    .map((item) => `<p style="font-size:11px;line-height:1.35;margin:0 0 6px;color:#64748b;">${escapeHtml(String(item))}</p>`)
    .join('');
  const cat = String(marker.category).toLowerCase();
  const imgSrc = getImageSrc(marker.image, fallbackImage[cat] || fallbackImage.wisata);
  const fallbackSrc = fallbackImage[cat] || fallbackImage.wisata;
  const imagePosition = getImageObjectPosition(marker.image);
  const image = `<img src="${escapeAttr(imgSrc)}" alt="${title}" onerror="this.onerror=null;this.src='${escapeAttr(fallbackSrc)}';" style="width:100%;height:96px;object-fit:cover;object-position:${escapeAttr(imagePosition)};border-radius:8px;margin-bottom:10px;background:#e2e8f0;" />`;

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

function getSafeSourceHref(marker: MarkerItem) {
  const rawLink = String(marker.link || '').trim();
  if (/^https?:\/\//i.test(rawLink)) {
    return escapeAttr(rawLink);
  }

  return '';
}

function routeFallback(stops: RouteStop[]) {
  return stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]);
}

async function fetchRoadRoute(stops: RouteStop[]) {
  if (stops.length < 2) return routeFallback(stops);

  const query = stops.map((stop) => `${stop.longitude},${stop.latitude}`).join(';');
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${query}?overview=full&geometries=geojson`
  );
  if (!response.ok) return routeFallback(stops);

  const payload = await response.json();
  const coordinates = payload?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinates)) return routeFallback(stops);

  return coordinates
    .map((pair: unknown) => {
      if (!Array.isArray(pair)) return null;
      const longitude = Number(pair[0]);
      const latitude = Number(pair[1]);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return [latitude, longitude] as [number, number];
    })
    .filter(Boolean) as Array<[number, number]>;
}

export default function LeafletMap({ markers, center, focusId, routeStops = [] }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerLayerRef = useRef<any | null>(null);
  const boundaryLayerRef = useRef<any | null>(null);
  const routeLayerRef = useRef<any | null>(null);
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

      const boundaryLayer = L.layerGroup().addTo(map);
      const routeLayer = L.layerGroup().addTo(map);
      const layerGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      boundaryLayerRef.current = boundaryLayer;
      routeLayerRef.current = routeLayer;
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
        boundaryLayerRef.current = null;
        routeLayerRef.current = null;
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

  useEffect(() => {
    if (
      !ready ||
      !boundaryLayerRef.current ||
      !leafletRef.current ||
      !mapContainerRef.current?.isConnected
    ) {
      return;
    }

    boundaryLayerRef.current.clearLayers();

    MAGELANG_BOUNDARIES.forEach((boundary) => {
      const latLngs = boundary.coordinates.map(([lng, lat]) => [lat, lng]);
      leafletRef.current
        .polygon(latLngs, {
          color: boundary.color,
          weight: boundary.id === 'kota-magelang' ? 4 : 3,
          opacity: 0.95,
          fillColor: boundary.color,
          fillOpacity: boundary.id === 'kota-magelang' ? 0.04 : 0.025,
          dashArray: '12 12',
          interactive: false,
          className: `magelang-boundary-line ${boundary.id}`,
        })
        .bindTooltip(boundary.name, {
          sticky: true,
          direction: 'top',
          className: 'magelang-boundary-tooltip',
        })
        .addTo(boundaryLayerRef.current);
    });
  }, [ready]);

  useEffect(() => {
    if (
      !ready ||
      !routeLayerRef.current ||
      !leafletRef.current ||
      !mapInstanceRef.current ||
      !mapContainerRef.current?.isConnected
    ) {
      return;
    }

    let cancelled = false;
    routeLayerRef.current.clearLayers();

    const validStops = routeStops.filter(
      (stop) =>
        Number.isFinite(stop.latitude) &&
        Number.isFinite(stop.longitude) &&
        stop.latitude !== 0 &&
        stop.longitude !== 0
    );

    if (validStops.length === 0) return;

    validStops.forEach((stop) => {
      const icon = leafletRef.current.divIcon({
        className: '',
        html: `<span style="display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#2563eb;color:white;border:3px solid white;box-shadow:0 8px 20px rgba(37,99,235,.35);font-size:12px;font-weight:800;">${stop.order}</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -10],
      });

      leafletRef.current
        .marker([stop.latitude, stop.longitude], { icon, zIndexOffset: 600 })
        .bindPopup(
          `<strong style="font-family:Inter,Arial,sans-serif;color:#0f172a;">${escapeHtml(
            `${stop.order}. ${stop.title}`
          )}</strong>`
        )
        .addTo(routeLayerRef.current);
    });

    (async () => {
      const routeLatLngs = await fetchRoadRoute(validStops).catch(() => routeFallback(validStops));
      if (cancelled || routeLatLngs.length === 0) return;

      leafletRef.current
        .polyline(routeLatLngs, {
          color: '#93c5fd',
          weight: 10,
          opacity: 0.38,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
          className: 'itinerary-route-glow',
        })
        .addTo(routeLayerRef.current);

      leafletRef.current
        .polyline(routeLatLngs, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.96,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '14 14',
          interactive: false,
          className: 'itinerary-route-line',
        })
        .addTo(routeLayerRef.current);

      if (mapInstanceRef.current && routeLatLngs.length > 1) {
        mapInstanceRef.current.fitBounds(routeLatLngs, {
          padding: [48, 48],
          maxZoom: 14,
          animate: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeStops, ready]);

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

      if (focusId && String(marker.id) === focusId) {
        focusMarker = leafletMarker;
      }
    });

    if (focusMarker) {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.setView(focusMarker.getLatLng(), 14, { animate: false });
      focusMarker.openPopup();
      return;
    }

    if (routeStops.length > 1) return;

    try {
      if (
        mapInstanceRef.current &&
        center &&
        Number.isFinite(center.lat) &&
        Number.isFinite(center.lng)
      ) {
        mapInstanceRef.current.setView([center.lat, center.lng], 12, { animate: false });
      }
    } catch {
      // Ignore view errors while the map is still settling.
    }
  }, [markers, center, focusId, routeStops.length, ready]);

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
      <style jsx global>{`
        .magelang-boundary-line {
          stroke-dasharray: 12 12;
          animation: magelang-boundary-flow 1.35s linear infinite;
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.35));
        }

        .itinerary-route-line {
          stroke-dasharray: 14 14;
          animation: magelang-route-flow 0.9s linear infinite;
          filter: drop-shadow(0 0 5px rgba(37, 99, 235, 0.55));
        }

        .itinerary-route-glow {
          filter: drop-shadow(0 0 8px rgba(147, 197, 253, 0.5));
        }

        .magelang-boundary-tooltip {
          border: 0;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.9);
          color: white;
          font-weight: 700;
        }

        @keyframes magelang-boundary-flow {
          to {
            stroke-dashoffset: -24;
          }
        }

        @keyframes magelang-route-flow {
          to {
            stroke-dashoffset: -28;
          }
        }
      `}</style>
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
