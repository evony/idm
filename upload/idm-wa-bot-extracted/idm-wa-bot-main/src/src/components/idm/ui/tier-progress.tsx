'use client';

import { motion } from 'framer-motion';

interface TierProgressProps {
  currentPoints: number;
  tier: 'S' | 'A' | 'B';
  previousTier?: 'S' | 'A' | 'B';
  showAnimation?: boolean;
  className?: string;
}

const TIER_THRESHOLDS = {
  B: { min: 0, max: 499, next: 'A', color: '#94a3b8' },
  A: { min: 500, max: 999, next: 'S', color: '#22c55e' },
  S: { min: 1000, max: Infinity, next: null, color: '#d4a853' },
};

const TIER_ORDER = ['B', 'A', 'S'];

export function TierProgress({
  currentPoints,
  tier,
  previousTier,
  showAnimation = true,
  className = '',
}: TierProgressProps) {
  const tierInfo = TIER_THRESHOLDS[tier];
  const progress =
    tier === 'S'
      ? 100
      : ((currentPoints - tierInfo.min) / (tierInfo.max - tierInfo.min + 1)) * 100;

  const isUpgrading = previousTier && TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(previousTier);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-black"
            style={{ color: tierInfo.color }}
          >
            {tier}
          </span>
          <span className="text-xs text-muted-foreground">TIER</span>
        </div>
        <div className="text-sm">
          <span className="font-bold">{currentPoints}</span>
          <span className="text-muted-foreground"> pts</span>
          {tier !== 'S' && (
            <span className="text-xs text-muted-foreground ml-1">
              / {tierInfo.max + 1}
            </span>
          )}
        </div>
      </div>

      <div className="relative h-2 bg-background rounded-full overflow-hidden border border-border">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: tierInfo.color }}
          initial={showAnimation ? { width: 0 } : false}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Glow effect */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full tier-progress-glow"
          style={{ color: tierInfo.color }}
          initial={showAnimation ? { width: 0 } : false}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {tier !== 'S' && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{tierInfo.min} pts</span>
          <span>→ {tierInfo.next}</span>
          <span>{tierInfo.max + 1} pts</span>
        </div>
      )}

      {/* Tier Up Animation */}
      {isUpgrading && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-3xl mb-1"
            >
              ⬆️
            </motion.div>
            <div className="text-sm font-bold text-[#d4a853]">TIER UP!</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Mini version for cards
export function TierProgressMini({
  currentPoints,
  tier,
  className = '',
}: {
  currentPoints: number;
  tier: 'S' | 'A' | 'B';
  className?: string;
}) {
  const tierInfo = TIER_THRESHOLDS[tier];
  const progress =
    tier === 'S'
      ? 100
      : ((currentPoints - tierInfo.min) / (tierInfo.max - tierInfo.min + 1)) * 100;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="text-xs font-bold"
        style={{ color: tierInfo.color }}
      >
        {tier}
      </span>
      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: tierInfo.color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{currentPoints}</span>
    </div>
  );
}
