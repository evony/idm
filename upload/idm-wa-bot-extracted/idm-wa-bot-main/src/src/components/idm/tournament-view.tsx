'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
  Music, Users, Crown, Trophy, ChevronRight, Calendar, MapPin, Heart,
  Swords, Clock, Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from './tier-badge';
import { StatusBadge } from './status-badge';
import { useState } from 'react';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { formatCurrency } from '@/lib/utils';
import { container, item } from '@/lib/animations';

interface Tournament {
  id: string; name: string; weekNumber: number; division: string; status: string;
  prizePool: number; bpm: number; location: string; scheduledAt: string | null;
  teams: { id: string; name: string; isWinner: boolean; power: number;
    teamPlayers: { player: { id: string; name: string; gamertag: string; tier: string; points: number } }[]
  }[];
  matches: { id: string; score1: number | null; score2: number | null; status: string; round: number;
    team1: { id: string; name: string }; team2: { id: string; name: string };
    mvpPlayer: { id: string; name: string; gamertag: string } | null
  }[];
  participations: { id: string; status: string; pointsEarned: number; isMvp: boolean; isWinner: boolean;
    player: { id: string; name: string; gamertag: string; tier: string; points: number }
  }[];
  donations: { id: string; donorName: string; amount: number }[];
  _count?: { teams: number; participations: number; matches: number };
}

