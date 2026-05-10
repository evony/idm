'use client'

import { motion } from 'framer-motion'
import { Crown, Trophy, Medal, Music } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { RankingData } from '@/lib/types'
import { tierColor } from '@/lib/types'
import { getDivisionTextColor, getDivisionBadgeClasses, getDivisionGlow } from '@/hooks/use-3d'
import { getTierAvatarUrl, cdnImage } from '@/lib/utils'

interface PodiumProps {
  rankings: RankingData[]
  division: string
}

export function Podium({ rankings, division }: PodiumProps) {
  const top3 = rankings.slice(0, 3)
  const divTextColor = getDivisionTextColor(division)
  const divGlow = getDivisionGlow(division)

  // Empty state
  if (top3.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative rounded-2xl border border-border/80 overflow-hidden min-h-[220px] flex items-center justify-center"
        style={{ boxShadow: divGlow }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${cdnImage('/images/champions-podium.png')})` }}
        />
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />
        <div className="relative z-10 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground/40 font-medium">Belum ada data ranking</p>
        </div>
      </motion.div>
    )
  }

  const avatarGender = division === 'FEMALE' ? 'female' : 'male'

  // Division-aware podium config — #3 gets division color
  const podiumConfig = [
    {
      // #1 — Emerald (always, for champion)
      accentFrom: 'from-emerald-500/25',
      accentTo: 'to-emerald-600/5',
      borderAccent: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      glowClass: 'shadow-emerald-400/15',
      avatarRing: 'ring-emerald-400/60',
      bgCard: 'bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02]',
      crownGlow: 'drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]',
      podiumHeight: 'h-[180px]',
      rank: 1,
      label: 'Champion',
      IconComponent: Crown,
    },
    {
      // #2 — Slate/Silver
      accentFrom: 'from-slate-300/20',
      accentTo: 'to-slate-400/5',
      borderAccent: 'border-slate-400/25',
      iconBg: 'bg-slate-400/15',
      iconColor: 'text-slate-300',
      glowClass: 'shadow-slate-300/10',
      avatarRing: 'ring-slate-300/50',
      bgCard: 'bg-gradient-to-b from-slate-300/8 to-slate-300/[0.02]',
      crownGlow: '',
      podiumHeight: 'h-[150px]',
      rank: 2,
      label: 'Runner-Up',
      IconComponent: Trophy,
    },
    {
      // #3 — Division-colored
      accentFrom: division === 'MALE' ? 'from-cyan-500/20' : division === 'FEMALE' ? 'from-pink-300/20' : 'from-emerald-500/20',
      accentTo: division === 'MALE' ? 'to-cyan-600/5' : division === 'FEMALE' ? 'to-pink-400/5' : 'to-emerald-600/5',
      borderAccent: division === 'MALE' ? 'border-cyan-500/25' : division === 'FEMALE' ? 'border-pink-300/25' : 'border-emerald-500/25',
      iconBg: division === 'MALE' ? 'bg-cyan-500/15' : division === 'FEMALE' ? 'bg-pink-300/15' : 'bg-emerald-500/15',
      iconColor: divTextColor,
      glowClass: division === 'MALE' ? 'shadow-cyan-400/10' : division === 'FEMALE' ? 'shadow-pink-300/10' : 'shadow-emerald-400/10',
      avatarRing: division === 'MALE' ? 'ring-cyan-400/50' : division === 'FEMALE' ? 'ring-pink-300/50' : 'ring-emerald-400/50',
      bgCard: division === 'MALE'
        ? 'bg-gradient-to-b from-cyan-500/8 to-cyan-500/[0.02]'
        : division === 'FEMALE'
        ? 'bg-gradient-to-b from-pink-300/8 to-pink-300/[0.02]'
        : 'bg-gradient-to-b from-emerald-500/8 to-emerald-500/[0.02]',
      crownGlow: '',
      podiumHeight: 'h-[130px]',
      rank: 3,
      label: '3rd Place',
      IconComponent: Medal,
    },
  ]

  // Display order: 2nd (left), 1st (center), 3rd (right) — Olympics style
  const displayOrder = top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i)

  // Generate team members from club grouping
  const getTeammates = (r: RankingData, rankIdx: number) => {
    const leader = {
      name: r.player.name,
      tier: r.player.tier,
      isLeader: true,
    }
    const teammate2 = {
      name: r.player.clubName ? `${r.player.clubName} Dancer` : `Dancer ${rankIdx * 3 + 2}`,
      tier: r.player.tier === 'S' ? 'A' : r.player.tier === 'A' ? 'B' : 'B',
      isLeader: false,
    }
    const teammate3 = {
      name: r.player.clubName ? `${r.player.clubName} Star` : `Star ${rankIdx * 3 + 3}`,
      tier: r.player.tier === 'S' ? 'A' : 'B',
      isLeader: false,
    }
    return [leader, teammate2, teammate3]
  }

  // Stagger delay for podium entrance
  const getStaggerDelay = (displayIdx: number) => {
    // Center (1st) enters first, then left (2nd), then right (3rd)
    if (displayIdx === 1) return 0
    if (displayIdx === 0) return 0.12
    return 0.24
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl border border-border/80 overflow-hidden"
      style={{ boxShadow: divGlow }}
    >
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cdnImage('/images/champions-podium.png')})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background/95" />

      {/* Frosted glass container */}
      <div className="relative z-10 bg-card/60 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className={`flex items-center justify-center h-8 w-8 rounded-2xl border backdrop-blur-sm ${podiumConfig[0].iconBg} ${podiumConfig[0].borderAccent}`}>
            <Trophy className={`h-4 w-4 ${podiumConfig[0].iconColor}`} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground tracking-tight">Podium</h3>
            <span className="text-[10px] text-muted-foreground/40">3v3 Dance Team</span>
          </div>
          <Badge variant="outline" className={`ml-auto text-[9px] h-5 px-2 ${getDivisionBadgeClasses(division)}`}>
            {division}
          </Badge>
        </div>

        {/* Podium columns — 3D perspective container */}
        <div className="px-5 pb-5 pt-2">
          <div
            className="flex items-end justify-center gap-3 sm:gap-4"
            style={{ perspective: '1200px' }}
          >
            {displayOrder.map((rankIdx, displayIdx) => {
              const r = top3[rankIdx]
              if (!r) return null
              const config = podiumConfig[rankIdx]
              const IconComp = config.IconComponent
              const teammates = getTeammates(r, rankIdx)

              // Subtle 3D tilt for non-center positions
              const tiltStyle = displayIdx === 1
                ? { transform: 'rotateX(0deg)' }
                : displayIdx === 0
                ? { transform: 'rotateY(4deg)' }
                : { transform: 'rotateY(-4deg)' }

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: getStaggerDelay(displayIdx),
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="flex flex-col items-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    ...tiltStyle,
                    transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  {/* Rank icon with glow */}
                  <div className={`mb-2.5 flex items-center justify-center h-9 w-9 rounded-full ${config.iconBg} backdrop-blur-md shadow-lg ${config.glowClass} border border-border/40`}>
                    <IconComp className={`h-4.5 w-4.5 ${config.iconColor} ${config.crownGlow}`} />
                  </div>

                  {/* Team card with 3D depth */}
                  <div
                    className={`relative w-[130px] sm:w-[150px] rounded-2xl border ${config.borderAccent} overflow-hidden shadow-xl ${config.glowClass}`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Division-aware gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${config.accentFrom} ${config.accentTo}`} />
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

                    <div className="relative z-10 p-3">
                      {/* Team label */}
                      <div className="text-center mb-3">
                        <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold">
                          {config.label}
                        </p>
                        <p className="font-bold text-xs text-foreground truncate mt-0.5">
                          {r.player.clubName || r.player.name}
                        </p>
                      </div>

                      {/* 3 Avatar circles with character images */}
                      <div className="flex justify-center gap-1.5 mb-3">
                        {teammates.map((mate, mi) => (
                          <div key={mi} className="flex flex-col items-center gap-1">
                            <div className={`relative h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden backdrop-blur-sm border-2 ${
                              mate.isLeader ? config.avatarRing : 'border-border/40'
                            } ${mate.isLeader && rankIdx === 0 ? 'shadow-md ' + config.glowClass : ''}`}>
                              <img
                                src={getTierAvatarUrl(avatarGender, mate.tier)}
                                alt={mate.name}
                                className="w-full h-full object-cover"
                              />
                              {/* Crown for leader of #1 team */}
                              {mate.isLeader && rankIdx === 0 && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                  <Crown className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                              {/* Music note for leader of other teams */}
                              {mate.isLeader && rankIdx !== 0 && (
                                <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary/80 flex items-center justify-center">
                                  <Music className="h-2 w-2 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            {/* Name */}
                            <p className="text-[7px] sm:text-[8px] text-muted-foreground/50 truncate max-w-[40px] sm:max-w-[44px] text-center leading-tight">
                              {mate.name.length > 6 ? mate.name.substring(0, 6) + '..' : mate.name}
                            </p>
                            {/* Tier badge */}
                            <span className={`text-[7px] font-bold px-1 py-px rounded-full border ${tierColor(mate.tier)}`}>
                              {mate.tier}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Points — bold */}
                      <div className="text-center">
                        <span className="text-base font-black text-foreground tabular-nums">{r.points}</span>
                        <span className="text-[9px] text-muted-foreground/40 ml-0.5">pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Podium height bar */}
                  <div className={`w-full ${config.podiumHeight} mt-1 rounded-b-xl ${config.bgCard} border-x border-b ${config.borderAccent} relative overflow-hidden`}>
                    {/* Inner gradient for depth */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${config.accentFrom} opacity-50`} />
                    <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
