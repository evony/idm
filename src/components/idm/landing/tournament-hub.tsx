'use client';

import { Swords, Music, Shield, Crown, Users, Building2, Gamepad2, ArrowRight, Play, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection, SectionHeader } from './shared';
import { formatCurrency } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

interface TournamentHubProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onRegister: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
  maleRegOpen?: boolean;
  femaleRegOpen?: boolean;
}

/* ────────────────────────── Division Config ────────────────────────── */
const DIVISION = {
  male: {
    key: 'male' as const,
    title: 'Male Tarkam',
    icon: Music,
    color: '#2E9FFF',
    colorLight: '#57B5FF',
    colorRgb: '46,159,255',
    gradient: 'from-idm-male/40 via-[#1478D9]/30 to-mid',
    badgeBg: 'bg-idm-male/15',
    badgeText: 'text-idm-male',
    badgeBorder: 'border-idm-male/25',
    iconBg: 'bg-idm-male/10 border-idm-male/25',
    ctaBg: 'bg-idm-male/10 border-idm-male/25 text-idm-male hover:bg-idm-male/20',
    statBg: 'bg-idm-male/[0.06] border-idm-male/10',
    hoverBorder: 'rgba(46,159,255,0.3)',
    hoverShadow: '0 8px 40px rgba(46,159,255,0.15)',
    patternOpacity: 'opacity-[0.04]',
  },
  female: {
    key: 'female' as const,
    title: 'Female Tarkam',
    icon: Shield,
    color: '#FF2D78',
    colorLight: '#FF5C9A',
    colorRgb: '255,45,120',
    gradient: 'from-idm-female/40 via-[#D9165E]/30 to-mid',
    badgeBg: 'bg-idm-female/15',
    badgeText: 'text-idm-female',
    badgeBorder: 'border-idm-female/25',
    iconBg: 'bg-idm-female/10 border-idm-female/25',
    ctaBg: 'bg-idm-female/10 border-idm-female/25 text-idm-female hover:bg-idm-female/20',
    statBg: 'bg-idm-female/[0.06] border-idm-female/10',
    hoverBorder: 'rgba(255,45,120,0.3)',
    hoverShadow: '0 8px 40px rgba(255,45,120,0.15)',
    patternOpacity: 'opacity-[0.04]',
  },
} as const;

