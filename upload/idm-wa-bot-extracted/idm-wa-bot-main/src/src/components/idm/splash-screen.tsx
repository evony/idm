'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const VIDEO_URL = 'https://res.cloudinary.com/dagoryri5/video/upload/v1775996353/40135b48f64f507a99eb4dfd7a012033_mbsiip.mp4';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    // Phase timeline: enter -> hold -> exit -> callback
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 3200);
    const t3 = setTimeout(() => onFinish(), 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {phase !== 'exit' || true ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === 'enter' ? 1 : phase === 'hold' ? 1 : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'exit' ? 0.7 : 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        >
          {/* Video Background */}
          <div className="absolute inset-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              onCanPlay={() => setVideoReady(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
              style={{ filter: 'brightness(0.35) saturate(1.3)' }}
            >
              <source src={VIDEO_URL} type="video/mp4" />
            </video>
            {/* Fallback gradient when video not loaded */}
            {!videoReady && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0a1628] to-[#0d1117] animate-pulse" />
            )}
          </div>

          {/* Dark overlay with vignette */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)'
          }} />

          {/* Teal/Purple ambient glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                'radial-gradient(ellipse at 30% 50%, rgba(184,134,11,0.08) 0%, transparent 60%)',
                'radial-gradient(ellipse at 70% 50%, rgba(245,158,11,0.08) 0%, transparent 60%)',
                'radial-gradient(ellipse at 30% 50%, rgba(184,134,11,0.08) 0%, transparent 60%)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center">

            {/* Main Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="mb-5"
            >
              <div className="relative">
                {/* Outer glow ring */}
                <motion.div
                  className="absolute -inset-4 rounded-3xl"
                  animate={{
                    boxShadow: [
                      '0 0 25px rgba(184,134,11,0.25), 0 0 60px rgba(184,134,11,0.08)',
                      '0 0 40px rgba(184,134,11,0.4), 0 0 80px rgba(245,158,11,0.15)',
                      '0 0 25px rgba(184,134,11,0.25), 0 0 60px rgba(184,134,11,0.08)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/30 backdrop-blur-sm">
                  <img src="/logo.webp" alt="IDM League" className="w-full h-full object-cover" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-center"
            >
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                <span className="text-gradient-fury">IDM</span>{' '}
                <span className="text-white">League</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="text-xs sm:text-sm text-white/50 mt-2 tracking-[0.25em] uppercase font-light"
              >
                Idol Meta · Fan Made Edition
              </motion.p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 1.4 }}
              className="mt-8 w-48 sm:w-64"
            >
              <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.2, delay: 1.4, ease: 'easeInOut' }}
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1.6 }}
                className="text-[10px] text-white/40 text-center mt-2 tracking-wider"
              >
                MEMASUKI ARENA
              </motion.p>
            </motion.div>
          </div>

          {/* Bottom corner branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 2 }}
            className="absolute bottom-6 right-6 flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-md overflow-hidden border border-white/20">
              <img src="/logo1.webp" alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[9px] text-white/30 tracking-widest uppercase">Season 1</span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
