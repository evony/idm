'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Trophy, Music, Users, Shield, Crown, Wallet, Flame, Play, Zap, Star, Medal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChampionCardSkeleton } from '../ui/skeleton';
import { SectionHeader } from './shared';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import type { StatsData } from '@/types/stats';

interface ChampionsSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  isDataLoading: boolean;
  cmsSections: Record<string, any>;
  championVideoUrl?: string;
  onVideoPlay?: (url: string, title: string) => void;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}

/* ═══════════════════════════════════════════
   Ghost Empty State — Simple clean version
   3 equal portrait slots with subtle placeholder
   ═══════════════════════════════════════════ */
function GhostPortraits({ accent, division }: { accent: string; division: 'male' | 'female' }) {
  const DivisionIcon = division === 'male' ? Music : Shield;
  const genderSymbol = division === 'male' ? '♂' : '♀';

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3 sm:gap-4 lg:gap-5">
        {[1, 2, 3].map((rank) => {
          const rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#b45309';
          const rankBg = rank === 1 ? 'esports-rank-1st' : rank === 2 ? 'esports-rank-2nd' : 'esports-rank-3rd';
          return (
            <div key={rank} className="flex flex-col items-center" style={{ width: '30%' }}>
              <div
                className="w-full rounded-2xl overflow-hidden border-2 opacity-20"
                style={{
                  borderColor: `${rankColor}30`,
                  aspectRatio: '3/4',
                  background: `linear-gradient(180deg, ${accent}06 0%, ${rankColor}06 50%, transparent 100%)`,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 opacity-40" style={{ color: rankColor }} />
                </div>
              </div>
              <span className={`${rankBg} mt-2 inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[8px] font-black leading-none tracking-wider opacity-30`}>
                {rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-center py-2">
        <Zap className="w-6 h-6 mx-auto mb-1.5 opacity-15" style={{ color: accent }} />
        <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">Musim Baru Dimulai</p>
        <p className="text-[10px] text-muted-foreground/30 mt-0.5">Jadilah champion pertama — daftar sekarang!</p>
      </div>
    </div>
  );
}

export function ChampionsSection({
  maleData,
  femaleData,
  leagueData,
  isDataLoading,
  cmsSections,
  championVideoUrl,
  onVideoPlay,
  setSelectedPlayer,
}: ChampionsSectionProps) {
  return (
    <>
      <section
        id="champions"
        role="region"
        aria-label="Season Champions"
        className="relative py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionHeader
              icon={Crown}
              label={cmsSections.champions?.subtitle || 'Aula Champion'}
              title={cmsSections.champions?.title || 'Juara Tarkam'}
              subtitle={cmsSections.champions?.description || 'Juara terbaru dari setiap divisi — 1 tim, 3 pemain, 1 gelar'}
            />
          </motion.div>

          {/* ===== Liga IDM Champion — Hero Card ===== */}
          {leagueData?.ligaChampion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <div
                className="relative rounded-[20px] overflow-hidden"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '2px solid rgba(212,168,83,0.4)',
                }}
              >
                {/* 4px Gold Accent Bar */}
                <div
                  className="h-1"
                  style={{ backgroundColor: '#d4a853' }}
                />

                <div className="relative z-10 p-6 sm:p-8">
                  {/* Video Play Button */}
                  {championVideoUrl && onVideoPlay && (
                    <button
                      onClick={() => onVideoPlay(championVideoUrl, 'Champion Showcase')}
                      className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'rgba(212,168,83,0.15)',
                        border: '1px solid rgba(212,168,83,0.3)',
                      }}
                      aria-label="Play champion video"
                    >
                      <Play className="w-4 h-4" style={{ color: '#d4a853', fill: '#d4a853' }} />
                      <span className="text-xs font-bold" style={{ color: '#d4a853' }}>Champion Video</span>
                    </button>
                  )}

                  {/* Header Row — Badges */}
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(212,168,83,0.12)' }}
                    >
                      <Trophy className="w-6 h-6" style={{ color: '#d4a853' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                          style={{
                            backgroundColor: 'rgba(212,168,83,0.12)',
                            color: '#d4a853',
                            border: '1px solid rgba(212,168,83,0.2)',
                          }}
                        >
                          Liga IDM
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                          style={{
                            backgroundColor: 'rgba(212,168,83,0.08)',
                            color: '#d4a853',
                            border: '1px solid rgba(212,168,83,0.15)',
                          }}
                        >
                          Season {leagueData.ligaChampion.seasonNumber} Champion
                        </span>
                      </div>
                      <h3
                        className="text-lg sm:text-xl font-black mt-1"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Liga IDM Season {leagueData.ligaChampion.seasonNumber}
                      </h3>
                    </div>
                  </div>

                  {/* Champion Club Display */}
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Club Logo + Name */}
                    <div className="flex flex-col items-center text-center sm:text-left sm:flex-row gap-4 flex-1">
                      <div className="relative">
                        <div
                          className="w-20 h-20 rounded-2xl overflow-hidden"
                          style={{
                            border: '2px solid rgba(212,168,83,0.3)',
                            backgroundColor: 'rgba(212,168,83,0.05)',
                          }}
                        >
                          <ClubLogoImage
                            clubName={leagueData.ligaChampion.name}
                            dbLogo={leagueData.ligaChampion.logo}
                            alt={leagueData.ligaChampion.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Crown badge */}
                        <div
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#d4a853' }}
                        >
                          <Crown className="w-3.5 h-3.5" style={{ color: '#1c1c1e' }} />
                        </div>
                      </div>
                      <div>
                        <h4
                          className="text-2xl sm:text-3xl font-black tracking-wide"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {leagueData.ligaChampion.name}
                        </h4>
                        <p
                          className="text-sm font-semibold mt-1"
                          style={{ color: '#d4a853' }}
                        >
                          Liga IDM Season {leagueData.ligaChampion.seasonNumber} Champion
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          Club terbaik di Liga IDM Season {leagueData.ligaChampion.seasonNumber}
                        </p>
                        {/* Division member counts */}
                        <div className="flex items-center gap-3 mt-3">
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                            style={{
                              backgroundColor: 'rgba(6,182,212,0.1)',
                              color: '#22d3ee',
                              border: '1px solid rgba(6,182,212,0.2)',
                            }}
                          >
                            <Users className="w-3 h-3" />
                            {leagueData.ligaChampion.members.filter((m: { division: string }) => m.division === 'male').length} Male
                          </span>
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                            style={{
                              backgroundColor: 'rgba(168,85,247,0.1)',
                              color: '#c084fc',
                              border: '1px solid rgba(168,85,247,0.2)',
                            }}
                          >
                            <Users className="w-3 h-3" />
                            {leagueData.ligaChampion.members.filter((m: { division: string }) => m.division === 'female').length} Female
                          </span>
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                            style={{
                              backgroundColor: 'rgba(212,168,83,0.1)',
                              color: '#d4a853',
                              border: '1px solid rgba(212,168,83,0.2)',
                            }}
                          >
                            <Users className="w-3 h-3" />
                            {leagueData.ligaChampion.members.length} Total
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Members — Clean Avatar Row */}
                    <div className="flex-1 w-full sm:w-auto">
                      <p
                        className="text-[10px] uppercase tracking-wider font-semibold mb-3 text-center sm:text-left"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        Skuad Champion
                      </p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                        {leagueData.ligaChampion.members.slice(0, 5).map((member: { id: string; gamertag: string; division: string; role: string; avatar?: string | null }, i: number) => (
                          <div
                            key={member.id}
                            className="relative flex flex-col items-center"
                          >
                            <div
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden transition-transform duration-200 hover:scale-105 cursor-default ${
                                member.role === 'captain' ? 'ring-2' : ''
                              }`}
                              style={{
                                border: `2px solid ${member.division === 'male' ? 'rgba(6,182,212,0.35)' : 'rgba(168,85,247,0.35)'}`,
                                ...(member.role === 'captain' ? { ringColor: 'rgba(212,168,83,0.5)' } : {}),
                              }}
                            >
                              <Image
                                src={getAvatarUrl(member.gamertag, member.division as 'male' | 'female', member.avatar)}
                                alt={member.gamertag}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            {/* Captain Crown Badge */}
                            {member.role === 'captain' && (
                              <div
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                                style={{ backgroundColor: '#d4a853' }}
                              >
                                <Crown className="w-2.5 h-2.5" style={{ color: '#1c1c1e' }} />
                              </div>
                            )}
                            <p
                              className="text-[9px] font-bold mt-1 truncate max-w-[64px] text-center"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {member.gamertag}
                            </p>
                            <p
                              className="text-[8px] font-medium capitalize"
                              style={{ color: member.division === 'male' ? '#22d3ee' : '#c084fc' }}
                            >
                              {member.division}
                            </p>
                          </div>
                        ))}
                        {leagueData.ligaChampion.members.length > 5 && (
                          <div className="flex flex-col items-center">
                            <div
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-sm font-bold"
                              style={{
                                border: '2px dashed rgba(142,142,147,0.3)',
                                backgroundColor: 'rgba(142,142,147,0.05)',
                                color: 'var(--muted-foreground)',
                              }}
                            >
                              +{leagueData.ligaChampion.members.length - 5}
                            </div>
                            <p className="text-[9px] mt-1" style={{ color: 'var(--muted-foreground)' }}>lainnya</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Label */}
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                    <div className="flex items-center gap-1.5" style={{ color: 'rgba(212,168,83,0.4)' }}>
                      <Trophy className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Liga IDM Champion</span>
                      <Trophy className="w-3 h-3" />
                    </div>
                    <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Division Cards — Clean Weekly Champion Style ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isDataLoading ? (
              <>
                <ChampionCardSkeleton accent="#06b6d4" division="male" />
                <ChampionCardSkeleton accent="#a855f7" division="female" />
              </>
            ) : ([['male', maleData, Music], ['female', femaleData, Shield]] as const).map(([division, data, DivisionIcon], divIdx) => {
              const isMale = division === 'male';
              const accent = isMale ? '#2E9FFF' : '#FF2D78';
              const accentLight = isMale ? '#57B5FF' : '#FF5C9A';
              const genderSymbol = isMale ? '♂' : '♀';

              const champions = data?.weeklyChampions || [];
              const hasChampions = champions.length > 0;
              const selected = hasChampions ? champions[champions.length - 1] : null;
              const winnerTeam = selected?.winnerTeam;
              const championPlayers = winnerTeam?.players || [];
              const mvpPlayer = selected?.mvp;

              return (
                <motion.div
                  key={division}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4, delay: divIdx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="esports-storm-bg rounded-[20px] border border-border/40 overflow-hidden">
                    {/* Division Accent Bar */}
                    <div className="h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

                    {/* Subtle light beams only */}
                    <div className="esports-light-beams" />
                    <div className="esports-champion-sweep" />

                    {/* ─── HEADER ─── */}
                    <div className="relative z-10 px-4 sm:px-5 lg:px-6 pt-5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${accent}20` }}
                        >
                          <DivisionIcon className="w-4 h-4" style={{ color: accent }} />
                        </div>
                        <h2
                          className="text-xl sm:text-2xl font-black uppercase tracking-wider esports-text-glow"
                          style={{ color: '#e5be4a' }}
                        >
                          JUARA TARKAM
                        </h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider ml-1" style={{ color: accent }}>
                          {division} {genderSymbol}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5">
                          {selected && (
                            <Badge className="text-[8px] font-black px-1.5 py-0.5 border-0" style={{ background: `${accent}20`, color: accent }}>
                              S{selected.seasonNumber}
                            </Badge>
                          )}
                          {hasChampions && selected && (
                            <Badge className="bg-idm-gold-warm/20 text-idm-gold-warm border border-idm-gold-warm/25 text-[8px] font-black px-1.5 py-0.5">
                              W{selected.weekNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ─── TEAM CHAMPION BANNER ─── */}
                    {hasChampions && winnerTeam ? (
                      <div className="relative z-10 px-4 sm:px-5 lg:px-6 pb-2">
                        <div
                          className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-border/40"
                          style={{ background: 'rgba(229, 190, 74, 0.04)' }}
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shrink-0">
                            <Crown className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-yellow-400 truncate">{winnerTeam.name || 'TBD'}</p>
                            <p className="text-[9px] text-muted-foreground">{selected?.tournamentName || 'Weekly Tournament'}</p>
                          </div>
                          {selected && selected.prizePool > 0 && (
                            <div
                              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg"
                              style={{ background: 'linear-gradient(135deg, rgba(229,190,74,0.15), rgba(229,190,74,0.05))' }}
                            >
                              <Wallet className="w-3 h-3 text-idm-gold-warm" />
                              <span className="text-[10px] font-black text-idm-gold-warm">
                                {selected.prizePool >= 1_000_000
                                  ? `${(selected.prizePool / 1_000_000).toFixed(1)}M`
                                  : selected.prizePool >= 1_000
                                    ? `${(selected.prizePool / 1_000).toFixed(0)}K`
                                    : `${selected.prizePool}`}
                              </span>
                            </div>
                          )}
                          {mvpPlayer && (
                            <div
                              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg"
                              style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))' }}
                            >
                              <Star className="w-3 h-3 text-yellow-400" />
                              <span className="text-[10px] font-black text-yellow-400">MVP</span>
                              <span className="text-[10px] font-bold text-foreground/70">{mvpPlayer.gamertag}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* ─── PLAYER PODIUM ─── */}
                    <div className="relative z-10 px-4 sm:px-5 lg:px-6 py-4">
                      {hasChampions && championPlayers.length > 0 ? (
                        <div className="flex items-end justify-center gap-2 sm:gap-3 lg:gap-5">
                          {/* Reorder: [2nd, 1st, 3rd] for podium layout */}
                          {(championPlayers.length >= 3
                            ? [championPlayers[1], championPlayers[0], championPlayers[2]]
                            : championPlayers.length === 2
                              ? [championPlayers[1], championPlayers[0]]
                              : championPlayers
                          ).map((player, podiumIdx) => {
                            const ranks = championPlayers.length >= 3 ? [2, 1, 3] : championPlayers.length === 2 ? [2, 1] : [1];
                            const rank = ranks[podiumIdx];
                            const isCenter = rank === 1;
                            const isMvp = mvpPlayer?.id === player.id;
                            const avatarUrl = getAvatarUrl(player.gamertag, division as 'male' | 'female', player.avatar);

                            const rankBadgeClass = rank === 1 ? 'esports-rank-1st' : rank === 2 ? 'esports-rank-2nd' : 'esports-rank-3rd';
                            const rankBorderColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#b45309';

                            return (
                              <div
                                key={player.id}
                                className={`esports-player-card relative flex flex-col items-center cursor-pointer ${isCenter ? 'z-10' : 'z-0'}`}
                                style={{ width: isCenter ? '38%' : '31%' }}
                                onClick={() => {
                                  const found = data?.topPlayers?.find(tp => tp.id === player.id);
                                  if (found) setSelectedPlayer({ ...found, division });
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    const found = data?.topPlayers?.find(tp => tp.id === player.id);
                                    if (found) setSelectedPlayer({ ...found, division });
                                  }
                                }}
                              >
                                {/* Avatar container */}
                                <div className="relative w-full">
                                  <div
                                    className="w-full rounded-2xl overflow-hidden border-2"
                                    style={{
                                      borderColor: isCenter ? `${rankBorderColor}80` : `${rankBorderColor}50`,
                                      aspectRatio: isCenter ? '3/4.5' : '3/4',
                                    }}
                                  >
                                    <Image
                                      src={avatarUrl}
                                      alt={player.gamertag}
                                      fill
                                      sizes="(max-width: 768px) 33vw, 200px"
                                      className="object-cover object-top"
                                      loading="lazy"
                                    />
                                    {/* Dark overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                    {/* Rank badge overlay */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                                      <span className={`${rankBadgeClass} inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[9px] font-black leading-none tracking-wider`}>
                                        {rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD'}
                                      </span>
                                    </div>

                                    {/* MVP badge */}
                                    {isMvp && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center"
                                          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)' }}
                                        >
                                          <Star className="w-3 h-3 text-white" />
                                        </div>
                                      </div>
                                    )}

                                    {/* Bottom info overlay */}
                                    <div className="absolute bottom-0 inset-x-0 p-2 z-10">
                                      <p className={`text-xs font-bold truncate text-center ${isCenter ? 'text-yellow-300' : 'text-white'}`}>
                                        {player.gamertag}
                                      </p>
                                      <div className="flex items-center justify-center gap-1.5 mt-1">
                                        <span className="text-[9px] font-bold text-idm-gold-warm">{player.points}pts</span>
                                        <span className="text-[8px] text-white/30">·</span>
                                        <span className="text-[9px] font-bold text-green-400">{player.totalWins}W</span>
                                        {player.streak > 1 && (
                                          <>
                                            <span className="text-[8px] text-white/30">·</span>
                                            <div className="flex items-center gap-0.5">
                                              <Flame className="w-2.5 h-2.5 text-orange-400" />
                                              <span className="text-[9px] font-bold text-orange-400">{player.streak}</span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* MVP label below center player */}
                                {isMvp && isCenter && (
                                  <Badge
                                    className="mt-1.5 text-[7px] font-black px-2 py-0.5 border-0"
                                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1a1a2e' }}
                                  >
                                    <Star className="w-2.5 h-2.5 mr-0.5" />MVP
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* ─── Ghost Empty State ─── */
                        <GhostPortraits accent={accent} division={division} />
                      )}
                    </div>

                    {/* Extra players if team has more than 3 */}
                    {hasChampions && championPlayers.length > 3 && (
                      <div className="relative z-10 px-4 sm:px-5 lg:px-6 pb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider font-semibold">Also:</span>
                          {championPlayers.slice(3).map((p) => (
                            <Badge key={p.id} variant="outline" className="text-[8px] h-5 px-1.5 border-border/40 text-muted-foreground">
                              {p.gamertag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ─── FOOTER BADGE ─── */}
                    <div className="relative z-10 px-4 sm:px-5 lg:px-6 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                        <div className="flex items-center gap-1.5" style={{ color: `${accent}50` }}>
                          <Trophy className="w-3 h-3" />
                          <span className="text-[8px] font-bold uppercase tracking-widest">{division} Division</span>
                          <Trophy className="w-3 h-3" />
                        </div>
                        <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
