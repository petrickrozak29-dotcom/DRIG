export type MapCategory = 'event' | 'wisata' | 'kuliner' | 'budaya' | 'sejarah';
export type EventStatus = 'approved' | 'pending' | 'rejected';
export type EventScope = 'city' | 'around';
export type EventCategory = 'Konser Musik' | 'Seni & Budaya' | 'Pameran & Expo' | 'Agenda Lokal';
export type DeveloperContentType = 'tourism' | 'culinary' | 'culture' | 'history';

export const eventCategories: EventCategory[] = [
  'Konser Musik',
  'Seni & Budaya',
  'Pameran & Expo',
  'Agenda Lokal',
];

export interface DeveloperContentItem {
  id: string;
  title: string;
  description: string;
  typeLabel?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  link?: string;
  rating?: number;
  priceRange?: string;
  ticketPrice?: string;
  openingHours?: string;
  category?: string;
  details?: string[];
  year?: string;
  period?: string;
  source?: string;
  sourceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SmartMapItem {
  id: string;
  title: string;
  category: MapCategory;
  typeLabel: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  image: string;
  link?: string;
  detailUrl?: string;
  sourceUrl?: string;
  date?: string;
  time?: string;
  status?: EventStatus;
  scope?: EventScope;
  rating?: number;
  priceRange?: string;
  ticketPrice?: string;
  openingHours?: string;
  tags?: string[];
  source?: 'system' | 'user' | 'api';
}

export interface SmartMapItemWithDistance extends SmartMapItem {
  distance: number;
  estimatedTravelTime: number;
}

export interface CommunityEventInput {
  title: string;
  date: string;
  typeLabel?: EventCategory;
  location: string;
  description: string;
  image?: string;
  link?: string;
  ticketPrice?: string;
  openingHours?: string;
  submittedBy?: string;
}

export interface CommunityEvent extends SmartMapItem {
  category: 'event';
  status: EventStatus;
  submittedBy?: string;
  createdAt: string;
}

export interface CommunityCulinaryInput {
  title: string;
  typeLabel: string;
  location: string;
  description: string;
  priceRange?: string;
  rating?: number;
  image?: string;
  link?: string;
  openingHours?: string;
  submittedBy?: string;
}

export interface CommunityCulinary extends SmartMapItem {
  category: 'kuliner';
  status: EventStatus;
  submittedBy?: string;
  createdAt: string;
}

export interface CommunityTourismInput {
  title: string;
  typeLabel?: string;
  location: string;
  description: string;
  rating?: number;
  image?: string;
  link?: string;
  ticketPrice?: string;
  openingHours?: string;
  submittedBy?: string;
}

export interface CommunityTourism extends SmartMapItem {
  category: 'wisata';
  status: EventStatus;
  submittedBy?: string;
  createdAt: string;
}

export const MAGELANG_CENTER = {
  lat: -7.4797,
  lng: 110.2177,
};

const COMMUNITY_EVENTS_KEY = 'magelangverse.communityEvents.v1';
const COMMUNITY_CULINARY_KEY = 'magelangverse.communityCulinary.v1';
const COMMUNITY_TOURISM_KEY = 'magelangverse.communityTourism.v1';
const DEVELOPER_CONTENT_KEYS: Record<DeveloperContentType, string> = {
  tourism: 'magelangverse.developer.tourism.v1',
  culinary: 'magelangverse.developer.culinary.v1',
  culture: 'magelangverse.developer.culture.v1',
  history: 'magelangverse.developer.history.v1',
};

const photo = {
  borobudur: 'https://commons.wikimedia.org/wiki/Special:FilePath/Borobudur_Temple.jpg',
  kyaiLanggeng:
    'https://commons.wikimedia.org/wiki/Special:FilePath/Taman%20Kyai%20Langgeng%20(1).png',
  getuk: 'https://commons.wikimedia.org/wiki/Special:FilePath/Getuk%20Magelang.JPG',
  nature:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
  museum:
    'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1000&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
  coffee:
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=80',
  event:
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80',
  run: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1000&q=80',
  expo: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
};

const locationIndex = [
  { match: ['alun', 'alun-alun'], lat: -7.4797, lng: 110.2177, scope: 'city' as EventScope },
  {
    match: ['aim artos', 'artos', 'grand artos'],
    lat: -7.4912,
    lng: 110.2265,
    scope: 'city' as EventScope,
  },
  { match: ['borobudur'], lat: -7.6079, lng: 110.2038, scope: 'around' as EventScope },
  { match: ['taruna nusantara'], lat: -7.5013, lng: 110.1835, scope: 'city' as EventScope },
  { match: ['ketep'], lat: -7.4943, lng: 110.3811, scope: 'around' as EventScope },
  { match: ['mesa', 'mesastila'], lat: -7.3505, lng: 110.3743, scope: 'around' as EventScope },
  {
    match: ['kyai langgeng', 'taman kyai'],
    lat: -7.4758,
    lng: 110.2091,
    scope: 'city' as EventScope,
  },
  {
    match: ['tidar', 'gunung tidar', 'puncak tidar'],
    lat: -7.4894,
    lng: 110.2221,
    scope: 'city' as EventScope,
  },
  {
    match: ['punthuk setumbu', 'setumbu'],
    lat: -7.6057,
    lng: 110.1808,
    scope: 'around' as EventScope,
  },
  { match: ['mendut'], lat: -7.6047, lng: 110.2304, scope: 'around' as EventScope },
  { match: ['getuk trio', 'gethuk trio'], lat: -7.4725, lng: 110.217, scope: 'city' as EventScope },
  { match: ['kupat tahu'], lat: -7.4812, lng: 110.2229, scope: 'city' as EventScope },
  { match: ['kwarasan'], lat: -7.4737, lng: 110.2244, scope: 'city' as EventScope },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function normalizeImageUrl(value: unknown, fallback: string) {
  const raw = String(value || '').trim();

  if (!raw || raw.includes('fakepath')) return fallback;
  if (raw.startsWith('/uploads/')) return `${getApiBaseUrl()}${raw}`;
  if (raw.startsWith('uploads/')) return `${getApiBaseUrl()}/${raw}`;
  if (raw.startsWith('data:image/')) return raw;

  return raw;
}

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

/**
 * Extract coordinates from any string value (Google Maps URL, address, etc.).
 */
function extractCoordinates(value?: unknown) {
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
    /(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/,
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

export function resolveLocation(location: string, link?: string): { latitude: number; longitude: number; scope: EventScope } | null {
  const directCoordinates = extractCoordinates(link) || extractCoordinates(location);
  if (directCoordinates) {
    return {
      ...directCoordinates,
      scope: 'city' as EventScope,
    };
  }

  const normalized = location.toLowerCase();
  const found = locationIndex.find((item) => item.match.some((key) => normalized.includes(key)));

  if (found) {
    return {
      latitude: found.lat,
      longitude: found.lng,
      scope: found.scope,
    };
  }

  return null;
}

import { getApiBaseUrl } from './api';

function readStoredEvents(): CommunityEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(COMMUNITY_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStoredCulinary(): CommunityCulinary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(COMMUNITY_CULINARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStoredTourism(): CommunityTourism[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(COMMUNITY_TOURISM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredEvents(events: CommunityEvent[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMMUNITY_EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event('magelangverse-events-updated'));
}

function writeStoredCulinary(items: CommunityCulinary[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMMUNITY_CULINARY_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('magelangverse-culinary-updated'));
  window.dispatchEvent(new Event('magelangverse-content-updated'));
}

function writeStoredTourism(items: CommunityTourism[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMMUNITY_TOURISM_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('magelangverse-tourism-updated'));
  window.dispatchEvent(new Event('magelangverse-content-updated'));
}

function readStoredContent(type: DeveloperContentType): DeveloperContentItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEVELOPER_CONTENT_KEYS[type]);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasStoredContent(type: DeveloperContentType) {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEVELOPER_CONTENT_KEYS[type]) !== null;
}

function writeStoredContent(type: DeveloperContentType, records: DeveloperContentItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEVELOPER_CONTENT_KEYS[type], JSON.stringify(records));
  window.dispatchEvent(new Event('magelangverse-content-updated'));
}

export function getStoredCommunityEvents() {
  return readStoredEvents();
}

export function getStoredCommunityCulinary() {
  return readStoredCulinary();
}

export function getStoredCommunityTourism() {
  return readStoredTourism();
}

export function getDeveloperContent(type: DeveloperContentType) {
  return readStoredContent(type);
}

export function hasDeveloperContent(type: DeveloperContentType) {
  return hasStoredContent(type);
}

export function replaceDeveloperContent(type: DeveloperContentType, records: DeveloperContentItem[]) {
  writeStoredContent(type, records);
}

export function upsertDeveloperContent(type: DeveloperContentType, item: DeveloperContentItem) {
  const records = readStoredContent(type);
  const now = new Date().toISOString();
  const normalized = {
    ...item,
    id: item.id || `${type}-${slugify(item.title || item.period || 'konten')}-${Date.now()}`,
    createdAt: item.createdAt || now,
    updatedAt: now,
  };
  const index = records.findIndex((record) => record.id === normalized.id);
  if (index >= 0) {
    records[index] = normalized;
  } else {
    records.unshift(normalized);
  }
  writeStoredContent(type, records);
  return normalized;
}

export function deleteDeveloperContent(type: DeveloperContentType, id: string) {
  writeStoredContent(type, readStoredContent(type).filter((item) => item.id !== id));
}

function toManagedMapItem(type: 'tourism' | 'culinary', item: DeveloperContentItem): SmartMapItem {
  const resolved = resolveLocation(item.location || '', item.link || item.sourceUrl);
  const linkCoords = extractCoordinates(item.link || item.sourceUrl);
  const effectiveLat = linkCoords?.latitude ?? Number(item.latitude ?? resolved?.latitude ?? MAGELANG_CENTER.lat);
  const effectiveLng = linkCoords?.longitude ?? Number(item.longitude ?? resolved?.longitude ?? MAGELANG_CENTER.lng);
  const category = type === 'tourism' ? 'wisata' : 'kuliner';
  const title = item.title.trim();

  return {
    id: item.id,
    title,
    category,
    typeLabel: item.typeLabel || (type === 'tourism' ? 'Wisata' : 'Kuliner'),
    description: item.description,
    location: item.location || 'Magelang',
    latitude: effectiveLat,
    longitude: effectiveLng,
    image: normalizeImageUrl(item.image, type === 'tourism' ? photo.nature : photo.food),
    link: item.link,
    detailUrl: `/smart-map?focus=${item.id}`,
    rating: Number(item.rating || 4.5),
    priceRange: item.priceRange,
    ticketPrice: item.ticketPrice,
    openingHours: item.openingHours,
    tags: item.details?.length
      ? item.details
      : [item.typeLabel || (type === 'tourism' ? 'Wisata' : 'Kuliner')],
    source: 'user',
  };
}

export function getManagedTourismItems() {
  const approvedSubmissions = readStoredTourism()
    .filter((item) => item.status === 'approved')
    .map((item) => ({ ...item, detailUrl: `/smart-map?focus=${item.id}` }));
  if (hasStoredContent('tourism')) {
    return [...approvedSubmissions, ...readStoredContent('tourism').map((item) => toManagedMapItem('tourism', item))];
  }
  return [...approvedSubmissions];
}

export function getManagedCulinaryItems() {
  const approvedSubmissions = readStoredCulinary()
    .filter((item) => item.status === 'approved')
    .map((item) => ({ ...item, detailUrl: `/smart-map?focus=${item.id}` }));
  if (hasStoredContent('culinary')) {
    return [...approvedSubmissions, ...readStoredContent('culinary').map((item) => toManagedMapItem('culinary', item))];
  }
  return [...approvedSubmissions];
}

export function getCommunityEvents(apiEvents: CommunityEvent[] = []) {
  const merged = new Map<string, CommunityEvent>();
  [...apiEvents, ...readStoredEvents()].forEach((event) => {
    merged.set(event.id, event);
  });
  return Array.from(merged.values()).sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });
}

export function isEventPast(date?: string) {
  if (!date) return false;
  const eventDate = new Date(`${date}T23:59:59`);
  if (Number.isNaN(eventDate.getTime())) return false;
  return eventDate.getTime() < Date.now();
}

export function getActiveCommunityEvents(apiEvents: CommunityEvent[] = []) {
  return getCommunityEvents(apiEvents).filter((event) => !isEventPast(event.date));
}

export function normalizeApiEvents(records: any[]): CommunityEvent[] {
  if (!Array.isArray(records)) return [];
  return records
    .filter((item) => item?.title && item?.date && item?.location)
    .map((item) => {
      const resolved = resolveLocation(String(item.location || ''), item.link || item.sourceUrl);
      const linkCoords = extractCoordinates(item.link);
      const r = resolved ?? { latitude: MAGELANG_CENTER.lat, longitude: MAGELANG_CENTER.lng, scope: 'city' as EventScope };
      const effectiveLat = linkCoords?.latitude ?? Number(item.latitude ?? r.latitude);
      const effectiveLng = linkCoords?.longitude ?? Number(item.longitude ?? r.longitude);
      const id = `api-${item.id || slugify(`${item.title}-${item.date}`)}`;
      return {
        id,
        title: String(item.title),
        category: 'event' as const,
        typeLabel: String(item.category || item.typeLabel || 'Event'),
        date: String(item.date).slice(0, 10),
        time: item.time ? String(item.time) : undefined,
        location: String(item.location),
        description: String(item.description || 'Event komunitas Magelang.'),
        latitude: effectiveLat,
        longitude: effectiveLng,
        image: normalizeImageUrl(item.image, photo.event),
        link: item.link ? String(item.link) : item.sourceUrl ? String(item.sourceUrl) : undefined,
        sourceUrl: item.sourceUrl ? String(item.sourceUrl) : undefined,
        ticketPrice: item.ticketPrice ? String(item.ticketPrice) : undefined,
        openingHours: item.openingHours ? String(item.openingHours) : undefined,
        detailUrl: `/smart-map?focus=${id}`,
        status: (item.status || 'approved') as EventStatus,
        scope: r.scope,
        source: 'api' as const,
        createdAt: item.createdAt || new Date().toISOString(),
        tags: Array.isArray(item.tags) ? item.tags : ['Event'],
      };
    });
}

export function submitCommunityEvent(input: CommunityEventInput) {
  const resolved = resolveLocation(input.location, input.link) ?? { latitude: MAGELANG_CENTER.lat, longitude: MAGELANG_CENTER.lng, scope: 'city' as EventScope };
  const cleanTitle = input.title.trim();
  const id = `user-${slugify(cleanTitle)}-${Date.now()}`;
  const typeLabel = input.typeLabel || 'Agenda Lokal';
  const newEvent: CommunityEvent = {
    id, title: cleanTitle, category: 'event', typeLabel, date: input.date,
    location: input.location.trim(), description: input.description.trim(),
    latitude: resolved.latitude, longitude: resolved.longitude,
    image: input.image?.trim() || photo.event, link: input.link?.trim() || undefined,
    ticketPrice: input.ticketPrice?.trim() || undefined, openingHours: input.openingHours?.trim() || undefined,
    detailUrl: `/smart-map?focus=${id}`, status: 'pending', scope: resolved.scope,
    source: 'user', createdAt: new Date().toISOString(), submittedBy: input.submittedBy,
    tags: [typeLabel, 'Menunggu Review'],
  };
  writeStoredEvents([newEvent, ...readStoredEvents()]);
  (async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      await fetch(`${getApiBaseUrl()}/api/submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: newEvent.title, date: newEvent.date, location: newEvent.location, description: newEvent.description, image: newEvent.image, link: newEvent.link, ticketPrice: newEvent.ticketPrice, openingHours: newEvent.openingHours, featureType: 'EVENT', categoryName: newEvent.typeLabel }),
      });
    } catch {}
  })();
  return newEvent;
}

export function submitCommunityTourism(input: CommunityTourismInput) {
  const resolved = resolveLocation(input.location, input.link) ?? { latitude: MAGELANG_CENTER.lat, longitude: MAGELANG_CENTER.lng, scope: 'city' as EventScope };
  const cleanTitle = input.title.trim();
  const id = `spot-${slugify(cleanTitle)}-${Date.now()}`;
  const typeLabel = input.typeLabel?.trim() || 'Wisata';
  const newItem: CommunityTourism = {
    id, title: cleanTitle, category: 'wisata', typeLabel, location: input.location.trim(),
    description: input.description.trim(), latitude: resolved.latitude, longitude: resolved.longitude,
    image: input.image?.trim() || photo.nature, link: input.link?.trim() || undefined,
    ticketPrice: input.ticketPrice?.trim() || undefined, openingHours: input.openingHours?.trim() || undefined,
    detailUrl: `/smart-map?focus=${id}`, status: 'pending', scope: resolved.scope,
    source: 'user', createdAt: new Date().toISOString(), submittedBy: input.submittedBy,
    rating: input.rating || 4.5, tags: [typeLabel, 'Menunggu Review'],
  };
  writeStoredTourism([newItem, ...readStoredTourism()]);
  (async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      await fetch(`${getApiBaseUrl()}/api/submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: newItem.title, location: newItem.location, description: newItem.description, image: newItem.image, link: newItem.link, ticketPrice: newItem.ticketPrice, openingHours: newItem.openingHours, rating: newItem.rating, featureType: 'WISATA', categoryName: typeLabel }),
      });
    } catch {}
  })();
  return newItem;
}

