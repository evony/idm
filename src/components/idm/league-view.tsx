'use client';

import { useAppStore } from '@/lib/store';
import {
  Trophy, Shield,
  BookOpen, Scale,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCommunityTheme } from '@/hooks/use-community-theme';
import { useQuery } from '@tanstack/react-query';

/* ═══════════════════════════════════════════════════════════════
   PERATURAN — Rules & Format Section
   Tournament rules and scoring format
   Reads from CMS settings (prefix: peraturan_)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Parse JSON items from CMS setting string ─── */
function parseItems(value: string | undefined, fallback: { label: string; value: string; highlight: boolean }[]): { label: string; value: string; highlight: boolean }[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

/* ─── Default fallback data — sesuai logika backend score/route.ts ─── */
const DEFAULTS = {
  peraturan_subtitle: 'Panduan lengkap sistem poin dan peraturan pertandingan Tarkam IDM. Pastikan Anda memahami semua aturan sebelum bertanding.',
  peraturan_poin_title: 'Sistem Poin Tarkam',
  peraturan_poin_items: JSON.stringify([
    { label: 'Menang Pertandingan', value: '+2 Poin', highlight: true },
    { label: 'Partisipasi Turnamen', value: '+1 Poin (sekali/tournament)', highlight: true },
    { label: 'Seri / Draw (Grup)', value: '+1 Poin', highlight: false },
    { label: 'Kalah Pertandingan', value: '0 Poin', highlight: false },
    { label: 'MVP Turnamen', value: 'Sesuai Hadiah', highlight: true },
    { label: 'Juara 1/2/3', value: 'Sesuai Hadiah', highlight: true },
  ]),
  peraturan_match_title: 'Peraturan Pertandingan',
  peraturan_match_items: JSON.stringify([
    { label: 'Peserta wajib hadir', value: 'Tepat Waktu', highlight: true },
    { label: 'Penilaian', value: 'Oleh Juri', highlight: false },
    { label: 'Keputusan Juri', value: 'Final & Binding', highlight: true },
    { label: 'MVP Dipilih', value: 'Oleh Organizer', highlight: false },
    { label: 'Hasil Diumumkan', value: 'Real-time', highlight: true },
  ]),
};

/* ─── Rule Card ─── */
function RuleCard({ icon: Icon, title, items, accentColor }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; value: string; highlight?: boolean }[];
  accentColor?: string;
}) {
  const ct = useCommunityTheme();
  return (
    <Card className={`${ct.casinoCard} overflow-hidden`}>
      <div className={ct.casinoBar} />
      <CardContent className="p-0 relative z-10">
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${ct.borderSubtle}`}>
          <div className={`w-5 h-5 rounded ${ct.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3 h-3 ${ct.neonText}`} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
        </div>
        <div className="p-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${ct.bgSubtle}`}>
              <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
              <span className={`text-xs font-bold ${item.highlight ? ct.neonText : 'text-foreground'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LeagueView() {
  const { division } = useAppStore();
  const ct = useCommunityTheme();
  const divisionLabel = division === 'semua' ? 'Semua' : division === 'male' ? 'Male' : 'Female';

  /* ── Fetch CMS settings ── */
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/settings');
      return res.json() as Promise<{ settings: { id: string; key: string; value: string; type: string }[]; map: Record<string, string> }>;
    },
    staleTime: 60_000,
  });

  const settingsMap = settingsData?.map || {};

  /* ── Parsed items from CMS ── */
  const subtitle = settingsMap.peraturan_subtitle || DEFAULTS.peraturan_subtitle;
  const poinTitle = settingsMap.peraturan_poin_title || DEFAULTS.peraturan_poin_title;
  const poinItems = parseItems(settingsMap.peraturan_poin_items, parseItems(DEFAULTS.peraturan_poin_items, []));
  const matchTitle = settingsMap.peraturan_match_title || DEFAULTS.peraturan_match_title;
  const matchItems = parseItems(settingsMap.peraturan_match_items, parseItems(DEFAULTS.peraturan_match_items, []));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-idm-gold-warm" />
      </div>
    );
  }

  return (
    <div className="lg:community-surface lg:rounded-3xl lg:border lg:border-border/30 overflow-hidden relative">
      {/* Subtle gold radial glow at top — desktop only */}
      <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-48 bg-idm-gold-warm/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-2 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
      {/* ═══ Context Header — consistent with all views ═══ */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-idm-gold-warm" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-idm-gold-warm">Peraturan</h2>
          <p className="text-[10px] text-muted-foreground/60">Divisi {divisionLabel} — Tarkam IDM</p>
        </div>
      </div>

      {/* ═══ Hero Banner ═══ */}
      <Card className={`${ct.casinoCard} ${ct.casinoGlow} casino-shimmer overflow-hidden`}>
        <div className={ct.casinoBar} />
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
          <div className="relative z-10 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl ${ct.iconBg} flex items-center justify-center`}>
                <BookOpen className={`w-5 h-5 ${ct.neonText}`} />
              </div>
              <div>
                <h2 className={`text-lg font-black ${ct.neonGradient}`}>Peraturan</h2>
                <p className="text-[11px] text-muted-foreground">Divisi {divisionLabel} — Tarkam IDM</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </Card>

      {/* ═══ Scoring Format ═══ */}
      <div className="stagger-item-subtle stagger-d0">
        <RuleCard
          icon={Trophy}
          title={poinTitle}
          items={poinItems}
        />
      </div>

      {/* ═══ Match Rules ═══ */}
      <div className="stagger-item-subtle stagger-d1">
        <RuleCard
          icon={Scale}
          title={matchTitle}
          items={matchItems}
        />
      </div>
      </div>
    </div>
  );
}
