'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Search, ArrowUpDown, Crown, Medal, Flame, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { RankingData } from '@/lib/types'
import { tierColor, divisionBadge } from '@/lib/types'
import { getDivisionTextColor, getDivisionBadgeClasses, getDivisionGlow, getDivisionGradient } from '@/hooks/use-3d'
import { getTierAvatarUrl, cdnImage } from '@/lib/utils'

interface LeaderboardProps {
  rankings: RankingData[]
  division: string
  title?: string
}

function getRankAccent(position: number | null, index: number, division: string) {
  const pos = position ?? index + 1
  // Division color for #3
  const divTextColor = division === 'MALE' ? 'cyan' : division === 'FEMALE' ? 'pink' : 'emerald'

  switch (pos) {
    case 1:
      return {
        row: 'bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent border-l-2 border-l-emerald-400',
        text: 'text-emerald-400',
        avatarRing: 'ring-2 ring-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        isGold: true,
      }
    case 2:
      return {
        row: 'bg-gradient-to-r from-slate-400/[0.06] via-slate-400/[0.02] to-transparent border-l-2 border-l-slate-300',
        text: 'text-slate-300',
        avatarRing: 'ring-2 ring-slate-300/40',
        isGold: false,
      }
    case 3:
      return {
        row: division === 'MALE'
          ? 'bg-gradient-to-r from-idm-male/[0.06] via-idm-male/[0.02] to-transparent border-l-2 border-l-idm-male'
          : division === 'FEMALE'
          ? 'bg-gradient-to-r from-pink-300/[0.06] via-pink-300/[0.02] to-transparent border-l-2 border-l-pink-300'
          : 'bg-gradient-to-r from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent border-l-2 border-l-emerald-400',
        text: divTextColor === 'cyan' ? 'text-idm-male' : divTextColor === 'pink' ? 'text-pink-300' : 'text-emerald-400',
        avatarRing: divTextColor === 'cyan'
          ? 'ring-2 ring-idm-male/40'
          : divTextColor === 'pink'
          ? 'ring-2 ring-pink-300/40'
          : 'ring-2 ring-emerald-400/40',
        isGold: false,
      }
    default:
      return {
        row: index % 2 === 0 ? 'bg-muted/[0.015]' : 'bg-transparent',
        text: 'text-muted-foreground/50',
        avatarRing: 'ring-1 ring-border/60',
        isGold: false,
      }
  }
}

function SortIcon({ field, currentField, currentDir }: { field: 'points' | 'wins' | 'mvpAwards'; currentField: 'points' | 'wins' | 'mvpAwards'; currentDir: 'asc' | 'desc' }) {
  if (currentField !== field) return <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
  return currentDir === 'desc'
    ? <ChevronDown className="h-2.5 w-2.5 text-emerald-400" />
    : <ChevronUp className="h-2.5 w-2.5 text-emerald-400" />
}

function RankIcon({ position, index }: { position: number | null; index: number }) {
  const pos = position ?? index + 1
  if (pos === 1) {
    return (
      <div className="relative">
        <Crown className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      </div>
    )
  }
  if (pos === 2) {
    return <Medal className="h-3.5 w-3.5 text-slate-300 drop-shadow-[0_0_4px_rgba(203,213,225,0.3)]" />
  }
  if (pos === 3) {
    return <Medal className="h-3.5 w-3.5 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" />
  }
  return null
}

