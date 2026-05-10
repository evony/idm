'use client'

import { motion } from 'framer-motion'
import { Users, Swords, Flame, Crown } from 'lucide-react'
import type { StatsData } from '@/lib/types'
import { formatRupiah } from '@/lib/types'
import { cdnImage } from '@/lib/utils'
import {
  useTilt,
  getDivisionTextColor,
  getDivisionGlow,
  getDivisionGradient,
  iosCardVariants,
} from '@/hooks/use-3d'

interface StatsCardsProps {
  stats: StatsData | null
  division: string
}

function StatCard({
  icon: Icon,
  label,
  displayValue,
  sub,
  image,
  division,
  index,
}: {
  icon: React.ElementType
  label: string
  displayValue: string
  sub?: string
  image: string
  division: string
  index: number
}) {
  const { ref, style, handlers } = useTilt<HTMLDivElement>({ maxTilt: 6, scale: 1.03 })
  const textColor = getDivisionTextColor(division)
  const glowBox = getDivisionGlow(division)
  const bgGradient = getDivisionGradient(division)

  return (
    <motion.div
      ref={ref}
      style={style}
      {...handlers}
      variants={iosCardVariants.item}
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card p-5 md:p-6 cursor-default transition-shadow duration-300 hover:border-border`}
      onMouseEnter={(e) => {
        handlers.onMouseMove(e)
      }}
      onMouseLeave={handlers.onMouseLeave}
    >
      {/* Full image background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{ backgroundImage: `url('${image}')` }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/15" />

      {/* Division accent gradient from left */}
      <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient}`} />

      {/* Top-edge accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Hover glow shadow */}
      <div
        className="absolute inset-0 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: glowBox }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon with division color */}
        <div className="mb-3">
          <Icon className={`h-5 w-5 ${textColor}`} />
        </div>

        {/* Value — large bold */}
        <div className={`text-2xl font-extrabold tracking-tight text-foreground mb-0.5`}>
          {displayValue}
        </div>

        {/* Label — small uppercase */}
        <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
          {label}
        </div>

        {/* Sub text */}
        {sub && (
          <div className="text-[10px] text-muted-foreground/40 font-medium">
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function StatsCards({ stats, division }: StatsCardsProps) {
  const playerCount = division === 'MALE'
    ? stats?.players.male || 0
    : division === 'FEMALE'
    ? stats?.players.female || 0
    : stats?.players.total || 0

  const playerLabel = division === 'SEMUA'
    ? `${stats?.players.male || 0}M / ${stats?.players.female || 0}F`
    : `${playerCount}`

  const cards = [
    {
      icon: Users,
      label: 'Total Pemain',
      displayValue: playerLabel,
      sub: division === 'SEMUA' ? `${stats?.players.total} Total` : undefined,
      image: cdnImage('/images/tournament-arena.png'),
    },
    {
      icon: Crown,
      label: 'Total Klub',
      displayValue: `${stats?.clubs.total || 0}`,
      sub: undefined,
      image: cdnImage('/images/club-banner-1.png'),
    },
    {
      icon: Swords,
      label: 'Total Match',
      displayValue: `${stats?.matches.completed || 0}`,
      sub: `${stats?.matches.pending || 0} pending`,
      image: cdnImage('/images/match-versus.png'),
    },
    {
      icon: Flame,
      label: 'Prize Pool',
      displayValue: formatRupiah(stats?.prizePool.total || 0),
      sub: 'IDR Total',
      image: cdnImage('/images/sawer-live.png'),
    },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      variants={iosCardVariants.container}
      initial="initial"
      animate="animate"
    >
      {cards.map((card, i) => (
        <StatCard
          key={card.label}
          icon={card.icon}
          label={card.label}
          displayValue={card.displayValue}
          sub={card.sub}
          image={card.image}
          division={division}
          index={i}
        />
      ))}
    </motion.div>
  )
}
