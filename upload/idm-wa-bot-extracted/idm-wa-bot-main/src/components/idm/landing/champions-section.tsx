'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Trophy, Music, Users, Shield, Crown, Wallet, Flame, Play,
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
        style={{ backgroundColor: '#000000' }}
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
              title={cmsSections.champions?.title || 'Season Champion'}
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
                  backgroundColor: '#1c1c1e',
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
                        style={{ color: '#f5f5f7' }}
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
                          style={{ color: '#f5f5f7' }}
                        >
                          {leagueData.ligaChampion.name}
                        </h4>
                        <p
                          className="text-sm font-semibold mt-1"
                          style={{ color: '#d4a853' }}
                        >
                          Liga IDM Season {leagueData.ligaChampion.seasonNumber} Champion
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#8e8e93' }}>
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
                        style={{ color: '#8e8e93' }}
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
                                unoptimized
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
                              style={{ color: '#f5f5f7' }}
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
                                color: '#8e8e93',
                              }}
                            >
                              +{leagueData.ligaChampion.members.length - 5}
                            </div>
                            <p className="text-[9px] mt-1" style={{ color: '#8e8e93' }}>lainnya</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Label */}
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1" style={{ backgroundColor: 'rgba(56,56,58,1)' }} />
                    <div className="flex items-center gap-1.5" style={{ color: 'rgba(212,168,83,0.4)' }}>
                      <Trophy className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Liga IDM Champion</span>
                      <Trophy className="w-3 h-3" />
                    </div>
                    <div className="h-px flex-1" style={{ backgroundColor: 'rgba(56,56,58,1)' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== Division Cards — Side by Side ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isDataLoading ? (
              <>
                <ChampionCardSkeleton accent="#06b6d4" division="male" />
                <ChampionCardSkeleton accent="#a855f7" division="female" />
              </>
            ) : ([['male', maleData, Music], ['female', femaleData, Shield]] as const).map(([division, data, DivisionIcon], divIdx) => {
              const isMale = division === 'male';
              const accent = isMale ? '#06b6d4' : '#a855f7';
              const accentLight = isMale ? '#22d3ee' : '#c084fc';

              return (
                <motion.div
                  key={division}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4, delay: divIdx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {(!data || !data.weeklyChampions?.length) ? (
                    /* ===== Empty State ===== */
                    <div
                      className="rounded-[20px] overflow-hidden"
                      style={{
                        backgroundColor: '#1c1c1e',
                        border: '1px solid #38383a',
                      }}
                    >
                      {/* Division Accent Bar */}
                      <div className="h-1" style={{ backgroundColor: accent }} />

                      <div className="p-6">
                        {/* Division Header */}
                        <div className="flex items-center gap-3 mb-6">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: hexToRgba(accent, 0.15) }}
                          >
                            <DivisionIcon className="w-4 h-4" style={{ color: accentLight }} />
                          </div>
                          <div>
                            <h3
                              className="text-base font-black uppercase tracking-wider"
                              style={{ color: accentLight }}
                            >
                              {division} Division
                            </h3>
                            <p className="text-[10px] font-semibold" style={{ color: '#8e8e93' }}>
                              SEASON CHAMPION
                            </p>
                          </div>
                        </div>

                        {/* Empty State — Crown */}
                        <div className="flex flex-col items-center py-8">
                          <Crown
                            className="w-14 h-14 mb-4"
                            style={{ color: hexToRgba(accent, 0.25) }}
                          />
                          <p className="text-sm font-bold" style={{ color: '#f5f5f7' }}>
                            Musim Baru Dimulai
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#8e8e93' }}>
                            Season baru segera dimulai — jadilah champion pertama!
                          </p>
                        </div>

                        {/* Placeholder slots */}
                        <div className="flex justify-center gap-3 mt-4">
                          {[1, 2, 3].map(i => (
                            <div
                              key={i}
                              className="w-20 h-14 rounded-xl flex items-center justify-center"
                              style={{
                                border: `1px dashed ${hexToRgba(accent, 0.2)}`,
                                backgroundColor: hexToRgba(accent, 0.04),
                              }}
                            >
                              <span className="text-[10px] font-bold" style={{ color: hexToRgba(accent, 0.3) }}>
                                #{i}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (() => {
                    const champions = data.weeklyChampions;
                    const selected = champions[champions.length - 1];
                    return (
                      <div
                        className="rounded-[20px] overflow-hidden"
                        style={{
                          backgroundColor: '#1c1c1e',
                          border: '1px solid #38383a',
                        }}
                      >
                        {/* Division Accent Bar */}
                        <div className="h-1" style={{ backgroundColor: accent }} />

                        <div className="p-5 sm:p-6 space-y-4">
                          {/* Division Header + Week Badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: hexToRgba(accent, 0.15) }}
                              >
                                <DivisionIcon className="w-4 h-4" style={{ color: accentLight }} />
                              </div>
                              <div>
                                <h3
                                  className="text-base font-black uppercase tracking-wider"
                                  style={{ color: accentLight }}
                                >
                                  {division} Division
                                </h3>
                                <p className="text-[10px] font-semibold" style={{ color: '#8e8e93' }}>
                                  SEASON CHAMPION
                                </p>
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
                              style={{
                                backgroundColor: hexToRgba(accent, 0.15),
                                color: accentLight,
                                border: `1px solid ${hexToRgba(accent, 0.25)}`,
                              }}
                            >
                              <Crown className="w-3 h-3" />
                              Week {selected.weekNumber}
                            </span>
                          </div>

                          {/* Team Info Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Trophy className="w-5 h-5" style={{ color: accentLight }} />
                              <span
                                className="text-xl sm:text-2xl font-black"
                                style={{ color: '#f5f5f7' }}
                              >
                                {selected.winnerTeam?.name || 'TBD'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selected.prizePool > 0 && (
                                <span
                                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                                  style={{
                                    backgroundColor: 'rgba(212,168,83,0.12)',
                                    color: '#d4a853',
                                    border: '1px solid rgba(212,168,83,0.2)',
                                  }}
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  {selected.prizePool.toLocaleString()}
                                </span>
                              )}
                              {selected.mvp && (
                                <span
                                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                                  style={{
                                    backgroundColor: 'rgba(212,168,83,0.12)',
                                    color: '#d4a853',
                                    border: '1px solid rgba(212,168,83,0.2)',
                                  }}
                                >
                                  <Crown className="w-4 h-4" />
                                  MVP {selected.mvp.gamertag}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Separator */}
                          <div className="h-px" style={{ backgroundColor: '#38383a' }} />

                          {/* 3 Player Avatars */}
                          {selected.winnerTeam && selected.winnerTeam.players.length > 0 ? (
                            <div
                              className="grid grid-cols-3 gap-3 rounded-2xl p-3"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                border: `1px solid ${hexToRgba(accent, 0.1)}`,
                              }}
                            >
                              {selected.winnerTeam.players.slice(0, 3).map((player: { id: string; gamertag: string; avatar?: string | null; tier: string; points: number; totalWins: number; streak: number }, pIdx: number) => (
                                <div
                                  key={player.id}
                                  role="button"
                                  tabIndex={0}
                                  className="flex flex-col items-center cursor-pointer group/avatar"
                                  onClick={() => {
                                    const found = data.topPlayers?.find(tp => tp.id === player.id);
                                    if (found) setSelectedPlayer({ ...found, division });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      const found = data.topPlayers?.find(tp => tp.id === player.id);
                                      if (found) setSelectedPlayer({ ...found, division });
                                    }
                                  }}
                                >
                                  {/* Avatar */}
                                  <div
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden mb-2 transition-transform duration-200 group-hover/avatar:scale-105"
                                    style={{ border: `2px solid ${hexToRgba(accent, 0.35)}` }}
                                  >
                                    <Image
                                      src={getAvatarUrl(player.gamertag, division as 'male' | 'female', player.avatar)}
                                      alt={player.gamertag}
                                      width={80}
                                      height={80}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                    />
                                  </div>
                                  {/* Gamertag */}
                                  <p
                                    className="text-xs sm:text-sm font-bold truncate max-w-full text-center"
                                    style={{ color: '#f5f5f7' }}
                                  >
                                    {player.gamertag}
                                  </p>
                                  {/* Tier Badge */}
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {pIdx === 0 && (
                                      <span
                                        className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                                        style={{
                                          color: accentLight,
                                          backgroundColor: hexToRgba(accent, 0.2),
                                        }}
                                      >
                                        CPT
                                      </span>
                                    )}
                                  </div>
                                  {/* Stats Row */}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold" style={{ color: accentLight }}>
                                      {player.points}pts
                                    </span>
                                    <span className="text-[9px] font-bold" style={{ color: '#30d158' }}>
                                      {player.totalWins}W
                                    </span>
                                    <span className="text-[9px] font-bold flex items-center gap-0.5" style={{ color: '#ff9f0a' }}>
                                      <Flame className="w-2.5 h-2.5" />
                                      {player.streak}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              className="p-6 text-center text-sm rounded-xl"
                              style={{
                                color: '#8e8e93',
                                border: `1px dashed ${hexToRgba(accent, 0.15)}`,
                              }}
                            >
                              Belum ada data week ini
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