export function Leaderboard({ rankings, division, title }: LeaderboardProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'points' | 'wins' | 'mvpAwards'>('points')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const divTextColor = getDivisionTextColor(division)
  const divBadgeClasses = getDivisionBadgeClasses(division)
  const divGlow = getDivisionGlow(division)
  const divGradient = getDivisionGradient(division)

  // Division-themed header accent
  const headerAccent = division === 'MALE'
    ? { iconBg: 'bg-idm-male/15', iconBorder: 'border-idm-male/20', iconColor: 'text-idm-male', searchFocus: 'focus-visible:ring-idm-male/20 focus-visible:border-idm-male/30' }
    : division === 'FEMALE'
    ? { iconBg: 'bg-pink-300/15', iconBorder: 'border-pink-300/20', iconColor: 'text-pink-300', searchFocus: 'focus-visible:ring-pink-300/20 focus-visible:border-pink-300/30' }
    : { iconBg: 'bg-emerald-500/15', iconBorder: 'border-emerald-500/20', iconColor: 'text-emerald-400', searchFocus: 'focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/30' }

  // Division-themed wins/losses colors
  const winsColor = division === 'MALE' ? 'text-idm-male/70' : division === 'FEMALE' ? 'text-pink-300/70' : 'text-emerald-400/70'
  const lossesColor = 'text-muted-foreground/40'

  const filtered = rankings
    .filter(r =>
      r.player.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.player.clubName || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      return (a[sortField] - b[sortField]) * mul
    })

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const avatarGender = division === 'FEMALE' ? 'female' : 'male'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-2xl border border-border/80 overflow-hidden"
      style={{ boxShadow: divGlow }}
    >
      {/* Frosted glass container */}
      <div className="relative bg-card/80 backdrop-blur-xl">
        {/* Subtle division gradient at top */}
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${divGradient}`} />

        {/* Header with frosted glass + background image */}
        <div className="relative overflow-hidden">
          {/* Background image layer */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${cdnImage('/images/leaderboard-bg.png')})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />

          <div className="relative px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Division-colored icon */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-2xl border backdrop-blur-sm ${headerAccent.iconBg} ${headerAccent.iconBorder}`}>
                  <Trophy className={`h-5 w-5 ${headerAccent.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground tracking-tight">
                    {title || 'Leaderboard'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground/60">
                      {division === 'MALE' ? '♂ Male' : division === 'FEMALE' ? '♀ Female' : '🌐 Semua'}
                    </span>
                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${divBadgeClasses}`}>
                      {division}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium search input with frosted glass */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <Input
                placeholder="Cari pemain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`h-8 pl-9 text-xs bg-background/40 backdrop-blur-md border-border/50 text-foreground/90 placeholder:text-muted-foreground/40 ${headerAccent.searchFocus} rounded-2xl`}
              />
            </div>
          </div>
        </div>

        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 bg-muted/[0.02]">
                <th className="text-left p-3 w-14">Rank</th>
                <th className="text-left p-3">Pemain</th>
                <th className="text-left p-3 hidden sm:table-cell">Klub</th>
                <th className="text-center p-3">Tier</th>
                <th
                  className="text-right p-3 cursor-pointer hover:text-foreground/60 transition-colors select-none"
                  onClick={() => toggleSort('points')}
                >
                  <span className="inline-flex items-center gap-1">
                    Poin <SortIcon field="points" currentField={sortField} currentDir={sortDir} />
                  </span>
                </th>
                <th
                  className="text-right p-3 cursor-pointer hover:text-foreground/60 transition-colors select-none"
                  onClick={() => toggleSort('wins')}
                >
                  <span className="inline-flex items-center gap-1">
                    W <SortIcon field="wins" currentField={sortField} currentDir={sortDir} />
                  </span>
                </th>
                <th className="text-right p-3">L</th>
                <th
                  className="text-right p-3 cursor-pointer hover:text-foreground/60 transition-colors select-none hidden sm:table-cell"
                  onClick={() => toggleSort('mvpAwards')}
                >
                  <span className="inline-flex items-center gap-1">
                    MVP <SortIcon field="mvpAwards" currentField={sortField} currentDir={sortDir} />
                  </span>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Table body with scroll */}
        <ScrollArea className="max-h-96">
          <table className="w-full">
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((r, i) => {
                  const accent = getRankAccent(r.position, i, division)
                  const pos = r.position ?? i + 1
                  const isTop3 = pos <= 3

                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.015, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={`border-b border-border/30 transition-colors group ${accent.row} hover:bg-muted/10`}
                    >
                      {/* Rank column */}
                      <td className="p-3 w-14">
                        <div className="flex items-center gap-1.5">
                          {isTop3 ? <RankIcon position={r.position} index={i} /> : null}
                          <span className={`text-sm font-bold tabular-nums ${accent.text}`}>
                            {pos}
                          </span>
                        </div>
                      </td>

                      {/* Player name with avatar */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar with game character image */}
                          <div className={`relative w-8 h-8 rounded-full overflow-hidden shrink-0 ${accent.avatarRing}`}>
                            <img
                              src={getTierAvatarUrl(avatarGender, r.player.tier)}
                              alt={r.player.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.classList.add('flex', 'items-center', 'justify-center')
                                  parent.style.backgroundColor = pos === 1
                                    ? 'rgba(16,185,129,0.2)'
                                    : pos === 2
                                    ? 'rgba(203,213,225,0.15)'
                                    : pos === 3
                                    ? division === 'MALE' ? 'rgba(46,159,255,0.15)' : division === 'FEMALE' ? 'rgba(249,168,212,0.15)' : 'rgba(16,185,129,0.15)'
                                    : 'rgba(0,0,0,0.08)'
                                }
                              }}
                            />
                            {/* Gold ring for #1 */}
                            {pos === 1 && (
                              <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-amber-400/40" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-sm transition-colors ${
                              isTop3 ? 'font-bold text-foreground' : 'font-medium text-foreground/80'
                            } group-hover:text-foreground`}>
                              {r.player.name}
                            </span>
                            {r.player.streak > 0 && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-emerald-400/80">
                                <Flame className="h-2.5 w-2.5" />{r.player.streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Club */}
                      <td className="p-3 text-xs text-muted-foreground/50 hidden sm:table-cell">
                        {r.player.clubName || '-'}
                      </td>

                      {/* Tier badge */}
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierColor(r.player.tier)}`}>
                          {r.player.tier}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="p-3 text-right">
                        <span className={`text-sm font-semibold tabular-nums ${
                          pos === 1 ? 'text-emerald-400' : 'text-foreground/80'
                        }`}>
                          {r.points}
                        </span>
                      </td>

                      {/* Wins */}
                      <td className={`p-3 text-right text-sm ${winsColor} tabular-nums font-medium`}>{r.wins}</td>

                      {/* Losses */}
                      <td className={`p-3 text-right text-sm ${lossesColor} tabular-nums`}>{r.losses}</td>

                      {/* MVP */}
                      <td className="p-3 text-right text-sm tabular-nums hidden sm:table-cell">
                        <span className={r.mvpAwards > 0 ? 'text-amber-400/80 font-semibold' : 'text-muted-foreground/40'}>
                          {r.mvpAwards}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground/30 text-sm">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Tidak ada data ranking</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </motion.div>
  )
}
