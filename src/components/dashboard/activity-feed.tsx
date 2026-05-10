'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { ActivityData } from '@/lib/types'
import { divisionBadge } from '@/lib/types'
import { cdnImage } from '@/lib/utils'

interface ActivityFeedProps {
  activities: ActivityData[]
  title?: string
  division?: string
}

function getDivisionTheme(division?: string) {
  if (division === 'MALE') {
    return {
      iconBg: 'bg-cyan-500/10',
      iconBorder: 'border-cyan-500/20',
      iconColor: 'text-cyan-400',
      lineFrom: 'from-cyan-400/50',
      lineTo: 'to-cyan-400/10',
      hoverLineFrom: 'from-cyan-400/70',
    }
  }
  if (division === 'FEMALE') {
    return {
      iconBg: 'bg-pink-300/10',
      iconBorder: 'border-pink-300/20',
      iconColor: 'text-pink-300',
      lineFrom: 'from-pink-300/50',
      lineTo: 'to-pink-300/10',
      hoverLineFrom: 'from-pink-300/70',
    }
  }
  return {
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    lineFrom: 'from-emerald-400/50',
    lineTo: 'to-emerald-400/10',
    hoverLineFrom: 'from-emerald-400/70',
  }
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function ActivityFeed({ activities, title, division }: ActivityFeedProps) {
  const theme = getDivisionTheme(division)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: '1000px' }}
      className="rounded-3xl border border-border overflow-hidden bg-card"
    >
      {/* Frosted glass header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${cdnImage('/images/activity-timeline.png')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/75 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        <div className="relative z-10 flex items-center h-16 px-5">
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center justify-center h-8 w-8 rounded-2xl ${theme.iconBg} backdrop-blur-xl border ${theme.iconBorder}`}>
              <Activity className={`h-4 w-4 ${theme.iconColor}`} />
            </div>
            <h3 className="font-semibold text-sm text-foreground">{title || 'Aktivitas'}</h3>
          </div>
          <Badge
            variant="outline"
            className="ml-auto text-[10px] border-border/60 text-muted-foreground/60 bg-background/20 backdrop-blur-xl px-2"
          >
            {activities.length}
          </Badge>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="p-4">
        <ScrollArea className="max-h-80">
          <div className="space-y-0.5">
            {activities.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springTransition, delay: i * 0.04 }}
                className="relative flex items-start gap-3 px-3 py-3 rounded-2xl hover:bg-muted/10 transition-colors group cursor-default"
              >
                {/* Left accent line — division colored */}
                <div className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-gradient-to-b ${theme.lineFrom} ${theme.lineTo} group-hover:bg-gradient-to-b group-hover:${theme.hoverLineFrom} group-hover:${theme.lineTo} transition-all duration-300`} />

                <span className="text-base flex-shrink-0 mt-0.5 opacity-70 ml-2">{a.icon || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground/80 truncate">{a.title}</p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 border-border shrink-0 ${divisionBadge(a.division)}`}
                    >
                      {a.division === 'MALE' ? '♂' : a.division === 'FEMALE' ? '♀' : '🌐'}
                    </Badge>
                  </div>
                  {a.description && (
                    <p className="text-xs text-muted-foreground/50 line-clamp-2">{a.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/40 mt-1 font-medium tabular-nums">
                    {new Date(a.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
            {activities.length === 0 && (
              <div className="relative rounded-2xl overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${cdnImage('/images/activity-timeline.png')})` }}
                />
                <div className="absolute inset-0 bg-card/60" />
                <div className="relative z-10 text-center py-12">
                  <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-muted-foreground/40 text-sm font-medium">Belum ada aktivitas</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}
