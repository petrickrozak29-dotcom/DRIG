"use client";

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  number: string;
  label: string;
  color: string;
}

export default function StatsCard({ icon: Icon, number, label, color }: StatsCardProps) {
  const colorGradients: Record<string, { bg: string; icon: string; border: string }> = {
    'cyan': { bg: 'from-cyan-600/40 to-blue-600/40', icon: 'bg-cyan-500/30', border: 'border-cyan-500/50' },
    'orange': { bg: 'from-orange-600/40 to-amber-600/40', icon: 'bg-orange-500/30', border: 'border-orange-500/50' },
    'purple': { bg: 'from-purple-600/40 to-pink-600/40', icon: 'bg-purple-500/30', border: 'border-purple-500/50' },
    'green': { bg: 'from-green-600/40 to-emerald-600/40', icon: 'bg-green-500/30', border: 'border-green-500/50' },
  };

  const gradient = colorGradients[color] || colorGradients['cyan'];

  return (
    <motion.div
      whileHover={{ translateY: -8, scale: 1.05 }}
      className={`relative rounded-3xl border-2 ${gradient.border} bg-gradient-to-br ${gradient.bg} p-8 text-center backdrop-blur-xl overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition duration-300 bg-gradient-to-br from-white/5 to-transparent" />
      
      <div className={`mx-auto mb-4 w-fit rounded-full p-4 ${gradient.icon}`}>
        <Icon className="h-8 w-8 text-white drop-shadow-lg" />
      </div>
      <p className="text-4xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent drop-shadow-lg">{number}</p>
      <p className="mt-3 text-slate-200 font-medium drop-shadow-sm">{label}</p>
    </motion.div>
  );
}
