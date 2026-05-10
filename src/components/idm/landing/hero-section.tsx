'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Zap, Star, Eye, ArrowRight, Flame, Users, Trophy, Swords } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — TARKAM ARENA HERO
   International esports tournament aesthetic
   Inspired by Valorant Champions / LoL Worlds / BLAST Premier
   Performance-optimized for mid-range devices
   ═══════════════════════════════════════════════════════════════ */

interface HeroSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onEnterCommunity: () => void;
  onRegister: (division: 'male' | 'female') => void;
  onViewBracket: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
  /** True when showing stale data from a previous season during a season switch.
   *  Used to show skeleton instead of old champion avatar. */
  isSeasonDataPlaceholder?: boolean;
}

/* ─── Floating Particle System — Reduced to 12 for performance ─── */
interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function useParticles(count: number): Particle[] {
  // Use seeded pseudo-random to avoid hydration mismatch (SSR vs client Math.random())
  // Round all values to 2 decimal places to prevent SSR/CSR float precision differences
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return r2(x - Math.floor(x));
  };

  return useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: r2(seededRandom(i * 4 + 1) * 100),
      size: r2(1.5 + seededRandom(i * 4 + 2) * 3),
      duration: r2(6 + seededRandom(i * 4 + 3) * 8),
      delay: r2(seededRandom(i * 4 + 4) * 6),
      opacity: r2(0.15 + seededRandom(i * 4 + 5) * 0.35),
    })),
    [count]
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HERO SECTION
   ═══════════════════════════════════════════════════════════════ */

