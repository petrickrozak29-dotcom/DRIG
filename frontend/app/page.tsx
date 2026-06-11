  "use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Cpu, HelpCircle, MapPin, ShieldCheck, Utensils, Zap, Calendar, BarChart3, MessageCircle } from 'lucide-react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import ModuleCard from '../components/module-card';
import StatsCard from '../components/stats-card';
import GradientBg from '../components/gradient-bg';
import AnimatedBackground from '../components/animated-background';

const modules = [
  {
    title: 'Smart Tourism',
    description: 'Jelajahi destinasi wisata Magelang terbaik dengan informasi tiket, jam buka, dan rating.',
    icon: '🏛️',
    href: '/wisata',
    gradient: 'from-blue-600 via-blue-500 to-blue-400',
    bgPattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  },
  {
    title: 'Smart Culinary',
    description: 'Temukan kuliner khas Magelang dengan rekomendasi lokasi dan harga terbaik.',
    icon: '🍜',
    href: '/kuliner',
    gradient: 'from-orange-600 via-amber-500 to-yellow-400',
    bgPattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  },
  {
    title: 'Digital Heritage',
    description: 'Pelajari sejarah dan budaya kota Magelang yang kaya.',
    icon: '📚',
    href: '/budaya',
    gradient: 'from-purple-600 via-purple-500 to-pink-400',
    bgPattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="20"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  },
  {
    title: 'Smart Interactive Map',
    description: 'Navigasi peta interaktif dengan semua fasilitas kota.',
    icon: '🗺️',
    href: '/smart-map',
    gradient: 'from-green-600 via-emerald-500 to-teal-400',
    bgPattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M0 0h60v60H0z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  },
  {
    title: 'Smart Magelang',
    description: 'AI itinerary, teknologi kota, dan potensi modern Magelang dalam satu fitur.',
    icon: '🤖',
    href: '/smart-magelang',
    gradient: 'from-cyan-600 via-blue-500 to-indigo-400',
    bgPattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  },
  {
    title: 'Event & Festival',
    description: 'Pantau event dan festival terbaru di Kota Magelang.',
    icon: '🎉',
    href: '/event',
    gradient: 'from-pink-600 via-rose-500 to-red-400',
    bgPattern: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="20"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
  }
];

const stats = [
  { icon: MapPin, number: '50+', label: 'Destinasi Wisata', color: 'cyan' },
  { icon: Utensils, number: '30+', label: 'Kuliner Khas', color: 'orange' },
  { icon: Calendar, number: '100+', label: 'Event per Tahun', color: 'purple' },
  { icon: MessageCircle, number: '24/7', label: 'Smart Magelang', color: 'green' }
];

const modernPotentials = [
  {
    title: 'Smart City dan Layanan Digital',
    description: 'Magelang punya potensi layanan publik berbasis aplikasi, data kota, kanal darurat, dan integrasi kebutuhan warga.',
    icon: Cpu,
    href: 'https://magesty.magelangkota.go.id/'
  },
  {
    title: 'UMKM, Kuliner, dan Ekonomi Kreatif',
    description: 'Produk lokal, pusat kuliner, event komunitas, dan promosi digital bisa menjadi penggerak ekonomi warga.',
    icon: BarChart3,
    href: '/kuliner'
  },
  {
    title: 'Pariwisata Berbasis Data',
    description: 'Smart Map membantu menyatukan event, wisata, kuliner, dan rekomendasi jarak agar perjalanan lebih efisien.',
    icon: MapPin,
    href: '/smart-map'
  },
  {
    title: 'Partisipasi Komunitas',
    description: 'Community Event memberi ruang warga untuk mengirim agenda, lalu masuk map setelah disetujui developer.',
    icon: ShieldCheck,
    href: '/admin'
  }
];

