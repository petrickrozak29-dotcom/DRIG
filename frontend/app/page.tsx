'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Calendar,
  ChevronDown,
  CircleHelp,
  Compass,
  Cpu,
  Map,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Utensils,
  Users,
  Zap,
} from 'lucide-react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

const SUGGESTION_FORM_URL = 'https://forms.gle/6xfgxkDquVoLwqQE9';

const quickLinks = [
  { label: 'Wisata', caption: 'Jelajahi destinasi', href: '/wisata', icon: Compass, tone: 'cyan' },
  { label: 'Kuliner', caption: 'Temukan kuliner', href: '/kuliner', icon: Utensils, tone: 'emerald' },
  { label: 'Budaya', caption: 'Kenali budaya', href: '/budaya', icon: BookOpen, tone: 'purple' },
  { label: 'Event', caption: 'Informasi event', href: '/event', icon: Calendar, tone: 'orange' },
  { label: 'Smart Map', caption: 'Peta interaktif', href: '/smart-map', icon: MapPin, tone: 'cyan' },
] as const;

const modules = [
  { title: 'Smart Tourism', description: 'Temukan destinasi unggulan Magelang lengkap dengan detail lokasi, rating, dan informasi perjalanan.', href: '/wisata', icon: Compass, tone: 'blue' },
  { title: 'Smart Culinary', description: 'Jelajahi kuliner lokal, UMKM, rentang harga, rating, dan petunjuk lokasi.', href: '/kuliner', icon: Utensils, tone: 'amber' },
  { title: 'Cultural Heritage', description: 'Kenali cerita budaya, tradisi, dan komunitas kreatif yang hidup di Magelang.', href: '/budaya', icon: BookOpen, tone: 'pink' },
  { title: 'Historical Timeline', description: 'Baca tonggak sejarah, situs warisan, dan perjalanan identitas Magelang.', href: '/sejarah', icon: ShieldCheck, tone: 'violet' },
  { title: 'Event & Festival', description: 'Ikuti agenda kota, festival, pameran, dan kegiatan komunitas di Magelang.', href: '/event', icon: Calendar, tone: 'rose' },
  { title: 'Smart Map', description: 'Navigasi wisata, kuliner, dan lokasi event yang telah terverifikasi dalam satu peta.', href: '/smart-map', icon: Map, tone: 'teal' },
  { title: 'Smart Magelang', description: 'Jelajahi potensi teknologi, smart city, pariwisata, dan ekonomi kreatif Magelang.', href: '/smart-magelang', icon: Bot, tone: 'blue' },
  { title: 'Form Saran/Aduan', description: 'Sampaikan saran dan aduan untuk pengembangan portal melalui Google Form resmi.', href: SUGGESTION_FORM_URL, icon: MessageCircle, tone: 'green', external: true },
  { title: 'Community Form', description: 'Ajukan konten event, kuliner, dan wisata untuk ditinjau pengelola.', href: '/community-form', icon: Users, tone: 'teal' },
] as const;

const potentials = [
  { title: 'Smart City & Layanan Digital', description: 'Layanan publik berbasis digital, data kota, dan inovasi yang berkelanjutan.', href: '/smart-magelang', icon: Cpu },
  { title: 'UMKM, Kuliner & Ekonomi Kreatif', description: 'Produk lokal, pusat kuliner, event ekonomi, dan promosi digital binaan warga.', href: '/kuliner', icon: BarChart3 },
  { title: 'Pariwisata Berbasis Data', description: 'Smart Map menyatukan wisata, kuliner, dan agenda agar perjalanan lebih efisien.', href: '/smart-map', icon: MapPin },
  { title: 'Partisipasi Komunitas', description: 'Ruang kolaborasi warga untuk mengajukan rekomendasi konten publik.', href: '/community-form', icon: Users },
] as const;

