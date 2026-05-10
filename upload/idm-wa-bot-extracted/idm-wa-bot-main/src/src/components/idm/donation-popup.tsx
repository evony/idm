'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Trophy, Music, Crown, Flame } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Notification {
  id: string;
  type: 'donation' | 'match' | 'mvp' | 'streak' | 'victory';
  message: string;
}

const iconMap = {
  donation: Gift,
  match: Music,
  mvp: Crown,
  streak: Flame,
  victory: Trophy,
};

const glowMap = {
  donation: 'glow-gold',
  match: 'glow-amber',
  mvp: 'glow-gold',
  streak: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
  victory: 'glow-gold',
};

export function DonationPopup({ show, message, onClose }: { show: boolean; message: string; onClose: () => void }) {
  // Detect notification type from message
  const getType = (msg: string): Notification['type'] => {
    if (msg.includes('Donasi') || msg.includes('donation')) return 'donation';
    if (msg.includes('MVP')) return 'mvp';
    if (msg.includes('Streak') || msg.includes('🔥')) return 'streak';
    if (msg.includes('Victory') || msg.includes('Win')) return 'victory';
    return 'match';
  };

  const type = getType(message);
  const Icon = iconMap[type];
  const startTimeRef = useRef(Date.now());
  const [progress, setProgress] = useState(100);

  const stableOnClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!show) return;
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const duration = 5000;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        stableOnClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [show, stableOnClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed bottom-20 lg:bottom-6 left-1/2 z-50 glass ${glowMap[type]} rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg max-w-sm relative overflow-hidden`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            type === 'donation' ? 'bg-primary/10' :
            type === 'mvp' ? 'bg-yellow-500/10' :
            type === 'streak' ? 'bg-orange-500/10' :
            type === 'victory' ? 'bg-green-500/10' :
            'bg-idm-amber/10'
          }`}>
            <Icon className={`w-4 h-4 ${
              type === 'donation' ? 'text-primary' :
              type === 'mvp' ? 'text-yellow-500' :
              type === 'streak' ? 'text-orange-500' :
              type === 'victory' ? 'text-green-500' :
              'text-idm-amber'
            }`} />
          </div>
          <span className="text-sm font-medium">{message}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
          {/* Auto-dismiss progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/10 rounded-b-xl overflow-hidden">
            <motion.div
              className="h-full bg-primary/40"
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
