'use client';

import { motion } from 'framer-motion';

interface GradientBgProps {
  children: React.ReactNode;
  theme?:
    | 'wisata'
    | 'kuliner'
    | 'budaya'
    | 'sejarah'
    | 'event'
    | 'smart-magelang'
    | 'smart-map'
    | 'login';
}

export default function GradientBg({ children, theme }: GradientBgProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-slate-950 ${theme ? `portal-theme portal-theme-${theme}` : ''}`}>
      {theme && (
        <>
          <div className={`portal-photo portal-photo-${theme}`} aria-hidden="true" />
          <div className="portal-photo-overlay" aria-hidden="true" />
          <div className="portal-motion-grid" aria-hidden="true" />
        </>
      )}
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -left-1/2 top-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, delay: 5 }}
          className="absolute -right-1/2 bottom-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
