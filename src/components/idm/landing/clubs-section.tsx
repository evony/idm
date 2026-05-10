'use client';

import { Users, Shield, Music, ChevronUp, ChevronDown, Crown, Trophy, CheckCircle2, History, Swords, Star } from 'lucide-react';
import { SectionHeader } from './shared';
import { CardSkeleton } from '../ui/skeleton';

import { ClubLogoImage } from '@/components/idm/club-logo-image';
import type { StatsData } from '@/types/stats';

interface LeagueClub {
  id: string;
  name: string;
  logo: string | null;
  bannerImage: string | null;
  wins: number;
  losses: number;
  points: number; // Tarkam points (sum of member player.points)
  malePoints: number;
  femalePoints: number;
  gameDiff: number;
  memberCount: number;
  maleMemberCount: number;
  femaleMemberCount: number;
  members: {
    id: string;
    gamertag: string;
    name: string;
    division: string;
    tier: string;
    points: number;
    role: string;
    avatar: string | null;
  }[];
}

interface ClubsSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  isDataLoading: boolean;
  cmsSections: Record<string, any>;
  leagueData: {
    hasData: boolean;
    clubs?: LeagueClub[];
    stats?: { totalClubs: number };
  } | undefined;
  setSelectedClub: (club: StatsData['clubs'][0] & { division?: string; members?: any[] } | null) => void;
  showAllClubs: boolean;
  setShowAllClubs: (show: boolean) => void;
  selectedSeasonId: string | null;
  setSelectedSeasonId: (id: string | null) => void;
  isHistorical: boolean;
}

