"use client";

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Landmark, Music, Palette, Sparkles, Users } from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { getDeveloperContent, hasDeveloperContent, type DeveloperContentItem } from '../../lib/magelang-data';

const cultureItems = [
  {
    title: 'Cagar Budaya Mantyasih',
    description: 'Jejak Mantyasih menjadi pintu masuk penting untuk memahami hari jadi Kota Magelang, memori desa perdikan, dan lanskap sejarah tua di Meteseh.',
    details: ['Lumpang Mantyasih', 'Prasasti dan tradisi lokal', 'Kampung Meteseh'],
    icon: Landmark,
    source: 'https://kebudayaan.magelangkota.go.id/2025/06/03/sejarah-dan-cagar-budaya-kota-magelang/'
  },
  {
    title: 'Ekosistem Kebudayaan',
    description: 'Pemajuan kebudayaan Magelang diarahkan agar seni, tradisi, naskah, ritus, dan pengetahuan lokal tetap hidup sekaligus mendukung ekonomi kreatif.',
    details: ['10 Objek Pemajuan Kebudayaan', 'Dialog budaya', 'Ekonomi kreatif'],
    icon: Users,
    source: 'https://magelangkota.go.id/view/kota-magelang-perkuat-ekosistem-kebudayaan-masyarakat'
  },
  {
    title: 'Agenda Seni Kota',
    description: 'Bidang Kebudayaan Disdikbud rutin mempublikasikan agenda seperti parade seni, batik, aksara, museum, dan kegiatan edukasi budaya.',
    details: ['Parade seni', 'Harmoni batik', 'Pameran aksara'],
    icon: Music,
    source: 'https://kebudayaan.magelangkota.go.id/'
  },
  {
    title: 'Museum dan Ruang Belajar',
    description: 'Museum, bangunan lama, dan ruang edukasi sejarah menjadi medium untuk membaca perkembangan kota dari kolonial, perjuangan, hingga modern.',
    details: ['Museum BPK RI', 'Museum Sudirman', 'Museum Diponegoro'],
    icon: BookOpen,
    source: 'https://pilarstatistik.magelangkota.go.id/artikel/magelang-sejarah-budaya-wisata-dan-perkembangannya'
  },
  {
    title: 'Kerajinan dan Batik',
    description: 'Batik, kriya, dan produksi kreatif warga menjadi bagian dari identitas lokal sekaligus potensi ekonomi komunitas Magelang.',
    details: ['Batik lokal', 'Kriya komunitas', 'Produk UMKM'],
    icon: Palette,
    source: 'https://kebudayaan.magelangkota.go.id/'
  },
  {
    title: 'Festival dan Partisipasi',
    description: 'Festival budaya dan event komunitas mempertemukan pelaku seni, pelajar, UMKM, wisatawan, dan warga dalam ruang kolaborasi kota.',
    details: ['Festival budaya', 'Pertunjukan komunitas', 'Event warga'],
    icon: Sparkles,
    source: 'https://visitmagelang.id/event-magelang/'
  }
];

export default function BudayaPage() {
  const [managedCulture, setManagedCulture] = useState<DeveloperContentItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const refresh = () => setManagedCulture(getDeveloperContent('culture'));
    refresh();
    window.addEventListener('magelangverse-content-updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('magelangverse-content-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const items = useMemo(
    () => [
      ...(hasDeveloperContent('culture') ? managedCulture.map((item) => ({
        title: item.title,
        description: item.description,
        details: item.details?.length ? item.details : [item.category || 'Budaya Magelang'],
        icon: Sparkles,
        source: item.source || item.link || '#'
      })) : cultureItems)
    ],
    [managedCulture]
  );

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((it) => (it.title + ' ' + it.description).toLowerCase().includes(q));
  }, [items, search]);

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-10 text-center">
          <div className="mb-4 flex justify-center gap-3">
            <BookOpen className="h-10 w-10 text-violet-300" />
            <Sparkles className="h-10 w-10 text-pink-300" />
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">Warisan Budaya Magelang</h1>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            Ringkasan budaya ini diarahkan ke sumber artikel dan kanal resmi/terkait, supaya pengunjung bisa membaca konteks lengkapnya.
          </p>
          <div className="mt-4 flex justify-center">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari budaya..." className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none w-full max-w-md focus:border-violet-400" />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-400/15 text-violet-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>

                <ul className="mt-5 space-y-2 text-sm text-slate-400">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-300" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={item.source}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-300"
                >
                  Baca Sumber
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            );
          })}
        </section>
      </main>

      <Footer />
    </GradientBg>
  );
}
