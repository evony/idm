'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import {
  Trophy, Calendar, Swords,
  Star, Users, Flame, TrendingUp,
  Medal, Gem, Award, Crown,
  Music, Shield,
} from 'lucide-react';
import { SectionHeader, AnimatedSection } from './shared';
import { getAvatarUrl, hexToRgba } from '@/lib/utils';
import type { StatsData, TopPlayer, MvpHallOfFameEntry, WeeklyChampion } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — HIGHLIGHTS SECTION (PUNCAK PRESTASI)
   Clean Apple iOS Premium Style — Reference Design Clone

   2 Highlight Categories:
   1. Juara Tarkam Weekly — Champion Card + Division Cards
   2. MVP Terbaru — MVP Arena Cards (Male/Female)

   Design: Clean cards with colored top accent bars,
   NO heavy glassmorphism, NO gold grid textures, NO watermarks.
   ═══════════════════════════════════════════════════════════════ */

interface HighlightsSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onVideoPlay?: (url: string, title: string) => void;
  setSelectedPlayer: (player: any) => void;
  /** Set a preferred skin type when opening profile from specific context (e.g. 'mvp') */
  setPreferredSkinType?: (type: string | null) => void;
}

/* ─── Duo Player Data ─── */
interface DuoPlayer {
  gamertag: string;
  imageUrl?: string;
  tier?: string;
  points: number;
  totalWins: number;
  streak: number;
  totalMvp?: number;
  mvpWeek?: number;
  weeklyPointsGained?: number;
  player: TopPlayer & { division?: string };
  isEmpty?: boolean;
}

/* ─── Tarkam Weekly Team Player ─── */
interface TarkamTeamPlayer {
  id: string;
  gamertag: string;
  avatar?: string | null;
  tier: string;
  points: number;
  totalWins: number;
  totalMvp: number;
  streak: number;
  matches: number;
  division: string;
  club?: string | { id: string; name: string; logo?: string | null } | null;
  city?: string;
}

/* ─── Tarkam Weekly Team Data ─── */
interface TarkamWeeklyTeam {
  teamName: string;
  weekNumber: number;
  players: TarkamTeamPlayer[];
}

/* ─── Highlight Item Type ─── */
interface HighlightItem {
  id: string;
  type: 'rank1' | 'performance' | 'rank1-club' | 'tarkam-weekly' | 'mvp';
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  thumbLabel: string;
  accentColor: string;
  accentLight: string;
  isDuo?: boolean;
  male?: DuoPlayer;
  female?: DuoPlayer;
  maleAccent: string;
  femaleAccent: string;
  maleAccentLight: string;
  femaleAccentLight: string;
  imageUrl?: string;
  clubName?: string;
  clubLogo?: string | null;
  metadata: { icon: typeof Calendar; label: string; value: string }[];
  isEmpty?: boolean;
  mvpWeek?: number;
  mvpCount?: number;
  weekNumber?: number;
  weeklyPointsGained?: number;
  tarkamWeeklyTeams?: {
    male?: TarkamWeeklyTeam;
    female?: TarkamWeeklyTeam;
  };
}

/* ─── Color System — Consistent with Landing Page ─── */
const COLORS = {
  cardBg: 'var(--bg-mid)',
  cardBorder: 'rgba(212,168,83,0.1)',
  goldBorder: 'rgba(212,168,83,0.4)',
  primaryText: 'var(--card-foreground)',
  secondaryText: 'var(--muted-foreground)',
  maleAccent: 'rgb(46, 159, 255)',
  maleAccentLight: 'rgb(87, 181, 255)',
  femaleAccent: 'rgb(255, 45, 120)',
  femaleAccentLight: 'rgb(255, 92, 154)',
  gold: 'rgb(212, 168, 83)',
} as const;

/* ─── Platinum Skin Constants — MVP Hall of Fame ─── */
const PLATINUM = {
  frame: '#E5E4E2',
  nameLight: '#F5F5F5',
  nameMid: '#E5E4E2',
  nameDark: '#B0B0B0',
  badgeBg: 'rgba(229,228,226,0.2)',
  badgeText: '#F5F5F5',
  glow: 'rgba(229,228,226,0.5)',
  icon: '⭐',
  rgb: '229,228,226',
} as const;

