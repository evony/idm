'use client'

import { motion } from 'framer-motion'
import { Swords, Zap } from 'lucide-react'
import type { TournamentData } from '@/lib/types'
import { getDivisionTextColor, getDivisionGlow, getDivisionGradient } from '@/hooks/use-3d'
import { getTierAvatarUrl, cdnImage } from '@/lib/utils'

interface MatchSpotlightProps {
  tournament: TournamentData | null
  tournamentDetail: { teams: { id: string; name: string; color: string | null; totalPower: number; participants: { player: { name: string; tier: string } }[] }[] } | null
}

export function MatchSpotlight({ tournament, tournamentDetail }: MatchSpotlightProps) {
  const division = tournament?.division || 'SEMUA'
  const divTextColor = getDivisionTextColor(division)
  const divGlow = getDivisionGlow(division)
  const divGradient = getDivisionGradient(division)
  const avatarGender = division === 'FEMALE' ? 'female' : 'male'

  // Division accent color for UI elements
  const divAccent = division === 'MALE'
    ? { badgeBg: 'bg-idm-male/15', badgeBorder: 'border-idm-male/20', badgeText: 'text-idm-male', barGradient: 'linear-gradient(90deg, rgba(46,159,255,0.3), rgba(46,159,255,0.7))', vsGlow: 'rgba(46,159,255,0.3)' }
    : division === 'FEMALE'
    ? { badgeBg: 'bg-pink-300/15', badgeBorder: 'border-pink-300/20', badgeText: 'text-pink-300', barGradient: 'linear-gradient(90deg, rgba(249,168,212,0.3), rgba(249,168,212,0.7))', vsGlow: 'rgba(249,168,212,0.3)' }
    : { badgeBg: 'bg-emerald-500/15', badgeBorder: 'border-emerald-500/20', badgeText: 'text-emerald-400', barGradient: 'linear-gradient(90deg, rgba(16,185,129,0.3), rgba(16,185,129,0.7))', vsGlow: 'rgba(16,185,129,0.3)' }

  // Empty state — cinematic frosted glass with 3D VS
  if (!tournamentDetail || tournamentDetail.teams.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl border border-border/80"
        style={{ boxShadow: divGlow }}
      >
        {/* Full cinematic background */}
        <div className="relative h-64 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${cdnImage('/images/match-versus.png')})` }}
          />
          {/* Heavy gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
          {/* Radial vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background)/0.6)_100%)]" />

          {/* Frosted glass content overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            {/* Header pill */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/20 backdrop-blur-xl border border-border/40 mb-6">
              <Swords className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Match Spotlight
              </span>
            </div>

            {/* 3D VS display with perspective */}
            <div
              className="relative mb-4"
              style={{ perspective: '800px' }}
            >
              <motion.div
                initial={{ rotateX: 20, scale: 0.8, opacity: 0 }}
                animate={{ rotateX: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Glow behind VS */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ filter: `blur(20px)` }}
                >
                  <span
                    className="text-6xl font-black tracking-[0.3em]"
                    style={{ color: divAccent.vsGlow }}
                  >
                    VS
                  </span>
                </div>
                <span className="relative text-6xl font-black tracking-[0.3em] bg-gradient-to-b from-foreground/80 to-foreground/30 bg-clip-text text-transparent">
                  VS
                </span>
              </motion.div>
            </div>

            <p className="text-muted-foreground text-sm font-medium">Belum ada match terjadwal</p>
            <p className="text-muted-foreground/40 text-xs mt-1.5">Generate bracket dari admin panel</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const teamA = tournamentDetail.teams[0]
  const teamB = tournamentDetail.teams[1]

  const getTeamTiers = (team: typeof teamA) => {
    return team.participants.map(p => p.player.tier).join('+')
  }

  // Power comparison for fighting-game style bar
  const totalPower = teamA.totalPower + teamB.totalPower
  const teamAPct = totalPower > 0 ? (teamA.totalPower / totalPower) * 100 : 50
  const teamBPct = totalPower > 0 ? (teamB.totalPower / totalPower) * 100 : 50

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-border/80"
      style={{ boxShadow: divGlow }}
    >
      {/* Hero image section */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${cdnImage('/images/match-versus.png')})` }}
        />
        {/* Gradient overlay — show more character art */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background)/0.4)_100%)]" />

        {/* Top bar — frosted glass pills */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/20 backdrop-blur-xl border border-border/40">
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Match Spotlight
            </span>
          </div>
          {/* Live indicator with division color */}
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${divAccent.badgeBg} backdrop-blur-xl border ${divAccent.badgeBorder} text-[10px] font-bold uppercase tracking-wider ${divAccent.badgeText}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${divAccent.badgeText.replace('text-', 'bg-')} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${divAccent.badgeText.replace('text-', 'bg-')}`} />
            </span>
            Upcoming
          </span>
        </div>

        {/* Team name pills over image — glassmorphism */}
        <div className="relative z-10 flex items-center justify-between px-5 mt-4 sm:mt-6">
          {/* Team A */}
          <div className="px-3 py-2.5 rounded-2xl bg-background/20 backdrop-blur-xl border border-border/40 max-w-[38%]">
            <p className="font-bold text-sm text-white truncate">{teamA.name}</p>
            <p className="text-[10px] text-white/40 font-medium mt-0.5">{getTeamTiers(teamA)}</p>
          </div>

          {/* Team B */}
          <div className="px-3 py-2.5 rounded-2xl bg-background/20 backdrop-blur-xl border border-border/40 max-w-[38%] text-right">
            <p className="font-bold text-sm text-white truncate">{teamB.name}</p>
            <p className="text-[10px] text-white/40 font-medium mt-0.5">{getTeamTiers(teamB)}</p>
          </div>
        </div>

        {/* Central VS — 3D perspective */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ perspective: '1000px' }}
        >
          <motion.div
            initial={{ rotateX: 15, scale: 0.6, opacity: 0 }}
            animate={{ rotateX: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 flex items-center justify-center scale-150"
              style={{ filter: 'blur(16px)' }}
            >
              <div
                className="w-24 h-24 rounded-full"
                style={{ backgroundColor: divAccent.vsGlow, opacity: 0.5 }}
              />
            </div>
            {/* Inner circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 backdrop-blur-sm" />
            </div>
            {/* VS text with glow */}
            <span className="relative text-4xl sm:text-5xl font-black tracking-[0.25em] bg-gradient-to-b from-white/90 via-white/60 to-white/25 bg-clip-text text-transparent">
              VS
            </span>
            {/* Lightning bolt accents */}
            <Zap className="absolute -left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60 fill-emerald-400/40" />
            <Zap className="absolute -right-7 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60 fill-emerald-400/40" />
          </motion.div>
        </div>
      </div>

      {/* Power comparison — fighting game style */}
      <div className="relative z-10 px-4 sm:px-5 pb-5 -mt-4">
        <div className="rounded-2xl bg-background/60 backdrop-blur-xl border border-border/40 p-4 space-y-4">
          {/* Team details row with 3 avatar circles */}
          <div className="flex items-center justify-between">
            {/* Team A */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-2xl text-xs font-bold border backdrop-blur-sm"
                  style={{
                    backgroundColor: teamA.color ? `${teamA.color}20` : 'hsl(var(--muted) / 0.5)',
                    borderColor: teamA.color ? `${teamA.color}30` : 'hsl(var(--border))',
                    color: teamA.color || 'hsl(var(--muted-foreground) / 0.6)',
                  }}
                >
                  {teamA.name.replace('Team ', '').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{teamA.name}</h3>
                  <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
                    Power {teamA.totalPower} · {getTeamTiers(teamA)}
                  </p>
                </div>
              </div>
              {/* 3 member avatars */}
              <div className="flex -space-x-2">
                {teamA.participants.slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-background shadow-sm"
                    title={p.player.name}
                  >
                    <img
                      src={getTierAvatarUrl(avatarGender, p.player.tier)}
                      alt={p.player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {teamA.participants.length < 3 && Array.from({ length: 3 - teamA.participants.length }).map((_, i) => (
                  <div key={`empty-a-${i}`} className="w-9 h-9 rounded-full bg-muted/50 border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground/25">?</div>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center gap-2 mb-2.5 justify-end">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{teamB.name}</h3>
                  <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">
                    Power {teamB.totalPower} · {getTeamTiers(teamB)}
                  </p>
                </div>
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-2xl text-xs font-bold border backdrop-blur-sm"
                  style={{
                    backgroundColor: teamB.color ? `${teamB.color}20` : 'hsl(var(--muted) / 0.5)',
                    borderColor: teamB.color ? `${teamB.color}30` : 'hsl(var(--border))',
                    color: teamB.color || 'hsl(var(--muted-foreground) / 0.6)',
                  }}
                >
                  {teamB.name.replace('Team ', '').charAt(0)}
                </div>
              </div>
              {/* 3 member avatars (reversed) */}
              <div className="flex -space-x-2 justify-end">
                {teamB.participants.slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-background shadow-sm"
                    title={p.player.name}
                  >
                    <img
                      src={getTierAvatarUrl(avatarGender, p.player.tier)}
                      alt={p.player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {teamB.participants.length < 3 && Array.from({ length: 3 - teamB.participants.length }).map((_, i) => (
                  <div key={`empty-b-${i}`} className="w-9 h-9 rounded-full bg-muted/50 border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground/25">?</div>
                ))}
              </div>
            </div>
          </div>

          {/* Power comparison bar — fighting game style with 3D depth */}
          <div className="space-y-2">
            <div
              className="flex h-3.5 rounded-full overflow-hidden bg-muted/40 gap-0.5"
              style={{ perspective: '600px' }}
            >
              {/* Team A bar */}
              <motion.div
                initial={{ width: 0, rotateY: 20 }}
                animate={{ width: `${teamAPct}%`, rotateY: 0 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                className="h-full rounded-l-full shadow-sm"
                style={{
                  background: teamA.color
                    ? `linear-gradient(90deg, ${teamA.color}30, ${teamA.color}80)`
                    : divAccent.barGradient,
                }}
              />
              {/* Team B bar */}
              <motion.div
                initial={{ width: 0, rotateY: -20 }}
                animate={{ width: `${teamBPct}%`, rotateY: 0 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                className="h-full rounded-r-full shadow-sm"
                style={{
                  background: teamB.color
                    ? `linear-gradient(270deg, ${teamB.color}30, ${teamB.color}80)`
                    : divAccent.barGradient,
                }}
              />
            </div>
            {/* Power labels */}
            <div className="flex justify-between text-[9px] text-muted-foreground/40 uppercase tracking-[0.15em] font-medium">
              <span className={`font-semibold ${divTextColor}`}>{teamAPct.toFixed(0)}%</span>
              <span>Power Rating</span>
              <span className={`font-semibold ${divTextColor}`}>{teamBPct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
