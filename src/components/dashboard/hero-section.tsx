'use client'

import { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Trophy, Calendar, Music, MapPin, Users, Coins, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StatsData, TournamentData } from '@/lib/types'
import { formatRupiah } from '@/lib/types'
import {
  getDivisionTextColor,
  getDivisionBadgeClasses,
  getDivisionGlow,
  getDivisionBtnGradient,
  getDivisionBtnShadow,
} from '@/hooks/use-3d'
import { cdnImage } from '@/lib/utils'

interface HeroSectionProps {
  stats: StatsData | null
  tournament: TournamentData | null
  division: string
  onSawer?: () => void
  onRegister?: () => void
}

export function HeroSection({ stats, tournament, division, onSawer, onRegister }: HeroSectionProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Parallax motion values for background image
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })
  const bgX = useTransform(springX, [-0.5, 0.5], [-8, 8])
  const bgY = useTransform(springY, [-0.5, 0.5], [-8, 8])

  const divisionLabel = division === 'MALE' ? 'Male Division' : division === 'FEMALE' ? 'Female Division' : 'Tarkam Random Arena'
  const divisionIcon = division === 'MALE' ? '♂' : division === 'FEMALE' ? '♀' : '🏆'

  const textColor = getDivisionTextColor(division)
  const badgeClasses = getDivisionBadgeClasses(division)
  const glowStyle = { boxShadow: getDivisionGlow(division) }
  const btnGradient = getDivisionBtnGradient(division)
  const btnShadow = getDivisionBtnShadow(division)

  const divisionAccentFrom = division === 'MALE' ? 'from-cyan-400' : division === 'FEMALE' ? 'from-pink-300' : 'from-emerald-400'
  const divisionGlowVia = division === 'MALE' ? 'via-cyan-400/60' : division === 'FEMALE' ? 'via-pink-300/60' : 'via-emerald-400/60'

  const heroImage = division === 'MALE'
    ? cdnImage('/images/male-division.png', 1920)
    : division === 'FEMALE'
    ? cdnImage('/images/female-division.png', 1920)
    : cdnImage('/images/hero-banner.png', 1920)

  const now = new Date()
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const dateTimeStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()} • ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const displayBpm = tournament?.bpm || 128

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border min-h-[280px] sm:min-h-[320px] md:min-h-[400px] group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        mouseX.set(0)
        mouseY.set(0)
      }}
    >
      {/* Full-bleed background image with 3D parallax */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${heroImage}')`,
          x: bgX,
          y: bgY,
          scale: isHovered ? 1.06 : 1.04,
        }}
        transition={{ scale: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }}
      />

      {/* Cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-transparent" />

      {/* Division-colored top accent glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-20">
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${divisionGlowVia} to-transparent`} />
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${divisionAccentFrom} to-transparent blur-sm`} />
      </div>

      {/* Ambient glow orb */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.07] blur-[80px] pointer-events-none"
        style={{
          background: division === 'MALE'
            ? 'radial-gradient(circle, #2E9FFF, transparent)'
            : division === 'FEMALE'
            ? 'radial-gradient(circle, #f9a8d4, transparent)'
            : 'radial-gradient(circle, #10b981, transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full p-5 md:p-8 min-h-[280px] sm:min-h-[320px] md:min-h-[400px]">
        {/* Top badges row */}
        <div className="absolute top-4 md:top-6 left-5 md:left-8 flex items-center gap-2 flex-wrap">
          {/* Animated Live badge with pulse */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold backdrop-blur-xl border ${badgeClasses}`}
            style={glowStyle}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            Live
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-black/40 text-foreground/90 border border-white/10 backdrop-blur-xl">
            <Trophy className={`h-3 w-3 ${textColor}`} />
            Tournament
          </span>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border backdrop-blur-xl ${badgeClasses}`}>
            {divisionIcon} {divisionLabel}
          </span>
        </div>

        {/* Main content area */}
        <div>
          {/* Date/Time */}
          <div className="flex items-center gap-1.5 text-[11px] text-white/50 mb-3">
            <Clock className="h-3 w-3" />
            <span>{dateTimeStr}</span>
          </div>

          {/* Title — large cinematic heading */}
          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-1.5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {divisionIcon} {divisionLabel}
          </motion.h1>

          {/* Accent underline */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`h-[3px] w-16 rounded-full bg-gradient-to-r ${divisionAccentFrom} to-transparent`} />
            <span className="text-xs text-white/50 tracking-wider uppercase font-medium">
              {tournament ? `Week ${tournament.weekNumber}` : stats?.activeSeason ? `Season ${stats.activeSeason.number}` : ''}
            </span>
          </div>

          {/* Stats row — glassmorphism pills */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6"
            initial="initial"
            animate="animate"
            variants={{
              animate: {
                transition: { staggerChildren: 0.06, delayChildren: 0.25 },
              },
            }}
          >
            <GlassPill
              icon={<Coins className="h-4 w-4" />}
              label="Prize Pool"
              value={formatRupiah(tournament?.prizePool || stats?.prizePool.total || 0)}
              highlight
              textColor={textColor}
            />
            <GlassPill
              icon={<Calendar className="h-4 w-4" />}
              label="Week"
              value={tournament ? `Week ${tournament.weekNumber}` : stats?.activeSeason ? `Season ${stats.activeSeason.number}` : '-'}
            />
            {tournament ? (
              <>
                <GlassPill
                  icon={<Music className="h-4 w-4" />}
                  label="BPM Lagu"
                  value={`${displayBpm}`}
                />
                <GlassPill
                  icon={<MapPin className="h-4 w-4" />}
                  label="Area"
                  value={tournament.area}
                />
              </>
            ) : (
              <>
                <GlassPill
                  icon={<Users className="h-4 w-4" />}
                  label="Pemain"
                  value={`${stats?.players.total || 0}`}
                />
                <GlassPill
                  icon={<Trophy className="h-4 w-4" />}
                  label="Match"
                  value={`${stats?.matches.completed || 0}`}
                />
              </>
            )}
          </motion.div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={onSawer}
                size="sm"
                className={`relative bg-gradient-to-r ${btnGradient} text-white font-bold h-10 text-xs rounded-2xl px-5 transition-shadow duration-300`}
                style={{ boxShadow: btnShadow }}
              >
                <Zap className="h-4 w-4 mr-1.5" />
                Sawer
              </Button>
            </motion.div>
            {tournament && (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={onRegister}
                  variant="outline"
                  size="sm"
                  className="border-white/15 bg-white/5 hover:bg-white/10 text-white/90 h-10 text-xs rounded-2xl px-5 backdrop-blur-xl"
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  Daftar ({tournament._count.participants})
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** Glassmorphism pill for stats in the hero */
function GlassPill({ icon, label, value, highlight, textColor }: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
  textColor?: string
}) {
  return (
    <motion.div
      className="flex items-center gap-3 rounded-2xl bg-black/30 border border-white/[0.08] px-4 py-3 backdrop-blur-xl"
      variants={{
        initial: { opacity: 0, y: 16, scale: 0.95 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
    >
      <div className={highlight && textColor ? textColor : 'text-white/40'}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">{label}</span>
        <span className={`text-sm font-bold truncate ${highlight && textColor ? textColor : 'text-white'}`}>{value}</span>
      </div>
    </motion.div>
  )
}
