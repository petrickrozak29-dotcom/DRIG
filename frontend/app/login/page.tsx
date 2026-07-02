'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';

export default function LoginPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePasswordStrength = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password harus minimal 8 karakter';
    if (!/[A-Z]/.test(pwd)) return 'Password harus mengandung huruf besar';
    if (!/[a-z]/.test(pwd)) return 'Password harus mengandung huruf kecil';
    if (!/\d/.test(pwd)) return 'Password harus mengandung angka';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password harus mengandung karakter spesial';
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const passwordError = validatePasswordStrength(password);
        if (passwordError) throw new Error(passwordError);
        if (password !== confirmPassword) throw new Error('Password tidak cocok');
        if (!name.trim()) throw new Error('Nama harus diisi');

        await register(name.trim(), email.trim(), password);
        setStatus('Registrasi berhasil. Mengarahkan ke Beranda...');
      } else {
        const loggedInUser = await login(email.trim(), password);
        const target = loggedInUser.role === 'ADMIN' ? '/developer' : '/';
        setStatus(
          loggedInUser.role === 'ADMIN'
            ? 'Login developer berhasil. Mengarahkan ke Dashboard Developer...'
            : 'Login berhasil. Mengarahkan ke Beranda...'
        );
        setTimeout(() => {
          window.location.href = target;
        }, 900);
        return;
      }

      const target = '/';
      setTimeout(() => {
        window.location.href = target;
      }, 900);
    } catch (error: any) {
      setStatus(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <GradientBg theme="login">
      <AnimatedBackground />
      <Navbar />
      <main className="mx-auto flex min-h-[78vh] max-w-6xl items-center justify-center px-4 py-10 text-white sm:px-6">
        <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/85 p-6 shadow-2xl sm:p-8">
          <div className="mb-6">
            <h1 className="mt-2 text-3xl font-bold text-white">
              {mode === 'login' ? 'Login' : 'Register'}
            </h1>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <label className="block text-sm font-semibold text-slate-200">
                Nama
                <div className="mt-2 flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 focus-within:border-cyan-400">
                  <User className="h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className="w-full bg-transparent px-3 py-3 text-white outline-none"
                    required
                  />
                </div>
              </label>
            )}

            <label className="block text-sm font-semibold text-slate-200">
              Email
              <div className="mt-2 flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 focus-within:border-cyan-400">
                <Mail className="h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  className="w-full bg-transparent px-3 py-3 text-white outline-none"
                  required
                />
              </div>
            </label>

            <label className="block text-sm font-semibold text-slate-200">
              Password
              <div className="mt-2 flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 focus-within:border-cyan-400">
                <Lock className="h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-transparent px-3 py-3 text-white outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="rounded-md p-1 text-slate-400 transition hover:text-white"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            {mode === 'register' && (
              <label className="block text-sm font-semibold text-slate-200">
                Konfirmasi Password
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
                <span className="mt-2 block text-xs leading-5 text-slate-400">
                  Minimal 8 karakter, huruf besar, huruf kecil, angka, dan karakter spesial.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Memproses...' : mode === 'login' ? 'Login' : 'Register'}
            </button>

            {status && (
              <p
                className={`text-sm ${status.includes('berhasil') ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                {status}
              </p>
            )}
          </form>
        </section>
      </main>
      <Footer />
    </GradientBg>
  );
}
