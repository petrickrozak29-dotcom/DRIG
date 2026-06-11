"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  gradient: string;
  bgPattern?: string;
}

export default function ModuleCard({ title, description, icon, href, gradient, bgPattern }: ModuleCardProps) {
  return (
    <motion.div
      whileHover={{ translateY: -12, scale: 1.02 }}
      className="group relative rounded-3xl border-2 border-white/10 overflow-hidden"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
      
      {/* Pattern overlay */}
      {bgPattern && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: bgPattern, backgroundSize: '60px 60px' }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 p-8">
        <div className="mb-6 text-6xl drop-shadow-lg">{icon}</div>
        <h3 className="text-2xl font-bold text-white drop-shadow-md">{title}</h3>
        <p className="mt-3 text-white/90 drop-shadow-sm">{description}</p>
        <Link
          href={href as any}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white transition backdrop-blur-sm hover:bg-white/30 hover:shadow-lg"
        >
          Jelajahi →
        </Link>
      </div>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.div>
  );
}