export function ClubsSection({ maleData, femaleData, isDataLoading, cmsSections, leagueData, setSelectedClub, showAllClubs, setShowAllClubs, selectedSeasonId, setSelectedSeasonId, isHistorical }: ClubsSectionProps) {
  // Get Tarkam season champions from allSeasons data (not from Liga)
  const seasonChampions = [
    ...(maleData?.allSeasons || []),
    ...(femaleData?.allSeasons || []),
  ]
    .filter(s => s.status === 'completed' && s.championClub)
    .map(s => ({ ...s.championClub!, seasonNumber: s.number, division: s.name.toLowerCase().includes('female') ? 'female' as const : 'male' as const }))
    // Deduplicate by composite key (same club can champion both divisions)
    .filter((ch, idx, arr) => arr.findIndex(c => `${c.id}-${c.division}-S${c.seasonNumber}` === `${ch.id}-${ch.division}-S${ch.seasonNumber}`) === idx);

  // ── Season Selector Data ──
  // Merge unique seasons from both divisions (deduplicate by season number)
  const allSeasons = maleData?.allSeasons || femaleData?.allSeasons || [];
  const uniqueSeasonNumbers = [...new Set(allSeasons.map(s => s.number))];
  const seasonsForSelector = uniqueSeasonNumbers.map(num => {
    const maleSeason = allSeasons.find(s => s.number === num);
    return maleSeason!;
  }).sort((a, b) => b.number - a.number); // S2 first, S1 second

  return (<>
      {/* ========== CLUB — Premium Card Layout ========== */}
      <section id="clubs" className="landing-section relative py-16 sm:py-24 px-4 overflow-hidden bg-deep">
        {/* ── Background layers (lightweight CSS-only) ── */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Soft ambient radial glows */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 15%, rgba(212,168,83,0.07) 0%, transparent 45%), radial-gradient(ellipse at 10% 60%, rgba(46,159,255,0.04) 0%, transparent 40%), radial-gradient(ellipse at 90% 60%, rgba(255,45,120,0.04) 0%, transparent 40%)' }} />
        {/* Top edge glow */}
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(212,168,83,0.3) 30%, rgba(212,168,83,0.5) 50%, rgba(212,168,83,0.3) 70%, transparent 95%)' }} aria-hidden="true" />
        {/* Bottom edge line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="stagger-item">
            <SectionHeader icon={Swords} label={cmsSections.clubs?.subtitle || "Club Peserta"} title={cmsSections.clubs?.title || "Club"} subtitle={cmsSections.clubs?.description || "Club-club terbaik yang bertarung di arena Tarkam IDM"} />

            {/* ═══ Season Selector ═══ */}
            {seasonsForSelector.length > 1 && (
              <div className="stagger-item-fast mb-6 flex flex-col items-center gap-3" style={{ animationDelay: '30ms' }}>
                {/* Season Pills */}
                <div className="flex items-center gap-2">
                  {seasonsForSelector.map(season => {
                    const isActive = season.status === 'active';
                    const isCompleted = season.status === 'completed';
                    const isSelected = selectedSeasonId === null
                      ? isActive
                      : selectedSeasonId === season.id;

                    return (
                      <button
                        key={season.id}
                        onClick={() => {
                          if (isSelected && isActive) return;
                          setSelectedSeasonId(isActive ? null : season.id);
                        }}
                        className={`
                          inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold
                          transition-all duration-200 cursor-pointer border
                          ${isSelected
                            ? 'bg-[#d4a853]/15 border-[#d4a853]/40 text-[#d4a853] shadow-[0_0_12px_rgba(212,168,83,0.15)]'
                            : 'bg-transparent border-[#d4a853]/10 text-muted-foreground/70 hover:border-[#d4a853]/25 hover:text-[#d4a853]/60'
                          }
                        `}
                        aria-label={`Select ${season.name}`}
                        aria-pressed={isSelected}
                      >
                        <span className="font-black">S{season.number}</span>
                        {isActive && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                          </span>
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="w-3 h-3 text-[#d4a853]/60" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Historical Data Badge */}
                {isHistorical && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5">
                    <History className="w-3 h-3 text-[#d4a853]/70" />
                    <span className="text-[10px] font-bold text-[#d4a853]/70 uppercase tracking-wider">
                      Data Historis — Season {seasonsForSelector.find(s => s.id === selectedSeasonId)?.number || '?'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ═══ Tarkam Season Champion callout ═══ */}
            {seasonChampions.length > 0 && (
              <div className="stagger-item-fast mb-8" style={{ animationDelay: '60ms' }}>
                <div className="flex items-center justify-center">
                  <div className="relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#d4a853]/15 bg-[#d4a853]/5">
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.06), transparent 70%)' }} />
                    <Crown className="w-3.5 h-3.5 text-[#d4a853] relative" />
                    {seasonChampions.map((ch, i) => (
                      <span key={`${ch.id}-${ch.division}-S${ch.seasonNumber}`} className="flex items-center gap-2 relative">
                        {i > 0 && <span className="text-[10px] text-muted-foreground/40">•</span>}
                        <span className="text-[10px] font-bold text-[#d4a853]/70 uppercase tracking-wider">
                          Tarkam {ch.division === 'female' ? '♀' : '♂'} S{ch.seasonNumber} Champion
                        </span>
                        {ch.logo && (
                          <ClubLogoImage clubName={ch.name} dbLogo={ch.logo} alt={ch.name} width={20} height={20} className="w-5 h-5 rounded object-cover" />
                        )}
                        <span className="text-xs font-black text-foreground">{ch.name}</span>
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground/40 relative">•</span>
                    <span className="text-[10px] text-muted-foreground/60 relative">{leagueData?.stats?.totalClubs || (maleData?.clubs?.length || 0) + (femaleData?.clubs?.length || 0)} club bertanding</span>
                  </div>
                </div>
              </div>
            )}

            {isDataLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <CardSkeleton key={i} className="h-56" />
                ))}
              </div>
            ) : (() => {
              // For historical seasons: use clubs from stats data (snapshot)
              // For active season: use clubs from league data (live)
              // Build club list — deduplicate by ID since same ClubProfile can appear in both divisions
              const leagueClubs = isHistorical
                ? [
                    ...(maleData?.clubs || []).map((c, i) => ({ ...c, memberCount: c._count?.members || 0, maleMemberCount: (c as any).maleCount || 0, femaleMemberCount: (c as any).femaleCount || 0, malePoints: (c as any).malePoint || 0, femalePoints: (c as any).femalePoint || 0, members: [], _key: `m-${c.id}-${i}` })),
                    ...(femaleData?.clubs || []).map((c, i) => ({ ...c, memberCount: c._count?.members || 0, maleMemberCount: (c as any).maleCount || 0, femaleMemberCount: (c as any).femaleCount || 0, malePoints: (c as any).femalePoint || 0, femalePoints: (c as any).femalePoint || 0, members: [], _key: `f-${c.id}-${i}` })),
                  ].filter((club, idx, arr) => arr.findIndex(c => c.id === club.id) === idx)  // Dedupe by ID (ClubProfile.id or Club.id)
                : (leagueData?.clubs || []).map((c, i) => ({ ...c, _key: `l-${c.id}-${i}` }));
              const sortedClubs = [...leagueClubs].sort((a, b) => isHistorical ? ((a as any).rank ?? 999) - ((b as any).rank ?? 999) || b.points - a.points : a.name.localeCompare(b.name));

              return (
                <>
                  {sortedClubs.length === 0 ? null : (
                    <>
                      {/* Club Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {(showAllClubs ? sortedClubs : sortedClubs.slice(0, 10)).map((club, idx) => {
                          const isChampion = seasonChampions.some(ch => ch.name === club.name);
                          const maleMembers = club.maleMemberCount || club.members?.filter(m => m.division === 'male').length || 0;
                          const femaleMembers = club.femaleMemberCount || club.members?.filter(m => m.division === 'female').length || 0;
                          const hiddenOnMobile = !showAllClubs && idx >= 6;
                          return (
                            <div
                              key={club._key || `${club.id}-${idx}`}
                              className={`stagger-item-fast cursor-pointer group/club ${hiddenOnMobile ? 'hidden sm:block' : ''}`}
                              style={{ animationDelay: `${idx * 30}ms` }}
                              onClick={() => setSelectedClub({
                                id: club.id,
                                name: club.name,
                                logo: club.logo,
                                wins: club.wins,
                                losses: club.losses,
                                points: club.points,
                                gameDiff: club.gameDiff,
                                _count: { members: club.memberCount },
                                members: club.members?.map(m => ({
                                  id: m.id,
                                  name: m.name,
                                  gamertag: m.gamertag,
                                  avatar: m.avatar,
                                  tier: m.tier,
                                  points: m.points,
                                })),
                              })}
                            >
                              <div className={`ios-club-card club-card-shimmer relative bg-mid text-center transition-all duration-300 overflow-hidden ${
                                isChampion ? 'border-[rgba(212,168,83,0.30)] ios-card-featured' : ''
                              }`}>
                                {/* ── iOS Gold accent line at top ── */}
                                <div className="ios-gold-line" />

                                {/* ── Champion card inner glow ── */}
                                {isChampion && (
                                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.06) 0%, transparent 60%)' }} />
                                )}

                                {/* ── Logo watermark background ── */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] group-hover/club:opacity-[0.10] transition-opacity duration-500 pointer-events-none">
                                  <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt="" width={200} height={200} className="w-[80%] h-auto aspect-square object-contain" />
                                </div>

                                {/* ── Card content ── */}
                                <div className="relative z-10 flex flex-col items-center px-4 pt-8 pb-5">
                                  {/* Large centered logo with glow ring */}
                                  <div className="relative mb-4">
                                    {/* Outer glow ring — single layer for performance */}
                                    <div className="absolute -inset-1.5 rounded-3xl transition-all duration-500" style={{
                                      background: isChampion
                                        ? 'linear-gradient(135deg, rgba(212,168,83,0.3), rgba(212,168,83,0.08))'
                                        : 'linear-gradient(135deg, rgba(212,168,83,0.12), rgba(212,168,83,0.03))',
                                      boxShadow: isChampion
                                        ? '0 0 20px rgba(212,168,83,0.2)'
                                        : '0 0 10px rgba(212,168,83,0.08)',
                                    }} />
                                    {/* Logo container */}
                                    <div className="club-logo-container relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-mid border-2 border-[#d4a853]/20 flex items-center justify-center group-hover/club:scale-105 group-hover/club:border-[#d4a853]/40 transition-all duration-500">
                                      <ClubLogoImage clubName={club.name} dbLogo={club.logo} alt={club.name} fill sizes="96px" className="object-cover" />
                                    </div>
                                    {/* Season champion badge */}
                                    {isChampion && (
                                      <div className="absolute -top-2 -right-2 z-20 min-w-[24px] h-[24px] rounded-full flex items-center justify-center border-2 border-mid" style={{
                                        background: 'linear-gradient(135deg, #d4a853, #f5d77a)',
                                        boxShadow: '0 0 12px rgba(212,168,83,0.4)',
                                      }}>
                                        <Crown className="w-2.5 h-2.5 text-mid" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Club name */}
                                  <p className={`text-sm font-black truncate max-w-full transition-colors duration-200 ios-heading ${
                                    isChampion ? 'text-[#d4a853] dark:text-[#d4a853] text-idm-gold-warm' : 'text-white dark:text-white text-foreground group-hover/club:text-[#d4a853]'
                                  }`}>{club.name}</p>

                                  {/* Champion label */}
                                  {isChampion && (
                                    <div className="mt-1 flex items-center gap-1">
                                      <Star className="w-2.5 h-2.5 text-[#d4a853]/60" />
                                      <span className="text-[9px] font-bold text-[#d4a853]/60 uppercase tracking-wider">Champion S{seasonChampions.find(ch => ch.name === club.name)?.seasonNumber ?? 1}</span>
                                    </div>
                                  )}

                                  {/* Rank badge for historical data */}
                                  {isHistorical && (club as any).rank && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4a853]/10 text-[#d4a853] border border-[#d4a853]/15">
                                        #{(club as any).rank}
                                      </span>
                                    </div>
                                  )}

                                  {/* Division badges */}
                                  <div className="flex items-center justify-center gap-1.5 mt-2.5">
                                    {maleMembers > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E9FFF]/10 text-[#57B5FF] border border-[#2E9FFF]/15">
                                        <Music className="w-2.5 h-2.5" />{maleMembers} Male
                                      </span>
                                    )}
                                    {femaleMembers > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF2D78]/10 text-[#FF5C9A] border border-[#FF2D78]/15">
                                        <Shield className="w-2.5 h-2.5" />{femaleMembers} Fem
                                      </span>
                                    )}
                                  </div>

                                  {/* Member count & Tarkam points */}
                                  <div className="mt-2 flex items-center justify-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3 text-muted-foreground/50" />
                                      <span className="text-[10px] text-muted-foreground/60 font-medium">{club.memberCount || (('_count' in club) && (club as { _count: { members: number } })._count.members) || 0} anggota</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Trophy className="w-3 h-3 text-[#d4a853]/50" />
                                      <span className="text-[10px] text-[#d4a853]/70 font-bold">{club.points.toLocaleString('id-ID')} pts</span>
                                    </div>
                                  </div>
                                </div>

                                {/* ── Bottom accent line (subtle) ── */}
                                <div className="absolute bottom-0 left-[15%] right-[15%] h-px opacity-0 group-hover/club:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.2), transparent)' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Show More/Less Button */}
                      {sortedClubs.length > 6 && (
                        <div className="flex justify-center mt-8">
                          <button
                            onClick={() => setShowAllClubs(!showAllClubs)}
                            className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5 text-[#d4a853] text-xs font-semibold transition-all duration-300 hover:bg-[#d4a853]/10 hover:border-[#d4a853]/30 hover:shadow-[0_0_20px_rgba(212,168,83,0.1)] cursor-pointer"
                          >
                            {showAllClubs ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Tampilkan Lebih Sedikit
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Lihat Semua ({sortedClubs.length} Club)
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </section>
  </>);
}
