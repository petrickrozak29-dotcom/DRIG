export type MapCategory = 'event' | 'wisata' | 'kuliner';
export type EventStatus = 'approved' | 'pending' | 'rejected';
export type EventScope = 'city' | 'around';
export type EventCategory = 'Konser Musik' | 'Seni & Budaya' | 'Pameran & Expo' | 'Agenda Lokal';
export type DeveloperContentType = 'tourism' | 'culinary' | 'culture' | 'history';

export const eventCategories: EventCategory[] = ['Konser Musik', 'Seni & Budaya', 'Pameran & Expo', 'Agenda Lokal'];

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
  image?: string;
  link?: string;
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
  location: string;
  description: string;
  image?: string;
  link?: string;
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
  lng: 110.2177
};

const COMMUNITY_EVENTS_KEY = 'magelangverse.communityEvents.v1';
const COMMUNITY_CULINARY_KEY = 'magelangverse.communityCulinary.v1';
const COMMUNITY_TOURISM_KEY = 'magelangverse.communityTourism.v1';
const DEVELOPER_CONTENT_KEYS: Record<DeveloperContentType, string> = {
  tourism: 'magelangverse.developer.tourism.v1',
  culinary: 'magelangverse.developer.culinary.v1',
  culture: 'magelangverse.developer.culture.v1',
  history: 'magelangverse.developer.history.v1'
};

const photo = {
  borobudur: 'https://commons.wikimedia.org/wiki/Special:FilePath/Borobudur_Temple.jpg',
  kyaiLanggeng: 'https://commons.wikimedia.org/wiki/Special:FilePath/Taman%20Kyai%20Langgeng%20(1).png',
  getuk: 'https://commons.wikimedia.org/wiki/Special:FilePath/Getuk%20Magelang.JPG',
  nature: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
  museum: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1000&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
  coffee: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=80',
  event: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80',
  run: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1000&q=80',
  expo: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80'
};

