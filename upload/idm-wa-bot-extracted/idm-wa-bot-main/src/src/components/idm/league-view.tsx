'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Crown, Shield, Users, Flame,
  Swords, Star, Zap, ChevronRight, TrendingUp, BarChart3, Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TierBadge } from './tier-badge';
import { ClubProfile } from './club-profile';
import { useState } from 'react';
import { container, item } from '@/lib/animations';

interface ClubMember {
  id: string; gamertag: string; division: string; tier: string; points: number; role: string;
}

interface LeagueClub {
  id: string; name: string; wins: number; losses: number;
  points: number; gameDiff: number; memberCount: number;
  members: ClubMember[];
}

interface LeagueMatchData {
  id: string; week: number; score1: number | null; score2: number | null;
  status: string; format: string;
  club1: { id: string; name: string };
  club2: { id: string; name: string };
}

interface PlayoffData {
  id: string; round: string; score1: number | null; score2: number | null;
  status: string; format: string;
  club1: { id: string; name: string };
  club2: { id: string; name: string };
}

interface LeagueData {
  hasData: boolean;
  season?: { id: string; name: string };
  clubs: LeagueClub[];
  leagueMatches: LeagueMatchData[];
  playoffMatches: PlayoffData[];
  topPlayers: { id: string; gamertag: string; division: string; tier: string; points: number; totalWins: number; totalMvp: number; streak: number }[];
  mvpCandidates: { id: string; gamertag: string; tier: string; totalMvp: number; points: number; totalWins: number; streak: number }[];
  stats: {
    totalClubs: number; totalMatches: number; completedMatches: number;
    liveMatches: number; totalWeeks: number; playedWeeks: number;
  };
  teamFormat: {
    size: number; main: number; substitute: number; rule: string;
  };
}

