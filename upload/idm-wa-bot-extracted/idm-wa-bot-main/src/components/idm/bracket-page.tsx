'use client';

import { useQuery } from '@tanstack/react-query';
import type { StatsData } from '@/types/stats';
import {
  Users, Trophy, Crown,
  Gamepad2, Calendar, ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React, { useState, useMemo } from 'react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { useDivisionTheme, getDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';
import { BracketView } from './bracket-view';
import { MatchDetailModal } from './match-detail-modal';
import { SectionCard, MatchRow } from './dashboard/shared';


/* ═══════════════════════════════════════════
   Division Bracket Card — one division's bracket + results
   ═══════════════════════════════════════════ */
function DivisionBracketCard({
  division,
  bracketType,
  onSelectMatch,
}: {
  division: 'male' | 'female';
  bracketType: string;
  onSelectMatch: (matchId: string, preview: any) => void;
}) {
  const dt = getDivisionTheme(division);

  const { data } = useQuery<StatsData>({
    queryKey: ['stats', division],
    queryFn: async () => {
      const res = await fetch(`/api/stats?division=${division}`);
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const recentMatches = data?.recentMatches ?? [];
  const upcomingMatches = data?.upcomingMatches ?? [];
  const t = data?.activeTournament;

  // Auto-detect bracket type from tournament format (not used here, parent handles it)

  // Group matches by week
  const matchesByWeek = useMemo(() => {
    const map: Record<number, StatsData['recentMatches']> = {};
    for (const m of recentMatches) {
      const w = m.week;
      if (!map[w]) map[w] = [];
      map[w].push(m);
    }
    return map;
  }, [recentMatches]);

  const upcomingByWeek = useMemo(() => {
    const map: Record<number, StatsData['upcomingMatches']> = {};
    for (const m of upcomingMatches) {
      const w = m.week;
      if (!map[w]) map[w] = [];
      map[w].push(m);
    }
    return map;
  }, [upcomingMatches]);

  return (
    <div className="space-y-4">
      {/* Bracket Card */}
      <Card className={`${dt.casinoCard} overflow-hidden`}>
        <div className={dt.casinoBar} />
        <div className="relative z-10">
          {/* Header */}
          <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
            <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
              <Trophy className={`w-3 h-3 ${dt.neonText}`} />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">Bracket</h3>
            <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{division === 'male' ? '🕺 Male' : '💃 Female'}</Badge>
          </div>
          <div className="p-4">
            {t?.matches && t.matches.length > 0 ? (
              <BracketView
                matches={t.matches.map(m => ({
                  id: m.id,
                  score1: m.score1,
                  score2: m.score2,
                  status: m.status,
                  round: (m as any).round || 1,
                  matchNumber: (m as any).matchNumber,
                  bracket: (m as any).bracket,
                  groupLabel: (m as any).groupLabel,
                  team1: m.team1,
                  team2: m.team2,
                  mvpPlayer: m.mvpPlayer,
                }))}
                bracketType={bracketType as any}
              />
            ) : recentMatches.length > 0 ? (
              <BracketView
                matches={recentMatches.map(m => ({
                  id: m.id,
                  score1: m.score1 as number | null,
                  score2: m.score2 as number | null,
                  status: 'completed',
                  team1: { id: m.club1.name, name: m.club1.name },
                  team2: { id: m.club2.name, name: m.club2.name },
                  mvpPlayer: null,
                  round: m.week,
                }))}
                bracketType={bracketType as any}
              />
            ) : (
              <div className="p-8 text-center">
                <Gamepad2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-muted-foreground mb-0.5">Belum Ada Bracket</h3>
                <p className="text-[10px] text-muted-foreground/60">Bracket akan muncul setelah pertandingan dimulai</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Match results */}
      {Object.keys(matchesByWeek).length > 0 && (
        <SectionCard title="Hasil Match" icon={Trophy} badge={`${recentMatches.length} Match`}>
          <div className="space-y-4">
            {Object.entries(matchesByWeek)
              .sort(([a], [b]) => Number(b) - Number(a))
              .slice(0, 3)
              .map(([week, matches]) => (
                <div key={week}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-2 py-0.5 rounded-md ${dt.bg} ${dt.text} text-[9px] font-bold uppercase tracking-wider`}>
                      Week {week}
                    </div>
                    <div className={`flex-1 h-px ${dt.borderSubtle}`} />
                    <span className="text-[8px] text-muted-foreground">{matches.length} match</span>
                  </div>
                  <div className="space-y-1.5">
                    {matches.slice(0, 5).map(m => (
                      <div
                        key={m.id}
                        className="cursor-pointer"
                        onClick={() => onSelectMatch(m.id, {
                          club1Name: m.club1.name,
                          club2Name: m.club2.name,
                          score1: m.score1,
                          score2: m.score2,
                          week: Number(week),
                          status: 'completed',
                          format: 'BO3',
                        })}
                      >
                        <MatchRow
                          club1={m.club1.name}
                          club2={m.club2.name}
                          score1={m.score1}
                          score2={m.score2}
                          status="completed"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>
      )}

      {/* Upcoming */}
      {Object.keys(upcomingByWeek).length > 0 && (
        <SectionCard title="Akan Datang" icon={Calendar} badge="JADWAL">
          <div className="space-y-4">
            {Object.entries(upcomingByWeek)
              .sort(([a], [b]) => Number(a) - Number(b))
              .slice(0, 2)
              .map(([week, matches]) => (
                <div key={week}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-2 py-0.5 rounded-md ${dt.bg} ${dt.text} text-[9px] font-bold uppercase tracking-wider`}>
                      Week {week}
                    </div>
                    <div className={`flex-1 h-px ${dt.borderSubtle}`} />
                    <span className="text-[8px] text-muted-foreground">{matches.length} match</span>
                  </div>
                  <div className="space-y-1.5">
                    {matches.slice(0, 5).map(m => (
                      <div
                        key={m.id}
                        className="cursor-pointer"
                        onClick={() => onSelectMatch(m.id, {
                          club1Name: m.club1.name,
                          club2Name: m.club2.name,
                          score1: null,
                          score2: null,
                          week: Number(week),
                          status: 'upcoming',
                          format: 'BO3',
                        })}
                      >
                        <MatchRow
                          club1={m.club1.name}
                          club2={m.club2.name}
                          score1={0}
                          score2={0}
                          status="upcoming"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   Bracket Page — Shows BOTH divisions simultaneously
   ═══════════════════════════════════════════ */
export function BracketPage() {
  const { setCurrentView } = useAppStore();
  const ct = useCommunityTheme();

  const [bracketType, setBracketType] = useState<string>('swiss');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchPreview, setMatchPreview] = useState<any>(null);

  const handleSelectMatch = (matchId: string, preview: any) => {
    setSelectedMatchId(matchId);
    setMatchPreview(preview);
  };

  return (
    <div className="space-y-5">
      {/* ═══ Page Header ═══ */}
      <div className="space-y-4">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setCurrentView('community')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${ct.iconBg} flex items-center justify-center shrink-0`}>
              <Trophy className={`w-4 h-4 ${ct.neonText}`} />
            </div>
            <div>
              <h2 className="text-base font-bold">Bracket Turnamen</h2>
              <p className="text-[10px] text-muted-foreground">Bagan pertandingan & hasil</p>
            </div>
          </div>
          {/* Both division badges */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Badge className="bg-idm-male/15 text-idm-male border-idm-male/25 text-[9px] border">🕺 Male</Badge>
            <Badge className="bg-idm-female/15 text-idm-female border-idm-female/25 text-[9px] border">💃 Female</Badge>
          </div>
        </div>

        {/* Bracket type selector — global, applies to both divisions */}
        <Card className="border border-border/40 bg-card/60">
          <div className={`flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none`}>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-2 shrink-0">Format:</span>
            {[
              { value: 'swiss', label: '🇨🇭 Swiss', icon: Trophy },
              { value: 'single_elimination', label: 'Elim. Langsung', icon: Trophy },
              { value: 'group_stage', label: 'Fase Grup', icon: Users },
              { value: 'round_robin', label: 'Round Robin', icon: Calendar },
            ].map(bt => (
              <button
                key={bt.value}
                onClick={() => setBracketType(bt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                  bracketType === bt.value
                    ? 'bg-idm-gold-warm/15 text-idm-gold-warm border border-idm-gold-warm/25 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/40'
                }`}
              >
                <bt.icon className="w-3.5 h-3.5" />
                {bt.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ═══ Both Divisions — side by side (desktop) / stacked (mobile) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DivisionBracketCard
          division="male"
          bracketType={bracketType}
          onSelectMatch={handleSelectMatch}
        />
        <DivisionBracketCard
          division="female"
          bracketType={bracketType}
          onSelectMatch={handleSelectMatch}
        />
      </div>

      {/* ═══ Match Detail Modal ═══ */}
      <MatchDetailModal
        matchId={selectedMatchId}
        onClose={() => { setSelectedMatchId(null); setMatchPreview(null); }}
        preview={matchPreview ?? undefined}
      />
    </div>
  );
}