const faqs = [
  {
    question: 'Apa itu Smart Tourism & Smart City Portal Magelang?',
    answer: 'Portal digital yang menyediakan informasi wisata, event, budaya, kuliner, dan berbagai informasi kota Magelang dalam satu platform.'
  },
  {
    question: 'Mengapa Magelang layak dikunjungi?',
    answer: 'Magelang menawarkan warisan budaya, keindahan alam, kuliner khas, dan destinasi unggulan. Perkembangan teknologi dan konsep Smart City membuatnya makin nyaman dijelajahi secara digital.'
  },
  {
    question: 'Bagaimana cara mencari destinasi wisata?',
    answer: 'Buka halaman Smart Map atau menu Wisata untuk melihat destinasi yang tersedia beserta informasi lokasinya.'
  },
  {
    question: 'Apakah saya dapat melihat lokasi saya di peta?',
    answer: 'Ya. Jika Anda mengizinkan akses lokasi pada perangkat, sistem dapat menampilkan posisi Anda untuk membantu navigasi.'
  },
  {
    question: 'Apakah saya harus login untuk menggunakan website?',
    answer: 'Tidak. Sebagian besar informasi dapat diakses tanpa login. Namun login diperlukan untuk mengirim atau mengelola event dan pengajuan kuliner.'
  },
  {
    question: 'Bagaimana cara mengirim event?',
    answer: 'Login terlebih dahulu, lalu buka halaman Event dan pilih Tambah Event. Isi informasi yang diperlukan dan kirim untuk ditinjau.'
  },
  {
    question: 'Bagaimana cara menghubungi pengelola jika menemukan informasi yang kurang tepat?',
    answer: 'Anda dapat menggunakan halaman kontak atau fitur yang tersedia untuk menyampaikan masukan dan laporan.'
  },
  {
    question: 'Apa fungsi AI Assistant?',
    answer: 'AI Assistant membantu memberikan rekomendasi wisata, kuliner, dan rencana perjalanan berdasarkan minat serta waktu yang dimiliki pengguna.'
  }
];

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <GradientBg>
      <AnimatedBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-6 py-32 text-white overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative z-10 text-center">
          <motion.p variants={itemVariants} className="mb-4 inline-block rounded-full border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 text-sm font-semibold text-cyan-300">
            🌟 Transformasi Digital Kota Magelang
          </motion.p>

          <motion.h1 variants={itemVariants} className="mt-6 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-6xl font-bold text-transparent sm:text-7xl">
            MAGELANGVERSE.ID
          </motion.h1>

          <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-2xl text-xl text-slate-200">
            Smart Tourism & Digital City Platform yang menghadirkan pengalaman unik menjelajahi Magelang dengan teknologi AI terdepan.
          </motion.p>

          <motion.p variants={itemVariants} className="mt-4 text-lg bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent font-semibold">
            ✨ Explore Heritage, Experience Technology
          </motion.p>

          <motion.div variants={itemVariants} className="mt-12 flex flex-wrap justify-center gap-4">
            <Link href="/wisata" className="group relative rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 font-semibold text-white transition hover:shadow-2xl hover:shadow-cyan-500/50 overflow-hidden">
              <span className="relative z-10">🚀 Mulai Jelajah</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition group-hover:opacity-30" />
            </Link>
            <Link href="/smart-map" className="rounded-full border-2 border-cyan-400/50 px-8 py-4 font-semibold text-white transition hover:border-cyan-300 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20">
              📍 Lihat Peta
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid gap-6 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <StatsCard key={idx} icon={stat.icon} number={stat.number} label={stat.label} color={stat.color} />
          ))}
        </motion.div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-32">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16 text-center">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent sm:text-6xl">Fitur Unggulan</h2>
          <p className="mt-4 text-xl text-slate-300">Jelajahi semua fitur untuk pengalaman smart tourism terbaik</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <ModuleCard {...module} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            <Zap className="h-4 w-4" />
            Perkembangan Teknologi
          </p>
          <h2 className="mt-3 text-4xl font-bold text-white">Potensi modern Magelang</h2>
          <p className="mt-4 max-w-3xl text-slate-300">
            Portal ini menempatkan sejarah dan budaya berdampingan dengan smart city, UMKM digital, event komunitas, dan peta berbasis lokasi.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {modernPotentials.map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.title} href={item.href} className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 transition hover:border-cyan-300/60">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </a>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center">
          <HelpCircle className="mx-auto h-10 w-10 text-cyan-300" />
          <h2 className="mt-4 text-4xl font-bold text-white">FAQ</h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {faqs.map((item) => (
            <article key={item.question} className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-6xl px-6 py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative rounded-3xl border-2 border-cyan-400/50 bg-gradient-to-r from-cyan-900/40 via-purple-900/40 to-pink-900/40 p-12 text-center backdrop-blur-xl">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-200 to-purple-200 bg-clip-text text-transparent sm:text-5xl">Siap Menjelajahi Magelang?</h2>
          <p className="mt-4 text-lg text-slate-200">Gunakan Smart Magelang untuk membuat itinerary dan melihat potensi digital kota.</p>
          <Link href="/smart-magelang" className="mt-8 inline-block rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 px-8 py-4 font-semibold text-white transition hover:shadow-2xl hover:shadow-purple-500/50">
            Buat Itinerary Sekarang →
          </Link>
        </motion.div>
      </section>

      <Footer />
    </GradientBg>
  );
}

