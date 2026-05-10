'use client';

import { useMemo, useState } from 'react';
import { AvatarMedia } from '@/components/ui/avatar-media';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Award, Shield, Flame,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SkinBadgesRow, SkinName } from '../skin-renderer';
import { getPrimarySkin } from '@/lib/skin-utils';
import { ClubLogoImage } from '../club-logo-image';
import { getAvatarUrl, clubToString } from '@/lib/utils';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { useAppStore } from '@/lib/store';
import type { StatsData, TopPlayer } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   Tarkam Club type — from /api/clubs/leaderboard?type=tarkam
   ═══════════════════════════════════════════════════════ */
interface TarkamClub {
  id: string;
  name: string;
  logo: string | null;
  bannerImage: string | null;
  points: number;
  malePoints: number;
  femalePoints: number;
  wins: number;
  losses: number;
  gameDiff: number;
  memberCount: number;
  maleMemberCount: number;
  femaleMemberCount: number;
  rank: number;
}

/* ═══════════════════════════════════════════════════════
   COMMUNITY LEADERBOARD — Tarkam mode for clubs
   ═══════════════════════════════════════════════════════ */
interface CommunityLeaderboardProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  onPlayerClick: (player: TopPlayer & { division?: string }, division: 'male' | 'female') => void;
  onClubClick?: (club: StatsData['clubs'][0]) => void;
}

type DivisionFilter = 'all' | 'male' | 'female';