const faqs = [
  ['Apa itu Smart Tourism & Smart City Portal Magelang?', 'Portal digital terpadu untuk mengakses informasi wisata, event, budaya, kuliner, sejarah, dan potensi modern Magelang.'],
  ['Mengapa Magelang layak dikunjungi?', 'Magelang memiliki warisan budaya dunia, panorama alam, kuliner khas, serta pengalaman kota yang semakin mudah diakses secara digital.'],
  ['Bagaimana cara menemukan destinasi wisata?', 'Buka menu Wisata untuk daftar destinasi atau Smart Map untuk melihat persebaran lokasinya secara interaktif.'],
  ['Apakah saya dapat melihat lokasi saya di peta?', 'Ya. Jika Anda memberi izin lokasi pada perangkat, Smart Map dapat membantu menampilkan posisi Anda.'],
  ['Apakah saya harus login untuk menggunakan website?', 'Tidak. Informasi publik tetap dapat diakses tanpa login. Login diperlukan untuk fitur akun dan pengiriman data tertentu.'],
  ['Bagaimana cara mengirim event?', 'Login terlebih dahulu, buka halaman Event, lalu gunakan fitur tambah event dan kirimkan data untuk ditinjau.'],
  ['Bagaimana cara melaporkan informasi yang kurang tepat?', 'Gunakan Form Saran/Aduan pada menu Bantuan. Laporan akan diteruskan kepada pengelola portal.'],
  ['Apa fungsi Smart Magelang?', 'Smart Magelang menyajikan gagasan, potensi, dan informasi perkembangan teknologi serta layanan kota.'],
  ['Apa itu AI Assistant di Smart Magelang?', 'AI Assistant membantu menyusun itinerary berdasarkan jam mulai, waktu yang dimiliki, minat, lokasi awal, dan durasi singgah per destinasi.'],
  ['Apa arti Smart Map dan Community Form?', 'Smart Map menampilkan marker lokasi publik, sedangkan Community Form dipakai user login untuk mengajukan konten event, wisata, atau kuliner agar ditinjau pengelola.'],
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55 },
};

