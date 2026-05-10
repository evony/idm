'use client';

import Image from 'next/image';
import { Instagram, Youtube, ArrowUp } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Tarkam IDM — Premium Footer (Enhanced)
   Brand + Links + Copyright — polished, gold-accented
   CSS-only animations, GPU-accelerated
   ═══════════════════════════════════════════════════════════════ */

interface LandingFooterProps {
  cmsSettings: Record<string, string>;
}

/* ── SVG Icons for Discord & WhatsApp (not in lucide-react) ── */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ── Social Link Item (Enhanced) ── */
function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="footer-social-enhanced p-2.5 text-muted-foreground"
    >
      {children}
    </a>
  );
}

/* ── Quick Link Item ── */
function QuickLink({ label, sectionId }: { label: string; sectionId: string }) {
  const handleClick = () => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button
      onClick={handleClick}
      className="text-muted-foreground text-sm hover:text-[#d4a853] transition-colors duration-200 cursor-pointer py-0.5 text-left"
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Footer Component — Premium Enhanced
   ═══════════════════════════════════════════════════════════════ */
export function LandingFooter({ cmsSettings }: LandingFooterProps) {
  /* ── CMS values ── */
  const logoUrl = cmsSettings.logo_url || '/logo1.webp';
  const siteTitle = cmsSettings.site_title || 'TARKAM IDM';
  const tagline = cmsSettings.footer_tagline || 'Idol Meta Fane Made Edition.';
  const footerText = cmsSettings.footer_text || '© 2026 Tarkam IDM. All rights reserved.';

  /* ── Social URLs ── */
  const discordUrl = cmsSettings.social_discord_url || '';
  const instagramUrl = cmsSettings.social_instagram_url || '';
  const youtubeUrl = cmsSettings.social_youtube_url || '';
  const whatsappUrl = cmsSettings.social_whatsapp_url || '';

  const hasSocial = discordUrl || instagramUrl || youtubeUrl || whatsappUrl;

  return (
    <footer className="landing-footer relative bg-background border-t border-[rgba(212,168,83,0.08)] overflow-hidden">
      {/* ── Premium gold gradient line at top ── */}
      <div className="footer-premium-line absolute top-0 left-0 right-0 h-[2px] overflow-hidden" aria-hidden="true">
        <div
          className="h-full w-[200%]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.5), rgba(245,230,200,0.3), rgba(212,168,83,0.5), transparent, rgba(212,168,83,0.5), rgba(245,230,200,0.3), rgba(212,168,83,0.5), transparent)',
            animation: 'footer-gradient-slide 8s linear infinite',
          }}
        />
      </div>

      {/* ── Subtle top glow ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-24 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(212,168,83,0.03) 0%, transparent 70%)' }}
      />

      {/* ── Atmospheric background glow ── */}
      <div className="footer-atmosphere" aria-hidden="true" />

      <div
        className="reveal reveal-fade-up relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
      >
        {/* ═══ 2-Column: Brand + Links ═══ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          {/* ─── Left: Brand ─── */}
          <div className="flex flex-col">
            {/* Logo + Title — with animated glow */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="footer-logo-glow w-7 h-7 rounded-md overflow-hidden shrink-0 ring-1 ring-[rgba(212,168,83,0.2)]">
                <Image
                  src={logoUrl}
                  alt="IDM Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span
                className="text-base font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #e8d5a3, #d4a853, #f5e6c8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {siteTitle}
              </span>
            </div>

            {/* Tagline */}
            <p className="text-muted-foreground/70 text-xs leading-relaxed">
              {tagline}
            </p>

            {/* Social Icons — enhanced with gold underline/scale/glow */}
            {hasSocial && (
              <div className="flex items-center gap-1 mt-3 -ml-1">
                {discordUrl && (
                  <SocialLink href={discordUrl} label="Discord">
                    <DiscordIcon className="w-[18px] h-[18px]" />
                  </SocialLink>
                )}
                {instagramUrl && (
                  <SocialLink href={instagramUrl} label="Instagram">
                    <Instagram className="w-[18px] h-[18px]" />
                  </SocialLink>
                )}
                {youtubeUrl && (
                  <SocialLink href={youtubeUrl} label="YouTube">
                    <Youtube className="w-[18px] h-[18px]" />
                  </SocialLink>
                )}
                {whatsappUrl && (
                  <SocialLink href={whatsappUrl} label="WhatsApp">
                    <WhatsAppIcon className="w-[18px] h-[18px]" />
                  </SocialLink>
                )}
              </div>
            )}
          </div>

          {/* ─── Right: Quick Links ─── */}
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <QuickLink label="Kompetisi" sectionId="kompetisi" />
            <QuickLink label="Champion" sectionId="champions" />
            <QuickLink label="MVP" sectionId="mvp" />
            <QuickLink label="Club" sectionId="clubs" />
          </nav>
        </div>

        {/* ═══ Premium Divider ═══ */}
        <div className="mt-7 mb-5">
          <div className="footer-premium-divider" aria-hidden="true" />
        </div>

        {/* ═══ Copyright Bar ═══ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <p className="text-muted-foreground/50 text-[11px]">
              {footerText}
            </p>
            <span className="hidden sm:inline text-muted-foreground/20 text-[11px]">|</span>
            <span
              className="text-[11px] font-medium tracking-wide"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,83,0.4), rgba(245,230,200,0.3))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              IDM League &bull; Season 2025
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-muted-foreground/40 text-[11px] flex items-center gap-1.5">
              Made with <span className="text-red-500/70 text-sm">❤️</span> by <span className="text-muted-foreground/60 font-medium">BorneoPride</span>
            </span>

            {/* Back to Top — Premium enhanced */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="footer-back-to-top text-muted-foreground/40 hover:text-[#d4a853] text-[11px] cursor-pointer"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5 footer-back-to-top-arrow" />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline keyframes for gradient animation ── */}
      <style jsx>{`
        @keyframes footer-gradient-slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </footer>
  );
}
