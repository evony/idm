'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Play,
  Trophy,
  Star,
  Clock,
  Zap,
  Flame,
  Sparkles,
  Video,
  Lock,
  X,
} from 'lucide-react';
import { AnimatedSection, SectionHeader } from './shared';
import { hexToRgba } from '@/lib/utils';
import type { StatsData } from '@/types/stats';

/* ═══════════════════════════════════════════════════════════════
   TARKAM IDM — VIDEO HIGHLIGHTS SECTION
   Engaging video gallery showcasing tournament moments
   Layout: LEFT large banner + RIGHT scrollable video list
   ═══════════════════════════════════════════════════════════════ */

interface ExperiencesSectionProps {
  maleData: StatsData | undefined;
  femaleData: StatsData | undefined;
  leagueData: any;
  cmsSections: Record<string, any>;
  cmsSettings?: Record<string, string>;
  onEnterApp: (division: 'male' | 'female') => void;
  onVideoPlay?: (url: string, title: string) => void;
}

/* ─── Video Highlight Type ─── */
interface VideoHighlight {
  id: string;
  title: string;
  /** CMS-managed subtitle (e.g. "S1 Highlights", "S2 MVP") — overrides auto-generated label */
  customSubtitle?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  weekNumber?: number;
  seasonNumber?: number;
  division: 'male' | 'female' | 'both';
  duration?: string;
  type: 'match' | 'mvp' | 'champion' | 'highlights';
}

/* ─── Color Tokens ─── */
const COLORS = {
  gold: '#d4a853',
  cyan: '#2E9FFF',
  purple: '#FF2D78',
  darkBg: 'var(--bg-deep)',
  cardBg: 'var(--bg-mid)',
  mutedText: '#a09880',
  lightText: '#f5f0e8',
} as const;

/* ─── Division config helper ─── */
function getDivisionConfig(division: 'male' | 'female' | 'both') {
  if (division === 'male') {
    return {
      color: COLORS.cyan,
      glow: 'rgba(46,159,255,0.15)',
      bg: 'rgba(46,159,255,0.10)',
      border: 'rgba(46,159,255,0.20)',
      hoverBorder: 'rgba(46,159,255,0.35)',
      gradient: 'from-[#2E9FFF]/20 via-mid to-mid',
      label: 'MALE',
      meshBg: `
        radial-gradient(ellipse at 15% 30%, rgba(46,159,255,0.18) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, rgba(87,181,255,0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 95%, rgba(20,120,217,0.10) 0%, transparent 45%),
        radial-gradient(ellipse at 70% 60%, rgba(143,206,255,0.06) 0%, transparent 40%),
        conic-gradient(from 180deg at 50% 50%, rgba(46,159,255,0.04) 0deg, transparent 60deg, rgba(87,181,255,0.03) 120deg, transparent 180deg, rgba(20,120,217,0.04) 240deg, transparent 300deg, rgba(46,159,255,0.04) 360deg)
      `,
      glowLine: `rgba(46,159,255,0.45)`,
      shadow: `0 0 8px rgba(46,159,255,0.25), 0 0 3px rgba(46,159,255,0.4)`,
    };
  }
  if (division === 'female') {
    return {
      color: COLORS.purple,
      glow: 'rgba(255,45,120,0.15)',
      bg: 'rgba(255,45,120,0.10)',
      border: 'rgba(255,45,120,0.20)',
      hoverBorder: 'rgba(255,45,120,0.35)',
      gradient: 'from-[#FF2D78]/20 via-mid to-mid',
      label: 'FEMALE',
      meshBg: `
        radial-gradient(ellipse at 15% 30%, rgba(255,45,120,0.18) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, rgba(255,92,154,0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 95%, rgba(217,22,94,0.10) 0%, transparent 45%),
        radial-gradient(ellipse at 70% 60%, rgba(255,143,188,0.06) 0%, transparent 40%),
        conic-gradient(from 180deg at 50% 50%, rgba(255,45,120,0.04) 0deg, transparent 60deg, rgba(255,92,154,0.03) 120deg, transparent 180deg, rgba(217,22,94,0.04) 240deg, transparent 300deg, rgba(255,45,120,0.04) 360deg)
      `,
      glowLine: `rgba(255,45,120,0.45)`,
      shadow: `0 0 8px rgba(255,45,120,0.25), 0 0 3px rgba(255,45,120,0.4)`,
    };
  }
  return {
    color: COLORS.gold,
    glow: 'rgba(212,168,83,0.15)',
    bg: 'rgba(212,168,83,0.10)',
    border: 'rgba(212,168,83,0.20)',
    hoverBorder: 'rgba(212,168,83,0.35)',
    gradient: 'from-[#d4a853]/20 via-mid to-mid',
    label: 'BOTH',
    meshBg: `
      radial-gradient(ellipse at 15% 30%, rgba(212,168,83,0.18) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 15%, rgba(229,190,74,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 95%, rgba(184,134,11,0.10) 0%, transparent 45%),
      radial-gradient(ellipse at 70% 60%, rgba(245,215,122,0.06) 0%, transparent 40%),
      conic-gradient(from 180deg at 50% 50%, rgba(212,168,83,0.04) 0deg, transparent 60deg, rgba(229,190,74,0.03) 120deg, transparent 180deg, rgba(184,134,11,0.04) 240deg, transparent 300deg, rgba(212,168,83,0.04) 360deg)
    `,
    glowLine: `rgba(212,168,83,0.45)`,
    shadow: `0 0 8px rgba(212,168,83,0.25), 0 0 3px rgba(212,168,83,0.4)`,
  };
}

/* ─── Type icon & label config ─── */
function getTypeConfig(type: VideoHighlight['type']) {
  switch (type) {
    case 'champion':
      return { icon: Trophy, label: 'CHAMPION', accent: COLORS.gold };
    case 'mvp':
      return { icon: Star, label: 'MVP', accent: COLORS.gold };
    case 'match':
      return { icon: Flame, label: 'MATCH', accent: COLORS.gold };
    case 'highlights':
      return { icon: Sparkles, label: 'HIGHLIGHTS', accent: COLORS.gold };
  }
}

