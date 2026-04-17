import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDone(true);
            setTimeout(() => onComplete(), 600);
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: '#05070D' }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#06b6d4' : '#3b82f6',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="text-center relative z-10">
            {/* Car Line Drawing Animation */}
            <motion.svg
              width="240"
              height="120"
              viewBox="0 0 240 120"
              className="mx-auto mb-6"
            >
              <motion.path
                d="M20 80 Q40 50 80 45 Q120 40 160 45 Q200 50 220 70"
                stroke="#06b6d4"
                strokeWidth="2.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
              <motion.path
                d="M60 45 Q80 25 120 20 Q160 25 180 45"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="70" cy="82" r="8"
                stroke="#06b6d4" strokeWidth="2" fill="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 }}
              />
              <motion.circle
                cx="190" cy="82" r="8"
                stroke="#06b6d4" strokeWidth="2" fill="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 }}
              />
            </motion.svg>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <svg className="h-12 mx-auto mb-4" viewBox="0 0 520 160" xmlns="http://www.w3.org/2000/svg" fill="none">
                <defs>
                  <linearGradient id="preloaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4"/>
                    <stop offset="100%" stopColor="#3b82f6"/>
                  </linearGradient>
                </defs>
                <text x="60" y="140" fontFamily="Outfit, Poppins, Inter, sans-serif" fontSize="42" fontWeight="600" fill="white">
                  Auto<tspan fill="url(#preloaderGrad)">Vista</tspan>
                </text>
                <text x="62" y="155" fontFamily="Outfit, Inter, sans-serif" fontSize="13" fill="#94a3b8" letterSpacing="1">
                  INTELLIGENT CAR DISCOVERY
                </text>
              </svg>
            </motion.div>

            {/* Progress Bar */}
            <div className="w-48 mx-auto mt-6">
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <motion.p
                className="text-xs text-gray-500 mt-2 tracking-widest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {progress}%
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
