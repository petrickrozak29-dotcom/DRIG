'use client';

import { type ReactNode, useEffect, useState } from 'react';
import {
  CalendarDays,
  ChefHat,
  ImagePlus,
  Lock,
  MapPin,
  Save,
  Ticket,
  UserCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import { getApiBaseUrl } from '../../lib/api';
import { formatDate, fetchUserSubmissions } from '../../lib/magelang-data';

type SubmissionStatus = 'approved' | 'pending' | 'rejected';

interface ProfileSubmissionItem {
  id: string;
  title: string;
  description: string;
  featureType: string;
  status: SubmissionStatus;
  typeLabel?: string;
  location?: string | null;
  image?: string | null;
  priceRange?: string | null;
  date?: string | null;
  submittedById?: string | null;
  submittedBy?: { id?: string; name?: string; email?: string } | null;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, updateProfile, changePassword, token } = useAuth();
  const [profileStatus, setProfileStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [submissions, setSubmissions] = useState<ProfileSubmissionItem[]>([]);
  const [eventFilter, setEventFilter] = useState<SubmissionStatus>('pending');
  const [culinaryFilter, setCulinaryFilter] = useState<SubmissionStatus>('pending');
  const [tourismFilter, setTourismFilter] = useState<SubmissionStatus>('pending');
  const [dataVersion, setDataVersion] = useState(0);
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    avatar: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const refresh = () => setDataVersion((version) => version + 1);
    window.addEventListener('magelangverse-submissions-updated', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('magelangverse-submissions-updated', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadUserSubmissions() {
      if (!user) {
        if (mounted) setSubmissions([]);
        return;
      }

      try {
        const data = await fetchUserSubmissions(user.id);
        if (!mounted) return;
        const normalized = Array.isArray(data)
          ? (data.filter((item: any) => {
              const submittedById = item?.submittedById;
              const submittedByEmail = item?.submittedBy?.email;
              return submittedById === user.id || submittedByEmail === user.email;
            }) as ProfileSubmissionItem[])
          : [];

        setSubmissions(normalized);
      } catch (err) {
        if (mounted) setSubmissions([]);
      }
    }

    loadUserSubmissions();

    return () => {
      mounted = false;
    };
  }, [dataVersion, user]);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileStatus('');

    try {
      await updateProfile(profileForm);
      setProfileStatus('Profil berhasil diperbarui.');
    } catch (error: any) {
      setProfileStatus(error.message || 'Gagal memperbarui profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordStatus('');

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok.');
      }

      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStatus('Password berhasil diperbarui.');
    } catch (error: any) {
      setPasswordStatus(error.message || 'Gagal memperbarui password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If authenticated, try uploading to backend uploads endpoint
    (async () => {
      try {
        if (token) {
          const fd = new FormData();
          fd.append('avatar', file);

          const res = await fetch(`${getApiBaseUrl()}/api/uploads/avatar`, {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: fd,
          });

          if (res.ok) {
            const body = await res.json();
            setProfileForm((current) => ({ ...current, avatar: body.url }));
            setProfileStatus('');
            return;
          }
        }

        // Fallback to base64 when not authenticated or upload failed
        const reader = new FileReader();
        reader.onload = () => {
          setProfileForm((current) => ({ ...current, avatar: String(reader.result || '') }));
        };
        reader.readAsDataURL(file);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          setProfileForm((current) => ({ ...current, avatar: String(reader.result || '') }));
        };
        reader.readAsDataURL(file);
      }
    })();
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Memuat profil...</p>
      </main>
    );
  }

  const userEvents = submissions.filter((item) => String(item.featureType).toUpperCase() === 'EVENT');
  const userTourism = submissions.filter(
    (item) => String(item.featureType).toUpperCase() === 'WISATA'
  );
  const userCulinary = submissions.filter(
    (item) => String(item.featureType).toUpperCase() === 'KULINER'
  );
  const filteredEvents = userEvents.filter((item) => item.status === eventFilter);
  const filteredTourism = userTourism.filter((item) => item.status === tourismFilter);
  const filteredCulinary = userCulinary.filter((item) => item.status === culinaryFilter);
  const eventCounts = {
    pending: userEvents.filter((item) => item.status === 'pending').length,
    approved: userEvents.filter((item) => item.status === 'approved').length,
    rejected: userEvents.filter((item) => item.status === 'rejected').length,
  };
  const tourismCounts = {
    pending: userTourism.filter((item) => item.status === 'pending').length,
    approved: userTourism.filter((item) => item.status === 'approved').length,
    rejected: userTourism.filter((item) => item.status === 'rejected').length,
  };
  const culinaryCounts = {
    pending: userCulinary.filter((item) => item.status === 'pending').length,
    approved: userCulinary.filter((item) => item.status === 'approved').length,
    rejected: userCulinary.filter((item) => item.status === 'rejected').length,
  };

  return (
    <GradientBg>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-8">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            <UserCircle className="h-4 w-4" />
            Profil User
          </p>
          <h1 className="mt-3 text-4xl font-bold">Kelola akun</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Ubah profil publik dan password akun yang dipakai untuk Community Event serta Smart Map.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-6"
          >
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <UserCircle className="h-6 w-6 text-cyan-300" />
              Edit Profil
            </h2>
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                {profileForm.avatar ? (
                  <img
                    src={profileForm.avatar}
                    alt={profileForm.name || 'Avatar'}
                    className="h-20 w-20 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-500">
                    <UserCircle className="h-10 w-10" />
                  </div>
                )}
                <label className="block flex-1 text-sm font-semibold text-slate-200">
                  Upload Foto Profil
                  <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
                    <ImagePlus className="h-5 w-5 text-cyan-300" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="w-full text-sm"
                    />
                  </span>
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-200">
                Nama
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Bio
                <textarea
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  rows={4}
                  placeholder="Contoh: Komunitas kreatif Magelang"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Avatar URL
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, avatar: event.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="https://..."
                />
              </label>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
              {profileStatus && <p className="text-sm text-cyan-200">{profileStatus}</p>}
            </div>
          </form>

          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-6"
          >
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <Lock className="h-6 w-6 text-rose-300" />
              Ubah Password
            </h2>
            <div className="mt-6 space-y-5">
              <label className="block text-sm font-semibold text-slate-200">
                Password Lama
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                  }
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-rose-400"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Password Baru
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                  }
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-rose-400"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Konfirmasi Password Baru
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                  }
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-rose-400"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-rose-300 disabled:opacity-60"
              >
                <Lock className="h-5 w-5" />
                {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
              </button>
              {passwordStatus && <p className="text-sm text-rose-200">{passwordStatus}</p>}
            </div>
          </form>
        </section>

        <SubmissionSection
          title="Event Saya"
          icon={<CalendarDays className="h-6 w-6 text-cyan-300" />}
          accent="cyan"
          items={filteredEvents}
          counts={eventCounts}
          activeFilter={eventFilter}
          onFilterChange={setEventFilter}
          emptyMessage="Belum ada event dengan status ini."
        />

        <SubmissionSection
          title="Wisata Saya"
          icon={<MapPin className="h-6 w-6 text-emerald-300" />}
          accent="emerald"
          items={filteredTourism}
          counts={tourismCounts}
          activeFilter={tourismFilter}
          onFilterChange={setTourismFilter}
          emptyMessage="Belum ada wisata dengan status ini."
        />

        <SubmissionSection
          title="Kuliner Saya"
          icon={<ChefHat className="h-6 w-6 text-amber-300" />}
          accent="amber"
          items={filteredCulinary}
          counts={culinaryCounts}
          activeFilter={culinaryFilter}
          onFilterChange={setCulinaryFilter}
          emptyMessage="Belum ada kuliner dengan status ini."
        />
      </main>
      <Footer />
    </GradientBg>
  );
}

