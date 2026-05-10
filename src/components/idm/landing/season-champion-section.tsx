'use client';

import Image from 'next/image';
import { Crown, Trophy, Flame, Calendar, Music, Shield, Swords, TrendingUp, Users, Medal, Heart, Gem } from 'lucide-react';
import { SectionHeader, AnimatedSection } from './shared';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import { getAvatarUrl, hexToRgba, clubToString } from '@/lib/utils';
import type { StatsData, SeasonChampionPlayer, WeeklyPerformer, PlayerSkinInfo, SultanPlayer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — SEASON CHAMPION SECTION
   Dual-avatar card: Male + Female Champion in ONE card
   - Shows completed season champions side-by-side
   - When no champion: "Bintang Minggu Ini" (fire/orange theme)
   - When champion exists: Gold champion display + mini Bintang
   - Center divider with crown/flame ornament
   - Season progress bar below
   ═══════════════════════════════════════════════════════════════ */

interface SeasonChampionSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
  setSelectedClub?: (club: StatsData['clubs'][0] & { division?: string; members?: any[] } | null) => void;
  leagueData?: {
    hasData: boolean;
    clubs?: any[];
  } | undefined;
  /** Combined skin map from male + female data for champion skin rendering */
  skinMap?: Record<string, PlayerSkinInfo[]>;
  /** True when showing stale data from a previous season during a season switch.
   *  Used to show skeleton instead of old champion data. */
  isSeasonDataPlaceholder?: boolean;
}

/* ─── Season Champion Data ─── */
interface ChampionData {
  seasonNumber: number;
  seasonName: string;
  player: SeasonChampionPlayer;
  division: 'male' | 'female';
  club: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
}

/* ─── Build champion list from completed seasons ─── */
function buildSeasonChampions(
  maleData: StatsData | undefined,
  femaleData: StatsData | undefined
): { male: ChampionData[]; female: ChampionData[]; sultans: { seasonNumber: number; sultan: SultanPlayer }[] } {
  const male: ChampionData[] = [];
  const female: ChampionData[] = [];

  const completedMaleSeasons = maleData?.allSeasons?.filter(s => s.status === 'completed' && s.championPlayer) || [];
  const completedFemaleSeasons = femaleData?.allSeasons?.filter(s => s.status === 'completed' && s.championPlayer) || [];

  for (const season of completedMaleSeasons) {
    if (season.championPlayer) {
      male.push({
        seasonNumber: season.number,
        seasonName: season.name,
        player: season.championPlayer,
        division: 'male',
        club: season.championClub ?? null,
      });
    }
  }

  for (const season of completedFemaleSeasons) {
    if (season.championPlayer) {
      female.push({
        seasonNumber: season.number,
        seasonName: season.name,
        player: season.championPlayer,
        division: 'female',
        club: season.championClub ?? null,
      });
    }
  }

  male.sort((a, b) => b.seasonNumber - a.seasonNumber);
  female.sort((a, b) => b.seasonNumber - a.seasonNumber);

  // Build sultan data from both divisions, deduplicated by season number (pick from male data first)
  const sultans: { seasonNumber: number; sultan: SultanPlayer }[] = [];
  const seenSeasonNumbers = new Set<number>();
  for (const season of [...(maleData?.allSeasons || []), ...(femaleData?.allSeasons || [])]) {
    if (season.sultanPlayer && !seenSeasonNumbers.has(season.number)) {
      seenSeasonNumbers.add(season.number);
      sultans.push({ seasonNumber: season.number, sultan: season.sultanPlayer });
    }
  }
  sultans.sort((a, b) => b.seasonNumber - a.seasonNumber);

  return { male, female, sultans };
}

/* ═══════════════════════════════════════════════════════════════
   SEASON PROGRESS BAR
   Horizontal progress bar with week markers
   ═══════════════════════════════════════════════════════════════ */