export function LeagueView() {
  const [selectedClub, setSelectedClub] = useState<LeagueClub | null>(null);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const { data, isLoading } = useQuery<LeagueData>({
    queryKey: ['league'],
    queryFn: async () => {
      const res = await fetch('/api/league');
      return res.json();
    },
  });

  if (isLoading || !data?.hasData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { clubs, leagueMatches, playoffMatches, topPlayers, mvpCandidates, stats, teamFormat } = data;
  const weeks = [...new Set(leagueMatches.map(m => m.week))].sort((a, b) => a - b);

  return (
    <>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-5xl mx-auto">

      {/* ═══ HERO BANNER — Liga Akbar ═══ */}
      <motion.div variants={item}>
        <div className="relative rounded-2xl overflow-hidden border border-[#d4a853]/20" style={{ background: 'linear-gradient(135deg, #0a0806 0%, #1a1208 30%, #0d0a06 60%, #120a14 100%)' }}>
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#d4a853 1px, transparent 1px), linear-gradient(90deg, #d4a853 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {/* Gold radial glow */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.1) 0%, transparent 50%)' }} />

          <div className="relative p-5 lg:p-6 z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Logo */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#d4a853]/20 to-[#d4a853]/5 border border-[#d4a853]/20 flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 30px rgba(212,168,83,0.1)' }}>
                <Trophy className="w-7 h-7 text-[#d4a853]" />
              </div>
              {/* Title */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#d4a853]/10 text-[#d4a853] text-[9px] border-[#d4a853]/20 font-bold uppercase tracking-wider">Liga Akbar</Badge>
                  {data.season && <Badge className="bg-muted/50 text-muted-foreground text-[9px] border-0">{data.season.name}</Badge>}
                </div>
                <h2 className="text-xl lg:text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #d4a853, #f5d78e, #d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  IDM League
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Club bertanding dengan tim mix — gabungan peserta male & female</p>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-[#d4a853]">{stats.totalClubs}</p>
                  <p className="text-[9px] text-muted-foreground">Clubs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#d4a853]">{stats.completedMatches}</p>
                  <p className="text-[9px] text-muted-foreground">Dimainkan</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#d4a853]">{weeks.length}/{stats.totalWeeks}</p>
                  <p className="text-[9px] text-muted-foreground">Weeks</p>
                </div>
              </div>
            </div>

            {/* Season Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                <span>Progress Season</span>
                <span className="text-[#d4a853] font-semibold">{Math.round((stats.playedWeeks / stats.totalWeeks) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(stats.playedWeeks / stats.totalWeeks) * 100}%`, background: 'linear-gradient(90deg, #d4a853, #f5d78e, #d4a853)' }} />
              </div>
            </div>

            {/* Team Format Info */}
            <div className="mt-4 p-3 rounded-xl border border-[#d4a853]/10 bg-[#d4a853]/5">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#d4a853] shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#d4a853]">Format Tim Liga</span>
                    <Badge className="bg-[#d4a853]/10 text-[#d4a853] text-[9px] border-0">{teamFormat.size} Pemain</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">{teamFormat.main} pemain inti</span> + <span className="text-foreground font-medium">{teamFormat.substitute} cadangan</span> per tim.
                    Wajib minimal <span className="text-[#d4a853] font-semibold">1 peserta female</span> — tim tidak boleh semua male atau semua female, harus mix.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ LIVE INDICATOR ═══ */}
      {stats.liveMatches > 0 && (
        <motion.div variants={item}>
          <div className="relative rounded-xl overflow-hidden border border-red-500/20 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5 p-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-500">{stats.liveMatches} Match Sedang Berlangsung!</span>
              <ChevronRight className="w-4 h-4 text-red-500 ml-auto" />
            </div>
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-muted/50 h-auto p-1">
          <TabsTrigger value="standings" className="text-[11px] py-2 tab-premium">Klasemen</TabsTrigger>
          <TabsTrigger value="schedule" className="text-[11px] py-2 tab-premium">Jadwal</TabsTrigger>
          <TabsTrigger value="stats" className="text-[11px] py-2 tab-premium">Statistik</TabsTrigger>
          <TabsTrigger value="playoff" className="text-[11px] py-2 tab-premium">Playoff</TabsTrigger>
        </TabsList>

        {/* ═══ STANDINGS ═══ */}
        <TabsContent value="standings" className="mt-4">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
            {clubs.map((club, idx) => {
              const isChampion = idx === 0;
              const isTop4 = idx < 4;
              const isExpanded = expandedClub === club.id;
              const maleCount = club.members.filter(m => m.division === 'male').length;
              const femaleCount = club.members.filter(m => m.division === 'female').length;
              const wr = club.wins + club.losses > 0 ? Math.round((club.wins / (club.wins + club.losses)) * 100) : 0;

              return (
                <motion.div key={club.id} variants={item}>
                  <div
                    className={`rounded-xl transition-all cursor-pointer ${
                      isChampion ? 'border border-[#d4a853]/20' : isTop4 ? 'border border-border/30' : 'border border-border/20'
                    }`}
                    style={isChampion ? { background: 'linear-gradient(135deg, rgba(212,168,83,0.06) 0%, rgba(20,17,10,0.6) 50%, rgba(212,168,83,0.04) 100%)' } : { background: 'rgba(20,17,10,0.4)' }}
                    onClick={() => setExpandedClub(isExpanded ? null : club.id)}
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-3 p-3">
                      {/* Rank */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === 0 ? 'bg-[#d4a853]/20 text-[#d4a853]' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-amber-600/20 text-amber-600' :
                        isTop4 ? 'bg-[#d4a853]/10 text-[#d4a853]/60' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                      </div>

                      {/* Club Shield */}
                      <div className="w-10 h-10 rounded-xl bg-[#d4a853]/10 flex items-center justify-center shrink-0">
                        <Shield className={`w-5 h-5 ${isChampion ? 'text-[#d4a853]' : 'text-[#d4a853]/60'}`} />
                      </div>

                      {/* Club Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isChampion ? 'text-[#d4a853]' : ''}`}>{club.name}</p>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-green-500 font-medium">{club.wins}W</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-red-500 font-medium">{club.losses}L</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">SG: <span className={club.gameDiff > 0 ? 'text-green-500' : club.gameDiff < 0 ? 'text-red-500' : ''}>{club.gameDiff > 0 ? '+' : ''}{club.gameDiff}</span></span>
                          <span className="text-muted-foreground">•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />{club.memberCount}
                          </span>
                          {femaleCount > 0 && (
                            <span className="text-purple-400 font-medium">♀{femaleCount}</span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0 pl-3 border-l border-border/50">
                        <p className={`text-xl font-bold ${isChampion ? 'text-[#d4a853]' : 'text-foreground'}`}>{club.points}</p>
                        <p className="text-[9px] text-muted-foreground">PTS</p>
                      </div>

                      {/* Expand arrow */}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Expanded: Team Roster */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-border/30"
                      >
                        <div className="px-4 py-3 space-y-2">
                          {/* Roster header */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Susunan Tim</span>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-cyan-500/10 text-cyan-400 text-[9px] border-0">♂ {maleCount}</Badge>
                              <Badge className="bg-purple-500/10 text-purple-400 text-[9px] border-0">♀ {femaleCount}</Badge>
                            </div>
                          </div>

                          {/* Main players */}
                          {club.members.length > 0 ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Flame className="w-3 h-3 text-[#d4a853]" />
                                <span className="text-[10px] font-semibold text-[#d4a853]">Pemain Inti ({Math.min(3, club.members.length)})</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {club.members.slice(0, 3).map(m => (
                                  <div key={m.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] border ${
                                    m.division === 'male' ? 'bg-cyan-500/5 border-cyan-500/10' : 'bg-purple-500/5 border-purple-500/10'
                                  }`}>
                                    <span className={`font-medium ${m.division === 'male' ? 'text-cyan-400' : 'text-purple-400'}`}>
                                      {m.division === 'male' ? '♂' : '♀'}
                                    </span>
                                    <span className="font-medium">{m.gamertag}</span>
                                    <TierBadge tier={m.tier} />
                                  </div>
                                ))}
                              </div>

                              {/* Substitutes */}
                              {club.members.length > 3 && (
                                <>
                                  <div className="flex items-center gap-1.5 mb-1 mt-2">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-semibold text-muted-foreground">Cadangan ({club.members.length - 3})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {club.members.slice(3).map(m => (
                                      <div key={m.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] border opacity-70 ${
                                        m.division === 'male' ? 'bg-cyan-500/5 border-cyan-500/10' : 'bg-purple-500/5 border-purple-500/10'
                                      }`}>
                                        <span className={`font-medium ${m.division === 'male' ? 'text-cyan-400' : 'text-purple-400'}`}>
                                          {m.division === 'male' ? '♂' : '♀'}
                                        </span>
                                        <span className="font-medium">{m.gamertag}</span>
                                        <TierBadge tier={m.tier} />
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}

                              {/* Mix validation badge */}
                              {femaleCount > 0 ? (
                                <Badge className="bg-green-500/10 text-green-500 text-[9px] border-0 mt-1">✓ Tim mix valid</Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-500 text-[9px] border-0 mt-1">⚠ Minimal 1 female diperlukan</Badge>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-3">Belum ada anggota terdaftar</p>
                          )}

                          {/* Click to see full profile */}
                          <button
                            className="w-full text-center text-[10px] text-[#d4a853] font-semibold py-1.5 rounded-lg bg-[#d4a853]/5 border border-[#d4a853]/10 hover:bg-[#d4a853]/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedClub(club); }}
                          >
                            Lihat Profil Club →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {clubs.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada club terdaftar di liga</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ═══ SCHEDULE ═══ */}
        <TabsContent value="schedule" className="mt-4">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {weeks.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada jadwal match</p>
              </div>
            )}
            {weeks.map(week => {
              const weekMatches = leagueMatches.filter(m => m.week === week);
              const completed = weekMatches.filter(m => m.status === 'completed').length;
              return (
                <motion.div key={week} variants={item}>
                  <Card className="overflow-hidden" style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                    <CardContent className="p-0">
                      {/* Week header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30" style={{ background: 'rgba(212,168,83,0.03)' }}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#d4a853]" />
                          <h3 className="text-sm font-semibold">Week {week}</h3>
                        </div>
                        <Badge className={`text-[10px] border-0 ${
                          completed === weekMatches.length ? 'bg-green-500/10 text-green-500' :
                          completed > 0 ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {completed === weekMatches.length ? '✅ Selesai' : `${completed}/${weekMatches.length} Dimainkan`}
                        </Badge>
                      </div>

                      {/* Matches */}
                      <div className="p-3 space-y-2">
                        {weekMatches.map(m => {
                          const isLive = m.status === 'live';
                          return (
                            <div key={m.id} className={`p-3 rounded-xl transition-all border ${
                              isLive ? 'border-red-500/20 bg-red-500/5' :
                              m.status === 'completed' ? 'border-border/20 bg-muted/30' :
                              'border-[#d4a853]/10 bg-[#d4a853]/5'
                            }`}>
                              <div className="flex items-center justify-between">
                                {/* Club 1 */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    m.status === 'completed' && m.score1! > m.score2! ? 'bg-[#d4a853]/15 text-[#d4a853]' : 'bg-[#d4a853]/10 text-[#d4a853]/60'
                                  }`}>
                                    {m.club1.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className={`text-sm font-medium truncate ${
                                    m.status === 'completed' && m.score1! > m.score2! ? 'text-[#d4a853] font-bold' : ''
                                  }`}>{m.club1.name}</span>
                                </div>

                                {/* Score / VS */}
                                <div className="flex items-center gap-2 mx-3 shrink-0">
                                  {isLive ? (
                                    <span className="text-[10px] font-bold text-red-500 live-dot px-2 py-1 rounded bg-red-500/10">LIVE</span>
                                  ) : m.status === 'completed' ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/50">
                                      <span className={`text-base font-bold ${m.score1! > m.score2! ? 'text-[#d4a853]' : 'text-muted-foreground'}`}>{m.score1}</span>
                                      <span className="text-[10px] text-muted-foreground">-</span>
                                      <span className={`text-base font-bold ${m.score2! > m.score1! ? 'text-[#d4a853]' : 'text-muted-foreground'}`}>{m.score2}</span>
                                    </div>
                                  ) : (
                                    <Badge className="bg-[#d4a853]/10 text-[#d4a853] text-[10px] border-0">VS</Badge>
                                  )}
                                </div>

                                {/* Club 2 */}
                                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                  <span className={`text-sm font-medium truncate ${
                                    m.status === 'completed' && m.score2! > m.score1! ? 'text-[#d4a853] font-bold' : ''
                                  }`}>{m.club2.name}</span>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    m.status === 'completed' && m.score2! > m.score1! ? 'bg-[#d4a853]/15 text-[#d4a853]' : 'bg-[#d4a853]/10 text-[#d4a853]/60'
                                  }`}>
                                    {m.club2.name.slice(0, 2).toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              {/* Format badge */}
                              <div className="flex items-center justify-center mt-2">
                                <Badge className={`text-[9px] border-0 ${
                                  m.format === 'BO5' ? 'bg-[#d4a853]/10 text-[#d4a853]' : 'bg-muted text-muted-foreground'
                                }`}>{m.format}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* ═══ STATISTICS ═══ */}
        <TabsContent value="stats" className="mt-4">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {/* MVP Race */}
            <motion.div variants={item}>
              <Card style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                      <Crown className="w-3.5 h-3.5 text-[#d4a853]" />
                    </div>
                    <h3 className="text-sm font-semibold">MVP Race</h3>
                    <Badge className="bg-[#d4a853]/10 text-[#d4a853] text-[9px] border-0 ml-auto">LIGA AKBAR</Badge>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {mvpCandidates.map((p, idx) => (
                      <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${
                        idx === 0 ? 'bg-[#d4a853]/5 border border-[#d4a853]/10' : 'bg-muted/30 border border-border/20'
                      }`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-[#d4a853]/20 text-[#d4a853]' :
                          idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                          idx === 2 ? 'bg-amber-600/20 text-amber-600' :
                          'bg-muted text-muted-foreground'
                        }`}>{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-[#d4a853]/10 flex items-center justify-center text-[10px] font-bold text-[#d4a853] shrink-0">
                          {p.gamertag.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{p.gamertag}</span>
                            <TierBadge tier={p.tier} />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-[#d4a853]" />{p.totalMvp} MVP</span>
                            <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{p.streak} streak</span>
                            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{p.totalWins}W</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#d4a853]">{p.points} pts</span>
                      </div>
                    ))}
                    {mvpCandidates.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">Belum ada MVP</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Performers */}
            <motion.div variants={item}>
              <Card style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-[#d4a853]" />
                    </div>
                    <h3 className="text-sm font-semibold">Top Performers</h3>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {topPlayers.slice(0, 10).map((p, idx) => (
                      <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${
                        idx === 0 ? 'bg-[#d4a853]/5 border border-[#d4a853]/10' : 'bg-muted/20'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-[#d4a853]/20 text-[#d4a853]' : 'bg-muted text-muted-foreground'
                        }`}>{idx + 1}</span>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          p.division === 'male' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {p.gamertag.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{p.gamertag}</span>
                            <TierBadge tier={p.tier} />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#d4a853]">{p.points} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Club Power Rankings */}
            <motion.div variants={item}>
              <Card style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.1)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-[#d4a853]" />
                    </div>
                    <h3 className="text-sm font-semibold">Peringkat Kekuatan Club</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {clubs.slice(0, 4).map((club, idx) => {
                      const wr = club.wins + club.losses > 0 ? Math.round((club.wins / (club.wins + club.losses)) * 100) : 0;
                      return (
                        <div key={club.id} className={`p-3 rounded-xl cursor-pointer interactive-scale border ${
                          idx === 0 ? 'border-[#d4a853]/20 bg-[#d4a853]/5' : 'border-border/20 bg-muted/20'
                        }`} onClick={() => setSelectedClub(club)}>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className={`w-4 h-4 ${idx === 0 ? 'text-[#d4a853]' : 'text-[#d4a853]/60'}`} />
                            <span className={`text-xs font-semibold truncate ${idx === 0 ? 'text-[#d4a853]' : ''}`}>{club.name}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center">
                            <div>
                              <p className="text-sm font-bold text-green-500">{club.wins}</p>
                              <p className="text-[8px] text-muted-foreground">WIN</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#d4a853]">{wr}%</p>
                              <p className="text-[8px] text-muted-foreground">WR</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold">{club.gameDiff > 0 ? `+${club.gameDiff}` : club.gameDiff}</p>
                              <p className="text-[8px] text-muted-foreground">SG</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ═══ PLAYOFF ═══ */}
        <TabsContent value="playoff" className="mt-4">
          <motion.div variants={container} initial="hidden" animate="show">
            <Card className="overflow-hidden" style={{ background: 'rgba(20,17,10,0.6)', borderColor: 'rgba(212,168,83,0.15)' }}>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border/30" style={{ background: 'rgba(212,168,83,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[#d4a853]" />
                    <h3 className="text-sm font-semibold">Playoff Bracket</h3>
                    <Badge className="bg-[#d4a853]/10 text-[#d4a853] text-[10px] border-0 ml-auto">🏆 BO5 Format</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-center gap-4 lg:gap-8 overflow-x-auto py-4">
                    {/* Semifinals */}
                    <div className="space-y-6">
                      <p className="text-[10px] text-muted-foreground text-center font-semibold mb-2 uppercase tracking-wider">Semifinal</p>
                      {playoffMatches.filter(m => m.round.startsWith('semifinal')).map(m => (
                        <div key={m.id} className="p-3 rounded-xl bg-muted/50 min-w-[160px] border border-border/30 interactive-scale">
                          <div className="space-y-2">
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && m.score1! > m.score2! ? 'font-bold text-[#d4a853]' : ''}`}>
                              <span className="truncate">{m.club1.name}</span>
                              <span className="font-mono shrink-0 ml-2">{m.score1 ?? '-'}</span>
                            </div>
                            <div className="h-px bg-border" />
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && m.score2! > m.score1! ? 'font-bold text-[#d4a853]' : ''}`}>
                              <span className="truncate">{m.club2.name}</span>
                              <span className="font-mono shrink-0 ml-2">{m.score2 ?? '-'}</span>
                            </div>
                          </div>
                          <Badge className="mt-2 text-[9px] border-0 bg-[#d4a853]/10 text-[#d4a853]">BO5</Badge>
                        </div>
                      ))}
                      {playoffMatches.filter(m => m.round.startsWith('semifinal')).length === 0 && (
                        <div className="p-3 rounded-xl bg-muted/30 min-w-[160px] text-center border border-dashed border-[#d4a853]/20">
                          <Swords className="w-5 h-5 text-[#d4a853]/30 mx-auto mb-1" />
                          <p className="text-[10px] text-muted-foreground">Menunggu</p>
                        </div>
                      )}
                    </div>

                    {/* Connector */}
                    <div className="hidden lg:flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="w-8 h-px bg-[#d4a853]/30" />
                      <Trophy className="w-4 h-4 text-[#d4a853]" />
                      <div className="w-8 h-px bg-[#d4a853]/30" />
                    </div>

                    {/* Grand Final */}
                    <div>
                      <p className="text-[10px] text-muted-foreground text-center font-semibold mb-2 uppercase tracking-wider">Grand Final</p>
                      {playoffMatches.filter(m => m.round === 'grand_final').map(m => (
                        <div key={m.id} className="p-4 rounded-xl min-w-[180px] border border-[#d4a853]/20" style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.08) 0%, rgba(20,17,10,0.6) 50%, rgba(212,168,83,0.05) 100%)' }}>
                          <div className="space-y-2">
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && m.score1! > m.score2! ? 'font-bold text-[#d4a853]' : ''}`}>
                              <span className="truncate">{m.club1.name}</span>
                              <span className="font-mono shrink-0 ml-2">{m.score1 ?? '-'}</span>
                            </div>
                            <div className="h-px bg-[#d4a853]/20" />
                            <div className={`flex items-center justify-between text-xs ${m.status === 'completed' && m.score2! > m.score1! ? 'font-bold text-[#d4a853]' : ''}`}>
                              <span className="truncate">{m.club2.name}</span>
                              <span className="font-mono shrink-0 ml-2">{m.score2 ?? '-'}</span>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <Badge className="text-[9px] border-0 bg-[#d4a853]/15 text-[#d4a853]" style={{ boxShadow: '0 0 12px rgba(212,168,83,0.15)' }}>🏆 BO5 Grand Final</Badge>
                          </div>
                        </div>
                      ))}
                      {playoffMatches.filter(m => m.round === 'grand_final').length === 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 min-w-[180px] text-center border border-dashed border-[#d4a853]/20">
                          <Crown className="w-6 h-6 text-[#d4a853]/30 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Segera Hadir</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>

    {/* Club Profile Modal */}
    {selectedClub && (
      <ClubProfile
        club={{
          ...selectedClub,
          division: 'league', // League is unified mixed competition
          rank: clubs.findIndex(c => c.id === selectedClub.id) + 1,
          members: selectedClub.members.map(m => ({
            id: m.id,
            name: m.gamertag,
            gamertag: m.gamertag,
            tier: m.tier,
            points: m.points,
          })),
        }}
        onClose={() => setSelectedClub(null)}
        rank={clubs.findIndex(c => c.id === selectedClub.id) + 1}
      />
    )}
    </>
  );
}
