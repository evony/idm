'use client';

import Image from 'next/image';
import { AvatarMedia } from '@/components/ui/avatar-media';
import { Music, Shield, ChevronUp, ChevronDown, Trophy, CheckCircle2, History } from 'lucide-react';
import { SectionHeader } from './shared';
import { CardSkeleton } from '../ui/skeleton';
import { getAvatarUrl, clubToString, isVideoUrl } from '@/lib/utils';
import type { StatsData, PlayerSkinInfo } from '@/types/stats';
import {
  getPrimarySkin,
  resolveSkinColors,
  parseColorStops,
  filterActiveSkins,
} from '@/lib/skin-utils';
import type { SkinColors } from '@/lib/skin-utils';

interface PlayersSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  isSeasonSwitching: boolean;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
  showAllMalePlayers: boolean;
  setShowAllMalePlayers: (show: boolean) => void;
  showAllFemalePlayers: boolean;
  setShowAllFemalePlayers: (show: boolean) => void;
  selectedSeasonId: string | null;
  setSelectedSeasonId: (id: string | null) => void;
  isHistorical: boolean;
  /** Per-player skin data map for male division. Falls back to maleData.skinMap if not provided. */
  maleSkinMap?: Record<string, PlayerSkinInfo[]>;
  /** Per-player skin data map for female division. Falls back to femaleData.skinMap if not provided. */
  femaleSkinMap?: Record<string, PlayerSkinInfo[]>;
}

/** Resolve skin info for a single player from the skin map */
function resolvePlayerSkin(
  playerId: string,
  skinMap: Record<string, PlayerSkinInfo[]> | undefined,
): { primarySkin: PlayerSkinInfo | null; skinColors: SkinColors | null; primaryNameColor: string | null } {
  const playerSkins = skinMap?.[playerId] || [];
  const activeSkins = filterActiveSkins(playerSkins);
  const primarySkin = getPrimarySkin(activeSkins);
  const skinColors = primarySkin ? resolveSkinColors(primarySkin) : null;
  const nameStops = skinColors ? parseColorStops(skinColors.name) : [];
  const primaryNameColor = nameStops[1] || nameStops[0] || null;
  return { primarySkin, skinColors, primaryNameColor };
}

