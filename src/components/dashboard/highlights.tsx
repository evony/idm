'use client'

import { motion } from 'framer-motion'
import { Star, Flame, Trophy } from 'lucide-react'
import type { PlayerData, MatchData } from '@/lib/types'
import { useTilt, getDivisionTextColor, getDivisionGlow, getDivisionGradient } from '@/hooks/use-3d'
import { cdnImage } from '@/lib/utils'

interface HighlightsProps {
  players: PlayerData[]
  matches: MatchData[]
  division: string
}

function HighlightCard({
  icon: Icon,
  label,
  value,
  sub,
  bgImage,
  iconColor,
  glowColor,
  gradientFrom,
  gradientVia,
  gradientTo,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  bgImage: string
  iconColor: string
  glowColor: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  delay: number
}) {
  const { ref, style, handlers } = useTilt<HTMLDivElement>({
    maxTilt: 6,
    scale: 1.03,
    speed: 400,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      ref={ref}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
      {...handlers}
      className="group relative min-h-[150px] rounded-2xl overflow-hidden border border-border/60 cursor-default"
    >
      {/* Image background with hover zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Bottom-heavy gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${gradientFrom} ${gradientVia} ${gradientTo}`} />

      {/* Shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      {/* Content with 3D depth */}
      <div className="relative z-10 flex flex-col justify-end h-full p-4 sm:p-5">
        {/* Icon with division-colored glow */}
        <div className="mb-auto">
          <div
            className={`inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-black/30 backdrop-blur-md shadow-xl ${glowColor} border border-border/40`}
            style={{ transform: 'translateZ(20px)' }}
          >
            <Icon className={`h-5 w-5 ${iconColor} drop-shadow-[0_0_8px_currentColor]`} />
          </div>
        </div>

        {/* Label */}
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1.5 font-semibold">
          {label}
        </p>
        {/* Value */}
        <p
          className="text-base sm:text-lg font-bold text-white truncate drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
          style={{ transform: 'translateZ(10px)' }}
        >
          {value}
        </p>
        {/* Sub */}
        <p className="text-[11px] text-white/50 mt-0.5 font-medium">{sub}</p>
      </div>
    </motion.div>
  )
}

export function Highlights({ players, matches, division }: HighlightsProps) {
  const divTextColor = getDivisionTextColor(division)
  const divGlow = getDivisionGlow(division)
  const _divGradient = getDivisionGradient(division)

  // Compute highlights data
  const mvpPlayer = [...players].sort((a, b) => b.mvpCount - a.mvpCount)[0]
  const streakPlayer = [...players].sort((a, b) => b.bestStreak - a.bestStreak)[0]
  const bestMatch = matches
    .filter(m => m.status === 'COMPLETED' && m.teams.length >= 2)
    .sort((a, b) => {
      const diffA = Math.abs((a.teams[0]?.score || 0) - (a.teams[1]?.score || 0))
      const diffB = Math.abs((b.teams[0]?.score || 0) - (b.teams[1]?.score || 0))
      return diffB - diffA
    })[0]

  // Division-aware theme for each card
  const theme = division === 'MALE'
    ? {
        h1: { iconColor: 'text-cyan-400', glowColor: 'shadow-cyan-400/25', gradientFrom: 'from-cyan-950/90', gradientVia: 'via-cyan-950/70', gradientTo: 'to-cyan-900/30' },
        h2: { iconColor: 'text-sky-400', glowColor: 'shadow-sky-400/25', gradientFrom: 'from-sky-950/90', gradientVia: 'via-sky-950/70', gradientTo: 'to-sky-900/30' },
        h3: { iconColor: 'text-cyan-300', glowColor: 'shadow-cyan-300/25', gradientFrom: 'from-cyan-950/90', gradientVia: 'via-cyan-950/70', gradientTo: 'to-cyan-900/30' },
      }
    : division === 'FEMALE'
    ? {
        h1: { iconColor: 'text-pink-300', glowColor: 'shadow-pink-300/25', gradientFrom: 'from-pink-950/90', gradientVia: 'via-pink-950/70', gradientTo: 'to-pink-900/30' },
        h2: { iconColor: 'text-rose-300', glowColor: 'shadow-rose-300/25', gradientFrom: 'from-rose-950/90', gradientVia: 'via-rose-950/70', gradientTo: 'to-rose-900/30' },
        h3: { iconColor: 'text-fuchsia-400', glowColor: 'shadow-fuchsia-400/25', gradientFrom: 'from-fuchsia-950/90', gradientVia: 'via-fuchsia-950/70', gradientTo: 'to-fuchsia-900/30' },
      }
    : {
        h1: { iconColor: 'text-emerald-400', glowColor: 'shadow-emerald-400/25', gradientFrom: 'from-emerald-950/90', gradientVia: 'via-emerald-950/70', gradientTo: 'to-emerald-900/30' },
        h2: { iconColor: 'text-teal-400', glowColor: 'shadow-teal-400/25', gradientFrom: 'from-teal-950/90', gradientVia: 'via-teal-950/70', gradientTo: 'to-teal-900/30' },
        h3: { iconColor: 'text-emerald-300', glowColor: 'shadow-emerald-300/25', gradientFrom: 'from-emerald-950/90', gradientVia: 'via-emerald-950/70', gradientTo: 'to-emerald-900/30' },
      }

  const highlights = [
    {
      icon: Star,
      label: 'MVP Terbanyak',
      value: mvpPlayer ? mvpPlayer.name : '-',
      sub: mvpPlayer ? `${mvpPlayer.mvpCount} MVP · Tier ${mvpPlayer.tier}` : 'No data',
      bgImage: cdnImage('/images/mvp-highlight.png'),
      ...theme.h1,
    },
    {
      icon: Flame,
      label: 'Best Streak',
      value: streakPlayer ? streakPlayer.name : '-',
      sub: streakPlayer ? `${streakPlayer.bestStreak} win streak` : 'No data',
      bgImage: cdnImage('/images/tournament-arena.png'),
      ...theme.h2,
    },
    {
      icon: Trophy,
      label: 'Best Match',
      value: bestMatch ? `R${bestMatch.round}M${bestMatch.matchNumber}` : '-',
      sub: bestMatch
        ? `${bestMatch.teams[0]?.score} - ${bestMatch.teams[1]?.score}`
        : 'No data',
      bgImage: cdnImage('/images/match-versus.png'),
      ...theme.h3,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative"
      style={{ boxShadow: divGlow }}
    >
      {/* 3-column grid of highlight cards with 3D tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {highlights.map((h, i) => (
          <HighlightCard
            key={h.label}
            icon={h.icon}
            label={h.label}
            value={h.value}
            sub={h.sub}
            bgImage={h.bgImage}
            iconColor={h.iconColor}
            glowColor={h.glowColor}
            gradientFrom={h.gradientFrom}
            gradientVia={h.gradientVia}
            gradientTo={h.gradientTo}
            delay={i * 0.1}
          />
        ))}
      </div>
    </motion.div>
  )
}