/* ─── Build Highlight Items from Data ─── */
function buildHighlights(
  maleData: StatsData | undefined,
  femaleData: StatsData | undefined,
  leagueData: any
): HighlightItem[] {
  const items: HighlightItem[] = [];

  /* ═══════════════════════════════════════════════════════════
     2 DUO HIGHLIGHT CATEGORIES (ORDER):
     1. Juara Tarkam Weekly — Latest winning team Male + Female (team display)
     2. MVP Terbaru — Male + Female MVP (duo)
     ═══════════════════════════════════════════════════════════ */

  // ─── 1. Juara Tarkam Weekly ───
  const maleWeeklyChampions = maleData?.weeklyChampions || [];
  const femaleWeeklyChampions = femaleData?.weeklyChampions || [];
  const latestMaleWeeklyChamp = maleWeeklyChampions.length > 0 ? maleWeeklyChampions[maleWeeklyChampions.length - 1] : null;
  const latestFemaleWeeklyChamp = femaleWeeklyChampions.length > 0 ? femaleWeeklyChampions[femaleWeeklyChampions.length - 1] : null;
  const hasMaleWeeklyTeam = !!(latestMaleWeeklyChamp?.winnerTeam?.players?.length);
  const hasFemaleWeeklyTeam = !!(latestFemaleWeeklyChamp?.winnerTeam?.players?.length);
  const tarkamWeeklyIsEmpty = !hasMaleWeeklyTeam && !hasFemaleWeeklyTeam;

  const maleTeamData: TarkamWeeklyTeam | undefined = hasMaleWeeklyTeam ? {
    teamName: latestMaleWeeklyChamp!.winnerTeam!.name,
    weekNumber: latestMaleWeeklyChamp!.weekNumber,
    players: latestMaleWeeklyChamp!.winnerTeam!.players.map(p => ({
      ...p,
      division: 'male',
    })),
  } : undefined;
  const femaleTeamData: TarkamWeeklyTeam | undefined = hasFemaleWeeklyTeam ? {
    teamName: latestFemaleWeeklyChamp!.winnerTeam!.name,
    weekNumber: latestFemaleWeeklyChamp!.weekNumber,
    players: latestFemaleWeeklyChamp!.winnerTeam!.players.map(p => ({
      ...p,
      division: 'female',
    })),
  } : undefined;

  const tarkamWeeklyWeek = Math.max(
    maleTeamData?.weekNumber || 0,
    femaleTeamData?.weekNumber || 0,
  );

  items.push({
    id: 'tarkam-weekly',
    type: 'tarkam-weekly',
    title: hasMaleWeeklyTeam && hasFemaleWeeklyTeam
      ? `${maleTeamData!.teamName} & ${femaleTeamData!.teamName}`
      : hasMaleWeeklyTeam ? maleTeamData!.teamName
      : hasFemaleWeeklyTeam ? femaleTeamData!.teamName
      : 'Belum Ada Juara Weekly',
    subtitle: 'Juara Tarkam Weekly',
    description: hasMaleWeeklyTeam && hasFemaleWeeklyTeam
      ? `Tim juara Tarkam Weekly ${tarkamWeeklyWeek}! ♂ ${maleTeamData!.teamName} dan ♀ ${femaleTeamData!.teamName}.`
      : hasMaleWeeklyTeam
        ? `Tim juara Tarkam Weekly ♂ minggu ${maleTeamData!.weekNumber}: ${maleTeamData!.teamName}.`
        : hasFemaleWeeklyTeam
          ? `Tim juara Tarkam Weekly ♀ minggu ${femaleTeamData!.weekNumber}: ${femaleTeamData!.teamName}.`
          : 'Tim juara Tarkam Weekly akan muncul di sini setelah turnamen mingguan selesai.',
    badge: 'TARKAM WEEKLY',
    thumbLabel: 'Juara Weekly',
    accentColor: '#d4a853',
    accentLight: '#d4a853',
    isDuo: true,
    male: hasMaleWeeklyTeam ? {
      gamertag: maleTeamData!.teamName,
      imageUrl: maleTeamData!.players[0] ? getAvatarUrl(maleTeamData!.players[0].gamertag, 'male', maleTeamData!.players[0].avatar) : undefined,
      tier: maleTeamData!.players[0]?.tier || 'B',
      points: maleTeamData!.players.reduce((s, p) => s + p.points, 0),
      totalWins: maleTeamData!.players.reduce((s, p) => s + p.totalWins, 0),
      streak: 0,
      player: {} as any,
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    female: hasFemaleWeeklyTeam ? {
      gamertag: femaleTeamData!.teamName,
      imageUrl: femaleTeamData!.players[0] ? getAvatarUrl(femaleTeamData!.players[0].gamertag, 'female', femaleTeamData!.players[0].avatar) : undefined,
      tier: femaleTeamData!.players[0]?.tier || 'B',
      points: femaleTeamData!.players.reduce((s, p) => s + p.points, 0),
      totalWins: femaleTeamData!.players.reduce((s, p) => s + p.totalWins, 0),
      streak: 0,
      player: {} as any,
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    maleAccent: '#2E9FFF',
    femaleAccent: '#FF2D78',
    maleAccentLight: '#57B5FF',
    femaleAccentLight: '#FF5C9A',
    isEmpty: tarkamWeeklyIsEmpty,
    weekNumber: tarkamWeeklyWeek,
    tarkamWeeklyTeams: {
      male: maleTeamData,
      female: femaleTeamData,
    },
    metadata: [
      ...(hasMaleWeeklyTeam ? [{ icon: Swords, label: 'Tim ♂', value: maleTeamData!.teamName }] : []),
      ...(hasMaleWeeklyTeam ? [{ icon: Users, label: 'Anggota ♂', value: `${maleTeamData!.players.length} pemain` }] : []),
      ...(hasFemaleWeeklyTeam ? [{ icon: Swords, label: 'Tim ♀', value: femaleTeamData!.teamName }] : []),
      ...(hasFemaleWeeklyTeam ? [{ icon: Users, label: 'Anggota ♀', value: `${femaleTeamData!.players.length} pemain` }] : []),
    ],
  });

  // ─── 2. MVP Terbaru — Male + Female ───
  const maleMvpList = maleData?.mvpHallOfFame || [];
  const latestMaleMvp = maleMvpList.length > 0 ? maleMvpList[maleMvpList.length - 1] : null;
  const maleMvpFallback = !latestMaleMvp
    ? [...(maleData?.topPlayers || [])].filter(p => p.totalMvp > 0).sort((a, b) => b.totalMvp - a.totalMvp || b.points - a.points)[0] || null
    : null;
  const maleMvpSource = latestMaleMvp || maleMvpFallback;

  const femaleMvpList = femaleData?.mvpHallOfFame || [];
  const latestFemaleMvp = femaleMvpList.length > 0 ? femaleMvpList[femaleMvpList.length - 1] : null;
  const femaleMvpFallback = !latestFemaleMvp
    ? [...(femaleData?.topPlayers || [])].filter(p => p.totalMvp > 0).sort((a, b) => b.totalMvp - a.totalMvp || b.points - a.points)[0] || null
    : null;
  const femaleMvpSource = latestFemaleMvp || femaleMvpFallback;

  const isMaleMvpFromHall = !!latestMaleMvp;
  const isFemaleMvpFromHall = !!latestFemaleMvp;
  const maleMvpWeek = isMaleMvpFromHall ? (maleMvpSource as MvpHallOfFameEntry).weekNumber : undefined;
  const femaleMvpWeek = isFemaleMvpFromHall ? (femaleMvpSource as MvpHallOfFameEntry).weekNumber : undefined;
  const mvpIsEmpty = !maleMvpSource && !femaleMvpSource;

  items.push({
    id: 'mvp',
    type: 'mvp',
    title: maleMvpSource && femaleMvpSource ? `${maleMvpSource.gamertag} & ${femaleMvpSource.gamertag}` : maleMvpSource ? maleMvpSource.gamertag : femaleMvpSource ? femaleMvpSource.gamertag : 'Belum Ada MVP',
    subtitle: 'MVP Terbaru',
    description: maleMvpSource && femaleMvpSource
      ? `MVP terbaru kedua divisi! ${maleMvpSource.gamertag} (${maleMvpSource.totalMvp}x MVP) dan ${femaleMvpSource.gamertag} (${femaleMvpSource.totalMvp}x MVP).`
      : maleMvpSource
        ? `MVP terbaru divisi male: ${maleMvpSource.gamertag} dengan ${maleMvpSource.totalMvp}x MVP.`
        : femaleMvpSource
          ? `MVP terbaru divisi female: ${femaleMvpSource.gamertag} dengan ${femaleMvpSource.totalMvp}x MVP.`
          : 'MVP pekan ini akan muncul setelah pertandingan selesai dan pemain terbaik dinobatkan.',
    badge: 'MVP',
    thumbLabel: 'MVP',
    accentColor: '#2E9FFF',
    accentLight: '#57B5FF',
    isDuo: true,
    male: maleMvpSource ? {
      gamertag: maleMvpSource.gamertag,
      imageUrl: getAvatarUrl(maleMvpSource.gamertag, 'male', maleMvpSource.avatar),
      tier: maleMvpSource.tier,
      points: maleMvpSource.points,
      totalWins: maleMvpSource.totalWins,
      streak: maleMvpSource.streak,
      totalMvp: maleMvpSource.totalMvp,
      mvpWeek: maleMvpWeek,
      player: (maleData?.topPlayers?.find(p => p.gamertag === maleMvpSource.gamertag) || maleMvpFallback || maleMvpSource) as TopPlayer & { division?: string },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    female: femaleMvpSource ? {
      gamertag: femaleMvpSource.gamertag,
      imageUrl: getAvatarUrl(femaleMvpSource.gamertag, 'female', femaleMvpSource.avatar),
      tier: femaleMvpSource.tier,
      points: femaleMvpSource.points,
      totalWins: femaleMvpSource.totalWins,
      streak: femaleMvpSource.streak,
      totalMvp: femaleMvpSource.totalMvp,
      mvpWeek: femaleMvpWeek,
      player: (femaleData?.topPlayers?.find(p => p.gamertag === femaleMvpSource.gamertag) || femaleMvpFallback || femaleMvpSource) as TopPlayer & { division?: string },
    } : { gamertag: '—', imageUrl: undefined, tier: '—', points: 0, totalWins: 0, streak: 0, player: {} as any, isEmpty: true },
    maleAccent: '#2E9FFF',
    femaleAccent: '#FF2D78',
    maleAccentLight: '#57B5FF',
    femaleAccentLight: '#FF5C9A',
    isEmpty: mvpIsEmpty,
    mvpWeek: maleMvpWeek || femaleMvpWeek,
    mvpCount: (maleMvpSource?.totalMvp || 0) + (femaleMvpSource?.totalMvp || 0),
    metadata: [
      ...(maleMvpSource ? [{ icon: Award, label: 'MVP ♂', value: `${maleMvpSource.totalMvp}x` }] : []),
      ...(maleMvpSource ? [{ icon: Trophy, label: 'Points ♂', value: `${maleMvpSource.points}` }] : []),
      ...(femaleMvpSource ? [{ icon: Award, label: 'MVP ♀', value: `${femaleMvpSource.totalMvp}x` }] : []),
      ...(femaleMvpSource ? [{ icon: Trophy, label: 'Points ♀', value: `${femaleMvpSource.points}` }] : []),
    ],
  });

  return items;
}


/* ═══════════════════════════════════════════════════════════════
   DIVISION CARD — Male/Female division cards
   Full-body avatars divided equally for 3 participants
   Taller card with immersive avatar display
   ═══════════════════════════════════════════════════════════════ */
function DivisionCard({
  division,
  team,
  setSelectedPlayer,
}: {
  division: 'male' | 'female';
  team?: TarkamWeeklyTeam;
  setSelectedPlayer: (player: any) => void;
}) {
  const isMale = division === 'male';
  const accentColor = isMale ? COLORS.maleAccent : COLORS.femaleAccent;
  const accentLight = isMale ? COLORS.maleAccentLight : COLORS.femaleAccentLight;
  const DivisionIcon = isMale ? Music : Shield;
  const divisionLabel = isMale ? 'MALE DIVISION' : 'FEMALE DIVISION';
  const colorRgb = isMale ? '46,159,255' : '255,45,120';

  return (
    <div
      className="rounded-[20px] overflow-hidden group/div transition-all duration-500"
      style={{
        background: `linear-gradient(165deg, rgba(${colorRgb},0.1) 0%, var(--bg-mid) 30%, rgba(${colorRgb},0.05) 100%)`,
        border: `1px solid rgba(${colorRgb},0.15)`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 8px 32px rgba(${colorRgb},0.06), inset 0 1px 0 rgba(255,255,255,0.03)`,
        willChange: 'transform',
      }}
    >
      {/* Gold luxury top accent bar with glow */}
      <div className="relative h-1.5" style={{ background: 'linear-gradient(90deg, #d4a853, #f5d77a, #d4a853, #f5e6c8, #d4a853)' }}>
        <div className="absolute inset-x-0 -bottom-2 h-4" style={{ background: 'linear-gradient(to bottom, rgba(212,168,83,0.25), transparent)' }} />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Division header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, rgba(${colorRgb},0.15), rgba(${colorRgb},0.05))`, border: `1px solid rgba(${colorRgb},0.2)`, boxShadow: `0 0 12px rgba(${colorRgb},0.1)` }}>
              <DivisionIcon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h4
                className="text-sm font-black uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                {divisionLabel}
              </h4>
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: COLORS.secondaryText }}>
                JUARA TARKAM
              </p>
            </div>
          </div>
          {/* Team name + week badge */}
          {team && team.players.length > 0 && (
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: hexToRgba(accentColor, 0.1),
                  color: accentLight,
                  border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
                }}
              >
                W{team.weekNumber}
              </span>
            </div>
          )}
        </div>

        {team && team.players.length > 0 ? (
          /* ═══ Separated Avatar Cards — 3 individual rounded cards ═══ */
          <div className="relative">
            {/* Team name floating badge at top center — above cards */}
            <div className="flex justify-center mb-3">
              <span
                className="text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap"
                style={{
                  backgroundColor: hexToRgba(accentColor, 0.2),
                  color: accentLight,
                  border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {team.teamName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {team.players.slice(0, 3).map((player, idx) => (
                <div
                  key={`div-player-${player.id}-${idx}`}
                  className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:z-10 group/player"
                  style={{
                    minHeight: '360px',
                    border: `1px solid rgba(${colorRgb},0.2)`,
                    boxShadow: `0 4px 16px rgba(${colorRgb},0.1), inset 0 1px 0 rgba(255,255,255,0.03)`,
                    background: `linear-gradient(165deg, rgba(${colorRgb},0.08) 0%, var(--bg-mid) 40%, rgba(${colorRgb},0.03) 100%)`,
                  }}
                  onClick={() => {
                    setSelectedPlayer({ ...player, division });
                  }}
                >
                  {/* Full-body avatar */}
                  <div className="relative w-full h-full" style={{ minHeight: '360px' }}>
                    <Image
                      src={getAvatarUrl(player.gamertag, division, player.avatar)}
                      alt={player.gamertag}
                      fill
                      sizes="33vw"
                      className="object-cover object-top transition-transform duration-500 group-hover/player:scale-105"
                      loading="lazy"
                    />
                    {/* Bottom gradient overlay for name readability */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-mid) 0%, color-mix(in srgb, var(--bg-mid) 60%, transparent) 30%, transparent 60%)' }} />
                    {/* Subtle side glow */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 80%, rgba(${colorRgb},0.12), transparent 60%)` }} />
                  </div>

                  {/* Player info at bottom */}
                  <div className="absolute bottom-0 inset-x-0 px-2 pb-3 pt-8 z-10">
                    {/* Rank badge for first player */}
                    {idx === 0 && (
                      <div className="absolute top-0 right-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: COLORS.gold, boxShadow: `0 2px 8px ${hexToRgba(COLORS.gold, 0.4)}` }}
                        >
                          <Crown className="w-3 h-3" style={{ color: 'rgb(28,28,30)' }} />
                        </div>
                      </div>
                    )}
                    {/* Gamertag */}
                    <p
                      className="text-xs sm:text-sm font-black truncate text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                      style={{ color: COLORS.primaryText }}
                    >
                      {player.gamertag}
                    </p>
                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-[8px] font-bold text-idm-gold-warm">
                        {player.points}pts
                      </span>
                      <span className="text-[8px] font-bold text-green-400">
                        {player.totalWins}W
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ minHeight: '380px' }}>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: hexToRgba(accentColor, 0.08), border: `2px dashed ${hexToRgba(accentColor, 0.2)}` }}
            >
              <Crown className="w-10 h-10" style={{ color: hexToRgba(accentColor, 0.25) }} />
            </div>
            <p className="text-sm font-bold text-center" style={{ color: COLORS.primaryText }}>
              Musim Baru Dimulai
            </p>
            <p className="text-[10px] text-center" style={{ color: COLORS.secondaryText }}>
              Juara divisi {isMale ? 'male' : 'female'} akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MVP CARD — Full avatar card with colored top accent bar
   Compact size, full-body avatar filling the card
   ═══════════════════════════════════════════════════════════════ */
function MvpCard({
  division,
  player,
  setSelectedPlayer,
  setPreferredSkinType,
}: {
  division: 'male' | 'female';
  player?: DuoPlayer;
  setSelectedPlayer: (player: any) => void;
  setPreferredSkinType?: (type: string | null) => void;
}) {
  const isMale = division === 'male';
  const accentColor = isMale ? COLORS.maleAccent : COLORS.femaleAccent;
  const accentLight = isMale ? COLORS.maleAccentLight : COLORS.femaleAccentLight;
  const DivisionIcon = isMale ? Music : Shield;
  const isEmpty = !player || player.isEmpty;
  const divisionLabel = isMale ? 'MALE' : 'FEMALE';
  const colorRgb = isMale ? '46,159,255' : '255,45,120';

  return (
    <div
      className="rounded-[20px] overflow-hidden group/mvp-card transition-all duration-500"
      style={{
        background: isEmpty
          ? `linear-gradient(165deg, rgba(${colorRgb},0.1) 0%, var(--bg-mid) 30%, rgba(${colorRgb},0.05) 100%)`
          : `linear-gradient(165deg, rgba(${PLATINUM.rgb},0.08) 0%, rgba(${colorRgb},0.06) 20%, var(--bg-mid) 50%, rgba(${PLATINUM.rgb},0.03) 100%)`,
        border: isEmpty
          ? `1px solid rgba(${colorRgb},0.15)`
          : `1px solid rgba(${PLATINUM.rgb},0.2)`,
        boxShadow: isEmpty
          ? `0 2px 8px rgba(0,0,0,0.3), 0 8px 32px rgba(${colorRgb},0.06), inset 0 1px 0 rgba(255,255,255,0.03)`
          : `0 2px 8px rgba(0,0,0,0.3), 0 8px 32px rgba(${PLATINUM.rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.03)`,
        willChange: 'transform',
      }}
    >
      {/* Gold luxury top accent bar with glow */}
      <div className="relative h-1.5" style={{ background: isEmpty ? 'linear-gradient(90deg, #d4a853, #f5d77a, #d4a853)' : 'linear-gradient(90deg, #d4a853, #f5d77a, #d4a853, #f5e6c8, #d4a853)' }}>
        <div className="absolute inset-x-0 -bottom-2 h-4" style={{ background: 'linear-gradient(to bottom, rgba(212,168,83,0.25), transparent)' }} />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* MVP header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, rgba(${colorRgb},0.15), rgba(${colorRgb},0.05))`, border: `1px solid rgba(${colorRgb},0.2)`, boxShadow: `0 0 10px rgba(${colorRgb},0.08)` }}
            >
              <DivisionIcon className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <h4
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                {divisionLabel} MVP
              </h4>
              <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: COLORS.secondaryText }}>
                HALL OF FAME
              </p>
            </div>
          </div>
          {player?.mvpWeek && (
            <span
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: hexToRgba(accentColor, 0.1),
                color: accentLight,
                border: `1px solid ${hexToRgba(accentColor, 0.2)}`,
              }}
            >
              W{player.mvpWeek}
            </span>
          )}
        </div>

        {isEmpty ? (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{
              minHeight: '280px',
              backgroundColor: hexToRgba(accentColor, 0.03),
              border: `1px solid ${hexToRgba(accentColor, 0.1)}`,
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ border: `2px dashed ${hexToRgba(accentColor, 0.2)}` }}
            >
              <Crown className="w-8 h-8" style={{ color: hexToRgba(accentColor, 0.25) }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.primaryText }}>
                MVP Belum Dipilih
              </p>
              <p className="text-[9px] mt-1" style={{ color: COLORS.secondaryText }}>
                Pemain terbaik {divisionLabel.toLowerCase()} akan dinobatkan
              </p>
            </div>
          </div>
        ) : (
          /* Full avatar card */
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer group/mvp transition-all duration-300 hover:shadow-lg"
            style={{
              minHeight: '280px',
              border: `1px solid rgba(${PLATINUM.rgb},0.15)`,
              boxShadow: `0 4px 16px rgba(${PLATINUM.rgb},0.08), 0 4px 12px rgba(${colorRgb},0.06), inset 0 1px 0 rgba(255,255,255,0.03)`,
              background: `linear-gradient(165deg, rgba(${PLATINUM.rgb},0.06) 0%, var(--bg-mid) 40%, rgba(${colorRgb},0.02) 100%)`,
            }}
            onClick={() => {
              if (player?.player?.gamertag) {
                setSelectedPlayer({ ...player.player, division });
                setPreferredSkinType?.('mvp');
              }
            }}
          >
            {/* Full-body avatar */}
            <div className="relative w-full" style={{ minHeight: '280px' }}>
              <Image
                src={player.imageUrl || getAvatarUrl(player.gamertag, division)}
                alt={player.gamertag}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-500 group-hover/mvp:scale-105"
                loading="lazy"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-mid) 0%, color-mix(in srgb, var(--bg-mid) 60%, transparent) 25%, transparent 55%)' }} />
              {/* Platinum + division accent glow at bottom */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 90%, rgba(${PLATINUM.rgb},0.08), rgba(${colorRgb},0.08), transparent 60%)` }} />
            </div>

            {/* Platinum MVP badge top-right */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${PLATINUM.nameLight}, ${PLATINUM.nameDark})`,
                  boxShadow: `0 2px 10px ${PLATINUM.glow}, 0 0 20px ${PLATINUM.glow}`,
                }}
              >
                <span className="text-sm" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>⭐</span>
              </div>
            </div>

            {/* Division label badge top-left with Platinum star */}
            <div className="absolute top-2.5 left-2.5 z-20">
              <span
                className="text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                style={{
                  backgroundColor: `rgba(${PLATINUM.rgb},0.15)`,
                  color: PLATINUM.nameLight,
                  border: `1px solid rgba(${PLATINUM.rgb},0.3)`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                ⭐ {divisionLabel} MVP
              </span>
            </div>

            {/* Player info at bottom */}
            <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-10 z-10">
              {/* Gamertag */}
              <p
                className="text-base sm:text-lg font-black truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                style={{
                  color: PLATINUM.nameMid,
                  textShadow: `0 0 6px ${PLATINUM.glow}, 0 0 16px ${PLATINUM.glow}`,
                }}
              >
                {player.gamertag}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `rgba(${PLATINUM.rgb},0.08)`,
                    color: PLATINUM.nameLight,
                    border: `1px solid rgba(${PLATINUM.rgb},0.12)`,
                  }}
                >
                  {player.points}pts
                </span>
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80' }}
                >
                  {player.totalWins}W
                </span>
                {player.totalMvp && player.totalMvp > 0 && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    style={{ backgroundColor: 'rgba(212,168,83,0.12)', color: COLORS.gold }}
                  >
                    {player.totalMvp}x MVP
                  </span>
                )}
                {player.streak >= 2 && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    style={{ backgroundColor: 'rgba(249,115,22,0.12)', color: '#fb923c' }}
                  >
                    <Flame className="w-2.5 h-2.5" />{player.streak}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN HIGHLIGHTS SECTION COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function HighlightsSection({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onVideoPlay,
  setSelectedPlayer,
  setPreferredSkinType,
}: HighlightsSectionProps) {
  // CMS text fields with fallbacks
  const highlightsLabel = cmsSettings?.highlights_label || 'HIGHLIGHTS';
  const highlightsTitle = cmsSettings?.highlights_title || 'Puncak Prestasi';
  const highlightsSubtitle = cmsSettings?.highlights_subtitle || 'Peringkat #1 tarkam, juara weekly, dan MVP terbaru di Tarkam IDM';

  /* ─── Build highlight items from data ─── */
  const highlights = useMemo(
    () => buildHighlights(maleData, femaleData, leagueData),
    [maleData, femaleData, leagueData]
  );

  /* ─── Extract individual items ─── */
  const tarkamItem = highlights.find(h => h.type === 'tarkam-weekly');
  const mvpItem = highlights.find(h => h.type === 'mvp');

  return (
    <section
      id="highlights"
      role="region"
      aria-label="Highlights"
      className="landing-section relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-deep"
    >
      {/* Atmospheric glows — consistent with other sections */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Center gold radial */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.04), transparent 50%)' }} />
        {/* Left cyan atmosphere */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(46,159,255,0.03), transparent 50%)' }} />
        {/* Right purple atmosphere */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,45,120,0.03), transparent 50%)' }} />
      </div>

      {/* Top edge line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.15)] to-transparent" aria-hidden="true" />

      {/* ═══ Content ═══ */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <AnimatedSection>
          <SectionHeader
            icon={Trophy}
            label={highlightsLabel}
            title={highlightsTitle}
            subtitle={highlightsSubtitle}
          />
        </AnimatedSection>

        {/* ═══ Stacked Sections ═══ */}
        <div className="flex flex-col gap-10 sm:gap-14">

          {/* ═══════════════════════════════════════════════════════════
              1. JUARA TARKAM WEEKLY
              Champion Card + Division Cards
              ═══════════════════════════════════════════════════════════ */}
          {tarkamItem && (
            <div className="reveal reveal-fade-up">
              {/* Division Cards — grid 1-col mobile, 2-col desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DivisionCard
                  division="male"
                  team={tarkamItem.tarkamWeeklyTeams?.male}
                  setSelectedPlayer={setSelectedPlayer}
                />
                <DivisionCard
                  division="female"
                  team={tarkamItem.tarkamWeeklyTeams?.female}
                  setSelectedPlayer={setSelectedPlayer}
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              2. MVP TERBARU — MVP Arena
              Grid of 2 MVP cards (Male/Female)
              ═══════════════════════════════════════════════════════════ */}
          {mvpItem && (
            <div className="reveal reveal-fade-up">
              {/* MVP Cards — grid 2-col, compact width */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                <MvpCard
                  division="male"
                  player={mvpItem.male}
                  setSelectedPlayer={setSelectedPlayer}
                  setPreferredSkinType={setPreferredSkinType}
                />
                <MvpCard
                  division="female"
                  player={mvpItem.female}
                  setSelectedPlayer={setSelectedPlayer}
                  setPreferredSkinType={setPreferredSkinType}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simple bottom edge line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.1)] to-transparent" aria-hidden="true" />
    </section>
  );
}
