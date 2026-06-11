"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api';

type Category = {
  id: string;
  name: string;
  featureType: string;
  createdAt?: string;
};

const FEATURE_TYPES: { value: string; label: string }[] = [
  { value: 'WISATA', label: 'Wisata' },
  { value: 'KULINER', label: 'Kuliner' },
  { value: 'EVENT', label: 'Event' },
  { value: 'SMART_MAGELANG', label: 'Smart Magelang' },
  { value: 'CULTURE', label: 'Budaya' },
  { value: 'HISTORY', label: 'Sejarah' }
];

export default function CategoryManager({ token }: { token?: string | null }) {
  const [featureType, setFeatureType] = useState<string>('WISATA');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadCategories(featureType);
  }, [featureType]);

  async function loadCategories(ft: string) {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/categories?featureType=${encodeURIComponent(ft)}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Gagal memuat kategori');
      const data = await res.json();
      setCategories(data || []);
    } catch (err: any) {
      setCategories([]);
      setStatus(err.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return setStatus('Nama kategori tidak boleh kosong');
    setStatus('Menyimpan...');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ name, featureType })
      });
      if (!res.ok) throw new Error('Gagal membuat kategori');
      setNewName('');
      await loadCategories(featureType);
      setStatus('Kategori dibuat.');
    } catch (err: any) {
      setStatus(err.message || 'Gagal membuat kategori');
    }
  }

  async function handleSave(id: string) {
    const name = editingName.trim();
    if (!name) return setStatus('Nama kategori tidak boleh kosong');
    setStatus('Menyimpan...');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Gagal mengubah kategori');
      setEditingId(null);
      setEditingName('');
      await loadCategories(featureType);
      setStatus('Kategori diperbarui.');
    } catch (err: any) {
      setStatus(err.message || 'Gagal mengubah kategori');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kategori ini?')) return;
    setStatus('Menghapus...');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) throw new Error('Gagal menghapus kategori');
      await loadCategories(featureType);
      setStatus('Kategori dihapus.');
    } catch (err: any) {
      setStatus(err.message || 'Gagal menghapus kategori');
    }
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/85 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Kelola Kategori</h2>
        <div className="flex items-center gap-3">
          <select value={featureType} onChange={(e) => setFeatureType(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
            {FEATURE_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-slate-400">Memuat...</p>
            ) : categories.length === 0 ? (
              <p className="text-slate-400">Belum ada kategori untuk fitur ini.</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
                  {editingId === cat.id ? (
                    <div className="flex w-full items-center gap-2">
                      <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                      <button onClick={() => handleSave(cat.id)} className="rounded bg-emerald-400 px-3 py-1 text-slate-950"><Save className="h-4 w-4" /></button>
                      <button onClick={() => { setEditingId(null); setEditingName(''); }} className="rounded bg-slate-700 px-3 py-1 text-white"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{cat.name}</div>
                        <div className="text-xs text-slate-400">{cat.featureType}</div>
                      </div>
                      <div className="ml-3 flex gap-2">
                        <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }} className="rounded border border-slate-700 px-2 py-1 text-slate-200"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(cat.id)} className="rounded border border-rose-500/40 px-2 py-1 text-rose-200"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
          <h3 className="font-semibold text-white">Tambah Kategori</h3>
          <label className="block text-sm font-semibold text-slate-200 mt-3">Nama Kategori
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          </label>
          <button onClick={handleAdd} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300">
            <Plus className="h-4 w-4" />
            Tambah
          </button>
          {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
        </div>
      </div>
    </section>
  );
}
