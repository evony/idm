'use client'

import { motion } from 'framer-motion'
import { Clock, Swords, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { MatchData } from '@/lib/types'
import { cdnImage } from '@/lib/utils'

interface MatchHistoryProps {
  matches: MatchData[]
  division?: string
}

function getDivisionTheme(division?: string) {
  if (division === 'MALE') {
    return {
      iconBg: 'bg-cyan-500/10', iconBorder: 'border-cyan-500/15', iconColor: 'text-cyan-400',
      winnerText: 'text-cyan-400/80',
      mvpBadge: 'bg-cyan-500/10', mvpStar: 'text-cyan-400 fill-cyan-400/50', mvpText: 'text-cyan-400/70', mvpName: 'text-cyan-400/50',
      emptyIcon: 'text-cyan-400/15',
    }
  }
  if (division === 'FEMALE') {
    return {
      iconBg: 'bg-pink-300/10', iconBorder: 'border-pink-300/15', iconColor: 'text-pink-300',
      winnerText: 'text-pink-300/80',
      mvpBadge: 'bg-pink-300/10', mvpStar: 'text-pink-300 fill-pink-300/50', mvpText: 'text-pink-300/70', mvpName: 'text-pink-300/50',
      emptyIcon: 'text-pink-300/15',
    }
  }
  return {
    iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/15', iconColor: 'text-emerald-400',
    winnerText: 'text-emerald-400/80',
    mvpBadge: 'bg-emerald-500/10', mvpStar: 'text-emerald-400 fill-emerald-400/50', mvpText: 'text-emerald-400/70', mvpName: 'text-emerald-400/50',
    emptyIcon: 'text-emerald-400/15',
  }
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function MatchHistory({ matches, division }: MatchHistoryProps) {
  const completed = matches.filter(m => m.status === 'COMPLETED')
  const theme = getDivisionTheme(division)

  // Empty state
  if (completed.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-3xl border border-border overflow-hidden bg-card"
      >
        <div className="relative min-h-[160px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${cdnImage('/images/match-versus.png')})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/75 to-card/95" />
          <div className="relative z-10 text-center">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={springTransition}
            >
              <Clock className={`h-12 w-12 mx-auto mb-3 ${theme.emptyIcon}`} />
            </motion.div>
            <p className="text-sm text-muted-foreground/45 font-medium">Belum ada match history</p>
          </div>
        </div>
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
      {/* Frosted glass header with Clock icon */}
      <div className="relative h-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${cdnImage('/images/match-versus.png')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        <div className="relative z-10 flex items-center justify-between h-full px-5">
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 5 }}
              transition={springTransition}
              className={`flex items-center justify-center h-8 w-8 rounded-2xl ${theme.iconBg} backdrop-blur-xl border ${theme.iconBorder}`}
            >
              <Clock className={`h-4 w-4 ${theme.iconColor}`} />
            </motion.div>
            <h3 className="font-semibold text-sm text-foreground">Match History</h3>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-border/50 text-muted-foreground/50 bg-background/20 backdrop-blur-xl px-2.5"
          >
            {completed.length}
          </Badge>
        </div>
      </div>

      {/* Match list */}
      <div className="p-4">
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {completed.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springTransition, delay: i * 0.03 }}
                whileHover={{ x: 3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                className="rounded-2xl border border-border/30 px-4 py-3 hover:bg-muted/8 transition-colors group cursor-default"
              >
                {/* Match header — round/match number */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.12em] font-semibold">
                    Round {match.round} &middot; Match {match.matchNumber}
                  </span>
                  {match.completedAt && (
                    <span className="text-[10px] text-muted-foreground/30 font-medium tabular-nums">
                      {new Date(match.completedAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  )}
                </div>

                {/* Team VS display */}
                <div className="flex items-center gap-2">
                  {match.teams.map((mt, idx) => {
                    const isWinner = mt.result === 'WIN'
                    return (
                      <div key={mt.id} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {mt.team.color && (
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                              style={{ backgroundColor: mt.team.color }}
                            />
                          )}
                          <span className={`text-xs truncate ${
                            isWinner ? `${theme.winnerText} font-semibold` : 'text-muted-foreground/40'
                          }`}>
                            {mt.team.name}
                          </span>
                          <span className={`text-xs font-mono font-bold ml-auto shrink-0 ${
                            isWinner ? theme.winnerText : 'text-muted-foreground/25'
                          }`}>
                            {mt.score}
                          </span>
                        </div>
                        {/* Swords separator between teams */}
                        {idx === 0 && match.teams.length > 1 && (
                          <div className="flex items-center justify-center my-1.5">
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border/20" />
                              <Swords className="h-3 w-3 text-muted-foreground/15" />
                              <div className="h-px flex-1 bg-border/20" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* MVP badge with star */}
                {match.mvpPlayer && (
                  <div className="mt-2.5 pt-2 border-t border-border/20 flex items-center gap-1.5">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${theme.mvpBadge}`}>
                      <Star className={`h-2.5 w-2.5 ${theme.mvpStar}`} />
                      <span className={`text-[9px] ${theme.mvpText} font-semibold`}>MVP</span>
                    </div>
                    <span className={`text-[10px] ${theme.mvpName} font-medium`}>{match.mvpPlayer.name}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}