export function CommunityLeaderboard({
  maleData,
  femaleData,
  onPlayerClick,
  onClubClick,
}: CommunityLeaderboardProps) {
  const dt = useCommunityTheme();
  const division = useAppStore(s => s.division);
  const [leaderboardSort, setLeaderboardSort] = useState<'players' | 'clubs'>('players');
  const [divisionFilter, setDivisionFilter] = useState<DivisionFilter>('all');
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showAllClubs, setShowAllClubs] = useState(false);

  /* ─── Season champion clubs (for S1 badge) ─── */
  const seasonChampionClubIds = useMemo(() => {
    const allSeasons = [...(maleData?.allSeasons || []), ...(femaleData?.allSeasons || [])];
    const champMap = new Map<string, number>(); // clubId -> seasonNumber
    for (const s of allSeasons) {
      if (s.status === 'completed' && s.championClub) {
        champMap.set(s.championClub.id, s.number);
      }
    }
    return champMap;
  }, [maleData, femaleData]);

  /* ─── Fetch Tarkam club leaderboard ─── */
  const { data: tarkamClubData, isLoading: isClubLoading } = useQuery<{ clubs: TarkamClub[]; type: string }>({
    queryKey: ['clubs-leaderboard', 'tarkam'],
    queryFn: async () => {
      const res = await fetch('/api/clubs/leaderboard?type=tarkam');
      if (!res.ok) return { clubs: [], type: 'tarkam' };
      return res.json();
    },
    staleTime: 15000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    enabled: leaderboardSort === 'clubs',
  });

  // Skin maps from both divisions
  const skinMap = {
    ...maleData?.skinMap,
    ...femaleData?.skinMap,
  };

  // Merge top players from both divisions, re-sort by points
  const mergedPlayers = useMemo(() => {
    let male = (maleData?.topPlayers || []).map(p => ({ ...p, division: 'male' as const }));
    let female = (femaleData?.topPlayers || []).map(p => ({ ...p, division: 'female' as const }));

    if (divisionFilter === 'male') female = [];
    if (divisionFilter === 'female') male = [];

    return [...male, ...female].sort((a, b) => {
      // Primary sort: points descending
      if (b.points !== a.points) return b.points - a.points;
      // Tiebreaker: gamertag alphabetically (A-Z)
      return a.gamertag.localeCompare(b.gamertag);
    });
  }, [maleData, femaleData, divisionFilter]);

  const displayedPlayers = showAllPlayers ? mergedPlayers : mergedPlayers.slice(0, 10);
  const clubs = tarkamClubData?.clubs || [];
  const displayedClubs = showAllClubs ? clubs : clubs.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Filter bar: Player/Club toggle + Division filter — single scrollable row on mobile */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex items-center gap-2 min-w-max lg:min-w-0">
          {/* Player/Club toggle — with count badges */}
          <div className={`flex items-center gap-1 p-1 rounded-lg ${dt.bgSubtle} ${dt.border}`}>
            <button
              onClick={() => setLeaderboardSort('players')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${leaderboardSort === 'players' ? `${dt.bg} ${dt.text} shadow-sm` : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users className="w-3 h-3" /> Pemain
              <span className={`text-[10px] tabular-nums ${leaderboardSort === 'players' ? 'text-idm-gold-warm' : 'text-muted-foreground/50'}`}>
                {mergedPlayers.length}
              </span>
            </button>
            <button
              onClick={() => setLeaderboardSort('clubs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${leaderboardSort === 'clubs' ? `${dt.bg} ${dt.text} shadow-sm` : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Shield className="w-3 h-3" /> Klub
              <span className={`text-[10px] tabular-nums ${leaderboardSort === 'clubs' ? 'text-idm-gold-warm' : 'text-muted-foreground/50'}`}>
                {clubs.length || (maleData?.clubs?.length || 0) + (femaleData?.clubs?.length || 0)}
              </span>
            </button>
          </div>

          {/* Division filter pills — only shown for players */}
          {leaderboardSort === 'players' && (
            <div className={`flex items-center gap-1 p-1 rounded-lg bg-idm-gold-warm/5 border border-idm-gold-warm/10`}>
              {([
                { key: 'all', label: 'Semua' },
                { key: 'male', label: '🕺 Male' },
                { key: 'female', label: '💃 Female' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setDivisionFilter(f.key)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all whitespace-nowrap ${
                    divisionFilter === f.key
                      ? f.key === 'male'
                        ? 'bg-idm-male text-white shadow-sm'
                        : f.key === 'female'
                        ? 'bg-idm-female text-white shadow-sm'
                        : `${dt.bg} ${dt.text} shadow-sm`
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Player Leaderboard — Toornament clean table ═══ */}
      {leaderboardSort === 'players' && (
        <Card className={`${dt.casinoCard} overflow-hidden`}>
          <div className={dt.casinoBar} />
          {/* Header bar */}
          <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
            <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
              <Award className={`w-3 h-3 ${dt.neonText}`} />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">Peringkat Player</h3>
            <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>TOP {displayedPlayers?.length || 10}</Badge>
          </div>
          {/* Table */}
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={`hover:bg-transparent border-b ${dt.border} bg-muted/30`}>
                    <TableHead className="w-10 text-center text-[10px] font-semibold">#</TableHead>
                    <TableHead className="text-[10px] font-semibold min-w-[120px]">Player</TableHead>
                    <TableHead className="w-16 text-center text-[10px] font-semibold">Divisi</TableHead>
                    <TableHead className="w-14 text-right text-[10px] font-semibold">Pts</TableHead>
                    <TableHead className="w-10 text-center text-[10px] font-semibold">W</TableHead>
                    <TableHead className="w-10 text-center text-[10px] font-semibold hidden sm:table-cell">L</TableHead>
                    <TableHead className="w-14 text-center text-[10px] font-semibold hidden md:table-cell">Streak</TableHead>
                    <TableHead className="w-10 text-center text-[10px] font-semibold hidden sm:table-cell">MVP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPlayers?.map((p, idx) => {
                    const losses = p.matches - p.totalWins;
                    const playerDivision = (p.division || 'male') as 'male' | 'female';
                    const playerDt = getDivisionTheme(playerDivision);
                    const playerSkins = skinMap[p.id];
                    const primarySkin = playerSkins && playerSkins.length > 0 ? getPrimarySkin(playerSkins) : null;
                    const trendUp = p.streak > 1;

                    return (
                      <TableRow
                        key={p.id}
                        className={`standings-row-enter standings-row-glass ${idx % 2 === 0 ? 'standings-row-glass-even' : 'standings-row-glass-odd'} ${playerDivision === 'male' ? 'standings-row-glow-male' : 'standings-row-glow-female'} cursor-pointer transition-all duration-200 border-b ${playerDt.borderSubtle} ${
                          idx < 3 ? `${playerDt.bgSubtle}` : ''
                        }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                        onClick={() => onPlayerClick(p, playerDivision)}
                      >
                        <TableCell className="text-center">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'rank-badge-gold-enhanced text-black' :
                            idx === 1 ? 'rank-badge-silver-enhanced text-black' :
                            idx === 2 ? 'rank-badge-bronze-enhanced text-black' :
                            'text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${
                              idx === 0 ? 'avatar-ring-gold' :
                              idx === 1 ? 'avatar-ring-silver' :
                              idx === 2 ? 'avatar-ring-bronze' : ''
                            }`}>
                              <AvatarMedia src={getAvatarUrl(p.gamertag, playerDivision, p.avatar)} alt={p.gamertag} width={28} height={28} className="w-full h-full" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <SkinName skin={primarySkin}>
                                  <p className="text-xs font-medium truncate">{p.gamertag}</p>
                                </SkinName>
                                {playerSkins && playerSkins.length > 0 && <SkinBadgesRow skins={playerSkins} />}
                              </div>
                              {clubToString(p.club as any) && <p className="text-[9px] text-muted-foreground truncate">{clubToString(p.club as any)}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${playerDt.badgeBg} text-[8px] border`}>
                            {playerDivision === 'male' ? '🕺 Male' : '💃 Female'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold text-xs ${idx < 3 ? playerDt.neonText : ''}`}>{p.points}</span>
                          {trendUp && <span className="trend-up text-green-400 text-[9px] ml-0.5">↑</span>}
                        </TableCell>
                        <TableCell className="text-center text-xs text-green-500 font-medium">{p.totalWins}</TableCell>
                        <TableCell className="text-center text-xs text-red-500 font-medium hidden sm:table-cell">{losses > 0 ? losses : 0}</TableCell>
                        <TableCell className="text-center text-xs hidden md:table-cell">
                          {p.streak > 1 ? (
                            <span className="text-orange-400 font-semibold flex items-center gap-0.5 justify-center"><Flame className="w-3 h-3" />{p.streak}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs hidden sm:table-cell">
                          {p.totalMvp > 0 ? (
                            <span className="text-yellow-500 font-semibold">{p.totalMvp}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Show more / less toggle */}
          {mergedPlayers.length > 10 && (
            <div className={`flex items-center justify-center py-2 border-t ${dt.borderSubtle}`}>
              <button
                onClick={() => setShowAllPlayers(!showAllPlayers)}
                className={`flex items-center gap-1 text-[10px] font-medium ${dt.text} hover:underline cursor-pointer`}
              >
                {showAllPlayers ? <><ChevronUp className="w-3 h-3" /> Tampilkan Sedikit</> : <><ChevronDown className="w-3 h-3" /> Tampilkan Semua ({mergedPlayers.length})</>}
              </button>
            </div>
          )}
        </Card>
      )}

      {/* ═══ Club Standings — TARKAM MODE (poin = total poin anggota) ═══ */}
      {leaderboardSort === 'clubs' && (
        <Card className={`${dt.casinoCard} overflow-hidden`}>
          <div className={dt.casinoBar} />
          <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
            <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
              <Shield className={`w-3 h-3 ${dt.neonText}`} />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">Klasemen Club</h3>
            <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>TARKAM</Badge>
          </div>
          {isClubLoading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted/30" />
                    <div className="w-7 h-7 rounded-lg bg-muted/30" />
                    <div className="flex-1 h-4 rounded bg-muted/20" />
                    <div className="w-12 h-4 rounded bg-muted/20" />
                  </div>
                ))}
              </div>
            </div>
          ) : clubs.length > 0 ? (
            <>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={`hover:bg-transparent border-b ${dt.border} bg-muted/30`}>
                        <TableHead className="w-10 text-center text-[10px] font-semibold">#</TableHead>
                        <TableHead className="text-[10px] font-semibold min-w-[130px]">Club</TableHead>
                        <TableHead className="w-14 text-center text-[10px] font-semibold">Anggota</TableHead>
                        <TableHead className="w-14 text-center text-[10px] font-semibold">
                          <span className="text-idm-male">Pts M</span>
                        </TableHead>
                        <TableHead className="w-14 text-center text-[10px] font-semibold hidden sm:table-cell">
                          <span className="text-idm-female">Pts F</span>
                        </TableHead>
                        <TableHead className="w-14 text-right text-[10px] font-semibold">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedClubs?.map((club, idx) => {
                        const memberLabel = club.maleMemberCount > 0 && club.femaleMemberCount > 0
                          ? `${club.maleMemberCount}M + ${club.femaleMemberCount}F`
                          : club.maleMemberCount > 0
                            ? `${club.maleMemberCount}M`
                            : `${club.femaleMemberCount}F`;

                        return (
                          <TableRow
                            key={club.id}
                            className={`standings-row-enter standings-row-glass ${idx % 2 === 0 ? 'standings-row-glass-even' : 'standings-row-glass-odd'} cursor-pointer transition-all duration-200 border-b ${dt.borderSubtle} ${
                              idx < 4 ? `${dt.bgSubtle}` : ''
                            }`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => onClubClick?.(club as StatsData['clubs'][0])}
                          >
                            <TableCell className="text-center">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                                idx === 0 ? 'rank-badge-gold-enhanced text-black' :
                                idx === 1 ? 'rank-badge-silver-enhanced text-black' :
                                idx === 2 ? 'rank-badge-bronze-enhanced text-black' :
                                'text-muted-foreground'
                              }`}>
                                {idx + 1}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0">
                                  {club.logo ? (
                                    <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} width={28} height={28} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className={`w-full h-full ${dt.iconBg} flex items-center justify-center`}>
                                      <Shield className={`w-3.5 h-3.5 ${dt.text}`} />
                                    </div>
                                  )}
                                  {/* Season champion badge */}
                                  {seasonChampionClubIds.has(club.id) && (
                                    <div className="absolute -top-1 -right-1 z-10 min-w-[14px] h-[14px] rounded-full bg-[#d4a853] flex items-center justify-center border border-border/20">
                                      <span className="text-[6px] font-black text-mid leading-none">S{seasonChampionClubIds.get(club.id)}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold truncate">{club.name}</span>
                                  <p className="text-[9px] text-muted-foreground">{memberLabel} anggota</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs font-medium">
                              <span>{club.memberCount}</span>
                              <span className="text-[8px] text-muted-foreground block">{memberLabel}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-xs font-bold text-idm-male">{club.malePoints}</span>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <span className="text-xs font-bold text-idm-female">{club.femalePoints}</span>
                            </TableCell>
                            <TableCell className={`text-right font-bold text-xs ${idx === 0 ? dt.neonGradient : idx < 4 ? dt.neonText : ''}`}>{club.points}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {clubs.length > 6 && (
                <div className={`flex items-center justify-center py-2 border-t ${dt.borderSubtle}`}>
                  <button
                    onClick={() => setShowAllClubs(!showAllClubs)}
                    className={`flex items-center gap-1 text-[10px] font-medium ${dt.text} hover:underline cursor-pointer`}
                  >
                    {showAllClubs ? <><ChevronUp className="w-3 h-3" /> Tampilkan Sedikit</> : <><ChevronDown className="w-3 h-3" /> Tampilkan Semua ({clubs.length})</>}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-4">
              <div className={`p-6 rounded-2xl ${dt.bgSubtle} ${dt.border} text-center`}>
                <Shield className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
                <p className="text-sm text-muted-foreground">Belum ada club terdaftar</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Poin klub dihitung dari total poin semua anggota</p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
