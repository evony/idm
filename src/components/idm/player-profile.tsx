'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, X, Trophy, Flame, Crown, Shield, Target,
  TrendingUp, Award, Calendar, Star, BarChart3,
  Activity, MapPin, Users, Swords, ChevronDown, ChevronUp
} from 'lucide-react';
import { SkinBadgesRow, SkinName } from './skin-renderer';
import { getPrimarySkin, resolveSkinColors, getSkinTwinkle, sortSkinsByPriority, filterActiveSkins } from '@/lib/skin-utils';
import type { PlayerSkinInfo } from '@/types/stats';
import type { SkinColors, PlayerSkinWithDetails } from '@/lib/skin-utils';
import { Badge } from '@/components/ui/badge';
import { getDivisionTheme } from '@/hooks/use-division-theme';
import { useBackgroundImages } from '@/hooks/use-background-images';
import { useAppStore } from '@/lib/store';
import { getAvatarUrl, hashString, clubToString } from '@/lib/utils';
import { AchievementList } from './achievement-badge';
import { SocialShareButton } from './social-share-button';
import { PlayerSeasonHistory } from './player-season-history';
import { ClubLogoImage } from './club-logo-image';

interface PlayerProfileProps {
  player: {
    id: string;
    name: string;
    gamertag: string;
    avatar?: string | null;
    tier: string;
    points: number;
    totalWins: number;
    totalMvp: number;
    streak: number;
    maxStreak: number;
    matches: number;
    club?: string | { id: string; name: string; logo?: string | null } | null;
    division?: string;
    city?: string;
  };
  onClose: () => void;
  rank?: number;
  /** Map of playerId → skins[] from stats API, for showing any player's skins */
  skinMap?: Record<string, PlayerSkinInfo[]>;
  /** When set, this skin type is preferred over the highest-priority skin.
   *  Used when opening profile from a specific context (e.g. MVP card → show MVP skin). */
  preferredSkinType?: string;
}

