'use client';

import { motion } from 'framer-motion';

const particles = [
  { top: '12%', left: '18%', drift: 24, duration: 13 },
  { top: '28%', left: '72%', drift: -36, duration: 16 },
  { top: '44%', left: '32%', drift: 42, duration: 18 },
  { top: '58%', left: '88%', drift: -28, duration: 14 },
  { top: '76%', left: '14%', drift: 34, duration: 19 },
  { top: '86%', left: '62%', drift: -44, duration: 17 },
  { top: '20%', left: '48%', drift: 30, duration: 15 },
  { top: '68%', left: '40%', drift: -22, duration: 20 },
];

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl"
        style={{ top: '10%', left: '5%' }}
        animate={{
          x: [0, 50, -50, 0],
          y: [0, 50, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity }}
      />

      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl"
        style={{ top: '50%', right: '5%' }}
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 40, -50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, delay: 2 }}
      />

      <motion.div
        className="absolute w-72 h-72 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full blur-3xl"
        style={{ bottom: '10%', left: '50%' }}
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -50, 30, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, delay: 4 }}
      />

      {/* Floating particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            top: particle.top,
            left: particle.left,
          }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -100, 0],
            x: [0, particle.drift, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