/* ────────────────────────── Tournament Card ────────────────────────── */
function TournamentCard({
  division,
  data,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onRegister,
  onVideoPlay,
  isRegOpen,
}: {
  division: typeof DIVISION.male | typeof DIVISION.female;
  data: StatsData | undefined;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onRegister: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
  isRegOpen?: boolean;
}) {
  const Icon = division.icon;
  const weeklyCount = data?.seasonProgress?.completedWeeks || 0;
  const totalPlayers = data?.totalPlayers || 0;
  const totalClubs = data?.clubs?.length || 0;
  const totalMatches = data?.recentMatches?.length || 0;
  const prizePool = data?.totalPrizePool || 0;

  // Check if registration is open for this division
  // Priority: 1) Full stats data (most accurate), 2) Fast tournament-status prop (fallback during loading)
  // This prevents the button from being disabled while the heavy /api/stats is still loading
  const tournamentStatus = data?.activeTournament?.status;
  const isRegistrationOpen = tournamentStatus === 'registration' || tournamentStatus === 'approval' || isRegOpen || false;

  // CMS text fields with fallbacks
  const cardTitle = cmsSettings?.[`kompetisi_${division.key}_title`] || division.title;
  const cardBadge = cmsSettings?.[`kompetisi_${division.key}_badge`] || 'Weekly Tournament';
  const cardFormat = cmsSettings?.[`kompetisi_${division.key}_format`] || 'Bracket elimination — 1 tim, 3 pemain';
  const cardDescription = cmsSettings?.[`kompetisi_${division.key}_description`] ||
    `Turnamen mingguan dengan format bracket elimination. Peserta tarkam ${division.key === 'male' ? 'putra' : 'putri'} bertanding setiap minggu. Juara weekly berhak atas prize pool dan gelar champion.`;

  // Video URL extraction
  const videoUrl =
    cmsSettings?.[`kompetisi_${division.key}_video_url`] ||
    cmsSections.kompetisi?.cards?.find(
      (c: { division?: string; videoUrl?: string }) => c.division === division.key && c.videoUrl
    )?.videoUrl;

  return (
    <div
      className="group tournament-card-tilt ios-tournament-card relative overflow-hidden"
      style={
        {
          '--division-color': division.color,
          '--division-color-rgb': division.colorRgb,
          background: `linear-gradient(165deg, rgba(${division.colorRgb},0.08) 0%, var(--bg-mid) 35%, rgba(${division.colorRgb},0.04) 100%)`,
        } as React.CSSProperties
      }
    >
      {/* ═══ iOS-style gold accent line at top ═══ */}
      <div className="ios-gold-line" aria-hidden="true" />
      {/* ── Image Area ── */}
      <div className={`relative h-52 overflow-hidden tournament-header-mesh ${division.key === 'male' ? 'tournament-header-mesh-male' : 'tournament-header-mesh-female'}`}>
        {/* Pattern overlay */}
        <div
          className={`absolute inset-0 ${division.patternOpacity}`}
          style={{
            backgroundImage: `radial-gradient(circle, ${division.color} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Large watermark icon */}
        <Icon
          className="absolute -right-6 -bottom-6 w-40 h-40 text-white/[0.04] tournament-watermark-float"
          strokeWidth={0.5}
        />

        {/* Decorative grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${division.color} 1px, transparent 1px), linear-gradient(90deg, ${division.color} 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Badge overlay — top left */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${division.badgeBg} border ${division.badgeBorder}`}
          >
            <Swords className="w-3 h-3 text-[#d4a853]" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${division.badgeText}`}>
              {cardBadge}
            </span>
          </div>
        </div>

        {/* Tournament count — top right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 border border-border/40">
            <Gamepad2 className="w-3 h-3 text-[#d4a853]" />
            <span className="text-[10px] font-bold text-foreground/80">
              {weeklyCount} Week{weeklyCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Video play button — premium pulsing design */}
        {videoUrl && onVideoPlay && (
          <button
            onClick={() => onVideoPlay(videoUrl, cardTitle)}
            className="absolute bottom-4 right-4 z-10 group/play cursor-pointer"
            aria-label={`Play ${division.title} video`}
          >
            {/* Outer pulsing ring */}
            <span className="absolute inset-0 rounded-full play-btn-pulse-ring" style={{ background: `rgba(${division.colorRgb},0.25)` }} />
            {/* Mid glow */}
            <span className="absolute -inset-1.5 rounded-full play-btn-pulse-glow" style={{ background: `radial-gradient(circle, rgba(${division.colorRgb},0.2) 0%, transparent 70%)` }} />
            {/* Button body */}
            <span className="relative flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm border transition-all duration-300 group-hover/play:scale-110 group-hover/play:border-[rgba(212,168,83,0.5)]"
              style={{
                background: `linear-gradient(135deg, rgba(${division.colorRgb},0.25) 0%, rgba(0,0,0,0.7) 100%)`,
                borderColor: `rgba(${division.colorRgb},0.35)`,
                boxShadow: `0 0 20px rgba(${division.colorRgb},0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              <Play className="w-4 h-4 text-white fill-white ml-0.5 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
            </span>
            {/* Label tooltip on hover */}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-white/80 bg-black/70 px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/play:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              Watch Video
            </span>
          </button>
        )}

        {/* Gradient overlay at bottom — smoother blend into card body */}
        <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: 'linear-gradient(to top, var(--bg-mid), transparent)' }} />

        {/* Division glow line at header bottom — content area accent */}
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent 5%, rgba(${division.colorRgb},0.3) 30%, rgba(${division.colorRgb},0.5) 50%, rgba(${division.colorRgb},0.3) 70%, transparent 95%)` }} />

        {/* Subtle shine sweep on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(${division.colorRgb},0.05) 45%, rgba(${division.colorRgb},0.1) 50%, rgba(${division.colorRgb},0.05) 55%, transparent 60%)`,
              transform: 'translateX(-100%)',
              animation: 'card-shine-sweep 1.5s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="p-5 sm:p-6">
        {/* Icon + Title row — iOS clean hierarchy */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl ${division.iconBg} flex items-center justify-center shrink-0`}
            style={{ boxShadow: `0 0 20px rgba(${division.colorRgb},0.1)` }}
          >
            <Icon className="w-5 h-5 tournament-icon-pulse" style={{ color: division.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground dark:text-white truncate ios-heading">{cardTitle}</h3>
            <p className="text-[11px] text-muted-foreground dark:text-[#a09880]">{cardFormat}</p>
          </div>
        </div>

        {/* Description — iOS lighter secondary text */}
        <p className="text-sm text-muted-foreground dark:text-[#a09880] leading-relaxed mb-4">
          {cardDescription}
        </p>

        {/* Stats row — iOS clean stat tiles */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="ios-card relative p-3 sm:p-4 text-center tournament-stat-item tournament-stat-separator overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(${division.colorRgb},0.06) 0%, rgba(${division.colorRgb},0.02) 100%)`, borderColor: `rgba(${division.colorRgb},0.1)` }}>
            <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-[0.06]" style={{ color: division.color }} />
            <p className="relative text-lg font-extrabold tabular-nums" style={{ color: division.color }}>
              {totalPlayers}
            </p>
            <p className="relative text-[10px] text-muted-foreground dark:text-[#a09880] flex items-center justify-center gap-1 mt-0.5">
              <Users className="w-2.5 h-2.5" />
              Pemain
            </p>
          </div>
          <div className="ios-card relative p-3 sm:p-4 text-center tournament-stat-item tournament-stat-separator overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(${division.colorRgb},0.06) 0%, rgba(${division.colorRgb},0.02) 100%)`, borderColor: `rgba(${division.colorRgb},0.1)` }}>
            <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-[0.06]" style={{ color: division.color }} />
            <p className="relative text-lg font-extrabold tabular-nums" style={{ color: division.color }}>
              {totalClubs}
            </p>
            <p className="relative text-[10px] text-muted-foreground dark:text-[#a09880] flex items-center justify-center gap-1 mt-0.5">
              <Building2 className="w-2.5 h-2.5" />
              Club
            </p>
          </div>
          <div className="ios-card relative p-3 sm:p-4 text-center tournament-stat-item overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(${division.colorRgb},0.06) 0%, rgba(${division.colorRgb},0.02) 100%)`, borderColor: `rgba(${division.colorRgb},0.1)` }}>
            <Gamepad2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-[0.06]" style={{ color: division.color }} />
            <p className="relative text-lg font-extrabold tabular-nums" style={{ color: division.color }}>
              {weeklyCount}
            </p>
            <p className="relative text-[10px] text-muted-foreground dark:text-[#a09880] flex items-center justify-center gap-1 mt-0.5">
              <Gamepad2 className="w-2.5 h-2.5" />
              Match
            </p>
          </div>
        </div>

        {/* Prize pool highlight — iOS frosted glass */}
        {prizePool > 0 && (
          <div className="ios-card flex items-center gap-2 mb-4 px-3 py-2" style={{ background: 'rgba(212,168,83,0.06)', borderColor: 'rgba(212,168,83,0.1)' }}>
            <Crown className="w-3.5 h-3.5 text-[#d4a853]" />
            <span className="text-[11px] text-muted-foreground dark:text-[#a09880]">Prize Pool</span>
            <span className="text-sm font-bold text-gradient-champion ml-auto">
              {formatCurrency(prizePool)}
            </span>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={() => onEnterApp(division.key)}
            className="tournament-cta-primary flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Masuk Arena</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => isRegistrationOpen && onRegister(division.key)}
            disabled={!isRegistrationOpen}
            className={`flex-1 py-3 rounded-2xl border text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden ${
              isRegistrationOpen
                ? `tournament-cta-secondary cursor-pointer ${division.ctaBg}`
                : 'bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed opacity-60'
            }`}
            title={isRegistrationOpen ? 'Daftar sekarang' : 'Pendaftaran belum dibuka'}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isRegistrationOpen ? 'Daftar' : 'Belum Buka'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Main Component ────────────────────────── */
export function TournamentHub({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onRegister,
  onVideoPlay,
  maleRegOpen,
  femaleRegOpen,
}: TournamentHubProps) {
  // CMS text fields with fallbacks
  const sectionLabel = cmsSettings?.kompetisi_label || 'Kompetisi';
  const sectionTitle = cmsSettings?.kompetisi_title || 'Tarkam Arena';
  const sectionSubtitle = cmsSettings?.kompetisi_subtitle || 'Weekly tournament setiap minggu — pilih tarkammu dan langsung bertanding di arena kompetisi IDM';


  return (
    <section
      id="kompetisi"
      role="region"
      aria-label={sectionLabel}
      className="landing-section relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-deep"
    >
      {/* ── Top edge glow — section boundary ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.3)] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[rgba(212,168,83,0.03)] to-transparent pointer-events-none" aria-hidden="true" />

      {/* ── Background ── */}
      {/* Gold dot pattern overlay — parallax section bg */}
      <div
        className="absolute inset-0 opacity-[0.025] parallax-section-bg"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4a853 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Subtle radial glow at center top — parallax section bg */}
      <div
        className="absolute inset-0 parallax-section-bg"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(212,168,83,0.04) 0%, transparent 60%)',
        }}
      />
      {/* Bilateral division atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(46,159,255,0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(255,45,120,0.03) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ── Section Header ── */}
        <AnimatedSection>
          <SectionHeader
            icon={Swords}
            label={sectionLabel}
            title={sectionTitle}
            subtitle={sectionSubtitle}
          />
        </AnimatedSection>

        {/* ── Tournament Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Male Tarkam */}
          <AnimatedSection variant="fadeLeft">
            <TournamentCard
              division={DIVISION.male}
              data={maleData}
              cmsSections={cmsSections}
              cmsSettings={cmsSettings}
              onEnterApp={onEnterApp}
              onRegister={onRegister}
              onVideoPlay={onVideoPlay}
              isRegOpen={maleRegOpen}
            />
          </AnimatedSection>

          {/* Female Tarkam */}
          <AnimatedSection variant="fadeRight">
            <TournamentCard
              division={DIVISION.female}
              data={femaleData}
              cmsSections={cmsSections}
              cmsSettings={cmsSettings}
              onEnterApp={onEnterApp}
              onRegister={onRegister}
              onVideoPlay={onVideoPlay}
              isRegOpen={femaleRegOpen}
            />
          </AnimatedSection>
        </div>


      </div>


    </section>
  );
}