export default function Home() {
  return (
    <main className="home-page">
      <div className="hero-shell">
        <Navbar />
        <section className="hero-section">
          <div className="hero-overlay" />
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="hero-content"
          >
            <p className="eyebrow"><Sparkles /> Transformasi Digital Magelang</p>
            <h1>FUTURE<br /><span>MAGELANG</span></h1>
            <p className="hero-copy">Smart Tourism & Digital City Platform yang menghadirkan pengalaman unik menjelajahi Magelang dengan teknologi digital.</p>
            <p className="hero-subcopy">Explore Heritage, Culture, and City Experiences</p>
            <div className="hero-actions">
              <Link href="/wisata" className="primary-button">Mulai Jelajah <ArrowRight /></Link>
              <Link href="/smart-map" className="secondary-button">Lihat Peta <Map /></Link>
            </div>
          </motion.div>

          <div className="quick-links" aria-label="Navigasi fitur utama">
            {quickLinks.map(({ icon: Icon, ...item }) => (
              <Link key={item.label} href={item.href} className={`quick-card tone-${item.tone}`}>
                <span className="quick-icon"><Icon /></span>
                <strong>{item.label}</strong>
                <small>{item.caption}</small>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="modules-section section-pad">
        <motion.div {...reveal} className="section-heading module-heading">
          <p className="section-kicker"><Zap /> Fitur Unggulan</p>
          <h2>Featured<br />Modules</h2>
          <p>Semua fitur untuk menjelajahi Magelang dengan lebih mudah.</p>
        </motion.div>
        <div className="module-grid">
          {modules.map(({ icon: Icon, ...module }, index) => (
            <motion.div key={module.title} {...reveal} transition={{ duration: 0.5, delay: index * 0.04 }}>
              {'external' in module && module.external ? (
                <a href={module.href} target="_blank" rel="noopener noreferrer" className={`module-card module-${module.tone}`}>
                  <span className="module-icon"><Icon /></span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <span className="card-link">Buka Form <ArrowRight /></span>
                </a>
              ) : (
                <Link href={module.href} className={`module-card module-${module.tone}`}>
                  <span className="module-icon"><Icon /></span>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <span className="card-link">Jelajahi <ArrowRight /></span>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </section>

{/* 1. MASKING DIPERCEPAT: Pudar dari 0 sampai 80px aja biar nggak tembus ke belakang */}
      <style>{`
        .mask-gunung {
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100px, black calc(100% - 150px), transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 200px, black calc(100% - 150px), transparent 100%);
        }
      `}</style>

      {/* 2. Ditarik persis 5rem (80px) biar menutupi ujung section atas dengan sempurna */}
      <section
        className="potential-section section-pad relative mask-gunung" 
        style={{ 
          borderTop: 'none', 
          marginTop: '-5rem', /* -5rem = 80px (Pas dengan panjang masking) */
          zIndex: 10, 
          paddingTop: '8rem' 
        }} 
      >
        <div className="potential-overlay" style={{ zIndex: 1 }}/>
        <motion.div {...reveal} className="potential-copy relative z-20">
          <p className="section-kicker"><Sparkles /> Perkembangan Teknologi</p>
          <h2>Potensi Modern<br />Magelang</h2>
          <p>Portal ini menampilkan sejarah dan budaya berdampingan dengan smart city, UMKM digital, event komunitas, dan peta berbasis lokasi.</p>
          <Link href="/smart-magelang" className="primary-button">Selengkapnya <ArrowRight /></Link>
        </motion.div>
        <div className="potential-grid">
          {potentials.map(({ icon: Icon, ...item }) => (
            <Link key={item.title} href={item.href} className="potential-card">
              <span><Icon /></span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ArrowRight className="round-arrow" />
            </Link>
          ))}
        </div>
      </section>

{/* SECTION FAQ (Margin dihapus, kita pakai paddingTop & paddingBottom kecil biar rapat) */}
      <section 
        id="faq" 
        className="faq-section section-pad relative" 
        style={{ 
          marginTop: '-4rem', /* Pastikan margin reset ke nol */
          paddingTop: '3rem', /* Ngepres jarak atas biar deket sama air terjun */
          paddingBottom: '5rem', /* Ngasih jarak aman ke CTA di bawahnya */
          zIndex: 20 
        }} 
      >
        <div className="faq-overlay" style={{ zIndex: 1 }} />
        <motion.div {...reveal} className="faq-content relative z-10">
          <p className="section-kicker"><CircleHelp /> Pertanyaan Umum</p>
          <h2>FAQ</h2>
          <div className="faq-grid">
            {[0, 1].map((column) => (
              <div key={column} className="faq-column">
                {faqs
                  .filter((_, index) => index % 2 === column)
                  .map(([question, answer]) => (
                    <details key={question} className="faq-item">
                      <summary>{question}<ChevronDown /></summary>
                      <p>{answer}</p>
                    </details>
                  ))}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

{/* 1. MASKING DUA ARAH (Atas & Bawah) */}
      <style>{`
        .mask-cta-full {
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100px, black calc(100% - 100px), transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 100px, black calc(100% - 100px), transparent 100%);
        }
      `}</style>

      {/* 2. SECTION CTA (Dibuat full-height biar nggak ada celah putih/hitam di bawah) */}
      <section 
        className="cta-section relative mask-cta-full" 
        style={{ 
          marginTop: '-5rem', 
          zIndex: 30,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '60vh', /* Biar fotonya ngebentang full */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="cta-copy relative z-10" style={{ textAlign: 'center', marginTop: '-100px' }}>
          <h2>Siap Menjelajahi<br /><span>Magelang?</span></h2>
          <p>Buka Smart Map dan fitur publik untuk menjelajahi wisata, budaya, sejarah, event, dan kuliner Magelang.</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link href="/login" className="primary-button">Jelajahi Sekarang <ArrowRight /></Link>
            <Link href="/smart-map" className="secondary-button">Peta Interaktif <Map /></Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
