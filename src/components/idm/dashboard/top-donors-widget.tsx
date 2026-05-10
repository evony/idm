'use client';

import { useQuery } from '@tanstack/react-query';
import { Heart, Gift, Trophy, Medal, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { formatCurrency } from '@/lib/utils';
import { getSawerTier } from '@/lib/skin-utils';

/* ─── Types ─── */
interface TopDonor {
  donorName: string;
  totalAmount: number;
  donationCount: number;
  latestType: string;
  latestDate: string | null;
}

interface TopDonorsData {
  donors: TopDonor[];
  summary: {
    totalAmount: number;
    totalDonors: number;
    totalDonations: number;
  };
}

interface TopDonorsWidgetProps {
  onDonate: () => void;
}

/* ─── Helpers ─── */

/** Format Indonesian Rupiah — compact for widget display */
function formatRupiah(amount: number): string {
  return formatCurrency(amount);
}

/** Relative time in Indonesian */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Rank badge component — gold/silver/bronze for top 3 */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm donor-rank-badge">
        <Trophy className="w-3.5 h-3.5 text-yellow-900" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-sm donor-rank-badge">
        <Medal className="w-3.5 h-3.5 text-gray-700" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-sm donor-rank-badge">
        <Medal className="w-3.5 h-3.5 text-amber-200" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
      {rank}
    </div>
  );
}

/** Donation type badge */
function DonationTypeBadge({ type }: { type: string }) {
  const isSeason = type === 'season';
  return (
    <Badge
      className={`text-[9px] px-1.5 py-0 h-4 font-semibold border-0 ${
        isSeason
          ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/20'
          : 'bg-idm-gold-warm/15 text-idm-gold-warm hover:bg-idm-gold-warm/20'
      }`}
    >
      {isSeason ? 'Season' : 'Weekly'}
    </Badge>
  );
}

/* ─── Sub-components ─── */

function LoadingSkeleton() {
  return (
    <Card className="overflow-hidden relative glassmorphism-donor-card h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <Skeleton className="h-3 w-20 rounded flex-1" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyDonorsState({ onDonate }: { onDonate: () => void }) {
  const dt = useDivisionTheme();

  return (
    <Card className="overflow-hidden relative glassmorphism-donor-card h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="w-4 h-4 text-idm-gold-warm" />
          Top Saweran
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-6 text-center donor-empty-state">
          {/* Floating heart icon with glow */}
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="empty-glow-ring absolute inset-0 rounded-full bg-idm-gold-warm/10" />
            <div className="empty-icon-float relative z-10">
              <Heart className="w-8 h-8 text-idm-gold-warm/40" />
            </div>
          </div>
          <p className="text-xs font-semibold text-muted-foreground/70 mb-1">
            Belum ada penyawer
          </p>
          <p className="text-[10px] text-muted-foreground/50 mb-3">
            Jadilah yang pertama menyawer prize pool!
          </p>
          <Button
            size="sm"
            onClick={onDonate}
            className={`h-7 text-[10px] font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:opacity-90 transition-opacity ${dt.neonPulse}`}
          >
            <Gift className="w-3 h-3 mr-1" />
            Sawer Sekarang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─── */

export function TopDonorsWidget({ onDonate }: TopDonorsWidgetProps) {
  const dt = useDivisionTheme();

  const { data, isLoading } = useQuery<TopDonorsData>({
    queryKey: ['top-donors'],
    queryFn: async () => {
      const res = await fetch('/api/donations/top-donors');
      if (!res.ok) throw new Error('Failed to fetch top donors');
      return res.json();
    },
    staleTime: 30000,
  });

  if (isLoading) return <LoadingSkeleton />;

  const donors = data?.donors ?? [];
  const summary = data?.summary;

  if (donors.length === 0) return <EmptyDonorsState onDonate={onDonate} />;

  return (
    <Card className="overflow-hidden relative glassmorphism-donor-card h-full flex flex-col">
      {/* Gold accent top bar */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-idm-gold-warm to-transparent opacity-60" />

      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-idm-gold-warm" />
            Top Saweran
          </CardTitle>
          {summary && summary.totalAmount > 0 && (
            <div className="text-right">
              <p className={`text-xs font-bold ${dt.neonGradient}`}>
                {formatRupiah(summary.totalAmount)}
              </p>
              <p className="text-[9px] text-muted-foreground/60">
                dari {summary.totalDonors} penyawer
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Donor list */}
        <div className="max-h-80 lg:max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1 pr-1 flex-1">
          {donors.map((donor, i) => (
            <div
              key={donor.donorName}
              className="donor-row-enter flex items-center gap-2 p-3 rounded-lg hover:bg-idm-gold-warm/5 transition-colors group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Rank */}
              <RankBadge rank={i + 1} />

              {/* Name + info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">
                    {donor.donorName || 'Anonymous'}
                  </span>
                  <DonationTypeBadge type={donor.latestType} />
                  {(() => {
                    const sawerTier = donor.latestType === 'weekly' ? getSawerTier(donor.totalAmount) : null;
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
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {donor.latestDate && (
                    <>
                      <Clock className="w-2.5 h-2.5 text-muted-foreground/40" />
                      <span className="text-[9px] text-muted-foreground/60">
                        {formatRelativeTime(donor.latestDate)}
                      </span>
                      <span className="text-[9px] text-muted-foreground/30">·</span>
                    </>
                  )}
                  <span className="text-[9px] text-muted-foreground/50">
                    {donor.donationCount}x sawer
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-idm-gold-warm donor-amount">
                  {formatRupiah(donor.totalAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA button — compact & centered */}
        <div className="mt-3 pt-2 border-t border-border/30 flex justify-center">
          <Button
            size="sm"
            onClick={onDonate}
            className={`h-7 text-[10px] font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black hover:opacity-90 transition-opacity cursor-pointer ${dt.neonPulse}`}
          >
            <Gift className="w-3 h-3 mr-1" />
            Sawer Sekarang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