/* ─── Build Video Highlights from Tournament Data ─── */
function buildVideoHighlights(
  maleData: StatsData | undefined,
  femaleData: StatsData | undefined,
  leagueData: any,
  cmsSections: Record<string, any>,
): VideoHighlight[] {
  const videos: VideoHighlight[] = [];

  // 1. Check CMS for managed video entries
  const cmsVideos = cmsSections?.experiences?.videos || cmsSections?.videos?.items || [];
  if (Array.isArray(cmsVideos)) {
    for (const v of cmsVideos) {
      if (v?.title) {
        videos.push({
          id: v.id || `cms-${videos.length}`,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl || v.thumbnail_url,
          videoUrl: v.videoUrl || v.video_url || v.url,
          weekNumber: v.weekNumber || v.week_number,
          seasonNumber: v.seasonNumber || v.season_number,
          division: v.division || 'both',
          duration: v.duration || undefined,
          type: v.type || 'highlights',
        });
      }
    }
  }

  // 2. Generate from weekly champions — Male
  if (maleData?.weeklyChampions?.length) {
    for (const wc of maleData.weeklyChampions) {
      if (wc.winnerTeam) {
        videos.push({
          id: `champ-male-w${wc.weekNumber}-s${wc.seasonNumber}`,
          title: `Week ${wc.weekNumber} Champion — ${wc.winnerTeam.name}`,
          weekNumber: wc.weekNumber,
          seasonNumber: wc.seasonNumber,
          division: 'male',
          type: 'champion',
          duration: '3:00',
        });
      }
    }
  }

  // 3. Generate from weekly champions — Female
  if (femaleData?.weeklyChampions?.length) {
    for (const wc of femaleData.weeklyChampions) {
      if (wc.winnerTeam) {
        videos.push({
          id: `champ-female-w${wc.weekNumber}-s${wc.seasonNumber}`,
          title: `Week ${wc.weekNumber} Champion — ${wc.winnerTeam.name}`,
          weekNumber: wc.weekNumber,
          seasonNumber: wc.seasonNumber,
          division: 'female',
          type: 'champion',
          duration: '3:00',
        });
      }
    }
  }

  // 4. Generate from MVP Hall of Fame — Male
  if (maleData?.mvpHallOfFame?.length) {
    for (const mvp of maleData.mvpHallOfFame) {
      videos.push({
        id: `mvp-male-w${mvp.weekNumber}`,
        title: `MVP Week ${mvp.weekNumber} — ${mvp.gamertag}`,
        weekNumber: mvp.weekNumber,
        division: 'male',
        type: 'mvp',
        duration: '2:00',
      });
    }
  }

  // 5. Generate from MVP Hall of Fame — Female
  if (femaleData?.mvpHallOfFame?.length) {
    for (const mvp of femaleData.mvpHallOfFame) {
      videos.push({
        id: `mvp-female-w${mvp.weekNumber}`,
        title: `MVP Week ${mvp.weekNumber} — ${mvp.gamertag}`,
        weekNumber: mvp.weekNumber,
        division: 'female',
        type: 'mvp',
        duration: '2:00',
      });
    }
  }

  // 6. Generate from top players — Male (MVP Spotlight)
  if (maleData?.topPlayers?.length) {
    for (let i = 0; i < Math.min(maleData.topPlayers.length, 3); i++) {
      const player = maleData.topPlayers[i];
      videos.push({
        id: `spotlight-male-${player.id}`,
        title: `MVP Spotlight — ${player.gamertag}`,
        weekNumber: undefined,
        seasonNumber: maleData.season?.number,
        division: 'male',
        type: 'mvp',
        duration: '2:30',
      });
    }
  }

  // 7. Generate from top players — Female (MVP Spotlight)
  if (femaleData?.topPlayers?.length) {
    for (let i = 0; i < Math.min(femaleData.topPlayers.length, 3); i++) {
      const player = femaleData.topPlayers[i];
      videos.push({
        id: `spotlight-female-${player.id}`,
        title: `MVP Spotlight — ${player.gamertag}`,
        weekNumber: undefined,
        seasonNumber: femaleData.season?.number,
        division: 'female',
        type: 'mvp',
        duration: '2:30',
      });
    }
  }

  // 8. Generate from recent matches — Male
  if (maleData?.recentMatches?.length) {
    for (let i = 0; i < Math.min(maleData.recentMatches.length, 3); i++) {
      const match = maleData.recentMatches[i];
      videos.push({
        id: `match-male-${match.id}`,
        title: `${match.club1?.name || 'TBD'} vs ${match.club2?.name || 'TBD'}`,
        weekNumber: match.week,
        seasonNumber: maleData.season?.number,
        division: 'male',
        type: 'match',
        duration: '4:00',
      });
    }
  }

  // 9. Generate from recent matches — Female
  if (femaleData?.recentMatches?.length) {
    for (let i = 0; i < Math.min(femaleData.recentMatches.length, 3); i++) {
      const match = femaleData.recentMatches[i];
      videos.push({
        id: `match-female-${match.id}`,
        title: `${match.club1?.name || 'TBD'} vs ${match.club2?.name || 'TBD'}`,
        weekNumber: match.week,
        seasonNumber: femaleData.season?.number,
        division: 'female',
        type: 'match',
        duration: '4:00',
      });
    }
  }

  // 10. Generate from tournaments — Male
  if (maleData?.tournaments?.length) {
    for (const t of maleData.tournaments) {
      // Only add if not already covered by weekly champion
      const existing = videos.find(v => v.weekNumber === t.weekNumber && v.division === 'male' && v.type === 'champion');
      if (!existing) {
        videos.push({
          id: `tournament-male-${t.id}`,
          title: `Week ${t.weekNumber} Tarkam — ${t.name}`,
          weekNumber: t.weekNumber,
          seasonNumber: maleData.season?.number,
          division: 'male',
          type: 'match',
          duration: '3:30',
        });
      }
    }
  }

  // 11. Generate from tournaments — Female
  if (femaleData?.tournaments?.length) {
    for (const t of femaleData.tournaments) {
      const existing = videos.find(v => v.weekNumber === t.weekNumber && v.division === 'female' && v.type === 'champion');
      if (!existing) {
        videos.push({
          id: `tournament-female-${t.id}`,
          title: `Week ${t.weekNumber} Tarkam — ${t.name}`,
          weekNumber: t.weekNumber,
          seasonNumber: femaleData.season?.number,
          division: 'female',
          type: 'match',
          duration: '3:30',
        });
      }
    }
  }

  // 12. Season highlights — generate for ALL completed seasons
  const maleSeasons = maleData?.allSeasons || [];
  const femaleSeasons = femaleData?.allSeasons || [];

  for (const season of maleSeasons) {
    if (season.status === 'COMPLETED' || season.number === maleData?.season?.number) {
      videos.push({
        id: `season-highlights-male-s${season.number}`,
        title: `Season ${season.number} Highlights — Male`,
        seasonNumber: season.number,
        division: 'male',
        type: 'highlights',
        duration: '5:00',
      });
    }
  }

  for (const season of femaleSeasons) {
    if (season.status === 'COMPLETED' || season.number === femaleData?.season?.number) {
      videos.push({
        id: `season-highlights-female-s${season.number}`,
        title: `Season ${season.number} Highlights — Female`,
        seasonNumber: season.number,
        division: 'female',
        type: 'highlights',
        duration: '5:00',
      });
    }
  }

  // 13. Tarkam Champion video
  if (leagueData?.tarkamChampion && leagueData.tarkamChampion.seasonNumber > 1) {
    videos.push({
      id: `tarkam-champion-s${leagueData.tarkamChampion.seasonNumber}`,
      title: `Season ${leagueData.tarkamChampion.seasonNumber} Tarkam Champion — ${leagueData.tarkamChampion.name}`,
      seasonNumber: leagueData.tarkamChampion.seasonNumber,
      division: 'both',
      type: 'champion',
      duration: '4:00',
    });
  }

  // 14. Ensure minimum 5+ videos — add generic placeholders if needed
  if (videos.length < 5) {
    const placeholders: VideoHighlight[] = [];
    const maleSn = maleData?.season?.number || 1;
    const femaleSn = femaleData?.season?.number || 1;

    if (!videos.find(v => v.division === 'male' && v.type === 'highlights')) {
      placeholders.push({
        id: `season-highlights-male-s${maleSn}`,
        title: `Season ${maleSn} Highlights — Male`,
        seasonNumber: maleSn,
        division: 'male',
        type: 'highlights',
        duration: '5:00',
      });
    }
    if (!videos.find(v => v.division === 'female' && v.type === 'highlights')) {
      placeholders.push({
        id: `season-highlights-female-s${femaleSn}`,
        title: `Season ${femaleSn} Highlights — Female`,
        seasonNumber: femaleSn,
        division: 'female',
        type: 'highlights',
        duration: '5:00',
      });
    }
    // Add top player spotlights if we still need more
    if (videos.length + placeholders.length < 5 && maleData?.topPlayers?.[0]) {
      placeholders.push({
        id: `spotlight-male-${maleData.topPlayers[0].id}`,
        title: `MVP Spotlight — ${maleData.topPlayers[0].gamertag}`,
        seasonNumber: maleSn,
        division: 'male',
        type: 'mvp',
        duration: '2:30',
      });
    }
    if (videos.length + placeholders.length < 5 && femaleData?.topPlayers?.[0]) {
      placeholders.push({
        id: `spotlight-female-${femaleData.topPlayers[0].id}`,
        title: `MVP Spotlight — ${femaleData.topPlayers[0].gamertag}`,
        seasonNumber: femaleSn,
        division: 'female',
        type: 'mvp',
        duration: '2:30',
      });
    }
    // Add upcoming match previews
    if (videos.length + placeholders.length < 5 && maleData?.upcomingMatches?.[0]) {
      const m = maleData.upcomingMatches[0];
      placeholders.push({
        id: `preview-male-${m.id}`,
        title: `Up Next: ${m.club1.name} vs ${m.club2.name}`,
        weekNumber: m.week,
        seasonNumber: maleSn,
        division: 'male',
        type: 'match',
        duration: '1:00',
      });
    }
    if (videos.length + placeholders.length < 5 && femaleData?.upcomingMatches?.[0]) {
      const m = femaleData.upcomingMatches[0];
      placeholders.push({
        id: `preview-female-${m.id}`,
        title: `Up Next: ${m.club1.name} vs ${m.club2.name}`,
        weekNumber: m.week,
        seasonNumber: femaleSn,
        division: 'female',
        type: 'match',
        duration: '1:00',
      });
    }
    // Generic teaser placeholders as last resort
    const genericCount = 5 - (videos.length + placeholders.length);
    for (let i = 0; i < genericCount; i++) {
      const div = i % 2 === 0 ? 'male' as const : 'female' as const;
      placeholders.push({
        id: `generic-${i}`,
        title: `Season ${div === 'male' ? maleSn : femaleSn} — Coming Soon`,
        seasonNumber: div === 'male' ? maleSn : femaleSn,
        division: div,
        type: 'highlights',
        duration: '3:00',
      });
    }
    videos.push(...placeholders);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = videos.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  // Sort: featured/highlights first, then by week number descending
  const typeOrder: Record<string, number> = { highlights: 0, champion: 1, mvp: 2, match: 3 };
  deduped.sort((a, b) => {
    const typeDiff = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
    if (typeDiff !== 0) return typeDiff;
    return (b.weekNumber || 0) - (a.weekNumber || 0);
  });

  return deduped;
}

/* ─── Filter Tab Component ─── */
function FilterTabs({
  active,
  onChange,
  counts,
}: {
  active: 'all' | 'male' | 'female';
  onChange: (v: 'all' | 'male' | 'female') => void;
  counts: { all: number; male: number; female: number };
}) {
  const tabs: { key: 'all' | 'male' | 'female'; label: string; color: string; count: number }[] = [
    { key: 'all', label: 'Semua', color: COLORS.gold, count: counts.all },
    { key: 'male', label: 'Male', color: COLORS.cyan, count: counts.male },
    { key: 'female', label: 'Female', color: COLORS.purple, count: counts.female },
  ];

  return (
    <div className="flex items-center gap-2">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer overflow-hidden"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${tab.color}18 0%, ${tab.color}08 100%)`
                : 'transparent',
              color: isActive ? tab.color : COLORS.mutedText,
              border: `1px solid ${isActive ? `${tab.color}35` : 'rgba(255,255,255,0.06)'}`,
              boxShadow: isActive
                ? `0 0 12px ${hexToRgba(tab.color, 0.08)}, 0 0 3px ${hexToRgba(tab.color, 0.15)}, inset 0 1px 0 ${hexToRgba(tab.color, 0.08)}`
                : 'none',
            }}
            aria-label={`Filter by ${tab.label}`}
            aria-pressed={isActive}
          >
            {/* Top glow line when active */}
            {isActive && (
              <div
                className="absolute inset-x-0 top-0 h-px pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, ${tab.color}50, transparent)`,
                }}
              />
            )}
            {tab.label}
            <span
              className="ml-1.5 text-[10px] font-semibold"
              style={{ opacity: 0.7 }}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── YouTube URL Parser ─── */