export function TournamentView() {
  const { division } = useAppStore();
  const dt = useDivisionTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ['tournaments', division],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments?division=${division}`);
      return res.json();
    },
  });

  const { data: selected } = useQuery<Tournament>({
    queryKey: ['tournament', selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${selectedId}`);
      return res.json();
    },
    enabled: !!selectedId,
  });

  // Tournament List View
  if (!selectedId) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Music className={`w-5 h-5 ${dt.neonText}`} />
          <h2 className="text-lg font-bold text-gradient-fury">Tournament Mingguan</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tournaments?.map(t => {
            const teamCount = t._count?.teams || 0;
            const matchCount = t._count?.matches || 0;
            const winnerTeam = t.teams?.find(tm => tm.isWinner);
            const isCompleted = t.status === 'completed';
            return (
              <motion.div key={t.id} variants={item}>
                <Card
                  className={`${dt.casinoCard} ${dt.casinoGlow} casino-shimmer card-lift cursor-pointer ${t.status === 'main_event' ? dt.neonPulse : ''}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className={dt.casinoBar} />
                  <CardContent className="p-4 relative z-10">
                    {/* Top: Week + Division + Status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] ${dt.neonText} font-semibold uppercase tracking-wider`}>Week {t.weekNumber}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${t.division === 'male' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-purple-500/15 text-purple-400'}`}>{t.division === 'male' ? '♂ Male' : '♀ Female'}</span>
                        </div>
                        <p className="text-sm font-bold truncate">{t.name}</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3 h-3 shrink-0" />
                        <span>{t._count?.participations || 0} Peserta</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Trophy className="w-3 h-3 shrink-0" />
                        <span>{formatCurrency(t.prizePool)}</span>
                      </span>
                      {teamCount > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Swords className="w-3 h-3 shrink-0" />
                          <span>{teamCount} Tim</span>
                        </span>
                      )}
                      {matchCount > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3 shrink-0" />
                          <span>{matchCount} Match</span>
                        </span>
                      )}
                      {t.bpm > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Heart className="w-3 h-3 shrink-0 text-red-400" />
                          <span>{t.bpm} BPM</span>
                        </span>
                      )}
                      {t.scheduledAt && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{new Date(t.scheduledAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </span>
                      )}
                    </div>

                    {/* Winner Banner */}
                    {isCompleted && winnerTeam && (
                      <div className={`mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${dt.bgSubtle} border ${dt.borderSubtle}`}>
                        <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        <span className="text-[11px] font-semibold truncate">{winnerTeam.name}</span>
                        <Trophy className="w-3 h-3 text-[#d4a853] shrink-0 ml-auto" />
                      </div>
                    )}

                    {/* Bottom arrow */}
                    <div className="flex items-center justify-end mt-2.5">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Tournament Detail View — Read-only
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-5xl mx-auto">
      <button onClick={() => setSelectedId(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        ← Kembali ke tournament
      </button>

      {selected && (
        <>
          {/* Header — Info only, no action buttons */}
          <motion.div variants={item}>
            <Card className={`${dt.casinoCard} ${dt.cornerAccent} overflow-hidden`}>
              <div className={dt.casinoBar} />
              <CardContent className="p-0 relative z-10">
                <div className="relative p-4 casino-img-overlay">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-[10px] ${dt.neonText} font-semibold uppercase tracking-wider mb-1`}>Week {selected.weekNumber}</p>
                      <h2 className={`text-xl font-bold ${dt.neonGradient}`}>{selected.name}</h2>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {selected.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selected.location}</span>
                        )}
                        {selected.bpm > 0 && (
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> {selected.bpm} BPM</span>
                        )}
                        {selected.scheduledAt && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selected.scheduledAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        )}
                        {selected.prizePool > 0 && (
                          <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-[#d4a853]" /> {formatCurrency(selected.prizePool)}</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Registered Players — Read-only list */}
            <motion.div variants={item}>
              <Card className={`${dt.casinoCard} h-full`}>
                <div className={dt.casinoBar} />
                <CardContent className="p-0 relative z-10">
                  <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                    <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                      <Users className={`w-3 h-3 ${dt.neonText}`} />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider">Players Terdaftar</h3>
                    <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{selected.participations?.length || 0}</Badge>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {selected.participations?.length > 0 ? selected.participations.map(p => (
                      <div key={p.id} className={`flex items-center justify-between px-2 py-2 rounded-lg ${dt.hoverBgSubtle} transition-colors border-b ${dt.borderSubtle} last:border-0`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${dt.iconBg} flex items-center justify-center text-[10px] font-bold ${dt.neonText}`}>
                            {p.player.gamertag.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{p.player.gamertag}</p>
                            <p className="text-[10px] text-muted-foreground">{p.player.points} pts</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TierBadge tier={p.player.tier} />
                          {p.isMvp && <Crown className="w-3 h-3 text-yellow-500" />}
                          {p.isWinner && <Trophy className="w-3 h-3 text-[#d4a853]" />}
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Belum ada peserta</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Teams — Read-only list */}
            <motion.div variants={item}>
              <Card className={`${dt.casinoCard} h-full`}>
                <div className={dt.casinoBar} />
                <CardContent className="p-0 relative z-10">
                  <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                    <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                      <Music className={`w-3 h-3 ${dt.neonText}`} />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider">Tim</h3>
                    <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{selected.teams?.length || 0}</Badge>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {selected.teams?.length > 0 ? (
                      selected.teams.map(t => (
                        <div key={t.id} className={`p-2.5 rounded-lg mb-1.5 border ${dt.borderSubtle} ${t.isWinner ? dt.bgSubtle : ''}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold">{t.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-muted-foreground">Kekuatan: {t.power}</span>
                              {t.isWinner && <Crown className="w-3 h-3 text-yellow-500" />}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {t.teamPlayers.map(tp => (
                              <div key={tp.player.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${dt.bgSubtle} text-[10px]`}>
                                <TierBadge tier={tp.player.tier} />
                                <span>{tp.player.gamertag}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Tim belum di-generate</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Hasil Pertandingan — Simple match results list */}
          {selected.matches?.length > 0 && (
            <motion.div variants={item}>
              <Card className={`${dt.casinoCard} overflow-hidden`}>
                <div className={dt.casinoBar} />
                <CardContent className="p-0 relative z-10">
                  <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                    <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                      <Swords className={`w-3 h-3 ${dt.neonText}`} />
                    </div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider">Hasil Pertandingan</h3>
                    <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{selected.matches.length} Match</Badge>
                  </div>

                  <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                    {Object.entries(
                      selected.matches.reduce((acc, m) => {
                        if (!acc[m.round]) acc[m.round] = [];
                        acc[m.round].push(m);
                        return acc;
                      }, {} as Record<number, typeof selected.matches>)
                    ).map(([round, matches], roundIdx) => (
                      <div key={round} className="mb-3 last:mb-0">
                        {/* Round header */}
                        <div className={`inline-block mb-2 px-2.5 py-1 rounded-md ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider`}>
                          {roundIdx === 0 ? 'Perempat Final' : roundIdx === 1 ? 'Semi Final' : roundIdx === 2 ? 'Final' : `Babak ${round}`}
                        </div>

                        {matches.map((m) => {
                          const hasScore = m.score1 !== null && m.score2 !== null;
                          const winner1 = hasScore && m.score1! > m.score2!;
                          const winner2 = hasScore && m.score2! > m.score1!;
                          const isLive = m.status === 'live';
                          const isUpcoming = !hasScore && !isLive;
                          return (
                            <div key={m.id} className={`flex items-center gap-2 mb-1.5 last:mb-0 px-3 py-2.5 rounded-lg border ${dt.borderSubtle} ${dt.hoverBgSubtle} transition-colors ${isLive ? 'border-red-500/30' : ''}`}>
                              {/* Team 1 */}
                              <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${winner1 ? '' : winner2 ? 'opacity-50' : ''}`}>
                                {winner1 && <span className={`${dt.neonText} text-xs`}>▸</span>}
                                <span className={`text-xs font-semibold truncate ${winner1 ? dt.neonText : 'text-foreground/90'}`}>{m.team1.name}</span>
                              </div>

                              {/* Score / VS */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isLive ? (
                                  <span className="text-[10px] font-bold text-red-500 live-dot px-1.5 py-0.5 rounded bg-red-500/10">LIVE</span>
                                ) : isUpcoming ? (
                                  <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted/50">VS</span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className={`text-sm font-bold tabular-nums ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>{m.score1}</span>
                                    <span className="text-[10px] text-muted-foreground">-</span>
                                    <span className={`text-sm font-bold tabular-nums ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>{m.score2}</span>
                                  </div>
                                )}
                              </div>

                              {/* Team 2 */}
                              <div className={`flex items-center gap-1.5 flex-1 min-w-0 justify-end ${winner2 ? '' : winner1 ? 'opacity-50' : ''}`}>
                                <span className={`text-xs font-semibold truncate ${winner2 ? dt.neonText : 'text-foreground/90'}`}>{m.team2.name}</span>
                                {winner2 && <span className={`${dt.neonText} text-xs`}>◂</span>}
                              </div>

                              {/* MVP indicator */}
                              {m.mvpPlayer && (
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <Crown className="w-3 h-3 text-yellow-500" />
                                  <span className="text-[9px] text-yellow-500 font-semibold hidden sm:inline">{m.mvpPlayer.gamertag}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
