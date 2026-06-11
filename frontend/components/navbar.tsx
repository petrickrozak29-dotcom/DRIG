"use client";

import Link from 'next/link';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const isDeveloper = user?.role === 'ADMIN';

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 text-sm text-slate-100 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="font-semibold text-white">
          MAGELANGVERSE.ID
        </Link>
        <nav className="flex flex-wrap items-center gap-3 lg:justify-end">
          {isDeveloper ? (
            <Link href="/developer">Dashboard Developer</Link>
          ) : (
            <>
              <Link href="/wisata">Wisata</Link>
              <Link href="/kuliner">Kuliner</Link>
              <Link href="/budaya">Budaya</Link>
              <Link href="/sejarah">Sejarah</Link>
              <Link href="/event">Event</Link>
              <Link href="/smart-map">Smart Map</Link>
              <Link href="/smart-magelang">Smart Magelang</Link>
            </>
          )}
          {isAuthenticated && !isDeveloper && (
            <Link href="/admin">Community Event</Link>
          )}
          {!loading && (
            isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/profile" className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-3 py-1.5 font-medium text-cyan-200 transition hover:border-cyan-300">
                  <UserCircle className="h-4 w-4" />
                  {user?.name}
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-1.5 text-white transition hover:bg-slate-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-cyan-500 px-4 py-1.5 font-semibold text-black transition hover:bg-cyan-400"
              >
                Login
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
