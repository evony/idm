'use client';

import { motion } from 'framer-motion';
import { Star, Crown } from 'lucide-react';

interface MVPSpotlightProps {
  gamertag: string;
  avatar?: string | null;
  division: 'male' | 'female';
  stats?: {
    matches?: number;
    wins?: number;
    mvps?: number;
  };
  tournamentName?: string;
  className?: string;
}

export function MVPSpotlight({
  gamertag,
  avatar,
  division,
  stats,
  tournamentName,
  className = '',
}: MVPSpotlightProps) {
  const accentColor = division === 'male' ? '#22d3ee' : '#c084fc';

  return (
    <motion.div
      className={`mvp-spotlight relative rounded-2xl p-6 overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Spotlight glow background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${accentColor}40 0%, transparent 60%)`,
        }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#d4a853]"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [-20, -40],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* MVP Badge */}
        <motion.div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4a853]/10 border border-[#d4a853]/30 mb-4"
          animate={{ boxShadow: ['0 0 0 rgba(212,168,83,0)', '0 0 20px rgba(212,168,83,0.3)', '0 0 0 rgba(212,168,83,0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Star className="w-3.5 h-3.5 text-[#d4a853] fill-[#d4a853]" />
          <span className="text-xs font-bold text-[#d4a853] uppercase tracking-wider">
            MVP
          </span>
        </motion.div>

        {/* Avatar with crown */}
        <div className="relative inline-block mb-3">
          <motion.div
            className="w-24 h-24 rounded-full overflow-hidden border-4"
            style={{ borderColor: accentColor }}
            animate={{ boxShadow: ['0 0 0 rgba(212,168,83,0)', '0 0 30px rgba(212,168,83,0.4)'] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={gamertag}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                {gamertag.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>

          {/* Crown */}
          <motion.div
            className="absolute -top-3 left-1/2 -translate-x-1/2"
            animate={{ y: [0, -5, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Crown className="w-8 h-8 text-[#d4a853] drop-shadow-[0_0_10px_rgba(212,168,83,0.5)]" />
          </motion.div>
        </div>

        {/* Name */}
        <motion.h3
          className="text-xl font-black mb-1"
          style={{ color: accentColor }}
          animate={{ textShadow: ['0 0 0 transparent', `0 0 20px ${accentColor}40`, '0 0 0 transparent'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {gamertag}
        </motion.h3>

        {/* Tournament name */}
        {tournamentName && (
          <p className="text-xs text-muted-foreground mb-3">{tournamentName}</p>
        )}

        {/* Stats */}
        {stats && (
          <div className="flex items-center justify-center gap-4 mt-3">
            {stats.matches !== undefined && (
              <div className="text-center">
                <div className="text-lg font-bold">{stats.matches}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Matches</div>
              </div>
            )}
            {stats.wins !== undefined && (
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{stats.wins}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Wins</div>
              </div>
            )}
            {stats.mvps !== undefined && (
              <div className="text-center">
                <div className="text-lg font-bold text-[#d4a853]">{stats.mvps}</div>
                <div className="text-[10px] text-muted-foreground uppercase">MVPs</div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Mini MVP badge for cards
export function MVPBadge({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4a853]/10 border border-[#d4a853]/30 ${className}`}
      animate={{ boxShadow: ['0 0 0 rgba(212,168,83,0)', '0 0 10px rgba(212,168,83,0.3)', '0 0 0 rgba(212,168,83,0)'] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Star className="w-3 h-3 text-[#d4a853] fill-[#d4a853]" />
      <span className="text-[10px] font-bold text-[#d4a853]">MVP</span>
    </motion.div>
  );
}
