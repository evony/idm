'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Trophy, Crown, Medal, Users, Calendar, Shield,
  ArrowLeft, Star, Building2, Gamepad2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SelectedSeason } from './season-selector';

/* ═══════════════════════════════════════════
   Types for Season Detail API Response
   (matches actual /api/seasons/[id] response)
   ═══════════════════════════════════════════ */
interface StandingPlayer {
  id: string;
  gamertag: string;
  division: string;
  avatar: string | null;
  points: number;
  rank: number | null;
  tier: string;
  club: string | null;
  tournamentCount: number;
}

interface StandingClub {
  id: string;
  profileId: string;
  division: string;
  seasonId: string;
  wins: number;
  losses: number;
  points: number;
  gameDiff: number;
  profile: {
    id: string;
    name: string;
    logo: string | null;
  };
  _count: {
    homeMatches: number;
    awayMatches: number;
  };
}

interface ChampionPlayer {
  id: string;
  gamertag: string;
  division: string;
  avatar: string | null;
  points: number;
}

interface ChampionClub {
  id: string;
  name: string;
  logo: string | null;
}

interface SeasonDetailResponse {
  id: string;
  name: string;
  number: number;
  division: string;
  status: string;
  startDate: string;
  endDate: string | null;
  championPlayer: ChampionPlayer | null;
  championClub: ChampionClub | null;
  championPlayerPoints: number | null;
  championPlayerSnapshot: Record<string, unknown> | null;
  championClubSnapshot: Record<string, unknown> | null;
  players: StandingPlayer[];
  clubs: StandingClub[];
  tournaments: unknown[];
  donations: unknown[];
  _count: { tournaments: number; clubs: number; donations: number };
}

/* ═══════════════════════════════════════════
   Historical Banner — Shows viewing past season
   ═══════════════════════════════════════════ */
