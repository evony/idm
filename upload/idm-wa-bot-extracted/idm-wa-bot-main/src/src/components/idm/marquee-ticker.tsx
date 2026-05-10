'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReducedMotion } from 'framer-motion';

/* ========== Feed Item Types ========== */
interface FeedItem {
  id: string;
  type: 'transfer' | 'donation' | 'score' | 'champion' | 'mvp' | 'registration';
  icon: string;
  title: string;
  subtitle: string;
  timestamp: string;
  division?: string;
  accent: string;
}

/* ========== Time Formatter ========== */
function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Baru';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}j`;
  if (days < 7) return `${days}h`;
  return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/* ========== Fallback Demo Items (shown when no data) ========== */
const DEMO_ITEMS: FeedItem[] = [
  { id: 'demo-1', type: 'champion', icon: '🏆', title: 'Team Alpha Juara Week 5!', subtitle: 'Male Division', timestamp: new Date().toISOString(), division: 'male', accent: '#d4a853' },
  { id: 'demo-2', type: 'donation', icon: '💰', title: 'CommunityPartner menyawer Rp500rb', subtitle: 'Donasi Weekly', timestamp: new Date().toISOString(), accent: '#22c55e' },
  { id: 'demo-3', type: 'score', icon: '⚽', title: 'Club A 3–1 Club B', subtitle: 'Week 5 • Club A menang!', timestamp: new Date().toISOString(), division: 'male', accent: '#06b6d4' },
  { id: 'demo-4', type: 'mvp', icon: '⭐', title: 'Dancer_X MVP Week 5!', subtitle: 'Male Division', timestamp: new Date().toISOString(), division: 'male', accent: '#eab308' },
  { id: 'demo-5', type: 'transfer', icon: '🔄', title: 'StarPlayer pindah ke Club C', subtitle: 'Dari Club A → Club C', timestamp: new Date().toISOString(), division: 'female', accent: '#a855f7' },
  { id: 'demo-6', type: 'registration', icon: '🆕', title: 'NewDancer mendaftar sebagai pemain', subtitle: 'Female Division', timestamp: new Date().toISOString(), division: 'female', accent: '#22d3ee' },
  { id: 'demo-7', type: 'donation', icon: '💰', title: 'AnonDonor menyawer Rp1jt', subtitle: 'Donasi Season', timestamp: new Date().toISOString(), accent: '#22c55e' },
  { id: 'demo-8', type: 'champion', icon: '🏆', title: 'Team Omega Juara Week 4!', subtitle: 'Female Division', timestamp: new Date().toISOString(), division: 'female', accent: '#d4a853' },
  { id: 'demo-9', type: 'score', icon: '⚽', title: 'Club D 2–2 Club E', subtitle: 'Week 5 • Seru!', timestamp: new Date().toISOString(), division: 'female', accent: '#06b6d4' },
  { id: 'demo-10', type: 'donation', icon: '💎', title: 'VIPSupporter menyawer Rp250rb', subtitle: 'Donasi Season', timestamp: new Date().toISOString(), accent: '#22c55e' },
];

/* ========== Accent colors per type ========== */
const TYPE_ACCENT: Record<FeedItem['type'], string> = {
  champion: '#d4a853',
  mvp: '#eab308',
  donation: '#22c55e',
  score: '#06b6d4',
  transfer: '#a855f7',
  registration: '#22d3ee',
};

/* ========== Single Feed Card ========== */
function FeedCard({ item }: { item: FeedItem }) {
  const accent = item.accent || TYPE_ACCENT[item.type] || '#d4a853';

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 rounded-lg shrink-0 border transition-all duration-300 hover:scale-[1.02] cursor-default select-none"
      style={{
        background: `linear-gradient(135deg, ${accent}08 0%, ${accent}03 100%)`,
        borderColor: `${accent}20`,
      }}
    >
      {/* Icon with glow */}
      <span
        className="text-base shrink-0 drop-shadow-sm"
        style={{ filter: `drop-shadow(0 0 4px ${accent}40)` }}
      >
        {item.icon}
      </span>

      {/* Content */}
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
          {item.title}
        </p>
        {item.subtitle && (
          <>
            <span className="text-muted-foreground/20 shrink-0 text-[8px]">◆</span>
            <p className="text-[10px] text-muted-foreground/70 truncate max-w-[100px] sm:max-w-[140px] hidden sm:block">
              {item.subtitle}
            </p>
          </>
        )}
      </div>

      {/* Time badge */}
      <span
        className="text-[9px] font-medium shrink-0 tabular-nums px-1.5 py-0.5 rounded"
        style={{ color: `${accent}aa`, background: `${accent}10` }}
      >
        {formatTimeAgo(item.timestamp)}
      </span>

      {/* Division dot */}
      {item.division && (
        <span
          className="w-2 h-2 rounded-full shrink-0 ring-1 ring-offset-1 ring-offset-background"
          style={{
            backgroundColor: item.division === 'male' ? '#06b6d4' : '#a855f7',
            boxShadow: `0 0 6px ${item.division === 'male' ? '#06b6d440' : '#a855f740'}`,
            '--tw-ring-color': item.division === 'male' ? '#06b6d460' : '#a855f760',
          } as React.CSSProperties}
        />
      )}
    </div>
  );
}

/* ========== Separator Diamond ========== */
function Separator() {
  return (
    <span className="text-[8px] text-[#d4a853]/30 shrink-0 mx-1 select-none">◆</span>
  );
}

/* ========== Main MarqueeTicker — Pro Infinite Scroll ========== */
export function MarqueeTicker() {
  const prefersReducedMotion = useReducedMotion();

  const { data } = useQuery<{ items: FeedItem[] }>({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await fetch('/api/feed');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const items = useMemo(() => {
    if (data?.items && data.items.length > 0) return data.items;
    return DEMO_ITEMS;
  }, [data?.items]);

  if (items.length === 0) return null;

  // Duration based on item count — smooth & readable
  const duration = Math.max(30, items.length * 4);

  // Build the track: items + separators, tripled for seamless loop
  const buildTrack = (trackItems: FeedItem[]) => {
    const elements: React.ReactNode[] = [];
    trackItems.forEach((item, i) => {
      elements.push(<FeedCard key={`card-${item.id}-${i}`} item={item} />);
      if (i < trackItems.length - 1) {
        elements.push(<Separator key={`sep-${i}`} />);
      }
    });
    return elements;
  };

  const trackContent = buildTrack(items);

  return (
    <div className="w-full overflow-hidden relative group">
      {/* Fade edges — premium gradient mask */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, hsl(var(--background)), transparent)' }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, hsl(var(--background)), transparent)' }}
      />

      {/* Scrolling track — 3x duplicated for seamless infinite loop */}
      <div
        className="flex items-center shrink-0 ticker-track"
        style={{
          animationName: 'ticker-scroll',
          animationDuration: `${duration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: prefersReducedMotion ? 'paused' : 'running',
        }}
      >
        {trackContent}
        {trackContent}
        {trackContent}
      </div>

      {/* Hover pause overlay */}
      <style jsx>{`
        .ticker-track:hover {
          animation-play-state: paused !important;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
