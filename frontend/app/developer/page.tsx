'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  ImagePlus,
  KeyRound,
  Link as LinkIcon,
  MapPin,
  Pencil,
  Save,
  Star,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import MapPicker from '../../components/map-picker';
import GradientBg from '../../components/gradient-bg';
import CategoryManager from '../../components/category-manager';
import { useAuth } from '../../contexts/AuthContext';
import { apiJson, getApiBaseUrl } from '../../lib/api';
import {
  deleteDeveloperContent,
  fetchCategories,
  fetchDeveloperContent,
  fetchDeveloperOverview,
  saveDeveloperContent,
  updateDeveloperContentStatus,
  type CategoryRecord,
  type DeveloperType,
  type ManagedContentItem,
  type OverviewPayload,
} from '../../lib/content-api';

type SectionKey = 'overview' | 'categories' | 'tourism' | 'culinary' | 'event' | 'culture' | 'history' | 'users';
type CategoryFeatureKey = 'WISATA' | 'KULINER' | 'EVENT' | 'CULTURE' | 'HISTORY';
type StatusFilter = 'pending' | 'approved' | 'rejected';

const sections: Array<{ key: SectionKey; label: string }> = [
  { key: 'overview', label: 'Statistik Fitur' },
  { key: 'categories', label: 'Kelola Kategori' },
  { key: 'tourism', label: 'Kelola Wisata' },
  { key: 'culinary', label: 'Kelola Kuliner' },
  { key: 'event', label: 'Kelola Event' },
  { key: 'culture', label: 'Kelola Budaya' },
  { key: 'history', label: 'Kelola Sejarah' },
  { key: 'users', label: 'Kelola Pengguna' },
];

const defaultForm = {
  id: '',
  title: '',
  description: '',
  typeLabel: '',
  location: '',
  image: '',
  link: '',
  priceRange: '',
  ticketPrice: '',
  openingHours: '',
  rating: '',
  date: '',
  latitude: '',
  longitude: '',
};

const fallbackImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80';

function sectionLabel(section: SectionKey) {
  return sections.find((item) => item.key === section)?.label || section;
}

function sectionToFeature(section: DeveloperType): CategoryFeatureKey | null {
  if (section === 'tourism') return 'WISATA';
  if (section === 'culinary') return 'KULINER';
  if (section === 'event') return 'EVENT';
  if (section === 'culture') return 'CULTURE';
  if (section === 'history') return 'HISTORY';
  return null;
}

