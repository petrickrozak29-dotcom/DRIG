export const tourismData = [
  {
    id: 1,
    mapId: 'wisata-borobudur',
    name: 'Candi Borobudur',
    description: 'Situs warisan dunia dengan panorama matahari terbit yang ikonik.',
    category: 'Heritage',
    latitude: -7.6079,
    longitude: 110.2038,
    openingHours: '06:00 - 17:00',
    ticketPrice: 'Rp 50.000',
    rating: 4.9,
    image: '/images/borobudur.jpg'
  },
  {
    id: 2,
    mapId: 'wisata-punthuk-setumbu',
    name: 'Punthuk Setumbu',
    description: 'Bukit sunrise yang populer untuk melihat panorama Borobudur.',
    category: 'Panorama Alam',
    latitude: -7.6594,
    longitude: 110.2106,
    openingHours: '04:00 - 18:00',
    ticketPrice: 'Rp 40.000',
    rating: 4.7,
    image: '/images/punthuk-setumbu.jpg'
  }
];

export const culinaryData = [
  {
    id: 1,
    mapId: 'kuliner-getuk-trio',
    name: 'Getuk Trio',
    description: 'Getuk tradisional Magelang dengan lapisan gula kelapa.',
    priceRange: 'Rp 10.000 - Rp 20.000',
    rating: 4.8,
    latitude: -7.4725,
    longitude: 110.2170,
    category: 'Traditional Food',
    image: '/images/getuk-trio.jpg'
  },
  {
    id: 2,
    mapId: 'kuliner-kupat-tahu',
    name: 'Kupat Tahu Magelang',
    description: 'Kupat tahu khas Magelang dengan bumbu kacang gurih.',
    priceRange: 'Rp 15.000 - Rp 25.000',
    rating: 4.6,
    latitude: -7.4812,
    longitude: 110.2229,
    category: 'Traditional Food',
    image: '/images/kupat-tahu.jpg'
  },
  {
    id: 3,
    mapId: 'kuliner-kopi-klotok',
    name: 'Kopi Klotok Magelang',
    description: 'Coffee shop tradisional dengan kopi khas Magelang yang diseduh di atas tungku klotok.',
    priceRange: 'Rp 15.000 - Rp 35.000',
    rating: 4.7,
    latitude: -7.4750,
    longitude: 110.2200,
    category: 'Coffee Shop',
    image: '/images/kopi-klotok.jpg'
  },
  {
    id: 4,
    name: 'Ngopi Santai Café',
    description: 'Coffee shop modern dengan nuansa cozy dan menu kopi specialty.',
    priceRange: 'Rp 25.000 - Rp 50.000',
    rating: 4.8,
    latitude: -7.4700,
    longitude: 110.2150,
    category: 'Coffee Shop',
    image: '/images/ngopi-santai.jpg'
  },
  {
    id: 5,
    name: 'Café Borobudur View',
    description: 'Coffee shop dengan pemandangan Borobudur, menyajikan kopi lokal dan internasional.',
    priceRange: 'Rp 30.000 - Rp 60.000',
    rating: 4.9,
    latitude: -7.6050,
    longitude: 110.2100,
    category: 'Coffee Shop',
    image: '/images/cafe-borobudur.jpg'
  },
  {
    id: 6,
    name: 'Warung Kopi Pak Dhe',
    description: 'Warung kopi sederhana dengan rasa autentik dan harga terjangkau.',
    priceRange: 'Rp 5.000 - Rp 15.000',
    rating: 4.5,
    latitude: -7.4800,
    longitude: 110.2250,
    category: 'Coffee Shop',
    image: '/images/kopi-pakdhe.jpg'
  }
];

export const cultureData = [
  {
    id: 1,
    title: 'Sejarah Magelang',
    content: 'Magelang berkembang sejak era Majapahit dan menjadi pusat budaya Jawa tengah.',
    category: 'Sejarah'
  },
  {
    id: 2,
    title: 'Festival Seni',
    content: 'Pertunjukan tari tradisional, gamelan, dan kerajinan lokal di pusat kota.',
    category: 'Budaya'
  }
];

export const eventData = [
  {
    id: 1,
    mapId: 'event-bestieval-2026',
    title: 'BESTIEVAL Magelang 2026',
    date: '2026-06-13',
    time: '14:00 - 23:00',
    location: 'Lap. AIM Artos Magelang',
    description: 'Konser musik lintas genre di area Artos Magelang dengan konsep festival hiburan anak muda.',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80',
    link: 'https://artatix.co.id/event/bestievalmagelang_2026',
    latitude: -7.4912,
    longitude: 110.2265,
    category: 'Konser Musik',
    status: 'approved',
    scope: 'city'
  },
  {
    id: 2,
    mapId: 'event-borobudur-marathon-2026',
    title: 'Borobudur Marathon 2026',
    date: '2026-11-01',
    location: 'Taman Wisata Candi Borobudur',
    description: 'Event lari besar di sekitar Borobudur dengan rute yang memadukan olahraga, wisata, dan budaya.',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1000&q=80',
    link: 'https://visitmagelang.id/event-magelang/',
    latitude: -7.6079,
    longitude: 110.2038,
    category: 'Agenda Lokal',
    status: 'approved',
    scope: 'around'
  }
];

