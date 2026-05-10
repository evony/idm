'use client'

import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { StatsData } from '@/lib/types'
import { cdnImage } from '@/lib/utils'

interface DivisionComparisonProps {
  stats: StatsData | null
}

export function DivisionComparison({ stats }: DivisionComparisonProps) {
  if (!stats) return null

  const data = [
    {
      name: 'Pemain',
      Male: stats.players.male,
      Female: stats.players.female,
    },
    {
      name: 'Klub',
      Male: Math.ceil(stats.players.male / 4),
      Female: Math.ceil(stats.players.female / 3),
    },
    {
      name: 'S-Tier',
      Male: Math.ceil(stats.players.male * 0.2),
      Female: Math.ceil(stats.players.female * 0.2),
    },
  ]

  const gridStroke = 'hsl(var(--border) / 0.4)'
  const tickFill = 'hsl(var(--muted-foreground) / 0.6)'
  const axisStroke = 'hsl(var(--border) / 0.6)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-border overflow-hidden"
    >
      {/* Header with image background */}
      <div
        className="relative px-5 pt-5 pb-4 bg-cover bg-center"
        style={{ backgroundImage: `url(${cdnImage('/images/stats-overview.png')})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 backdrop-blur-sm">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">Male vs Female</h3>
        </div>
      </div>

      {/* Chart content */}
      <div className="p-4 pt-2">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="name"
                tick={{ fill: tickFill, fontSize: 11 }}
                axisLine={{ stroke: axisStroke }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tickFill, fontSize: 11 }}
                axisLine={{ stroke: axisStroke }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card) / 0.95)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground) / 0.8)',
                  backdropFilter: 'blur(8px)',
                }}
                itemStyle={{ color: 'hsl(var(--foreground) / 0.7)' }}
              />
              <Bar dataKey="Male" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`male-${index}`} fill="#3B82F6" fillOpacity={0.6} />
                ))}
              </Bar>
              <Bar dataKey="Female" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`female-${index}`} fill="#EC4899" fillOpacity={0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
            <span className="text-muted-foreground/70">♂ Male ({stats.players.male})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-pink-500/60" />
            <span className="text-muted-foreground/70">♀ Female ({stats.players.female})</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