function SeasonProgressBar({ seasonProgress }: {
  seasonProgress: StatsData['seasonProgress'] | undefined;
}) {
  if (!seasonProgress) return null;

  const { completedWeeks, totalWeeks, percentage } = seasonProgress;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-[#eab308]" />
          <span className="text-[11px] font-bold text-foreground">
            Week {completedWeeks} / {totalWeeks}
          </span>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground">
          {clampedPercentage}%
        </span>
      </div>

      {/* Progress bar track */}
      <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(234,179,8,0.08)' }}>
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${clampedPercentage}%`,
            background: 'linear-gradient(90deg, #eab308, #f97316)',
            boxShadow: '0 0 12px rgba(234,179,8,0.3), 0 0 4px rgba(249,115,22,0.2)',
          }}
        />
        {/* Shimmer effect on the filled bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          style={{ width: `${clampedPercentage}%` }}
        >
          <div className="absolute inset-0 animate-pulse opacity-30" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear',
          }} />
        </div>
      </div>

      {/* Week markers */}
      <div className="flex justify-between mt-1 px-0.5">
        {Array.from({ length: totalWeeks }, (_, i) => (
          <div
            key={i}
            className="flex flex-col items-center"
            style={{ width: `${100 / totalWeeks}%` }}
          >
            <div
              className="w-0.5 h-1.5 rounded-full"
              style={{
                backgroundColor: i < completedWeeks
                  ? (i < completedWeeks - 1 ? 'rgba(234,179,8,0.4)' : '#eab308')
                  : 'rgba(160,152,128,0.15)',
              }}
            />
            <span
              className="text-[8px] font-bold mt-0.5"
              style={{
                color: i < completedWeeks ? 'rgba(234,179,8,0.6)' : 'rgba(160,152,128,0.25)',
              }}
            >
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BINTANG MINGGU INI — Full Duo Display (No Champion State)
   Male left + Female right with fire/orange accent theme
   ═══════════════════════════════════════════════════════════════ */
function BintangMingguIniDuo({
  malePerformer,
  femalePerformer,
  seasonProgress,
}: {
  malePerformer: WeeklyPerformer | undefined;
  femalePerformer: WeeklyPerformer | undefined;
  seasonProgress: StatsData['seasonProgress'] | undefined;
}) {
  // Fire/orange accent colors
  const maleAccent = '#eab308';   // yellow
  const femaleAccent = '#f97316'; // orange
  const maleAccentLight = '#facc15';
  const femaleAccentLight = '#fb923c';

  const hasMale = !!malePerformer;
  const hasFemale = !!femalePerformer;
  const hasAny = hasMale || hasFemale;

  return (
    <div
      className="champion-card reveal reveal-fade-up rounded-2xl overflow-hidden bg-card border transition-colors duration-500"
      style={{ borderColor: hasAny ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.08)' }}
    >
      {/* ═══ Gold Flame Line — "Bintang" streak signature ═══ */}
      <div className="relative flex items-center justify-center h-6 overflow-hidden" aria-hidden="true">
        {/* Fire gradient line — left */}
        <div className="absolute left-0 right-1/2 top-1/2 -translate-y-px mr-3 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.2), #d4a853, #eab308)' }} />
        {/* Fire gradient line — right */}
        <div className="absolute right-0 left-1/2 top-1/2 -translate-y-px ml-3 h-[2px]" style={{ background: 'linear-gradient(90deg, #f97316, #d4a853, rgba(234,179,8,0.2), transparent)' }} />
        {/* Center flame dot */}
        <div className="relative z-10 shrink-0 w-3 h-3 rounded-full" style={{ background: 'radial-gradient(circle, #f5d77a, #d4a853)', boxShadow: '0 0 10px rgba(212,168,83,0.5), 0 0 4px rgba(234,179,8,0.4)' }} />
        {/* Glow aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-0" style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.12), transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative h-14 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(maleAccent, 0.08)} 0%, transparent 50%, ${hexToRgba(femaleAccent, 0.08)} 100%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(maleAccent, 0.15) }}>
                <Music className="w-3.5 h-3.5" style={{ color: maleAccentLight }} />
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(femaleAccent, 0.15) }}>
                <Shield className="w-3.5 h-3.5" style={{ color: femaleAccentLight }} />
              </div>
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Male & Female</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: maleAccent, backgroundColor: hexToRgba(maleAccent, 0.08), borderColor: hexToRgba(maleAccent, 0.15) }}>
            <Swords className="w-2.5 h-2.5 inline mr-1" />Berlangsung
          </span>
        </div>
      </div>

      {/* Bintang badge */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: hexToRgba(maleAccent, 0.15) }}>
            <Flame className="w-3 h-3" style={{ color: maleAccent }} />
          </div>
          <span className="text-sm sm:text-base font-black uppercase tracking-wide" style={{ color: maleAccentLight }}>
            Bintang Minggu Ini
          </span>
        </div>
      </div>

      {/* Fire divider */}
      <div className="h-px mx-4" style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(maleAccent, 0.25)}, ${hexToRgba(femaleAccent, 0.25)}, transparent)` }} />

      {/* ═══ DUO BINTANG DISPLAY ═══ */}
      <div className="relative flex m-4 rounded-2xl overflow-hidden border" style={{ minHeight: '360px', borderColor: hexToRgba(maleAccent, 0.10) }}>
        {/* BINTANG watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
          <span className="text-xl font-black uppercase tracking-widest select-none" style={{ color: hexToRgba(maleAccent, 0.03), WebkitTextStroke: `1px ${hexToRgba(maleAccent, 0.05)}` }}>BINTANG</span>
        </div>

        {/* Male side */}
        <div className="relative flex-1">
          {hasMale ? (
            <>
              <Image
                src={getAvatarUrl(malePerformer.gamertag, 'male', malePerformer.avatar)}
                alt={malePerformer.gamertag}
                fill
                sizes="50vw"
                className="object-cover object-top"
                style={{ transform: 'scale(1.0) translateX(2%)' }}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/50" />
              {/* Male fire glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 40% 80%, ${hexToRgba(maleAccent, 0.08)}, transparent 50%)` }} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${hexToRgba(maleAccent, 0.1)}, var(--bg-mid))` }}>
              <div className="flex flex-col items-center gap-2 opacity-25">
                <Music className="w-10 h-10" style={{ color: maleAccent }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: maleAccentLight }}>Male</span>
              </div>
            </div>
          )}
          {/* Male info at bottom */}
          {hasMale && (
            <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-8 z-10" style={{ background: 'linear-gradient(to top, var(--bg-mid) 0%, transparent 100%)' }}>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-black" style={{ color: maleAccentLight }}>♂</span>
                <p className="text-sm sm:text-base font-black text-foreground truncate dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {malePerformer.gamertag}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                
                <span className="text-[9px] font-bold text-green-400">+{malePerformer.weeklyPointsGained}pts</span>
                {malePerformer.streak > 0 && (
                  <span className="text-[9px] font-bold flex items-center gap-0.5" style={{ color: maleAccent }}>
                    <Flame className="w-2 h-2" />{malePerformer.streak}
                  </span>
                )}
                <span className="text-[9px] font-bold" style={{ color: maleAccentLight }}>
                  <TrendingUp className="w-2 h-2 inline mr-0.5" />{malePerformer.compositeScore}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Center Divider — Fire line ═══ */}
        <div className="relative flex flex-col items-center justify-center shrink-0 z-10" style={{ width: '3px' }}>
          {/* Full-height fire gradient line */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to bottom, transparent 5%, ${hexToRgba(maleAccent, 0.6)} 20%, ${maleAccent} 50%, ${hexToRgba(femaleAccent, 0.6)} 80%, transparent 95%)`,
            boxShadow: `0 0 12px ${hexToRgba(maleAccent, 0.3)}, 0 0 24px ${hexToRgba(femaleAccent, 0.15)}`,
          }} />
          {/* Flame ornament */}
          <div
            className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center z-10"
            style={{
              backgroundColor: 'var(--bg-mid)',
              border: `2px solid ${maleAccent}`,
              boxShadow: `0 0 16px ${hexToRgba(maleAccent, 0.35)}, inset 0 0 6px ${hexToRgba(maleAccent, 0.1)}`,
            }}
          >
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: maleAccent }} />
          </div>
          {/* Accent color dots */}
          <div className="absolute top-[20%] w-2 h-2 rounded-full z-10" style={{ backgroundColor: maleAccent, boxShadow: `0 0 6px ${hexToRgba(maleAccent, 0.5)}` }} />
          <div className="absolute bottom-[20%] w-2 h-2 rounded-full z-10" style={{ backgroundColor: femaleAccent, boxShadow: `0 0 6px ${hexToRgba(femaleAccent, 0.5)}` }} />
        </div>

        {/* Female side */}
        <div className="relative flex-1">
          {hasFemale ? (
            <>
              <Image
                src={getAvatarUrl(femalePerformer.gamertag, 'female', femalePerformer.avatar)}
                alt={femalePerformer.gamertag}
                fill
                sizes="50vw"
                className="object-cover object-top"
                style={{ transform: 'scale(1.0) translateX(-2%)' }}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/50" />
              {/* Female fire glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 60% 80%, ${hexToRgba(femaleAccent, 0.08)}, transparent 50%)` }} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(225deg, ${hexToRgba(femaleAccent, 0.1)}, var(--bg-mid))` }}>
              <div className="flex flex-col items-center gap-2 opacity-25">
                <Shield className="w-10 h-10" style={{ color: femaleAccent }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: femaleAccentLight }}>Female</span>
              </div>
            </div>
          )}
          {/* Female info at bottom */}
          {hasFemale && (
            <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-8 z-10" style={{ background: 'linear-gradient(to top, var(--bg-mid) 0%, transparent 100%)' }}>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] font-black" style={{ color: femaleAccentLight }}>♀</span>
                <p className="text-sm sm:text-base font-black text-foreground truncate dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {femalePerformer.gamertag}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                
                <span className="text-[9px] font-bold text-green-400">+{femalePerformer.weeklyPointsGained}pts</span>
                {femalePerformer.streak > 0 && (
                  <span className="text-[9px] font-bold flex items-center gap-0.5" style={{ color: femaleAccent }}>
                    <Flame className="w-2 h-2" />{femalePerformer.streak}
                  </span>
                )}
                <span className="text-[9px] font-bold" style={{ color: femaleAccentLight }}>
                  <TrendingUp className="w-2 h-2 inline mr-0.5" />{femalePerformer.compositeScore}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Flame badge floating at top */}
        <div className="champion-crown-float absolute top-2 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: maleAccent, boxShadow: `0 4px 12px ${hexToRgba(maleAccent, 0.4)}` }}>
          <Flame className="w-3 h-3 text-background" />
        </div>
      </div>

      {/* Subtitle */}
      <div className="px-4 pb-3 text-center">
        <p className="text-[10px] text-muted-foreground italic">
          Performa terbaik minggu berjalan — menuju Top Season
        </p>
      </div>

      {/* Season Progress Bar */}
      <SeasonProgressBar seasonProgress={seasonProgress} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SULTAN OF SEASON CARD
   Compact horizontal card for top penyawer (donor) per season
   Emerald theme (#43A047) — distinct from champion gold
   ═══════════════════════════════════════════════════════════════ */
function SultanOfSeasonCard({ sultans, setSelectedPlayer }: {
  sultans: { seasonNumber: number; sultan: SultanPlayer }[];
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
}) {
  const SULTAN_EMERALD = '#43A047';
  const SULTAN_EMERALD_LIGHT = '#66BB6A';
  const SULTAN_EMERALD_DARK = '#2E7D32';

  const latestSultan = sultans[0];
  if (!latestSultan) return null;

  const { sultan, seasonNumber } = latestSultan;

  return (
    <div className="rounded-2xl overflow-hidden border bg-card p-4 sm:p-5"
      style={{ borderColor: hexToRgba(SULTAN_EMERALD, 0.2) }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: hexToRgba(SULTAN_EMERALD, 0.15), border: `1.5px solid ${hexToRgba(SULTAN_EMERALD, 0.3)}` }}>
          <Gem className="w-3 h-3" style={{ color: SULTAN_EMERALD_LIGHT }} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: SULTAN_EMERALD_LIGHT }}>
          Sultan of Season
        </span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border ml-auto"
          style={{ color: SULTAN_EMERALD, backgroundColor: hexToRgba(SULTAN_EMERALD, 0.1), borderColor: hexToRgba(SULTAN_EMERALD, 0.2) }}>
          S{seasonNumber}
        </span>
      </div>

      {/* Card body - horizontal layout */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
        setSelectedPlayer({
          id: sultan.id,
          name: sultan.gamertag,
          gamertag: sultan.gamertag,
          avatar: sultan.avatar,
          tier: sultan.tier,
          points: sultan.points,
          totalWins: 0,
          streak: 0,
          maxStreak: 0,
          totalMvp: 0,
          matches: 0,
          division: (sultan.division === 'female' ? 'female' : 'male') as 'male' | 'female',
          city: sultan.city ?? undefined,
          club: sultan.club?.name ?? undefined,
        });
      }}>
        {/* Avatar */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border-2"
          style={{ borderColor: SULTAN_EMERALD, boxShadow: `0 0 12px ${hexToRgba(SULTAN_EMERALD, 0.3)}` }}>
          <Image
            src={getAvatarUrl(sultan.gamertag, sultan.division === 'female' ? 'female' : 'male', sultan.avatar)}
            alt={sultan.gamertag}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Emerald glow overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 80%, ${hexToRgba(SULTAN_EMERALD, 0.15)}, transparent 60%)` }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black truncate" style={{ color: SULTAN_EMERALD_LIGHT }}>{sultan.gamertag}</h3>
          <p className="text-[9px] text-muted-foreground/70 mt-0.5">Top Penyawer Season {seasonNumber}</p>
          {sultan.club?.name && (
            <p className="text-[8px] text-muted-foreground/50 mt-0.5 truncate">{sultan.club.name}</p>
          )}
        </div>

        {/* Emerald gem icon */}
        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: hexToRgba(SULTAN_EMERALD, 0.1), border: `1px solid ${hexToRgba(SULTAN_EMERALD, 0.2)}` }}>
          <span className="text-base">💵</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Duo Champion Card — Male + Female in one card ─── */
