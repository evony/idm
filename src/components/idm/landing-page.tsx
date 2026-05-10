'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { useCrossTabInvalidation } from '@/lib/cross-tab-sync';
import { usePusherRealtime } from '@/hooks/use-pusher';

import Image from 'next/image';
import { Crown, Trophy, Swords, Music, LogIn, UserCircle, LogOut, Shield, Play } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { StatsData } from '@/types/stats';

// Section components
import { HeroSection } from './landing/hero-section';
import { HighlightsSection } from './landing/highlights-section';
import { ExperiencesSection } from './landing/experiences-section';
import { TournamentHub } from './landing/tournament-hub';
import { ClubsSection } from './landing/clubs-section';
import { PlayersSection } from './landing/players-section';
import { SeasonChampionSection } from './landing/season-champion-section';
import { CTASection } from './landing/cta-section';
import { LandingFooter } from './landing/landing-footer';

// Shared hooks & components
import { useSwipeNavigation, useScrollReveal, useParallax, SectionDivider } from './landing/shared';

// Modal & utility components
import { PlayerProfile } from './player-profile';
import { ClubProfile } from './club-profile';
import { RegistrationModal } from './registration-modal';
import { VideoModal } from './video-modal';
import { UnifiedLoginModal } from './unified-login-modal';
import { BackToTop } from './ui/back-to-top';
import { ScrollProgress } from './ui/scroll-progress';

