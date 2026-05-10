'use client';

import { motion } from 'framer-motion';
import { Crown, Flame } from 'lucide-react';
import { TierBadge } from './tier-badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';
import { getAvatarUrl } from '@/lib/utils';

interface PlayerCardProps {
  gamertag: string;
  avatar?: string | null;
  tier: string;
  points: number;
  totalWins: number;
  totalMvp: number;
  streak: number;
  rank?: number;
  isMvp?: boolean;
  club?: string;
  onClick?: () => void;
}

export function PlayerCard({
  gamertag, avatar, tier, points, totalWins, totalMvp, streak, rank, isMvp, club, onClick
}: PlayerCardProps) {
  const isChampion = rank === 1;
  const isTop3 = rank !== undefined && rank <= 3;
  const dt = useDivisionTheme();
  const division = useAppStore(s => s.division);
  const avatarSrc = getAvatarUrl(gamertag, division, avatar);

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative rounded-2xl cursor-pointer transition-all overflow-hidden ${
        isChampion ? dt.neonPulse : ''
      }`}
      style={{ aspectRatio: '3/4' }}
    >
      {/* Full avatar card background */}
      <img src={avatarSrc} alt={gamertag} className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105" />

      {/* Dark overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a06]/30 via-transparent to-transparent" />

      {/* Division color tint overlay */}
      <div className="absolute inset-0" style={{
        background: division === 'male'
          ? 'radial-gradient(ellipse at 50% 30%, rgba(34,211,238,0.08) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 50% 30%, rgba(192,132,252,0.08) 0%, transparent 60%)'
      }} />

      {/* Tier-colored top accent line */}
      <div className={`absolute top-0 inset-x-0 h-1 ${
        isChampion ? 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent' :
        tier === 'S' ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' :
        tier === 'A' ? 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent' :
        'bg-gradient-to-r from-transparent via-green-500 to-transparent'
      }`} />

      {/* Rank badge top-right */}
      {isTop3 && (
        <div className="absolute top-2 right-2 z-10">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
            rank === 1 ? 'bg-yellow-500/25 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]' :
            rank === 2 ? 'bg-gray-400/25 text-gray-300' :
            'bg-amber-600/25 text-amber-500'
          }`}>
            {rank}
          </div>
        </div>
      )}

      {/* MVP indicator top-left */}
      {isMvp && (
        <div className="absolute top-2 left-2 z-10">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
          </div>
        </div>
      )}

      {/* Champion glow border */}
      {isChampion && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-yellow-500/30"
          animate={{ borderColor: ['rgba(234,179,8,0.2)', 'rgba(234,179,8,0.5)', 'rgba(234,179,8,0.2)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 inset-x-0 p-3 z-10">
        {/* Gamertag */}
        <p className={`font-bold text-sm truncate text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${
          isChampion ? 'text-yellow-300' : ''
        }`}>{gamertag}</p>

        {/* Tier + Club */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <TierBadge tier={tier} />
          {club && <span className="text-[9px] text-white/50 truncate">{club}</span>}
        </div>

        {/* Stats row */}
        <div className={`flex items-center gap-2 mt-2 pt-2 border-t border-white/10`}>
          <span className={`text-[10px] font-bold ${dt.text}`}>{points}<span className="text-[8px] opacity-50 ml-0.5">pts</span></span>
          <span className="text-[10px] text-white/20">·</span>
          <span className="text-[10px] font-bold text-green-400">{totalWins}W</span>
          <span className="text-[10px] text-white/20">·</span>
          <div className="flex items-center gap-0.5">
            {streak > 1 && <Flame className="w-2.5 h-2.5 text-orange-400" />}
            <span className="text-[10px] font-bold">{streak > 1 ? streak : totalMvp}</span>
            <span className="text-[8px] text-white/40 ml-0.5">{streak > 1 ? 'STREAK' : 'MVP'}</span>
          </div>
        </div>
      </div>

      {/* Hover border glow */}
      <div className={`absolute inset-0 rounded-2xl border transition-all duration-300 ${
        division === 'male' ? 'border-[#06b6d4]/0 hover:border-[#06b6d4]/30' : 'border-[#a855f7]/0 hover:border-[#a855f7]/30'
      }`} />
    </motion.div>
  );
}
