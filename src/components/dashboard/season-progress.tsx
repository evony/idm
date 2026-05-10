'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Trophy, BarChart3 } from 'lucide-react'
import type { SeasonData } from '@/lib/types'
import { cdnImage } from '@/lib/utils'

interface SeasonProgressProps {
  season: SeasonData | null
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function SeasonProgress({ season }: SeasonProgressProps) {
  if (!season) return null

  const startDate = new Date(season.startDate)
  const now = new Date()
  const weeksElapsed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const currentWeek = Math.min(Math.max(weeksElapsed + 1, 1), 10)
  const progress = (currentWeek / 10) * 100

  const statusConfig = season.isCompleted
    ? { label: 'Selesai', dot: 'bg-emerald-400', pulse: false }
    : season.isActive
    ? { label: 'Aktif', dot: 'bg-emerald-400', pulse: true }
    : { label: 'Pending', dot: 'bg-muted-foreground/50', pulse: false }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: '1000px' }}
      className="relative rounded-3xl border border-border overflow-hidden bg-card"
    >
      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${cdnImage('/images/season-progress.png')})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-card/95" />

      {/* Content */}
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 5 }}
              transition={springTransition}
              className="flex items-center justify-center h-10 w-10 rounded-2xl bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/15"
            >
              <CalendarDays className="h-5 w-5 text-emerald-400" />
            </motion.div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{season.name}</h3>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Season #{season.number}</p>
            </div>
          </div>
          {/* Active status with pulsing dot */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-background/20 backdrop-blur-xl border border-border/40">
            <span className={`relative h-2 w-2 rounded-full ${statusConfig.dot}`}>
              {statusConfig.pulse && (
                <span className={`absolute inset-0 rounded-full ${statusConfig.dot} animate-ping opacity-75`} />
              )}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">{statusConfig.label}</span>
          </div>
        </div>

        {/* Progress bar with emerald gradient + glow */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/50 font-medium">Progress Minggu</span>
            <span className="text-xs font-bold text-foreground/90">
              Week {currentWeek} <span className="text-muted-foreground/40">/</span> <span className="text-muted-foreground/60">10</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/30 backdrop-blur-sm">
            {/* Glow behind bar */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/20 blur-sm"
              style={{ width: `${progress}%` }}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
            >
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400/40 to-emerald-300/40 blur-[2px]" />
              {/* Trailing glow */}
              <div className="absolute -right-1 top-0 bottom-0 w-5 rounded-full bg-emerald-300/30 blur-md" />
            </motion.div>
          </div>

          {/* Week markers — dots with W1, W5, W10 labels */}
          <div className="flex items-center justify-between px-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => (
              <div key={w} className="flex flex-col items-center">
                <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  w <= currentWeek ? 'bg-emerald-400/70' : 'bg-muted-foreground/15'
                }`} />
                {(w === 1 || w === 5 || w === 10) && (
                  <span className={`text-[8px] mt-1.5 font-semibold ${
                    w <= currentWeek ? 'text-emerald-400/60' : 'text-muted-foreground/25'
                  }`}>
                    W{w}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer with glass pills */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/30">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-background/15 backdrop-blur-xl border border-border/25 text-[11px] text-muted-foreground/60">
            <Trophy className="h-3 w-3 text-emerald-400/50" />
            <span className="font-medium">{season._count?.tournaments ?? 0} Tournament</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-background/15 backdrop-blur-xl border border-border/25 text-[11px] text-muted-foreground/60">
            <BarChart3 className="h-3 w-3 text-cyan-400/50" />
            <span className="font-medium">{season._count?.rankings ?? 0} Rankings</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
