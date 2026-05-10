'use client'

import { motion } from 'framer-motion'
import { User, Trophy, Flame, Swords, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PlayerData } from '@/lib/types'
import { tierColor } from '@/lib/types'
import { getTierAvatarUrl, cdnImage } from '@/lib/utils'

interface PlayerListProps {
  players: PlayerData[]
  division: string
}

function getDivisionTheme(division: string) {
  if (division === 'MALE') {
    return {
      iconBg: 'bg-idm-male/10', iconBorder: 'border-idm-male/15', iconColor: 'text-idm-male',
      points: 'text-idm-male/70', wins: 'text-sky-400/60', losses: 'text-slate-400/40', streak: 'text-idm-male-light/70',
      topAccent: ['bg-gradient-to-r from-idm-male via-idm-male to-idm-male/20', 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300/20', 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-400/20'],
      glow: ['hover:shadow-[0_4px_20px_rgba(46,159,255,0.12)]', 'hover:shadow-md', 'hover:shadow-[0_4px_14px_rgba(56,189,248,0.08)]'],
    }
  }
  if (division === 'FEMALE') {
    return {
      iconBg: 'bg-pink-300/10', iconBorder: 'border-pink-300/15', iconColor: 'text-pink-300',
      points: 'text-pink-300/70', wins: 'text-rose-300/60', losses: 'text-slate-400/40', streak: 'text-pink-200/70',
      topAccent: ['bg-gradient-to-r from-pink-300 via-pink-400 to-pink-300/20', 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300/20', 'bg-gradient-to-r from-rose-300 via-rose-400 to-rose-300/20'],
      glow: ['hover:shadow-[0_4px_20px_rgba(249,168,212,0.12)]', 'hover:shadow-md', 'hover:shadow-[0_4px_14px_rgba(253,164,175,0.08)]'],
    }
  }
  return {
    iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/15', iconColor: 'text-emerald-400',
    points: 'text-emerald-400/70', wins: 'text-teal-400/60', losses: 'text-slate-400/40', streak: 'text-emerald-300/70',
    topAccent: ['bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400/20', 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300/20', 'bg-gradient-to-r from-teal-400 via-teal-500 to-teal-400/20'],
    glow: ['hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)]', 'hover:shadow-md', 'hover:shadow-[0_4px_14px_rgba(45,212,191,0.08)]'],
  }
}

function getAvatarBorder(tier: string) {
  switch (tier) {
    case 'S': return 'ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
    case 'A': return 'ring-2 ring-slate-300/50 shadow-[0_0_6px_rgba(203,213,225,0.08)]'
    case 'B': return 'ring-2 ring-orange-400/30'
    default: return 'ring-2 ring-border/50'
  }
}

function getAvatarFallbackBg(tier: string) {
  switch (tier) {
    case 'S': return 'bg-gradient-to-br from-amber-500/20 to-amber-600/10'
    case 'A': return 'bg-gradient-to-br from-slate-300/15 to-slate-400/10'
    case 'B': return 'bg-gradient-to-br from-orange-400/15 to-orange-500/10'
    default: return 'bg-muted/40'
  }
}

function getAvatarFallbackText(tier: string) {
  switch (tier) {
    case 'S': return 'text-amber-300'
    case 'A': return 'text-slate-200'
    case 'B': return 'text-orange-300'
    default: return 'text-muted-foreground/60'
  }
}

function getTopRankBadge(index: number) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return null
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function PlayerList({ players, division }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => b.totalPoints - a.totalPoints)
  const theme = getDivisionTheme(division)

  if (players.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-3xl border border-border bg-card p-10 text-center"
      >
        <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-muted-foreground/35 text-sm font-medium">Belum ada pemain</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: '1000px' }}
      className="rounded-3xl border border-border overflow-hidden bg-card"
    >
      {/* Frosted glass header with User icon */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${cdnImage('/images/player-banner-2.png')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/50" />

        <div className="relative px-5 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 5 }}
              transition={springTransition}
              className={`flex items-center justify-center w-10 h-10 rounded-2xl ${theme.iconBg} backdrop-blur-xl border ${theme.iconBorder}`}
            >
              <User className={`h-5 w-5 ${theme.iconColor}`} />
            </motion.div>
            <div>
              <h3 className="font-bold text-base text-foreground tracking-tight">
                Pemain {division === 'MALE' ? '♂' : '♀'}
              </h3>
              <span className="text-[11px] text-muted-foreground/50">
                {players.length} terdaftar
              </span>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px] border-border/50 text-muted-foreground/50 bg-background/20 backdrop-blur-xl px-2.5">
              {players.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Player grid — 1/2/3 columns responsive */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedPlayers.slice(0, 12).map((player, i) => {
            const topBadge = getTopRankBadge(i)
            const isTop3 = i < 3 && player.totalPoints > 0

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: i * 0.03 }}
                whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                className={`group relative rounded-2xl border border-border/50 bg-muted/10 p-4 cursor-default transition-shadow duration-300 ${isTop3 ? theme.glow[i] : 'hover:shadow-md'}`}
              >
                {/* Top rank accent bar — division colored */}
                {isTop3 && (
                  <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl ${theme.topAccent[i]}`} />
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar image */}
                    <div className={`relative w-11 h-11 rounded-full overflow-hidden ${getAvatarBorder(player.tier)}`}>
                      <img
                        src={getTierAvatarUrl(division === 'FEMALE' ? 'female' : 'male', player.tier)}
                        alt={player.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div
                        className={`absolute inset-0 w-11 h-11 rounded-full items-center justify-center text-sm font-bold ${getAvatarFallbackBg(player.tier)} ${getAvatarFallbackText(player.tier)}`}
                        style={{ display: 'none' }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {topBadge && <span className="text-sm">{topBadge}</span>}
                        <p className={`text-sm truncate max-w-[130px] ${
                          isTop3 ? 'font-bold text-foreground' : 'font-medium text-foreground/75'
                        }`}>
                          {player.name}
                        </p>
                      </div>
                      {player.clubName && (
                        <p className="text-[11px] text-muted-foreground/40 mt-0.5">{player.clubName}</p>
                      )}
                    </div>
                  </div>
                  {/* Tier badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierColor(player.tier)}`}>
                    {player.tier}
                  </span>
                </div>

                {/* Stats row with division colors */}
                <div className="flex items-center gap-4 text-[11px]">
                  <div className={`flex items-center gap-1 ${theme.points}`}>
                    <Trophy className="h-3 w-3" />
                    <span className="font-medium tabular-nums">{player.totalPoints}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${theme.wins}`}>
                    <Swords className="h-3 w-3" />
                    <span className="tabular-nums">{player.totalWins}W</span>
                  </div>
                  <div className={`flex items-center gap-1 ${theme.losses}`}>
                    <Shield className="h-3 w-3" />
                    <span className="tabular-nums">{player.totalLosses}L</span>
                  </div>
                  {player.streak > 0 && (
                    <div className={`flex items-center gap-1 ${theme.streak}`}>
                      <Flame className="h-3 w-3" />
                      <span className="tabular-nums">{player.streak}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
        {players.length > 12 && (
          <p className="text-center text-xs text-muted-foreground/30 mt-4">
            + {players.length - 12} pemain lainnya
          </p>
        )}
      </div>
    </motion.div>
  )
}