function statusLabel(status: StatusFilter) {
  if (status === 'approved') return 'Published';
  if (status === 'pending') return 'Pending';
  return 'Rejected';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function toFormState(item?: ManagedContentItem | null) {
  if (!item) return defaultForm;
  return {
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    typeLabel: item.typeLabel || item.category || '',
    location: item.location || '',
    image: item.image || '',
    link: item.link || '',
    priceRange: item.priceRange || '',
    ticketPrice: item.ticketPrice || '',
    openingHours: item.openingHours || '',
    rating: item.rating !== undefined && item.rating !== null ? String(item.rating) : '',
    date: item.date ? String(item.date).slice(0, 10) : '',
    latitude: item.latitude !== undefined && item.latitude !== null ? String(item.latitude) : '',
    longitude: item.longitude !== undefined && item.longitude !== null ? String(item.longitude) : '',
  };
}

export default function DeveloperPage() {
  const router = useRouter();
  const { user, token, loading, isAuthenticated } = useAuth();
  const isDeveloper = user?.role === 'ADMIN';

  const [active, setActive] = useState<SectionKey>('overview');
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [users, setUsers] = useState<OverviewPayload['users']>([]);
  const [content, setContent] = useState<Record<DeveloperType, ManagedContentItem[]>>({
    tourism: [],
    culinary: [],
    event: [],
    culture: [],
    history: [],
  });
  const [categoryMap, setCategoryMap] = useState<Record<CategoryFeatureKey, CategoryRecord[]>>({
    WISATA: [],
    KULINER: [],
    EVENT: [],
    CULTURE: [],
    HISTORY: [],
  });
  const [formState, setFormState] = useState(defaultForm);
  const [developerForm, setDeveloperForm] = useState({ name: '', email: '', password: '' });
  const [newDeveloperPassword, setNewDeveloperPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isDeveloper)) {
      router.push('/login');
    }
  }, [isAuthenticated, isDeveloper, loading, router]);

  const refreshOverview = async () => {
    if (!token) return;
    const payload = await fetchDeveloperOverview(token);
    setOverview(payload);
    setUsers(payload.users);
  };

  const refreshCategories = async () => {
    const [wisata, kuliner, event, culture, history] = await Promise.all([
      fetchCategories('WISATA'),
      fetchCategories('KULINER'),
      fetchCategories('EVENT'),
      fetchCategories('CULTURE'),
      fetchCategories('HISTORY'),
    ]);
    setCategoryMap({ WISATA: wisata, KULINER: kuliner, EVENT: event, CULTURE: culture, HISTORY: history });
  };

  const refreshContent = async (section?: DeveloperType) => {
    if (!token) return;

    if (section) {
      const records = await fetchDeveloperContent(section, token);
      setContent((current) => ({ ...current, [section]: records }));
      return;
    }

    const [tourism, culinary, event, culture, history] = await Promise.all([
      fetchDeveloperContent('tourism', token),
      fetchDeveloperContent('culinary', token),
      fetchDeveloperContent('event', token),
      fetchDeveloperContent('culture', token),
      fetchDeveloperContent('history', token),
    ]);

    setContent({ tourism, culinary, event, culture, history });
  };

  useEffect(() => {
    if (!token || !isDeveloper) return;

    (async () => {
      try {
        await Promise.all([refreshOverview(), refreshCategories(), refreshContent()]);
      } catch (error: any) {
        setStatusMessage(error.message || 'Gagal memuat dashboard developer.');
      }
    })();
  }, [token, isDeveloper]);

  useEffect(() => {
    const refresh = () => {
      refreshCategories().catch(() => undefined);
    };

    window.addEventListener('magelangverse-categories-updated', refresh);
    return () => {
      window.removeEventListener('magelangverse-categories-updated', refresh);
    };
  }, []);

  const currentSection = (['tourism', 'culinary', 'event', 'culture', 'history'] as DeveloperType[]).includes(
    active as DeveloperType
  )
    ? (active as DeveloperType)
    : null;

  const activeFeature = currentSection ? sectionToFeature(currentSection) : null;

  const moderationStatCards = useMemo<Array<[string, number]>>(
    () =>
      overview
        ? [
            ['Total Submission', overview.stats.totalSubmission],
            ['Menunggu Review', overview.stats.totalPending],
            ['Published', overview.stats.totalApproved],
            ['Rejected', overview.stats.totalRejected],
            ['Total Kategori', overview.stats.totalKategori],
            ['Total User', overview.stats.totalUser],
          ]
        : [],
    [overview]
  );

  const groupedContent = useMemo(() => {
    if (!currentSection) return { pending: [], approved: [], rejected: [] } as Record<
      StatusFilter,
      ManagedContentItem[]
    >;

    const records = content[currentSection] || [];
    return {
      pending: records.filter((item) => item.status === 'pending'),
      approved: records.filter((item) => item.status === 'approved'),
      rejected: records.filter((item) => item.status === 'rejected'),
    };
  }, [content, currentSection]);

  const resetForm = () => {
    setFormState(defaultForm);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/uploads/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Gagal mengunggah gambar');
      }

      const payload = await response.json();
      setFormState((current) => ({ ...current, image: payload.url || '' }));
      setStatusMessage('Gambar berhasil diunggah.');
    } catch (error: any) {
      setStatusMessage(error.message || 'Gagal mengunggah gambar.');
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !currentSection) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        typeLabel: formState.typeLabel.trim(),
        category: formState.typeLabel.trim(),
        location: formState.location.trim() || undefined,
        image: formState.image.trim() || undefined,
        link: formState.link.trim() || undefined,
        priceRange: formState.priceRange.trim() || undefined,
        ticketPrice: formState.ticketPrice.trim() || undefined,
        openingHours: formState.openingHours.trim() || undefined,
        rating: formState.rating ? Number(formState.rating) : undefined,
        date: formState.date || undefined,
      };

      if (currentSection === 'culture' && !payload.typeLabel) {
        payload.typeLabel = 'Budaya';
        payload.category = 'Budaya';
      }

      if (currentSection === 'history' && !payload.typeLabel) {
        payload.typeLabel = 'Sejarah';
        payload.category = 'Sejarah';
      }

      await saveDeveloperContent(currentSection, payload, token, formState.id || undefined);
      await Promise.all([refreshContent(currentSection), refreshOverview()]);
      resetForm();
      setStatusMessage(`${sectionLabel(active)} berhasil disimpan dan tersinkron ke publik.`);
    } catch (error: any) {
      setStatusMessage(error.message || 'Gagal menyimpan konten.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ManagedContentItem) => {
    setFormState(toFormState(item));
  };

  const handleDelete = async (item: ManagedContentItem) => {
    if (!token || !currentSection) return;
    if (!confirm(`Hapus "${item.title}"?`)) return;

    try {
      await deleteDeveloperContent(currentSection, item.id, token);
      await Promise.all([refreshContent(currentSection), refreshOverview()]);
      if (formState.id === item.id) {
        resetForm();
      }
      setStatusMessage(`${item.title} berhasil dihapus.`);
    } catch (error: any) {
      setStatusMessage(error.message || 'Gagal menghapus konten.');
    }
  };

  const handleModerate = async (item: ManagedContentItem, nextStatus: StatusFilter) => {
    if (!token || !currentSection) return;

    try {
      await updateDeveloperContentStatus(currentSection, item.id, nextStatus.toUpperCase() as Uppercase<StatusFilter>, token);
      await Promise.all([refreshContent(currentSection), refreshOverview()]);
      setStatusMessage(`${item.title} dipindahkan ke ${statusLabel(nextStatus)}.`);
    } catch (error: any) {
      setStatusMessage(error.message || 'Gagal mengubah status konten.');
    }
  };

  const toggleUser = async (id: string) => {
    if (!token) return;

    try {
      const updated = await apiJson<OverviewPayload['users'][number]>(`/api/developer/users/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setStatusMessage(`${updated.name} sekarang ${updated.isActive ? 'aktif' : 'nonaktif'}.`);
    } catch (error: any) {
      setStatusMessage(error.message || 'Gagal mengubah status pengguna.');
    }
  };

  const handleCreateDeveloper = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setStatusMessage('Membuat akun developer...');
    setNewDeveloperPassword('');

    try {
      const payload = await apiJson<{
        user: OverviewPayload['users'][number];
        password: string;
      }>('/api/developer/users/developer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: developerForm.name,
          email: developerForm.email,
          password: developerForm.password || undefined,
        }),
      });

      setUsers((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== payload.user.id);
        return [payload.user, ...withoutDuplicate];
      });
      setDeveloperForm({ name: '', email: '', password: '' });
      setNewDeveloperPassword(payload.password);
      setStatusMessage(`Akun developer ${payload.user.email} siap digunakan.`);
    } catch (error: any) {
      setStatusMessage(error.message || 'Gagal membuat akun developer.');
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
          <h1 className="mt-3 text-4xl font-bold">Kelola Future Magelang</h1>
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
                    if (['tourism', 'culinary', 'event', 'culture', 'history'].includes(section.key)) {
                      resetForm();
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

          <section className="space-y-6">
            {statusMessage && (
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                {statusMessage}
              </div>
            )}

            {active === 'overview' && (
              <div className="space-y-6">
                <section>
                  <h2 className="mb-4 text-2xl font-semibold text-white">
                    Statistik Fitur
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {(overview?.featureDetails || []).map((item) => (
                      <FeatureStatCard key={item.key} item={item} />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 text-2xl font-semibold text-white">Ringkasan Moderasi</h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {moderationStatCards.map(([label, value]) => (
                      <StatCard key={label} label={label} value={Number(value)} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {active === 'categories' && <CategoryManager token={token} />}

            {currentSection && (
              <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <ContentFormCard
                  section={currentSection}
                  formState={formState}
                  setFormState={setFormState}
                  categories={activeFeature ? categoryMap[activeFeature] : []}
                  onSubmit={handleSave}
                  onImageUpload={handleImageUpload}
                  onReset={resetForm}
                  saving={saving}
                />

                <div className="space-y-6">
                  {(['pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
                    <div
                      key={status}
                      className="rounded-lg border border-slate-800 bg-slate-900/85 p-5"
                    >
                      <h2 className="text-xl font-semibold">
                        {statusLabel(status)} ({groupedContent[status].length})
                      </h2>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {groupedContent[status].map((item) => (
                          <ContentCard
                            key={item.id}
                            item={item}
                            section={currentSection}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onModerate={handleModerate}
                          />
                        ))}
                        {groupedContent[status].length === 0 && (
                          <p className="text-sm text-slate-400">Belum ada data.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === 'users' && (
              <section className="space-y-6">
                <div className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
                  <h2 className="flex items-center gap-2 text-2xl font-semibold">
                    <UserPlus className="h-6 w-6 text-cyan-300" />
                    Tambah Developer
                  </h2>
                  <form onSubmit={handleCreateDeveloper} className="mt-5 grid gap-4 md:grid-cols-3">
                    <Field
                      label="Nama"
                      value={developerForm.name}
                      onChange={(value) =>
                        setDeveloperForm((current) => ({ ...current, name: value }))
                      }
                      required
                    />
                    <Field
                      label="Email"
                      type="email"
                      value={developerForm.email}
                      onChange={(value) =>
                        setDeveloperForm((current) => ({ ...current, email: value }))
                      }
                      required
                    />
                    <Field
                      label="Password Awal (Opsional)"
                      value={developerForm.password}
                      onChange={(value) =>
                        setDeveloperForm((current) => ({ ...current, password: value }))
                      }
                      placeholder="Kosongkan untuk dibuat otomatis"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 md:col-span-3"
                    >
                      <KeyRound className="h-5 w-5" />
                      Buat / Beri Akses Developer
                    </button>
                  </form>
                  {newDeveloperPassword && (
                    <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                      Password awal: <span className="font-semibold">{newDeveloperPassword}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
                  <h2 className="flex items-center gap-2 text-2xl font-semibold">
                    <Users className="h-6 w-6 text-cyan-300" />
                    Kelola Pengguna
                  </h2>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="border-b border-slate-800 py-3 pr-4">Nama</th>
                        <th className="border-b border-slate-800 py-3 pr-4">Email</th>
                        <th className="border-b border-slate-800 py-3 pr-4">Role</th>
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
                          <td className="py-4 pr-4 text-slate-300">
                            {item.role === 'ADMIN' ? 'Developer' : 'User'}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                item.isActive
                                  ? 'border-emerald-400/40 text-emerald-200'
                                  : 'border-rose-400/40 text-rose-200'
                              }`}
                            >
                              {item.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-slate-300">{formatDate(item.createdAt)}</td>
                          <td className="py-4 pr-4">
                            <button
                              type="button"
                              onClick={() => toggleUser(item.id)}
                              disabled={item.role === 'ADMIN'}
                              className="rounded-lg border border-rose-500/40 px-3 py-2 text-rose-200 hover:border-rose-300"
                            >
                              {item.role === 'ADMIN'
                                ? 'Developer'
                                : item.isActive
                                  ? 'Nonaktifkan'
                                  : 'Aktifkan'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </section>
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
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </article>
  );
}

function FeatureStatCard({
  item,
}: {
  item: {
    label: string;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    categories: number;
  };
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/85 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            {item.label}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{item.total}</p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
          {item.categories} kategori
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <div className="rounded-lg bg-amber-500/15 px-3 py-2 text-amber-200">
          Pending {item.pending}
        </div>
        <div className="rounded-lg bg-emerald-500/15 px-3 py-2 text-emerald-200">
          Published {item.approved}
        </div>
        <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-rose-200">
          Rejected {item.rejected}
        </div>
      </div>
    </article>
  );
}

function ContentFormCard({
  section,
  formState,
  setFormState,
  categories,
  onSubmit,
  onImageUpload,
  onReset,
  saving,
}: {
  section: DeveloperType;
  formState: typeof defaultForm;
  setFormState: React.Dispatch<React.SetStateAction<typeof defaultForm>>;
  categories: CategoryRecord[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onReset: () => void;
  saving: boolean;
}) {
  const isPlace =
    section === 'tourism' ||
    section === 'culinary' ||
    section === 'event' ||
    section === 'culture' ||
    section === 'history';
  const isEvent = section === 'event';
  const isCulinary = section === 'culinary';
  const hasRating = section === 'tourism' || section === 'culinary' || section === 'event';

  const pickerLat = formState.latitude ? Number(formState.latitude) : null;
  const pickerLng = formState.longitude ? Number(formState.longitude) : null;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-slate-800 bg-slate-900/85 p-6 xl:sticky xl:top-6"
    >
      <h2 className="text-2xl font-semibold">
        {formState.id ? `Edit ${sectionLabel(section)}` : `Tambah ${sectionLabel(section)}`}
      </h2>

      <div className="mt-6 space-y-4">
        <Field
          label="Judul"
          value={formState.title}
          onChange={(value) => setFormState((current) => ({ ...current, title: value }))}
          required
        />

        <label className="block text-sm font-semibold text-slate-200">
          Deskripsi
          <textarea
            value={formState.description}
            onChange={(event) =>
              setFormState((current) => ({ ...current, description: event.target.value }))
            }
            rows={5}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            required
          />
        </label>

        {categories.length > 0 ? (
          <label className="block text-sm font-semibold text-slate-200">
            Kategori
            <select
              value={formState.typeLabel}
              onChange={(event) =>
                setFormState((current) => ({ ...current, typeLabel: event.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              required
            >
              <option value="">Pilih kategori</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Field
            label="Label"
            value={formState.typeLabel}
            onChange={(value) => setFormState((current) => ({ ...current, typeLabel: value }))}
            placeholder={section === 'culture' ? 'Budaya' : section === 'history' ? 'Sejarah' : ''}
          />
        )}

        {isPlace && (
          <>
            <Field
              label="Lokasi"
              value={formState.location}
              onChange={(value) => setFormState((current) => ({ ...current, location: value }))}
              placeholder="Contoh: Alun-alun Magelang"
            />
          </>
        )}

        {/* Map Picker for developer content */}
        {isPlace && (
          <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-200">
              <MapPin className="h-3 w-3" />
              Pilih Lokasi di Peta
            </h4>
            <MapPicker
              latitude={pickerLat}
              longitude={pickerLng}
              locationText={formState.location}
              onLocationChange={(loc) => setFormState((s) => ({ ...s, location: loc }))}
              onCoordsChange={(lat, lng) => {
                setFormState((s) => ({ ...s, latitude: String(lat), longitude: String(lng) }));
              }}
            />
          </div>
        )}

        {isEvent && (
          <Field
            label="Tanggal Event"
            type="date"
            value={formState.date}
            onChange={(value) => setFormState((current) => ({ ...current, date: value }))}
          />
        )}

        <Field
          label={isEvent ? 'Jam Buka / Open Gate' : 'Jam Buka - Tutup'}
          value={formState.openingHours}
          onChange={(value) => setFormState((current) => ({ ...current, openingHours: value }))}
          placeholder={isEvent ? 'Contoh: Open gate 18.00 WIB' : 'Contoh: 08.00 - 17.00 WIB'}
        />

        {isCulinary ? (
          <Field
            label="Rentang Harga"
            value={formState.priceRange}
            onChange={(value) => setFormState((current) => ({ ...current, priceRange: value }))}
            placeholder="Contoh: Rp 15.000 - Rp 50.000"
          />
        ) : (
          <Field
            label="Harga / Tiket Masuk"
            value={formState.ticketPrice}
            onChange={(value) => setFormState((current) => ({ ...current, ticketPrice: value }))}
            placeholder="Contoh: Rp 25.000 atau Gratis"
          />
        )}

        {hasRating && (
          <Field
            label="Rating"
            type="number"
            value={formState.rating}
            onChange={(value) => setFormState((current) => ({ ...current, rating: value }))}
            placeholder="Contoh: 4.8"
            min="1"
            max="5"
            step="0.1"
          />
        )}

        <label className="block text-sm font-semibold text-slate-200">
          Upload Gambar
          <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
            <ImagePlus className="h-5 w-5 text-cyan-300" />
            <input type="file" accept="image/*" onChange={onImageUpload} className="w-full text-sm" />
          </span>
        </label>

        {formState.image && (
          <img
            src={formState.image}
            alt="Preview"
            className="h-40 w-full rounded-lg border border-slate-800 object-cover"
          />
        )}

        <Field
          label="Link/Sumber (Opsional)"
          value={formState.link}
          onChange={(value) => setFormState((current) => ({ ...current, link: value }))}
          placeholder="https://..."
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:border-slate-500"
          >
            Reset
          </button>
        </div>
      </div>
    </form>
  );
}

function ContentCard({
  item,
  section,
  onEdit,
  onDelete,
  onModerate,
}: {
  item: ManagedContentItem;
  section: DeveloperType;
  onEdit: (item: ManagedContentItem) => void;
  onDelete: (item: ManagedContentItem) => void;
  onModerate: (item: ManagedContentItem, status: StatusFilter) => Promise<void>;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80">
      <img
        src={item.image || fallbackImage}
        alt={item.title}
        onError={(event) => {
          event.currentTarget.src = fallbackImage;
        }}
        className="h-44 w-full object-cover"
      />
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              {item.typeLabel || sectionLabel(section)}
            </span>
            <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.status === 'approved'
                ? 'bg-emerald-500/15 text-emerald-200'
                : item.status === 'pending'
                  ? 'bg-amber-500/15 text-amber-200'
                  : 'bg-rose-500/15 text-rose-200'
            }`}
          >
            {statusLabel(item.status as StatusFilter)}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-300">{item.description}</p>

        <div className="mt-4 grid gap-2 text-xs text-slate-400">
          {item.location && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-300" />
              {item.location}
            </span>
          )}
          {item.date && (
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-rose-300" />
              {formatDate(item.date)}
            </span>
          )}
          {item.openingHours && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-300" />
              {item.openingHours}
            </span>
          )}
          {item.priceRange && <span>Rentang harga: {item.priceRange}</span>}
          {item.ticketPrice && <span>Harga/tiket: {item.ticketPrice}</span>}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-200 hover:text-cyan-100"
            >
              <LinkIcon className="h-4 w-4" />
              Sumber
            </a>
          )}
          {item.rating !== undefined && item.rating !== null && (
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              Rating: {Number(item.rating).toFixed(1)}
            </span>
          )}
          {item.submittedBy && <span>Pengirim: {item.submittedBy}</span>}
          {item.publishedAt && <span>Publish: {formatDate(item.publishedAt)}</span>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-300"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onModerate(item, 'approved')}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4" />
            Publish
          </button>
          <button
            type="button"
            onClick={() => onModerate(item, 'pending')}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 px-3 py-2 text-sm font-semibold text-amber-200 hover:border-amber-300"
          >
            <Eye className="h-4 w-4" />
            Pending
          </button>
          <button
            type="button"
            onClick={() => onModerate(item, 'rejected')}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-300"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-200 hover:border-rose-300"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
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
        placeholder={placeholder}
        min={min}
        max={max}
        step={step || (type === 'number' ? 'any' : undefined)}
      />
    </label>
  );
}