function parseYouTubeUrl(url: string): { id: string; startTime: number } | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  let startTime = 0;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const t = urlObj.searchParams.get('t');
    if (t) startTime = parseInt(t.replace(/s$/, ''), 10) || 0;
  } catch {
    const tMatch = url.match(/[?&]t=(\d+)s?/);
    if (tMatch) startTime = parseInt(tMatch[1], 10) || 0;
  }
  return { id: match[1], startTime };
}

/* ─── FeaturedBanner — LEFT side large banner ─── */
function FeaturedBanner({
  video,
  onPlay,
  isSelected,
  isPlayingInline,
  onStopPlayback,
}: {
  video: VideoHighlight;
  onPlay: (video: VideoHighlight) => void;
  isSelected: boolean;
  isPlayingInline: boolean;
  onStopPlayback: () => void;
}) {
  const divConfig = getDivisionConfig(video.division);
  const hasVideo = !!video.videoUrl;

  // Parse YouTube URL for inline playback
  const ytInfo = hasVideo ? parseYouTubeUrl(video.videoUrl!) : null;
  const isYouTube = ytInfo !== null;

  return (
    <div className="reveal reveal-scale-in group relative w-full lg:w-[55%] shrink-0">
      {/* Single optimized glow on hover */}
      <div
        className="absolute -inset-0.5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none will-change-[opacity]"
        style={{ background: divConfig.glow }}
      />

      <div
        className="relative rounded-2xl overflow-hidden border transition-all duration-300 aspect-[4/3] lg:aspect-auto lg:h-full"
        style={{
          background: COLORS.cardBg,
          borderColor: isSelected ? `${divConfig.color}40` : divConfig.border,
          boxShadow: isSelected
            ? `${divConfig.shadow}, 0 6px 24px rgba(0,0,0,0.35)`
            : '0 2px 8px rgba(0,0,0,0.18)',
        }}
        onMouseEnter={(e) => {
          if (!isPlayingInline) {
            e.currentTarget.style.borderColor = divConfig.hoverBorder;
            e.currentTarget.style.boxShadow = `${divConfig.shadow}, 0 8px 32px ${divConfig.glow}`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isPlayingInline) {
            e.currentTarget.style.borderColor = isSelected ? `${divConfig.color}40` : divConfig.border;
            e.currentTarget.style.boxShadow = isSelected
              ? `${divConfig.shadow}, 0 6px 24px rgba(0,0,0,0.35)`
              : '0 2px 8px rgba(0,0,0,0.18)';
          }
        }}
      >
        {/* ═══ Division-colored glow line at top ═══ */}
        <div
          className="absolute inset-x-0 top-0 h-px z-20 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 10%, ${divConfig.glowLine} 35%, ${hexToRgba(divConfig.color, 0.6)} 50%, ${divConfig.glowLine} 65%, transparent 90%)`,
          }}
        />
        {/* ═══ INLINE VIDEO PLAYER (autoplay on click) ═══ */}
        {isPlayingInline && hasVideo ? (
          <div className="absolute inset-0 z-30 bg-black">
            {/* YouTube iframe — autoplay so one click plays immediately */}
            {isYouTube ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytInfo.id}?autoplay=1&rel=0&modestbranding=1${ytInfo.startTime ? `&start=${ytInfo.startTime}` : ''}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <video
                src={video.videoUrl}
                controls
                autoPlay
                className="absolute inset-0 w-full h-full object-contain"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            )}

            {/* Close player button — top right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStopPlayback();
              }}
              className="absolute top-3 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 text-white/80 hover:bg-black/90 hover:text-white transition-all duration-200 cursor-pointer"
              aria-label="Tutup video"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tutup</span>
            </button>

            {/* Video title overlay — bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30 pointer-events-none">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                {video.title}
              </h3>
            </div>
          </div>
        ) : (
          <>
            {/* ═══ PREVIEW / THUMBNAIL MODE ═══ */}
            {hasVideo && isYouTube ? (
              /* ── YouTube thumbnail as background when video URL exists ── */
              <img
                src={`https://img.youtube.com/vi/${ytInfo!.id}/maxresdefault.jpg`}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  // Fallback: maxresdefault not available → try hqdefault
                  const img = e.currentTarget;
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = '1';
                    img.src = `https://img.youtube.com/vi/${ytInfo!.id}/hqdefault.jpg`;
                  }
                }}
              />
            ) : (
              /* ── Cinematic empty preview — optimized mesh gradient ═══ */
              <>
                {/* Base dark + mesh gradient (single layer) */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: divConfig.meshBg,
                    backgroundColor: 'rgba(6,8,18,0.70)',
                  }}
                />

                {/* Subtle grid texture */}
                <div
                  className="absolute inset-0 opacity-[0.025]"
                  style={{
                    backgroundImage: `
                      linear-gradient(${hexToRgba(divConfig.color, 0.3)} 1px, transparent 1px),
                      linear-gradient(90deg, ${hexToRgba(divConfig.color, 0.3)} 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Vignette overlay */}
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8,10,20,0.6) 100%)' }} />

                {/* Film-strip lines — reduced to 8 */}
                <div className="absolute inset-x-0 top-0 h-10 flex items-start justify-center gap-[32px] opacity-[0.04] pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div key={`ft-${i}`} className="w-2.5 h-6 rounded-sm" style={{ background: divConfig.color }} />
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-10 flex items-end justify-center gap-[32px] opacity-[0.04] pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div key={`fb-${i}`} className="w-2.5 h-6 rounded-sm" style={{ background: divConfig.color }} />
                  ))}
                </div>

                {/* Watermark icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  <Video className="w-32 h-32" style={{ color: divConfig.color }} />
                </div>

                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-1.5 border-t-1.5 rounded-tl-lg pointer-events-none" style={{ borderColor: `${divConfig.color}20` }} />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-1.5 border-t-1.5 rounded-tr-lg pointer-events-none" style={{ borderColor: `${divConfig.color}20` }} />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-1.5 border-b-1.5 rounded-bl-lg pointer-events-none" style={{ borderColor: `${divConfig.color}20` }} />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-1.5 border-b-1.5 rounded-br-lg pointer-events-none" style={{ borderColor: `${divConfig.color}20` }} />

                {/* Sparkle particles — reduced to 4 */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={`spark-${i}`}
                      className="absolute rounded-full will-change-transform"
                      style={{
                        left: `${15 + i * 20}%`,
                        top: `${25 + (i % 2) * 30}%`,
                        width: 2,
                        height: 2,
                        background: `radial-gradient(circle, ${hexToRgba(divConfig.color, 0.3)} 0%, transparent 70%)`,
                        animation: `ambient-particle ${10 + i * 3}s linear ${i * 2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Dark overlay for readability on thumbnail */}
            {hasVideo && isYouTube && (
              <div className="absolute inset-0 bg-black/30" />
            )}

            {/* Centered play button overlay — clickable to start video */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
              onClick={() => onPlay(video)}
              role="button"
              tabIndex={0}
              aria-label={hasVideo ? `Play video: ${video.title}` : `Video belum tersedia: ${video.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPlay(video);
                }
              }}
            >
              <div className="btn-press relative">
                {hasVideo ? (
                  /* ── Available video: cinematic play button ── */
                  <>
                    {/* Outer glow ring */}
                    <div
                      className="absolute inset-0 -m-4 rounded-full opacity-40"
                      style={{
                        background: `radial-gradient(circle, ${divConfig.glow} 0%, transparent 70%)`,
                        animation: 'pulse-glow 2.5s ease-in-out infinite',
                      }}
                    />
                    {/* Play button */}
                    <div
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/30"
                      style={{
                        background: 'rgba(255,255,255,0.20)',
                        backdropFilter: 'blur(12px)',
                        border: `2px solid rgba(255,255,255,0.35)`,
                        boxShadow: `0 0 40px ${divConfig.glow}, 0 0 80px ${hexToRgba(divConfig.color, 0.08)}, inset 0 0 20px rgba(255,255,255,0.05)`,
                      }}
                    >
                      <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 text-white fill-white" />
                    </div>
                    {/* Pulse ring */}
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-15"
                      style={{
                        border: `2px solid ${divConfig.color}`,
                      }}
                    />
                  </>
                ) : (
                  /* ── No video: elegant coming soon indicator ── */
                  <>
                    {/* Soft glow behind button */}
                    <div
                      className="absolute inset-0 -m-6 rounded-full opacity-30"
                      style={{
                        background: `radial-gradient(circle, ${hexToRgba(COLORS.gold, 0.2)} 0%, transparent 70%)`,
                      }}
                    />
                    {/* Button with countdown feel */}
                    <div
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300"
                      style={{
                        background: 'rgba(212,168,83,0.08)',
                        backdropFilter: 'blur(12px)',
                        border: '2px solid rgba(212,168,83,0.25)',
                        boxShadow: `0 0 40px ${hexToRgba(COLORS.gold, 0.08)}, inset 0 0 20px ${hexToRgba(COLORS.gold, 0.03)}`,
                      }}
                    >
                      <Video className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: COLORS.gold, opacity: 0.7 }} />
                      <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest" style={{ color: COLORS.gold, opacity: 0.5 }}>SOON</span>
                    </div>
                    {/* Subtle dashed ring — rotating */}
                    <div
                      className="absolute inset-0 -m-3 rounded-full pointer-events-none"
                      style={{
                        border: '1.5px dashed rgba(212,168,83,0.15)',
                        animation: 'spin-slow 30s linear infinite',
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Badge at bottom-left: "WEEKLY HIGHLIGHT" or "SEASON X" */}
            <div className="absolute bottom-14 sm:bottom-16 left-4 sm:left-6 z-20">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  background: divConfig.bg,
                  borderColor: divConfig.border,
                  color: divConfig.color,
                }}
              >
                {video.weekNumber ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Weekly Highlight
                  </>
                ) : video.seasonNumber ? (
                  <>
                    <Trophy className="w-3 h-3" />
                    Season {video.seasonNumber}
                  </>
                ) : (
                  <>
                    <Video className="w-3 h-3" />
                    Featured
                  </>
                )}
              </span>
            </div>

            {/* Coming Soon badge (top-right) — only for no-video */}
            {!hasVideo && (
              <div className="absolute top-4 right-4 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[rgba(212,168,83,0.12)] border-[rgba(212,168,83,0.2)] text-[#d4a853]">
                  <Clock className="w-3 h-3" />
                  Coming Soon
                </span>
              </div>
            )}

            {/* Duration badge (top-left) */}
            {video.duration && (
              <div className="absolute top-4 left-4 z-20">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white/90">
                  <Clock className="w-3 h-3" />
                  {video.duration}
                </span>
              </div>
            )}

            {/* Bottom gradient overlay for title readability */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-mid via-mid/80 to-transparent pointer-events-none z-10" />

            {/* Title overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
              <h3
                className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight leading-tight text-white"
              >
                {video.title}
              </h3>
              {/* Division indicator */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: divConfig.color, boxShadow: `0 0 6px ${divConfig.color}50` }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: divConfig.color }}
                >
                  {divConfig.label}
                </span>
                {video.weekNumber && (
                  <span className="text-[10px] font-medium" style={{ color: COLORS.mutedText }}>
                    · Week {video.weekNumber}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Video List Item — RIGHT side card ─── */
function VideoListItem({
  video,
  onPlay,
  onSelect,
  isActive,
  index,
}: {
  video: VideoHighlight;
  onPlay: (video: VideoHighlight) => void;
  onSelect: (video: VideoHighlight) => void;
  isActive: boolean;
  index: number;
}) {
  const divConfig = getDivisionConfig(video.division);
  const hasVideo = !!video.videoUrl;

  return (
    <div className={`reveal reveal-fade-right reveal-delay-${Math.min(index + 1, 5)} group`}>
      <div
        className="relative rounded-2xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer overflow-hidden"
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${hexToRgba(divConfig.color, 0.08)} 0%, var(--bg-mid) 60%, ${hexToRgba(divConfig.color, 0.04)} 100%)`
            : COLORS.cardBg,
          borderColor: isActive ? `${divConfig.color}40` : 'rgba(212,168,83,0.08)',
          boxShadow: isActive
            ? `${divConfig.shadow}, 0 4px 16px rgba(0,0,0,0.25)`
            : '0 1px 3px rgba(0,0,0,0.12)',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderColor = `${divConfig.color}30`;
            e.currentTarget.style.boxShadow = `0 0 10px ${divConfig.glow}, 0 2px 8px rgba(0,0,0,0.15)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderColor = 'rgba(212,168,83,0.08)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
          }
        }}
        onClick={() => {
          onSelect(video);
        }}
        role="button"
        tabIndex={0}
        aria-label={`Select video: ${video.title}`}
        aria-pressed={isActive}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(video);
          }
        }}
      >
        {/* Division-colored glow line at top when active */}
        {isActive && (
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 10%, ${divConfig.glowLine} 35%, ${hexToRgba(divConfig.color, 0.6)} 50%, ${divConfig.glowLine} 65%, transparent 90%)`,
            }}
          />
        )}

        <div className="flex items-center gap-3">
          {/* Left: Play icon circle in division color — premium gradient bg */}
          <div
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              background: isActive
                ? `${hexToRgba(divConfig.color, 0.15)}`
                : `${divConfig.color}15`,
              border: `1.5px solid ${isActive ? `${divConfig.color}45` : `${divConfig.color}25`}`,
            }}
          >
            {hasVideo ? (
              <Play className="w-4 h-4 ml-0.5" style={{ color: divConfig.color }} fill={divConfig.color} />
            ) : (
              <Lock className="w-3.5 h-3.5" style={{ color: COLORS.mutedText }} />
            )}
          </div>

          {/* Center: Title + description */}
          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-bold tracking-tight leading-snug truncate"
              style={{ color: isActive ? '#ffffff' : COLORS.lightText }}
            >
              {video.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {video.customSubtitle ? (
                /* ── CMS-managed subtitle (e.g. "S1 Highlights", "S2 MVP") ── */
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: divConfig.color }}>
                  {video.customSubtitle}
                </span>
              ) : (
                /* ── Auto-generated subtitle from data ── */
                <>
                  {video.weekNumber && (
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: divConfig.color }}
                    >
                      W{video.weekNumber}
                    </span>
                  )}
                  {video.seasonNumber && !video.weekNumber && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#d4a853]">
                      S{video.seasonNumber}
                    </span>
                  )}
                  <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: COLORS.mutedText }}>
                    {getTypeConfig(video.type).label}
                  </span>
                </>
              )}
              {!hasVideo && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#d4a853]/60">
                  · Soon
                </span>
              )}
            </div>
          </div>

          {/* Right: Duration badge + division dot */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            {video.duration && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{
                  background: isActive
                    ? `${hexToRgba(divConfig.color, 0.15)}`
                    : 'rgba(0,0,0,0.5)',
                  color: isActive ? divConfig.color : 'rgba(255,255,255,0.7)',
                }}
              >
                <Clock className="w-2.5 h-2.5" />
                {video.duration}
              </span>
            )}
            {/* Division dot indicator */}
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: divConfig.color,
                boxShadow: `0 0 4px ${divConfig.color}50`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State Component — premium ═══ */