export function PlayersSection({
  maleData,
  femaleData,
  isDataLoading,
  isSeasonSwitching,
  setSelectedPlayer,
  showAllMalePlayers,
  setShowAllMalePlayers,
  showAllFemalePlayers,
  setShowAllFemalePlayers,
  selectedSeasonId,
  setSelectedSeasonId,
  isHistorical,
  maleSkinMap: _maleSkinMap,
  femaleSkinMap: _femaleSkinMap,
}: PlayersSectionProps) {
  // Prefer the explicit prop, fall back to data-embedded skinMap
  const maleSkinMap = _maleSkinMap ?? maleData?.skinMap;
  const femaleSkinMap = _femaleSkinMap ?? femaleData?.skinMap;

  // ── Season Selector Data ──
  // Merge unique seasons from both divisions (deduplicate by season number)
  const allSeasons = maleData?.allSeasons || femaleData?.allSeasons || [];
  const uniqueSeasonNumbers = [...new Set(allSeasons.map(s => s.number))];
  const seasonsForSelector = uniqueSeasonNumbers.map(num => {
    const maleSeason = allSeasons.find(s => s.number === num);
    return maleSeason!;
  }).sort((a, b) => b.number - a.number); // S2 first, S1 second

  // Sort players
  const malePlayers = [...(maleData?.topPlayers || [])].sort((a, b) => isHistorical ? b.points - a.points : a.gamertag.localeCompare(b.gamertag));
  const femalePlayers = [...(femaleData?.topPlayers || [])].sort((a, b) => isHistorical ? b.points - a.points : a.gamertag.localeCompare(b.gamertag));

  return (
    <section id="players" className="landing-section relative py-16 sm:py-24 px-4 overflow-hidden bg-deep">
      {/* Background — 2 layers only */}
      <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.07) 0%, transparent 50%), radial-gradient(ellipse at 12% 50%, rgba(46,159,255,0.05) 0%, transparent 40%), radial-gradient(ellipse at 88% 50%, rgba(255,45,120,0.05) 0%, transparent 40%)' }} />
      {/* Top edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.3)] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[rgba(212,168,83,0.025)] to-transparent pointer-events-none" aria-hidden="true" />
      {/* Bottom edge glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.15)] to-transparent" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="stagger-item">
          <SectionHeader icon={Music} label="Pemain" title="Player Tarkam" subtitle="Player terbaik yang bertarung di arena Tarkam IDM" />

          {/* ═══ Season Selector ═══ */}
          {seasonsForSelector.length > 1 && (
            <div className="stagger-item-fast mb-6 flex flex-col items-center gap-3" style={{ animationDelay: '30ms' }}>
              {/* Season Pills */}
              <div className="flex items-center gap-2">
                {seasonsForSelector.map(season => {
                  const isActive = season.status === 'active';
                  const isCompleted = season.status === 'completed';
                  const isSelected = selectedSeasonId === null
                    ? isActive
                    : selectedSeasonId === season.id;

                  return (
                    <button
                      key={season.id}
                      onClick={() => {
                        if (isSelected && isActive) return;
                        setSelectedSeasonId(isActive ? null : season.id);
                      }}
                      className={`
                        inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold
                        transition-all duration-200 cursor-pointer border
                        ${isSelected
                          ? 'bg-[#d4a853]/15 border-[#d4a853]/40 text-[#d4a853] shadow-[0_0_12px_rgba(212,168,83,0.15)]'
                          : 'bg-transparent border-[#d4a853]/10 text-muted-foreground/70 hover:border-[#d4a853]/25 hover:text-[#d4a853]/60'
                        }
                      `}
                      aria-label={`Select ${season.name}`}
                      aria-pressed={isSelected}
                    >
                      <span className="font-black">S{season.number}</span>
                      {isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                      )}
                      {isCompleted && (
                        <CheckCircle2 className="w-3 h-3 text-[#d4a853]/60" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Historical Data Badge */}
              {isHistorical && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5">
                  <History className="w-3 h-3 text-[#d4a853]/70" />
                  <span className="text-[10px] font-bold text-[#d4a853]/70 uppercase tracking-wider">
                    Data Historis — Season {seasonsForSelector.find(s => s.id === selectedSeasonId)?.number || '?'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Season switch loading indicator — subtle shimmer bar */}
        {isSeasonSwitching && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-1 w-24 rounded-full overflow-hidden bg-[#d4a853]/10">
              <div className="h-full w-1/3 bg-[#d4a853]/40 rounded-full animate-pulse" style={{ animation: 'shimmer 1.5s infinite linear' }} />
            </div>
            <span className="text-[10px] font-bold text-[#d4a853]/50 uppercase tracking-wider">Memuat data season...</span>
          </div>
        )}

        {isDataLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {['Male', 'Female'].map(div => (
              <div key={div}>
                <div className="flex items-center justify-center mb-6">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    div === 'Male' ? 'bg-[#2E9FFF]/10 text-[#57B5FF] border border-[#2E9FFF]/15' : 'bg-[#FF2D78]/10 text-[#FF5C9A] border border-[#FF2D78]/15'
                  }`}>
                    {div === 'Male' ? '♂' : '♀'} {div} Division
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CardSkeleton key={i} className="h-56" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ═══════════════ MALE DIVISION ═══════════════ */}
            <div>
              {/* Division header badge */}
              <div className="flex items-center justify-center mb-6">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(46,159,255,0.12) 0%, rgba(46,159,255,0.04) 100%)',
                    color: '#57B5FF',
                    borderColor: 'rgba(46,159,255,0.2)',
                    boxShadow: '0 0 8px rgba(46,159,255,0.06)',
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(46,159,255,0.3), transparent)' }} />
                  ♂ Male Division
                </span>
              </div>

              {malePlayers.length === 0 ? (
                <div className="py-12 text-center">
                  <Music className="w-10 h-10 text-[#2E9FFF]/15 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada player male</p>
                </div>
              ) : (
                <>
                  {/* Player Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(showAllMalePlayers ? malePlayers : malePlayers.slice(0, 8)).map((player, idx) => {
                      const isTop3 = idx < 3 && isHistorical;
                      const isChampion = idx === 0 && isHistorical;
                      const hiddenOnMobile = !showAllMalePlayers && idx >= 6;
                      const playerClub = clubToString((player as any).club);

                      // ── Skin resolution ──
                      const { primarySkin, skinColors, primaryNameColor } = resolvePlayerSkin(player.id, maleSkinMap);

                      return (
                        <div
                          key={`male-${player.id}-${idx}`}
                          className={`stagger-item-fast cursor-pointer group/player ${hiddenOnMobile ? 'hidden sm:block' : ''}`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          onClick={() => setSelectedPlayer({ ...player, division: 'male' })}
                        >
                          <div
                            className={`ios-player-card relative text-center transition-all duration-300 group-hover/player:-translate-y-1 ${
                              skinColors
                                ? ''
                                : isChampion
                                  ? 'border-[rgba(212,168,83,0.25)]'
                                  : isTop3
                                    ? 'border-[rgba(46,159,255,0.2)]'
                                    : 'border-[rgba(212,168,83,0.08)]'
                            }`}
                            style={{
                              background: skinColors
                                ? `linear-gradient(180deg, ${skinColors.frame}08 0%, var(--bg-mid) 40%)`
                                : isChampion
                                  ? 'linear-gradient(180deg, rgba(212,168,83,0.08) 0%, var(--bg-mid) 40%)'
                                  : isTop3
                                    ? 'linear-gradient(180deg, rgba(46,159,255,0.06) 0%, var(--bg-mid) 40%)'
                                    : 'linear-gradient(180deg, rgba(46,159,255,0.03) 0%, var(--bg-mid) 40%)',
                              borderColor: skinColors ? skinColors.frame + '40' : undefined,
                              boxShadow: skinColors
                                ? `0 0 10px ${skinColors.glow}`
                                : isChampion
                                  ? '0 0 10px rgba(212,168,83,0.12)'
                                  : isTop3
                                    ? '0 0 8px rgba(46,159,255,0.08)'
                                    : '0 1px 4px rgba(0,0,0,0.12)',
                            }}
                          >
                            {/* iOS Gold accent line at top */}
                            <div
                              className="ios-gold-line"
                            />

                            {/* Avatar watermark background */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.10] group-hover/player:opacity-[0.13] transition-opacity duration-500 pointer-events-none">
                              <AvatarMedia src={getAvatarUrl(player.gamertag, 'male', player.avatar)} alt="" width={160} height={160} className="w-[70%] h-auto aspect-square rounded-full" aria-hidden="true" />
                            </div>

                            {/* Card content */}
                            <div className="relative z-10 flex flex-col items-center px-4 pt-8 pb-5">
                              {/* Large centered avatar with glow ring */}
                              <div className="relative mb-4">
                                {/* Outer glow ring */}
                                <div
                                  className={`absolute -inset-1.5 rounded-3xl transition-all duration-500 ${
                                    isChampion && !skinColors ? 'shadow-[0_0_16px_rgba(212,168,83,0.3)]' : isTop3 && !skinColors ? 'shadow-[0_0_12px_rgba(46,159,255,0.2)]' : ''
                                  }`}
                                  style={skinColors
                                    ? {
                                        background: `linear-gradient(135deg, ${skinColors.glow.replace(/[\d.]+\)$/, '0.25)')}, ${skinColors.glow.replace(/[\d.]+\)$/, '0.08)')})`,
                                        boxShadow: `0 0 14px ${skinColors.glow}`,
                                      }
                                    : isChampion
                                      ? { background: 'linear-gradient(135deg, rgba(212,168,83,0.25), rgba(212,168,83,0.08))' }
                                      : isTop3
                                        ? { background: 'linear-gradient(135deg, rgba(46,159,255,0.2), rgba(46,159,255,0.06))' }
                                        : { background: 'linear-gradient(135deg, rgba(46,159,255,0.12), rgba(46,159,255,0.03))' }
                                  }
                                />
                                {/* Avatar container */}
                                <div
                                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-mid border-2 flex items-center justify-center group-hover/player:scale-105 transition-all duration-500"
                                  style={skinColors
                                    ? { borderColor: skinColors.frame + '33' }
                                    : { borderColor: 'rgba(46,159,255,0.2)' }
                                  }
                                >
                                  <AvatarMedia src={getAvatarUrl(player.gamertag, 'male', player.avatar)} alt={player.gamertag} fill sizes="(max-width: 640px) 80px, 96px" objectPosition="center 37%" />
                                </div>
                                {/* Champion badge — iOS gold */}
                                {isChampion && (
                                  <div className="absolute -top-2 -right-2 z-20 min-w-[22px] h-[22px] rounded-full ios-rank-gold flex items-center justify-center border-2 border-mid">
                                    <span className="text-[8px] font-black text-mid leading-none">#1</span>
                                  </div>
                                )}
                                {/* Top3 badge — iOS silver/bronze */}
                                {isTop3 && !isChampion && (
                                  <div className={`absolute -top-2 -right-2 z-20 min-w-[22px] h-[22px] rounded-full ${idx === 1 ? 'ios-rank-silver' : 'ios-rank-bronze'} flex items-center justify-center border-2 border-mid`}>
                                    <span className="text-[8px] font-black text-mid leading-none">#{idx + 1}</span>
                                  </div>
                                )}

                              </div>

                              {/* Player Gamertag with skin colors */}
                              <p
                                className={`text-sm font-black truncate max-w-full transition-colors duration-200 mt-1 flex items-center justify-center gap-1 ios-heading ${
                                  skinColors
                                    ? ''
                                    : isChampion
                                      ? 'text-[#d4a853] dark:text-[#d4a853] text-idm-gold-warm'
                                      : isTop3
                                        ? 'text-[#57B5FF] dark:text-[#57B5FF] text-idm-male'
                                        : 'text-white dark:text-white text-foreground group-hover/player:text-[#57B5FF]'
                                }`}
                                style={skinColors ? {
                                  color: primaryNameColor || skinColors.frame,
                                  textShadow: `0 0 6px ${skinColors.glow}, 0 0 16px ${skinColors.glow}`,
                                } : undefined}
                              >
                                {primarySkin && (
                                  <span
                                    style={{ fontSize: '12px', lineHeight: 1 }}
                                    title={primarySkin.displayName}
                                    role="img"
                                    aria-label={primarySkin.displayName}
                                  >
                                    {primarySkin.icon}
                                  </span>
                                )}
                                {player.gamertag}
                              </p>

                              {/* Club name */}
                              {playerClub && (
                                <div className="flex items-center justify-center gap-1 mt-1.5">
                                  <Shield className="w-2.5 h-2.5 text-[#57B5FF]/80" />
                                  <span className="text-[10px] text-[#8FCEFF]/90 font-medium truncate">{playerClub}</span>
                                </div>
                              )}

                              {/* Stats row */}
                              <div
                                className="mt-2.5 flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg mx-auto"
                                style={{ background: 'rgba(212,168,83,0.04)' }}
                              >
                                <div className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3 text-[#d4a853]/50" />
                                  <span className="text-[10px] text-[#d4a853]/70 font-bold">{player.points.toLocaleString('id-ID')} pts</span>
                                </div>
                                {!isHistorical && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-green-400/70 font-bold">{player.totalWins}W</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More/Less Button */}
                  {malePlayers.length > 6 && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setShowAllMalePlayers(!showAllMalePlayers)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-semibold transition-all duration-300 cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(46,159,255,0.08) 0%, rgba(46,159,255,0.03) 100%)',
                          color: '#57B5FF',
                          borderColor: 'rgba(46,159,255,0.2)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46,159,255,0.15) 0%, rgba(46,159,255,0.06) 100%)';
                          e.currentTarget.style.borderColor = 'rgba(46,159,255,0.35)';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(46,159,255,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46,159,255,0.08) 0%, rgba(46,159,255,0.03) 100%)';
                          e.currentTarget.style.borderColor = 'rgba(46,159,255,0.2)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {showAllMalePlayers ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Tampilkan Lebih Sedikit
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Lihat Semua ({malePlayers.length} Player)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ═══════════════ FEMALE DIVISION ═══════════════ */}
            <div>
              {/* Division header badge */}
              <div className="flex items-center justify-center mb-6">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,45,120,0.12) 0%, rgba(255,45,120,0.04) 100%)',
                    color: '#FF5C9A',
                    borderColor: 'rgba(255,45,120,0.2)',
                    boxShadow: '0 0 8px rgba(255,45,120,0.06)',
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,45,120,0.3), transparent)' }} />
                  ♀ Female Division
                </span>
              </div>

              {femalePlayers.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="w-10 h-10 text-[#FF2D78]/15 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada player female</p>
                </div>
              ) : (
                <>
                  {/* Player Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(showAllFemalePlayers ? femalePlayers : femalePlayers.slice(0, 8)).map((player, idx) => {
                      const isTop3 = idx < 3 && isHistorical;
                      const isChampion = idx === 0 && isHistorical;
                      const hiddenOnMobile = !showAllFemalePlayers && idx >= 6;
                      const playerClub = clubToString((player as any).club);

                      // ── Skin resolution ──
                      const { primarySkin, skinColors, primaryNameColor } = resolvePlayerSkin(player.id, femaleSkinMap);

                      return (
                        <div
                          key={`female-${player.id}-${idx}`}
                          className={`stagger-item-fast cursor-pointer group/player ${hiddenOnMobile ? 'hidden sm:block' : ''}`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          onClick={() => setSelectedPlayer({ ...player, division: 'female' })}
                        >
                          <div
                            className={`ios-player-card relative text-center transition-all duration-300 group-hover/player:-translate-y-1 ${
                              skinColors
                                ? ''
                                : isChampion
                                  ? 'border-[rgba(212,168,83,0.25)]'
                                  : isTop3
                                    ? 'border-[rgba(255,45,120,0.2)]'
                                    : 'border-[rgba(212,168,83,0.08)]'
                            }`}
                            style={{
                              background: skinColors
                                ? `linear-gradient(180deg, ${skinColors.frame}08 0%, var(--bg-mid) 40%)`
                                : isChampion
                                  ? 'linear-gradient(180deg, rgba(212,168,83,0.08) 0%, var(--bg-mid) 40%)'
                                  : isTop3
                                    ? 'linear-gradient(180deg, rgba(255,45,120,0.06) 0%, var(--bg-mid) 40%)'
                                    : 'linear-gradient(180deg, rgba(255,45,120,0.03) 0%, var(--bg-mid) 40%)',
                              borderColor: skinColors ? skinColors.frame + '40' : undefined,
                              boxShadow: skinColors
                                ? `0 0 10px ${skinColors.glow}`
                                : isChampion
                                  ? '0 0 10px rgba(212,168,83,0.12)'
                                  : isTop3
                                    ? '0 0 8px rgba(255,45,120,0.08)'
                                    : '0 1px 4px rgba(0,0,0,0.12)',
                            }}
                          >
                            {/* iOS Gold accent line at top */}
                            <div
                              className="ios-gold-line"
                            />

                            {/* Avatar watermark background */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.10] group-hover/player:opacity-[0.13] transition-opacity duration-500 pointer-events-none">
                              <AvatarMedia src={getAvatarUrl(player.gamertag, 'female', player.avatar)} alt="" width={160} height={160} className="w-[70%] h-auto aspect-square rounded-full" aria-hidden="true" />
                            </div>

                            {/* Card content */}
                            <div className="relative z-10 flex flex-col items-center px-4 pt-8 pb-5">
                              {/* Large centered avatar with glow ring */}
                              <div className="relative mb-4">
                                {/* Outer glow ring */}
                                <div
                                  className={`absolute -inset-1.5 rounded-3xl transition-all duration-500 ${
                                    isChampion && !skinColors ? 'shadow-[0_0_16px_rgba(212,168,83,0.3)]' : isTop3 && !skinColors ? 'shadow-[0_0_12px_rgba(255,45,120,0.2)]' : ''
                                  }`}
                                  style={skinColors
                                    ? {
                                        background: `linear-gradient(135deg, ${skinColors.glow.replace(/[\d.]+\)$/, '0.25)')}, ${skinColors.glow.replace(/[\d.]+\)$/, '0.08)')})`,
                                        boxShadow: `0 0 14px ${skinColors.glow}`,
                                      }
                                    : isChampion
                                      ? { background: 'linear-gradient(135deg, rgba(212,168,83,0.25), rgba(212,168,83,0.08))' }
                                      : isTop3
                                        ? { background: 'linear-gradient(135deg, rgba(255,45,120,0.2), rgba(255,45,120,0.06))' }
                                        : { background: 'linear-gradient(135deg, rgba(255,45,120,0.12), rgba(255,45,120,0.03))' }
                                  }
                                />
                                {/* Avatar container */}
                                <div
                                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-mid border-2 flex items-center justify-center group-hover/player:scale-105 transition-all duration-500"
                                  style={skinColors
                                    ? { borderColor: skinColors.frame + '33' }
                                    : { borderColor: 'rgba(255,45,120,0.2)' }
                                  }
                                >
                                  <AvatarMedia src={getAvatarUrl(player.gamertag, 'female', player.avatar)} alt={player.gamertag} fill sizes="(max-width: 640px) 80px, 96px" objectPosition="center 37%" />
                                </div>
                                {/* Champion badge — iOS gold */}
                                {isChampion && (
                                  <div className="absolute -top-2 -right-2 z-20 min-w-[22px] h-[22px] rounded-full ios-rank-gold flex items-center justify-center border-2 border-mid">
                                    <span className="text-[8px] font-black text-mid leading-none">#1</span>
                                  </div>
                                )}
                                {/* Top3 badge — iOS silver/bronze */}
                                {isTop3 && !isChampion && (
                                  <div className={`absolute -top-2 -right-2 z-20 min-w-[22px] h-[22px] rounded-full ${idx === 1 ? 'ios-rank-silver' : 'ios-rank-bronze'} flex items-center justify-center border-2 border-mid`}>
                                    <span className="text-[8px] font-black text-mid leading-none">#{idx + 1}</span>
                                  </div>
                                )}

                              </div>

                              {/* Player Gamertag with skin colors */}
                              <p
                                className={`text-sm font-black truncate max-w-full transition-colors duration-200 mt-1 flex items-center justify-center gap-1 ios-heading ${
                                  skinColors
                                    ? ''
                                    : isChampion
                                      ? 'text-[#d4a853] dark:text-[#d4a853] text-idm-gold-warm'
                                      : isTop3
                                        ? 'text-[#FF5C9A] dark:text-[#FF5C9A] text-idm-female'
                                        : 'text-white dark:text-white text-foreground group-hover/player:text-[#FF5C9A]'
                                }`}
                                style={skinColors ? {
                                  color: primaryNameColor || skinColors.frame,
                                  textShadow: `0 0 6px ${skinColors.glow}, 0 0 16px ${skinColors.glow}`,
                                } : undefined}
                              >
                                {primarySkin && (
                                  <span
                                    style={{ fontSize: '12px', lineHeight: 1 }}
                                    title={primarySkin.displayName}
                                    role="img"
                                    aria-label={primarySkin.displayName}
                                  >
                                    {primarySkin.icon}
                                  </span>
                                )}
                                {player.gamertag}
                              </p>

                              {/* Club name */}
                              {playerClub && (
                                <div className="flex items-center justify-center gap-1 mt-1.5">
                                  <Shield className="w-2.5 h-2.5 text-[#FF5C9A]/80" />
                                  <span className="text-[10px] text-[#FF8FBC]/90 font-medium truncate">{playerClub}</span>
                                </div>
                              )}

                              {/* Stats row */}
                              <div
                                className="mt-2.5 flex items-center justify-center gap-3 px-3 py-1.5 rounded-lg mx-auto"
                                style={{ background: 'rgba(212,168,83,0.04)' }}
                              >
                                <div className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3 text-[#d4a853]/50" />
                                  <span className="text-[10px] text-[#d4a853]/70 font-bold">{player.points.toLocaleString('id-ID')} pts</span>
                                </div>
                                {!isHistorical && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-green-400/70 font-bold">{player.totalWins}W</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More/Less Button */}
                  {femalePlayers.length > 6 && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setShowAllFemalePlayers(!showAllFemalePlayers)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-semibold transition-all duration-300 cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,45,120,0.08) 0%, rgba(255,45,120,0.03) 100%)',
                          color: '#FF5C9A',
                          borderColor: 'rgba(255,45,120,0.2)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,45,120,0.15) 0%, rgba(255,45,120,0.06) 100%)';
                          e.currentTarget.style.borderColor = 'rgba(255,45,120,0.35)';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(255,45,120,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,45,120,0.08) 0%, rgba(255,45,120,0.03) 100%)';
                          e.currentTarget.style.borderColor = 'rgba(255,45,120,0.2)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {showAllFemalePlayers ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Tampilkan Lebih Sedikit
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Lihat Semua ({femalePlayers.length} Player)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