function DuoChampionCard({
  maleChampions,
  femaleChampions,
  maleWeeklyPerformer,
  femaleWeeklyPerformer,
  seasonProgress,
  setSelectedPlayer,
  skinMap,
}: {
  maleChampions: ChampionData[];
  femaleChampions: ChampionData[];
  maleWeeklyPerformer: WeeklyPerformer | undefined;
  femaleWeeklyPerformer: WeeklyPerformer | undefined;
  seasonProgress: StatsData['seasonProgress'] | undefined;
  setSelectedPlayer: (player: StatsData['topPlayers'][0] & { division?: string } | null) => void;
  skinMap?: Record<string, PlayerSkinInfo[]>;
}) {
  const maleAccent = '#2E9FFF';
  const femaleAccent = '#FF2D78';
  const maleAccentLight = '#57B5FF';
  const femaleAccentLight = '#FF5C9A';

  /* Luxury Gold visual — used in this section to differentiate from Male division cyan
     Note: The actual skin system still uses Diamond Blue (#4FC3F7) everywhere else. */
  const CHAMPION_GOLD = '#d4a853';
  const CHAMPION_GOLD_LIGHT = '#e5be4a';
  const CHAMPION_GOLD_BORDER = `1px solid ${CHAMPION_GOLD}`;
  const CHAMPION_GOLD_GLOW = `0 0 16px ${hexToRgba(CHAMPION_GOLD, 0.4)}, 0 0 4px ${hexToRgba(CHAMPION_GOLD, 0.2)}`;

  /** Check if a player has a season_champion skin in the skinMap */
  function hasSeasonChampionSkin(playerId: string): boolean {
    if (!skinMap || !skinMap[playerId]) return false;
    return skinMap[playerId].some(s => s.type === 'season_champion');
  }

  const latestMale = maleChampions[0];
  const latestFemale = femaleChampions[0];
  const hasMale = !!latestMale;
  const hasFemale = !!latestFemale;
  const hasAny = hasMale || hasFemale;

  // Champion skin flags for latest champions — use embedded field from API
  const maleHasSkin = hasMale && (latestMale.player.hasSeasonChampionSkin ?? false);
  const femaleHasSkin = hasFemale && (latestFemale.player.hasSeasonChampionSkin ?? false);

  // Determine the "latest" season number for badge
  const latestSeasonNumber = hasMale && hasFemale
    ? Math.max(latestMale.seasonNumber, latestFemale.seasonNumber)
    : hasMale ? latestMale.seasonNumber : hasFemale ? latestFemale.seasonNumber : 0;

  // Previous champions (from either division)
  const previousMaleChamps = maleChampions.slice(1);
  const previousFemaleChamps = femaleChampions.slice(1);
  const hasPreviousChampions = previousMaleChamps.length > 0 || previousFemaleChamps.length > 0;

  if (!hasAny) {
    // No champion — show Bintang Minggu Ini (full duo display)
    return (
      <BintangMingguIniDuo
        malePerformer={maleWeeklyPerformer}
        femalePerformer={femaleWeeklyPerformer}
        seasonProgress={seasonProgress}
      />
    );
  }

  return (
    <div
      className="champion-card reveal reveal-fade-up group rounded-3xl overflow-hidden bg-card border transition-all duration-500 hover:border-[rgba(212,168,83,0.25)] hover:shadow-[0_0_40px_rgba(212,168,83,0.06)]"
      style={{ borderColor: 'rgba(212,168,83,0.12)' }}
    >
      {/* ═══ Gold Diamond Emblem — Royal seal signature ═══ */}
      <div className="relative flex items-center justify-center h-8 overflow-hidden" aria-hidden="true">
        {/* Left gold line */}
        <div className="absolute left-0 right-1/2 top-1/2 -translate-y-px mr-4 h-[1.5px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.1), rgba(212,168,83,0.6), #d4a853)' }} />
        {/* Right gold line */}
        <div className="absolute right-0 left-1/2 top-1/2 -translate-y-px ml-4 h-[1.5px]" style={{ background: 'linear-gradient(90deg, #d4a853, rgba(212,168,83,0.6), rgba(212,168,83,0.1), transparent)' }} />
        {/* Center diamond emblem */}
        <div className="relative z-10 shrink-0 w-5 h-5 rotate-45 rounded-[3px]" style={{ background: 'linear-gradient(135deg, #d4a853, #f5d77a, #d4a853)', boxShadow: '0 0 12px rgba(212,168,83,0.5), 0 0 4px rgba(245,215,122,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
          {/* Inner diamond */}
          <div className="absolute inset-[3px] rotate-0 rounded-[1px]" style={{ background: 'linear-gradient(135deg, var(--bg-mid), var(--bg-deep))', border: '1px solid rgba(212,168,83,0.3)' }} />
        </div>
        {/* Diamond glow aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-0" style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.15), transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative h-14 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(maleAccent, 0.08)} 0%, transparent 50%, ${hexToRgba(femaleAccent, 0.08)} 100%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212,168,83,0.15)', border: '1.5px solid rgba(212,168,83,0.35)', boxShadow: '0 0 10px rgba(212,168,83,0.2)' }}>
              <Crown className="w-3.5 h-3.5 text-[#d4a853]" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#d4a853]">Top Season</span>
          </div>
          {latestSeasonNumber > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: '#d4a853', backgroundColor: 'rgba(212,168,83,0.12)', borderColor: 'rgba(212,168,83,0.25)' }}>
              <Crown className="w-2.5 h-2.5 inline mr-1" />S{latestSeasonNumber}
            </span>
          )}
        </div>
      </div>

      {/* Title row */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="w-4 h-4 shrink-0 text-[#d4a853]" />
          <span className="text-base sm:text-lg font-black text-foreground truncate">
            {hasMale && hasFemale ? `${latestMale.player.gamertag} & ${latestFemale.player.gamertag}` : hasMale ? latestMale.player.gamertag : latestFemale.player.gamertag}
          </span>
        </div>
      </div>

      {/* Gold divider */}
      <div className="h-px mx-4 bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.20)] to-transparent" />

      {/* ═══ DUO CHAMPION DISPLAY — MVP-style with Crown Divider ═══
          Avatar full left, stats right — decorative crown divider between divisions
      */}
      <div className="flex flex-col lg:flex-row">
        {/* ─── Male Champion Card (MVP style) ─── */}
        <div className="flex-1 p-4 sm:p-5">
          {hasMale ? (
            <div className="flex gap-3 sm:gap-4 items-stretch cursor-pointer group/male" onClick={() => {
              setSelectedPlayer({
                ...latestMale.player,
                division: 'male',
                club: latestMale.club ?? undefined,
                city: latestMale.player.city,
                name: latestMale.player.gamertag,
                gamertag: latestMale.player.gamertag,
                avatar: latestMale.player.avatar,
                tier: latestMale.player.tier,
                points: latestMale.player.points,
                totalWins: latestMale.player.totalWins,
                streak: latestMale.player.streak || 0,
                maxStreak: latestMale.player.maxStreak || 0,
                totalMvp: latestMale.player.totalMvp || 0,
                matches: latestMale.player.matches || 0,
              });
            }}>
              {/* Avatar panel — 3/4 aspect ratio — always male division color ring */}
              <div
                className="relative w-24 sm:w-32 lg:w-36 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-idm-male/25 to-idm-male/5 border-idm-male/30"
                style={{ aspectRatio: '3/4' }}
              >
                <Image
                  src={getAvatarUrl(latestMale.player.gamertag, 'male', latestMale.player.avatar)}
                  alt={latestMale.player.gamertag}
                  width={144}
                  height={192}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/male:scale-105"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                {/* Crown badge — top right */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="w-6 h-6 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-[0_0_12px_rgba(212,168,83,0.4)]">
                    <Crown className="w-3 h-3 text-[#0c0a06]" />
                  </div>
                </div>
                {/* Champion badge — bottom */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-idm-gold-warm to-amber-500 text-black text-[7px] font-black px-2 py-0.5 rounded shadow-[0_0_8px_rgba(229,190,74,0.3)] whitespace-nowrap flex items-center gap-0.5">
                    <Trophy className="w-2 h-2" />S{latestSeasonNumber}
                  </span>
                </div>
              </div>

              {/* Stats panel */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                {/* Player name + badges */}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[10px] font-black" style={{ color: maleAccentLight }}>♂</span>
                    <h3 className="text-sm lg:text-base font-black truncate" style={{ color: maleAccentLight }}>{latestMale.player.gamertag}</h3>
                    
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    {clubToString(latestMale.player.club) && (
                      <span className="text-[9px] lg:text-[10px] text-muted-foreground/70 truncate">{clubToString(latestMale.player.club)}</span>
                    )}
                    <span className="bg-idm-male/15 text-idm-male-light text-[7px] lg:text-[8px] border border-idm-male/20 px-1.5 py-0.5 rounded font-bold">
                      🕺 Male
                    </span>
                  </div>
                </div>

                {/* Stats grid — 2x2 */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10">
                    <Trophy className="w-3 h-3 shrink-0 text-idm-gold-warm" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-idm-gold-warm leading-tight">{latestMale.player.points}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">Points</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10">
                    <Crown className="w-3 h-3 shrink-0 text-green-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-green-400 leading-tight">{latestMale.player.totalWins}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">Wins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <Medal className="w-3 h-3 shrink-0 text-yellow-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-yellow-400 leading-tight">{latestMale.player.totalMvp ?? 0}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">MVP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <Flame className="w-3 h-3 shrink-0 text-orange-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-orange-400 leading-tight">{latestMale.player.streak ?? 0}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">Streak</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Male empty state */
            <div className="flex gap-3 sm:gap-4 items-stretch opacity-40">
              <div className="relative w-24 sm:w-32 lg:w-36 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-idm-male/10 to-idm-male/5 border border-idm-male/10 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                <Music className="w-8 h-8 text-idm-male/30" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                <p className="text-sm font-bold text-muted-foreground">Male Champion</p>
                <p className="text-[10px] text-muted-foreground/60">Belum ada juara</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Center Divider — Colored line + accent dots ═══ */}
        {hasMale && hasFemale && (
          <>
            {/* Mobile: horizontal divider */}
            <div className="flex lg:hidden items-center py-1 px-4">
              <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(maleAccent, 0.5)}, ${hexToRgba('#d4a853', 0.8)})` }} />
              <div className="w-1.5 h-1.5 rounded-full mx-2 shrink-0" style={{ backgroundColor: '#d4a853', boxShadow: '0 0 6px rgba(212,168,83,0.4)' }} />
              <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${hexToRgba(femaleAccent, 0.5)}, ${hexToRgba('#d4a853', 0.8)})` }} />
            </div>

            {/* Desktop: vertical divider with accent dots */}
            <div className="hidden lg:flex relative flex-col items-center justify-center shrink-0" style={{ width: '3px' }}>
              {/* Full-height gradient line */}
              <div className="absolute inset-0" style={{
                background: `linear-gradient(to bottom, transparent 5%, ${hexToRgba(maleAccent, 0.6)} 20%, #d4a853 50%, ${hexToRgba(femaleAccent, 0.6)} 80%, transparent 95%)`,
                boxShadow: `0 0 12px ${hexToRgba(maleAccent, 0.3)}, 0 0 8px rgba(212,168,83,0.15)`,
              }} />
              {/* Accent color dots */}
              <div className="absolute top-[20%] w-2 h-2 rounded-full z-10" style={{ backgroundColor: maleAccent, boxShadow: `0 0 6px ${hexToRgba(maleAccent, 0.5)}` }} />
              <div className="absolute bottom-[20%] w-2 h-2 rounded-full z-10" style={{ backgroundColor: femaleAccent, boxShadow: `0 0 6px ${hexToRgba(femaleAccent, 0.5)}` }} />
            </div>
          </>
        )}

        {/* ─── Female Champion Card (MVP style) ─── */}
        <div className="flex-1 p-4 sm:p-5">
          {hasFemale ? (
            <div className="flex gap-3 sm:gap-4 items-stretch cursor-pointer group/female" onClick={() => {
              setSelectedPlayer({
                ...latestFemale.player,
                division: 'female',
                club: latestFemale.club ?? undefined,
                city: latestFemale.player.city,
                name: latestFemale.player.gamertag,
                gamertag: latestFemale.player.gamertag,
                avatar: latestFemale.player.avatar,
                tier: latestFemale.player.tier,
                points: latestFemale.player.points,
                totalWins: latestFemale.player.totalWins,
                streak: latestFemale.player.streak || 0,
                maxStreak: latestFemale.player.maxStreak || 0,
                totalMvp: latestFemale.player.totalMvp || 0,
                matches: latestFemale.player.matches || 0,
              });
            }}>
              {/* Avatar panel — 3/4 aspect ratio — always female division color ring */}
              <div
                className="relative w-24 sm:w-32 lg:w-36 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-idm-female/25 to-idm-female/5 border-idm-female/30"
                style={{ aspectRatio: '3/4' }}
              >
                <Image
                  src={getAvatarUrl(latestFemale.player.gamertag, 'female', latestFemale.player.avatar)}
                  alt={latestFemale.player.gamertag}
                  width={144}
                  height={192}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/female:scale-105"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                {/* Crown badge — top right */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="w-6 h-6 rounded-full bg-idm-gold-warm flex items-center justify-center shadow-[0_0_12px_rgba(212,168,83,0.4)]">
                    <Crown className="w-3 h-3 text-[#0c0a06]" />
                  </div>
                </div>
                {/* Champion badge — bottom */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-idm-gold-warm to-amber-500 text-black text-[7px] font-black px-2 py-0.5 rounded shadow-[0_0_8px_rgba(229,190,74,0.3)] whitespace-nowrap flex items-center gap-0.5">
                    <Trophy className="w-2 h-2" />S{latestSeasonNumber}
                  </span>
                </div>
              </div>

              {/* Stats panel */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                {/* Player name + badges */}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[10px] font-black" style={{ color: femaleAccentLight }}>♀</span>
                    <h3 className="text-sm lg:text-base font-black truncate" style={{ color: femaleAccentLight }}>{latestFemale.player.gamertag}</h3>
                    
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    {clubToString(latestFemale.player.club) && (
                      <span className="text-[9px] lg:text-[10px] text-muted-foreground/70 truncate">{clubToString(latestFemale.player.club)}</span>
                    )}
                    <span className="bg-idm-female/15 text-idm-female-light text-[7px] lg:text-[8px] border border-idm-female/20 px-1.5 py-0.5 rounded font-bold">
                      💃 Female
                    </span>
                  </div>
                </div>

                {/* Stats grid — 2x2 */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10">
                    <Trophy className="w-3 h-3 shrink-0 text-idm-gold-warm" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-idm-gold-warm leading-tight">{latestFemale.player.points}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">Points</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10">
                    <Crown className="w-3 h-3 shrink-0 text-green-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-green-400 leading-tight">{latestFemale.player.totalWins}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">Wins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <Medal className="w-3 h-3 shrink-0 text-yellow-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-yellow-400 leading-tight">{latestFemale.player.totalMvp ?? 0}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">MVP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <Flame className="w-3 h-3 shrink-0 text-orange-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-black tabular-nums text-orange-400 leading-tight">{latestFemale.player.streak ?? 0}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider font-semibold leading-tight">Streak</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Female empty state */
            <div className="flex gap-3 sm:gap-4 items-stretch opacity-40">
              <div className="relative w-24 sm:w-32 lg:w-36 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-idm-female/10 to-idm-female/5 border border-idm-female/10 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                <Shield className="w-8 h-8 text-idm-female/30" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                <p className="text-sm font-bold text-muted-foreground">Female Champion</p>
                <p className="text-[10px] text-muted-foreground/60">Belum ada juara</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Season Progress Bar */}
      <SeasonProgressBar seasonProgress={seasonProgress} />

      {/* Previous season champions — mini avatar cards per season (max 5) */}
      {hasPreviousChampions ? (() => {
        // Group by season number
        const seasonMap = new Map<number, { male?: ChampionData; female?: ChampionData }>();
        for (const champ of previousMaleChamps) {
          const entry = seasonMap.get(champ.seasonNumber) ?? {};
          entry.male = champ;
          seasonMap.set(champ.seasonNumber, entry);
        }
        for (const champ of previousFemaleChamps) {
          const entry = seasonMap.get(champ.seasonNumber) ?? {};
          entry.female = champ;
          seasonMap.set(champ.seasonNumber, entry);
        }
        // Sort descending, limit to 5 seasons max
        const sortedSeasons = [...seasonMap.entries()].sort((a, b) => b[0] - a[0]).slice(0, 5);

        return (
          <div className="px-4 pb-4 pt-3">
            {/* Divider */}
            <div className="h-px mb-3" style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(maleAccent, 0.15)}, ${hexToRgba('#d4a853', 0.2)}, ${hexToRgba(femaleAccent, 0.15)}, transparent)` }} />

            {/* Header */}
            <div className="flex items-center gap-1.5 mb-2">
              <Crown className="w-3 h-3 text-[#d4a853]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#d4a853]">
                Juara Sebelumnya
              </span>
            </div>

            {/* Season rows */}
            <div className="space-y-2">
              {sortedSeasons.map(([seasonNum, { male, female }]) => (
                <div key={seasonNum}>
                  {/* Season label */}
                  <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1 block">Season {seasonNum}</span>
                  <div className="flex gap-2">
                    {/* Male champion mini card */}
                    {male ? (
                      <button
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border hover:border-idm-gold-warm/20 transition-colors cursor-pointer text-left"
                        style={{ borderColor: hexToRgba(maleAccent, 0.1), backgroundColor: hexToRgba(maleAccent, 0.03) }}
                        onClick={() => {
                          setSelectedPlayer({
                            ...male.player,
                            division: 'male',
                            club: male.club ?? undefined,
                            city: male.player.city,
                            name: male.player.gamertag,
                            gamertag: male.player.gamertag,
                            avatar: male.player.avatar,
                            tier: male.player.tier,
                            points: male.player.points,
                            totalWins: male.player.totalWins,
                            streak: male.player.streak || 0,
                            maxStreak: male.player.maxStreak || 0,
                            totalMvp: male.player.totalMvp || 0,
                            matches: male.player.matches || 0,
                          });
                        }}
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ border: `1.5px solid ${hexToRgba(maleAccent, 0.3)}` }}>
                          <Image
                            src={getAvatarUrl(male.player.gamertag, 'male', male.player.avatar)}
                            alt={male.player.gamertag}
                            fill
                            sizes="32px"
                            className="object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black" style={{ color: maleAccentLight }}>♂</span>
                            <p className="text-xs font-bold text-foreground truncate">{male.player.gamertag}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[8px] font-bold" style={{ color: maleAccentLight }}>{male.player.points}pts</span>
                            
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="flex-1 h-12 rounded-lg border border-dashed opacity-20" style={{ borderColor: hexToRgba(maleAccent, 0.15) }} />
                    )}

                    {/* Female champion mini card */}
                    {female ? (
                      <button
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border hover:border-idm-gold-warm/20 transition-colors cursor-pointer text-left"
                        style={{ borderColor: hexToRgba(femaleAccent, 0.1), backgroundColor: hexToRgba(femaleAccent, 0.03) }}
                        onClick={() => {
                          setSelectedPlayer({
                            ...female.player,
                            division: 'female',
                            club: female.club ?? undefined,
                            city: female.player.city,
                            name: female.player.gamertag,
                            gamertag: female.player.gamertag,
                            avatar: female.player.avatar,
                            tier: female.player.tier,
                            points: female.player.points,
                            totalWins: female.player.totalWins,
                            streak: female.player.streak || 0,
                            maxStreak: female.player.maxStreak || 0,
                            totalMvp: female.player.totalMvp || 0,
                            matches: female.player.matches || 0,
                          });
                        }}
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ border: `1.5px solid ${hexToRgba(femaleAccent, 0.3)}` }}>
                          <Image
                            src={getAvatarUrl(female.player.gamertag, 'female', female.player.avatar)}
                            alt={female.player.gamertag}
                            fill
                            sizes="32px"
                            className="object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black" style={{ color: femaleAccentLight }}>♀</span>
                            <p className="text-xs font-bold text-foreground truncate">{female.player.gamertag}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[8px] font-bold" style={{ color: femaleAccentLight }}>{female.player.points}pts</span>
                            
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="flex-1 h-12 rounded-lg border border-dashed opacity-20" style={{ borderColor: hexToRgba(femaleAccent, 0.15) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}

/* ─── Club Champion Data ─── */
interface ClubChampionMember {
  id: string;
  gamertag: string;
  avatar?: string | null;
  tier: string;
  points: number;
  division: 'male' | 'female';
}

interface ClubChampionEntry {
  seasonNumber: number;
  club: {
    id: string;
    name: string;
    logo: string | null;
    members?: ClubChampionMember[];
    totalPoints?: number;
    maleScore?: number;
    femaleScore?: number;
  };
  division: 'male' | 'female';
}

/* ═══════════════════════════════════════════════════════════════
   CLUB CHAMPION CARD — TARKAM (MAXIMOUS Style)
   Premium Showcase inspired by MAXIMOUS champion banner:
   - Rich gold gradient background with shimmer overlay
   - Club logo with gold frame + floating crown badge
   - Big prominent club name (MAXIMOUS focal point)
   - Squad preview — horizontal member avatars
   - Member count badges by division
   ═══════════════════════════════════════════════════════════════ */
function ClubChampionCard({
  clubChampions,
  setSelectedClub,
}: {
  clubChampions: ClubChampionEntry[];
  setSelectedClub?: (club: StatsData['clubs'][0] & { division?: string; members?: any[] } | null) => void;
}) {
  // Merge members from all entries (same club may appear in male & female divisions)
  const latestSeasonNumber = Math.max(...clubChampions.map(c => c.seasonNumber));
  const clubData = clubChampions[0]?.club;
  if (!clubData) return null;

  // Merge & deduplicate members (by id, sum points across divisions)
  const memberMap = new Map<string, ClubChampionMember>();
  for (const ch of clubChampions) {
    if (ch.club.members) {
      for (const m of ch.club.members) {
        const existing = memberMap.get(m.id);
        if (existing) {
          existing.points += m.points;
        } else {
          memberMap.set(m.id, { ...m });
        }
      }
    }
  }
  const allMembers = Array.from(memberMap.values()).sort((a, b) => b.points - a.points);
  const totalPoints = clubData.totalPoints || allMembers.reduce((s, m) => s + m.points, 0);
  const memberCount = allMembers.length;
  const maleMembers = allMembers.filter(m => m.division === 'male');
  const femaleMembers = allMembers.filter(m => m.division === 'female');

  // Find captain (top by points)
  const captainMember = allMembers[0];

  return (
    <div
      className="champion-card reveal reveal-fade-up group relative rounded-3xl overflow-hidden border transition-all duration-500 hover:border-[rgba(212,168,83,0.25)] hover:shadow-[0_0_40px_rgba(212,168,83,0.06)]"
      style={{
        borderColor: 'rgba(212,168,83,0.12)',
        background: 'linear-gradient(135deg, #080a14 0%, #0a0c18 25%, #080a14 50%, #0a0c18 75%, #080a14 100%)',
      }}
    >
      {/* ═══ Background layers — Dark coal navy canvas ═══ */}
      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      {/* Subtle center glow — very restrained */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.04) 0%, transparent 50%)' }} />

      {/* Top gold accent line — thin refined */}
      <div className="h-px bg-gradient-to-r from-transparent via-idm-gold-warm/40 to-transparent" />

      <div className="relative z-10 p-6 sm:p-8">
        {/* ═══ Header Row — Trophy + Badges + Crown ═══ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-idm-gold-warm/10 border border-idm-gold-warm/15 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(212,168,83,0.06)' }}>
              <Trophy className="w-5 h-5 text-idm-gold-warm/70" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-idm-gold-warm/8 text-idm-gold-warm/70 text-[9px] border border-idm-gold-warm/15 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Tarkam IDM</span>
                <span className="bg-muted/5 text-muted-foreground text-[9px] border border-border/20 font-bold px-2 py-0.5 rounded-md">SEASON {latestSeasonNumber} CHAMPION</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mt-1 text-foreground/90">
                Tarkam IDM Season {latestSeasonNumber}
              </h3>
            </div>
          </div>
          {/* Crown — luxury gold illuminated */}
          <div
            className="champion-crown-float hidden sm:block"
            style={{ filter: 'drop-shadow(0 0 16px rgba(212,168,83,0.5)) drop-shadow(0 0 40px rgba(212,168,83,0.2))' }}
          >
            <Crown className="w-8 h-8" style={{ color: '#d4a853', filter: 'brightness(1.3)' }} />
          </div>
        </div>

        {/* ═══ Champion Club Display — Logo + Name + Info ═══ */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Club Logo with subtle frame + floating crown */}
          <div className="flex flex-col items-center text-center sm:text-left sm:flex-row gap-4 flex-1">
            <div className="relative">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border border-idm-gold-warm/15 bg-white/[0.02] cursor-pointer group/club"
                style={{ boxShadow: '0 0 30px rgba(212,168,83,0.08)' }}
                role="button"
                tabIndex={0}
                aria-label={`View club: ${clubData.name}`}
                onClick={() => {
                  if (setSelectedClub) {
                    setSelectedClub({
                      id: clubData.id,
                      name: clubData.name,
                      logo: clubData.logo,
                      wins: 0,
                      losses: 0,
                      points: totalPoints,
                      gameDiff: 0,
                      _count: { members: memberCount },
                    });
                  }
                }}
              >
                <ClubLogoImage clubName={clubData.name} dbLogo={clubData.logo} alt={clubData.name} width={112} height={112} className="w-full h-full object-cover transition-transform duration-500 group-hover/club:scale-110" />
              </div>
              {/* Champion badge overlay — floating crown */}
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-idm-gold-warm/80 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(212,168,83,0.3)' }}>
                <Crown className="w-3.5 h-3.5 text-[#080a14]" />
              </div>
            </div>

            {/* Club Name — Dark canvas with gold accent */}
            <div>
              <h4
                className="text-2xl sm:text-3xl font-black uppercase tracking-wide cursor-pointer hover:opacity-90 transition-opacity text-foreground"
                style={{
                  textShadow: '0 0 30px rgba(212,168,83,0.08)',
                }}
                onClick={() => {
                  if (setSelectedClub) {
                    setSelectedClub({
                      id: clubData.id,
                      name: clubData.name,
                      logo: clubData.logo,
                      wins: 0,
                      losses: 0,
                      points: totalPoints,
                      gameDiff: 0,
                      _count: { members: memberCount },
                    });
                  }
                }}
              >
                {clubData.name}
              </h4>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                Tarkam IDM Season {latestSeasonNumber} Champion
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Club terbaik di Tarkam IDM Season {latestSeasonNumber}
              </p>
              {/* Member count by division */}
              <div className="flex items-center gap-3 mt-3">
                {maleMembers.length > 0 && (
                  <span className="bg-idm-male/8 text-idm-male/70 text-[10px] border border-idm-male/12 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" />{maleMembers.length} Male
                  </span>
                )}
                {femaleMembers.length > 0 && (
                  <span className="bg-idm-female/8 text-idm-female/70 text-[10px] border border-idm-female/12 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                    <Users className="w-3 h-3" />{femaleMembers.length} Female
                  </span>
                )}
                <span className="bg-muted/5 text-muted-foreground text-[10px] border border-border/15 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                  <Users className="w-3 h-3" />{memberCount} Total
                </span>
              </div>
            </div>
          </div>

          {/* ═══ Top Performers — Top 5 by points + "+X more" ═══ */}
          {allMembers.length > 0 && (
            <div className="flex-1 w-full sm:w-auto">
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-3 text-center sm:text-left">Top Performers</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {allMembers.slice(0, 5).map((member, i) => (
                  <div key={`squad-${member.id}`} className="group/member relative flex flex-col items-center">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border transition-all duration-200 hover:scale-110 cursor-default ${
                        member.division === 'male'
                          ? 'border-idm-male/15 hover:border-idm-male/30'
                          : 'border-idm-female/15 hover:border-idm-female/30'
                      } ${captainMember?.id === member.id ? 'ring-1 ring-idm-gold-warm/30 border-idm-gold-warm/20' : ''}`}
                    >
                      <Image
                        src={getAvatarUrl(member.gamertag, member.division, member.avatar)}
                        alt={member.gamertag}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Captain badge */}
                      {captainMember?.id === member.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-idm-gold-warm/70 flex items-center justify-center z-10">
                          <Crown className="w-2.5 h-2.5 text-[#080a14]" />
                        </div>
                      )}
                    </div>
                    {/* Gamertag + points below avatar */}
                    <p className="text-[9px] font-bold mt-1 truncate max-w-[64px] text-center text-foreground/70">{member.gamertag}</p>
                    <p className="text-[8px] font-black tabular-nums" style={{ color: member.division === 'male' ? 'rgba(87,181,255,0.7)' : 'rgba(255,92,154,0.7)' }}>{member.points}pts</p>
                  </div>
                ))}
                {allMembers.length > 5 && (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center border border-dashed border-border/30 bg-muted/5">
                      <span className="text-xs font-black text-muted-foreground/50">+{allMembers.length - 5}</span>
                      <span className="text-[7px] font-bold text-muted-foreground/30 uppercase">more</span>
                    </div>
                    <p className="text-[9px] font-bold mt-1 text-muted-foreground/50">lainnya</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Bottom decorative line ═══ */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-border/20 to-transparent" />
          <div className="flex items-center gap-1.5 text-muted-foreground/30">
            <Trophy className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Tarkam IDM Champion</span>
            <Trophy className="w-3 h-3" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-white/8 to-transparent" />
        </div>


      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SEASON CHAMPION SECTION COMPONENT
   Single card with Male + Female champion side-by-side
   Dynamic subtitle based on champion state
   ═══════════════════════════════════════════════════════════════ */
export function SeasonChampionSection({
  maleData,
  femaleData,
  isDataLoading,
  setSelectedPlayer,
  setSelectedClub,
  leagueData,
  skinMap,
  isSeasonDataPlaceholder = false,
}: SeasonChampionSectionProps) {
  const { male: maleChampions, female: femaleChampions, sultans } = buildSeasonChampions(maleData, femaleData);

  // ── Build club champion data from completed seasons ──
  // Group by club-season so ALL entries (male+female) are passed to ClubChampionCard
  // This ensures member merging works correctly across both divisions
  const clubChampionEntries: { seasonNumber: number; club: { id: string; name: string; logo: string | null; members?: ClubChampionMember[]; totalPoints?: number; maleScore?: number; femaleScore?: number }; division: 'male' | 'female' }[] = [];
  const completedSeasons = [
    ...(maleData?.allSeasons || []),
    ...(femaleData?.allSeasons || []),
  ].filter(s => s.status === 'completed' && s.championClub);
  for (const season of completedSeasons) {
    if (season.championClub) {
      clubChampionEntries.push({
        seasonNumber: season.number,
        club: season.championClub,
        division: season.name.toLowerCase().includes('female') ? 'female' as const : 'male' as const,
      });
    }
  }
  // Group entries by "clubId-seasonNumber" — keep ALL male+female entries for merging
  const clubChampionGroups = new Map<string, ClubChampionEntry[]>();
  for (const entry of clubChampionEntries) {
    const key = `${entry.club.id}-${entry.seasonNumber}`;
    if (!clubChampionGroups.has(key)) clubChampionGroups.set(key, []);
    clubChampionGroups.get(key)!.push(entry);
  }
  const hasClubChampion = clubChampionGroups.size > 0;

  // Determine if champion exists
  const hasChampion = maleChampions.length > 0 || femaleChampions.length > 0;

  // Get weekly top performers (first entry = top performer for each division)
  const maleWeeklyPerformer = maleData?.weeklyTopPerformers?.[0];
  const femaleWeeklyPerformer = femaleData?.weeklyTopPerformers?.[0];

  // Season progress
  const seasonProgress = maleData?.seasonProgress;

  // Dynamic subtitle
  const subtitle = hasChampion
    ? 'Juara season Tarkam IDM — pemain peringkat #1 saat season ditutup'
    : 'Belum ada juara musim ini — Bintang Minggu Ini: performa terbaik minggu berjalan';

  return (
    <section id="season-champion" role="region" aria-label="Top Season" className="landing-section relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-deep">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(46,159,255,0.06) 0%, transparent 45%), radial-gradient(ellipse at 70% 20%, rgba(255,45,120,0.06) 0%, transparent 45%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header — dynamic subtitle */}
        <AnimatedSection>
          <SectionHeader
            icon={hasChampion ? Crown : Flame}
            label={hasChampion ? 'TOP SEASON' : 'BINTANG MINGGU INI'}
            title={hasChampion ? 'Top Season' : 'Bintang Minggu Ini'}
            subtitle={subtitle}
          />
        </AnimatedSection>

        {/* Player Champion Card */}
        <div className="mt-10 sm:mt-14">
          {(isDataLoading || isSeasonDataPlaceholder) ? (
            <div className="rounded-2xl bg-card border border-idm-gold-warm/10 h-80 animate-pulse" />
          ) : (
            <DuoChampionCard
              maleChampions={maleChampions}
              femaleChampions={femaleChampions}
              maleWeeklyPerformer={maleWeeklyPerformer}
              femaleWeeklyPerformer={femaleWeeklyPerformer}
              seasonProgress={seasonProgress}
              setSelectedPlayer={setSelectedPlayer}
              skinMap={skinMap}
            />
          )}
        </div>

        {/* ═══ Sultan of Season Card ═══ */}
        {sultans.length > 0 && !isDataLoading && !isSeasonDataPlaceholder && (
          <div className="mt-4">
            <SultanOfSeasonCard sultans={sultans} setSelectedPlayer={setSelectedPlayer} />
          </div>
        )}

        {/* ═══ Club Season Champion Card (Tarkam) ═══ */}
        {hasClubChampion && !isDataLoading && !isSeasonDataPlaceholder && (
          <div className="mt-8 space-y-6">
            {Array.from(clubChampionGroups.entries()).map(([key, entries]) => (
              <ClubChampionCard
                key={key}
                clubChampions={entries}
                setSelectedClub={setSelectedClub}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