export function submitCommunityCulinary(input: CommunityCulinaryInput) {
  const resolved = resolveLocation(input.location, input.link) ?? { latitude: MAGELANG_CENTER.lat, longitude: MAGELANG_CENTER.lng, scope: 'city' as EventScope };
  const cleanTitle = input.title.trim();
  const id = `umkm-${slugify(cleanTitle)}-${Date.now()}`;
  const typeLabel = input.typeLabel?.trim() || 'UMKM';
  const newItem: CommunityCulinary = {
    id, title: cleanTitle, category: 'kuliner', typeLabel, location: input.location.trim(),
    description: input.description.trim(), latitude: resolved.latitude, longitude: resolved.longitude,
    image: input.image?.trim() || photo.food, link: input.link?.trim() || undefined,
    openingHours: input.openingHours?.trim() || undefined, detailUrl: `/smart-map?focus=${id}`,
    status: 'pending', scope: resolved.scope, source: 'user', createdAt: new Date().toISOString(),
    submittedBy: input.submittedBy, priceRange: input.priceRange?.trim() || 'Bervariasi',
    rating: input.rating || 4.5, tags: [typeLabel, 'Menunggu Review'],
  };
  writeStoredCulinary([newItem, ...readStoredCulinary()]);
  (async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      await fetch(`${getApiBaseUrl()}/api/submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: newItem.title, location: newItem.location, description: newItem.description, image: newItem.image, link: newItem.link, priceRange: newItem.priceRange, openingHours: newItem.openingHours, rating: newItem.rating, featureType: 'KULINER', categoryName: newItem.typeLabel }),
      });
    } catch {}
  })();
  return newItem;
}

export function updateCommunityEventStatus(id: string, status: EventStatus) {
  writeStoredEvents(readStoredEvents().map((event) => event.id === id ? { ...event, status } : event));
}

export function updateCommunityCulinaryStatus(id: string, status: EventStatus) {
  writeStoredCulinary(readStoredCulinary().map((item) =>
    item.id === id ? { ...item, status, tags: status === 'approved' ? [item.typeLabel, 'Published'] : status === 'pending' ? [item.typeLabel, 'Menunggu Review'] : [item.typeLabel, 'Ditolak'] } : item
  ));
}

export function updateCommunityTourismStatus(id: string, status: EventStatus) {
  writeStoredTourism(readStoredTourism().map((item) =>
    item.id === id ? { ...item, status, tags: status === 'approved' ? [item.typeLabel, 'Published'] : status === 'pending' ? [item.typeLabel, 'Menunggu Review'] : [item.typeLabel, 'Ditolak'] } : item
  ));
}

export function deleteCommunityEvent(id: string) {
  writeStoredEvents(readStoredEvents().filter((event) => event.id !== id));
}

export function deleteCommunityCulinary(id: string) {
  writeStoredCulinary(readStoredCulinary().filter((item) => item.id !== id));
}

export function deleteCommunityTourism(id: string) {
  writeStoredTourism(readStoredTourism().filter((item) => item.id !== id));
}

export function buildSmartMapItems(apiEvents: CommunityEvent[] = []) {
  const approvedEvents = getActiveCommunityEvents(apiEvents)
    .filter((event) => event.status === 'approved')
    .map((event) => ({ ...event, detailUrl: `/smart-map?focus=${event.id}` }));
  return [...approvedEvents, ...getManagedTourismItems(), ...getManagedCulinaryItems()];
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function withDistances<T extends SmartMapItem>(items: T[], origin: { lat: number; lng: number }): Array<T & SmartMapItemWithDistance> {
  return items.map((item) => {
    const distance = distanceKm(origin.lat, origin.lng, item.latitude, item.longitude);
    return { ...item, distance, estimatedTravelTime: Math.max(3, Math.ceil((distance / 35) * 60)) };
  }).sort((a, b) => a.distance - b.distance);
}

export function formatDate(date?: string) {
  if (!date) return 'Tanggal menyusul';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date));
}

function normalizeApiItems(records: any[], featureType?: string): SmartMapItem[] {
  if (!Array.isArray(records)) return [];
  return records.map((item) => {
    const resolved = resolveLocation(String(item.location || item.title || ''), item.link || item.sourceUrl);
    const prefix = featureType === 'KULINER' ? 'kuliner' : featureType === 'WISATA' ? 'wisata' : featureType === 'CULTURE' ? 'budaya' : featureType === 'HISTORY' ? 'sejarah' : 'api';
    const id = `${prefix}-${item.id || slugify(String(item.title || 'item'))}`;
    const fallback = featureType === 'KULINER' ? photo.food : featureType === 'WISATA' ? photo.nature : featureType === 'CULTURE' ? photo.museum : featureType === 'HISTORY' ? photo.museum : photo.event;
    const linkCoords = extractCoordinates(item.link);
    const r = resolved ?? { latitude: MAGELANG_CENTER.lat, longitude: MAGELANG_CENTER.lng, scope: 'city' as EventScope };
    const effectiveLat = linkCoords?.latitude ?? Number(item.latitude ?? r.latitude);
    const effectiveLng = linkCoords?.longitude ?? Number(item.longitude ?? r.longitude);
    const image = normalizeImageUrl(item.image || item.imageUrl, fallback);
    return {
      id,
      title: String(item.title || item.name || ''),
      category: prefix as MapCategory,
      typeLabel: String(item.category || item.typeLabel || item.type || 'Lainnya'),
      description: String(item.description || item.content || ''),
      location: String(item.location || ''),
      latitude: effectiveLat,
      longitude: effectiveLng, image,
      link: item.link ? String(item.link) : item.sourceUrl ? String(item.sourceUrl) : undefined,
      detailUrl: `/smart-map?focus=${id}`,
      date: item.date ? String(item.date).slice(0, 10) : undefined,
      time: item.time ? String(item.time) : undefined,
      status: (item.status || 'approved') as EventStatus,
      scope: r.scope, source: 'api',
      rating: Number(item.rating ?? 4.5), priceRange: item.priceRange,
      ticketPrice: item.ticketPrice, openingHours: item.openingHours,
      tags: Array.isArray(item.tags) ? item.tags : [String(item.category || item.typeLabel || item.type || 'Lainnya')],
    } as SmartMapItem;
  });
}

export async function fetchEvents(includePending = false): Promise<CommunityEvent[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/events?includePending=${includePending}`);
    if (!res.ok) return [];
    const payload = await res.json();
    const records = Array.isArray(payload) ? payload : (payload.events ?? []);
    return normalizeApiEvents(records);
  } catch { return []; }
}

