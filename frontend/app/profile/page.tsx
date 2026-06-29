'use client';

import { type ReactNode, useEffect, useState } from 'react';
import {
  CalendarDays,
  ChefHat,
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  MapPin,
  Pencil,
  Save,
  Star,
  Ticket,
  UserCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import ImagePositionEditor from '../../components/image-position-editor';
import { getApiBaseUrl } from '../../lib/api';
import { getImageObjectPosition, getImageSrc, withImagePosition } from '../../lib/image-position';
import { formatCoordinatePair, isSourceUrl, parseCoordinatePair } from '../../lib/location-source';
import { formatDate, fetchUserSubmissions } from '../../lib/magelang-data';

type SubmissionStatus = 'approved' | 'pending' | 'rejected';

const fallbackSubmissionImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80';

interface ProfileSubmissionItem {
  id: string;
  title: string;
  description: string;
  featureType: string;
  status: SubmissionStatus;
  typeLabel?: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image?: string | null;
  link?: string | null;
  priceRange?: string | null;
  ticketPrice?: string | null;
  openingHours?: string | null;
  rating?: number | null;
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
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [submissions, setSubmissions] = useState<ProfileSubmissionItem[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<ProfileSubmissionItem | null>(null);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [submissionForm, setSubmissionForm] = useState({
    title: '',
    description: '',
    categoryName: '',
    location: '',
    image: '',
    link: '',
    priceRange: '',
    ticketPrice: '',
    openingHours: '',
    rating: '',
    date: '',
  });
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
            setProfileForm((current) => ({
              ...current,
              avatar: body.url ? withImagePosition(body.url, { x: 50, y: 50 }) : '',
            }));
            setProfileStatus('');
            return;
          }
        }

        // Fallback to base64 when not authenticated or upload failed
        const reader = new FileReader();
        reader.onload = () => {
          setProfileForm((current) => ({
            ...current,
            avatar: withImagePosition(String(reader.result || ''), { x: 50, y: 50 }),
          }));
        };
        reader.readAsDataURL(file);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          setProfileForm((current) => ({
            ...current,
            avatar: withImagePosition(String(reader.result || ''), { x: 50, y: 50 }),
          }));
        };
        reader.readAsDataURL(file);
      }
    })();
  };

  const startEditSubmission = (item: ProfileSubmissionItem) => {
    setEditingSubmission(item);
    setSubmissionStatus('');
    setSubmissionForm({
      title: item.title || '',
      description: item.description || '',
      categoryName: item.typeLabel || '',
      location: formatCoordinatePair(item.latitude, item.longitude) || item.location || '',
      image: item.image || '',
      link: item.link || '',
      priceRange: item.priceRange || '',
      ticketPrice: item.ticketPrice || '',
      openingHours: item.openingHours || '',
      rating: item.rating !== undefined && item.rating !== null ? String(item.rating) : '',
      date: item.date ? String(item.date).slice(0, 10) : '',
    });
  };

  const handleSubmissionImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    (async () => {
      try {
        if (token) {
          const fd = new FormData();
          fd.append('image', file);

          const res = await fetch(`${getApiBaseUrl()}/api/uploads/image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });

          if (res.ok) {
            const body = await res.json();
            setSubmissionForm((current) => ({
              ...current,
              image: body.url ? withImagePosition(body.url, { x: 50, y: 50 }) : '',
            }));
            return;
          }
        }

        const reader = new FileReader();
        reader.onload = () => {
          setSubmissionForm((current) => ({
            ...current,
            image: withImagePosition(String(reader.result || ''), { x: 50, y: 50 }),
          }));
        };
        reader.readAsDataURL(file);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setSubmissionForm((current) => ({
            ...current,
            image: withImagePosition(String(reader.result || ''), { x: 50, y: 50 }),
          }));
        };
        reader.readAsDataURL(file);
      }
    })();
  };

  const handleSubmissionEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSubmission || !token) return;

    setSavingSubmission(true);
    setSubmissionStatus('');

    try {
      const coordinates = parseCoordinatePair(submissionForm.location);

      if (!coordinates) {
        throw new Error('Titik lokasi wajib diisi dengan format latitude, longitude. Contoh: -7.607501577648155, 110.20378352884043');
      }

      if (!isSourceUrl(submissionForm.link)) {
        throw new Error('Link sumber wajib diisi dengan URL yang valid. Contoh: https://...');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/submissions/${editingSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...submissionForm,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          featureType: editingSubmission.featureType,
          rating: submissionForm.rating ? Number(submissionForm.rating) : undefined,
          date: submissionForm.date || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Gagal mengedit submission.');
      }

      setSubmissionStatus('Submission berhasil diedit dan masuk antrean review pengelola.');
      setEditingSubmission(null);
      setDataVersion((version) => version + 1);
      window.dispatchEvent(new Event('magelangverse-submissions-updated'));
    } catch (error: any) {
      setSubmissionStatus(error.message || 'Gagal mengedit submission.');
    } finally {
      setSavingSubmission(false);
    }
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
                    src={getImageSrc(profileForm.avatar)}
                    alt={profileForm.name || 'Avatar'}
                    style={{ objectPosition: getImageObjectPosition(profileForm.avatar) }}
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

              {profileForm.avatar && (
                <ImagePositionEditor
                  value={profileForm.avatar}
                  onChange={(value) => setProfileForm({ ...profileForm, avatar: value })}
                  alt={profileForm.name || 'Preview foto profil'}
                  previewClassName="h-48 w-full"
                />
              )}

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
                <span className="mt-2 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-rose-400">
                  <input
                    type={showPassword.currentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                    }
                    autoComplete="current-password"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => ({
                        ...current,
                        currentPassword: !current.currentPassword,
                      }))
                    }
                    className="flex w-12 items-center justify-center border-l border-slate-700 text-slate-300 hover:bg-slate-800"
                    aria-label="Lihat password lama"
                  >
                    {showPassword.currentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Password Baru
                <span className="mt-2 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-rose-400">
                  <input
                    type={showPassword.newPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                    }
                    autoComplete="new-password"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => ({
                        ...current,
                        newPassword: !current.newPassword,
                      }))
                    }
                    className="flex w-12 items-center justify-center border-l border-slate-700 text-slate-300 hover:bg-slate-800"
                    aria-label="Lihat password baru"
                  >
                    {showPassword.newPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Konfirmasi Password Baru
                <span className="mt-2 flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-rose-400">
                  <input
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                    }
                    autoComplete="new-password"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => ({
                        ...current,
                        confirmPassword: !current.confirmPassword,
                      }))
                    }
                    className="flex w-12 items-center justify-center border-l border-slate-700 text-slate-300 hover:bg-slate-800"
                    aria-label="Lihat konfirmasi password"
                  >
                    {showPassword.confirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
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

        {submissionStatus && (
          <p className="mt-8 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm font-semibold text-cyan-100">
            {submissionStatus}
          </p>
        )}

        {editingSubmission && (
          <form
            onSubmit={handleSubmissionEditSubmit}
            className="mt-8 rounded-lg border border-slate-800 bg-slate-900/80 p-6"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Edit Submission</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Perubahan akan masuk lagi ke antrean review pengelola.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubmission(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
              >
                Batal
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <ProfileField
                label="Judul"
                value={submissionForm.title}
                onChange={(value) =>
                  setSubmissionForm((current) => ({ ...current, title: value }))
                }
                required
              />
              <ProfileField
                label="Kategori"
                value={submissionForm.categoryName}
                onChange={(value) =>
                  setSubmissionForm((current) => ({ ...current, categoryName: value }))
                }
              />
              <ProfileField
                label="Titik Lokasi"
                value={submissionForm.location}
                onChange={(value) =>
                  setSubmissionForm((current) => ({ ...current, location: value }))
                }
                placeholder="-7.607501577648155, 110.20378352884043"
                required
              />
              <ProfileField
                label="Rating"
                type="number"
                value={submissionForm.rating}
                onChange={(value) =>
                  setSubmissionForm((current) => ({ ...current, rating: value }))
                }
                min="1"
                max="5"
                step="0.1"
              />
              {String(editingSubmission.featureType).toUpperCase() === 'EVENT' && (
                <ProfileField
                  label="Tanggal Event"
                  type="date"
                  value={submissionForm.date}
                  onChange={(value) =>
                    setSubmissionForm((current) => ({ ...current, date: value }))
                  }
                />
              )}
              <ProfileField
                label={
                  String(editingSubmission.featureType).toUpperCase() === 'EVENT'
                    ? 'Jam Buka / Open Gate'
                    : 'Jam Buka - Tutup'
                }
                value={submissionForm.openingHours}
                onChange={(value) =>
                  setSubmissionForm((current) => ({ ...current, openingHours: value }))
                }
              />
              {String(editingSubmission.featureType).toUpperCase() === 'KULINER' ? (
                <ProfileField
                  label="Rentang Harga"
                  value={submissionForm.priceRange}
                  onChange={(value) =>
                    setSubmissionForm((current) => ({ ...current, priceRange: value }))
                  }
                />
              ) : (
                <ProfileField
                  label="Harga / Tiket Masuk"
                  value={submissionForm.ticketPrice}
                  onChange={(value) =>
                    setSubmissionForm((current) => ({ ...current, ticketPrice: value }))
                  }
                />
              )}
              <ProfileField
                label="Link Sumber"
                value={submissionForm.link}
                onChange={(value) =>
                  setSubmissionForm((current) => ({ ...current, link: value }))
                }
                required
              />
              <label className="block text-sm font-semibold text-slate-200">
                Upload Gambar
                <span className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-slate-400">
                  <ImagePlus className="h-5 w-5 text-cyan-300" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSubmissionImageUpload}
                    className="w-full text-sm"
                  />
                </span>
              </label>
              <label className="block text-sm font-semibold text-slate-200 md:col-span-2">
                Deskripsi
                <textarea
                  value={submissionForm.description}
                  onChange={(event) =>
                    setSubmissionForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
              </label>
            </div>

            {submissionForm.image && (
              <ImagePositionEditor
                value={submissionForm.image}
                onChange={(value) =>
                  setSubmissionForm((current) => ({ ...current, image: value }))
                }
                alt="Preview submission"
                className="mt-5"
                previewClassName="h-48 w-full"
              />
            )}

            <button
              type="submit"
              disabled={savingSubmission}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {savingSubmission ? 'Menyimpan...' : 'Simpan Edit Submission'}
            </button>
          </form>
        )}

        <SubmissionSection
          title="Event Saya"
          icon={<CalendarDays className="h-6 w-6 text-cyan-300" />}
          accent="cyan"
          items={filteredEvents}
          counts={eventCounts}
          activeFilter={eventFilter}
          onFilterChange={setEventFilter}
          onEdit={startEditSubmission}
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
          onEdit={startEditSubmission}
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
          onEdit={startEditSubmission}
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
  onEdit,
  emptyMessage,
}: {
  title: string;
  icon: ReactNode;
  accent: 'cyan' | 'emerald' | 'amber';
  items: ProfileSubmissionItem[];
  counts: Record<SubmissionStatus, number>;
  activeFilter: SubmissionStatus;
  onFilterChange: (value: SubmissionStatus) => void;
  onEdit: (item: ProfileSubmissionItem) => void;
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
              <img
                src={getImageSrc(item.image, fallbackSubmissionImage)}
                alt={item.title}
                onError={(event) => {
                  event.currentTarget.src = fallbackSubmissionImage;
                }}
                style={{ objectPosition: getImageObjectPosition(item.image) }}
                className="h-44 w-full object-cover"
              />
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
                {item.ticketPrice && (
                  <p className="flex gap-2">
                    <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item.ticketPrice}</span>
                  </p>
                )}
                {item.openingHours && (
                  <p className="flex gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                    <span>{item.openingHours}</span>
                  </p>
                )}

                {item.rating !== undefined && item.rating !== null && (
                  <p className="flex gap-2">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-300 text-amber-300" />
                    <span>Rating {Number(item.rating).toFixed(1)}</span>
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

              <button
                type="button"
                onClick={() => onEdit(item)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-300"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
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

function ProfileField({
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
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}
