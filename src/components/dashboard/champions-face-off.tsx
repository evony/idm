'use client'

import { motion } from 'framer-motion'
import { Trophy, Crown, Music } from 'lucide-react'
import type { RankingData } from '@/lib/types'
import { tierColor } from '@/lib/types'
import {
  useTilt,
  getDivisionGlow,
  iosCardVariants,
} from '@/hooks/use-3d'
import { getTierAvatarUrl, cdnImage } from '@/lib/utils'

interface ChampionsFaceOffProps {
  maleRankings: RankingData[]
  femaleRankings: RankingData[]
}

export function ChampionsFaceOff({ maleRankings, femaleRankings }: ChampionsFaceOffProps) {
  const maleChamp = maleRankings[0]
  const femaleChamp = femaleRankings[0]

  if (!maleChamp && !femaleChamp) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl md:rounded-3xl border border-border overflow-hidden"
    >
      {/* Header with background */}
      <div className="relative h-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: `url(${cdnImage('/images/champions-podium.png')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="relative z-10 flex items-center justify-center gap-2 h-full">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/20 backdrop-blur-xl border border-border/40">
            <Trophy className="h-4 w-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-foreground tracking-wide">Champions Face-Off</h3>
          </div>
        </div>
      </div>

      {/* Champion team cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-2"
        variants={iosCardVariants.container}
        initial="initial"
        animate="animate"
      >
        {maleChamp && (
          <ChampionTeamCard
            champ={maleChamp}
            divisionImage={cdnImage('/images/male-division.png')}
            divisionLabel="♂ Male Division"
            divisionColor="text-cyan-400"
            theme={{
              borderGradient: 'from-cyan-400/40 via-cyan-400/10 to-cyan-400/40',
              cornerBorder: 'border-cyan-400/30',
              leaderRing: 'ring-cyan-400/50',
              leaderBorder: 'border-cyan-400/40',
              leaderShadow: 'shadow-cyan-400/20',
              leaderBadge: 'bg-cyan-400',
              pointsBorder: 'border-cyan-400/20',
              pointsText: 'text-cyan-400',
              glowColor: 'rgba(46, 159, 255, 0.15)',
            }}
          />
        )}
        {femaleChamp && (
          <ChampionTeamCard
            champ={femaleChamp}
            divisionImage={cdnImage('/images/female-division.png')}
            divisionLabel="♀ Female Division"
            divisionColor="text-pink-300"
            theme={{
              borderGradient: 'from-pink-300/40 via-pink-300/10 to-pink-300/40',
              cornerBorder: 'border-pink-300/30',
              leaderRing: 'ring-pink-300/50',
              leaderBorder: 'border-pink-300/40',
              leaderShadow: 'shadow-pink-300/20',
              leaderBadge: 'bg-pink-300',
              pointsBorder: 'border-pink-300/20',
              pointsText: 'text-pink-300',
              glowColor: 'rgba(249, 168, 212, 0.15)',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

function ChampionTeamCard({
  champ,
  divisionImage,
  divisionLabel,
  divisionColor,
  theme,
}: {
  champ: RankingData
  divisionImage: string
  divisionLabel: string
  divisionColor: string
  theme: {
    borderGradient: string
    cornerBorder: string
    leaderRing: string
    leaderBorder: string
    leaderShadow: string
    leaderBadge: string
    pointsBorder: string
    pointsText: string
    glowColor: string
  }
}) {
  const { ref, style, handlers } = useTilt<HTMLDivElement>({ maxTilt: 8, scale: 1.02 })

  // Team of 3: leader + 2 teammates
  const isMale = divisionImage.includes('male')
  const teamMembers = [
    {
      name: champ.player.name,
      tier: champ.player.tier,
      isLeader: true,
      avatar: getTierAvatarUrl(isMale ? 'male' : 'female', champ.player.tier),
    },
    {
      name: champ.player.clubName ? `${champ.player.clubName} Dancer` : 'Dancer 2',
      tier: champ.player.tier === 'S' ? 'A' : 'B',
      isLeader: false,
      avatar: getTierAvatarUrl(isMale ? 'male' : 'female', champ.player.tier === 'S' ? 'a' : 'b'),
    },
    {
      name: champ.player.clubName ? `${champ.player.clubName} Star` : 'Star 3',
      tier: champ.player.tier === 'S' ? 'A' : 'B',
      isLeader: false,
      avatar: getTierAvatarUrl(isMale ? 'male' : 'female', champ.player.tier === 'S' ? 'a' : 'b'),
    },
  ]

  return (
    <motion.div
      ref={ref}
      style={style}
      variants={iosCardVariants.item}
      className="relative rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[280px] group cursor-default"
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
    >
      {/* Division-themed shimmer border effect */}
      <div className={`absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br ${theme.borderGradient}`}>
        <div className="w-full h-full rounded-2xl bg-transparent" />
      </div>

      {/* Division image background with hover zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url('${divisionImage}')` }}
      />

      {/* Dramatic overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/15" />
      {/* Secondary vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,hsl(var(--background)/0.5)_100%)]" />

      {/* Ambient glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-[60px] pointer-events-none opacity-20"
        style={{ background: theme.glowColor.replace('0.15', '0.6') }}
      />

      {/* Decorative corner accents with division color */}
      <div className={`absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 ${theme.cornerBorder} rounded-tl-sm`} />
      <div className={`absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 ${theme.cornerBorder} rounded-tr-sm`} />
      <div className={`absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 ${theme.cornerBorder} rounded-bl-sm`} />
      <div className={`absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 ${theme.cornerBorder} rounded-br-sm`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full p-4 text-center">
        {/* Division label */}
        <p className={`text-[9px] uppercase tracking-[0.2em] ${divisionColor} font-bold mb-2`}>
          {divisionLabel}
        </p>

        {/* Medal */}
        <span className="text-xl mb-2 drop-shadow-lg">🥇</span>

        {/* Team / Club name */}
        <p className="font-black text-base sm:text-lg text-white leading-tight mb-3 drop-shadow-md">
          {champ.player.clubName || champ.player.name}
        </p>

        {/* 3 Avatar cards — team members */}
        <div className="flex justify-center gap-3 mb-3">
          {teamMembers.map((member, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {/* Avatar circle with game character image */}
              <div
                className={`relative h-12 w-12 rounded-full overflow-hidden border-2 ${
                  member.isLeader
                    ? `ring-2 ${theme.leaderRing} ${theme.leaderBorder} shadow-md ${theme.leaderShadow}`
                    : 'border-border/40'
                }`}
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                {/* Leader crown */}
                {member.isLeader && (
                  <div className={`absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full ${theme.leaderBadge} flex items-center justify-center shadow-md`}>
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
                {/* Music note for non-leaders */}
                {!member.isLeader && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/80 flex items-center justify-center">
                    <Music className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              {/* Name */}
              <p className="text-[9px] text-white/70 font-medium truncate max-w-[52px] leading-tight">
                {member.name.length > 8 ? member.name.substring(0, 8) + '..' : member.name}
              </p>
              {/* Tier badge */}
              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full border ${tierColor(member.tier)}`}>
                {member.tier}
              </span>
            </div>
          ))}
        </div>

        {/* Points — glassmorphism pill */}
        <div className={`px-4 py-1.5 rounded-full bg-background/30 backdrop-blur-xl border ${theme.pointsBorder} shadow-lg`}>
          <span className={`text-sm font-bold ${theme.pointsText} tabular-nums`}>
            ⚡ {champ.points.toLocaleString()} pts
          </span>
        </div>
      </div>
    </motion.div>
  )
}