export const articlesData = [
  {
    id: 1,
    title: 'Digital Heritage Magelang',
    content: 'Portal ini menampilkan sejarah, budaya, dan perkembangan smart city di Magelang.',
    category: 'Heritage'
  },
  {
    id: 2,
    title: 'Smart Tourism Guide',
    content: 'Rekomendasi perjalanan satu hari menggunakan AI Travel Assistant.',
    category: 'Tourism'
  }
];

export const usersData = [
  {
    id: 1,
    name: 'Guest User',
    email: 'guest@example.com',
    latitude: -7.6079,
    longitude: 110.2038,
    savedAt: new Date().toISOString()
  }
];

interface AIRequest {
  timeAvailable: number;
  latitude?: number;
  longitude?: number;
}

const toKilometers = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const createRoute = (timeAvailable: number, baseLat: number, baseLng: number) => {
  const sortedTourism = tourismData
    .map((item) => ({ ...item, distance: toKilometers(baseLat, baseLng, item.latitude, item.longitude) }))
    .sort((a, b) => a.distance - b.distance);

  const sortedCulinary = culinaryData
    .map((item) => ({ ...item, distance: toKilometers(baseLat, baseLng, item.latitude, item.longitude) }))
    .sort((a, b) => a.distance - b.distance);

  const nearestTour = sortedTourism.slice(0, 3);
  const nearestCulinary = sortedCulinary.slice(0, 2);

  const itinerary = [] as Array<{ time: string; activity: string }>;
  const baseNote = `Berdasarkan lokasi Anda di sekitar (${baseLat.toFixed(4)}, ${baseLng.toFixed(4)}), perjalanan disusun agar tidak terlalu jauh dan tetap masuk akal.`;

  if (timeAvailable <= 4) {
    itinerary.push(
      { time: '08:00', activity: `Mulai dari lokasi Anda dan menuju ${nearestTour[0].name}` },
      { time: '10:30', activity: `Eksplorasi singkat ${nearestTour[0].name}` },
      { time: '12:00', activity: `Makan siang di ${nearestCulinary[0].name}` },
      { time: '13:30', activity: 'Kembali beristirahat atau menikmati suasana lokal' }
    );
    return { itinerary, note: baseNote };
  }

  if (timeAvailable <= 8) {
    itinerary.push(
      { time: '07:30', activity: `Berangkat dari lokasi Anda ke ${nearestTour[0].name}` },
      { time: '09:30', activity: `Menikmati ${nearestTour[0].name}` },
      { time: '12:00', activity: `Makan siang di ${nearestCulinary[0].name}` },
      { time: '14:00', activity: `Kunjungi ${nearestTour[1].name}` },
      { time: '16:30', activity: 'Kembali ke pusat kota atau tempat bermalam' }
    );
    return { itinerary, note: baseNote };
  }

  if (timeAvailable <= 12) {
    itinerary.push(
      { time: '06:30', activity: `Dari lokasi Anda ke ${nearestTour[0].name}` },
      { time: '09:00', activity: `Eksplorasi lengkap ${nearestTour[0].name}` },
      { time: '12:00', activity: `Makan siang di ${nearestCulinary[0].name}` },
      { time: '14:00', activity: `Lanjut ke ${nearestTour[1].name}` },
      { time: '16:30', activity: `Istirahat sore di panggung lokal atau café` },
      { time: '18:30', activity: `Makan malam di ${nearestCulinary[1].name}` }
    );
    return { itinerary, note: baseNote };
  }

  itinerary.push(
    { time: '06:00', activity: `Sunrise di ${nearestTour[0].name}` },
    { time: '08:30', activity: `Sarapan pagi di ${nearestCulinary[0].name}` },
    { time: '10:30', activity: `Kunjungi ${nearestTour[1].name}` },
    { time: '13:00', activity: `Makan siang khas Magelang di ${nearestCulinary[1].name}` },
    { time: '15:30', activity: `Wisata santai di taman lokal atau destinasi dekat Anda` },
    { time: '18:00', activity: 'Makan malam dan bersiap kembali ke penginapan' }
  );

  return { itinerary, note: baseNote };
};

export const aiAssistant = ({ timeAvailable, latitude, longitude }: AIRequest) => {
  const baseLat = latitude ?? -7.6079;
  const baseLng = longitude ?? 110.2038;
  return createRoute(timeAvailable, baseLat, baseLng);
};