export async function fetchTourismItems(includePending = false): Promise<SmartMapItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/tourism?includePending=${includePending}`);
    if (!res.ok) return [];
    const payload = await res.json();
    const records = Array.isArray(payload) ? payload : (payload.items ?? []);
    return normalizeApiItems(records, 'WISATA');
  } catch { return []; }
}

export async function fetchCulinaryItems(includePending = false): Promise<SmartMapItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/culinary?includePending=${includePending}`);
    if (!res.ok) return [];
    const payload = await res.json();
    const records = Array.isArray(payload) ? payload : (payload.items ?? []);
    return normalizeApiItems(records, 'KULINER');
  } catch { return []; }
}

export async function fetchCultureItems(includePending = false): Promise<SmartMapItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/culture?includePending=${includePending}`);
    if (!res.ok) return [];
    const payload = await res.json();
    const records = Array.isArray(payload) ? payload : (payload.items ?? []);
    return normalizeApiItems(records, 'CULTURE');
  } catch { return []; }
}

export async function fetchHistoryItems(includePending = false): Promise<SmartMapItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/history?includePending=${includePending}`);
    if (!res.ok) return [];
    const payload = await res.json();
    const records = Array.isArray(payload) ? payload : (payload.items ?? []);
    return normalizeApiItems(records, 'HISTORY');
  } catch { return []; }
}