const locationIndex = [
  { match: ['alun', 'alun-alun'], lat: -7.4797, lng: 110.2177, scope: 'city' as EventScope },
  { match: ['aim artos', 'artos', 'grand artos'], lat: -7.4912, lng: 110.2265, scope: 'city' as EventScope },
  { match: ['borobudur'], lat: -7.6079, lng: 110.2038, scope: 'around' as EventScope },
  { match: ['taruna nusantara'], lat: -7.5013, lng: 110.1835, scope: 'city' as EventScope },
  { match: ['ketep'], lat: -7.4943, lng: 110.3811, scope: 'around' as EventScope },
  { match: ['mesa', 'mesastila'], lat: -7.3505, lng: 110.3743, scope: 'around' as EventScope },
  { match: ['kyai langgeng', 'taman kyai'], lat: -7.4758, lng: 110.2091, scope: 'city' as EventScope },
  { match: ['tidar', 'gunung tidar', 'puncak tidar'], lat: -7.4894, lng: 110.2221, scope: 'city' as EventScope },
  { match: ['punthuk setumbu', 'setumbu'], lat: -7.6057, lng: 110.1808, scope: 'around' as EventScope },
  { match: ['mendut'], lat: -7.6047, lng: 110.2304, scope: 'around' as EventScope },
  { match: ['getuk trio', 'gethuk trio'], lat: -7.4725, lng: 110.217, scope: 'city' as EventScope },
  { match: ['kupat tahu'], lat: -7.4812, lng: 110.2229, scope: 'city' as EventScope },
  { match: ['kwarasan'], lat: -7.4737, lng: 110.2244, scope: 'city' as EventScope }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function resolveLocation(location: string) {
  const normalized = location.toLowerCase();
  const found = locationIndex.find((item) => item.match.some((key) => normalized.includes(key)));

  if (found) {
    return {
      latitude: found.lat,
      longitude: found.lng,
      scope: found.scope
    };
  }

  return {
    latitude: MAGELANG_CENTER.lat,
    longitude: MAGELANG_CENTER.lng,
    scope: 'city' as EventScope
  };
}

export const tourismItems: SmartMapItem[] = [
  {
    id: 'wisata-borobudur',
    title: 'Candi Borobudur',
    category: 'wisata',
    typeLabel: 'Heritage',
    description: 'Kompleks candi Buddha terbesar di dunia, pusat heritage Magelang Raya, dan titik utama wisata budaya internasional.',
    location: 'Kawasan Candi Borobudur, Kabupaten Magelang',
    latitude: -7.6079,
    longitude: 110.2038,
    image: photo.borobudur,
    openingHours: '06.30 - 16.30',
    rating: 4.9,
    link: 'https://www.google.com/maps/search/?api=1&query=Candi+Borobudur',
    detailUrl: '/smart-map?focus=wisata-borobudur',
    tags: ['UNESCO', 'Candi', 'Heritage']
  },
  {
    id: 'wisata-punthuk-setumbu',
    title: 'Punthuk Setumbu',
    category: 'wisata',
    typeLabel: 'Panorama Alam',
    description: 'Bukit sunrise dengan panorama Borobudur, Merapi, dan Merbabu yang populer untuk fotografi pagi.',
    location: 'Karangrejo, Borobudur, Kabupaten Magelang',
    latitude: -7.6057,
    longitude: 110.1808,
    image: photo.nature,
    openingHours: '04.00 - 17.00',
    rating: 4.7,
    link: 'https://www.google.com/maps/search/?api=1&query=Punthuk+Setumbu',
    detailUrl: '/smart-map?focus=wisata-punthuk-setumbu',
    tags: ['Sunrise', 'Panorama', 'Outdoor']
  },
  {
    id: 'wisata-mendut',
    title: 'Candi Mendut',
    category: 'wisata',
    typeLabel: 'Heritage',
    description: 'Candi Buddha bersejarah yang terhubung dengan lanskap ritual Borobudur dan Pawon.',
    location: 'Mendut, Mungkid, Kabupaten Magelang',
    latitude: -7.6047,
    longitude: 110.2304,
    image: photo.museum,
    openingHours: '07.00 - 17.00',
    rating: 4.6,
    link: 'https://www.google.com/maps/search/?api=1&query=Candi+Mendut',
    detailUrl: '/smart-map?focus=wisata-mendut',
    tags: ['Candi', 'Relief', 'Spiritual']
  },
  {
    id: 'wisata-kyai-langgeng',
    title: 'Taman Kyai Langgeng',
    category: 'wisata',
    typeLabel: 'Taman Rekreasi',
    description: 'Taman wisata keluarga di Kota Magelang dengan wahana, area hijau, edukasi tanaman, dan ruang rekreasi warga.',
    location: 'Taman Kyai Langgeng, Kota Magelang',
    latitude: -7.4758,
    longitude: 110.2091,
    image: photo.kyaiLanggeng,
    openingHours: '08.00 - 16.00',
    rating: 4.5,
    link: 'https://www.google.com/maps/search/?api=1&query=Taman+Kyai+Langgeng+Magelang',
    detailUrl: '/smart-map?focus=wisata-kyai-langgeng',
    tags: ['Keluarga', 'Taman', 'Wahana']
  },
  {
    id: 'wisata-gunung-tidar',
    title: 'Gunung Tidar',
    category: 'wisata',
    typeLabel: 'Urban Heritage',
    description: 'Bukit hijau di tengah kota yang dikenal sebagai pakunya Tanah Jawa, cocok untuk jalan santai dan napak tilas.',
    location: 'Gunung Tidar, Kota Magelang',
    latitude: -7.4894,
    longitude: 110.2221,
    image: photo.nature,
    openingHours: '06.00 - 17.00',
    rating: 4.8,
    link: 'https://www.google.com/maps/search/?api=1&query=Gunung+Tidar+Magelang',
    detailUrl: '/smart-map?focus=wisata-gunung-tidar',
    tags: ['Urban Forest', 'Sejarah', 'Jogging']
  },
  {
    id: 'wisata-nepal-van-java',
    title: 'Nepal Van Java',
    category: 'wisata',
    typeLabel: 'Spot Populer',
    description: 'Kampung lereng Sumbing dengan lanskap bertingkat, warna rumah yang fotogenik, dan jalur foto populer.',
    location: 'Dusun Butuh, Kaliangkrik, Kabupaten Magelang',
    latitude: -7.4231,
    longitude: 110.0961,
    image: photo.nature,
    openingHours: '06.00 - 17.00',
    rating: 4.7,
    link: 'https://www.google.com/maps/search/?api=1&query=Nepal+Van+Java+Magelang',
    detailUrl: '/smart-map?focus=wisata-nepal-van-java',
    tags: ['Spot Foto', 'View Gunung', 'Populer']
  },
  {
    id: 'wisata-svargabumi',
    title: 'Svargabumi Borobudur',
    category: 'wisata',
    typeLabel: 'Spot Populer',
    description: 'Spot foto modern di area persawahan Borobudur dengan instalasi estetik dan latar alam terbuka.',
    location: 'Borobudur, Kabupaten Magelang',
    latitude: -7.6041,
    longitude: 110.1978,
    image: photo.nature,
    openingHours: '08.00 - 17.00',
    rating: 4.6,
    link: 'https://www.google.com/maps/search/?api=1&query=Svargabumi+Borobudur',
    detailUrl: '/smart-map?focus=wisata-svargabumi',
    tags: ['Spot Foto', 'Sawah', 'Borobudur']
  },
  {
    id: 'wisata-museum-bpk',
    title: 'Museum BPK RI',
    category: 'wisata',
    typeLabel: 'Museum',
    description: 'Museum sejarah kelembagaan BPK di kompleks Kota Magelang, cocok untuk wisata edukasi dan arsip publik.',
    location: 'Jalan Diponegoro, Kota Magelang',
    latitude: -7.4839,
    longitude: 110.2189,
    image: photo.museum,
    openingHours: '09.00 - 15.00',
    rating: 4.6,
    link: 'https://www.google.com/maps/search/?api=1&query=Museum+BPK+Magelang',
    detailUrl: '/smart-map?focus=wisata-museum-bpk',
    tags: ['Museum', 'Edukasi', 'Kota']
  }
];

export const culinaryItems: SmartMapItem[] = [
  {
    id: 'kuliner-getuk-trio',
    title: 'Getuk Trio',
    category: 'kuliner',
    typeLabel: 'Oleh-oleh',
    description: 'Ikon oleh-oleh Magelang berbahan singkong dengan warna khas, tekstur lembut, dan rasa manis ringan.',
    location: 'Pusat Kota Magelang',
    latitude: -7.4725,
    longitude: 110.217,
    image: photo.getuk,
    rating: 4.8,
    priceRange: 'Rp 10.000 - Rp 25.000',
    link: 'https://www.google.com/maps/search/?api=1&query=Getuk+Trio+Magelang',
    detailUrl: '/smart-map?focus=kuliner-getuk-trio',
    tags: ['Oleh-oleh', 'Tradisional', 'Singkong']
  },
  {
    id: 'kuliner-kupat-tahu',
    title: 'Kupat Tahu Magelang',
    category: 'kuliner',
    typeLabel: 'Makanan Khas',
    description: 'Kupat, tahu goreng, sayur, dan bumbu kacang berkuah yang menjadi menu klasik Kota Magelang.',
    location: 'Pusat kuliner Kota Magelang',
    latitude: -7.4812,
    longitude: 110.2229,
    image: photo.food,
    rating: 4.7,
    priceRange: 'Rp 12.000 - Rp 25.000',
    link: 'https://www.google.com/maps/search/?api=1&query=Kupat+Tahu+Magelang',
    detailUrl: '/smart-map?focus=kuliner-kupat-tahu',
    tags: ['Khas', 'Makan Siang', 'Terjangkau']
  },
  {
    id: 'kuliner-sop-senerek',
    title: 'Sop Senerek',
    category: 'kuliner',
    typeLabel: 'Makanan Khas',
    description: 'Sup kacang merah hangat dengan daging dan sayur, populer sebagai kuliner rumahan khas Magelang.',
    location: 'Kota Magelang',
    latitude: -7.4779,
    longitude: 110.2218,
    image: photo.food,
    rating: 4.6,
    priceRange: 'Rp 18.000 - Rp 35.000',
    link: 'https://www.google.com/maps/search/?api=1&query=Sop+Senerek+Magelang',
    detailUrl: '/smart-map?focus=kuliner-sop-senerek',
    tags: ['Sup', 'Tradisional', 'Hangat']
  },
  {
    id: 'kuliner-kopi-klotok',
    title: 'Kopi Klotok Magelang',
    category: 'kuliner',
    typeLabel: 'Kopi & Kafe',
    description: 'Kopi lokal dengan suasana santai, cocok sebagai jeda setelah wisata kota atau Borobudur.',
    location: 'Kota Magelang',
    latitude: -7.475,
    longitude: 110.22,
    image: photo.coffee,
    rating: 4.7,
    priceRange: 'Rp 15.000 - Rp 35.000',
    link: 'https://www.google.com/maps/search/?api=1&query=Kopi+Klotok+Magelang',
    detailUrl: '/smart-map?focus=kuliner-kopi-klotok',
    tags: ['Kopi', 'Nongkrong', 'Lokal']
  },
  {
    id: 'kuliner-alun-alun',
    title: 'Kuliner Alun-alun Magelang',
    category: 'kuliner',
    typeLabel: 'Pusat Kuliner',
    description: 'Area makan malam dan jajanan kaki lima di sekitar pusat kota, mudah dicapai dari ikon utama Magelang.',
    location: 'Alun-alun Magelang',
    latitude: -7.4797,
    longitude: 110.2177,
    image: photo.food,
    rating: 4.5,
    priceRange: 'Rp 10.000 - Rp 40.000',
    link: 'https://www.google.com/maps/search/?api=1&query=Kuliner+Alun-alun+Magelang',
    detailUrl: '/smart-map?focus=kuliner-alun-alun',
    tags: ['Malam', 'Street Food', 'Kota']
  },
  {
    id: 'kuliner-borobudur-view',
    title: 'Kafe Borobudur View',
    category: 'kuliner',
    typeLabel: 'Kopi & Kafe',
    description: 'Kafe sekitar Borobudur untuk menikmati kopi, makanan ringan, dan panorama desa wisata.',
    location: 'Borobudur, Kabupaten Magelang',
    latitude: -7.605,
    longitude: 110.21,
    image: photo.coffee,
    rating: 4.6,
    priceRange: 'Rp 25.000 - Rp 60.000',
    link: 'https://www.google.com/maps/search/?api=1&query=Cafe+Borobudur+View',
    detailUrl: '/smart-map?focus=kuliner-borobudur-view',
    tags: ['Kafe', 'View', 'Borobudur']
  },
  {
    id: 'kuliner-sentra-umkm',
    title: 'Sentra UMKM Kuliner Magelang',
    category: 'kuliner',
    typeLabel: 'UMKM',
    description: 'Ruang promosi usaha kuliner warga Magelang. Pengajuan UMKM dari user akan tampil di kategori ini setelah disetujui developer.',
    location: 'Kota Magelang',
    latitude: -7.4797,
    longitude: 110.2177,
    image: photo.food,
    rating: 4.5,
    priceRange: 'Bervariasi',
    link: 'https://www.google.com/maps/search/?api=1&query=UMKM+Kuliner+Magelang',
    detailUrl: '/smart-map?focus=kuliner-sentra-umkm',
    tags: ['UMKM', 'Ekonomi Kreatif', 'Promosi Warga']
  }
];

export const systemEvents: CommunityEvent[] = [
  {
    id: 'event-bestieval-2026',
    title: 'BESTIEVAL Magelang 2026',
    category: 'event',
    typeLabel: 'Konser Musik',
    date: '2026-06-13',
    time: '14.00 - 23.00',
    location: 'Lap. AIM Artos Magelang',
    description: 'Konser musik lintas genre di area Artos Magelang dengan konsep festival hiburan anak muda.',
    latitude: -7.4912,
    longitude: 110.2265,
    image: photo.event,
    link: 'https://artatix.co.id/event/bestievalmagelang_2026',
    sourceUrl: 'https://artatix.co.id/event/bestievalmagelang_2026',
    detailUrl: '/smart-map?focus=event-bestieval-2026',
    status: 'approved',
    scope: 'city',
    source: 'system',
    createdAt: '2026-06-09T00:00:00.000Z',
    tags: ['Musik', 'Konser', 'Kota Magelang']
  },
  {
    id: 'event-borobudur-playon-2026',
    title: 'Rupiah Borobudur PlayOn 2026',
    category: 'event',
    typeLabel: 'Agenda Lokal',
    date: '2026-07-01',
    location: 'Candi Borobudur, Magelang',
    description: 'Event lari 10K dan 5K di kawasan Borobudur yang menggabungkan olahraga, suasana desa, dan panorama candi.',
    latitude: -7.6079,
    longitude: 110.2038,
    image: photo.run,
    link: 'https://visitmagelang.id/event-magelang/',
    sourceUrl: 'https://visitmagelang.id/event-magelang/',
    detailUrl: '/smart-map?focus=event-borobudur-playon-2026',
    status: 'approved',
    scope: 'around',
    source: 'system',
    createdAt: '2026-06-09T00:00:00.000Z',
    tags: ['Lari', 'Borobudur', 'Sport Tourism']
  },
  {
    id: 'event-bite-2026',
    title: 'Borobudur International Tourism Expo & Forum 2026',
    category: 'event',
    typeLabel: 'Pameran & Expo',
    date: '2026-07-10',
    location: 'Grand Artos Hotel & Convention',
    description: 'Forum dan expo B2B pariwisata, hospitality, travel agent, dan MICE di Magelang.',
    latitude: -7.4912,
    longitude: 110.2265,
    image: photo.expo,
    link: 'https://visitmagelang.id/event-magelang/',
    sourceUrl: 'https://visitmagelang.id/event-magelang/',
    detailUrl: '/smart-map?focus=event-bite-2026',
    status: 'approved',
    scope: 'city',
    source: 'system',
    createdAt: '2026-06-09T00:00:00.000Z',
    tags: ['Expo', 'MICE', 'Pariwisata']
  },
  {
    id: 'event-taruna-run-2026',
    title: 'Sucorwave Taruna Nusantara Run 2026',
    category: 'event',
    typeLabel: 'Agenda Lokal',
    date: '2026-07-12',
    location: 'SMA Taruna Nusantara, Banyurojo',
    description: 'Ajang lari bertema Pace of Generations yang digelar di kawasan SMA Taruna Nusantara Magelang.',
    latitude: -7.5013,
    longitude: 110.1835,
    image: photo.run,
    link: 'https://visitmagelang.id/event-magelang/',
    sourceUrl: 'https://visitmagelang.id/event-magelang/',
    detailUrl: '/smart-map?focus=event-taruna-run-2026',
    status: 'approved',
    scope: 'city',
    source: 'system',
    createdAt: '2026-06-09T00:00:00.000Z',
    tags: ['Lari', 'Komunitas', 'Kota Magelang']
  },
  {
    id: 'event-ketep-summit-2026',
    title: 'Ketep Summit Festival',
    category: 'event',
    typeLabel: 'Seni & Budaya',
    date: '2026-07-16',
    location: 'Ketep Pass, Sawangan',
    description: 'Festival di kawasan Ketep Pass dengan agenda lari lintas alam, seni tradisional, produk lokal, dan edukasi gunung api.',
    latitude: -7.4943,
    longitude: 110.3811,
    image: photo.nature,
    link: 'https://visitmagelang.id/event-magelang/',
    sourceUrl: 'https://visitmagelang.id/event-magelang/',
    detailUrl: '/smart-map?focus=event-ketep-summit-2026',
    status: 'approved',
    scope: 'around',
    source: 'system',
    createdAt: '2026-06-09T00:00:00.000Z',
    tags: ['Festival', 'Alam', 'Merapi']
  },
  {
    id: 'event-borobudur-marathon-2026',
    title: 'Borobudur Marathon 2026',
    category: 'event',
    typeLabel: 'Agenda Lokal',
    date: '2026-11-01',
    location: 'Taman Wisata Candi Borobudur',
    description: 'Event lari besar di sekitar Borobudur dengan rute yang memadukan olahraga, wisata, dan budaya.',
    latitude: -7.6079,
    longitude: 110.2038,
    image: photo.run,
    link: 'https://visitmagelang.id/event-magelang/',
    sourceUrl: 'https://visitmagelang.id/event-magelang/',
    detailUrl: '/smart-map?focus=event-borobudur-marathon-2026',
    status: 'approved',
    scope: 'around',
    source: 'system',
    createdAt: '2026-06-09T00:00:00.000Z',
    tags: ['Marathon', 'Borobudur', 'Sport Tourism']
  }
];

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
    updatedAt: now
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
  const resolved = resolveLocation(item.location || MAGELANG_CENTER.lat.toString());
  const category = type === 'tourism' ? 'wisata' : 'kuliner';
  const title = item.title.trim();

  return {
    id: item.id,
    title,
    category,
    typeLabel: item.typeLabel || (type === 'tourism' ? 'Wisata' : 'Kuliner'),
    description: item.description,
    location: item.location || 'Magelang',
    latitude: Number(item.latitude ?? resolved.latitude),
    longitude: Number(item.longitude ?? resolved.longitude),
    image: item.image || (type === 'tourism' ? photo.nature : photo.food),
    link: item.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`,
    detailUrl: `/smart-map?focus=${item.id}`,
    rating: Number(item.rating || 4.5),
    priceRange: item.priceRange,
    openingHours: item.openingHours,
    tags: item.details?.length ? item.details : [item.typeLabel || (type === 'tourism' ? 'Wisata' : 'Kuliner')],
    source: 'user'
  };
}

export function getManagedTourismItems() {
  const approvedSubmissions = readStoredTourism()
    .filter((item) => item.status === 'approved')
    .map((item) => ({
      ...item,
      detailUrl: `/smart-map?focus=${item.id}`
    }));

  if (hasStoredContent('tourism')) {
    return [
      ...approvedSubmissions,
      ...readStoredContent('tourism').map((item) => toManagedMapItem('tourism', item))
    ];
  }

  return [
    ...approvedSubmissions,
    ...tourismItems
  ];
}

export function getManagedCulinaryItems() {
  const approvedSubmissions = readStoredCulinary()
    .filter((item) => item.status === 'approved')
    .map((item) => ({
      ...item,
      detailUrl: `/smart-map?focus=${item.id}`
    }));

  if (hasStoredContent('culinary')) {
    return [
      ...approvedSubmissions,
      ...readStoredContent('culinary').map((item) => toManagedMapItem('culinary', item))
    ];
  }

  return [
    ...approvedSubmissions,
    ...culinaryItems
  ];
}

export function getCommunityEvents(apiEvents: CommunityEvent[] = []) {
  const merged = new Map<string, CommunityEvent>();

  [...systemEvents, ...apiEvents, ...readStoredEvents()].forEach((event) => {
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
      const resolved = resolveLocation(String(item.location));
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
        latitude: Number(item.latitude ?? resolved.latitude),
        longitude: Number(item.longitude ?? resolved.longitude),
        image: String(item.image || photo.event),
        link: item.link ? String(item.link) : item.sourceUrl ? String(item.sourceUrl) : undefined,
        sourceUrl: item.sourceUrl ? String(item.sourceUrl) : undefined,
        detailUrl: `/smart-map?focus=${id}`,
        status: (item.status || 'approved') as EventStatus,
        scope: (item.scope || resolved.scope) as EventScope,
        source: 'api' as const,
        createdAt: item.createdAt || new Date().toISOString(),
        tags: Array.isArray(item.tags) ? item.tags : ['Event']
      };
    });
}

export function submitCommunityEvent(input: CommunityEventInput) {
  const resolved = resolveLocation(input.location);
  const cleanTitle = input.title.trim();
  const id = `user-${slugify(cleanTitle)}-${Date.now()}`;
  const typeLabel = input.typeLabel || 'Agenda Lokal';

  const newEvent: CommunityEvent = {
    id,
    title: cleanTitle,
    category: 'event',
    typeLabel,
    date: input.date,
    location: input.location.trim(),
    description: input.description.trim(),
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    image: input.image?.trim() || photo.event,
    link: input.link?.trim() || undefined,
    detailUrl: `/smart-map?focus=${id}`,
    status: 'pending',
    scope: resolved.scope,
    source: 'user',
    createdAt: new Date().toISOString(),
    submittedBy: input.submittedBy,
    tags: [typeLabel, 'Menunggu Review']
  };

  writeStoredEvents([newEvent, ...readStoredEvents()]);
  return newEvent;
}

export function submitCommunityTourism(input: CommunityTourismInput) {
  const resolved = resolveLocation(input.location);
  const cleanTitle = input.title.trim();
  const id = `spot-${slugify(cleanTitle)}-${Date.now()}`;

  const newItem: CommunityTourism = {
    id,
    title: cleanTitle,
    category: 'wisata',
    typeLabel: 'Spot Populer',
    location: input.location.trim(),
    description: input.description.trim(),
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    image: input.image?.trim() || photo.nature,
    link: input.link?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanTitle)}`,
    detailUrl: `/smart-map?focus=${id}`,
    status: 'pending',
    scope: resolved.scope,
    source: 'user',
    createdAt: new Date().toISOString(),
    submittedBy: input.submittedBy,
    rating: 4.5,
    tags: ['Spot Populer', 'Menunggu Review']
  };

  writeStoredTourism([newItem, ...readStoredTourism()]);
  return newItem;
}

