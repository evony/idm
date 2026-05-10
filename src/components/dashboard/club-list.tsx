'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, Crown, Trophy, Swords, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PlayerData } from '@/lib/types'
import { getTierAvatarUrl, cdnImage } from '@/lib/utils'

interface ClubListProps {
  players: PlayerData[]
  division: string
}

interface ClubInfo {
  name: string
  members: PlayerData[]
  totalPoints: number
  totalWins: number
  totalMatches: number
  winRate: number
}

function getDivisionTheme(division: string) {
  if (division === 'MALE') {
    return {
      iconBg: 'bg-idm-male/10', iconBorder: 'border-idm-male/15', iconColor: 'text-idm-male',
      statPts: 'text-idm-male/60', statWins: 'text-sky-400/60',
      accents: [
        { border: 'border-l-[3px] border-l-idm-male', topBar: 'bg-gradient-to-r from-idm-male via-idm-male to-idm-male/10', glow: 'hover:shadow-[0_4px_20px_rgba(46,159,255,0.12)]', progress: 'bg-gradient-to-r from-idm-male to-idm-male', rankColor: 'text-idm-male', icon: 'bg-idm-male/15 text-idm-male-light border-idm-male/20' },
        { border: 'border-l-[3px] border-l-slate-300', topBar: 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300/10', glow: 'hover:shadow-md', progress: 'bg-gradient-to-r from-slate-300 to-slate-400', rankColor: 'text-slate-300', icon: 'bg-slate-300/15 text-slate-200 border-slate-300/20' },
        { border: 'border-l-[3px] border-l-sky-400', topBar: 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-400/10', glow: 'hover:shadow-md', progress: 'bg-gradient-to-r from-sky-400 to-sky-500', rankColor: 'text-sky-400', icon: 'bg-sky-400/15 text-sky-300 border-sky-400/20' },
      ],
      default: { border: 'border-l-[3px] border-l-idm-male/20', topBar: '', glow: 'hover:shadow-sm', progress: 'bg-idm-male/40', rankColor: 'text-muted-foreground/35', icon: 'bg-muted/30 text-muted-foreground/50 border-border/40' },
    }
  }
  if (division === 'FEMALE') {
    return {
      iconBg: 'bg-pink-300/10', iconBorder: 'border-pink-300/15', iconColor: 'text-pink-300',
      statPts: 'text-pink-300/60', statWins: 'text-rose-300/60',
      accents: [
        { border: 'border-l-[3px] border-l-pink-300', topBar: 'bg-gradient-to-r from-pink-300 via-pink-400 to-pink-300/10', glow: 'hover:shadow-[0_4px_20px_rgba(249,168,212,0.12)]', progress: 'bg-gradient-to-r from-pink-300 to-pink-400', rankColor: 'text-pink-300', icon: 'bg-pink-300/15 text-pink-200 border-pink-300/20' },
        { border: 'border-l-[3px] border-l-slate-300', topBar: 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300/10', glow: 'hover:shadow-md', progress: 'bg-gradient-to-r from-slate-300 to-slate-400', rankColor: 'text-slate-300', icon: 'bg-slate-300/15 text-slate-200 border-slate-300/20' },
        { border: 'border-l-[3px] border-l-rose-300', topBar: 'bg-gradient-to-r from-rose-300 via-rose-400 to-rose-300/10', glow: 'hover:shadow-md', progress: 'bg-gradient-to-r from-rose-300 to-rose-400', rankColor: 'text-rose-300', icon: 'bg-rose-300/15 text-rose-200 border-rose-300/20' },
      ],
      default: { border: 'border-l-[3px] border-l-pink-300/20', topBar: '', glow: 'hover:shadow-sm', progress: 'bg-pink-300/40', rankColor: 'text-muted-foreground/35', icon: 'bg-muted/30 text-muted-foreground/50 border-border/40' },
    }
  }
  return {
    iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/15', iconColor: 'text-emerald-400',
    statPts: 'text-emerald-400/60', statWins: 'text-teal-400/60',
    accents: [
      { border: 'border-l-[3px] border-l-emerald-400', topBar: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400/10', glow: 'hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)]', progress: 'bg-gradient-to-r from-emerald-400 to-emerald-500', rankColor: 'text-emerald-400', icon: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
      { border: 'border-l-[3px] border-l-slate-300', topBar: 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300/10', glow: 'hover:shadow-md', progress: 'bg-gradient-to-r from-slate-300 to-slate-400', rankColor: 'text-slate-300', icon: 'bg-slate-300/15 text-slate-200 border-slate-300/20' },
      { border: 'border-l-[3px] border-l-teal-400', topBar: 'bg-gradient-to-r from-teal-400 via-teal-500 to-teal-400/10', glow: 'hover:shadow-md', progress: 'bg-gradient-to-r from-teal-400 to-teal-500', rankColor: 'text-teal-400', icon: 'bg-teal-400/15 text-teal-300 border-teal-400/20' },
    ],
    default: { border: 'border-l-[3px] border-l-emerald-500/20', topBar: '', glow: 'hover:shadow-sm', progress: 'bg-emerald-400/40', rankColor: 'text-muted-foreground/35', icon: 'bg-muted/30 text-muted-foreground/50 border-border/40' },
  }
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function ClubList({ players, division }: ClubListProps) {
  const clubs = useMemo(() => {
    const clubMap: Record<string, PlayerData[]> = {}
    for (const p of players) {
      const club = p.clubName || 'No Club'
      if (!clubMap[club]) clubMap[club] = []
      clubMap[club].push(p)
    }

    return Object.entries(clubMap)
      .map(([name, members]): ClubInfo => {
        const totalPoints = members.reduce((s, m) => s + m.totalPoints, 0)
        const totalWins = members.reduce((s, m) => s + m.totalWins, 0)
        const totalMatches = members.reduce((s, m) => s + m.totalWins + m.totalLosses, 0)
        const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0
        return { name, members, totalPoints, totalWins, totalMatches, winRate }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [players])

  const theme = getDivisionTheme(division)

  const getAccent = (index: number) => {
    if (index < 3) return theme.accents[index]
    return theme.default
  }

  const getWinRateColor = (rate: number) => {
    if (rate >= 60) {
      return division === 'MALE' ? 'text-idm-male' : division === 'FEMALE' ? 'text-pink-300' : 'text-emerald-400'
    }
    if (rate >= 40) return 'text-amber-400/70'
    return 'text-muted-foreground/40'
  }

  if (clubs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-3xl border border-border bg-card p-10 text-center"
      >
        <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-muted-foreground/35 text-sm font-medium">Belum ada klub</p>
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
      {/* Frosted glass header with Building2 icon */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${cdnImage('/images/club-banner-1.png')})` }}
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
              <Building2 className={`h-5 w-5 ${theme.iconColor}`} />
            </motion.div>
            <div>
              <h3 className="font-bold text-base text-foreground tracking-tight">
                Klub {division === 'MALE' ? '♂' : '♀'}
              </h3>
              <span className="text-[11px] text-muted-foreground/50">
                {clubs.length} klub aktif
              </span>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px] border-border/50 text-muted-foreground/50 bg-background/20 backdrop-blur-xl px-2.5">
              {clubs.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Club grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clubs.map((club, i) => {
            const accent = getAccent(i)
            const isTop = i === 0

            return (
              <motion.div
                key={club.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: i * 0.05 }}
                whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                className={`group relative rounded-2xl border border-border/40 bg-muted/8 p-4 cursor-default transition-shadow duration-300 ${accent.border} ${accent.glow}`}
              >
                {/* Top 3 accent bars */}
                {i < 3 && accent.topBar && (
                  <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl ${accent.topBar}`} />
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {/* Club icon */}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold border ${accent.icon}`}>
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isTop && <Crown className={`h-3.5 w-3.5 ${accent.rankColor}`} />}
                        <h4 className={`text-sm ${i < 3 ? 'font-bold text-foreground' : 'font-medium text-foreground/75'}`}>
                          {club.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Users className="h-3 w-3 text-muted-foreground/35" />
                        <span className="text-[11px] text-muted-foreground/45">{club.members.length} anggota</span>
                      </div>
                    </div>
                  </div>

                  {/* Rank */}
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold ${accent.rankColor}`}>
                      #{i + 1}
                    </span>
                    {isTop && (
                      <Badge className={`text-[8px] h-4 px-1.5 mt-0.5 ${
                        division === 'MALE' ? 'bg-idm-male/15 text-idm-male-light border-idm-male/20 hover:bg-idm-male/20'
                        : division === 'FEMALE' ? 'bg-pink-300/15 text-pink-200 border-pink-300/20 hover:bg-pink-300/20'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}>
                        TOP
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Win rate progress bar — division colored */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">Win Rate</span>
                    <span className={`text-[11px] font-bold tabular-nums ${getWinRateColor(club.winRate)}`}>
                      {club.winRate}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${club.winRate}%` }}
                      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.05 }}
                      className={`h-full rounded-full ${accent.progress}`}
                    />
                  </div>
                </div>

                {/* Mini member avatar circles + stats */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {club.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="w-5 h-5 rounded-full overflow-hidden border border-background ring-1 ring-border/30"
                        title={member.name}
                      >
                        <img
                          src={getTierAvatarUrl(division === 'FEMALE' ? 'female' : 'male', member.tier)}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {club.members.length > 5 && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold bg-muted/30 text-muted-foreground/40 border border-background ring-1 ring-border/30">
                        +{club.members.length - 5}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className={`flex items-center gap-1 ${theme.statPts}`}>
                      <Trophy className="h-2.5 w-2.5" />
                      <span className="tabular-nums">{club.totalPoints}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${theme.statWins}`}>
                      <Swords className="h-2.5 w-2.5" />
                      <span className="tabular-nums">{club.totalWins}W</span>
                    </div>
                    <span className="text-muted-foreground/30 tabular-nums">{club.totalMatches}M</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
