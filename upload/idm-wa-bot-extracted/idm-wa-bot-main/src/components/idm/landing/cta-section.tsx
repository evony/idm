'use client';

import { Flame, UserPlus, Shield, Users, Trophy } from 'lucide-react';

/* ── Default Trust Badges ── */
const DEFAULT_BADGES = [
  { icon: Shield, value: '12+', label: 'Club Terdaftar' },
  { icon: Users, value: '120+', label: 'Pemain Aktif' },
  { icon: Trophy, value: '2', label: 'Season' },
] as const;

/* ── Floating Particle Positions ── */
const PARTICLES = [
  { className: 'cta-particle-1', size: 'w-1 h-1' },
  { className: 'cta-particle-2', size: 'w-1.5 h-1.5' },
  { className: 'cta-particle-3', size: 'w-1 h-1' },
  { className: 'cta-particle-4', size: 'w-1 h-1' },
  { className: 'cta-particle-5', size: 'w-1.5 h-1.5' },
  { className: 'cta-particle-6', size: 'w-1 h-1' },
] as const;

/* ── Trust Badge ── */
function TrustBadge({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="cta-badge-ring w-12 h-12 rounded-2xl bg-[rgba(212,168,83,0.06)] flex items-center justify-center relative">
        <Icon className="w-5 h-5 text-[#d4a853]/80 relative z-10" />
      </div>
      <span className="cta-count-up text-[#f5f0e8] text-lg font-extrabold tabular-nums tracking-tight">{value}</span>
      <span className="text-[#a09880] text-[10px] uppercase tracking-widest">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CTA Section — Call to Action before footer
   Premium redesign with rotating conic border, floating particles,
   enhanced trust badges, shimmer buttons, bottom glow, dot grid
   ═══════════════════════════════════════════════════════════════ */
export function CTASection({
  onEnterCommunity,
  onRegister,
  cmsSettings,
  isRegistrationOpen = true,
}: {
  onEnterCommunity: () => void;
  onRegister: () => void;
  cmsSettings?: Record<string, string>;
  isRegistrationOpen?: boolean;
}) {
  // Merge CMS settings with defaults
  const title = cmsSettings?.cta_title || 'Siap Menjadi Champion?';
  const description = cmsSettings?.cta_description || 'Bergabung sekarang dan tunjukkan skill-mu di arena Tarkam IDM. Ribuan pemain sudah menunggu!';
  const primaryButtonText = cmsSettings?.cta_button_primary_text || 'Masuk Arena';
  const secondaryButtonText = cmsSettings?.cta_button_secondary_text || 'Daftar Sekarang';

  // Build trust badges from CMS or defaults
  const badges = DEFAULT_BADGES.map((badge, i) => ({
    ...badge,
    value: cmsSettings?.[`cta_badge_${i + 1}_value`] || badge.value,
    label: cmsSettings?.[`cta_badge_${i + 1}_label`] || badge.label,
  }));

  return (
    <section id="cta" aria-label="Call to Action" className="landing-section cta-section relative py-16 sm:py-28 px-4 overflow-hidden bg-deep">
      {/* Top gold border glow line */}
      <div className="absolute top-0 left-0 right-0 h-px" aria-hidden="true">
        <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.4), rgba(245,230,200,0.2), rgba(212,168,83,0.4), transparent)' }} />
      </div>

      {/* ── Atmospheric: Dot grid pattern ── */}
      <div className="cta-dot-grid absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Radial gold glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />

      {/* Bilateral cyan+purple atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(46,159,255,0.04) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(255,45,120,0.04) 0%, transparent 45%)' }} />

      {/* Bottom edge glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* ── CTA Card with animated rotating conic border ── */}
        <div className="cta-card-wrapper relative rounded-3xl mx-auto max-w-2xl">
          {/* Rotating conic-gradient border — spinning light effect */}
          <div className="cta-rotating-border absolute inset-0 rounded-3xl overflow-hidden" aria-hidden="true">
            <div className="cta-rotating-border-inner w-[200%] h-[200%] absolute -top-1/2 -left-1/2" />
          </div>

          {/* Card content with background to mask the rotating border */}
          <div className="relative rounded-3xl bg-mid/95 px-6 sm:px-10 py-10 sm:py-14 m-[1.5px]">
            {/* Gold particle trail — CSS pseudo-element */}
            <div className="cta-gold-trail absolute top-0 left-0 right-0 h-1 rounded-t-3xl overflow-hidden" aria-hidden="true" />

            {/* ── Floating dot particles around the card ── */}
            {PARTICLES.map((particle, i) => (
              <div
                key={i}
                className={`${particle.className} ${particle.size} absolute rounded-full bg-[#d4a853] pointer-events-none`}
                style={{ opacity: 0.15 }}
                aria-hidden="true"
              />
            ))}

            {/* Heading */}
            <h2 className="reveal reveal-fade-up text-3xl sm:text-5xl font-black text-gradient-champion mb-4">
              {title}
            </h2>

            {/* Subtitle */}
            <p className="reveal reveal-fade-up reveal-delay-1 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="reveal reveal-fade-up reveal-delay-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Masuk Arena — Primary Gold Button with pulsing glow */}
              <button
                onClick={onEnterCommunity}
                className="btn-press cta-btn-pulse group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#d4a853] to-[#e8d5a3] text-mid font-bold text-sm tracking-wider cursor-pointer overflow-hidden"
              >
                {/* Shimmer sweep on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                <Flame className="w-4 h-4 inline mr-2 relative z-10" />
                <span className="relative z-10">{primaryButtonText}</span>
              </button>

              {/* Daftar Sekarang — Outline Button with shimmer on hover */}
              <button
                onClick={isRegistrationOpen ? onRegister : undefined}
                disabled={!isRegistrationOpen}
                className={`btn-press group relative px-8 py-4 rounded-2xl font-bold text-sm tracking-wider transition-all overflow-hidden ${
                  isRegistrationOpen
                    ? 'border-2 border-[rgba(212,168,83,0.3)] text-[#d4a853] bg-transparent hover:bg-[rgba(212,168,83,0.05)] hover:border-[rgba(212,168,83,0.5)] cursor-pointer'
                    : 'border-2 border-gray-500/20 text-gray-500 bg-gray-500/5 cursor-not-allowed opacity-60'
                }`}
                title={isRegistrationOpen ? 'Daftar sekarang' : 'Pendaftaran belum dibuka'}
              >
                {/* Shimmer sweep on hover */}
                {isRegistrationOpen && (
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent pointer-events-none" />
                )}
                <UserPlus className="w-4 h-4 inline mr-2 relative z-10" />
                <span className="relative z-10">{isRegistrationOpen ? (secondaryButtonText) : 'Belum Buka'}</span>
              </button>
            </div>
          </div>

          {/* ── Bottom Glow — large subtle gold glow beneath card ── */}
          <div className="cta-bottom-glow absolute -bottom-16 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-full pointer-events-none" aria-hidden="true" />
        </div>

        {/* Trust Badges — Enhanced with gold ring + count-up */}
        <div className="reveal reveal-fade-up reveal-delay-3 mt-14 flex items-center justify-center gap-6 sm:gap-14">
          {badges.map((badge, i) => (
            <span key={i} className="contents">
              {i > 0 && <div className="h-10 w-px bg-[rgba(212,168,83,0.08)]" aria-hidden="true" />}
              <TrustBadge icon={badge.icon} value={badge.value} label={badge.label} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
