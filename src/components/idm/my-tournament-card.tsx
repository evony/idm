'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Swords, Trophy, Crown, Clock, MapPin, Heart, Users,
  ChevronDown, ChevronUp, Zap, CheckCircle2, XCircle, Play,
  Music, Calendar, Award, Shield, Target, Radio, Flame,
  Info, Star, Gamepad2, ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';

/* animation variants */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ─── Types ─── */
interface Teammate {
  id: string; name: string; gamertag: string; tier: string; avatar?: string | null; isMe: boolean;
}
interface OpponentPlayer {
  id: string; name: string; gamertag: string; tier: string;
}
interface MatchInfo {
  id: string; round: number; matchNumber: number | null; bracket: string | null;
  status: string; format: string | null;
  opponent: { id?: string; name: string; players: OpponentPlayer[] };
  myScore: number | null; opponentScore: number | null;
  won: boolean; lost: boolean; isDraw: boolean;
  mvpPlayer: { id: string; name: string; gamertag: string } | null;
  scheduledAt: string | null;
}

/* ─── Overview Types ─── */
interface OverviewMatch {
  id: string; round: number; matchNumber: number; bracket: string; format: string;
  team1: { id?: string; name: string }; team2: { id?: string; name: string };
  score1?: number | null; score2?: number | null; winner?: string | null;
  mvpPlayer?: { id: string; gamertag: string } | null; scheduledAt?: string | null;
}
interface OverviewTeam {
  id: string; name: string; power: number; rank: number | null; isWinner: boolean;
  players: { id: string; gamertag: string; tier: string; points: number }[];
}
interface OverviewPlayer {
  id: string; name: string; gamertag: string; tier: string; avatar?: string | null; points: number;
}

