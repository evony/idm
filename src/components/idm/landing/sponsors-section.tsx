'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Gem } from 'lucide-react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { SectionHeader } from './shared';

/* ── Sponsor data shape from API ── */
interface Sponsor {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
  tier: string;
  description: string | null;
  isActive: boolean;
  _count?: {
    tournamentSponsors: number;
    sponsoredPrizes: number;
    banners: number;
  };
}

/* ── Tier display config — order matters for rendering priority ── */
const TIER_ORDER = ['platinum', 'gold', 'silver', 'bronze'] as const;
const TIER_LABELS: Record<string, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  other: 'Partner',
};
const TIER_STYLES: Record<string, string> = {
  platinum: 'border-idm-gold-warm/25 bg-idm-gold-warm/[0.04]',
  gold: 'border-idm-amber/20 bg-idm-amber/[0.03]',
  silver: 'border-border/30 bg-muted/5',
  bronze: 'border-idm-gold-warm/10 bg-idm-gold-warm/[0.02]',
  other: 'border-idm-gold-warm/10 bg-idm-gold-warm/[0.02]',
};

/* ═══════════════════════════════════════════════════════════════
   Sponsors Section — "Didukung Oleh" (Supported By)
   Horizontally scrollable sponsor logos grouped by tier.
   Returns null if no active sponsors exist.
   ═══════════════════════════════════════════════════════════════ */
export function SponsorsSection() {
  const ct = useCommunityTheme();

  const { data, isLoading } = useQuery<{ sponsors: Sponsor[] }>({
    queryKey: ['sponsors-active'],
    queryFn: async () => {
      const res = await fetch('/api/sponsors?active=true');
      if (!res.ok) return { sponsors: [] };
      return res.json();
    },
    staleTime: 120000, // Sponsors rarely change
    gcTime: 300000,
  });

  const sponsors = data?.sponsors ?? [];

  // Don't render anything if no sponsors or still loading with no prior data
  if (!isLoading && sponsors.length === 0) return null;

  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<string, Sponsor[]>>((acc, tier) => {
    const items = sponsors.filter(s => s.tier === tier);
    if (items.length > 0) acc[tier] = items;
    return acc;
  }, {});

  // Also handle any tiers not in our standard list
  const standardTierSet = new Set(TIER_ORDER);
  const otherSponsors = sponsors.filter(s => !standardTierSet.has(s.tier as any));
  if (otherSponsors.length > 0) {
    grouped['other'] = otherSponsors;
  }

  // Still loading and no data yet — show skeleton
  if (isLoading && sponsors.length === 0) {
    return (
      <section aria-label="Sponsors" className="section-reveal relative py-12 sm:py-16 px-4 overflow-hidden bg-deep">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-4 w-24 rounded bg-idm-gold-warm/10 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-10 w-24 rounded-lg bg-idm-gold-warm/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Didukung Oleh" className="section-reveal relative py-12 sm:py-16 px-4 overflow-hidden bg-deep">
      {/* ── Top edge glow ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.20)] to-transparent" aria-hidden="true" />

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.03) 0%, transparent 60%)' }} />

      {/* ── Bottom edge glow ── */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.10)] to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <SectionHeader
          icon={Gem}
          label="Didukung Oleh"
          title="Sponsor & Partner"
          subtitle="Mendukung ekosistem Tarkam IDM"
        />

        {/* Sponsor tiers */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([tier, items]) => (
            <div key={tier}>
              {/* Tier label — small, subtle */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-idm-gold-warm/60">
                  {TIER_LABELS[tier] || tier}
                </span>
                <div className="flex-1 h-px bg-idm-gold-warm/10" />
              </div>

              {/* Horizontally scrollable logos */}
              <div className="overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-4 sm:gap-6 pb-1 min-w-min">
                  {items.map(sponsor => {
                    const logo = sponsor.logo;
                    const inner = (
                      <div
                        className={`group flex items-center justify-center rounded-lg border px-5 py-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,168,83,0.10)] ${TIER_STYLES[tier] || TIER_STYLES['other']}`}
                      >
                        {logo ? (
                          <Image
                            src={logo}
                            alt={sponsor.name}
                            width={96}
                            height={32}
                            className="h-6 sm:h-8 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-semibold text-idm-gold-warm/70 group-hover:text-idm-gold-warm transition-colors">
                            {sponsor.name}
                          </span>
                        )}
                      </div>
                    );

                    if (sponsor.website) {
                      return (
                        <a
                          key={sponsor.id}
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                          aria-label={`Visit ${sponsor.name}`}
                        >
                          {inner}
                        </a>
                      );
                    }

                    return (
                      <div key={sponsor.id} className="shrink-0">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
