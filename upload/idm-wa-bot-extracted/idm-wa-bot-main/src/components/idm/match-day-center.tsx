'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
// Note: motion.div removed — replaced with CSS animations
import {
  Trophy, Crown, Radio, Clock, Flame,
  Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareButton } from './ui/share-button';
import {
  MatchDayHeroSkeleton,
  MatchRowSkeleton,
  StatsRowSkeleton,
} from './ui/skeleton';
import { useState, useMemo } from 'react';
import { getDivisionTheme, type DivisionTheme } from '@/hooks/use-division-theme';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { formatCurrency, parseWitaDate } from '@/lib/utils';
import type { StatsData } from '@/types/stats';
import { BracketView } from './bracket-view';
// container/item removed — replaced with CSS stagger-item classes

/* ─── Live Pulse Indicator ─── */
function LivePulse() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Live</span>
    </div>
  );
}



/* ─── Section Card ─── */
function SectionCard({ title, icon: Icon, badge, children, className = '', theme }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  theme?: DivisionTheme;
}) {
  const storeTheme = useCommunityTheme();
  const dt = theme ?? storeTheme;
  return (
    <Card className={`${dt.casinoCard} overflow-hidden ${className}`}>
      <div className={dt.casinoBar} />
      <CardContent className="p-0 relative z-10">
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
          <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3 h-3 ${dt.neonText}`} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
          {badge && <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{badge}</Badge>}
        </div>
        <div className="p-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   SINGLE DIVISION: MatchDayContent
   Renders the full match day view for ONE specific division
   ═══════════════════════════════════════════════ */
function MatchDayContent({ divisionProp }: { divisionProp: 'male' | 'female' }) {
  // Use division theme for ALL card interior styling — male=cyan, female=purple.
  // Outer shell background (community-surface + useShellTheme) handles the neutral gold base.
  const ct = getDivisionTheme(divisionProp);
  const dt = ct; // alias for readability in division-specific contexts
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);
  const { playerAuth } = useAppStore();
  const loggedInGamertag = playerAuth.isAuthenticated ? playerAuth.account?.player.gamertag : null;

  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ['stats', divisionProp],
    queryFn: async () => {
      const res = await fetch(`/api/stats?division=${divisionProp}`);
      return res.json();
    },
  });

  const [bracketTypeManual, setBracketTypeManual] = useState<string | null>(null);
  // Auto-detect from tournament format, but allow manual override
  const tournamentFormat = data?.activeTournament?.format;
  const bracketType = bracketTypeManual || tournamentFormat || 'swiss';

  if (isLoading) {
    return (
      <div className="space-y-5">
        <MatchDayHeroSkeleton />
        <div className="border-b border-border">
          <div className="flex items-center gap-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-9 w-24 rounded-none" aria-hidden="true" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3">
            <div className="skeleton-shimmer h-5 w-32 rounded" aria-hidden="true" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-6 w-full rounded-lg" aria-hidden="true" />
              ))}
            </div>
          </div>
          <StatsRowSkeleton count={3} className="grid-cols-3" />
        </div>
        <MatchRowSkeleton count={4} />
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`w-8 h-8 border-2 ${ct.border} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  const t = data.activeTournament;
  const tournamentMatches = t?.matches || [];
  const selectedMatch = tournamentMatches[selectedMatchIdx] || tournamentMatches[0];

  const divisionAccentColor = divisionProp === 'male' ? '#2E9FFF' : '#FF2D78';

  return (
    <div className="space-y-5 rounded-2xl overflow-hidden" style={{ borderTop: `3px solid ${divisionAccentColor}` }}>

      {/* ═══════ HERO: Featured Match Banner ═══════ */}
      <div className="stagger-item-subtle stagger-d0">
        <Card className={`${ct.casinoCard} ${ct.casinoGlow} casino-shimmer overflow-hidden`}>
          <div className={ct.casinoBar} />
          <div className="relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />

            <div className="relative z-10 p-4 lg:p-6">
              {/* Top Bar: Tournament Info + Live Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Badge className={`${ct.casinoBadge} text-[10px]`}>
                    <Flame className="w-3 h-3 mr-1" />
                    Week {t?.weekNumber ?? '-'}
                  </Badge>
                  <Badge className={`${ct.casinoBadge} text-[10px]`}>
                    {t?.name || 'Turnamen IDM'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <ShareButton
                    title={t?.name || 'Tarkam IDM'}
                    description={`Week ${t?.weekNumber ?? '-'} — ${divisionProp === 'male' ? 'Male' : 'Female'} Division`}
                    variant="icon"
                  />
                  {(selectedMatch?.status === 'live' || selectedMatch?.status === 'main_event') ? (
                    <LivePulse />
                  ) : selectedMatch?.status === 'completed' ? (
                    <Badge className="bg-green-500/10 text-green-500 text-[10px] font-black border-0">SELESAI</Badge>
                  ) : (
                    <Badge className={`${ct.casinoBadge} text-[10px]`}>MENDATANG</Badge>
                  )}
                </div>
              </div>

              {/* Match Selection Tabs */}
              {tournamentMatches.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                  {tournamentMatches.map((m, idx) => {
                    const isActive = idx === selectedMatchIdx;
                    const isLive = m.status === 'live' || m.status === 'main_event';
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMatchIdx(idx)}
                        className={`shrink-0 px-3 py-2 rounded-md text-[11px] min-h-[36px] font-semibold transition-all border ${
                          isActive
                            ? `${ct.bg} ${ct.text} ${ct.border} shadow-sm`
                            : `${ct.bgSubtle} ${ct.borderSubtle} text-muted-foreground hover:text-foreground`
                        } ${isLive ? 'border-red-500/30' : ''}`}
                      >
                        {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 live-dot" />}
                        {m.team1?.name || 'TBD'} vs {(m.team2?.name || 'TBD')}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ═══ Main Match Display ═══ */}
              {selectedMatch && (
                <div className="flex items-center gap-4 lg:gap-8">
                  {/* Team 1 */}
                  <div className={`flex-1 text-center ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! ? '' : 'opacity-80'}`}>
                    <div
                      className={`hover-scale-md w-20 h-20 lg:w-28 lg:h-28 mx-auto rounded-2xl flex items-center justify-center text-2xl lg:text-4xl font-black shadow-lg ${
                        selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2!
                          ? `bg-gradient-to-br ${divisionProp === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white glow-champion`
                          : `${ct.iconBg} ${ct.text}`
                      }`}
                    >
                      {(selectedMatch.team1?.name || 'TBD').slice(0, 2).toUpperCase()}
                    </div>
                    <p className={`text-sm lg:text-xl font-bold mt-3 ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! ? dt.neonText : ''}`}>
                      {selectedMatch.team1?.name || 'TBD'}
                    </p>
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! && (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[9px] border-0 mt-1">
                        <Crown className="w-2.5 h-2.5 mr-0.5" /> WINNER
                      </Badge>
                    )}
                  </div>

                  {/* VS / Score Center */}
                  <div className="flex flex-col items-center shrink-0">
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null ? (
                      <div className="flex items-center gap-3 lg:gap-5">
                        <span
                          className={`stagger-item-subtle text-4xl lg:text-6xl font-black tabular-nums ${
                            selectedMatch.score1 > selectedMatch.score2 ? dt.neonGradient : 'text-foreground/30'
                          }`}
                        >
                          {selectedMatch.score1}
                        </span>
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-full ${ct.bgSubtle} ${ct.border} border flex items-center justify-center`}>
                            <Star className={`w-5 h-5 lg:w-7 lg:h-7 ${ct.neonText}`} />
                          </div>
                          <span className="text-[8px] text-muted-foreground mt-1 font-semibold uppercase">
                            {selectedMatch.status === 'completed' ? 'Final' : 'BO3'}
                          </span>
                        </div>
                        <span
                          className={`stagger-item-subtle text-4xl lg:text-6xl font-black tabular-nums ${
                            selectedMatch.score2 > selectedMatch.score1 ? dt.neonGradient : 'text-foreground/30'
                          }`}
                        >
                          {selectedMatch.score2}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div
                          className={`animate-pulse-scale w-16 h-16 lg:w-24 lg:h-24 rounded-full ${ct.bgSubtle} ${ct.border} border-2 flex items-center justify-center`}
                        >
                          <span className={`text-xl lg:text-3xl font-black ${ct.neonGradient}`}>VS</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-2 font-semibold">Segera Dimulai</span>
                      </div>
                    )}

                    {/* MVP */}
                    {selectedMatch.mvpPlayer && (
                      <div
                        className={`stagger-item-subtle flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg ${ct.bgSubtle} ${ct.border} border`}
                      >
                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-[10px] font-semibold text-yellow-500">MVP: {selectedMatch.mvpPlayer.gamertag}</span>
                      </div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className={`flex-1 text-center ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! ? '' : 'opacity-80'}`}>
                    <div
                      className={`hover-scale-md w-20 h-20 lg:w-28 lg:h-28 mx-auto rounded-2xl flex items-center justify-center text-2xl lg:text-4xl font-black shadow-lg ${
                        selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1!
                          ? `bg-gradient-to-br ${divisionProp === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white glow-champion`
                          : `${ct.iconBg} ${ct.text}`
                      }`}
                    >
                      {(selectedMatch.team2?.name || 'TBD').slice(0, 2).toUpperCase()}
                    </div>
                    <p className={`text-sm lg:text-xl font-bold mt-3 ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! ? dt.neonText : ''}`}>
                      {selectedMatch.team2?.name || 'TBD'}
                    </p>
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! && (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[9px] border-0 mt-1">
                        <Crown className="w-2.5 h-2.5 mr-0.5" /> WINNER
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Score Bar */}
              {selectedMatch && selectedMatch.score1 !== null && selectedMatch.score2 !== null && (selectedMatch.score1 + selectedMatch.score2) > 0 && (
                <div className="mt-4">
                  <div className={`h-2 rounded-full ${ct.bgSubtle} overflow-hidden flex`}>
                    <div
                      className={`h-full rounded-l-full bg-gradient-to-r ${divisionProp === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`}
                      style={{ width: `${(selectedMatch.score1 / (selectedMatch.score1 + selectedMatch.score2)) * 100}%`, transition: 'width 0.8s ease-out' }}
                    />
                    <div
                      className={`h-full rounded-r-full bg-gradient-to-r ${divisionProp === 'male' ? 'from-idm-male-light to-idm-male' : 'from-idm-female-light to-idm-female'}`}
                      style={{ width: `${(selectedMatch.score2 / (selectedMatch.score1 + selectedMatch.score2)) * 100}%`, opacity: 0.5, transition: 'width 0.8s ease-out' }}
                    />
                  </div>
                </div>
              )}

              {/* Match Meta */}
              {t && (
                <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.scheduledAt ? parseWitaDate(t.scheduledAt)?.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBD'}</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />Week {t.weekNumber}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{formatCurrency(t.prizePool)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ═══════ TABS: Bracket / Results ═══════ */}
      <Tabs defaultValue="bracket" className="w-full">
        <div className={`border-b ${ct.border}`}>
          <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
            {[
              { value: 'bracket', label: 'Bracket', icon: Trophy },
              { value: 'results', label: 'Hasil', icon: Trophy },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`relative px-3 py-2.5 text-[11px] sm:text-xs sm:px-4 font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:shadow-none ${divisionProp === 'male' ? 'data-[state=active]:text-idm-male' : 'data-[state=active]:text-idm-female'} text-muted-foreground hover:text-foreground transition-colors`}
              >
                <tab.icon className="w-3.5 h-3.5 mr-1.5 inline" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ═══ BRACKET TAB — MPL Style Visual Bracket ═══ */}
        <TabsContent value="bracket" className="mt-4 space-y-4">
          <div className="space-y-4">
            {/* Bracket Type Selector */}
            <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1.5 shrink-0">Format:</span>
              {[
                { value: 'swiss', label: '🇨🇭 Swiss' },
                { value: 'single_elimination', label: 'Elim. Langsung' },
                { value: 'group_stage', label: 'Fase Grup' },
                { value: 'round_robin', label: 'Round Robin' },
              ].map(bt => (
                <button
                  key={bt.value}
                  onClick={() => setBracketTypeManual(bt.value)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${
                    bracketType === bt.value
                      ? 'bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/40'
                  }`}
                >
                  {bt.label}
                </button>
              ))}
            </div>

            {/* MPL Visual Bracket */}
            {tournamentMatches.length === 0 ? (
              <SectionCard title="Bracket Turnamen" icon={Trophy} theme={ct}>
                <div className="text-center py-8">
                  <Trophy className={`w-10 h-10 mx-auto mb-3 opacity-30`} />
                  <p className="text-sm text-muted-foreground">Belum ada bracket — turnamen belum dimulai</p>
                </div>
              </SectionCard>
            ) : (
              <BracketView
                matches={tournamentMatches.map(m => ({
                  ...m,
                  round: m.round ?? 1,
                }))}
                bracketType={bracketType as any}
              />
            )}
          </div>
        </TabsContent>

        {/* ═══ RESULTS TAB ═══ */}
        <TabsContent value="results" className="mt-4 space-y-4">
          <div className="space-y-4">
            {/* All Tournament Results */}
            <div className="stagger-item-fast stagger-d0">
              <SectionCard title="Hasil Turnamen" icon={Trophy} badge={`${tournamentMatches.length} match`} theme={ct}>
                <div className="space-y-2">
                  {tournamentMatches.map((m) => {
                    const hasScore = m.score1 !== null && m.score2 !== null;
                    const winner1 = hasScore && m.score1! > m.score2!;
                    const winner2 = hasScore && m.score2! > m.score1!;
                    const isLive = m.status === 'live' || m.status === 'main_event';

                    return (
                      <div
                        key={m.id}
                        className={`flex items-stretch rounded-lg overflow-hidden ${ct.bgSubtle} ${ct.borderSubtle} border transition-all ${ct.hoverBorder} cursor-pointer`}
                        onClick={() => {
                          const idx = tournamentMatches.findIndex(tm => tm.id === m.id);
                          if (idx >= 0) setSelectedMatchIdx(idx);
                        }}
                      >
                        {/* Round indicator */}
                        <div className={`w-10 shrink-0 flex items-center justify-center ${ct.bg} border-r ${ct.borderSubtle}`}>
                          <span className={`text-[9px] font-bold ${ct.neonText}`}>R{m.round}</span>
                        </div>

                        {/* Main match content */}
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center px-3 py-1.5 border-b ${ct.borderSubtle} ${winner1 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner1 && <span className="mr-1">▸</span>}
                              {m.team1?.name || 'TBD'}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-foreground'}`}>
                              {hasScore ? m.score1 : '-'}
                            </span>
                          </div>
                          <div className={`flex items-center px-3 py-1.5 ${winner2 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner2 && <span className="mr-1">▸</span>}
                              {(m.team2?.name || 'TBD')}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-foreground'}`}>
                              {hasScore ? m.score2 : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="w-16 shrink-0 flex flex-col items-center justify-center border-l border-transparent">
                          {isLive ? (
                            <Badge className="bg-red-500/10 text-red-500 text-[8px] border-0 live-dot">LIVE</Badge>
                          ) : m.status === 'completed' ? (
                            <Badge className="bg-green-500/10 text-green-500 text-[8px] border-0">FT</Badge>
                          ) : (
                            <Badge className={`${ct.casinoBadge} text-[8px]`}>VS</Badge>
                          )}
                          {m.mvpPlayer && <span className="text-[7px] text-yellow-500 mt-0.5 font-bold">MVP</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            {/* Recent Tarkam Results */}
            <div className="stagger-item-fast stagger-d1">
              <SectionCard title="Hasil Tarkam" icon={Radio} badge="Terbaru" theme={ct}>
                <div className="space-y-2">
                  {data.recentMatches?.slice(0, 6).map(m => {
                    const winner1 = m.score1 > m.score2;
                    const winner2 = m.score2 > m.score1;
                    return (
                      <div key={m.id} className={`flex items-stretch rounded-lg overflow-hidden ${ct.bgSubtle} ${ct.borderSubtle} border`}>
                        <div className={`w-10 shrink-0 flex items-center justify-center ${ct.bg} border-r ${ct.borderSubtle}`}>
                          <span className={`text-[9px] font-bold ${ct.neonText}`}>W{m.week}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center px-3 py-1.5 border-b ${ct.borderSubtle} ${winner1 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner1 && <span className="mr-1">▸</span>}{m.club1.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-foreground'}`}>{m.score1}</span>
                          </div>
                          <div className={`flex items-center px-3 py-1.5 ${winner2 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner2 && <span className="mr-1">▸</span>}{m.club2.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-foreground'}`}>{m.score2}</span>
                          </div>
                        </div>
                        <div className="w-14 shrink-0 flex items-center justify-center border-l border-transparent">
                          <Badge className="bg-green-500/10 text-green-500 text-[8px] border-0">FT</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT: MatchDayCenter
   Shows division selector + one or two MatchDayContent views
   ═══════════════════════════════════════════════ */
export function MatchDayCenter() {
  const { division, setDivision } = useAppStore();

  return (
    <div className="lg:community-surface lg:rounded-3xl lg:border lg:border-white/[0.06] overflow-hidden relative">
      {/* Subtle gold radial glow at top — desktop only */}
      <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-48 bg-idm-gold-warm/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-2 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
      {/* ═══ Context Header — consistent with all views ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-idm-gold-warm" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-idm-gold-warm">Arena Live</h2>
            <p className="text-[10px] text-muted-foreground/60">Pertandingan real-time Tarkam IDM</p>
          </div>
        </div>
      </div>

      {/* ═══════ Division Selector ═══════ */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/20 border border-border/10">
          {([
            { key: 'semua' as const, label: 'Semua' },
            { key: 'male' as const, label: 'Male' },
            { key: 'female' as const, label: 'Female' },
          ]).map(div => (
            <button
              key={div.key}
              onClick={() => setDivision(div.key)}
              className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                division === div.key
                  ? div.key === 'semua'
                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                    : div.key === 'male'
                      ? 'bg-idm-male/15 text-idm-male border border-idm-male/30 shadow-sm'
                      : 'bg-idm-female/15 text-idm-female border border-idm-female/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`}
            >
              {div.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ Content: Both divisions or Single ═══════ */}
      {division === 'semua' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MatchDayContent divisionProp="male" />
          <MatchDayContent divisionProp="female" />
        </div>
      ) : (
        <MatchDayContent divisionProp={division === 'female' ? 'female' : 'male'} />
      )}
      </div>
    </div>
  );
}