/* ─── Status Step Indicator ─── */
function TournamentProgress({ status }: { status: string }) {
  const dt = useDivisionTheme();
  const steps = [
    { key: 'setup', label: 'Setup' },
    { key: 'registration', label: 'Daftar' },
    { key: 'approval', label: 'Approval' },
    { key: 'team_generation', label: 'Tim' },
    { key: 'bracket_generation', label: 'Bracket' },
    { key: 'main_event', label: 'Main' },
    { key: 'finalization', label: 'Final' },
    { key: 'completed', label: 'Selesai' },
  ];
  const currentIdx = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-1 scrollbar-none">
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold whitespace-nowrap ${
              isDone ? `${dt.bgSubtle} ${dt.neonText}` :
              isCurrent ? `${dt.bg} ${dt.text} ${dt.neonPulse}` :
              'bg-muted/30 text-muted-foreground/50'
            }`}>
              {isDone ? <CheckCircle2 className="w-2.5 h-2.5" /> :
               isCurrent ? <Play className="w-2.5 h-2.5" /> :
               <div className="w-2.5 h-2.5 rounded-full border border-current opacity-30" />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-2 h-0.5 ${isDone ? dt.neonText : 'bg-muted/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Round Label Helper ─── */
function getRoundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Grand Final';
  if (fromEnd === 1) return 'Semi Final';
  if (fromEnd === 2) return 'Quarter Final';
  return `Ronde ${round}`;
}

/* ─── Status Badge Helper ─── */
function StatusBadge({ status, division }: { status: string; division: string }) {
  const config: Record<string, { label: string; class: string; icon: typeof Info }> = {
    setup: { label: 'Setup', class: 'bg-muted/30 text-muted-foreground', icon: Info },
    registration: { label: 'Pendaftaran', class: 'bg-blue-500/15 text-blue-400', icon: Users },
    approval: { label: 'Approval', class: 'bg-yellow-500/15 text-yellow-400', icon: Shield },
    team_generation: { label: 'Tim Dibentuk', class: 'bg-orange-500/15 text-orange-400', icon: Users },
    bracket_generation: { label: 'Bracket', class: 'bg-purple-500/15 text-purple-400', icon: Swords },
    main_event: { label: 'Main Event', class: division === 'male' ? 'bg-idm-male/15 text-idm-male' : 'bg-idm-female/15 text-idm-female', icon: Radio },
    finalization: { label: 'Finalisasi', class: 'bg-amber-500/15 text-amber-400', icon: Trophy },
    completed: { label: 'Selesai', class: 'bg-green-500/15 text-green-400', icon: CheckCircle2 },
  };
  const c = config[status] || config.setup;
  const Icon = c.icon;
  return (
    <Badge className={`${c.class} border-0 text-[9px] gap-0.5`}>
      <Icon className="w-2.5 h-2.5" />
      {c.label}
    </Badge>
  );
}

/* ─── Main Component ─── */
export function MyTournamentCard() {
  const { division } = useAppStore();
  const dt = useDivisionTheme();
  const [searchName, setSearchName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [showAllMatches, setShowAllMatches] = useState(false);

  /* ─── Overview query — always active ─── */
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['tournament-overview', division],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/overview?division=${division}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  /* ─── My-status query — only when searching ─── */
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-tournament-status', submittedName, division],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/my-status?name=${encodeURIComponent(submittedName)}&division=${division}&gamertag=${encodeURIComponent(submittedName)}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      return res.json();
    },
    enabled: !!submittedName,
    refetchInterval: 30000,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = () => {
    if (!searchName.trim()) return;
    setSubmittedName(searchName.trim());
    setShowAllMatches(false);
  };

  const handleReset = () => {
    setSubmittedName('');
    setSearchName('');
    setShowAllMatches(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  /* ─── RENDER: Search input bar (always visible at top) ─── */
  const searchBar = (
    <div className={`rounded-xl border ${division === 'male' ? 'border-idm-male/20 bg-idm-male/5' : 'border-idm-female/20 bg-idm-female/5'} p-4 relative z-10`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dt.iconBg}`}>
          <Target className={`w-5 h-5 ${dt.neonText}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gradient-fury">Cari Turnamen Kamu</h3>
          <p className="text-[10px] text-muted-foreground">Ketik nama atau nickname lalu tekan Cari</p>
        </div>
        {submittedName && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] shrink-0 gap-1" onClick={handleReset}>
            <ArrowRight className="w-3 h-3 rotate-180" /> Kembali
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Contoh: montiel, Afroki..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-11 text-sm bg-background border-2 border-idm-gold/30 focus:border-idm-gold placeholder:text-muted-foreground/60 rounded-lg"
            maxLength={30}
            autoComplete="off"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!searchName.trim()}
          className={`h-11 px-4 text-sm font-bold gap-1.5 shrink-0 ${division === 'male' ? 'bg-idm-male hover:bg-idm-male/90 text-white' : 'bg-idm-female hover:bg-idm-female/90 text-white'}`}
        >
          <Search className="w-4 h-4" />
          Cari
        </Button>
      </div>
    </div>
  );

  /* ─── RENDER: Player-specific results (when search is active) ─── */
  if (submittedName) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {searchBar}
          <Card className={`${dt.casinoCard}`}>
            <CardContent className="p-5 relative z-10 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block mb-3">
                <Swords className={`w-8 h-8 ${dt.neonText}`} />
              </motion.div>
              <p className="text-sm text-muted-foreground">Mencari data turnamen...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-4">
          {searchBar}
          <Card className={`${dt.casinoCard}`}>
            <CardContent className="p-5 relative z-10">
              <div className="text-center py-4">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-red-400 mb-1">Gagal Memuat Data</h3>
                <p className="text-xs text-muted-foreground mb-3">Terjadi kesalahan saat mencari. Coba lagi.</p>
                <Button size="sm" variant="outline" onClick={handleReset}>Kembali</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!data?.found) {
      return (
        <div className="space-y-4">
          {searchBar}
          <Card className={`${dt.casinoCard}`}>
            <CardContent className="p-5 relative z-10">
              <div className="text-center py-4">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-red-400 mb-1">Tidak Ditemukan</h3>
                <p className="text-xs text-muted-foreground mb-1">{data?.message || 'Nama tidak ditemukan dalam database'}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">Pastikan nama atau nickname sudah benar. Coba ketik nama lain.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!data.hasActiveTournament) {
      return (
        <div className="space-y-4">
          {searchBar}
          <Card className={`${dt.casinoCard}`}>
            <div className={dt.casinoBar} />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dt.iconBg}`}>
                  <Users className={`w-5 h-5 ${dt.neonText}`} />
                </div>
                <div>
                  <p className="text-sm font-bold">{data.player.gamertag}</p>
                  <p className="text-[10px] text-muted-foreground">{data.player.name} • {data.player.city}</p>
                </div>
              </div>
              <div className="text-center py-4">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-bold mb-1">Belum Ada Turnamen Aktif</h3>
                <p className="text-xs text-muted-foreground">{data.message}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!data.myTeam) {
      return (
        <div className="space-y-4">
          {searchBar}
          <Card className={`${dt.casinoCard}`}>
            <div className={dt.casinoBar} />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dt.iconBg}`}>
                  <Users className={`w-5 h-5 ${dt.neonText}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{data.player.gamertag}</p>
                  <p className="text-[10px] text-muted-foreground">{data.player.name} • {data.player.city}</p>
                </div>
              </div>
              <div className={`p-3 sm:p-4 rounded-lg ${dt.bgSubtle} border ${dt.borderSubtle} mb-4`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{data.tournament.name}</span>
                  <Badge className={`${dt.casinoBadge} text-[9px]`}>Week {data.tournament.weekNumber}</Badge>
                </div>
                <TournamentProgress status={data.tournament.status} />
              </div>
              <div className="text-center py-3">
                <Shield className={`w-8 h-8 ${dt.neonText} mx-auto mb-2 opacity-50`} />
                <h3 className="text-sm font-bold mb-1">
                  {data.tournament.isCompleted ? 'Turnamen Sudah Selesai' :
                   data.tournament.status === 'registration' ? 'Pendaftaran Belum Dibuka' :
                   data.tournament.status === 'approval' ? 'Menunggu Persetujuan' :
                   'Belum Masuk Tim'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {data.tournament.isCompleted ? 'Turnamen ini sudah selesai. Cek hasilnya di tab League.' :
                   data.tournament.status === 'registration' ? 'Tournament sedang dalam fase pendaftaran.' :
                   data.tournament.status === 'approval' ? (data.participationStatus === 'registered' ? 'Pendaftaran kamu sedang menunggu persetujuan admin.' : data.participationStatus === 'approved' ? 'Kamu sudah disetujui! Tim akan segera dibentuk.' : data.message) :
                   data.message}
                </p>
                {data.prizeInfo && (
                  <div className={`mt-3 p-3 sm:p-4 rounded-lg ${dt.bgSubtle} border ${dt.borderSubtle} text-left`}>
                    <p className="text-[10px] font-semibold mb-1.5">Hasil Turnamen</p>
                    {data.prizeInfo.isWinner && <p className="text-[10px] text-yellow-500 font-bold">Juara!</p>}
                    {data.prizeInfo.teamRank && <p className="text-[10px] text-muted-foreground">Peringkat: #{data.prizeInfo.teamRank}</p>}
                    {data.prizeInfo.pointsEarned > 0 && <p className="text-[10px] text-muted-foreground">Poin: +{data.prizeInfo.pointsEarned}</p>}
                    {data.prizeInfo.isMvp && <p className="text-[10px] text-yellow-500 font-medium">MVP Turnamen</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    /* ─── FULL DASHBOARD — Player Has a Team ─── */
    const tournament = data.tournament;
    const myTeam = data.myTeam;
    const myMatches = data.myMatches || [];
    const liveMatch = data.liveMatch;
    const nextMatch = data.nextMatch;
    const nextOpponent = data.nextOpponent;
    const totalRounds = Math.max(...myMatches.map((m: MatchInfo) => m.round), 1);

    return (
      <div className="space-y-4">
        {searchBar}
        {/* Player + Team Header — full width */}
        <Card className={`${dt.casinoCard} ${dt.cornerAccent} overflow-hidden`}>
          <div className={dt.casinoBar} />
          <CardContent className="p-0 relative z-10">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dt.iconBg}`}>
                  <Users className={`w-5 h-5 ${dt.neonText}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{data.player.gamertag}</p>
                  <p className="text-[10px] text-muted-foreground">{data.player.name} • {data.player.city}</p>
                </div>
              </div>
              <div className={`p-3 sm:p-4 rounded-xl border ${data.isChampion ? 'border-yellow-500/40 bg-yellow-500/5' : data.isEliminated ? 'border-red-500/20 bg-red-500/5' : `${dt.borderSubtle} ${dt.bgSubtle}`}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {data.isChampion && <Crown className="w-4 h-4 text-yellow-500" />}
                    <span className={`text-sm font-bold ${data.isChampion ? 'text-yellow-500' : data.isEliminated ? 'text-red-400' : dt.neonText}`}>
                      {myTeam.name}
                    </span>
                  </div>
                  {data.isChampion ? (
                    <Badge className="bg-yellow-500/15 text-yellow-500 border-0 text-[9px]"><Crown className="w-3 h-3 mr-0.5" /> Juara!</Badge>
                  ) : data.isEliminated ? (
                    <Badge className="bg-red-500/15 text-red-400 border-0 text-[9px]"><XCircle className="w-3 h-3 mr-0.5" /> Tereliminasi</Badge>
                  ) : (
                    <Badge className="bg-green-500/15 text-green-400 border-0 text-[9px]"><Play className="w-3 h-3 mr-0.5" /> Masih Bermain</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {myTeam.teammates.map((t: Teammate) => (
                    <div key={t.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] ${
                      t.isMe
                        ? `bg-gradient-to-r ${division === 'male' ? 'from-idm-male/20 to-idm-male/5' : 'from-idm-female/20 to-idm-female/5'} border ${division === 'male' ? 'border-idm-male/30' : 'border-idm-female/30'}`
                        : `${dt.bgSubtle}`
                    }`}>
                      <span className={t.isMe ? 'font-bold' : ''}>{t.gamertag}</span>
                      {t.isMe && <span className="text-[8px] opacity-60">(kamu)</span>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground">
                    Rekor: <span className="text-green-400 font-bold">{data.matchRecord.wins}W</span>
                    <span className="mx-0.5">-</span>
                    <span className="text-red-400 font-bold">{data.matchRecord.losses}L</span>
                    {data.matchRecord.draws > 0 && <><span className="mx-0.5">-</span><span className="text-yellow-400 font-bold">{data.matchRecord.draws}D</span></>}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Kekuatan: <span className="font-bold">{myTeam.power}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className={`px-4 sm:px-5 py-2.5 border-t ${dt.borderSubtle} bg-muted/20`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground">{tournament.name} • Week {tournament.weekNumber}</span>
                <Badge className={`${dt.casinoBadge} text-[9px]`}>{tournament.format?.replace('_', ' ').toUpperCase()}</Badge>
              </div>
              <TournamentProgress status={tournament.status} />
            </div>
          </CardContent>
        </Card>

        {/* ── Status Cards + Match History in responsive grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column: Live / Next / Status cards */}
          <div className="space-y-4">
            {liveMatch && (
              <Card className="border-red-500/40 bg-red-500/5 shadow-lg shadow-red-500/10">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-red-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-red-500">LIVE SEKARANG!</h3>
                      <p className="text-[10px] text-muted-foreground">{getRoundLabel(liveMatch.round, totalRounds)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-xs font-bold">{myTeam.name}</span>
                    <span className="text-sm font-bold tabular-nums text-red-400">
                      {liveMatch.myScore ?? 0} - {liveMatch.opponentScore ?? 0}
                    </span>
                    <span className="text-xs font-bold">{liveMatch.opponent.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {nextMatch && !data.isEliminated && !liveMatch && (
              <Card className={`${dt.casinoCard} border-green-500/20`}>
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dt.iconBg}`}>
                      <Swords className={`w-4 h-4 ${dt.neonText}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Lawan Selanjutnya</h3>
                      <p className="text-[10px] text-muted-foreground">{getRoundLabel(nextMatch.round, totalRounds)} • {nextMatch.format || 'BO3'}</p>
                    </div>
                  </div>
                  <div className={`p-3 sm:p-4 rounded-xl border ${dt.borderSubtle}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">{nextOpponent?.name || 'TBD'}</span>
                      <Badge className={`${dt.casinoBadge} text-[9px]`}>Lawan</Badge>
                    </div>
                    {nextOpponent?.players?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {nextOpponent.players.map((p: OpponentPlayer) => (
                          <div key={p.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/30 text-[10px]">
                            
                            <span>{p.gamertag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.isEliminated && !data.isChampion && (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-red-400">Tim Kamu Tereliminasi</h3>
                      <p className="text-[10px] text-muted-foreground">{data.eliminationInfo || 'Tim kamu telah gugur dari bracket'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.isChampion && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4 relative z-10 text-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-block mb-2">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                  </motion.div>
                  <h3 className="text-base font-bold text-yellow-500 mb-1">Selamat, Juara!</h3>
                  <p className="text-xs text-muted-foreground">{myTeam.name} memenangkan tournament ini!</p>
                  {tournament.prizePool > 0 && <p className="text-xs text-yellow-500 font-bold mt-1">Hadiah: Rp {tournament.prizePool.toLocaleString('id-ID')}</p>}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: Match History */}
          {myMatches.length > 0 && (
            <Card className={`${dt.casinoCard}`}>
              <div className={dt.casinoBar} />
              <CardContent className="p-0 relative z-10">
                <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                  <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                    <Music className={`w-3 h-3 ${dt.neonText}`} />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider">Riwayat Pertandingan</h3>
                  <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{data.completedMatchCount} Main</Badge>
                </div>
                <div className="p-3 space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar">
                  {(showAllMatches ? myMatches : myMatches.slice(0, 5)).map((m: MatchInfo) => {
                    const isLive = m.status === 'live';
                    return (
                      <div key={m.id} className={`p-3 sm:p-4 rounded-lg border ${
                        isLive ? 'border-red-500/30' :
                        m.won ? `border-green-500/20 ${dt.bgSubtle}` :
                        m.lost ? 'border-red-500/10' :
                        'border-border/20'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground">{getRoundLabel(m.round, totalRounds)}</span>
                          <div className="flex items-center gap-1.5">
                            {isLive && <Badge className="bg-red-500/15 text-red-500 border-0 text-[8px] animate-pulse">LIVE</Badge>}
                            {m.won && <Badge className="bg-green-500/15 text-green-400 border-0 text-[8px]">Menang</Badge>}
                            {m.lost && <Badge className="bg-red-500/15 text-red-400 border-0 text-[8px]">Kalah</Badge>}
                            {m.isDraw && <Badge className="bg-yellow-500/15 text-yellow-400 border-0 text-[8px]">Seri</Badge>}
                            {m.format && <Badge className={`${dt.casinoBadge} text-[8px]`}>{m.format}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold flex-1 ${m.won ? 'text-green-400' : ''}`}>{myTeam.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {m.myScore !== null && m.opponentScore !== null ? (
                              <>
                                <span className={`text-sm font-bold tabular-nums ${m.won ? 'text-green-400' : m.lost ? 'text-red-400' : ''}`}>{m.myScore}</span>
                                <span className="text-[10px] text-muted-foreground">-</span>
                                <span className={`text-sm font-bold tabular-nums ${m.lost ? 'text-red-400' : m.won ? 'text-green-400' : ''}`}>{m.opponentScore}</span>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted/50">VS</span>
                            )}
                          </div>
                          <span className={`text-xs font-semibold flex-1 text-right ${m.lost ? 'text-red-400' : ''}`}>{m.opponent.name}</span>
                        </div>
                        {m.mvpPlayer && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Crown className="w-2.5 h-2.5 text-yellow-500" />
                            <span className="text-[9px] text-yellow-500 font-medium">MVP: {m.mvpPlayer.gamertag}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {myMatches.length > 5 && (
                    <button onClick={() => setShowAllMatches(!showAllMatches)} className="w-full py-1.5 text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
                      {showAllMatches ? <>Tutup <ChevronUp className="w-3 h-3" /></> : <>Lihat semua ({myMatches.length}) <ChevronDown className="w-3 h-3" /></>}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     DEFAULT VIEW — No search submitted, show tournament overview
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {searchBar}

      {/* ── Tournament Overview Card ── */}
      {overviewLoading ? (
        <Card className={`${dt.casinoCard}`}>
          <CardContent className="p-4 relative z-10 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="inline-block">
              <Swords className={`w-6 h-6 ${dt.neonText}`} />
            </motion.div>
            <p className="text-xs text-muted-foreground mt-2">Memuat info turnamen...</p>
          </CardContent>
        </Card>
      ) : !overview?.hasTournament ? (
        /* No tournament for this division */
        <Card className={`${dt.casinoCard}`}>
          <div className={dt.casinoBar} />
          <CardContent className="p-5 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${division === 'male' ? 'from-idm-male/20 to-idm-male-light/10' : 'from-idm-female/20 to-idm-female-light/10'} border ${division === 'male' ? 'border-idm-male/20' : 'border-idm-female/20'} flex items-center justify-center mb-3`}>
                <Calendar className={`w-6 h-6 ${dt.neonText}`} />
              </div>
              <h4 className={`text-sm font-bold ${dt.neonGradient} mb-1`}>Belum Ada Turnamen</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xs">
                {overview?.message || 'Belum ada turnamen untuk divisi ini. Nantikan info selanjutnya!'}
              </p>
              {overview?.playerCount > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="w-3 h-3" /> {overview.playerCount} Pemain
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Shield className="w-3 h-3" /> {overview.clubCount} Club
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Active Tournament Status Card ── */}
          <Card className={`${dt.casinoCard} ${dt.cornerAccent} overflow-hidden`}>
            <div className={dt.casinoBar} />
            <CardContent className="p-0 relative z-10">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dt.iconBg}`}>
                    <Flame className={`w-4.5 h-4.5 ${dt.neonText}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{overview.tournament.name}</h3>
                      <StatusBadge status={overview.tournament.status} division={division} />
                    </div>
                    <p className="text-[9px] text-muted-foreground">
                      Week {overview.tournament.weekNumber} • {overview.tournament.season?.name || `Season 1`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {overview.tournament.totalMatches > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-muted-foreground">Progress</span>
                      <span className="text-[9px] font-bold">{overview.tournament.progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} transition-all duration-700`}
                        style={{ width: `${overview.tournament.progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[8px] text-muted-foreground mt-0.5">
                      {overview.tournament.completedMatchCount}/{overview.tournament.totalMatches} match selesai
                      {overview.tournament.liveMatchCount > 0 && <span className="text-red-400 ml-1">• {overview.tournament.liveMatchCount} LIVE</span>}
                    </p>
                  </div>
                )}

                {/* Phase Progress */}
                <TournamentProgress status={overview.tournament.status} />

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="text-center">
                    <div className={`text-sm font-bold ${dt.neonText}`}>{overview.tournament.totalTeams}</div>
                    <div className="text-[8px] text-muted-foreground">Tim</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold ${dt.neonText}`}>{overview.tournament.totalParticipants}</div>
                    <div className="text-[8px] text-muted-foreground">Pemain</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold ${dt.neonText}`}>{overview.tournament.totalMatches}</div>
                    <div className="text-[8px] text-muted-foreground">Match</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold ${dt.neonText}`}>{overview.tournament.prizePool > 0 ? `Rp ${(overview.tournament.prizePool / 1000).toFixed(0)}K` : '-'}</div>
                    <div className="text-[8px] text-muted-foreground">Hadiah</div>
                  </div>
                </div>

                {/* Tournament Info Row */}
                {(overview.tournament.location || overview.tournament.bpm || overview.tournament.scheduledAt) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {overview.tournament.location && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{overview.tournament.location}</span>
                      </div>
                    )}
                    {overview.tournament.bpm && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Heart className="w-3 h-3 text-red-400 shrink-0" />
                        <span>{overview.tournament.bpm} BPM</span>
                      </div>
                    )}
                    {overview.tournament.scheduledAt && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{new Date(overview.tournament.scheduledAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Live Matches Alert ── */}
          {overview.liveMatches && overview.liveMatches.length > 0 && (
            <Card className="border-red-500/40 bg-red-500/5 shadow-lg shadow-red-500/10">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-red-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">Live Sekarang!</h3>
                </div>
                {overview.liveMatches.map((m: OverviewMatch) => (
                  <div key={m.id} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-1.5 last:mb-0">
                    <span className="text-[10px] font-bold flex-1 truncate">{m.team1.name}</span>
                    <span className="text-xs font-bold tabular-nums text-red-400">
                      {m.score1 ?? 0} - {m.score2 ?? 0}
                    </span>
                    <span className="text-[10px] font-bold flex-1 truncate text-right">{m.team2.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Champion Card (if completed) ── */}
          {overview.tournament.champion && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-bold text-yellow-500">Juara!</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{overview.tournament.champion.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {overview.tournament.champion.players.map((p: { id: string; gamertag: string }) => (
                        <span key={p.id} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/10">
                          {p.gamertag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Secondary content in 2-column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Top Teams + Recent Results */}
            <div className="space-y-4">
              {overview.topTeams && overview.topTeams.length > 0 && (
                <Card className={`${dt.casinoCard}`}>
                  <div className={dt.casinoBar} />
                  <CardContent className="p-0 relative z-10">
                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                      <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                        <Star className={`w-3 h-3 ${dt.neonText}`} />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider">Top Tim</h3>
                      <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{overview.tournament.totalTeams} Tim</Badge>
                    </div>
                    <div className="p-3 space-y-1">
                      {overview.topTeams.slice(0, 5).map((team: OverviewTeam, idx: number) => (
                        <div key={team.id} className={`flex items-center gap-2 p-3 rounded-lg ${
                          idx === 0 ? `${dt.bgSubtle} border ${dt.borderSubtle}` : ''
                        }`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                            idx === 1 ? 'bg-gray-400/20 text-muted-foreground' :
                            idx === 2 ? 'bg-amber-600/20 text-amber-600' :
                            'bg-muted/30 text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate">{team.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {team.players.slice(0, 3).map(p => (
                                <span key={p.id} className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
                                   {p.gamertag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-[10px] font-bold ${dt.neonText}`}>{team.power}</div>
                            <div className="text-[8px] text-muted-foreground">power</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {overview.recentMatches && overview.recentMatches.length > 0 && (
                <Card className={`${dt.casinoCard}`}>
                  <div className={dt.casinoBar} />
                  <CardContent className="p-0 relative z-10">
                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                      <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                        <Swords className={`w-3 h-3 ${dt.neonText}`} />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider">Hasil Terbaru</h3>
                    </div>
                    <div className="p-3 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                      {overview.recentMatches.map((m: OverviewMatch) => (
                        <div key={m.id} className="flex items-center gap-2 p-3 rounded-lg border border-border/20">
                          <span className="text-[10px] font-semibold flex-1 truncate text-right">{m.team1.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs font-bold tabular-nums">{m.score1}</span>
                            <span className="text-[8px] text-muted-foreground">-</span>
                            <span className="text-xs font-bold tabular-nums">{m.score2}</span>
                          </div>
                          <span className="text-[10px] font-semibold flex-1 truncate">{m.team2.name}</span>
                          {m.winner && (
                            <span className="text-[8px] text-green-400 shrink-0">✓ {m.winner}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Upcoming + Participants */}
            <div className="space-y-4">
              {overview.upcomingMatches && overview.upcomingMatches.length > 0 && (
                <Card className={`${dt.casinoCard}`}>
                  <CardContent className="p-0 relative z-10">
                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                      <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                        <Clock className={`w-3 h-3 ${dt.neonText}`} />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider">Match Selanjutnya</h3>
                    </div>
                    <div className="p-3 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                      {overview.upcomingMatches.map((m: OverviewMatch) => (
                        <div key={m.id} className="flex items-center gap-2 p-3 rounded-lg border border-border/20">
                          <span className="text-[10px] font-semibold flex-1 truncate text-right">{m.team1.name}</span>
                          <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50 shrink-0">VS</span>
                          <span className="text-[10px] font-semibold flex-1 truncate">{m.team2.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {['registration', 'approval'].includes(overview.tournament.status) && (
                <Card className={`${dt.casinoCard}`}>
                  <CardContent className="p-0 relative z-10">
                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
                      <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                        <Award className={`w-3 h-3 ${dt.neonText}`} />
                      </div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider">Peserta</h3>
                      <div className="ml-auto flex items-center gap-1.5">
                        {overview.tournament.approvedCount > 0 && (
                          <Badge className="bg-green-500/15 text-green-400 border-0 text-[9px]">{overview.tournament.approvedCount} ✓</Badge>
                        )}
                        {overview.tournament.registeredCount > 0 && (
                          <Badge className="bg-yellow-500/15 text-yellow-400 border-0 text-[9px]">{overview.tournament.registeredCount} menunggu</Badge>
                        )}
                        <Badge className={`${dt.casinoBadge} text-[9px]`}>{overview.tournament.totalParticipants}</Badge>
                      </div>
                    </div>
                    {/* Approved participants */}
                    {overview.topParticipants && overview.topParticipants.length > 0 && (
                      <div className="p-3">
                        <p className="text-[9px] font-semibold text-green-400 mb-1.5 px-1">Disetujui</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {overview.topParticipants.map((p: OverviewPlayer & { status?: string }) => (
                            <div key={p.id} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-green-500/5 border border-green-500/10">
                              
                              <span className="text-[10px] font-medium truncate">{p.gamertag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Registered but not yet approved */}
                    {overview.registeredParticipants && overview.registeredParticipants.length > 0 && (
                      <div className="p-3">
                        <p className="text-[9px] font-semibold text-yellow-400 mb-1.5 px-1">Menunggu Persetujuan</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {overview.registeredParticipants.map((p: OverviewPlayer) => (
                            <div key={p.id} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-muted/20">
                              
                              <span className="text-[10px] font-medium truncate">{p.gamertag}</span>
                            </div>
                          ))}
                        </div>
                        {overview.tournament.registeredCount > 8 && (
                          <p className="text-[9px] text-muted-foreground mt-1.5 text-center">+{overview.tournament.registeredCount - 8} lainnya</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* ── Help Card ── */}
          <Card className={`${dt.casinoCard}`}>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${dt.iconBg}`}>
                  <Info className={`w-4 h-4 ${dt.neonText}`} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${dt.neonText} mb-1`}>Cara Melihat Turnamen Kamu</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Ketik nama atau nickname kamu di kolom pencarian di atas untuk melihat info tim, lawan, dan status pertandinganmu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
