"use client";

import { motion } from 'framer-motion';

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
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -100, 0],
            x: [0, Math.random() * 100 - 50, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
