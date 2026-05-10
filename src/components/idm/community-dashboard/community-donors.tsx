'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, HandCoins, Sparkles } from 'lucide-react';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { formatCurrencyShort } from '@/lib/utils';
import { getSawerTier } from '@/lib/skin-utils';
import type { StatsData, TopDonor } from '@/types/stats';

/* ═══════════════════════════════════════════════════════
   COMMUNITY DONORS — Top donor/supporter community leaderboard
   ═══════════════════════════════════════════════════════ */
interface CommunityDonorsProps {
  maleData?: StatsData;
  femaleData?: StatsData;
  onSawer?: () => void;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function getInitials(name: string): string {
  return name
    .split(/[\s_]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CommunityDonors({ maleData, femaleData, onSawer }: CommunityDonorsProps) {
  const dt = useCommunityTheme();

  // Merge topDonors from both divisions and combine same-name donors
  const { donors, totalDonation } = useMemo(() => {
    const donorMap = new Map<string, TopDonor>();

    const mergeDonors = (donors: TopDonor[]) => {
      for (const d of donors) {
        const key = d.donorName.toLowerCase().trim();
        const existing = donorMap.get(key);
        if (existing) {
          donorMap.set(key, {
            donorName: d.donorName,
            totalAmount: existing.totalAmount + d.totalAmount,
            donationCount: existing.donationCount + d.donationCount,
          });
        } else {
          donorMap.set(key, { ...d });
        }
      }
    };

    if (maleData?.topDonors) mergeDonors(maleData.topDonors);
    if (femaleData?.topDonors) mergeDonors(femaleData.topDonors);

    const sorted = Array.from(donorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    const top8 = sorted.slice(0, 8);
    const total = top8.reduce((s, d) => s + d.totalAmount, 0);

    return { donors: top8, totalDonation: total };
  }, [maleData, femaleData]);

  const maxAmount = donors[0]?.totalAmount || 1;

  // Empty state
  if (donors.length === 0) {
    return (
      <Card className={`${dt.casinoCard} overflow-hidden`}>
        <div className={dt.casinoBar} />
        <CardContent className="p-6">
          <div className={`flex flex-col items-center justify-center py-8 ${dt.bgSubtle} rounded-2xl`}>
            <Heart className={`w-10 h-10 mb-3 opacity-30 ${dt.text}`} />
            <p className="text-sm text-muted-foreground font-medium">Belum ada donasi</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Jadilah yang pertama menyawer!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${dt.casinoCard} overflow-hidden`}>
      <div className={dt.casinoBar} />

      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 lg:px-6 py-3 border-b ${dt.borderSubtle}`}>
        <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
          <HandCoins className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${dt.neonText}`} />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold uppercase tracking-wider">Top Saweran</h3>
        <Badge className={`hidden sm:inline-flex ${dt.casinoBadge} ml-auto text-[9px]`}>KOMUNITAS</Badge>
      </div>

      <CardContent className="p-4 sm:p-6">
        {/* Total donation header */}
        <div className={`flex items-center justify-between mb-4 p-4 sm:p-5 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Saweran → Prize Pool</p>
            <p className={`text-lg font-black ${dt.neonGradient}`}>
              {formatCurrencyShort(
                (maleData?.seasonDonationTotal || 0) + (femaleData?.seasonDonationTotal || 0)
              )}
            </p>
          </div>
          <Sparkles className={`w-5 h-5 ${dt.text} opacity-40`} />
        </div>

        {/* Donor rows */}
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {donors.map((donor, i) => {
            const progress = Math.max(5, (donor.totalAmount / maxAmount) * 100);
            const medal = RANK_MEDALS[i] || null;

            return (
              <div
                key={donor.donorName}
                className="group flex items-center gap-3 p-3 sm:p-4 rounded-2xl hover:${dt.hoverBgSubtle} transition-colors duration-200 animate-fade-enter-sm"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Rank */}
                <span className="w-6 text-center text-sm shrink-0">
                  {medal || <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                </span>

                {/* Initials avatar */}
                <div className={`w-8 h-8 rounded-lg ${dt.iconBg} flex items-center justify-center shrink-0`}>
                  <span className={`text-[10px] font-bold ${dt.text}`}>{getInitials(donor.donorName)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate">{donor.donorName}</span>
                  {(() => {
                    const sawerTier = getSawerTier(donor.totalAmount);
                    if (!sawerTier) return null;
                    const tierColors: Record<string, { bg: string; border: string; text: string }> = {
                      sawer_diamond: { bg: 'rgba(87,181,255,0.15)', border: 'rgba(87,181,255,0.4)', text: 'text-idm-male-light' },
                      sawer_gold: { bg: 'rgba(250,204,21,0.15)', border: 'rgba(250,204,21,0.4)', text: 'text-yellow-300' },
                      sawer_silver: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: 'text-muted-foreground' },
                      sawer_bronze: { bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.4)', text: 'text-amber-400' },
                    };
                    const tc = tierColors[sawerTier] || tierColors.sawer_bronze;
                    const tierLabel = sawerTier.replace('sawer_', '').charAt(0).toUpperCase() + sawerTier.replace('sawer_', '').slice(1);
                    const tierEmoji = sawerTier === 'sawer_diamond' ? '💎' : sawerTier === 'sawer_gold' ? '🥇' : sawerTier === 'sawer_silver' ? '🥈' : '🥉';
                    return (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${tc.text}`}
                        style={{
                          backgroundColor: tc.bg,
                          borderColor: tc.border,
                        }}
                        title={`Sawer ${tierLabel}`}
                      >
                        {tierEmoji} {tierLabel}
                      </span>
                    );
                  })()}
                    <span className={`text-xs font-bold ${dt.neonGradient} shrink-0 ml-2`}>
                      {formatCurrencyShort(donor.totalAmount)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className={`h-1.5 rounded-full ${dt.casinoBar} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        i === 0
                          ? 'from-yellow-500 to-amber-400'
                          : i === 1
                          ? 'from-gray-300 to-gray-400'
                          : i === 2
                          ? 'from-amber-600 to-amber-500'
                          : 'from-idm-gold-warm/60 to-idm-gold-warm/40'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Donation count badge */}
                <Badge className={`text-[8px] shrink-0 ${dt.badgeBg} border`}>
                  {donor.donationCount}x
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Sawer CTA */}
        <div className="mt-4">
          <button
            onClick={onSawer}
            className="w-full py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:shadow-[0_0_20px_rgba(229,190,74,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer min-h-[36px]"
          >
            💰 Sawer Sekarang
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
