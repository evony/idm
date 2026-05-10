'use client';

import React, { useState } from 'react';
import { AvatarMedia } from '@/components/ui/avatar-media';
import Image from 'next/image';

import {
  Users, Shield, Award, Flame, ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SkinBadgesRow, SkinName } from '../skin-renderer';
import { getPrimarySkin } from '@/lib/skin-utils';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import { PlayerSearch } from '../player-search';
import { useAppStore } from '@/lib/store';
import { getAvatarUrl, clubToString, toStrictDivision } from '@/lib/utils';

import type { StatsData } from '@/types/stats';

type Division = 'male' | 'female';

// Division badge colors for the mixed table
const DIVISION_BADGE: Record<Division, { bg: string; text: string; icon: string; label: string }> = {
  male: { bg: 'rgba(46,159,255,0.12)', text: '#57B5FF', icon: '♂', label: 'Male' },
  female: { bg: 'rgba(255,45,120,0.12)', text: '#FF5C9A', icon: '♀', label: 'Female' },
};

interface StandingsTabProps {
  data: StatsData;
  otherDivisionData: StatsData | undefined;
  currentDivision: Division;
  setSelectedPlayer: (player: any) => void;
  setSelectedClub: (club: any) => void;
}

export function StandingsTab({ data, otherDivisionData, currentDivision, setSelectedPlayer, setSelectedClub }: StandingsTabProps) {
  const dt = useDivisionTheme();
  const division = useAppStore(s => s.division);
  const playerAuth = useAppStore(s => s.playerAuth);

  // Skin map from API — contains skins for ALL players in the division
  const skinMap = { ...(data?.skinMap || {}), ...(otherDivisionData?.skinMap || {}) };

  const [leaderboardSort, setLeaderboardSort] = useState<'players' | 'clubs'>('players');
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showAllClubs, setShowAllClubs] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Merge both divisions' players into one unified list ──
  // Sort: by points DESC, then by gamertag ASC (alphabetical) for tiebreaker
  const allPlayers = React.useMemo(() => {
    const currentPlayers = (data?.topPlayers ?? []).map(p => ({
      ...p,
      division: currentDivision as Division,
    }));
    const otherPlayers = (otherDivisionData?.topPlayers ?? []).map(p => ({
      ...p,
      division: (currentDivision === 'male' ? 'female' : 'male') as Division,
    }));
    return [...currentPlayers, ...otherPlayers].sort((a, b) => {
      // Points DESC first
      if (b.points !== a.points) return b.points - a.points;
      // Alphabetical tiebreaker
      return a.gamertag.localeCompare(b.gamertag);
    });
  }, [data?.topPlayers, otherDivisionData?.topPlayers, currentDivision]);

  const displayedPlayers = showAllPlayers ? allPlayers : allPlayers.slice(0, 15);
  const clubs = data?.clubs ?? [];
  const displayedClubs = showAllClubs ? clubs : clubs.slice(0, 6);

  // Count per division for badge
  const maleCount = allPlayers.filter(p => p.division === 'male').length;
  const femaleCount = allPlayers.filter(p => p.division === 'female').length;

  return (
    <div className="space-y-4">

      {/* Toornament-style sub-tabs for Players/Clubs + Search button */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 p-1 rounded-lg ${dt.bgSubtle} ${dt.border}`}>
          <button
            onClick={() => setLeaderboardSort('players')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${leaderboardSort === 'players' ? `${dt.bg} ${dt.text} shadow-sm` : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-3 h-3" /> Pemain
          </button>
          <button
            onClick={() => setLeaderboardSort('clubs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${leaderboardSort === 'clubs' ? `${dt.bg} ${dt.text} shadow-sm` : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Shield className="w-3 h-3" /> Klub
          </button>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dt.bgSubtle} ${dt.border} border ${dt.text} hover:${dt.bg}`}
        >
          <Search className="w-3 h-3" /> Cari
        </button>
      </div>

      {/* Player Leaderboard — Unified Male + Female */}
      {leaderboardSort === 'players' && (
        <div className="stagger-item-subtle stagger-d0">
          <Card className={`${dt.casinoCard} overflow-hidden`}>
            <div className={dt.casinoBar} />
            {/* Header bar */}
            <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
              <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                <Award className={`w-3 h-3 ${dt.neonText}`} />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider">Peringkat Player</h3>
              {/* Division count badges */}
              <div className="ml-auto flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: DIVISION_BADGE.male.bg, color: DIVISION_BADGE.male.text }}>♂ {maleCount}</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: DIVISION_BADGE.female.bg, color: DIVISION_BADGE.female.text }}>♀ {femaleCount}</span>
              </div>
            </div>
            {/* Horizontal scroll wrapper for mobile */}
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={`hover:bg-transparent border-b ${dt.border} bg-muted/30`}>
                      <TableHead className="w-10 text-center text-[10px] font-semibold">#</TableHead>
                      <TableHead className="text-[10px] font-semibold min-w-[120px]">Player</TableHead>
                      <TableHead className="w-14 text-center text-[10px] font-semibold">Div</TableHead>
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
                      const isMe = playerAuth.isAuthenticated && playerAuth.account && playerAuth.account.player.id === p.id;
                      const playerSkins = skinMap[p.id];
                      const primarySkin = playerSkins && playerSkins.length > 0 ? getPrimarySkin(playerSkins) : null;
                      const trendUp = p.streak > 1;
                      const playerDiv = (p.division || currentDivision) as Division;
                      const divBadge = DIVISION_BADGE[playerDiv];
                      return (
                        <TableRow
                          key={`${p.division}-${p.id}`}
                          className={`standings-row-enter standings-row-glass ${idx % 2 === 0 ? 'standings-row-glass-even' : 'standings-row-glass-odd'} ${playerDiv === 'male' ? 'standings-row-glow-male' : 'standings-row-glow-female'} cursor-pointer transition-all duration-200 border-b ${dt.borderSubtle} ${
                            idx < 3 ? `${dt.bgSubtle}` : ''
                          } ${isMe ? 'bg-idm-gold/5' : ''}`}
                          style={{ animationDelay: `${idx * 50}ms` }}
                          onClick={() => setSelectedPlayer({ ...p, division: playerDiv })}
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
                                <AvatarMedia src={getAvatarUrl(p.gamertag, playerDiv, p.avatar)} alt={p.gamertag} width={28} height={28} className="w-full h-full" />
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
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: divBadge.bg, color: divBadge.text }}
                            >
                              {divBadge.icon} {divBadge.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-bold text-xs ${idx < 3 ? dt.neonText : ''}`}>{p.points}</span>
                            {trendUp && <span className="trend-up text-green-400 text-[9px] ml-0.5">↑</span>}
                            {!trendUp && p.totalWins > 0 && idx > 3 && <span className="trend-down text-red-400/50 text-[9px] ml-0.5">↓</span>}
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
            {allPlayers.length > 15 && (
              <div className={`flex items-center justify-center py-2 border-t ${dt.borderSubtle}`}>
                <button
                  onClick={() => setShowAllPlayers(!showAllPlayers)}
                  className={`flex items-center gap-1 text-[10px] font-medium ${dt.text} hover:underline`}
                >
                  {showAllPlayers ? <><ChevronUp className="w-3 h-3" /> Tampilkan Sedikit</> : <><ChevronDown className="w-3 h-3" /> Tampilkan Semua ({allPlayers.length})</>}
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Player Search Dialog */}
      <PlayerSearch
        division={toStrictDivision(division)}
        onSelectPlayer={(p) => { setSelectedPlayer(p); setSearchOpen(false); }}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />

      {/* Club Standings — Toornament clean table (current division only) */}
      {leaderboardSort === 'clubs' && (
        <div className="stagger-item-subtle stagger-d1">
          <Card className={`${dt.casinoCard} overflow-hidden`}>
            <div className={dt.casinoBar} />
            <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
              <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
                <Shield className={`w-3 h-3 ${dt.neonText}`} />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider">Klasemen Club</h3>
              <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{data.clubs?.length || 0} Clubs</Badge>
            </div>
            {data.clubs?.length > 0 ? (
              <>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className={`hover:bg-transparent border-b ${dt.border} bg-muted/30`}>
                          <TableHead className="w-10 text-center text-[10px] font-semibold">#</TableHead>
                          <TableHead className="text-[10px] font-semibold min-w-[140px]">Club</TableHead>
                          <TableHead className="w-10 text-center text-[10px] font-semibold">W</TableHead>
                          <TableHead className="w-10 text-center text-[10px] font-semibold hidden sm:table-cell">L</TableHead>
                          <TableHead className="w-12 text-center text-[10px] font-semibold hidden md:table-cell">Selisih</TableHead>
                          <TableHead className="w-14 text-right text-[10px] font-semibold">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedClubs?.map((club, idx) => (
                          <TableRow
                            key={club.id}
                            className={`standings-row-enter standings-row-glass ${idx % 2 === 0 ? 'standings-row-glass-even' : 'standings-row-glass-odd'} ${division === 'male' ? 'standings-row-glow-male' : 'standings-row-glow-female'} cursor-pointer transition-all duration-200 border-b ${dt.borderSubtle} ${
                              idx < 4 ? `${dt.bgSubtle}` : ''
                            }`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => setSelectedClub(club)}
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
                                  {data.allSeasons?.some(s => s.status === 'completed' && s.championClub?.id === club.id) && (
                                    <div className="absolute -top-1 -right-1 z-10 min-w-[14px] h-[14px] rounded-full bg-[#d4a853] flex items-center justify-center border border-white/20">
                                      <span className="text-[6px] font-black text-mid leading-none">S{data.allSeasons.find(s => s.status === 'completed' && s.championClub?.id === club.id)?.number}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs font-semibold truncate">{club.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs text-green-500 font-medium">{club.wins}</TableCell>
                            <TableCell className="text-center text-xs text-red-500 font-medium hidden sm:table-cell">{club.losses}</TableCell>
                            <TableCell className="text-center text-xs hidden md:table-cell">
                              <span className={club.gameDiff > 0 ? 'text-green-500' : club.gameDiff < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                                {club.gameDiff > 0 ? '+' : ''}{club.gameDiff}
                              </span>
                            </TableCell>
                            <TableCell className={`text-right font-bold text-xs ${idx === 0 ? dt.neonGradient : idx < 4 ? dt.neonText : ''}`}>{club.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {data.clubs?.length > 6 && (
                  <div className={`flex items-center justify-center py-2 border-t ${dt.borderSubtle}`}>
                    <button
                      onClick={() => setShowAllClubs(!showAllClubs)}
                      className={`flex items-center gap-1 text-[10px] font-medium ${dt.text} hover:underline`}
                    >
                      {showAllClubs ? <><ChevronUp className="w-3 h-3" /> Tampilkan Sedikit</> : <><ChevronDown className="w-3 h-3" /> Tampilkan Semua ({data.clubs.length})</>}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4">
                <div className={`p-6 rounded-2xl ${dt.bgSubtle} ${dt.border} text-center`}>
                  <Shield className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
                  <p className="text-sm text-muted-foreground">Belum ada club terdaftar</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1">Club akan muncul setelah pendaftaran</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