export function submitCommunityCulinary(input: CommunityCulinaryInput) {
  const resolved = resolveLocation(input.location);
  const cleanTitle = input.title.trim();
  const id = `umkm-${slugify(cleanTitle)}-${Date.now()}`;
  const typeLabel = input.typeLabel?.trim() || 'UMKM';

  const newItem: CommunityCulinary = {
    id,
    title: cleanTitle,
    category: 'kuliner',
    typeLabel,
    location: input.location.trim(),
    description: input.description.trim(),
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    image: input.image?.trim() || photo.food,
    link: input.link?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanTitle)}`,
    detailUrl: `/smart-map?focus=${id}`,
    status: 'pending',
    scope: resolved.scope,
    source: 'user',
    createdAt: new Date().toISOString(),
    submittedBy: input.submittedBy,
    priceRange: input.priceRange?.trim() || 'Bervariasi',
    rating: 4.5,
    tags: [typeLabel, 'Menunggu Review']
  };

  writeStoredCulinary([newItem, ...readStoredCulinary()]);
  return newItem;
}

export function updateCommunityEventStatus(id: string, status: EventStatus) {
  const events = readStoredEvents().map((event) => (
    event.id === id ? { ...event, status } : event
  ));

  writeStoredEvents(events);
}

export function updateCommunityCulinaryStatus(id: string, status: EventStatus) {
  const items = readStoredCulinary().map((item) => (
    item.id === id
      ? {
        ...item,
        status,
        tags: status === 'approved'
          ? [item.typeLabel, 'Published']
          : status === 'pending'
            ? [item.typeLabel, 'Menunggu Review']
            : [item.typeLabel, 'Ditolak']
      }
      : item
  ));

  writeStoredCulinary(items);
}

export function updateCommunityTourismStatus(id: string, status: EventStatus) {
  const items = readStoredTourism().map((item) => (
    item.id === id
      ? {
        ...item,
        status,
        tags: status === 'approved'
          ? [item.typeLabel, 'Published']
          : status === 'pending'
            ? [item.typeLabel, 'Menunggu Review']
            : [item.typeLabel, 'Ditolak']
      }
      : item
  ));

  writeStoredTourism(items);
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
    .map((event) => ({
      ...event,
      detailUrl: `/smart-map?focus=${event.id}`
    }));

  return [
    ...approvedEvents,
    ...getManagedTourismItems(),
    ...getManagedCulinaryItems()
  ];
}

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function withDistances<T extends SmartMapItem>(
  items: T[],
  origin: { lat: number; lng: number }
): Array<T & SmartMapItemWithDistance> {
  return items
    .map((item) => {
      const distance = distanceKm(origin.lat, origin.lng, item.latitude, item.longitude);

      return {
        ...item,
        distance,
        estimatedTravelTime: Math.max(3, Math.ceil((distance / 35) * 60))
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

export function formatDate(date?: string) {
  if (!date) return 'Tanggal menyusul';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
}
