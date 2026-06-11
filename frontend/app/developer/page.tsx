"use client";

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Eye, ImagePlus, MapPin, Pencil, Plus, Save, Trash2, Users, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import { useAuth } from '../../contexts/AuthContext';
import { apiJson, getApiBaseUrl } from '../../lib/api';
import {
  culinaryItems,
  deleteDeveloperContent,
  formatDate,
  getCommunityEvents,
  getDeveloperContent,
  getManagedCulinaryItems,
  getManagedTourismItems,
  getStoredCommunityCulinary,
  getStoredCommunityTourism,
  hasDeveloperContent,
  isEventPast,
  normalizeApiEvents,
  replaceDeveloperContent,
  tourismItems,
  updateCommunityCulinaryStatus,
  updateCommunityEventStatus,
  updateCommunityTourismStatus,
  upsertDeveloperContent,
  type CommunityCulinary,
  type CommunityEvent,
  type CommunityTourism,
  type DeveloperContentItem,
  type DeveloperContentType,
  type EventStatus,
  type SmartMapItem
} from '../../lib/magelang-data';

type SectionKey = 'overview' | 'smartMap' | 'smartCity' | DeveloperContentType | 'events' | 'users';

interface DeveloperUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
}

interface OverviewPayload {
  stats: {
    totalUser: number;
    totalEvent: number;
    eventPending: number;
    eventPublished: number;
  };
  users: DeveloperUser[];
}

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: 'overview', label: 'Statistik Umum' },
  { key: 'smartMap', label: 'Kelola Smart Map' },
  { key: 'smartCity', label: 'Kelola Smart Magelang' },
  { key: 'tourism', label: 'Kelola Wisata' },
  { key: 'culinary', label: 'Kelola Kuliner' },
  { key: 'culture', label: 'Kelola Budaya' },
  { key: 'history', label: 'Kelola Sejarah' },
  { key: 'events', label: 'Kelola Event' },
  { key: 'users', label: 'Kelola Pengguna' }
];

const defaultCulture: DeveloperContentItem[] = [
  {
    id: 'culture-mantyasih',
    title: 'Cagar Budaya Mantyasih',
    description: 'Jejak Mantyasih menjadi pintu masuk penting untuk memahami hari jadi Kota Magelang.',
    category: 'Budaya',
    details: ['Lumpang Mantyasih', 'Prasasti lokal', 'Kampung Meteseh'],
    source: 'https://kebudayaan.magelangkota.go.id/'
  },
  {
    id: 'culture-festival',
    title: 'Agenda Seni Kota',
    description: 'Agenda seni, batik, aksara, museum, dan kegiatan edukasi budaya Magelang.',
    category: 'Budaya',
    details: ['Parade seni', 'Harmoni batik', 'Pameran aksara'],
    source: 'https://kebudayaan.magelangkota.go.id/'
  }
];

const defaultHistory: DeveloperContentItem[] = [
  {
    id: 'history-mantyasih',
    title: 'Mantyasih dan Hari Jadi',
    period: 'Mantyasih dan Hari Jadi',
    year: '907 M',
    description: 'Cikal bakal Magelang dikaitkan dengan Desa Perdikan Mantyasih dan tradisi sejarah 11 April 907.',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Borobudur_Temple.jpg',
    source: 'https://magelangkota.go.id/page/profil-kota-magelang-2'
  },
  {
    id: 'history-modern',
    title: 'Heritage, Wisata, dan Kota Modern',
    period: 'Heritage, Wisata, dan Kota Modern',
    year: '2000-sekarang',
    description: 'Identitas Magelang bergerak di antara heritage, pariwisata, UMKM, pendidikan, dan layanan digital.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    source: 'https://magesty.magelangkota.go.id/'
  }
];

const emptyForm: DeveloperContentItem = {
  id: '',
  title: '',
  description: '',
  typeLabel: '',
  location: '',
  latitude: undefined,
  longitude: undefined,
  image: '',
  link: '',
  rating: 4.5,
  priceRange: '',
  openingHours: '',
  category: '',
  details: [],
  year: '',
  period: '',
  source: ''
};