function EmptyState() {
  return (
    <div className="reveal reveal-fade-up flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212,168,83,0.10) 0%, rgba(212,168,83,0.03) 100%)',
          borderColor: 'rgba(212,168,83,0.15)',
          boxShadow: '0 0 12px rgba(212,168,83,0.05), inset 0 1px 0 rgba(212,168,83,0.08)',
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.4), transparent)',
            boxShadow: '0 0 6px rgba(212,168,83,0.15)',
          }}
        />
        <Trophy className="w-10 h-10 text-[#d4a853]" />
      </div>
      <h3
        className="text-xl font-black mb-2"
        style={{
          background: 'linear-gradient(135deg, #f5e6c8 0%, #d4a853 50%, #f5d77a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Belum Ada Video
      </h3>
      <p className="text-sm max-w-xs" style={{ color: COLORS.mutedText }}>
        Video highlight dari pertandingan akan muncul di sini setelah turnamen dimulai. Nantikan momen terbaik!
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN VIDEO HIGHLIGHTS SECTION
   Layout: LEFT banner (55%) + RIGHT video list (45%)
   ═══════════════════════════════════════════════════════════════ */
export function ExperiencesSection({
  maleData,
  femaleData,
  leagueData,
  cmsSections,
  cmsSettings,
  onEnterApp,
  onVideoPlay: _onVideoPlay,
}: ExperiencesSectionProps) {
  // Inline playback is now used instead of modal (onVideoPlay kept for interface compatibility)
  void _onVideoPlay;
  // CMS text fields with fallbacks
  const vhLabel = cmsSettings?.video_highlights_label || 'VIDEO HIGHLIGHTS';
  const vhTitle = cmsSettings?.video_highlights_title || 'Momen Terbaik';
  const vhSubtitle = cmsSettings?.video_highlights_subtitle || 'Saksikan momen terbaik dari pertandingan Tarkam IDM';

  // CMS video titles, subtitles, divisions, durations & URLs for each of the 4 list items
  const cmsVideoTitles = [
    cmsSettings?.video_highlights_title_1 || '',
    cmsSettings?.video_highlights_title_2 || '',
    cmsSettings?.video_highlights_title_3 || '',
    cmsSettings?.video_highlights_title_4 || '',
  ];
  const cmsVideoSubtitles = [
    cmsSettings?.video_highlights_subtitle_1 || '',
    cmsSettings?.video_highlights_subtitle_2 || '',
    cmsSettings?.video_highlights_subtitle_3 || '',
    cmsSettings?.video_highlights_subtitle_4 || '',
  ];
  const cmsVideoDivisions = [
    (cmsSettings?.video_highlights_division_1 || 'both') as 'male' | 'female' | 'both',
    (cmsSettings?.video_highlights_division_2 || 'both') as 'male' | 'female' | 'both',
    (cmsSettings?.video_highlights_division_3 || 'both') as 'male' | 'female' | 'both',
    (cmsSettings?.video_highlights_division_4 || 'both') as 'male' | 'female' | 'both',
  ];
  const cmsVideoDurations = [
    cmsSettings?.video_highlights_duration_1 || '',
    cmsSettings?.video_highlights_duration_2 || '',
    cmsSettings?.video_highlights_duration_3 || '',
    cmsSettings?.video_highlights_duration_4 || '',
  ];
  const cmsVideoUrls = [
    cmsSettings?.video_highlights_url_1 || '',
    cmsSettings?.video_highlights_url_2 || '',
    cmsSettings?.video_highlights_url_3 || '',
    cmsSettings?.video_highlights_url_4 || '',
  ];

  /* ─── Build video list from data (limited to 4 most relevant) ─── */
  const allVideos = useMemo(
    () => {
      const videos = buildVideoHighlights(maleData, femaleData, leagueData, cmsSections).slice(0, 4);
      // Inline CMS arrays derived from cmsSettings
      const titles = [cmsSettings?.video_highlights_title_1 || '', cmsSettings?.video_highlights_title_2 || '', cmsSettings?.video_highlights_title_3 || '', cmsSettings?.video_highlights_title_4 || ''];
      const subtitles = [cmsSettings?.video_highlights_subtitle_1 || '', cmsSettings?.video_highlights_subtitle_2 || '', cmsSettings?.video_highlights_subtitle_3 || '', cmsSettings?.video_highlights_subtitle_4 || ''];
      const divisions = [(cmsSettings?.video_highlights_division_1 || 'both') as 'male' | 'female' | 'both', (cmsSettings?.video_highlights_division_2 || 'both') as 'male' | 'female' | 'both', (cmsSettings?.video_highlights_division_3 || 'both') as 'male' | 'female' | 'both', (cmsSettings?.video_highlights_division_4 || 'both') as 'male' | 'female' | 'both'];
      const durations = [cmsSettings?.video_highlights_duration_1 || '', cmsSettings?.video_highlights_duration_2 || '', cmsSettings?.video_highlights_duration_3 || '', cmsSettings?.video_highlights_duration_4 || ''];
      const urls = [cmsSettings?.video_highlights_url_1 || '', cmsSettings?.video_highlights_url_2 || '', cmsSettings?.video_highlights_url_3 || '', cmsSettings?.video_highlights_url_4 || ''];
      // Inject CMS fields into corresponding video items
      for (let i = 0; i < videos.length; i++) {
        const cmsTitle = titles[i];
        const cmsSubtitle = subtitles[i];
        const cmsDivision = divisions[i];
        const cmsDuration = durations[i];
        const cmsUrl = urls[i];
        if (cmsTitle || cmsSubtitle || cmsUrl || cmsDivision !== 'both' || cmsDuration) {
          videos[i] = {
            ...videos[i],
            ...(cmsTitle ? { title: cmsTitle } : {}),
            ...(cmsSubtitle ? { customSubtitle: cmsSubtitle } : {}),
            ...(cmsUrl ? { videoUrl: cmsUrl } : {}),
            ...(cmsDivision !== 'both' ? { division: cmsDivision } : {}),
            ...(cmsDuration ? { duration: cmsDuration } : {}),
          };
        }
      }
      return videos;
    },
    [maleData, femaleData, leagueData, cmsSections, cmsSettings],
  );

  /* ─── Filter state ─── */
  const [divisionFilter, setDivisionFilter] = useState<'all' | 'male' | 'female'>('all');

  const filteredVideos = useMemo(() => {
    if (divisionFilter === 'all') return allVideos;
    return allVideos.filter(
      (v) => v.division === divisionFilter || v.division === 'both',
    );
  }, [allVideos, divisionFilter]);

  /* ─── Selected/active video state ─── */
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const featuredVideo = useMemo(() => {
    if (selectedVideoId) {
      const found = filteredVideos.find((v) => v.id === selectedVideoId);
      if (found) return found;
    }
    return filteredVideos[0] || null;
  }, [filteredVideos, selectedVideoId]);

  /* ─── Division counts ─── */
  const counts = useMemo(() => ({
    all: allVideos.length,
    male: allVideos.filter((v) => v.division === 'male' || v.division === 'both').length,
    female: allVideos.filter((v) => v.division === 'female' || v.division === 'both').length,
  }), [allVideos]);

  /* ─── Inline video playback state ─── */
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const isPlayingInline = playingVideoId !== null && featuredVideo?.id === playingVideoId;

  /* ─── Video play handler — only from banner play button, starts inline playback ─── */
  const handleVideoPlay = useCallback(
    (video: VideoHighlight) => {
      if (video.videoUrl) {
        setPlayingVideoId(video.id);
      }
    },
    [],
  );

  /* ─── Stop inline playback ─── */
  const handleStopPlayback = useCallback(() => {
    setPlayingVideoId(null);
  }, []);

  /* ─── Video select handler — from list item click, only selects (no auto-play) ─── */
  const handleVideoSelect = useCallback(
    (video: VideoHighlight) => {
      setSelectedVideoId(video.id);
      // Stop any inline playback when selecting a different video
      setPlayingVideoId(null);
    },
    [],
  );

  /* ─── Reset selected when filter changes ─── */
  const handleFilterChange = useCallback(
    (filter: 'all' | 'male' | 'female') => {
      setDivisionFilter(filter);
      setSelectedVideoId(null);
      setPlayingVideoId(null);
    },
    [],
  );

  return (
    <section
      id="experiences"
      role="region"
      aria-label="Video Highlights"
      className="landing-section relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-deep"
    >
      {/* Top edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.3)] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[rgba(212,168,83,0.03)] to-transparent pointer-events-none" aria-hidden="true" />

      {/* Background — optimized 3-layer */}
      {/* Central gold glow + division hints (combined) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 35%, rgba(212,168,83,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 10% 50%, rgba(46,159,255,0.04) 0%, transparent 40%),
            radial-gradient(ellipse at 90% 60%, rgba(255,45,120,0.04) 0%, transparent 40%)
          `,
        }}
      />
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(212,168,83,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ═══════════════ Section Header ═══════════════ */}
        <AnimatedSection>
          <SectionHeader
            icon={Play}
            label={vhLabel}
            title={vhTitle}
            subtitle={vhSubtitle}
          />
        </AnimatedSection>

        {/* ═══════════════ Filter Tabs ═══════════════ */}
        {allVideos.length > 0 && (
          <AnimatedSection>
            <div className="flex items-center justify-between gap-4 mt-8 sm:mt-10 mb-6 sm:mb-8">
              <FilterTabs
                active={divisionFilter}
                onChange={handleFilterChange}
                counts={counts}
              />
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.mutedText }}>
                <Video className="w-3.5 h-3.5" />
                {filteredVideos.length} Video
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* ═══════════════ Content ═══════════════ */}
        {filteredVideos.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {/* LEFT Banner + RIGHT Video List Layout */}
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 sm:gap-5">
              {/* LEFT: Featured Banner (55% on desktop, full width on mobile) */}
              {featuredVideo && (
                <FeaturedBanner
                  video={featuredVideo}
                  onPlay={handleVideoPlay}
                  isSelected={!!selectedVideoId}
                  isPlayingInline={isPlayingInline}
                  onStopPlayback={handleStopPlayback}
                />
              )}

              {/* RIGHT: Video List + Progress + Buttons (45% on desktop, below banner on mobile) — max 4 items */}
              <div className="w-full lg:w-[45%] flex flex-col gap-2.5">
                {/* Video List */}
                {filteredVideos.map((video, idx) => (
                  <VideoListItem
                    key={video.id}
                    video={video}
                    onPlay={handleVideoPlay}
                    onSelect={handleVideoSelect}
                    isActive={featuredVideo?.id === video.id}
                    index={idx}
                  />
                ))}

                {/* Season Progress Bar */}
                <div className="reveal reveal-fade-up mt-1">
                  {(() => {
                    const seasonProgress = maleData?.seasonProgress || femaleData?.seasonProgress;
                    const seasonNumber = maleData?.season?.number || femaleData?.season?.number || 1;
                    const completedWeeks = seasonProgress?.completedWeeks ?? 0;
                    const totalWeeks = seasonProgress?.totalWeeks ?? 0;
                    const percentage = seasonProgress?.percentage ?? 0;

                    return (
                      <div
                        className="rounded-2xl border p-4 overflow-hidden relative"
                        style={{
                          background: `linear-gradient(135deg, ${hexToRgba(COLORS.gold, 0.05)} 0%, var(--bg-mid) 50%, ${hexToRgba(COLORS.gold, 0.02)} 100%)`,
                          borderColor: 'rgba(212,168,83,0.12)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        }}
                      >
                        {/* Top glow line */}
                        <div
                          className="absolute inset-x-0 top-0 h-px pointer-events-none"
                          style={{
                            background: 'linear-gradient(90deg, transparent 10%, rgba(212,168,83,0.3) 35%, rgba(229,190,74,0.4) 50%, rgba(212,168,83,0.3) 65%, transparent 90%)',
                          }}
                        />

                        {/* Label */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold" style={{ color: COLORS.lightText }}>
                            Progres Season{' '}
                            <span
                              style={{
                                background: 'linear-gradient(135deg, #f5e6c8 0%, #d4a853 50%, #f5d77a 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {seasonNumber}
                            </span>
                          </span>
                          <span className="text-xs font-bold" style={{ color: COLORS.gold }}>
                            {Math.round(percentage)}%
                          </span>
                        </div>

                        {/* Progress Bar — premium gradient with glow */}
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <div
                            className="h-2.5 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${percentage}%`,
                              background: 'linear-gradient(90deg, #b8860b 0%, #d4a853 40%, #e5be4a 50%, #d4a853 60%, #f5d77a 100%)',
                              boxShadow: '0 0 6px rgba(212,168,83,0.25)',
                            }}
                          />
                        </div>

                        {/* Week text */}
                        <p className="mt-1.5 text-xs" style={{ color: COLORS.mutedText }}>
                          Week {completedWeeks}/{totalWeeks} selesai
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Male/Female Tarkam Buttons — premium gradient + glow */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onEnterApp('male')}
                    className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer overflow-hidden border"
                    style={{
                      background: 'linear-gradient(135deg, rgba(46,159,255,0.12) 0%, rgba(46,159,255,0.06) 100%)',
                      color: COLORS.cyan,
                      borderColor: 'rgba(46,159,255,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46,159,255,0.22) 0%, rgba(46,159,255,0.10) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(46,159,255,0.50)';
                      e.currentTarget.style.boxShadow = '0 0 16px rgba(46,159,255,0.20), 0 0 4px rgba(46,159,255,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46,159,255,0.12) 0%, rgba(46,159,255,0.06) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(46,159,255,0.25)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    aria-label="Masuk Male Tarkam"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Male</span>
                  </button>
                  <button
                    onClick={() => onEnterApp('female')}
                    className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer overflow-hidden border"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,45,120,0.12) 0%, rgba(255,45,120,0.06) 100%)',
                      color: COLORS.purple,
                      borderColor: 'rgba(255,45,120,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,45,120,0.22) 0%, rgba(255,45,120,0.10) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(255,45,120,0.50)';
                      e.currentTarget.style.boxShadow = '0 0 16px rgba(255,45,120,0.20), 0 0 4px rgba(255,45,120,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,45,120,0.12) 0%, rgba(255,45,120,0.06) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(255,45,120,0.25)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    aria-label="Masuk Female Tarkam"
                  >
                    <Star className="w-4 h-4" />
                    <span>Female</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Decorative Line */}
        <div className="mt-14 sm:mt-20 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.18)] to-transparent" />
          <div className="flex items-center gap-1.5 text-[rgba(212,168,83,0.25)]">
            <Play className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Video Highlights
            </span>
            <Play className="w-3 h-3" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[rgba(212,168,83,0.18)] to-transparent" />
        </div>
      </div>
    </section>
  );
}
