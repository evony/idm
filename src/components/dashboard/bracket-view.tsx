'use client'

import { motion } from 'framer-motion'
import { GitBranch, Star } from 'lucide-react'
import type { MatchData } from '@/lib/types'
import { cdnImage } from '@/lib/utils'

interface BracketViewProps {
  matches: MatchData[]
  teams: { id: string; name: string; color: string | null; participants: { player: { name: string; tier: string } }[] }[]
  division?: string
}

function getDivisionTheme(division?: string) {
  if (division === 'MALE') {
    return {
      iconBg: 'bg-cyan-500/10', iconBorder: 'border-cyan-500/15', iconColor: 'text-cyan-400',
      winAccent: 'bg-cyan-400/60', winText: 'text-cyan-400/80',
      emptyIcon: 'text-cyan-400/20',
    }
  }
  if (division === 'FEMALE') {
    return {
      iconBg: 'bg-pink-300/10', iconBorder: 'border-pink-300/15', iconColor: 'text-pink-300',
      winAccent: 'bg-pink-300/60', winText: 'text-pink-300/80',
      emptyIcon: 'text-pink-300/20',
    }
  }
  return {
    iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/15', iconColor: 'text-emerald-400',
    winAccent: 'bg-emerald-400/60', winText: 'text-emerald-400/80',
    emptyIcon: 'text-emerald-400/20',
  }
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function BracketView({ matches, teams, division }: BracketViewProps) {
  const theme = getDivisionTheme(division)

  // Empty state
  if (matches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-3xl border border-border overflow-hidden bg-card"
      >
        <div className="relative min-h-[180px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${cdnImage('/images/bracket-tree.png')})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/75 to-card/95" />
          <div className="relative z-10 text-center">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={springTransition}
            >
              <GitBranch className={`h-12 w-12 mx-auto mb-3 ${theme.emptyIcon}`} />
            </motion.div>
            <p className="text-sm text-muted-foreground/50 font-medium">Belum ada bracket</p>
            <p className="text-xs text-muted-foreground/30 mt-1">Generate bracket dari admin panel</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Group matches by round
  const rounds: Record<number, MatchData[]> = {}
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = []
    rounds[m.round].push(m)
  }

  const roundNames: Record<number, string> = {
    1: 'Round 1',
    2: 'Semifinal',
    3: 'Final',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: '1000px' }}
      className="rounded-3xl border border-border overflow-hidden bg-card"
    >
      {/* Background image header */}
      <div className="relative h-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${cdnImage('/images/bracket-tree.png')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        <div className="relative z-10 flex items-center h-full px-5">
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 5 }}
              transition={springTransition}
              className={`flex items-center justify-center h-8 w-8 rounded-2xl ${theme.iconBg} backdrop-blur-xl border ${theme.iconBorder}`}
            >
              <GitBranch className={`h-4 w-4 ${theme.iconColor}`} />
            </motion.div>
            <h3 className="font-semibold text-sm text-foreground">Tournament Bracket</h3>
          </div>
        </div>
      </div>

      {/* Bracket content — horizontal scroll */}
      <div className="p-4 md:p-5">
        <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none">
          {Object.entries(rounds)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, roundMatches]) => (
              <div key={round} className="flex flex-col gap-3 min-w-[240px]">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 text-center pb-2 border-b border-border/30">
                  {roundNames[Number(round)] || `Round ${round}`}
                </h4>
                {roundMatches.map((match, mi) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    winAccent={theme.winAccent}
                    winText={theme.winText}
                    delay={mi * 0.06}
                  />
                ))}
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  )
}

function MatchCard({ match, winAccent, winText, delay = 0 }: { match: MatchData; winAccent: string; winText: string; delay?: number }) {
  const isCompleted = match.status === 'COMPLETED'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border overflow-hidden text-sm transition-colors ${
        isCompleted
          ? 'bg-muted/15 border-border/30'
          : 'bg-muted/10 border-border/40'
      }`}
    >
      {match.teams.map((mt, idx) => {
        const isWinner = mt.result === 'WIN'
        return (
          <div
            key={mt.id}
            className={`relative flex items-center justify-between py-2.5 px-3.5 ${
              idx === 0 && match.teams.length > 1 ? 'border-b border-border/20' : ''
            }`}
          >
            {/* Winner accent bar — division colored */}
            {isCompleted && isWinner && (
              <div className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-full ${winAccent}`} />
            )}
            <div className="flex items-center gap-2 pl-1">
              {mt.team.color && (
                <div
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10 shrink-0"
                  style={{ backgroundColor: mt.team.color }}
                />
              )}
              <span className={`text-xs truncate max-w-[140px] ${
                isWinner ? 'text-foreground font-semibold' : 'text-muted-foreground/45'
              }`}>
                {mt.team.name}
              </span>
            </div>
            <span className={`text-xs font-mono ${
              isWinner ? `${winText} font-bold` : 'text-muted-foreground/30'
            }`}>
              {mt.score}
            </span>
          </div>
        )
      })}
      {/* MVP badge with star */}
      {match.mvpPlayer && (
        <div className="mx-3 py-2 border-t border-border/20 flex items-center gap-1.5">
          <Star className={`h-3 w-3 ${winText} fill-current`} />
          <span className={`text-[10px] ${winText} font-medium`}>MVP: {match.mvpPlayer.name}</span>
        </div>
      )}
    </motion.div>
  )
}