function fromMapItem(item: SmartMapItem): DeveloperContentItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    typeLabel: item.typeLabel,
    location: item.location,
    latitude: item.latitude,
    longitude: item.longitude,
    image: item.image,
    link: item.link,
    rating: item.rating,
    priceRange: item.priceRange,
    openingHours: item.openingHours,
    details: item.tags || []
  };
}

function statusLabel(status: EventStatus) {
  if (status === 'approved') return 'Published';
  if (status === 'pending') return 'Pending';
  return 'Rejected';
}

export default function DeveloperPage() {
  const router = useRouter();
  const { user, token, loading, isAuthenticated } = useAuth();
  const [active, setActive] = useState<SectionKey>('overview');
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [users, setUsers] = useState<DeveloperUser[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [culinarySubmissions, setCulinarySubmissions] = useState<CommunityCulinary[]>([]);
  const [tourismSubmissions, setTourismSubmissions] = useState<CommunityTourism[]>([]);
  const [content, setContent] = useState<Record<DeveloperContentType, DeveloperContentItem[]>>({
    tourism: [],
    culinary: [],
    culture: [],
    history: []
  });
  const [formType, setFormType] = useState<DeveloperContentType>('tourism');
  const [form, setForm] = useState<DeveloperContentItem>(emptyForm);
  const [status, setStatus] = useState('');
  const isDeveloper = user?.role === 'ADMIN';

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isDeveloper)) {
      router.push('/login');
    }
  }, [isAuthenticated, isDeveloper, loading, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hasDeveloperContent('tourism')) {
      replaceDeveloperContent('tourism', tourismItems.map(fromMapItem));
    }

    if (!hasDeveloperContent('culinary')) {
      replaceDeveloperContent('culinary', culinaryItems.map(fromMapItem));
    }

    if (!hasDeveloperContent('culture')) {
      replaceDeveloperContent('culture', defaultCulture);
    }

    if (!hasDeveloperContent('history')) {
      replaceDeveloperContent('history', defaultHistory);
    }
  }, []);

  const refreshContent = () => {
    setContent({
      tourism: getDeveloperContent('tourism'),
      culinary: getDeveloperContent('culinary'),
      culture: getDeveloperContent('culture'),
      history: getDeveloperContent('history')
    });
    setCulinarySubmissions(getStoredCommunityCulinary());
    setTourismSubmissions(getStoredCommunityTourism());
  };

  const refreshEvents = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/events?includePending=true`);
      if (!response.ok) return;
      const payload = await response.json();
      const records = Array.isArray(payload) ? payload : payload.events;
      setEvents(getCommunityEvents(normalizeApiEvents(records)));
    } catch {
      setEvents(getCommunityEvents());
    }
  };

  const refreshOverview = async () => {
    if (!token) return;

    try {
      const payload = await apiJson<OverviewPayload>('/api/developer/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverview(payload);
      setUsers(payload.users);
    } catch (error: any) {
      setStatus(error.message || 'Gagal memuat dashboard developer.');
    }
  };

  useEffect(() => {
    refreshContent();
    refreshEvents();
  }, []);

  useEffect(() => {
    if (token && isDeveloper) {
      refreshOverview();
    }
  }, [token, isDeveloper]);

  useEffect(() => {
    const refresh = () => {
      refreshContent();
      refreshEvents();
    };
    window.addEventListener('magelangverse-content-updated', refresh);
    window.addEventListener('magelangverse-events-updated', refresh);
    window.addEventListener('magelangverse-culinary-updated', refresh);
    window.addEventListener('magelangverse-tourism-updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('magelangverse-content-updated', refresh);
      window.removeEventListener('magelangverse-events-updated', refresh);
      window.removeEventListener('magelangverse-culinary-updated', refresh);
      window.removeEventListener('magelangverse-tourism-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const computedStats = useMemo(() => ({
    totalUser: overview?.stats.totalUser ?? users.length,
    totalEvent: events.length,
    eventPending: events.filter((event) => event.status === 'pending').length,
    eventPublished: events.filter((event) => event.status === 'approved').length,
    culinaryPending: culinarySubmissions.filter((item) => item.status === 'pending').length
  }), [culinarySubmissions, events, overview, users.length]);

  const eventGroups = useMemo(() => ({
    pending: events.filter((event) => event.status === 'pending'),
    approved: events.filter((event) => event.status === 'approved'),
    rejected: events.filter((event) => event.status === 'rejected')
  }), [events]);

  const culinaryGroups = useMemo(() => ({
    pending: culinarySubmissions.filter((item) => item.status === 'pending'),
    approved: culinarySubmissions.filter((item) => item.status === 'approved'),
    rejected: culinarySubmissions.filter((item) => item.status === 'rejected')
  }), [culinarySubmissions]);

  const tourismGroups = useMemo(() => ({
    pending: tourismSubmissions.filter((item) => item.status === 'pending'),
    approved: tourismSubmissions.filter((item) => item.status === 'approved'),
    rejected: tourismSubmissions.filter((item) => item.status === 'rejected')
  }), [tourismSubmissions]);

  const handleEdit = (type: DeveloperContentType, item: DeveloperContentItem) => {
    setFormType(type);
    setForm({ ...emptyForm, ...item });
    setActive(type);
  };

  const resetForm = (type = formType) => {
    setFormType(type);
    setForm(emptyForm);
  };

  const handleContentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = upsertDeveloperContent(formType, {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      details: typeof form.details === 'string'
        ? String(form.details).split(',').map((item) => item.trim()).filter(Boolean)
        : form.details
    });

    setStatus(`${normalized.title} tersimpan di ${sections.find((item) => item.key === formType)?.label}.`);
    resetForm(formType);

    if (token) {
      try {
        await apiJson(`/api/developer/content/${formType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(normalized)
        });
      } catch {
        setStatus(`${normalized.title} tersimpan lokal. Backend developer belum menerima sinkronisasi.`);
      }
    }
  };

  const handleDeleteContent = (type: DeveloperContentType, item: DeveloperContentItem) => {
    deleteDeveloperContent(type, item.id);
    setStatus(`${item.title} dihapus dari ${sections.find((section) => section.key === type)?.label}.`);
  };

  const moderateEvent = async (item: CommunityEvent, nextStatus: EventStatus) => {
    updateCommunityEventStatus(item.id, nextStatus);

    if (item.id.startsWith('api-') && token) {
      try {
        await apiJson(`/api/developer/events/${item.id.replace(/^api-/, '')}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: nextStatus })
        });
      } catch {
        setStatus('Status event tersimpan lokal. Sinkron backend belum berhasil.');
      }
    }

    setEvents((current) => current.map((event) => event.id === item.id ? { ...event, status: nextStatus } : event));
    setStatus(nextStatus === 'approved'
      ? 'Event published dan masuk Event serta Smart Map.'
      : `Event dipindahkan ke ${statusLabel(nextStatus)}.`
    );
  };

  const moderateCulinary = (item: CommunityCulinary, nextStatus: EventStatus) => {
    updateCommunityCulinaryStatus(item.id, nextStatus);
    setCulinarySubmissions((current) => current.map((record) => (
      record.id === item.id ? { ...record, status: nextStatus } : record
    )));
    setStatus(nextStatus === 'approved'
      ? 'Kuliner/UMKM published dan masuk Kuliner serta Smart Map.'
      : `Kuliner/UMKM dipindahkan ke ${statusLabel(nextStatus)}.`
    );
  };

  const moderateTourism = (item: CommunityTourism, nextStatus: EventStatus) => {
    updateCommunityTourismStatus(item.id, nextStatus);
    setTourismSubmissions((current) => current.map((record) => (
      record.id === item.id ? { ...record, status: nextStatus } : record
    )));
    setStatus(nextStatus === 'approved'
      ? 'Spot Populer published dan masuk Wisata serta Smart Map.'
      : `Spot Populer dipindahkan ke ${statusLabel(nextStatus)}.`
    );
  };

  const toggleUser = async (item: DeveloperUser) => {
    if (!token) return;

    try {
      const updated = await apiJson<DeveloperUser>(`/api/developer/users/${item.id}/toggle-active`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers((current) => current.map((userItem) => userItem.id === updated.id ? updated : userItem));
      setStatus(`${updated.name} sekarang ${updated.isActive ? 'aktif' : 'nonaktif'}.`);
    } catch (error: any) {
      setStatus(error.message || 'Gagal mengubah status pengguna.');
    }
  };

  if (loading || !isDeveloper) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Memuat dashboard developer...</p>
      </main>
    );
  }

  return (
    <GradientBg>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 text-white sm:px-6 lg:py-12">
        <section className="mb-6">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            <BarChart3 className="h-4 w-4" />
            Dashboard Developer
          </p>
          <h1 className="mt-3 text-4xl font-bold">Kelola MAGELANGVERSE.ID</h1>
          <p className="mt-3 text-slate-300">{user?.email}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-800 bg-slate-900/85 p-3">
            <div className="grid gap-2">
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => {
                    setActive(section.key);
                    if (['tourism', 'culinary', 'culture', 'history'].includes(section.key)) {
                      resetForm(section.key as DeveloperContentType);
                    }
                  }}
                  className={`rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                    active === section.key
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 space-y-6">
            {status && (
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                {status}
              </div>
            )}

            {active === 'overview' && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Total User" value={computedStats.totalUser} />
                <StatCard label="Total Event" value={computedStats.totalEvent} />
                <StatCard label="Event Pending" value={computedStats.eventPending} />
                <StatCard label="Event Published" value={computedStats.eventPublished} />
                <StatCard label="Kuliner Pending" value={computedStats.culinaryPending} />
              </div>
            )}

            {active === 'smartMap' && (
              <SmartMapManager
                tourismCount={getManagedTourismItems().length}
                culinaryCount={getManagedCulinaryItems().length}
                eventCount={events.filter((event) => event.status === 'approved').length}
              />
            )}

            {active === 'smartCity' && (
              <SmartCityManager />
            )}

            {(['tourism', 'culinary', 'culture', 'history'] as DeveloperContentType[]).includes(active as DeveloperContentType) && (
              <div className="space-y-6">
                <ContentManager
                  type={active as DeveloperContentType}
                  records={content[active as DeveloperContentType]}
                  form={form}
                  setForm={setForm}
                  formType={formType}
                  setFormType={setFormType}
                  onSubmit={handleContentSubmit}
                  onEdit={handleEdit}
                  onDelete={handleDeleteContent}
                  onReset={() => resetForm(active as DeveloperContentType)}
                />

                {active === 'culinary' && (
                  <CulinarySubmissionManager itemGroups={culinaryGroups} onModerate={moderateCulinary} />
                )}

                {active === 'tourism' && (
                  <TourismSubmissionManager itemGroups={tourismGroups} onModerate={moderateTourism} />
                )}
              </div>
            )}

            {active === 'events' && (
              <EventManager eventGroups={eventGroups} onModerate={moderateEvent} />
            )}

            {active === 'users' && (
              <UserManager
                users={users}
                events={events}
                culinarySubmissions={culinarySubmissions}
                tourismSubmissions={tourismSubmissions}
                onToggle={toggleUser}
              />
            )}
          </section>
        </section>
      </main>
      <Footer />
    </GradientBg>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </article>
  );
}

function SmartMapManager({
  tourismCount,
  culinaryCount,
  eventCount
}: {
  tourismCount: number;
  culinaryCount: number;
  eventCount: number;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900/85 p-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <MapPin className="h-6 w-6 text-cyan-300" />
          Kelola Smart Map
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Marker Smart Map berasal dari event published, wisata, kuliner, dan UMKM yang sudah disetujui. Gunakan pintasan berikut untuk mengelola sumber datanya.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Marker Wisata" value={tourismCount} />
          <StatCard label="Marker Kuliner" value={culinaryCount} />
          <StatCard label="Marker Event" value={eventCount} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/smart-map" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">Buka Smart Map</a>
          <a href="/developer" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-200 hover:border-cyan-300">Dashboard</a>
        </div>
      </div>
    </section>
  );
}

function SmartCityManager() {
  const items = [
    {
      title: 'Infrastruktur Teknologi',
      description: 'Inventaris kanal digital, perangkat pendukung layanan, basis data lokasi, integrasi peta, dan dashboard monitoring konten wisata/event/kuliner.',
      details: ['Pusat data konten pariwisata', 'Integrasi geolokasi Smart Map', 'Dashboard moderasi dan statistik']
    },
    {
      title: 'Internet dan Jaringan Komunikasi',
      description: 'Kesiapan akses informasi melalui jaringan seluler, Wi-Fi publik/komunitas, kanal sosial, dan tautan navigasi agar wisatawan mudah menemukan rute.',
      details: ['Akses maps dan rute digital', 'Publikasi event real-time', 'Kanal komunikasi komunitas dan UMKM']
    },
    {
      title: 'Digitalisasi Layanan Publik',
      description: 'Layanan informasi kota dibuat lebih rinci: profil destinasi, event aktif, histori event, UMKM, pengajuan warga, dan update profil pengguna.',
      details: ['Pengajuan event warga', 'Review kuliner/UMKM', 'Profil dan aktivitas user']
    },
    {
      title: 'Pengembangan Smart City',
      description: 'Rincian Smart City difokuskan sebagai Smart Magelang: AI itinerary, Smart Map, integrasi minat, moderasi konten, dan ekosistem promosi lokal.',
      details: ['AI Assistant berbasis minat', 'Marker wisata-event-kuliner', 'Histori dan kurasi developer']
    }
  ];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/85 p-6">
      <h2 className="text-2xl font-semibold">Kelola Smart Magelang</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
        Area ini menjadi kontrol konsep Smart Magelang. Konten publiknya terhubung dengan halaman Smart Magelang, AI Assistant, dan sumber data Smart Map.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.title} className="rounded-lg border border-slate-800 bg-slate-950/75 p-5">
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.details.map((detail) => (
                <span key={detail} className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-100">
                  {detail}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <a href="/smart-magelang" className="mt-6 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
        Buka Smart Magelang
      </a>
    </section>
  );
}

function ContentManager({
  type,
  records,
  form,
  setForm,
  formType,
  setFormType,
  onSubmit,
  onEdit,
  onDelete,
  onReset
}: {
  type: DeveloperContentType;
  records: DeveloperContentItem[];
  form: DeveloperContentItem;
  setForm: (value: DeveloperContentItem) => void;
  formType: DeveloperContentType;
  setFormType: (value: DeveloperContentType) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onEdit: (type: DeveloperContentType, item: DeveloperContentItem) => void;
  onDelete: (type: DeveloperContentType, item: DeveloperContentItem) => void;
  onReset: () => void;
}) {
  const isPlace = type === 'tourism' || type === 'culinary';
  const isHistory = type === 'history';
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, image: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{sections.find((section) => section.key === type)?.label}</h2>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>

        <div className="space-y-3">
          {records.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-semibold text-white">{item.period || item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.location || item.year || item.category || item.typeLabel}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(type, item)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-cyan-200 hover:border-cyan-300"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(type, item)}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 px-3 py-2 text-sm text-rose-200 hover:border-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <form onSubmit={onSubmit} className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
        <h3 className="text-xl font-semibold">{form.id ? 'Edit Konten' : 'Tambah Konten'}</h3>
        <div className="mt-5 space-y-4">
          <input type="hidden" value={formType} onChange={(event) => setFormType(event.target.value as DeveloperContentType)} />
          <Field label={isHistory ? 'Judul Periode' : 'Nama/Judul'} value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
          {isHistory && (
            <>
              <Field label="Tahun/Periode" value={form.year || ''} onChange={(value) => setForm({ ...form, year: value })} />
              <Field label="Nama Periode" value={form.period || ''} onChange={(value) => setForm({ ...form, period: value })} />
            </>
          )}
          <label className="block text-sm font-semibold text-slate-200">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              rows={5}
              required
            />
          </label>
          <Field label="Kategori/Label" value={form.typeLabel || form.category || ''} onChange={(value) => setForm({ ...form, typeLabel: value, category: value })} />
          {isPlace && (
            <>
              <Field label="Lokasi" value={form.location || ''} onChange={(value) => setForm({ ...form, location: value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Latitude" type="number" value={String(form.latitude ?? '')} onChange={(value) => setForm({ ...form, latitude: value ? Number(value) : undefined })} />
                <Field label="Longitude" type="number" value={String(form.longitude ?? '')} onChange={(value) => setForm({ ...form, longitude: value ? Number(value) : undefined })} />
              </div>
              <Field label={type === 'culinary' ? 'Rentang Harga' : 'Jam Buka'} value={type === 'culinary' ? form.priceRange || '' : form.openingHours || ''} onChange={(value) => setForm(type === 'culinary' ? { ...form, priceRange: value } : { ...form, openingHours: value })} />
            </>
          )}
          <Field label="URL Gambar" value={form.image || ''} onChange={(value) => setForm({ ...form, image: value })} />
          <label className="block text-sm font-semibold text-slate-200">
            Upload Gambar
            <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
              <ImagePlus className="h-5 w-5 text-cyan-300" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm" />
            </span>
          </label>
          <Field label="Link/Sumber" value={form.link || form.source || ''} onChange={(value) => setForm({ ...form, link: value, source: value })} />
          <Field label="Detail/Tag, pisahkan koma" value={(form.details || []).join(', ')} onChange={(value) => setForm({ ...form, details: value.split(',').map((item) => item.trim()).filter(Boolean) })} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <Save className="h-5 w-5" />
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

function EventManager({
  eventGroups,
  onModerate
}: {
  eventGroups: Record<EventStatus, CommunityEvent[]>;
  onModerate: (item: CommunityEvent, status: EventStatus) => void;
}) {
  return (
    <section className="space-y-6">
      {(['pending', 'approved', 'rejected'] as EventStatus[]).map((status) => (
        <div key={status} className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
          <h2 className="text-xl font-semibold">{statusLabel(status)} ({eventGroups[status].length})</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {eventGroups[status].map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">{item.typeLabel}</span>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">{formatDate(item.date)}</span>
                  {isEventPast(item.date) && (
                    <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-amber-200">Histori</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-400">{item.location}</p>
                <p className="mt-3 line-clamp-3 text-sm text-slate-300">{item.description}</p>
                <div className="mt-3 grid gap-2 text-xs text-slate-500">
                  <span>Koordinat: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                  <span>Pengirim: {item.submittedBy || item.source || 'Sistem'}</span>
                  {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">Buka link event</a>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onModerate(item, 'approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Publish
                  </button>
                  <button type="button" onClick={() => onModerate(item, 'pending')} className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 px-3 py-2 text-sm font-semibold text-amber-200 hover:border-amber-300">
                    <Eye className="h-4 w-4" />
                    Pending
                  </button>
                  <button type="button" onClick={() => onModerate(item, 'rejected')} className="inline-flex items-center gap-2 rounded-lg bg-rose-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-300">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </article>
            ))}
            {eventGroups[status].length === 0 && <p className="text-sm text-slate-400">Tidak ada event.</p>}
          </div>
        </div>
      ))}
    </section>
  );
}

function CulinarySubmissionManager({
  itemGroups,
  onModerate
}: {
  itemGroups: Record<EventStatus, CommunityCulinary[]>;
  onModerate: (item: CommunityCulinary, status: EventStatus) => void;
}) {
  return (
    <section className="space-y-6">
      {(['pending', 'approved', 'rejected'] as EventStatus[]).map((status) => (
        <div key={status} className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
          <h2 className="text-xl font-semibold">{statusLabel(status)} Kuliner/UMKM ({itemGroups[status].length})</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {itemGroups[status].map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex gap-4">
                  <img src={item.image} alt={item.title} className="h-20 w-24 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.typeLabel} - {item.location}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">{item.description}</p>
                    <div className="mt-2 grid gap-1 text-xs text-slate-500">
                      <span>Harga: {item.priceRange || 'Belum diisi'}</span>
                      <span>Koordinat: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                      <span>Pengirim: {item.submittedBy || 'User'}</span>
                    </div>
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200">Buka link kuliner</a>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onModerate(item, 'approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Publish
                  </button>
                  <button type="button" onClick={() => onModerate(item, 'pending')} className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 px-3 py-2 text-sm font-semibold text-amber-200 hover:border-amber-300">
                    <Eye className="h-4 w-4" />
                    Pending
                  </button>
                  <button type="button" onClick={() => onModerate(item, 'rejected')} className="inline-flex items-center gap-2 rounded-lg bg-rose-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-300">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </article>
            ))}
            {itemGroups[status].length === 0 && <p className="text-sm text-slate-400">Tidak ada kuliner/UMKM.</p>}
          </div>
        </div>
      ))}
    </section>
  );
}

function TourismSubmissionManager({
  itemGroups,
  onModerate
}: {
  itemGroups: Record<EventStatus, CommunityTourism[]>;
  onModerate: (item: CommunityTourism, status: EventStatus) => void;
}) {
  return (
    <section className="space-y-6">
      {(['pending', 'approved', 'rejected'] as EventStatus[]).map((status) => (
        <div key={status} className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
          <h2 className="text-xl font-semibold">{statusLabel(status)} Spot Populer ({itemGroups[status].length})</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {itemGroups[status].map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex gap-4">
                  <img src={item.image} alt={item.title} className="h-20 w-24 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.typeLabel} - {item.location}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">{item.description}</p>
                    <div className="mt-2 grid gap-1 text-xs text-slate-500">
                      <span>Koordinat: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                      <span>Pengirim: {item.submittedBy || 'User'}</span>
                    </div>
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200">Buka link spot</a>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onModerate(item, 'approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Publish
                  </button>
                  <button type="button" onClick={() => onModerate(item, 'pending')} className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 px-3 py-2 text-sm font-semibold text-amber-200 hover:border-amber-300">
                    <Eye className="h-4 w-4" />
                    Pending
                  </button>
                  <button type="button" onClick={() => onModerate(item, 'rejected')} className="inline-flex items-center gap-2 rounded-lg bg-rose-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-300">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </article>
            ))}
            {itemGroups[status].length === 0 && <p className="text-sm text-slate-400">Tidak ada Spot Populer.</p>}
          </div>
        </div>
      ))}
    </section>
  );
}

function UserManager({
  users,
  events,
  culinarySubmissions,
  tourismSubmissions,
  onToggle
}: {
  users: DeveloperUser[];
  events: CommunityEvent[];
  culinarySubmissions: CommunityCulinary[];
  tourismSubmissions: CommunityTourism[];
  onToggle: (item: DeveloperUser) => void;
}) {
  const showDetail = (item: DeveloperUser) => {
    const userEvents = events.filter((event) => event.submittedBy === item.email);
    const userCulinary = culinarySubmissions.filter((record) => record.submittedBy === item.email);
    const userTourism = tourismSubmissions.filter((record) => record.submittedBy === item.email);
    const published = [
      ...userEvents.filter((record) => record.status === 'approved').map((record) => `Event: ${record.title}`),
      ...userCulinary.filter((record) => record.status === 'approved').map((record) => `Kuliner: ${record.title}`),
      ...userTourism.filter((record) => record.status === 'approved').map((record) => `Spot: ${record.title}`)
    ];
    const pendingCount = [
      ...userEvents,
      ...userCulinary,
      ...userTourism
    ].filter((record) => record.status === 'pending').length;

    alert([
      item.name,
      item.email,
      `Role: ${item.role}`,
      `Published: ${published.length}`,
      `Pending: ${pendingCount}`,
      published.length ? `Aktivitas publish:\n- ${published.join('\n- ')}` : 'Belum ada aktivitas publish.'
    ].join('\n'));
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        <Users className="h-6 w-6 text-cyan-300" />
        Statistik Pengguna
      </h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="border-b border-slate-800 py-3 pr-4">Nama</th>
              <th className="border-b border-slate-800 py-3 pr-4">Email</th>
              <th className="border-b border-slate-800 py-3 pr-4">Status</th>
              <th className="border-b border-slate-800 py-3 pr-4">Tanggal Daftar</th>
              <th className="border-b border-slate-800 py-3 pr-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} className="border-b border-slate-800/70">
                <td className="py-4 pr-4 font-semibold text-white">{item.name}</td>
                <td className="py-4 pr-4 text-slate-300">{item.email}</td>
                <td className="py-4 pr-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${item.isActive ? 'border-emerald-400/40 text-emerald-200' : 'border-rose-400/40 text-rose-200'}`}>
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="py-4 pr-4 text-slate-300">{formatDate(item.createdAt)}</td>
                <td className="py-4 pr-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => showDetail(item)} className="rounded-lg border border-slate-700 px-3 py-2 text-cyan-200 hover:border-cyan-300">
                      Detail
                    </button>
                    <button type="button" onClick={() => onToggle(item)} className="rounded-lg border border-rose-500/40 px-3 py-2 text-rose-200 hover:border-rose-300">
                      {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-200">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
        required={required}
        step={type === 'number' ? 'any' : undefined}
      />
    </label>
  );
}