export async function fetchUserSubmissions(userId: string, featureType?: 'EVENT' | 'WISATA' | 'KULINER' | 'CULTURE' | 'HISTORY') {
  try {
    const params = new URLSearchParams();
    if (userId) params.set('submittedById', userId);
    if (featureType) params.set('featureType', featureType);
    const res = await fetch(`${getApiBaseUrl()}/api/submissions?${params.toString()}`);
    if (!res.ok) return [];
    const payload = await res.json();
    return Array.isArray(payload) ? payload : [];
  } catch { return []; }
}

export async function submitCommunityCulinaryAsync(input: CommunityCulinaryInput, token?: string) {
  const body = { title: input.title, location: input.location, description: input.description, image: input.image, link: input.link, priceRange: input.priceRange, openingHours: input.openingHours, rating: input.rating, featureType: 'KULINER', categoryName: input.typeLabel };
  const res = await fetch(`${getApiBaseUrl()}/api/submissions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Gagal mengirim pengajuan');
  return await res.json();
}

export async function submitCommunityTourismAsync(input: CommunityTourismInput, token?: string) {
  const body = { title: input.title, location: input.location, description: input.description, image: input.image, link: input.link, ticketPrice: input.ticketPrice, openingHours: input.openingHours, rating: input.rating, featureType: 'WISATA', categoryName: input.typeLabel || 'Wisata' };
  const res = await fetch(`${getApiBaseUrl()}/api/submissions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Gagal mengirim pengajuan');
  return await res.json();
}

export async function submitCommunityEventAsync(input: CommunityEventInput, token?: string) {
  const body = { title: input.title, date: input.date, location: input.location, description: input.description, image: input.image, link: input.link, ticketPrice: input.ticketPrice, openingHours: input.openingHours, featureType: 'EVENT', categoryName: input.typeLabel };
  const res = await fetch(`${getApiBaseUrl()}/api/submissions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Gagal mengirim pengajuan event');
  return await res.json();
}

export async function buildSmartMapItemsAsync() {
  const [events, tourism, culinary, culture, history] = await Promise.all([
    fetchEvents(false), fetchTourismItems(false), fetchCulinaryItems(false), fetchCultureItems(false), fetchHistoryItems(false),
  ]);
  const approvedEvents = events.filter((e) => e.status === 'approved').map((event) => ({ ...event, detailUrl: `/smart-map?focus=${event.id}` }));
  return [...approvedEvents, ...tourism, ...culinary, ...culture, ...history];
}
