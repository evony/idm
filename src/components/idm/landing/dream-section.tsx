'use client';

import { useState, useEffect } from 'react';
import { Trophy, Shield, Users, Flame, Gift, Swords, Crown, Sparkles, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClubLogoImage } from '@/components/idm/club-logo-image';
import type { StatsData } from '@/types/stats';

interface DreamSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  nextSeason: number;
  completedSeason: number;
  cmsSections: Record<string, any>;
  cmsSettings: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  openDonationModal: (type: 'weekly' | 'season', amount?: number) => void;
  onVideoPlay?: (url: string, title: string) => void;
}

export function DreamSection({ maleData, femaleData, leagueData, nextSeason, completedSeason, cmsSections, cmsSettings, onEnterApp, openDonationModal, onVideoPlay }: DreamSectionProps) {
  // Countdown timer
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const targetDate = cmsSettings?.countdown_target_date;
    if (!targetDate || !cmsSettings?.countdown_label) return;

    const target = new Date(targetDate).getTime();
    if (target <= Date.now()) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown(null);
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [cmsSettings?.countdown_target_date, cmsSettings?.countdown_label]);

  // Manual CMS values with fallback to auto-calculated data
  const clubsCompeting = cmsSettings?.dream_clubs_competing ? parseInt(cmsSettings.dream_clubs_competing) : (leagueData?.stats?.totalClubs || 0);
  const matchesPlayed = cmsSettings?.dream_matches_played ? parseInt(cmsSettings.dream_matches_played) : (leagueData?.stats?.completedMatches || 0);
  const totalParticipants = cmsSettings?.dream_total_participants ? parseInt(cmsSettings.dream_total_participants) : ((maleData?.totalPlayers || 0) + (femaleData?.totalPlayers || 0));

  // Helper to replace template variables in CMS text
  const replaceVars = (text: string) => text
    .replace(/\{season\}/g, String(completedSeason))
    .replace(/\{champion\}/g, leagueData?.tarkamChampion?.name || 'Champion')
    .replace(/\{clubs\}/g, String(clubsCompeting))
    .replace(/\{matches\}/g, String(matchesPlayed))
    .replace(/\{participants\}/g, String(totalParticipants));

  // CMS settings for Dream section text
  const dreamDescCompleted = cmsSettings?.dream_description_completed
    ? replaceVars(cmsSettings.dream_description_completed)
    : `Season ${completedSeason} telah berlangsung dengan meriah — ${leagueData?.tarkamChampion?.name || 'Champion'} tampil sebagai champion. ${clubsCompeting} club bertanding, peserta bebas mix dari Tarkam male dan female. Season ${nextSeason} menunggu dukunganmu untuk terwujud.`;

  const dreamDescActive = cmsSettings?.dream_description_active
    ? replaceVars(cmsSettings.dream_description_active)
    : `${clubsCompeting} club bertanding, peserta bebas mix dari Tarkam male dan female di Tarkam IDM. Dukunganmu menunggu season berikutnya terwujud.`;

  const dreamSeasonNextText = cmsSettings?.dream_season_next_text
    ? replaceVars(cmsSettings.dream_season_next_text)
    : `Season ${leagueData?.tarkamChampion?.seasonNumber || 1} sudah terbukti — champion dinobatkan, club bertanding. Season ${nextSeason} butuh dukunganmu untuk terwujud. Setiap kontribusi membawa kita lebih dekat.`;

  return (<>
      {/* ========== TARKAM IDM — THE DREAM ========== */}
      <section id="dream" className="relative py-16 sm:py-28 px-4 overflow-hidden bg-deep">
        {/* Gold dot pattern */}
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.07) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(46,159,255,0.03) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(255,45,120,0.03) 0%, transparent 40%)' }} />
        {/* Ambient orbs */}
        <div className="ambient-light" style={{ top: '20%', right: '15%', animationDuration: '20s' }} />
        <div className="ambient-light" style={{ bottom: '30%', left: '10%', animationDuration: '18s', animationDelay: '-6s' }} />

        {/* Decorative ring */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#d4a853]/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-[#d4a853]/8" />
        </div>

        <div
          className="stagger-item relative z-10 max-w-3xl mx-auto text-center"
        >
          <div className="stagger-item-fast stagger-d0">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#d4a853]/50" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5">
                <Trophy className="w-4 h-4 text-[#d4a853]" />
                <span className="text-[11px] font-bold text-[#d4a853] uppercase tracking-widest">Tarkam IDM</span>
              </div>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#d4a853]/50" />
            </div>
          </div>
          <h2 className="stagger-item-fast stagger-d1 text-4xl sm:text-7xl font-black text-gradient-champion leading-none">
            The Dream
          </h2>
          <p className="stagger-item-fast stagger-d2 text-sm text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">
            {leagueData?.tarkamChampion && leagueData.tarkamChampion.seasonNumber !== 1
              ? dreamDescCompleted
              : dreamDescActive
            }
          </p>

          {/* Champion Highlight Card */}
          {leagueData?.tarkamChampion && leagueData.tarkamChampion.seasonNumber !== 1 && (
            <div className="stagger-item-fast mt-6" style={{ animationDelay: '120ms' }}>
              <div className="inline-flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-[#d4a853]/20 bg-mid">
                <div className="relative">
                  <ClubLogoImage clubName={leagueData.tarkamChampion.name} dbLogo={leagueData.tarkamChampion.logo} alt={leagueData.tarkamChampion.name} width={40} height={40} className="w-10 h-10 rounded-2xl object-cover border border-[#d4a853]/30" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#d4a853] flex items-center justify-center">
                    <Crown className="w-3 h-3 text-deep" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xs text-[#d4a853]/60 font-semibold uppercase tracking-wider">Season {leagueData.tarkamChampion.seasonNumber} Champion</p>
                  <p className="text-lg font-black text-foreground">{leagueData.tarkamChampion.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Season Highlights — Card-based grid */}
          <div className="stagger-item-fast mt-10 grid grid-cols-3 gap-3 sm:gap-4" style={{ animationDelay: '180ms' }}>
            {[
              { icon: Shield, value: `${clubsCompeting}`, label: 'Club Bertanding', accent: 'border-[#d4a853]/15' },
              { icon: Swords, value: `${matchesPlayed}`, label: 'Match Dimainkan', accent: 'border-[#d4a853]/10' },
              { icon: Users, value: `${totalParticipants}`, label: 'Peserta Total', accent: 'border-[#d4a853]/15' },
            ].map((s, i) => (
              <div key={s.label} className={`relative rounded-2xl bg-mid border ${s.accent} p-4 sm:p-5 transition-all duration-300 hover:bg-mid/80 hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(212,168,83,0.08)] group/stat`}>
                {/* Subtle radial glow behind icon */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.05), transparent 70%)' }} />
                <s.icon className="w-4 h-4 text-[#d4a853] mx-auto mb-2 relative z-10 group-hover/stat:scale-110 transition-transform duration-300" />
                <p className="text-lg sm:text-2xl font-black text-foreground truncate relative z-10 stat-count-up">{s.value}</p>
                <p className="text-[10px] sm:text-[10px] text-muted-foreground/80 uppercase tracking-wider mt-1 relative z-10">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Countdown Timer — Gold accents */}
          {countdown && cmsSettings?.countdown_label && (
            <div className="stagger-item-fast mt-8" style={{ animationDelay: '240ms' }}>
              <div className="rounded-2xl border border-[#d4a853]/20 bg-mid p-5 sm:p-6 text-center">
                <p className="text-xs text-[#d4a853]/70 font-bold uppercase tracking-widest mb-4">{cmsSettings.countdown_label}</p>
                <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                  {[
                    { value: countdown.days, label: 'Hari' },
                    { value: countdown.hours, label: 'Jam' },
                    { value: countdown.minutes, label: 'Menit' },
                    { value: countdown.seconds, label: 'Detik' },
                  ].map((unit, i) => (
                    <div key={unit.label} className="flex items-center gap-1.5 sm:gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl bg-[#d4a853]/10 border border-[#d4a853]/20 flex items-center justify-center">
                          <span className="text-lg sm:text-2xl font-black text-[#d4a853] tabular-nums">{String(unit.value).padStart(2, '0')}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-1">{unit.label}</span>
                      </div>
                      {i < 3 && (
                        <span className="text-[#d4a853]/40 font-bold text-base sm:text-xl mb-4">:</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tarkam IDM Season Next — Call for Support */}
          <div className="stagger-item-fast mt-8" style={{ animationDelay: '300ms' }}>
            <div className="rounded-2xl border border-[#d4a853]/15 bg-mid p-5 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-[#d4a853]" />
                <h4 className="text-sm font-bold text-[#d4a853]">Tarkam IDM Season {nextSeason}</h4>
                <Badge className="bg-yellow-500/10 text-yellow-500 text-[10px] border-0">Menunggu</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                {dreamSeasonNextText}
              </p>
            </div>
          </div>

          <div className="stagger-item-fast mt-8" style={{ animationDelay: '360ms' }}>
            <button onClick={() => openDonationModal('season')} className="hover-scale-md group/donate relative px-7 py-4 rounded-2xl bg-gradient-to-r from-[#d4a853] to-[#e8d5a3] text-deep font-black text-sm tracking-wider shadow-[0_0_30px_rgba(212,168,83,0.2)] hover:shadow-[0_0_60px_rgba(212,168,83,0.4)] transition-all cursor-pointer overflow-hidden">
              {/* Animated shimmer sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover/donate:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Gift className="w-4 h-4 inline mr-2 relative z-10" />
              <span className="relative z-10">Dukung Tarkam IDM Season {nextSeason}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========== CTA — Premium Card-based Design ========== */}
      <section className="relative py-16 sm:py-24 px-4 overflow-hidden bg-deep">
        {/* Gold dot pattern */}
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.06) 0%, transparent 50%)' }} />

        {/* Animated floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[#d4a853]/20"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `float-particle ${8 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * -1.5}s`,
              }}
            />
          ))}
        </div>

        {/* Decorative corner accents */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-[#d4a853]/10 rounded-tl-xl" />
          <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-[#d4a853]/10 rounded-tr-xl" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-[#d4a853]/10 rounded-bl-xl" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-[#d4a853]/10 rounded-br-xl" />
        </div>

        <div
          className="stagger-item relative z-10 max-w-lg mx-auto text-center"
        >
          <div className="animate-fade-enter">
            <div
              className="animate-float-medium inline-block mb-4"
            >
              <Sparkles className="w-10 h-10 text-[#d4a853]" />
            </div>
          </div>
          <h2 className="stagger-item-fast stagger-d0 text-3xl sm:text-5xl font-black text-gradient-champion mb-3">
            {cmsSections.cta?.title || 'Punya Skill? Buktikan.'}
          </h2>
          <p className="stagger-item-fast stagger-d1 text-sm text-muted-foreground mb-8">
            {cmsSections.cta?.description || 'Daftar sekarang dan tunjukkan siapa dancer terbaik.'}
          </p>
          <div className="stagger-item-fast stagger-d2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="hover-scale-md">
              <Button
                size="lg"
                className="w-full sm:w-auto btn-male px-6 py-4 sm:px-8 sm:py-6 text-xs sm:text-sm font-bold rounded-2xl transition-all"
                onClick={() => onEnterApp('male')}
              >
                Male Tarkam <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
            <div className="hover-scale-md">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto btn-female px-6 py-4 sm:px-8 sm:py-6 text-xs sm:text-sm font-bold rounded-2xl transition-all"
                onClick={() => onEnterApp('female')}
              >
                Female Tarkam <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

  </>);
}
