'use client';

import { useState } from 'react';
import { Crown, TrendingUp, Flame, BarChart3, Music, Shield, Gem, Heart, Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PlayerCard } from '../player-card';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import type { StatsData, TopPlayer, WeeklyPerformer, SultanOfWeekly } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY CHAMPIONS — Tabbed: Top 3 / Top Form / Juara
   ═══════════════════════════════════════════════════════ */
type DivisionFilter = 'all' | 'male' | 'female';

interface CommunityChampionsProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  selectedDivision?: DivisionFilter;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}

export function CommunityChampions({ maleData, femaleData, selectedDivision = 'all', onPlayerClick }: CommunityChampionsProps) {
  const [activeTab, setActiveTab] = useState<'top3' | 'sultan'>('top3');

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('top3')}
          className={`relative px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'top3'
              ? 'border-idm-gold-warm text-idm-gold-warm'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Crown className="w-3 h-3 mr-1 inline" />
          Top 3
        </button>
        <button
          onClick={() => setActiveTab('sultan')}
          className={`relative px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sultan'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Gem className="w-3 h-3 mr-1 inline" />
          Sultan
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'top3' && (
        <div className={`grid gap-5 ${selectedDivision === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {(selectedDivision === 'all' || selectedDivision === 'male') && (
            <ChampionsSection
              title="Male Champions"
              emoji="🕺"
              division="male"
              topPlayers={maleData?.topPlayers || []}
              onPlayerClick={onPlayerClick}
            />
          )}
          {(selectedDivision === 'all' || selectedDivision === 'female') && (
            <ChampionsSection
              title="Female Champions"
              emoji="💃"
              division="female"
              topPlayers={femaleData?.topPlayers || []}
              onPlayerClick={onPlayerClick}
            />
          )}
        </div>
      )}

      {activeTab === 'sultan' && (
        <div className={`grid gap-5 ${selectedDivision === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {(selectedDivision === 'all' || selectedDivision === 'male') && (
            <SultanOfWeekSection
              division="male"
              sultanData={maleData?.sultanOfWeekly}
              skinMap={maleData?.skinMap || {}}
              onPlayerClick={onPlayerClick}
            />
          )}
          {(selectedDivision === 'all' || selectedDivision === 'female') && (
            <SultanOfWeekSection
              division="female"
              sultanData={femaleData?.sultanOfWeekly}
              skinMap={femaleData?.skinMap || {}}
              onPlayerClick={onPlayerClick}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Per-division Champions Card ─── */
function ChampionsSection({
  title,
  emoji,
  division,
  topPlayers,
  onPlayerClick,
}: {
  title: string;
  emoji: string;
  division: 'male' | 'female';
  topPlayers: TopPlayer[];
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const dt = getDivisionTheme(division);
  const top3 = topPlayers.slice(0, 3);

  return (
    <Card className={`${dt.casinoCard} overflow-hidden relative`}>
      <div className={dt.casinoBar} />
      {/* Decorative blur orb */}
      <div className={`hidden lg:block absolute top-8 right-8 w-32 h-32 rounded-full blur-3xl ${dt.bg} opacity-20 pointer-events-none`} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <Crown className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">{title}</h3>
        {top3.length > 0 && (
          <Badge className={`hidden sm:inline-flex ${dt.casinoBadge} ml-auto text-[9px]`}>SEASON BEST</Badge>
        )}
      </div>

      {/* Content — top 3 players or empty state */}
      <div className="p-4 lg:p-6">
        {top3.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {top3.map((p, idx) => (
              <div key={p.id}>
                <PlayerCard
                  gamertag={p.gamertag}
                  avatar={p.avatar}
                  points={p.points}
                  totalWins={p.totalWins}
                  totalMvp={p.totalMvp}
                  streak={p.streak}
                  rank={idx + 1}
                  isMvp={p.totalMvp > 0 && idx === 0}
                  club={p.club}
                  onClick={() => onPlayerClick({ ...p, division }, division)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 rounded-2xl ${dt.bgSubtle} ${dt.border} text-center`}>
            <Crown className={`w-10 h-10 mx-auto mb-3 opacity-20 ${dt.text}`} />
            <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Belum Ada Champion {division === 'male' ? 'Male' : 'Female'}</p>
            <p className="text-xs text-muted-foreground/50">Champion akan muncul setelah season dimulai dan pertandingan selesai</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Sultan of the Week Section — Top Penyawer per division ─── */
export function SultanOfWeekSection({
  division,
  sultanData,
  skinMap,
  onPlayerClick,
}: {
  division: 'male' | 'female';
  sultanData: SultanOfWeekly[] | undefined;
  skinMap: Record<string, any[]>;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
}) {
  const dt = getDivisionTheme(division);
  const accentColor = division === 'male' ? '#2E9FFF' : '#FF2D78';

  // Get the latest sultan (most recent week with donation data)
  const latestSultan = sultanData?.length ? sultanData[sultanData.length - 1] : undefined;

  // Cross-division: check if the Sultan's actual division differs from the tournament division
  const isCrossDivision = latestSultan?.isCrossDivision && latestSultan?.player;
  const donorDivision = latestSultan?.player?.division;
  const crossDivisionEmoji = donorDivision === 'female' ? '💃' : '🕺';
  const crossDivisionLabel = donorDivision === 'female' ? 'Female' : 'Male';

  const content = latestSultan ? (
    <div className="space-y-3">
      {/* Sultan banner — Maroon Heart style matching donasi skin */}
      <div className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center shadow-lg shrink-0" style={{ background: 'linear-gradient(135deg, #800020, #5C0015)' }}>
          <Heart className="w-5 h-5 text-rose-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: '#C4A3A5' }}>
            {latestSultan.player?.gamertag || latestSultan.donorName}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Week {latestSultan.weekNumber} • {formatCurrencyShort(latestSultan.totalAmount)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className="border-0 text-[9px]" style={{ background: 'rgba(128,0,32,0.2)', color: '#C4A3A5' }}>❤️ SULTAN</Badge>
          {isCrossDivision && (
            <Badge className="bg-pink-500/15 text-pink-400 border-0 text-[8px]">
              {crossDivisionEmoji} {crossDivisionLabel}
            </Badge>
          )}
        </div>
      </div>
      {/* Player Card + Donation Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {latestSultan.player ? (
          <div>
            <PlayerCard
              gamertag={latestSultan.player.gamertag}
              avatar={latestSultan.player.avatar}
              points={latestSultan.player.points}
              totalWins={latestSultan.player.totalWins}
              totalMvp={latestSultan.player.totalMvp}
              streak={latestSultan.player.streak}
              rank={1}
              skins={skinMap[latestSultan.player.id]}
              club={latestSultan.player.club}
              onClick={() => onPlayerClick({
                id: latestSultan.player!.id,
                name: latestSultan.player!.gamertag,
                gamertag: latestSultan.player!.gamertag,
                avatar: latestSultan.player!.avatar,
                tier: latestSultan.player!.tier,
                points: latestSultan.player!.points,
                totalWins: latestSultan.player!.totalWins,
                totalMvp: latestSultan.player!.totalMvp,
                streak: latestSultan.player!.streak,
                maxStreak: 0,
                matches: 0,
                division: latestSultan.player!.division,
                club: latestSultan.player!.club ?? undefined,
              }, division)}
            />
          </div>
        ) : (
          /* Anonymous donor placeholder — Maroon Heart style */
          <div className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border} aspect-[3/4]`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, #800020, #5C0015)' }}>
              <Banknote className="w-6 h-6 text-rose-300" />
            </div>
            <p className="text-[10px] font-bold text-center truncate max-w-full" style={{ color: '#C4A3A5' }}>
              {latestSultan.donorName}
            </p>
          </div>
        )}
        {/* Donation Stats — Maroon Heart style */}
        <div className={`col-span-2 flex flex-col justify-center gap-2 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" style={{ color: '#800020' }} />
            <span className="text-sm font-bold" style={{ color: '#800020' }}>{formatCurrencyShort(latestSultan.totalAmount)}</span>
            <span className="text-[9px] text-muted-foreground">TOTAL SAWER</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-3 sm:p-4 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
              <p className="text-sm font-bold" style={{ color: '#800020' }}>{latestSultan.donationCount}x</p>
              <p className="text-[9px] text-muted-foreground">Saweran</p>
            </div>
            <div className={`p-3 sm:p-4 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
              <p className="text-sm font-bold" style={{ color: '#800020' }}>
                {latestSultan.player?.tier || '—'}
              </p>
              <p className="text-[9px] text-muted-foreground">Tier</p>
            </div>
          </div>
          {/* Cross-division supporter note */}
          {isCrossDivision && (
            <div className={`p-3 sm:p-4 rounded-lg bg-pink-500/5 border border-pink-500/10 text-center`}>
              <p className="text-[9px] text-pink-400 font-medium">
                {crossDivisionEmoji} Cross-Division Supporter dari divisi {crossDivisionLabel}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    /* Ghost empty state — Maroon Heart style */
    <div className="space-y-3 opacity-50">
      <div className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(128,0,32,0.25), rgba(92,0,21,0.25))' }}>
          <Heart className="w-5 h-5 opacity-40" style={{ color: '#800020' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 w-24 rounded bg-muted/35 mb-1.5" />
          <div className="h-3 w-36 rounded bg-muted/25" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted/25 shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className={`rounded-2xl overflow-hidden border ${dt.borderSubtle}`}>
          <div
            className="w-full flex items-center justify-center"
            style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg, rgba(128,0,32,0.1), rgba(92,0,21,0.05))' }}
          >
            <Heart className="w-5 h-5 opacity-30" style={{ color: '#800020' }} />
          </div>
          <div className="p-2 space-y-1.5">
            <div className="h-3 w-10 mx-auto rounded bg-muted/35" />
            <div className="h-2 w-6 mx-auto rounded bg-muted/25" />
          </div>
        </div>
        <div className={`col-span-2 flex flex-col justify-center gap-2 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(128,0,32,0.2)' }} />
            <div className="h-4 w-8 rounded bg-muted/35" />
            <div className="h-3 w-14 rounded bg-muted/25" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className={`p-3 sm:p-4 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                <div className="h-4 w-8 mx-auto rounded bg-muted/30 mb-1" />
                <div className="h-2 w-6 mx-auto rounded bg-muted/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`${dt.casinoCard} overflow-hidden relative`}>
      <div className={dt.casinoBar} />
      <div className="hidden lg:block absolute top-8 right-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'rgba(128,0,32,0.15)' }} />

      {/* Header — Maroon Heart style */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className="w-5 h-5 lg:w-6 lg:h-6 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(128,0,32,0.15)' }}>
          <Heart className="w-3 h-3 lg:w-3.5 lg:h-3.5" style={{ color: '#800020' }} />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
          {division === 'male' ? 'Male' : 'Female'} Sultan of the Week
        </h3>
        {latestSultan && (
          <Badge className="hidden sm:inline-flex border-0 ml-auto text-[9px]" style={{ background: 'rgba(128,0,32,0.15)', color: '#800020' }}>❤️ MINGGU INI</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {content}
      </div>
    </Card>
  );
}

/* ─── Top Form Section — Weekly Best Performer per division (LEGACY — kept for backward compat) ─── */
export function TopFormSection({
  division,
  performer,
  onPlayerClick,
  bare = false,
}: {
  division: 'male' | 'female';
  performer: WeeklyPerformer | undefined;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
  bare?: boolean;
}) {
  const dt = getDivisionTheme(division);
  const accentColor = division === 'male' ? '#2E9FFF' : '#FF2D78';
  const DivisionIcon = division === 'male' ? Music : Shield;
  const genderSymbol = division === 'male' ? '♂' : '♀';

  /* ─── Shared content — performer banner, player card, composite breakdown ─── */
  const content = performer ? (
    <div className="space-y-3">
      {/* Top Form banner */}
      <div className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-400 truncate">{performer.gamertag}</p>
          <p className="text-[10px] text-muted-foreground">Week {performer.weekNumber} • Composite {performer.compositeScore}</p>
        </div>
        <Badge className="bg-amber-500/15 text-amber-500 border-0 text-[9px]">🔥 TOP FORM</Badge>
      </div>
      {/* Player Card + Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div>
          <PlayerCard
            gamertag={performer.gamertag}
            avatar={performer.avatar}
            points={performer.points}
            totalWins={performer.weeklyWins}
            totalLosses={performer.weeklyLosses}
            totalMvp={0}
            streak={performer.streak}
            rank={1}
            club={performer.club ? { id: '', name: performer.club } : undefined}
            onClick={() => onPlayerClick({
              ...performer,
              name: performer.gamertag,
              totalWins: performer.weeklyWins,
              totalMvp: 0,
              maxStreak: performer.streak,
              matches: performer.weeklyMatches,
              division,
            } as TopPlayer & { division?: string }, division)}
          />
        </div>
        {/* Composite Score Breakdown */}
        <div className={`col-span-2 flex flex-col justify-center gap-2 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{performer.compositeScore}</span>
            <span className="text-[9px] text-muted-foreground">COMPOSITE</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-3 sm:p-4 rounded-2xl ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
              <p className={`text-sm font-bold ${dt.neonText}`}>{performer.weeklyWins}W/{performer.weeklyLosses}L</p>
              <p className="text-[9px] text-muted-foreground">Record</p>
            </div>
            <div className={`p-3 sm:p-4 rounded-2xl ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
              <p className={`text-sm font-bold ${dt.neonText}`}>{performer.weeklyWinRate}%</p>
              <p className="text-[9px] text-muted-foreground">Win%</p>
            </div>
            <div className={`p-3 sm:p-4 rounded-2xl ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
              <div className="flex items-center justify-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-400" />
                <p className={`text-sm font-bold ${dt.neonText}`}>{performer.streak}</p>
              </div>
              <p className="text-[9px] text-muted-foreground">Streak</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    /* Ghost empty state — mirrors filled layout structure */
    <div className="space-y-3 opacity-50">
      {/* Ghost Top Form banner */}
      <div className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-600/25 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-amber-500/40" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 w-24 rounded bg-muted/35 mb-1.5" />
          <div className="h-3 w-36 rounded bg-muted/25" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted/25 shrink-0" />
      </div>

      {/* Ghost player card + stats grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Ghost player card */}
        <div className={`rounded-2xl overflow-hidden border ${dt.borderSubtle}`}>
          <div
            className="w-full flex items-center justify-center"
            style={{ aspectRatio: '3/4', background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)` }}
          >
            <TrendingUp className="w-5 h-5 opacity-30" style={{ color: accentColor }} />
          </div>
          <div className="p-2 space-y-1.5">
            <div className="h-3 w-10 mx-auto rounded bg-muted/35" />
            <div className="h-2 w-6 mx-auto rounded bg-muted/25" />
          </div>
        </div>

        {/* Ghost composite stats */}
        <div className={`col-span-2 flex flex-col justify-center gap-2 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.border}`}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-400/20" />
            <div className="h-4 w-8 rounded bg-muted/35" />
            <div className="h-3 w-14 rounded bg-muted/25" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`p-3 sm:p-4 rounded-2xl ${dt.bgSubtle} ${dt.borderSubtle} text-center`}>
                <div className="h-4 w-8 mx-auto rounded bg-muted/30 mb-1" />
                <div className="h-2 w-6 mx-auto rounded bg-muted/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Bare mode — no Card wrapper, just content with division label ─── */
  if (bare) {
    return (
      <div className={`p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} ${dt.borderSubtle}`}>
        {/* Division label */}
        <div className="flex items-center gap-1.5 mb-3">
          <DivisionIcon className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {division} {genderSymbol}
          </span>
        </div>
        {content}
      </div>
    );
  }

  /* ─── Full mode — Card wrapper with header, casino bar, etc. ─── */
  return (
    <Card className={`${dt.casinoCard} overflow-hidden relative`}>
      <div className={dt.casinoBar} />
      <div className={`hidden lg:block absolute top-8 right-8 w-32 h-32 rounded-full blur-3xl ${dt.bg} opacity-20 pointer-events-none`} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded bg-amber-500/15 flex items-center justify-center shrink-0`}>
          <TrendingUp className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-400" />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">
          {division === 'male' ? 'Male' : 'Female'} Top Form
        </h3>
        {performer && (
          <Badge className="hidden sm:inline-flex bg-amber-500/15 text-amber-500 border-0 ml-auto text-[9px]">🔥 MINGGU INI</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {content}
      </div>
    </Card>
  );
}

/** Compact currency formatting for widget display */
function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}K`;
  return `Rp ${amount}`;
}