export function HeroSection({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onEnterCommunity,
  onRegister,
  onViewBracket,
  onVideoPlay,
  isSeasonDataPlaceholder = false,
}: HeroSectionProps) {
  /* ─── Extract CMS content ─── */
  // ★ No hardcoded fallback text — SSR provides CMS data via React Query cache.
  // This prevents "stale flash" where old text appears before fresh data loads.
  const hasCms = Object.keys(cmsSettings).length > 0;
  const siteTitle = cmsSettings.site_title || 'TARKAM IDM';
  const heroTitle = cmsSettings.hero_title || '';
  const heroSubtitle = cmsSettings.hero_subtitle || '';
  const heroTagline = cmsSettings.hero_tagline || '';
  const heroBgDesktop = cmsSettings.hero_bg_desktop || '';
  const heroBgMobile = cmsSettings.hero_bg_mobile || '';
  const heroBgVideo = cmsSettings.hero_bg_video || '';

  /* ─── Bracket picker state ─── */
  const [showBracketPicker, setShowBracketPicker] = useState(false);

  /* ─── Compute stats ─── */
  const malePlayers = maleData?.totalPlayers || 0;
  const femalePlayers = femaleData?.totalPlayers || 0;
  const maleClubs = maleData?.clubs?.length || 0;
  const femaleClubs = femaleData?.clubs?.length || 0;
  const maleMatches = (maleData?.recentMatches?.length || 0) + (maleData?.upcomingMatches?.length || 0);
  const femaleMatches = (femaleData?.recentMatches?.length || 0) + (femaleData?.upcomingMatches?.length || 0);
  const totalPlayers = malePlayers + femalePlayers;
  const totalClubs = maleClubs + femaleClubs;
  const totalMatches = maleMatches + femaleMatches;

  /* ─── Particles — reduced from 28 to 12 ─── */
  const particles = useParticles(12);

  /* ─── Season Champions (latest completed season) ─── */
  const maleChampionSeason = !isSeasonDataPlaceholder ? maleData?.allSeasons?.find(s => s.status === 'completed' && s.championPlayer) : undefined;
  const femaleChampionSeason = !isSeasonDataPlaceholder ? femaleData?.allSeasons?.find(s => s.status === 'completed' && s.championPlayer) : undefined;
  const maleChampion = maleChampionSeason?.championPlayer ?? null;
  const femaleChampion = femaleChampionSeason?.championPlayer ?? null;
  const maleChampionAvatar = maleChampion ? getAvatarUrl(maleChampion.gamertag, 'male', maleChampion.avatar) : '';
  const femaleChampionAvatar = femaleChampion ? getAvatarUrl(femaleChampion.gamertag, 'female', femaleChampion.avatar) : '';
  // Club champion — prefer male season, fallback to female
  const championClub = maleChampionSeason?.championClub ?? femaleChampionSeason?.championClub ?? null;
  const hasChampions = !!(maleChampion || femaleChampion);
  // Show skeleton when data is placeholder (season switch) OR when still loading
  const showChampionSkeleton = isSeasonDataPlaceholder || (!maleData && !femaleData);
  // Gold skin visual constants for season champion avatars
  const CHAMPION_GOLD = '#d4a853';
  const maleHasSkin = maleChampion?.hasSeasonChampionSkin ?? false;
  const femaleHasSkin = femaleChampion?.hasSeasonChampionSkin ?? false;

  return (
    <>
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        aria-label="Tarkam IDM Hero"
      >
        {/* ── Animated gold line border at top ── */}
        <div className="hero-top-gold-line absolute top-0 left-0 right-0 h-[2px] z-30 pointer-events-none" aria-hidden="true" />

        {/* ── Background Layers ── */}

        {/* Base: Deep dark gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-mid) 40%, var(--background) 100%)`,
          }}
        />

        {/* CMS Video Background — takes priority over images when set */}
        {heroBgVideo ? (
          (() => {
            // Detect YouTube URL and extract video ID + optional start time
            const ytMatch = heroBgVideo.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const startTimeMatch = heroBgVideo.match(/[?&]t=(\d+)/);
            const startTime = startTimeMatch ? `&start=${startTimeMatch[1]}` : '';

            if (ytMatch) {
              // YouTube embed — autoplay, muted, loop, no controls
              return (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-0" style={{ width: '177.78vh', height: '56.25vw', minWidth: '100%', minHeight: '100%', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3${startTime}`}
                      title="Hero background video"
                      allow="autoplay; encrypted-media"
                      className="w-full h-full"
                      style={{ border: 'none', opacity: 0.3 }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            }
            // Direct video URL (MP4, WebM, etc.)
            return (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  aria-hidden="true"
                >
                  <source src={heroBgVideo} type="video/mp4" />
                  <source src={heroBgVideo} type="video/webm" />
                </video>
              </div>
            );
          })()
        ) : (
          /* Fallback: CMS Background Images (only shown when no video) */
          (heroBgDesktop || heroBgMobile) ? (
            <>
              {/* Desktop — landscape hero image */}
              {heroBgDesktop && (
                <div className="absolute inset-0 hidden sm:block">
                  <Image src={heroBgDesktop} alt="" fill priority sizes="100vw" className="object-cover opacity-80" aria-hidden="true" />
                </div>
              )}
              {/* Mobile — same desktop image, scaled to fill portrait screen height */}
              {heroBgDesktop && (
                <div className="absolute inset-0 sm:hidden">
                  <Image src={heroBgDesktop} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-80" aria-hidden="true" />
                </div>
              )}
            </>
          ) : null
        )}

        {/* Mid-depth radial gold haze */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 45%, rgba(212,168,83,0.02) 0%, transparent 65%)',
            }}
          />
        )}

        {/* Top-left cyan glow (Male) */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 15% 30%, rgba(46,159,255,0.04) 0%, transparent 50%)',
            }}
          />
        )}

        {/* Bottom-right purple glow (Female) */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 85% 70%, rgba(255,45,120,0.04) 0%, transparent 50%)',
            }}
          />
        )}

        {/* 7. Cinematic Vignette — Blue-tinted, darker edges */}
        <div className="hero-vignette-cinematic" />
        {/* Original vignette fallback for video bg */}
        {heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 20%, rgba(4,6,16,0.8) 100%)',
            }}
          />
        )}

        {/* Grid overlay — subtle esports tech feel — only when no video */}
        {!heroBgVideo && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        )}

        {/* 1. Animated Diagonal Accent Lines */}
        <div className="hero-diagonal-line hero-diagonal-line-1" aria-hidden="true" />
        <div className="hero-diagonal-line hero-diagonal-line-2" aria-hidden="true" />
        <div className="hero-diagonal-line hero-diagonal-line-3" aria-hidden="true" />

        {/* 5. Floating Geometric Accents */}
        <div className="hero-geo-accent hero-geo-diamond-1" aria-hidden="true" />
        <div className="hero-geo-accent hero-geo-diamond-2" aria-hidden="true" />
        <div className="hero-geo-accent hero-geo-hex" aria-hidden="true" />

        {/* ── Floating Particles — reduced to 12 for performance ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full hero-particle"
              style={{
                left: `${p.x}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: `radial-gradient(circle, rgba(212,168,83,${p.opacity}) 0%, rgba(212,168,83,${(p.opacity * 0.3).toFixed(2)}) 60%, transparent 100%)`,
                '--duration': `${p.duration}s`,
                '--delay': `${p.delay}s`,
                '--p-opacity': p.opacity,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* ═══════════════ HERO CONTENT ═══════════════ */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center pt-[12vh] sm:pt-[18vh] pb-20 sm:pb-24">

          {/* ── iOS Frosted Glass Badge ── */}
          <div className="hero-enter-1 mb-5 sm:mb-7">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-idm-gold-warm/50" />
              <div className="ios-badge frost-glass flex items-center gap-2 px-4 py-1.5" style={{ borderColor: 'rgba(212,168,83,0.2)', background: 'rgba(212,168,83,0.06)' }}>
                <Star className="w-3 h-3 text-idm-gold-warm/80" />
                <span className="text-[10px] sm:text-[11px] text-idm-gold-warm/80 font-bold tracking-[0.2em] uppercase">
                  {siteTitle}
                </span>
                <Star className="w-3 h-3 text-idm-gold-warm/80" />
              </div>
              <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-idm-gold-warm/50" />
            </div>
          </div>

          {/* ── Main Title — Gold gradient with dramatic letter-spacing entrance ── */}
          <div className="hero-enter-2 relative mb-3 sm:mb-4">
            {/* Subtle breathing gold glow behind title — CSS only, opacity-based for performance */}
            <div
              className="absolute inset-0 -top-8 -bottom-8 pointer-events-none hero-title-breath"
              aria-hidden="true"
            />

            <h1
              className="hero-title-entrance hero-title-glow-enhanced ios-heading relative text-5xl sm:text-6xl md:text-7xl uppercase leading-[1.05] min-h-[3.5rem]"
              style={{
                background: 'linear-gradient(135deg, #f5e6c8 0%, #d4a853 30%, #e5be4a 50%, #f5d77a 70%, #d4a853 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              {heroTitle}
            </h1>

            {/* 6. Dramatic underline with shimmer sweep */}
            <div className="hero-underline-dramatic mx-auto mt-3 sm:mt-4" style={{ width: '60%' }} />
          </div>

          {/* ── Subtitle — Clean Apple typography ── */}
          <p className="hero-enter-3 text-base sm:text-xl lg:text-2xl text-[#e8d5a3]/80 font-light tracking-widest uppercase mb-2 min-h-[1.5rem] leading-normal dark:text-[#e8d5a3]/80 text-foreground/60">
            {heroSubtitle}
          </p>

          {/* ── Tagline — Lighter weight, iOS style ── */}
          <p className="hero-enter-4 text-sm sm:text-base text-muted-foreground/70 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed dark:text-muted-foreground/70 text-muted-foreground/80">
            {heroTagline}
          </p>

          {/* ═══════════════ SEASON CHAMPION AVATARS ═══════════════ */}
          {showChampionSkeleton ? (
            /* ─── Skeleton placeholder during season switch / initial load ─── */
            <div className="hero-enter-5 flex items-center justify-center gap-4 sm:gap-8 md:gap-12 mb-8 sm:mb-10">
              {/* Male skeleton */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(46,159,255,0.3) 0%, transparent 70%)' }} />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-idm-male/10 border-2 border-idm-male/20 animate-pulse" />
                </div>
                <div className="w-16 sm:w-20 h-2.5 rounded bg-idm-male/10 animate-pulse" />
                <div className="w-12 h-1.5 rounded bg-idm-male/5 animate-pulse" />
              </div>
              {/* Club skeleton */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-idm-gold-warm/10 bg-idm-gold-warm/[0.03]">
                <div className="w-10 h-10 rounded-xl bg-idm-gold-warm/10 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="w-16 h-2 rounded bg-idm-gold-warm/10 animate-pulse" />
                  <div className="w-10 h-1.5 rounded bg-idm-gold-warm/5 animate-pulse" />
                </div>
              </div>
              {/* Female skeleton */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <div className="absolute -inset-1.5 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,45,120,0.3) 0%, transparent 70%)' }} />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-idm-female/10 border-2 border-idm-female/20 animate-pulse" />
                </div>
                <div className="w-16 sm:w-20 h-2.5 rounded bg-idm-female/10 animate-pulse" />
                <div className="w-12 h-1.5 rounded bg-idm-female/5 animate-pulse" />
              </div>
            </div>
          ) : hasChampions ? (
            /* ─── Actual champion avatars with embedded skin visual ─── */
            <div className="hero-enter-5 flex items-center justify-center gap-4 sm:gap-8 md:gap-12 mb-8 sm:mb-10">
              {/* Male Champion — Left */}
              {maleChampion && (
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <div className="relative group">
                    {/* Glow ring — division color (blue for male) */}
                    <div className="absolute -inset-1.5 rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(46,159,255,0.3) 0%, transparent 70%)' }} />
                    {/* Avatar container — always division color ring */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2" style={{
                      borderColor: 'rgba(46,159,255,0.5)',
                      boxShadow: '0 0 20px rgba(46,159,255,0.2), inset 0 0 10px rgba(46,159,255,0.1)',
                    }}>
                      <Image src={maleChampionAvatar} alt={maleChampion.gamertag} fill sizes="96px" className="object-cover" priority />
                      {/* Diamond shimmer overlay — division color */}
                      <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.15) 0%, transparent 50%, rgba(0,188,212,0.1) 100%)' }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase" style={{ color: 'rgba(46,159,255,0.9)' }}>{maleChampion.gamertag}</span>
                    <p className="text-[8px] sm:text-[10px] text-idm-gold-warm/50 font-semibold tracking-wider uppercase flex items-center justify-center gap-0.5">
                      <span>💎</span> Season Champion
                    </p>
                  </div>
                </div>
              )}

              {/* Season Club Champion Card — Horizontal: logo left, name right */}
              {maleChampion && femaleChampion && (
                <div className="flex flex-col items-center gap-1">
                  <div className="relative flex items-center gap-2 sm:gap-2.5 p-4 sm:p-5 rounded-2xl border" style={{ background: 'rgba(212,168,83,0.06)', borderColor: 'rgba(212,168,83,0.2)', boxShadow: '0 0 20px rgba(212,168,83,0.08)' }}>
                    {/* Club Logo */}
                    {championClub?.logo ? (
                      <div className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: '0 0 12px rgba(212,168,83,0.15)' }}>
                        <Image src={championClub.logo} alt={championClub.name} fill sizes="48px" className="object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,168,83,0.1)' }}>
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-idm-gold-warm/60" />
                      </div>
                    )}

                    {/* Club Name + Season label */}
                    <div className="flex flex-col">
                      <span className="text-[10px] sm:text-xs md:text-sm font-black tracking-wider uppercase text-idm-gold-warm/80 leading-tight">
                        {championClub?.name || 'Champion'}
                      </span>
                      <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold tracking-[0.15em] uppercase text-idm-gold-warm/35">
                        Season Club
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Female Champion — Right */}
              {femaleChampion && (
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <div className="relative group">
                    {/* Glow ring — division color (pink for female) */}
                    <div className="absolute -inset-1.5 rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(255,45,120,0.3) 0%, transparent 70%)' }} />
                    {/* Avatar container — always division color ring */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2" style={{
                      borderColor: 'rgba(255,45,120,0.5)',
                      boxShadow: '0 0 20px rgba(255,45,120,0.2), inset 0 0 10px rgba(255,45,120,0.1)',
                    }}>
                      <Image src={femaleChampionAvatar} alt={femaleChampion.gamertag} fill sizes="96px" className="object-cover" priority />
                      {/* Diamond shimmer overlay — division color */}
                      <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(255,45,120,0.15) 0%, transparent 50%, rgba(255,92,154,0.1) 100%)' }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase" style={{ color: 'rgba(255,45,120,0.9)' }}>{femaleChampion.gamertag}</span>
                    <p className="text-[8px] sm:text-[10px] text-idm-gold-warm/50 font-semibold tracking-wider uppercase flex items-center justify-center gap-0.5">
                      <span>💎</span> Season Champion
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* ═══════════════ CTA BUTTONS ═══════════════ */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mx-auto mb-8 sm:mb-10 ${hasChampions ? '' : 'hero-enter-5'}`}>
            {/* Masuk Arena — Primary CTA → Community Dashboard */}
            <button
              onClick={onEnterCommunity}
              className="btn-press hero-cta-breath group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-idm-gold-warm/50 focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
            >
              {/* Pulse glow ring */}
              <div className="absolute -inset-1.5 rounded-2xl animate-pulse" style={{ background: 'rgba(212,168,83,0.15)', boxShadow: '0 0 30px rgba(212,168,83,0.3)' }} />
              {/* Glow background */}
              <div className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500" style={{ background: 'rgba(212,168,83,0.25)' }} />
              <div className="relative flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #d4a853 0%, #e5be4a 50%, #f5d77a 100%)',
                  color: 'var(--bg-deep)',
                  boxShadow: '0 4px 20px rgba(212,168,83,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                <Flame className="w-4 h-4" />
                Masuk Arena
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Lihat Bracket — Secondary CTA → Bracket Picker */}
            <button
              onClick={() => setShowBracketPicker(true)}
              className="btn-press hero-cta-breath group relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-idm-gold-warm/50 focus-visible:ring-offset-2 focus-visible:ring-offset-deep"
            >
              {/* Glow on hover */}
              <div className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" style={{ background: 'rgba(212,168,83,0.15)' }} />
              <div className="relative flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl font-bold text-sm tracking-wide uppercase border transition-all duration-300"
                style={{
                  background: 'rgba(212,168,83,0.08)',
                  borderColor: 'rgba(212,168,83,0.3)',
                  color: '#d4a853',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(212,168,83,0.1)',
                }}
              >
                <Eye className="w-4 h-4" />
                Lihat Bracket
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* 3. iOS Frosted Glass Stats Counter Bar */}
          <div className="ios-hero-stats mt-6 sm:mt-8 mx-auto max-w-md px-6 py-3">
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-idm-gold-warm/50" />
                <span className="text-sm font-bold text-idm-gold-warm/80 tabular-nums">{totalPlayers}</span>
                <span className="text-[10px] text-idm-gold-warm/40 uppercase tracking-wider font-semibold">Pemain</span>
              </div>
              <div className="hero-stats-dot" />
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-idm-gold-warm/50" />
                <span className="text-sm font-bold text-idm-gold-warm/80 tabular-nums">{totalClubs}</span>
                <span className="text-[10px] text-idm-gold-warm/40 uppercase tracking-wider font-semibold">Club</span>
              </div>
              <div className="hero-stats-dot" />
              <div className="flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-idm-gold-warm/50" />
                <span className="text-sm font-bold text-idm-gold-warm/80 tabular-nums">{totalMatches}</span>
                <span className="text-[10px] text-idm-gold-warm/40 uppercase tracking-wider font-semibold">Match</span>
              </div>
            </div>
          </div>

          {/* ═══════════════ BRACKET DIVISION PICKER ═══════════════ */}
          <div className="relative w-full max-w-sm mx-auto" style={{ minHeight: 0 }}>
            <div
              className={`${showBracketPicker ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 ease-out`}
              aria-hidden={!showBracketPicker}
            >
            <div className="mb-8 sm:mb-10" style={{ animation: 'reveal-fade-up 0.25s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div className="relative rounded-2xl border border-idm-gold-warm/20 bg-mid/95 p-4 sm:p-6 shadow-2xl">
                  {/* Close hint */}
                  <button
                    onClick={() => setShowBracketPicker(false)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close picker"
                  >
                    ✕
                  </button>

                  <p className="text-xs text-idm-gold-warm/70 uppercase tracking-wider font-bold text-center mb-3">Pilih Divisi</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Male — CSS transitions instead of JS style manipulation */}
                    <button
                      onClick={() => { setShowBracketPicker(false); onViewBracket('male'); }}
                      className="btn-press bracket-picker-male group relative flex flex-col items-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(46,159,255,0.15)' }}>
                        <Zap className="w-5 h-5 text-idm-male" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-idm-male">Male</span>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{malePlayers} Players</p>
                      </div>
                    </button>

                    {/* Female — CSS transitions instead of JS style manipulation */}
                    <button
                      onClick={() => { setShowBracketPicker(false); onViewBracket('female'); }}
                      className="btn-press bracket-picker-female group relative flex flex-col items-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,45,120,0.15)' }}>
                        <Star className="w-5 h-5 text-idm-female" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-idm-female">Female</span>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{femalePlayers} Players</p>
                      </div>
                    </button>
                  </div>
              </div>
            </div>
            </div>
          </div>


        </div>

        {/* 4. Premium Scroll Indicator — Mouse icon + pulsing line */}
        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-10" style={{ animation: 'reveal-fade-up 0.5s 2s cubic-bezier(0.16,1,0.3,1) both' }} aria-hidden="true">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] text-idm-gold-warm/40 uppercase tracking-[0.2em] font-semibold">Explore</span>
            <div className="hero-scroll-mouse">
              <div className="hero-scroll-mouse-dot" />
            </div>
          </div>
        </div>

        {/* Bottom fade gradient to next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, var(--background), transparent)',
          }}
        />
      </section>


    </>
  );
}