/* ═══ Landing Auth Button — Desktop Header ═══
   Compact login button for the landing page header.
   - Not logged in: Shows "Login" with icon
   - Logged in as player: Shows avatar + gamertag
   - Logged in as admin: Shows shield icon + username
   - Click: Opens login modal or shows logout dropdown
*/
function LandingAuthButton({
  onOpenLogin,
  onLogout,
  scrolled,
}: {
  onOpenLogin: (tab: 'peserta' | 'admin') => void;
  onLogout: () => void;
  scrolled: boolean;
}) {
  const { adminAuth, playerAuth } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);

  const isLoggedIn = adminAuth.isAuthenticated || playerAuth.isAuthenticated;
  const displayName = adminAuth.isAuthenticated
    ? adminAuth.admin?.username
    : playerAuth.isAuthenticated
      ? playerAuth.account?.player?.gamertag
      : null;
  const isPlayer = playerAuth.isAuthenticated;
  const isAdmin = adminAuth.isAuthenticated;

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => setShowMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showMenu]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onOpenLogin('peserta')}
          aria-label="Login akun"
          className={`btn-press relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border active:scale-95 ${
            scrolled
              ? 'border-idm-gold-warm/25 text-idm-gold-warm hover:bg-idm-gold-warm/10 hover:border-idm-gold-warm/40'
              : 'border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Login</span>
        </button>
        {/* Admin login shortcut — subtle */}
        <button
          onClick={() => onOpenLogin('admin')}
          aria-label="Admin login"
          className={`btn-press p-1 rounded-md transition-all duration-200 cursor-pointer opacity-50 hover:opacity-100 ${
            scrolled ? 'text-idm-gold-warm/70 hover:text-idm-gold-warm' : 'text-white/50 hover:text-white/90'
          }`}
          title="Login Admin"
        >
          <Shield className="w-3.5 h-3.5 text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        aria-label="User menu"
        className={`btn-press flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer border active:scale-95 ${
          scrolled
            ? 'border-idm-gold-warm/20 bg-idm-gold-warm/5 hover:bg-idm-gold-warm/10'
            : 'border-white/15 bg-white/5 hover:bg-white/10'
        }`}
      >
        {/* Avatar */}
        {isPlayer && playerAuth.account?.player?.avatar ? (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden ring-1 ring-idm-gold-warm/30">
            <Image
              src={playerAuth.account.player.avatar}
              alt={displayName || ''}
              width={24}
              height={24}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : isAdmin ? (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-idm-gold-warm/20 flex items-center justify-center ring-1 ring-idm-gold-warm/40 shadow-[0_0_6px_rgba(212,168,83,0.15)]">
            <Shield className="w-3.5 h-3.5 text-idm-gold-warm drop-shadow-[0_0_3px_rgba(212,168,83,0.4)]" />
          </div>
        ) : (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted/30 flex items-center justify-center ring-1 ring-idm-gold-warm/30">
            <UserCircle className="w-3 h-3 text-idm-gold-warm" />
          </div>
        )}
        <span className={`text-[10px] sm:text-xs font-semibold max-w-[60px] sm:max-w-[80px] truncate ${
          scrolled ? 'text-idm-gold-warm' : 'text-white/80'
        }`}>
          {displayName}
        </span>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-idm-gold-warm/15 bg-background/98 backdrop-blur-xl shadow-xl shadow-black/30 overflow-hidden z-[60]">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-idm-gold-warm/10 bg-idm-gold-warm/[0.03]">
            <p className="text-xs font-bold text-[#f5f0e8] truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isAdmin ? `Admin · ${adminAuth.admin?.role}` : isPlayer ? `Peserta · ${playerAuth.account?.player?.division === 'male' ? '♂ Male' : '♀ Female'}` : ''}
            </p>
          </div>
          {/* Actions */}
          <div className="p-1.5">
            {isAdmin && (
              <button
                onClick={() => { setShowMenu(false); useAppStore.getState().setCurrentView('admin'); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground hover:text-idm-gold-warm hover:bg-idm-gold-warm/5 rounded-lg transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-idm-gold-warm" /> Admin Panel
              </button>
            )}
            {isPlayer && (
              <button
                onClick={() => { setShowMenu(false); useAppStore.getState().setCurrentView('dashboard'); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground hover:text-idm-gold-warm hover:bg-idm-gold-warm/5 rounded-lg transition-colors cursor-pointer"
              >
                <UserCircle className="w-3.5 h-3.5" /> Dashboard
              </button>
            )}
            <button
              onClick={() => { setShowMenu(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LandingPage() {
  const { setCurrentView, setDivision, setInitialDashboardTab } = useAppStore();
  const [selectedPlayerRaw, setSelectedPlayerRaw] = useState<StatsData['topPlayers'][0] & { division?: string } | null>(null);
  const [preferredSkinType, setPreferredSkinType] = useState<string | null>(null);
  // Wrapper: always clear preferredSkinType when selecting from non-MVP contexts
  // The HighlightsSection MVP card calls setPreferredSkinType('mvp') AFTER setSelectedPlayer
  // to override this clearing, so MVP context is preserved.
  const setSelectedPlayer = useCallback((player: typeof selectedPlayerRaw) => {
    setSelectedPlayerRaw(player);
    setPreferredSkinType(null);
  }, []);
  const selectedPlayer = selectedPlayerRaw;
  const [selectedClub, setSelectedClub] = useState<(StatsData['clubs'][0] & { division?: string }) | null>(null);
  const [showAllClubs, setShowAllClubs] = useState(false);
  const [showAllMalePlayers, setShowAllMalePlayers] = useState(false);
  const [showAllFemalePlayers, setShowAllFemalePlayers] = useState(false);

  /* Season Selector State — null = active season */
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  /* Registration Modal State */
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrationDefaultDivision, setRegistrationDefaultDivision] = useState<'male' | 'female'>('male');

  /* Login Modal State */
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginDefaultTab, setLoginDefaultTab] = useState<'peserta' | 'admin'>('peserta');

  /* Video Modal State */
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState('');
  const [videoModalTitle, setVideoModalTitle] = useState('');

  const openVideoModal = useCallback((url: string, title: string) => {
    setVideoModalUrl(url);
    setVideoModalTitle(title);
    setVideoModalOpen(true);
  }, []);

  /* Cross-tab cache sync — invalidates when admin updates logo/banner in another tab */
  useCrossTabInvalidation();
  usePusherRealtime(); // Enable real-time Pusher updates on landing page

  /* Fast tournament status — lightweight query for registration button (loads in <100ms) */
  const { data: tournamentStatus } = useQuery<{
    male: { tournamentId: string | null; status: string | null; name: string | null; weekNumber: number | null; isRegistrationOpen: boolean };
    female: { tournamentId: string | null; status: string | null; name: string | null; weekNumber: number | null; isRegistrationOpen: boolean };
  }>({
    queryKey: ['tournament-status'],
    queryFn: async () => {
      const res = await fetch('/api/tournament-status');
      if (!res.ok) return { male: { tournamentId: null, status: null, name: null, weekNumber: null, isRegistrationOpen: false }, female: { tournamentId: null, status: null, name: null, weekNumber: null, isRegistrationOpen: false } };
      return res.json();
    },
    staleTime: 15000, // 15s — fast refresh since this is a lightweight query
    refetchInterval: 30000, // 30s polling
    refetchOnWindowFocus: true,
    gcTime: 60000,
  });

  /* Data Queries — 1min polling, CDN-cached */
  const { data: maleData, isLoading: isMaleLoading, isFetching: isMaleFetching, isPlaceholderData: isMalePlaceholder } = useQuery<StatsData>({
    queryKey: ['stats', 'male', selectedSeasonId],
    queryFn: async () => {
      const url = `/api/stats?division=male${selectedSeasonId ? `&seasonId=${selectedSeasonId}` : ''}`;
      const res = await fetch(url); return res.json();
    },
    staleTime: 30000, // 30s — faster refresh for champion data
    refetchInterval: 60000, // 1min polling — reduced from 2min for faster recovery
    refetchOnWindowFocus: true,
    gcTime: 300000,
    placeholderData: (prev) => prev, // keep previous data during refetch/season switch — prevents FOUC
  });

  const { data: femaleData, isLoading: isFemaleLoading, isFetching: isFemaleFetching, isPlaceholderData: isFemalePlaceholder } = useQuery<StatsData>({
    queryKey: ['stats', 'female', selectedSeasonId],
    queryFn: async () => {
      const url = `/api/stats?division=female${selectedSeasonId ? `&seasonId=${selectedSeasonId}` : ''}`;
      const res = await fetch(url); return res.json();
    },
    staleTime: 30000, // 30s — faster refresh for champion data
    refetchInterval: 60000, // 1min polling — reduced from 2min for faster recovery
    refetchOnWindowFocus: true,
    gcTime: 300000,
    placeholderData: (prev) => prev, // keep previous data during refetch/season switch — prevents FOUC
  });

  const isDataLoading = isMaleLoading || isFemaleLoading;
  // isSeasonSwitching: data exists (not initial load) but fetching new season data
  const isSeasonSwitching = !isDataLoading && (isMaleFetching || isFemaleFetching);
  // isSeasonDataPlaceholder: true when showing OLD season data during a season switch
  // Used by Hero & SeasonChampion sections to show skeleton instead of stale champion
  const isSeasonDataPlaceholder = isMalePlaceholder || isFemalePlaceholder;

  // Derived: registration open state — use fast tournament-status as fallback when full stats data is still loading
  // This ensures the "Daftar" button responds quickly without waiting for the heavy /api/stats response
  const maleRegOpen = maleData?.activeTournament?.status === 'registration' || maleData?.activeTournament?.status === 'approval' || tournamentStatus?.male?.isRegistrationOpen || false;
  const femaleRegOpen = femaleData?.activeTournament?.status === 'registration' || femaleData?.activeTournament?.status === 'approval' || tournamentStatus?.female?.isRegistrationOpen || false;

  const { data: cmsData } = useQuery({
    queryKey: ['cms-content'],
    queryFn: async () => {
      const res = await fetch('/api/cms/content');
      if (!res.ok) return { settings: {}, sections: {} };
      return res.json();
    },
    staleTime: 120000, // CMS changes rarely — 2min stale is fine
    refetchInterval: 300000, // 5min polling — CMS data barely changes
    refetchOnWindowFocus: true,
    gcTime: 300000,
  });

  const { data: leagueData } = useQuery<{ hasData: boolean; preSeason?: boolean; reason?: string; season?: { id: string; name: string; number: number }; tarkamChampion?: { id: string; name: string; logo: string | null; seasonNumber: number; malePoints: number; femalePoints: number; totalPoints: number; members: { id: string; gamertag: string; division: string; tier: string; points: number; role: string; avatar?: string | null }[] } | null; stats?: { totalClubs: number; totalMatches: number; completedMatches: number } }>({
    queryKey: ['league-landing'],
    queryFn: async () => {
      const res = await fetch('/api/league');
      if (!res.ok) throw new Error('League API failed');
      return res.json();
    },
    // ── 2min Polling Strategy ──
    // Most requests hit Vercel CDN (s-maxage=10), not the database.
    // 2min is optimized for mid-range devices while still feeling responsive:
    //   - CDN caches for 10s → most polls hit CDN, not DB
    //   - Admin updates: revalidateTag purges CDN → next poll gets fresh data
    //   - Admin changes appear within max 2min without manual refresh
    staleTime: 120000, // 2min — data considered fresh for 2min
    gcTime: 300000, // Keep unused data for 5 min in memory
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchInterval: 300000, // 5min polling — league data changes rarely
  });

  // CMS helpers
  const cms = cmsData?.settings || {};
  const cmsSections = cmsData?.sections || {};
  const cmsLogo = cms.logo_url || '/logo1.webp';
  const cmsSiteTitle = cms.site_title || 'Tarkam IDM';
  const cmsHeroTitle = cms.hero_title || 'Idol Meta';
  const cmsHeroSubtitle = cms.hero_subtitle || 'Fan Made Edition';
  const cmsFooterText = cms.footer_text || '© 2025 Tarkam IDM — Idol Meta Fan Made Edition. All rights reserved.';
  const cmsFooterTagline = cms.footer_tagline || 'Dance. Compete. Dominate.';

  const enterApp = (division: 'male' | 'female') => {
    setDivision(division);
    setCurrentView('dashboard');
  };

  const enterBracket = (division: 'male' | 'female') => {
    setDivision(division);
    setCurrentView('matchday');
  };

  const enterCommunity = () => {
    setCurrentView('community');
  };

  /* Nav scroll state */
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ['kompetisi', 'highlights', 'season-champion', 'experiences', 'players'];
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sectionIds.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  /* Section Reveal — IntersectionObserver for scroll-triggered fade-in animations
     Dashboard-crisp: low threshold + generous rootMargin so animation fires early */
  useEffect(() => {
    const revealSections = document.querySelectorAll('.section-reveal');
    if (!revealSections.length) return;
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-reveal--visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px 0px 0px' }
    );
    revealSections.forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, []);

  useSwipeNavigation();
  useScrollReveal();

  /* Parallax — lightweight rAF-based depth layers on scroll */
  useParallax([
    { selector: '.parallax-hero-bg', speed: 0.12 },      // base gradient — slowest
    { selector: '.parallax-hero-mid', speed: 0.08 },      // gold haze — very slow
    { selector: '.parallax-hero-slow', speed: 0.05 },     // cyan/purple glow — slowest
    { selector: '.parallax-section-bg', speed: 0.06 },    // section backgrounds — subtle
    { selector: '.parallax-particles', speed: 0.18 },     // floating particles — fastest
  ]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden landing-scroll pb-24 md:pb-0">

      {/* ========== FIXED NAVIGATION HEADER ========== */}
      <nav aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/95 border-b border-idm-gold-warm/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] nav-scrolled-glow'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 transition-all duration-500 ${scrolled ? 'nav-logo-glow glow-pulse' : 'glow-pulse'}`}>
              <Image src={cmsLogo} alt="IDM" width={28} height={28} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <span className={`text-gradient-fury text-sm font-bold tracking-tight transition-all duration-500 ${scrolled ? 'nav-logo-text-glow' : ''}`}>{cmsSiteTitle}</span>
          </div>

          {/* Desktop Nav Links — compact on medium screens */}
          <div className="hidden sm:flex items-center gap-0.5 md:gap-1">
            {[
              { id: 'kompetisi', label: 'Kompetisi', mdLabel: 'Kompetisi' },
              { id: 'highlights', label: 'Juara', mdLabel: 'Juara' },
              { id: 'season-champion', label: 'Season', mdLabel: 'Season' },
              { id: 'experiences', label: 'Video', mdLabel: 'Video' },
              { id: 'players', label: 'Player', mdLabel: 'Player' },

            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                aria-label={`Navigate to ${item.label} section`}
                aria-current={activeSection === item.id ? 'true' : undefined}
                className={`relative px-2 md:px-3 py-1.5 text-xs md:text-sm transition-all duration-300 cursor-pointer rounded-md ${
                  activeSection === item.id
                    ? 'text-idm-gold-warm font-semibold'
                    : 'text-muted-foreground hover:text-idm-gold-warm/70'
                }`}
              >
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.mdLabel}</span>
                {activeSection === item.id && (
                  <div className="nav-indicator absolute bottom-0 left-1 right-1 h-[2px] bg-idm-gold-warm rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Right Actions: Login only */}
          <div className="flex items-center gap-1.5">
            {/* Login / User Button */}
            <LandingAuthButton
              onOpenLogin={(tab) => { setLoginDefaultTab(tab); setLoginModalOpen(true); }}
              onLogout={() => {
                const { clearAdminAuth, clearPlayerAuth } = useAppStore.getState();
                clearAdminAuth();
                clearPlayerAuth();
                fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
                fetch('/api/account/logout', { method: 'POST' }).catch(() => {});
              }}
              scrolled={scrolled}
            />
          </div>
        </div>
      </nav>

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav aria-label="Section navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 border-t border-idm-gold-warm/10 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { id: 'kompetisi', label: 'Kompetisi', icon: Swords, special: false },
            { id: 'highlights', label: 'Juara', icon: Crown, special: true },
            { id: 'season-champion', label: 'Season', icon: Trophy, special: false },
            { id: 'experiences', label: 'Video', icon: Play, special: false },
            { id: 'players', label: 'Player', icon: Music, special: false },

          ].map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 ${
                  item.special
                    ? isActive
                      ? 'text-idm-gold-warm'
                      : 'text-idm-gold-warm/70'
                    : isActive
                    ? 'text-idm-gold-warm'
                    : 'text-muted-foreground hover:text-idm-gold-warm/70'
                }`}
              >
                {item.special && (
                  <span className="absolute inset-0 rounded-lg bg-idm-gold-warm/[0.04] border border-idm-gold-warm/10" />
                )}
                {item.special && !isActive && (
                  <span className="absolute inset-0 rounded-lg animate-pulse bg-idm-gold-warm/[0.03] shadow-[0_0_8px_rgba(212,168,83,0.08)]" />
                )}
                <item.icon className={`relative z-10 w-5 h-5 ${item.special ? 'drop-shadow-[0_0_4px_rgba(212,168,83,0.3)]' : ''}`} />
                <span className={`relative z-10 text-[11px] font-medium mt-1 ${item.special ? 'font-bold' : ''}`}>{item.label}</span>
                {isActive && (
                  <div className={`nav-indicator absolute -bottom-0.5 rounded-full ${item.special ? 'w-10 h-1 bg-idm-gold-warm shadow-[0_0_8px_rgba(212,168,83,0.5)]' : 'w-8 h-0.5 bg-idm-gold-warm'}`} />
                )}
              </button>
            );
          })}

        </div>
      </nav>

      {/* ========== SECTION COMPONENTS ========== */}
      <HeroSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onEnterApp={enterApp}
        onEnterCommunity={enterCommunity}
        onRegister={(div) => { setRegistrationDefaultDivision(div); setRegistrationModalOpen(true); }}
        onViewBracket={enterBracket}
        onVideoPlay={openVideoModal}
        isSeasonDataPlaceholder={isSeasonDataPlaceholder}
      />

      {/* Kompetisi — Tarkam Arena (first section after hero) */}
      <div className="section-reveal">
      <TournamentHub
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onEnterApp={enterApp}
        onRegister={(div) => { setRegistrationDefaultDivision(div); setRegistrationModalOpen(true); }}
        onVideoPlay={openVideoModal}
        maleRegOpen={maleRegOpen}
        femaleRegOpen={femaleRegOpen}
      />
      </div>

      <SectionDivider />

      {/* Highlights — Momen Terbaik */}
      <div className="section-reveal">
      <HighlightsSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onVideoPlay={openVideoModal}
        setSelectedPlayer={setSelectedPlayer}
        setPreferredSkinType={setPreferredSkinType}
      />
      </div>

      <SectionDivider />

      {/* Season Champion — completed season champions only (NOT weekly) */}
      <div className="section-reveal">
      <SeasonChampionSection
        maleData={maleData}
        femaleData={femaleData}
        isDataLoading={isDataLoading}
        setSelectedPlayer={setSelectedPlayer}
        setSelectedClub={setSelectedClub}
        leagueData={leagueData}
        skinMap={{ ...maleData?.skinMap, ...femaleData?.skinMap }}
        isSeasonDataPlaceholder={isSeasonDataPlaceholder}
      />
      </div>

      <SectionDivider />

      {/* Experiences — Video Highlights */}
      <div className="section-reveal">
      <ExperiencesSection
        maleData={maleData}
        femaleData={femaleData}
        leagueData={leagueData}
        cmsSections={cmsSections}
        cmsSettings={cms}
        onEnterApp={enterApp}
        onVideoPlay={openVideoModal}
      />
      </div>

      <SectionDivider />

      {/* Players */}
      <div className="section-reveal">
      <PlayersSection
        maleData={maleData}
        femaleData={femaleData}
        isDataLoading={isDataLoading}
        isSeasonSwitching={isSeasonSwitching}
        setSelectedPlayer={setSelectedPlayer}
        showAllMalePlayers={showAllMalePlayers}
        setShowAllMalePlayers={setShowAllMalePlayers}
        showAllFemalePlayers={showAllFemalePlayers}
        setShowAllFemalePlayers={setShowAllFemalePlayers}
        selectedSeasonId={selectedSeasonId}
        setSelectedSeasonId={setSelectedSeasonId}
        isHistorical={maleData?.isHistorical || femaleData?.isHistorical || false}
        maleSkinMap={maleData?.skinMap}
        femaleSkinMap={femaleData?.skinMap}
      />
      </div>

      <SectionDivider />

      {/* Clubs */}
      <div className="section-reveal">
      <ClubsSection
        maleData={maleData}
        femaleData={femaleData}
        isDataLoading={isDataLoading}
        cmsSections={cmsSections}
        leagueData={leagueData}
        setSelectedClub={setSelectedClub}
        showAllClubs={showAllClubs}
        setShowAllClubs={setShowAllClubs}
        selectedSeasonId={selectedSeasonId}
        setSelectedSeasonId={setSelectedSeasonId}
        isHistorical={maleData?.isHistorical || femaleData?.isHistorical || false}
      />
      </div>

      <SectionDivider />

      {/* CTA — Call to Action */}
      <div className="section-reveal">
      <CTASection
        onEnterCommunity={enterCommunity}
        onRegister={() => { setRegistrationDefaultDivision('male'); setRegistrationModalOpen(true); }}
        cmsSettings={cms}
        isRegistrationOpen={maleRegOpen || femaleRegOpen}
      />
      </div>

      <LandingFooter
        cmsSettings={cms}
      />

      {/* ========== REGISTRATION MODAL ========== */}
      <RegistrationModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        defaultDivision={registrationDefaultDivision}
      />

      {/* ========== LOGIN MODAL ========== */}
      <UnifiedLoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        defaultTab={loginDefaultTab}
      />

      {/* ========== VIDEO MODAL ========== */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={videoModalUrl}
        title={videoModalTitle}
      />

      {/* ========== SCROLL PROGRESS BAR ========== */}
      <ScrollProgress />

      {/* ========== BACK TO TOP BUTTON ========== */}
      <BackToTop />

      {/* ========== PLAYER PROFILE MODAL ========== */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          rank={((selectedPlayer.division === 'male' ? maleData : femaleData)?.topPlayers?.findIndex(p => p.id === selectedPlayer.id) ?? -1) + 1}
          skinMap={(selectedPlayer.division === 'male' ? maleData : femaleData)?.skinMap}
          preferredSkinType={preferredSkinType || undefined}
        />
      )}

      {/* ========== CLUB PROFILE MODAL ========== */}
      {selectedClub && (
        <ClubProfile
          club={selectedClub}
          onClose={() => setSelectedClub(null)}
          onPlayerClick={(player) => {
            // Find the player in the appropriate division's top players
            const searchDivision = player.division || 'male';
            const data = searchDivision === 'male' ? maleData : femaleData;
            const found = data?.topPlayers?.find(p => p.id === player.id);
            // preferredSkinType is auto-cleared by setSelectedPlayer wrapper
            if (found) {
              setSelectedPlayer({ ...found, division: searchDivision });
            } else {
              // Player not in topPlayers list — create a minimal profile
              setSelectedPlayer({
                id: player.id,
                name: player.name || player.gamertag,
                gamertag: player.gamertag,
                avatar: player.avatar,
                tier: player.tier || 'B',
                points: player.points || 0,
                totalWins: 0,
                streak: 0,
                maxStreak: 0,
                totalMvp: 0,
                matches: 0,
                division: searchDivision,
                city: (player as { city?: string }).city,
                club: selectedClub?.name || undefined,
              });
            }
          }}
        />
      )}
    </div>
  );
}
