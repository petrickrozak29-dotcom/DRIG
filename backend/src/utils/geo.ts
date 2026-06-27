const MAGELANG_AREA = {
  minLat: -7.65,
  maxLat: -7.35,
  minLng: 110.15,
  maxLng: 110.40,
};

const knownLocations = [
  { match: ['alun', 'alun-alun'], latitude: -7.4797, longitude: 110.2177 },
  { match: ['aim artos', 'artos', 'grand artos'], latitude: -7.4912, longitude: 110.2265 },
  { match: ['borobudur'], latitude: -7.6079, longitude: 110.2038 },
  { match: ['taruna nusantara'], latitude: -7.5013, longitude: 110.1835 },
  { match: ['ketep'], latitude: -7.4943, longitude: 110.3811 },
  { match: ['mesa', 'mesastila'], latitude: -7.3505, longitude: 110.3743 },
  { match: ['kyai langgeng', 'taman kyai'], latitude: -7.4758, longitude: 110.2091 },
  { match: ['tidar', 'gunung tidar', 'puncak tidar'], latitude: -7.4894, longitude: 110.2221 },
  { match: ['punthuk setumbu', 'setumbu'], latitude: -7.6057, longitude: 110.1808 },
  { match: ['mendut'], latitude: -7.6047, longitude: 110.2304 },
  { match: ['getuk trio', 'gethuk trio'], latitude: -7.4725, longitude: 110.217 },
  { match: ['kupat tahu'], latitude: -7.4812, longitude: 110.2229 },
  { match: ['kwarasan'], latitude: -7.4737, longitude: 110.2244 },
];

function isValidCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function isInMagelangArea(latitude: number, longitude: number) {
  return (
    latitude >= MAGELANG_AREA.minLat &&
    latitude <= MAGELANG_AREA.maxLat &&
    longitude >= MAGELANG_AREA.minLng &&
    longitude <= MAGELANG_AREA.maxLng
  );
}

export function extractCoordinates(value?: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /(?:q|query|ll|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /(-?\d{2,}(?:\.\d+)?),\s*(-?\d{2,3}(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (isValidCoordinate(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=id`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FutureMagelang/1.0',
        'Accept-Language': 'id',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);

    if (!isValidCoordinate(lat, lng)) return null;

    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

export async function resolveCoordinates(input: {
  latitude?: unknown;
  longitude?: unknown;
  location?: unknown;
  link?: unknown;
  title?: unknown;
}): Promise<{ latitude: number; longitude: number } | null> {
  // 1. If explicit valid coordinates are provided, use them
  const hasExplicitLat = input.latitude !== undefined && input.latitude !== null && input.latitude !== '';
  const hasExplicitLng = input.longitude !== undefined && input.longitude !== null && input.longitude !== '';

  if (hasExplicitLat && hasExplicitLng) {
    const lat = Number(input.latitude);
    const lng = Number(input.longitude);
    if (isValidCoordinate(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // 2. Try extracting coordinates from link (Google Maps URLs)
  const fromLink = extractCoordinates(input.link);
  if (fromLink) return fromLink;

  // 3. Try extracting from location text
  const fromLocation = extractCoordinates(input.location);
  if (fromLocation) return fromLocation;

  // 4. Try geocoding the location text with Nominatim
  if (input.location && String(input.location).trim().length > 0) {
    const locationText = `${String(input.location)} Magelang Jawa Tengah`;
    const geocoded = await geocodeAddress(locationText);
    if (geocoded && isInMagelangArea(geocoded.latitude, geocoded.longitude)) {
      return geocoded;
    }
  }

  // 5. Try matching known locations by keyword
  const text = `${input.location || ''} ${input.title || ''}`.toLowerCase();
  for (const known of knownLocations) {
    if (known.match.some((keyword) => text.includes(keyword))) {
      return { latitude: known.latitude, longitude: known.longitude };
    }
  }

  // 6. If we have a location string, try geocoding without area restriction
  if (input.location && String(input.location).trim().length > 0) {
    const geocoded = await geocodeAddress(String(input.location));
    if (geocoded) {
      return geocoded;
    }
  }

  // 7. No coordinates could be resolved
  return null;
}
