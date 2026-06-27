const MAGELANG_CENTER = {
  latitude: -7.4797,
  longitude: 110.2177,
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
    /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
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

export function resolveCoordinates(input: {
  latitude?: unknown;
  longitude?: unknown;
  location?: unknown;
  link?: unknown;
  title?: unknown;
}) {
  const hasExplicitCoordinates =
    input.latitude !== undefined &&
    input.latitude !== null &&
    input.latitude !== '' &&
    input.longitude !== undefined &&
    input.longitude !== null &&
    input.longitude !== '';
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  if (hasExplicitCoordinates && isValidCoordinate(latitude, longitude)) {
    return { latitude, longitude };
  }

  const fromLocation = extractCoordinates(input.location);
  if (fromLocation) return fromLocation;

  const fromLink = extractCoordinates(input.link);
  if (fromLink) return fromLink;

  const text = `${input.location || ''} ${input.title || ''}`.toLowerCase();
  const found = knownLocations.find((location) =>
    location.match.some((keyword) => text.includes(keyword))
  );

  return found || MAGELANG_CENTER;
}