function SubmissionSection({
  title,
  icon,
  accent,
  items,
  counts,
  activeFilter,
  onFilterChange,
  emptyMessage,
}: {
  title: string;
  icon: ReactNode;
  accent: 'cyan' | 'emerald' | 'amber';
  items: ProfileSubmissionItem[];
  counts: Record<SubmissionStatus, number>;
  activeFilter: SubmissionStatus;
  onFilterChange: (value: SubmissionStatus) => void;
  emptyMessage: string;
}) {
  const accentClass =
    accent === 'amber'
      ? {
          active: 'bg-amber-400 text-slate-950',
          idle: 'border border-slate-700 bg-slate-950 text-slate-300 hover:border-amber-300',
        }
      : accent === 'emerald'
        ? {
            active: 'bg-emerald-400 text-slate-950',
            idle:
              'border border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-300',
          }
        : {
            active: 'bg-cyan-400 text-slate-950',
            idle: 'border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-300',
          };

  return (
    <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900/80 p-6">
      <h2 className="flex items-center gap-2 text-2xl font-semibold">
        {icon}
        {title}
      </h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {([
          { value: 'pending', label: `Pending (${counts.pending})` },
          { value: 'approved', label: `Published (${counts.approved})` },
          { value: 'rejected', label: `Rejected (${counts.rejected})` },
        ] as Array<{ value: SubmissionStatus; label: string }>).map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeFilter === item.value ? accentClass.active : accentClass.idle
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80"
          >
            {item.image ? (
              <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
            ) : (
              <div className="flex h-44 items-center justify-center bg-slate-900 text-slate-600">
                <ImagePlus className="h-8 w-8" />
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                  {item.status === 'approved' ? 'Published' : item.status}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-sm text-slate-400">
                {item.date && (
                  <p className="flex gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{formatDate(item.date)}</span>
                  </p>
                )}

                {item.typeLabel && (
                  <div>
                    <span className="inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
                      {item.typeLabel}
                    </span>
                  </div>
                )}

                {item.priceRange && (
                  <p className="flex gap-2">
                    <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item.priceRange}</span>
                  </p>
                )}

                {item.location && (
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                    <span>{item.location}</span>
                  </p>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          </article>
        ))}
      </div>

      {items.length === 0 && (
        <p className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