function HistoricalBanner({ season }: { season: SelectedSeason }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/8 via-amber-500/5 to-transparent p-4">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 10% 50%, rgba(245,158,11,0.08) 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-amber-400">
              Season {season.number} (Completed)
            </h3>
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[8px]">
              🏆 Historical Data
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Viewing archived results from {season.name}
            {season.startDate && season.endDate && (
              <> · {new Date(season.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(season.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</>
            )}
          </p>
        </div>
        <Badge className={`${season.division === 'male' ? 'bg-idm-male/15 text-idm-male border-idm-male/25' : 'bg-idm-female/15 text-idm-female border-idm-female/25'} text-[9px] border shrink-0`}>
          {season.division === 'male' ? '🕺 Male' : '💃 Female'}
        </Badge>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Champion Card — Shows season champion
   ═══════════════════════════════════════════ */
function ChampionCard({ season, championPoints }: { season: SeasonDetailResponse; championPoints: number | null }) {
  const isMale = season.division === 'male';

  // Prefer snapshot data for completed seasons
  const snapshot = season.championPlayerSnapshot as Record<string, string | number | null> | null;
  const championGamertag = (snapshot?.gamertag as string) || season.championPlayer?.gamertag || '-';
  const championClub = (snapshot?.club as string) || season.championClub?.name || null;

  return (
    <Card className={`${isMale ? 'border-idm-male/20' : 'border-idm-female/20'} overflow-hidden`}>
      <div className={`h-1 ${isMale ? 'bg-gradient-to-r from-idm-male/60 to-idm-male/20' : 'bg-gradient-to-r from-idm-female/60 to-idm-female/20'}`} />
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Season {season.number} Champion</h3>
        </div>

        {season.championPlayer || season.championPlayerSnapshot ? (
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${isMale ? 'bg-idm-male/15 border-idm-male/25' : 'bg-idm-female/15 border-idm-female/25'} border flex items-center justify-center shrink-0`}>
              <Crown className={`w-6 h-6 ${isMale ? 'text-idm-male' : 'text-idm-female'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold truncate">{championGamertag}</span>
                <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[9px]">
                  🏆 Champion
                </Badge>
              </div>
              {championPoints != null && (
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-lg font-black ${isMale ? 'text-idm-male' : 'text-idm-female'}`}>
                    {championPoints}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</span>
                </div>
              )}
              {championClub && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{championClub}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No champion recorded
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   Standings Table — Player rankings from snapshot
   ═══════════════════════════════════════════ */
function StandingsTable({ standings, division }: { standings: StandingPlayer[]; division: string }) {
  const isMale = division === 'male';

  if (standings.length === 0) {
    return (
      <div className="p-8 text-center">
        <Gamepad2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Tidak ada data pemain</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/20">
            <th className="py-2 px-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
            <th className="py-2 px-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Player</th>
            <th className="py-2 px-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Club</th>
            <th className="py-2 px-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((player, idx) => {
            const rank = player.rank || idx + 1;
            const isTop3 = rank <= 3;
            return (
              <tr
                key={player.id}
                className={`border-b border-border/5 transition-colors hover:bg-muted/20 ${
                  isTop3 ? 'bg-amber-500/[0.02]' : ''
                }`}
              >
                <td className="py-2.5 px-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                    rank === 2 ? 'bg-muted/15 text-muted-foreground' :
                    rank === 3 ? 'bg-orange-500/15 text-orange-400' :
                    'bg-muted/20 text-muted-foreground'
                  }`}>
                    {rank}
                  </div>
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold truncate ${isTop3 ? 'text-foreground' : 'text-foreground/80'}`}>
                      {player.gamertag}
                    </span>
                    {rank === 1 && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                </td>
                <td className="py-2.5 px-2 hidden sm:table-cell">
                  <span className="text-muted-foreground truncate block max-w-[120px]">
                    {player.club || '-'}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className={`font-bold tabular-nums ${isTop3 ? (isMale ? 'text-idm-male' : 'text-idm-female') : 'text-foreground/70'}`}>
                    {player.points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Club Rankings Table — Club rankings from API data
   ═══════════════════════════════════════════ */
function ClubRankingsTable({ clubs }: { clubs: StandingClub[] }) {
  if (clubs.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Tidak ada data klub</p>
      </div>
    );
  }

  // Sort by points descending
  const sortedClubs = [...clubs].sort((a, b) => b.points - a.points);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/20">
            <th className="py-2 px-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
            <th className="py-2 px-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Club</th>
            <th className="py-2 px-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">W/L</th>
            <th className="py-2 px-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
          </tr>
        </thead>
        <tbody>
          {sortedClubs.map((club, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            return (
              <tr
                key={club.id}
                className={`border-b border-border/5 transition-colors hover:bg-muted/20 ${
                  isTop3 ? 'bg-amber-500/[0.02]' : ''
                }`}
              >
                <td className="py-2.5 px-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                    rank === 2 ? 'bg-muted/15 text-muted-foreground' :
                    rank === 3 ? 'bg-orange-500/15 text-orange-400' :
                    'bg-muted/20 text-muted-foreground'
                  }`}>
                    {rank}
                  </div>
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    {club.profile?.logo ? (
                      <img src={club.profile.logo} alt={club.profile.name} className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-muted/30 flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className={`font-semibold ${isTop3 ? 'text-foreground' : 'text-foreground/80'}`}>
                      {club.profile?.name || 'Unknown'}
                    </span>
                    {rank === 1 && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right hidden sm:table-cell">
                  <span className="text-muted-foreground tabular-nums">
                    {club.wins}/{club.losses}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className={`font-bold tabular-nums ${isTop3 ? 'text-idm-gold-warm' : 'text-foreground/70'}`}>
                    {club.points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════ */
function HistoricalLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 p-4">
        <Skeleton className="h-10 w-3/4 rounded-lg" />
      </div>
      <div className="rounded-2xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 p-5">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-idm-gold-warm/5 border border-idm-gold-warm/10 p-4">
        <Skeleton className="h-6 w-24 mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-6 h-6 rounded-md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main HistoricalSeasonView Component
   ═══════════════════════════════════════════ */
interface HistoricalSeasonViewProps {
  season: SelectedSeason;
  onBack: () => void;
}

export function HistoricalSeasonView({ season, onBack }: HistoricalSeasonViewProps) {
  const isMale = season.division === 'male';

  // Fetch season detail — API returns flat object with players[] and clubs[]
  const { data, isLoading, error } = useQuery<SeasonDetailResponse>({
    queryKey: ['season-detail', season.id],
    queryFn: async () => {
      const res = await fetch(`/api/seasons/${season.id}`);
      if (!res.ok) throw new Error('Failed to fetch season data');
      return res.json();
    },
    enabled: !!season.id,
    staleTime: 10 * 60 * 1000, // Cache longer for historical data
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <HistoricalBanner season={season} />
        <HistoricalLoadingSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <HistoricalBanner season={season} />
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-red-400 mb-2">Gagal memuat data season</p>
            <button
              onClick={onBack}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Kembali ke season aktif
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract standings and clubs from the API response
  const standings: StandingPlayer[] = (data as unknown as Record<string, unknown>).players as StandingPlayer[] || [];
  const clubs: StandingClub[] = ((data as unknown as Record<string, unknown>).clubs || []) as StandingClub[];

  return (
    <div className="space-y-4">
      {/* Historical Banner */}
      <HistoricalBanner season={season} />

      {/* Back to Active Season Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        <span>Kembali ke season aktif</span>
      </button>

      {/* Champion Card */}
      <ChampionCard season={data} championPoints={data.championPlayerPoints} />

      {/* Player Standings */}
      {standings.length > 0 && (
        <Card className="overflow-hidden">
          <div className={`h-1 ${isMale ? 'bg-gradient-to-r from-idm-male/60 to-idm-male/20' : 'bg-gradient-to-r from-idm-female/60 to-idm-female/20'}`} />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Medal className={`w-4 h-4 ${isMale ? 'text-idm-male' : 'text-idm-female'}`} />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Peringkat Pemain</h3>
              </div>
              <Badge className={`${isMale ? 'bg-idm-male/15 text-idm-male' : 'bg-idm-female/15 text-idm-female'} border-0 text-[9px]`}>
                {standings.length} Players
              </Badge>
            </div>
            <StandingsTable standings={standings} division={season.division} />
          </CardContent>
        </Card>
      )}

      {/* Club Rankings */}
      {clubs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-idm-gold-warm/60 to-idm-gold-warm/20" />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-idm-gold-warm" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Peringkat Klub</h3>
              </div>
              <Badge className="bg-idm-gold-warm/15 text-idm-gold-warm border-0 text-[9px]">
                {clubs.length} Clubs
              </Badge>
            </div>
            <ClubRankingsTable clubs={clubs} />
          </CardContent>
        </Card>
      )}

      {/* Season Info Footer */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Info Season</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Season</p>
              <p className="text-sm font-bold">Season {data.number}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Divisi</p>
              <p className="text-sm font-bold">{data.division === 'male' ? '🕺 Male' : '💃 Female'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Periode</p>
              <p className="text-xs font-semibold">
                {data.startDate ? new Date(data.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                {' — '}
                {data.endDate ? new Date(data.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Turnamen</p>
              <p className="text-sm font-bold">{data._count?.tournaments || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