/* ─── Procedural Player Banner — uses AI-generated division background ─── */
function PlayerBanner({ gamertag, division, rank, city }: {
  gamertag: string; division: string; rank?: number; city?: string
}) {
  const hash = hashString(gamertag);
  const isMale = division === 'male';
  const primaryColor = isMale ? '#57B5FF' : '#FF5C9A';
  const secondaryColor = isMale ? '#2E9FFF' : '#FF2D78';
  const { bgMale, bgFemale } = useBackgroundImages();
  const bgImage = isMale ? bgMale : bgFemale;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layer 1: AI-generated division background image */}
      {bgImage && <Image src={bgImage} alt="" fill sizes="100vw" className="absolute inset-0 object-cover" aria-hidden="true" loading="lazy" />}

      {/* Layer 2: Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/50 to-background/80" />

      {/* Layer 3: Division color tint */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 70% 30%, ${primaryColor}15 0%, transparent 60%),
                     radial-gradient(ellipse at 20% 80%, ${secondaryColor}10 0%, transparent 50%)`,
      }} />

      {/* Layer 4: SVG procedural overlay for depth */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* Large watermark gamertag */}
        <text x="97%" y="96%" textAnchor="end" dominantBaseline="auto"
          fill={primaryColor} fontSize="80" fontWeight="900" opacity="0.06"
          fontFamily="system-ui" letterSpacing="-2">
          {(city || gamertag).toUpperCase()}
        </text>

        {/* Corner brackets */}
        <line x1="0" y1="0" x2="35%" y2="0" stroke={primaryColor} strokeWidth="2.5" opacity="0.25" />
        <line x1="0" y1="0" x2="0" y2="35%" stroke={primaryColor} strokeWidth="2.5" opacity="0.25" />
        <line x1="100%" y1="100%" x2="65%" y2="100%" stroke={primaryColor} strokeWidth="2.5" opacity="0.25" />
        <line x1="100%" y1="100%" x2="100%" y2="65%" stroke={primaryColor} strokeWidth="2.5" opacity="0.25" />
      </svg>

      {/* Layer 5: Large rank number watermark */}
      <div className="absolute -right-2 -bottom-6 select-none pointer-events-none">
        <span className={`text-[140px] font-black leading-none ${
          isMale ? 'text-idm-male/[0.04]' : 'text-idm-female/[0.04]'
        }`}>
          {rank || '#'}
        </span>
      </div>

      {/* Layer 6: Vignette/depth overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/15 via-transparent to-background/15" />
    </div>
  );
}

/* ─── Stat Block — Dance Tournament HUD style ─── */
function StatBlock({ icon: Icon, label, value, sub, color, highlight, size = 'normal', playerDivision }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  highlight?: boolean;
  size?: 'normal' | 'large';
  playerDivision: 'male' | 'female';
}) {
  const dt = getDivisionTheme(playerDivision);
  return (
    <div className={`relative rounded-2xl p-3 text-center transition-all overflow-hidden ${
      highlight ? `${dt.bgSubtle} border ${dt.border}` : `bg-muted/10 border border-border/10`
    }`}>
      {/* Background decoration for highlighted stat */}
      {highlight && (
        <div className={`absolute inset-0 opacity-5`}>
          <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full ${playerDivision === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
        </div>
      )}
      <div className="relative z-10">
        <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
        <p className={`font-black ${size === 'large' ? 'text-xl' : 'text-lg'} ${highlight ? dt.neonGradient : ''}`}>{value}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</p>
        {sub && <p className="text-[8px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function PlayerProfile({ player, onClose, rank, skinMap, preferredSkinType }: PlayerProfileProps) {
  const storeDivision = useAppStore(s => s.division);
  const playerAuth = useAppStore(s => s.playerAuth);
  // Use the PLAYER's actual division, NOT the currently selected UI division
  // This prevents showing "Divisi Male" when viewing a female player's profile
  const playerDivision = player.division || storeDivision;
  // CRITICAL: Use the player's division for theming, not the store's current division
  // This ensures male players always show cyan and female players always show purple
  const dt = getDivisionTheme(playerDivision as 'male' | 'female');

  // Skins: use skinMap for ALL players, fall back to logged-in user's skins for self
  const isMe = playerAuth.isAuthenticated && playerAuth.account && playerAuth.account.player.id === player.id;
  const playerSkins = skinMap?.[player.id] || (isMe ? playerAuth.account?.skins || [] : []);

  // ═══ LAYERED SKIN SYSTEM ═══
  // Sort all active skins by priority (highest first) for layered rendering:
  //   Layer 1 (highest priority) → Frame / Border glow + Traveling edge lights
  //   Layer 2 (second priority)  → Corner sparkles / Twinkle symbol
  //   Layer 3 (third priority)   → Inner avatar traveling line
  // If a player has only 1 skin, only the frame layer is active.
  // If 2 skins, frame + twinkle. If 3+, all three layers.

  // When preferredSkinType is set (e.g. from MVP card click), put that skin first
  const activeSkins = filterActiveSkins(playerSkins as PlayerSkinWithDetails[]);
  const sortedSkins = sortSkinsByPriority(activeSkins);

  // If preferredSkinType is set, reorder so it becomes the primary (frame) layer
  const layerSkins = preferredSkinType
    ? (() => {
        const preferred = sortedSkins.find(s => s.type === preferredSkinType);
        if (!preferred) return sortedSkins;
        const rest = sortedSkins.filter(s => s.type !== preferredSkinType);
        return [preferred, ...rest];
      })()
    : sortedSkins;

  const frameSkin = layerSkins[0] || null;       // Layer 1: Frame/border
  const twinkleSkin = layerSkins[1] || null;      // Layer 2: Sparkles/twinkle
  // NOTE: Layer 3 (inner avatar traveling line) REMOVED — it disturbs the photo view
  // The bottom accent divider line below the avatar is kept (uses frameColors)

  const primarySkin = frameSkin; // For backward compat, primarySkin = frameSkin
  const frameColors: SkinColors | null = frameSkin ? resolveSkinColors(frameSkin) : null;
  const twinkleColors: SkinColors | null = twinkleSkin ? resolveSkinColors(twinkleSkin) : null;

  // Legacy alias: skinColors = frameColors (used by most existing code)
  const skinColors = frameColors;

  const winRate = player.matches > 0 ? Math.round((player.totalWins / player.matches) * 100) : 0;
  const mvpRate = player.matches > 0 ? Math.round((player.totalMvp / player.matches) * 100) : 0;
  const losses = player.matches - player.totalWins;
  // Only show rank badges when the player has actual competitive results (points or wins)
  // Without this check, ALL players show "Juara" badges when no matches have been played
  // because the topPlayers array order is arbitrary when all points = 0
  const hasCompetitiveResults = player.points > 0 || player.totalWins > 0;
  const effectiveRank = hasCompetitiveResults ? rank : undefined;
  const isChampion = effectiveRank === 1;
  const isTop3 = effectiveRank !== undefined && effectiveRank <= 3;

  // Lock body scroll when modal is open + Close on Escape
  useEffect(() => {
    // Prevent background scrolling when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  // Fetch player achievements from API
  const { data: achievementData } = useQuery({
    queryKey: ['player-achievements', player.id],
    queryFn: async () => {
      const res = await fetch(`/api/players/achievements?playerId=${player.id}`);
      return res.json();
    },
    enabled: !!player.id,
  });

  // Fetch player match history
  const { data: matchHistoryData } = useQuery({
    queryKey: ['player-matches', player.id],
    queryFn: async () => {
      const res = await fetch(`/api/players/${player.id}/matches`);
      return res.json();
    },
    enabled: !!player.id && player.matches > 0,
    staleTime: 30000,
  });

  const [showAllMatches, setShowAllMatches] = useState(false);
  const MATCH_LIMIT = 10;

  const rankLabel = effectiveRank === 1 ? 'JUARA' : effectiveRank === 2 ? 'JUARA 2' : effectiveRank === 3 ? 'PERINGKAT 3' : effectiveRank ? `#${effectiveRank}` : '';

  // No demo data — all data comes from actual organizer-input results only.
  // The game is not integrated with this server, so we cannot show
  // in-game performance metrics or per-match score trends.
  const hasMatchHistory = player.matches > 0;
  const avatarSrc = getAvatarUrl(player.gamertag, playerDivision as 'male' | 'female', player.avatar);

  // Portal target — render modal directly into document.body to avoid
  // parent overflow/transform breaking position:fixed centering.
  // Without this, the dashboard's <main overflow-y-auto> container
  // causes the modal to appear off-center or disappear on scroll.
  const [portalTarget] = useState<HTMLElement | null>(() =>
    typeof document !== 'undefined' ? document.body : null
  );

  if (!portalTarget) return null;

  const modal = (
    <div
      className="animate-fade-enter-sm fixed inset-0 z-[9999] bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Profil ${player.gamertag}`}
    >
      <div className="flex items-center justify-center h-dvh p-3 sm:p-4">
      <div
        className="animate-fade-enter w-full sm:max-w-lg relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={skinColors ? { padding: '4px' } : undefined}
      >
          {/* ═══ STICKY CLOSE BUTTON — always visible, outside scroll area ═══ */}
          <button
            onClick={onClose}
            aria-label="Kembali"
            className="absolute top-3 right-3 z-[60] flex items-center justify-center w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:bg-black/60 active:scale-90 transition-all border border-white/10 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
          {/* ═══ TRAVELING EDGE LIGHTS — cahaya mengalir di sisi frame saja ═══ */}
          {skinColors && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden sm:rounded-[20px]" style={{ zIndex: 25 }} aria-hidden="true">
              {/* Top edge light — travels left → right */}
              <motion.div
                className="absolute"
                style={{
                  top: '-1px', left: 0,
                  width: '30%', height: '2px',
                  background: `linear-gradient(90deg, transparent 0%, ${skinColors.glow} 25%, #ffffffd0 50%, ${skinColors.glow} 75%, transparent 100%)`,
                  boxShadow: `0 0 8px ${skinColors.glow}, 0 0 4px ${skinColors.glow}`,
                }}
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              {/* Right edge light — travels top → bottom */}
              <motion.div
                className="absolute"
                style={{
                  right: '-1px', top: 0,
                  width: '2px', height: '22%',
                  background: `linear-gradient(180deg, transparent 0%, ${skinColors.glow} 25%, #ffffffd0 50%, ${skinColors.glow} 75%, transparent 100%)`,
                  boxShadow: `0 0 8px ${skinColors.glow}, 0 0 4px ${skinColors.glow}`,
                }}
                animate={{ y: ['-100%', '500%'] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 0.8 }}
              />
              {/* Bottom edge light — travels right → left */}
              <motion.div
                className="absolute"
                style={{
                  bottom: '-1px', right: 0,
                  width: '30%', height: '2px',
                  background: `linear-gradient(90deg, transparent 0%, ${skinColors.glow} 25%, #ffffffd0 50%, ${skinColors.glow} 75%, transparent 100%)`,
                  boxShadow: `0 0 8px ${skinColors.glow}, 0 0 4px ${skinColors.glow}`,
                }}
                animate={{ x: ['100%', '-400%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 1.5 }}
              />
              {/* Left edge light — travels bottom → top */}
              <motion.div
                className="absolute"
                style={{
                  left: '-1px', bottom: 0,
                  width: '2px', height: '22%',
                  background: `linear-gradient(180deg, transparent 0%, ${skinColors.glow} 25%, #ffffffd0 50%, ${skinColors.glow} 75%, transparent 100%)`,
                  boxShadow: `0 0 8px ${skinColors.glow}, 0 0 4px ${skinColors.glow}`,
                }}
                animate={{ y: ['100%', '-500%'] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 2.2 }}
              />
              {/* Second pass — offset for richer effect */}
              {/* Top edge — second light, opposite timing */}
              <motion.div
                className="absolute"
                style={{
                  top: '-1px', left: 0,
                  width: '18%', height: '1.5px',
                  background: `linear-gradient(90deg, transparent 0%, ${skinColors.frame}aa 30%, #ffffff80 50%, ${skinColors.frame}aa 70%, transparent 100%)`,
                  boxShadow: `0 0 4px ${skinColors.glow}`,
                }}
                animate={{ x: ['-80%', '520%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', delay: 2 }}
              />
              {/* Bottom edge — second light */}
              <motion.div
                className="absolute"
                style={{
                  bottom: '-1px', right: 0,
                  width: '18%', height: '1.5px',
                  background: `linear-gradient(90deg, transparent 0%, ${skinColors.frame}aa 30%, #ffffff80 50%, ${skinColors.frame}aa 70%, transparent 100%)`,
                  boxShadow: `0 0 4px ${skinColors.glow}`,
                }}
                animate={{ x: ['80%', '-520%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', delay: 0.5 }}
              />
            </div>
          )}

          {/* ═══ BORDER GLOW — breathing pulse ═══ */}
          {skinColors && (
            <motion.div
              className="absolute sm:rounded-[20px] pointer-events-none"
              style={{
                inset: '-2px',
                border: `2px solid ${skinColors.frame}`,
                borderRadius: 'inherit',
                zIndex: 20,
                boxShadow: `0 0 5px ${skinColors.glow}, 0 0 10px ${skinColors.glow}`,
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
          )}

          {/* ═══ Corner sparkles — Layer 2: uses twinkleSkin (2nd priority) ═══ */}
          {/* If no twinkleSkin, fall back to frameSkin for sparkle colors/symbol */}
          {(twinkleSkin || frameSkin) && (() => {
            const sparkleSkin = twinkleSkin || frameSkin!;
            const sparkleColors = twinkleColors || frameColors!;
            return (
              <>
                {[
                  { top: '-8px', left: '-8px' },
                  { top: '-8px', right: '-8px' },
                  { bottom: '-8px', left: '-8px' },
                  { bottom: '-8px', right: '-8px' },
                ].map((pos, i) => (
                  <motion.span
                    key={`corner${i}`}
                    className="absolute flex items-center justify-center select-none"
                    style={{
                      fontSize: sparkleSkin.type === 'season_champion' || sparkleSkin.type === 'sultan' ? '20px' : sparkleSkin.type.startsWith('sawer_') ? '16px' : '18px',
                      lineHeight: 1,
                      ...pos,
                      zIndex: 55,
                      color: sparkleColors.frame,
                      textShadow: `0 0 6px ${sparkleColors.glow}, 0 0 12px ${sparkleColors.glow}, 0 0 20px ${sparkleColors.glow}`,
                    }}
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.6, 1.35, 0.6], rotate: sparkleSkin.type === 'season_champion' || sparkleSkin.type === 'sultan' ? [0, 60, 120, 180, 240, 300, 360] : [0, 90, 180, 270, 360] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                    aria-hidden="true"
                  >{getSkinTwinkle(sparkleSkin.type)}</motion.span>
                ))}
              </>
            );
          })()}

          {/* Inner scrollable content container — sits above the chase border */}
          <div className="relative z-10 bg-background overflow-hidden sm:rounded-[20px] min-h-0 flex-1 overflow-y-auto custom-scrollbar">

          {/* ═══ HERO BANNER — Full Avatar Card Style ═══ */}
            <div className={`relative h-[280px] sm:h-[380px] md:h-[440px] overflow-hidden cinema-hero cinema-flare ${playerDivision === 'male' ? 'cinema-flare-male' : 'cinema-flare-female'} cinema-grade`}>
            {/* Full avatar as background */}
            <Image src={avatarSrc} alt={player.gamertag} fill sizes="(max-width: 640px) 100vw, 512px" className="absolute inset-0 object-cover object-[center_37%]" loading="lazy" />

            {/* Dark overlay gradient — natural fade from bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-transparent" />

            {/* Division color tint overlay — edges/corners only, avoids face center */}
            <div className="absolute inset-0" style={{
              background: skinColors
                ? `radial-gradient(ellipse at 10% 10%, ${skinColors.glow.replace(/[\d.]+\)$/, '0.12)')} 0%, transparent 40%),
                     radial-gradient(ellipse at 90% 10%, ${skinColors.frame}18 0%, transparent 40%),
                     radial-gradient(ellipse at 10% 90%, ${skinColors.frame}12 0%, transparent 35%)`
                : playerDivision === 'male'
                  ? 'radial-gradient(ellipse at 10% 10%, rgba(87,181,255,0.04) 0%, transparent 40%)'
                  : 'radial-gradient(ellipse at 10% 10%, rgba(255,92,154,0.04) 0%, transparent 40%)'
            }} />

            {/* SVG procedural overlay for depth */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
              <text x="97%" y="96%" textAnchor="end" dominantBaseline="auto"
                fill={skinColors?.frame || (playerDivision === 'male' ? '#57B5FF' : '#FF5C9A')} fontSize="70" fontWeight="900" opacity={skinColors ? '0.14' : '0.05'}
                fontFamily="system-ui" letterSpacing="-2">
                {(player.city || player.gamertag).toUpperCase()}
              </text>
              {/* Corner brackets — use skin frame color if skin active (more visible) */}
              <line x1="0" y1="0" x2="25%" y2="0" stroke={skinColors?.frame || (playerDivision === 'male' ? '#57B5FF' : '#FF5C9A')} strokeWidth={skinColors ? '3' : '2'} opacity={skinColors ? '0.5' : '0.2'} />
              <line x1="0" y1="0" x2="0" y2="25%" stroke={skinColors?.frame || (playerDivision === 'male' ? '#57B5FF' : '#FF5C9A')} strokeWidth={skinColors ? '3' : '2'} opacity={skinColors ? '0.5' : '0.2'} />
              <line x1="100%" y1="100%" x2="75%" y2="100%" stroke={skinColors?.frame || (playerDivision === 'male' ? '#57B5FF' : '#FF5C9A')} strokeWidth={skinColors ? '3' : '2'} opacity={skinColors ? '0.5' : '0.2'} />
              <line x1="100%" y1="100%" x2="100%" y2="75%" stroke={skinColors?.frame || (playerDivision === 'male' ? '#57B5FF' : '#FF5C9A')} strokeWidth={skinColors ? '3' : '2'} opacity={skinColors ? '0.5' : '0.2'} />
            </svg>

            {/* Top accent line — neutral division color (no skin traveling light) */}
            {!skinColors && (
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent`} />
            )}





            {/* Rank badge — top-left */}
            {isTop3 && (
              <div className="absolute top-3 left-3 z-10">
                <Badge className={`text-[10px] font-black border-0 px-2.5 py-1 ${
                  effectiveRank === 1 ? 'bg-yellow-500/25 text-yellow-400 shadow-lg shadow-yellow-500/10' :
                  effectiveRank === 2 ? 'bg-gray-400/20 text-gray-300' :
                  'bg-amber-600/20 text-amber-500'
                }`}>
                  {effectiveRank === 1 ? '👑' : ''} {rankLabel}
                </Badge>
              </div>
            )}

            {/* Division badge — below rank or top-left */}
            <div className="absolute top-3 left-3 z-10" style={{ marginTop: isTop3 ? '28px' : 0 }}>
              <Badge className={`${dt.casinoBadge} text-[9px]`}>
                {playerDivision === 'male' ? '🕺 Divisi Male' : '💃 Divisi Female'}
              </Badge>
            </div>

            {/* Bottom info overlay — name, club */}
            <div className="absolute bottom-0 inset-x-0 z-10 p-4" style={skinColors ? {
              background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 60%, transparent 100%),
                           linear-gradient(to top, ${skinColors.glow.replace(/[\d.]+\)$/, '0.1)')} 0%, transparent 40%)`,
            } : undefined}>
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <SkinName skin={primarySkin} skinColors={skinColors}>
                    <h2 className="text-2xl font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{player.gamertag}</h2>
                  </SkinName>
                  {playerSkins.length > 0 && <SkinBadgesRow skins={playerSkins} hideSawerAndDonorBadges={playerSkins.some(s => s.type === 'sultan_weekly')} />}
                  <SocialShareButton playerGamertag={player.gamertag} playerId={player.id} />
                </div>
                <p className="text-xs text-white/60 mt-0.5">{player.city ? <><MapPin className="w-3 h-3 inline -mt-0.5 mr-0.5" />{player.city}</> : player.name}</p>
                <div className="flex items-center gap-2 mt-1.5">

                  {player.streak > 1 && (
                    <Badge className="bg-orange-500/20 text-orange-400 text-[10px] border-0 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {player.streak} Streak
                    </Badge>
                  )}

                  {/* Sultan of Season badge — emerald themed */}
                  {playerSkins.some(s => s.type === 'sultan') && (
                    <Badge
                      className="text-[10px] border-0 flex items-center gap-1 font-bold"
                      style={{ backgroundColor: 'rgba(67,160,71,0.2)', color: '#66BB6A' }}
                    >
                      <span>👑</span> Sultan Season {(() => {
                        const sultanSkin = playerSkins.find(s => s.type === 'sultan');
                        const match = sultanSkin?.reason?.match(/Season (\d+)/);
                        return match ? match[1] : '';
                      })()}
                    </Badge>
                  )}

                  {/* Sultan of the Week badge — maroon themed, with sawer count */}
                  {playerSkins.some(s => s.type === 'sultan_weekly') && (() => {
                    const donorCount = playerSkins.find(s => s.type === 'sultan_weekly')?.donorBadgeCount
                      || playerSkins.find(s => s.type === 'donor_badge')?.donorBadgeCount
                      || playerSkins.find(s => s.type === 'donor')?.donorBadgeCount;
                    const sawerCount = donorCount && donorCount > 0 ? `${donorCount}x sawer` : '';
                    return (
                      <Badge
                        className="text-[10px] border-0 flex items-center gap-1 font-bold"
                        style={{ backgroundColor: 'rgba(128,0,32,0.2)', color: '#C4A3A5' }}
                      >
                        <span>❤️</span> Sultan of the Week{ sawerCount ? <span className="ml-1 opacity-70">{sawerCount}</span> : null }
                      </Badge>
                    );
                  })()}
                </div>
                {clubToString(player.club) && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {typeof player.club === 'object' && player.club?.logo ? (
                      <ClubLogoImage clubName={clubToString(player.club)} dbLogo={player.club.logo} alt={clubToString(player.club)} width={18} height={18} className="w-[18px] h-[18px] rounded object-cover" />
                    ) : (
                      <Shield className={`w-3.5 h-3.5 ${dt.text}`} />
                    )}
                    <span className={`text-xs ${dt.text} font-semibold drop-shadow-sm`}>{clubToString(player.club)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Skin accent divider — dual traveling spotlights ═══ */}
          {/* Uses frameColors (Layer 1) — kept because it's below the avatar, not inside it */}
          {skinColors && (() => {
            const dividerColors = skinColors;
            return (
              <div
                className="h-[3px] mx-4 overflow-hidden relative"
                style={{ background: dividerColors.frame + '18' }}
                aria-hidden="true"
              >
                {/* Forward spotlight */}
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: '35%',
                    background: `linear-gradient(90deg, transparent 0%, ${dividerColors.glow} 30%, #ffffffc0 50%, ${dividerColors.glow} 70%, transparent 100%)`,
                    boxShadow: `0 0 8px ${dividerColors.glow}`,
                  }}
                  animate={{ x: ['-120%', '320%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                />
                {/* Reverse spotlight — creates crossing effect */}
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: '25%',
                    background: `linear-gradient(90deg, transparent 0%, ${dividerColors.frame}88 40%, #ffffff60 50%, ${dividerColors.frame}88 60%, transparent 100%)`,
                  }}
                  animate={{ x: ['320%', '-120%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 0.8 }}
                />
              </div>
            );
          })()}

          {/* ═══ CONTENT ═══ */}
          <div className="px-4 pt-4 pb-6">


            {/* ═══ Main Stats Grid — Dance Tournament HUD Style ═══ */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <StatBlock icon={Trophy} label="Poin" value={player.points} color={dt.text} highlight size="large" playerDivision={playerDivision as 'male' | 'female'} />
              <StatBlock icon={Target} label="Win Rate" value={`${winRate}%`} sub={`${player.totalWins}W/${losses}L`} color="text-green-500" playerDivision={playerDivision as 'male' | 'female'} />
              <StatBlock icon={Crown} label="MVP" value={player.totalMvp} sub={`${mvpRate}% rasio`} color="text-yellow-500" playerDivision={playerDivision as 'male' | 'female'} />
              <StatBlock icon={Activity} label="Match" value={player.matches} color="text-blue-400" playerDivision={playerDivision as 'male' | 'female'} />
            </div>

            {/* ═══ Performance Overview — based on actual record only ═══ */}
            {hasMatchHistory ? (
              <div className={`p-3.5 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle} mb-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className={`w-4 h-4 ${dt.text}`} />
                  <span className="text-xs font-semibold">Ringkasan Performa</span>
                  <Badge className={`${dt.casinoBadge} text-[8px] ml-auto`}>{player.matches} MATCH</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                    <p className="text-lg font-bold text-green-500">{player.totalWins}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Wins</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="text-lg font-bold text-red-500">{losses}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Losses</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <p className="text-lg font-bold text-yellow-500">{player.totalMvp}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">MVP</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-3.5 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle} mb-4 text-center`}>
                <BarChart3 className={`w-5 h-5 ${dt.text} mx-auto mb-1.5 opacity-40`} />
                <p className="text-xs text-muted-foreground">Belum ada data match — statistik performa akan muncul setelah match tercatat</p>
              </div>
            )}

            {/* ═══ Win Rate Progress Bar ═══ */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">Win Rate</span>
                <span className={`font-black ${dt.text}`}>{winRate}%</span>
              </div>
              <div className={`h-2.5 rounded-full ${dt.bgSubtle} overflow-hidden`}>
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                    winRate >= 60
                      ? `bg-gradient-to-r ${playerDivision === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`
                      : winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>

            {/* ═══ Achievements ═══ */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className={`w-4 h-4 ${dt.text}`} />
                <h3 className="text-sm font-semibold">Prestasi</h3>
                {achievementData?.stats && (
                  <Badge className={`${dt.casinoBadge} text-[8px] ml-auto`}>
                    {achievementData.stats.earned}/{achievementData.stats.total}
                  </Badge>
                )}
              </div>
              {achievementData?.achievements?.length > 0 ? (
                <AchievementList
                  achievements={achievementData.achievements.map((a: { achievement: { id: string; name: string; displayName: string; description: string; icon: string; tier: string }; earnedAt: Date }) => ({
                    id: a.achievement.id,
                    name: a.achievement.name,
                    displayName: a.achievement.displayName,
                    description: a.achievement.description,
                    category: 'earned',
                    icon: a.achievement.icon,
                    tier: a.achievement.tier,
                    earned: true,
                    earnedAt: a.earnedAt,
                  }))}
                  size="md"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {/* Fallback badges based on player stats */}
                  {player.totalWins >= 1 && (
                    <Badge className="bg-green-500/10 text-green-500 text-[10px] border-0">
                      <Star className="w-3 h-3 mr-1" /> Win Pertama
                    </Badge>
                  )}
                  {player.totalWins >= 5 && (
                    <Badge className="bg-blue-500/10 text-blue-400 text-[10px] border-0">
                      <Trophy className="w-3 h-3 mr-1" /> 5 Win
                    </Badge>
                  )}
                  {player.totalMvp >= 1 && (
                    <Badge className="bg-yellow-500/10 text-yellow-500 text-[10px] border-0">
                      <Crown className="w-3 h-3 mr-1" /> MVP
                    </Badge>
                  )}
                  {player.maxStreak >= 3 && (
                    <Badge className="bg-orange-500/10 text-orange-500 text-[10px] border-0">
                      <Flame className="w-3 h-3 mr-1" /> Membara
                    </Badge>
                  )}

                  {isChampion && (
                    <Badge className="bg-yellow-500/10 text-yellow-500 text-[10px] border-0">
                      <Crown className="w-3 h-3 mr-1" /> Juara
                    </Badge>
                  )}
                  {player.matches >= 5 && (
                    <Badge className="bg-amber-600/10 text-amber-600 text-[10px] border-0">
                      <BarChart3 className="w-3 h-3 mr-1" /> Veteran
                    </Badge>
                  )}
                  {player.totalWins === 0 && player.totalMvp === 0 && (
                    <p className="text-xs text-muted-foreground">Belum ada prestasi</p>
                  )}
                </div>
              )}
            </div>

            {/* ═══ Recent Matches — only from organizer-input data ═══ */}
            {hasMatchHistory ? (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Calendar className={`w-4 h-4 ${dt.text}`} />
                  <h3 className="text-sm font-semibold">Rekor Match</h3>
                  <Badge className={`${dt.casinoBadge} text-[8px] ml-auto`}>{player.matches} DIMAINKAN</Badge>
                </div>
                <div className={`p-3 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-black text-green-500">{player.totalWins}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-red-500">{losses}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Losses</p>
                    </div>
                  </div>
                  {player.totalMvp > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30 text-center">
                      <p className="text-xs text-yellow-500 font-semibold">{player.totalMvp}x Penghargaan MVP</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Calendar className={`w-4 h-4 ${dt.text}`} />
                  <h3 className="text-sm font-semibold">Rekor Match</h3>
                </div>
                <div className={`p-4 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle} text-center`}>
                  <Calendar className={`w-5 h-5 ${dt.text} mx-auto mb-1.5 opacity-40`} />
                  <p className="text-xs text-muted-foreground">Belum ada match tercatat</p>
                </div>
              </div>
            )}

            {/* ═══ Match History (Riwayat Match) ═══ */}
            {hasMatchHistory && matchHistoryData && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Swords className={`w-4 h-4 ${dt.text}`} />
                  <h3 className="text-sm font-semibold">Riwayat Match</h3>
                  <Badge className={`${dt.casinoBadge} text-[8px] ml-auto`}>
                    {(matchHistoryData.leagueMatches?.length || 0) + (matchHistoryData.tournamentMatches?.length || 0)} DIMAINKAN
                  </Badge>
                </div>
                <div className={`p-3 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle} space-y-3`}>
                  {/* Tarkam Matches */}
                  {matchHistoryData.leagueMatches?.length > 0 && (
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${dt.text} mb-1.5`}>Tarkam</p>
                      <div className="space-y-1.5">
                        {(showAllMatches ? matchHistoryData.leagueMatches : matchHistoryData.leagueMatches.slice(0, MATCH_LIMIT)).map((m: { id: string; week: number; score1: number | null; score2: number | null; status: string; isHome: boolean; club1: { name: string }; club2: { name: string }; result: string }) => (
                          <div key={m.id} className="flex items-center gap-2 text-xs">
                            <span className={`w-8 shrink-0 text-[9px] font-bold ${dt.neonText}`}>W{m.week}</span>
                            <span className="flex-1 min-w-0 truncate text-muted-foreground">
                              {m.isHome ? (
                                <>{m.club1.name} <span className="text-foreground font-semibold">{m.score1 ?? '-'}-{m.score2 ?? '-'}</span> {m.club2.name}</>
                              ) : (
                                <>{m.club2.name} <span className="text-foreground font-semibold">{m.score2 ?? '-'}-{m.score1 ?? '-'}</span> {m.club1.name}</>
                              )}
                            </span>
                            {m.result === 'win' ? (
                              <Badge className="bg-green-500/10 text-green-500 text-[9px] border-0 px-1.5 py-0 shrink-0">✅ Menang</Badge>
                            ) : m.result === 'loss' ? (
                              <Badge className="bg-red-500/10 text-red-500 text-[9px] border-0 px-1.5 py-0 shrink-0">❌ Kalah</Badge>
                            ) : (
                              <Badge className="bg-muted/30 text-muted-foreground text-[9px] border-0 px-1.5 py-0 shrink-0">Akan Datang</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tournament Matches */}
                  {matchHistoryData.tournamentMatches?.length > 0 && (
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${dt.text} mb-1.5`}>Turnamen</p>
                      <div className="space-y-1.5">
                        {(showAllMatches ? matchHistoryData.tournamentMatches : matchHistoryData.tournamentMatches.slice(0, Math.max(0, MATCH_LIMIT - (matchHistoryData.leagueMatches?.length || 0)))).map((m: { id: string; round: number; score1: number | null; score2: number | null; status: string; tournamentName: string; weekNumber: number; team1: { name: string }; team2: { name: string } | null; result: string }) => (
                          <div key={m.id} className="flex items-center gap-2 text-xs">
                            <span className={`w-8 shrink-0 text-[9px] font-bold ${dt.neonText}`}>W{m.weekNumber}</span>
                            <span className="flex-1 min-w-0 truncate text-muted-foreground">
                              {m.team1.name} vs {m.team2?.name || 'TBD'}
                            </span>
                            {m.result === 'win' ? (
                              <Badge className="bg-green-500/10 text-green-500 text-[9px] border-0 px-1.5 py-0 shrink-0">✅ Menang</Badge>
                            ) : m.result === 'loss' ? (
                              <Badge className="bg-red-500/10 text-red-500 text-[9px] border-0 px-1.5 py-0 shrink-0">❌ Kalah</Badge>
                            ) : (
                              <Badge className="bg-muted/30 text-muted-foreground text-[9px] border-0 px-1.5 py-0 shrink-0">Akan Datang</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state for match history */}
                  {(!matchHistoryData.leagueMatches?.length && !matchHistoryData.tournamentMatches?.length) && (
                    <p className="text-xs text-muted-foreground text-center py-2">Belum ada riwayat match</p>
                  )}

                  {/* Show More / Show Less toggle */}
                  {(matchHistoryData.leagueMatches?.length || 0) + (matchHistoryData.tournamentMatches?.length || 0) > MATCH_LIMIT && (
                    <button
                      onClick={() => setShowAllMatches(!showAllMatches)}
                      className={`flex items-center gap-1 text-[10px] font-semibold ${dt.text} mx-auto hover:opacity-80 transition-opacity`}
                    >
                      {showAllMatches ? (
                        <>Lihat Lebih Sedikit <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Lihat Semua <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ═══ Season History ═══ */}
            <PlayerSeasonHistory
              playerId={player.id}
              playerDivision={playerDivision}
              currentPoints={player.points}
              currentTier={player.tier}
              currentClub={clubToString(player.club) || null}
            />

            {/* ═══ Points Breakdown ═══ */}
            <div className={`p-3.5 rounded-2xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
              <div className="flex items-center gap-2 mb-2.5">
                <TrendingUp className={`w-4 h-4 ${dt.text}`} />
                <span className="text-xs font-semibold">Rincian Poin</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: `Bonus Win (${player.totalWins} win)`, value: `+${player.totalWins * 3}`, color: dt.text },
                  { label: `Bonus MVP (${player.totalMvp}x)`, value: `+${player.totalMvp * 5}`, color: 'text-yellow-500' },
                  { label: `Partisipasi (${player.matches} match)`, value: `+${player.matches * 2}`, color: 'text-green-500' },
                  { label: `Bonus Streak (${player.streak}x)`, value: `+${Math.min(player.streak * 5, 30)}`, color: 'text-orange-500' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>{item.value} pts</span>
                  </div>
                ))}
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className={dt.neonGradient}>{player.points} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Bottom accent line — traveling spotlight ═══ */}
          {skinColors && (
            <div
              className="h-1 mx-4 mb-4 overflow-hidden rounded-full relative"
              style={{ background: skinColors.frame + '20' }}
              aria-hidden="true"
            >
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{
                  width: '40%',
                  background: `linear-gradient(90deg, transparent 0%, ${skinColors.glow} 35%, #ffffffa0 50%, ${skinColors.glow} 65%, transparent 100%)`,
                }}
                animate={{ x: ['-120%', '320%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          )}
          </div>
      </div>
      </div>
    </div>
  );

  return createPortal(modal, portalTarget);
}
