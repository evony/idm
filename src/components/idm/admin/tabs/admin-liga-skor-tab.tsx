'use client';

import { Trophy, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UseMutationResult } from '@tanstack/react-query';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

interface AdminLigaSkorTabProps {
  stats: any;
  scoreLeagueMatch: UseMutationResult<any, Error, { matchId: string; score1: number; score2: number }, unknown>;
  scorePlayoffMatch: UseMutationResult<any, Error, { matchId: string; score1: number; score2: number }, unknown>;
  setConfirmDialog: (state: ConfirmDialogState) => void;
  dt: ReturnType<typeof import('@/hooks/use-division-theme')['useDivisionTheme']>;
}

export function AdminLigaSkorTab({
  stats,
  scoreLeagueMatch,
  scorePlayoffMatch,
  setConfirmDialog,
  dt,
}: AdminLigaSkorTabProps) {
  return (
    <div className="space-y-4">
      {/* League Match Scoring */}
      <Card className={dt.casinoCard}>
        <div className={dt.casinoBar} />
        <CardContent className="p-4 relative z-10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy className={`w-4 h-4 ${dt.neonText}`} /> Skor League Match
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {stats?.leagueMatches?.filter((m: { status: string }) => m.status === 'upcoming').map((m: { id: string; week: number; club1: { name: string }; club2: { name: string }; format: string }) => (
              <div key={m.id} className="p-4 sm:p-5 rounded-lg bg-muted/50 border border-border/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold truncate">Week {m.week}: {m.club1.name} vs {m.club2.name}</p>
                  <Badge className={`${dt.casinoBadge}`}>{m.format}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <Button size="sm" variant="outline" className="h-9 text-[10px] min-h-[44px]" disabled={scoreLeagueMatch.isPending || scorePlayoffMatch.isPending}
                    onClick={() => setConfirmDialog({
                      open: true,
                      title: 'Konfirmasi Skor',
                      description: `Set skor Week ${m.week}: ${m.club1.name} 2-0 ${m.club2.name}`,
                      onConfirm: () => scoreLeagueMatch.mutate({ matchId: m.id, score1: 2, score2: 0 })
                    })}>
                    2-0 {m.club1.name.slice(0, 3)}
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-[10px] min-h-[44px]" disabled={scoreLeagueMatch.isPending || scorePlayoffMatch.isPending}
                    onClick={() => setConfirmDialog({
                      open: true,
                      title: 'Konfirmasi Skor',
                      description: `Set skor Week ${m.week}: ${m.club1.name} 2-1 ${m.club2.name}`,
                      onConfirm: () => scoreLeagueMatch.mutate({ matchId: m.id, score1: 2, score2: 1 })
                    })}>
                    2-1
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-[10px] min-h-[44px]" disabled={scoreLeagueMatch.isPending || scorePlayoffMatch.isPending}
                    onClick={() => setConfirmDialog({
                      open: true,
                      title: 'Konfirmasi Skor',
                      description: `Set skor Week ${m.week}: ${m.club1.name} 0-2 ${m.club2.name}`,
                      onConfirm: () => scoreLeagueMatch.mutate({ matchId: m.id, score1: 0, score2: 2 })
                    })}>
                    0-2 {m.club2.name.slice(0, 3)}
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-[10px] min-h-[44px]" disabled={scoreLeagueMatch.isPending || scorePlayoffMatch.isPending}
                    onClick={() => setConfirmDialog({
                      open: true,
                      title: 'Konfirmasi Skor',
                      description: `Set skor Week ${m.week}: ${m.club1.name} 1-2 ${m.club2.name}`,
                      onConfirm: () => scoreLeagueMatch.mutate({ matchId: m.id, score1: 1, score2: 2 })
                    })}>
                    1-2
                  </Button>
                </div>
              </div>
            ))}
            {stats?.leagueMatches?.filter((m: { status: string }) => m.status === 'upcoming').length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Tidak ada league match mendatang</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Playoff Match Scoring */}
      <Card className={dt.casinoCard}>
        <div className={dt.casinoBar} />
        <CardContent className="p-4 relative z-10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" /> Skor Playoff Match
          </h3>
          <div className="space-y-2">
            {stats?.playoffMatches?.map((m: { id: string; round: string; club1: { name: string }; club2: { name: string }; status: string; format: string; score1: number | null; score2: number | null }) => (
              <div key={m.id} className={`p-4 sm:p-5 rounded-lg border ${m.status === 'upcoming' ? 'bg-muted/50 border-border/30' : `${dt.bg} ${dt.border}`}`}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <Badge className="text-[9px] border-0 bg-yellow-500/10 text-yellow-500">
                      {m.round.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <p className="text-xs font-semibold mt-1">{m.club1.name} vs {m.club2.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.format}</span>
                </div>
                {m.status === 'upcoming' ? (
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {[`3-0 ${m.club1.name.slice(0,3)}`, `3-1`, `3-2`, `0-3 ${m.club2.name.slice(0,3)}`, `1-3`, `2-3`].map((label, i) => {
                      const scores = [[3,0],[3,1],[3,2],[0,3],[1,3],[2,3]][i];
                      return (
                        <Button key={i} size="sm" variant="outline" className="h-9 text-[10px] min-h-[44px]" disabled={scoreLeagueMatch.isPending || scorePlayoffMatch.isPending}
                          onClick={() => setConfirmDialog({
                            open: true,
                            title: 'Konfirmasi Skor Playoff',
                            description: `Set skor ${m.round.replace(/_/g, ' ')}: ${m.club1.name} ${scores[0]}-${scores[1]} ${m.club2.name}`,
                            onConfirm: () => scorePlayoffMatch.mutate({ matchId: m.id, score1: scores[0], score2: scores[1] })
                          })}>
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className={`text-sm font-bold ${dt.neonText} mt-1 casino-score`}>{m.score1} - {m.score2}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
