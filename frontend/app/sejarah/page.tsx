"use client";

import { useEffect, useMemo, useState } from 'react';
import { Calendar, ExternalLink, History, PlayCircle } from 'lucide-react';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import GradientBg from '../../components/gradient-bg';
import AnimatedBackground from '../../components/animated-background';
import { getDeveloperContent, hasDeveloperContent, type DeveloperContentItem } from '../../lib/magelang-data';

const historyPhoto = {
  city: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
  heritage: 'https://commons.wikimedia.org/wiki/Special:FilePath/Borobudur_Temple.jpg',
  museum: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1200&q=80',
  modern: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'
};

const timeline = [
  {
    year: '907 M',
    period: 'Mantyasih dan Hari Jadi',
    detail: 'Cikal bakal Magelang sering dikaitkan dengan Desa Perdikan Mantyasih, yang sekarang dikenal sebagai kawasan Meteseh. Penetapan hari jadi Kota Magelang merujuk pada tradisi sejarah dan kajian prasasti yang menempatkan 11 April 907 sebagai titik penting identitas kota.',
    image: historyPhoto.heritage,
    source: 'https://magelangkota.go.id/page/profil-kota-magelang-2'
  },
  {
    year: 'Masa Hindu-Buddha',
    period: 'Jejak Cagar Budaya',
    detail: 'Lumpang Mantyasih, Batu Kendang, dan temuan arkeologis di beberapa kampung menunjukkan bahwa wilayah Magelang sudah menjadi ruang hidup, ritual, dan produksi pangan sejak masa lama. Jejak ini penting karena membuat sejarah kota tidak hanya dibaca dari pusat pemerintahan, tetapi juga dari situs kampung.',
    image: historyPhoto.museum,
    source: 'https://kebudayaan.magelangkota.go.id/2025/06/03/sejarah-dan-cagar-budaya-kota-magelang/'
  },
  {
    year: 'Abad 18-19',
    period: 'Kota Strategis di Kedu',
    detail: 'Magelang berkembang sebagai titik strategis di jalur Kedu. Pada masa kolonial, posisi geografisnya mendukung pemerintahan, militer, perdagangan, dan konektivitas antarwilayah. Jejak bangunan lama dan tata kota masih terasa di pusat kota sampai sekarang.',
    image: historyPhoto.city,
    source: 'https://magelangkota.go.id/view/mengintip-sejarah-kota-magelang'
  },
  {
    year: '1945-1970',
    period: 'Perjuangan dan Pendidikan',
    detail: 'Setelah kemerdekaan, Magelang menjadi ruang penting bagi pendidikan, militer, administrasi, dan layanan publik. Museum perjuangan dan bangunan peninggalan menjadi pengingat bahwa kota ini punya lapisan sejarah nasional, bukan hanya lokal.',
    image: historyPhoto.museum,
    source: 'https://pilarstatistik.magelangkota.go.id/artikel/magelang-sejarah-budaya-wisata-dan-perkembangannya'
  },
  {
    year: '2000-sekarang',
    period: 'Heritage, Wisata, dan Kota Modern',
    detail: 'Identitas Magelang hari ini bergerak di antara heritage, pariwisata Borobudur Raya, UMKM, pendidikan, dan layanan digital. Smart city, aplikasi pelayanan publik, dan data kota menjadi peluang baru untuk menghubungkan sejarah dengan kebutuhan warga modern.',
    image: historyPhoto.modern,
    source: 'https://magesty.magelangkota.go.id/'
  }
];

export default function SejarahPage() {
  const [managedHistory, setManagedHistory] = useState<DeveloperContentItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const refresh = () => setManagedHistory(getDeveloperContent('history'));
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
      ...(hasDeveloperContent('history') ? managedHistory.map((item) => ({
        year: item.year || 'Periode baru',
        period: item.period || item.title,
        detail: item.description,
        image: item.image || historyPhoto.museum,
        source: item.source || item.link || '#'
      })) : timeline)
    ],
    [managedHistory]
  );

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((it) => (it.period + ' ' + it.detail).toLowerCase().includes(q));
  }, [items, search]);

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:py-16">
        <section className="mb-10 text-center">
          <div className="mb-4 flex justify-center gap-3">
            <History className="h-10 w-10 text-violet-300" />
            <Calendar className="h-10 w-10 text-cyan-300" />
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">Perjalanan Sejarah Magelang</h1>
          <p className="mx-auto mt-4 max-w-3xl text-slate-300">
            Dari Mantyasih, kota strategis Kedu, memori perjuangan, sampai smart city modern. Setiap periode dilengkapi foto, sumber bacaan, dan link video.
          </p>
          <a
            href="https://www.youtube.com/results?search_query=sejarah+kota+magelang+mantyasih"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-rose-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-rose-300"
          >
            <PlayCircle className="h-5 w-5" />
            Tonton Video Sejarah
          </a>
          <div className="mt-4 flex justify-center">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari sejarah..." className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-white outline-none w-full max-w-md focus:border-rose-400" />
          </div>
        </section>

        <section className="space-y-6">
          {items.map((item, index) => (
            <article key={item.period} className="grid overflow-hidden rounded-lg border border-slate-800 bg-slate-900/80 md:grid-cols-[280px_minmax(0,1fr)]">
              <img src={item.image} alt={item.period} className="h-64 w-full object-cover md:h-full" />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {item.year}
                  </span>
                  <span className="text-sm text-slate-500">Bagian {index + 1}</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">{item.period}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.detail}</p>
                <a
                  href={item.source}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300"
                >
                  Baca Sumber
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </GradientBg>
  );
}
