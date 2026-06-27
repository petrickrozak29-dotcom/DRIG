'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Crosshair, Navigation } from 'lucide-react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  locationText: string;
  onLocationChange: (location: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
  readOnly?: boolean;
}

const SERVICE_URL = 'https://nominatim.openstreetmap.org';
const MAGELANG_BOUNDS = {
  minLat: -7.65,
  maxLat: -7.35,
  minLng: 110.15,
  maxLng: 110.40,
};

export default function MapPicker({
  latitude,
  longitude,
  locationText,
  onLocationChange,
  onCoordsChange,
  readOnly = false,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState(locationText || '');
  const [searchResults, setSearchResults] = useState<Array<{ lat: string; lon: string; display_name: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Initialize map
  useEffect(() => {
    if (readOnly || !mapRef.current || mapInstance.current) return;

    let mounted = true;

    async function initMap() {
      if (!mapRef.current || !mounted) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      leafletRef.current = L;

      const defaultCenter: [number, number] = latitude && longitude
        ? [latitude, longitude]
        : [-7.4797, 110.2177];

      mapInstance.current = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 14,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Add click handler
      mapInstance.current.on('click', (e: any) => {
        if (readOnly) return;
        const { lat, lng } = e.latlng;
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
      });
    }

    initMap();

    return () => {
      mounted = false;
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch { /* ignore */ }
        mapInstance.current = null;
      }
    };
  }, [readOnly]);

  // Place/replace marker
  const placeMarker = useCallback((lat: number, lng: number) => {
    if (!leafletRef.current || !mapInstance.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = leafletRef.current.divIcon({
        className: '',
        html: `<span style="display:block;width:24px;height:24px;border-radius:50%;background:#06b6d4;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);"></span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      markerRef.current = leafletRef.current
        .marker([lat, lng], { icon, draggable: !readOnly })
        .addTo(mapInstance.current);

      if (!readOnly) {
        markerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          onCoordsChange(pos.lat, pos.lng);
          reverseGeocode(pos.lat, pos.lng);
        });
      }
    }

    mapInstance.current.setView([lat, lng], 15, { animate: true });
    onCoordsChange(lat, lng);
  }, [readOnly, onCoordsChange]);

  // Reverse geocode to get address from coords
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      setGeocodingStatus('Mendapatkan alamat...');
      const res = await fetch(
        `${SERVICE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`,
        {
          headers: {
            'User-Agent': 'FutureMagelang/1.0',
            'Accept-Language': 'id',
          },
        }
      );

      if (!res.ok) {
        setGeocodingStatus('');
        return;
      }

      const data = await res.json();
      if (data && data.display_name) {
        // Shorten the address
        const parts = data.display_name.split(',');
        const shortAddress = parts.slice(0, 3).join(',').trim();
        onLocationChange(shortAddress);
        setSearchQuery(shortAddress);
        setGeocodingStatus('');
      }
    } catch {
      setGeocodingStatus('');
    }
  }, [onLocationChange]);

  // Search location by text
  const handleSearch = useCallback(async (query?: string) => {
    const q = (query || searchQuery).trim();
    if (!q || q.length < 3) return;

    setIsSearching(true);
    setGeocodingStatus('Mencari lokasi...');

    try {
      const res = await fetch(
        `${SERVICE_URL}/search?format=json&q=${encodeURIComponent(q + ', Magelang, Jawa Tengah')}&limit=5&accept-language=id`,
        {
          headers: {
            'User-Agent': 'FutureMagelang/1.0',
            'Accept-Language': 'id',
          },
        }
      );

      if (!res.ok) {
        setGeocodingStatus('Gagal mencari lokasi');
        setIsSearching(false);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        setShowResults(true);
        setGeocodingStatus(`Ditemukan ${data.length} lokasi`);
      } else {
        setSearchResults([]);
        setGeocodingStatus('Lokasi tidak ditemukan');
      }
    } catch {
      setGeocodingStatus('Gagal menghubungi server');
    }

    setIsSearching(false);
  }, [searchQuery]);

  // Select a search result
  const selectResult = useCallback((result: { lat: string; lon: string; display_name: string }) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    if (markerRef.current && markerRef.current.setLatLng) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      placeMarker(lat, lng);
    }

    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 15, { animate: true });
    }

    onCoordsChange(lat, lng);

    // Derive a short location name from the result
    const parts = result.display_name.split(',');
    const shortName = parts.slice(0, 2).join(',').trim();
    onLocationChange(shortName);
    setSearchQuery(shortName);
    setShowResults(false);
    setGeocodingStatus('');
  }, [onCoordsChange, onLocationChange, placeMarker]);

  // Detect user's current location
  const detectLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeocodingStatus('Geolokasi tidak tersedia');
      return;
    }

    setGeocodingStatus('Mendeteksi lokasi...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
        setGeocodingStatus('Lokasi terdeteksi');
      },
      () => {
        setGeocodingStatus('Gagal mendeteksi lokasi. Periksa izin browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [placeMarker, reverseGeocode]);

  // Update marker if external lat/lng changes
  useEffect(() => {
    if (latitude !== null && longitude !== null && leafletRef.current && mapInstance.current) {
      const icon = leafletRef.current.divIcon({
        className: '',
        html: `<span style="display:block;width:24px;height:24px;border-radius:50%;background:#06b6d4;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);"></span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = leafletRef.current
          .marker([latitude, longitude], { icon, draggable: !readOnly })
          .addTo(mapInstance.current);

        if (!readOnly) {
          markerRef.current.on('dragend', (e: any) => {
            const pos = e.target.getLatLng();
            onCoordsChange(pos.lat, pos.lng);
          });
        }
      }

      mapInstance.current.setView([latitude, longitude], 15, { animate: true });
    }
  }, [latitude, longitude, readOnly, onCoordsChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onLocationChange(e.target.value);
                if (showResults) setShowResults(false);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Cari lokasi di Magelang..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-400"
              disabled={readOnly}
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={isSearching || readOnly}
            className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            Cari
          </button>
          <button
            type="button"
            onClick={detectLocation}
            disabled={readOnly}
            title="Gunakan lokasi saya"
            className="rounded-lg border border-slate-700 px-3 py-3 text-slate-300 hover:border-cyan-400 disabled:opacity-50"
          >
            <Crosshair className="h-5 w-5" />
          </button>
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map((result, idx) => {
              const parts = result.display_name.split(',');
              const title = parts[0];
              const subtitle = parts.slice(1, 4).join(',').trim();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectResult(result)}
                  className="flex w-full items-start gap-3 border-b border-slate-800 px-4 py-3 text-left text-sm hover:bg-slate-800/60 last:border-0"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Coordinate display */}
      <div className="flex gap-3 text-sm">
        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300">
          <Navigation className="h-4 w-4 text-cyan-400" />
          <span>
            {latitude !== null
              ? `${latitude.toFixed(6)}, ${longitude?.toFixed(6)}`
              : 'Belum ada koordinat'}
          </span>
        </div>
        {geocodingStatus && (
          <span className="flex items-center text-xs text-slate-400">{geocodingStatus}</span>
        )}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className={`h-[300px] w-full rounded-lg border border-slate-700 ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
      />
      {!readOnly && (
        <p className="text-xs text-slate-400">
          Klik peta untuk menempatkan marker, atau seret marker untuk menyesuaikan posisi.
        </p>
      )}
    </div>
  );
}
