'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trophy, Shield, Crown, Music, Target,
  TrendingUp, Award, Zap, Users, Star, BarChart3,
  Flame, ChevronRight
} from 'lucide-react';
import { TierBadge } from './tier-badge';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { getAvatarUrl, hashString } from '@/lib/utils';

interface ClubProfileProps {
  club: {
    id: string;
    name: string;
    division?: 'male' | 'female' | 'league' | string;
    wins: number;
    losses: number;
    points: number;
    gameDiff: number;
    members?: { id: string; name: string; gamertag: string; avatar?: string | null; tier: string; points: number }[];
    rank?: number;
  };
  onClose: () => void;
  rank?: number;
  onPlayerClick?: (player: { id: string; name: string; gamertag: string; avatar?: string | null; tier: string; points: number }) => void;
}

// ─── Procedural Club Logo Component ───
const ClubLogo = React.memo(function ClubLogo({ name, division, size = 120, isChampion }: {
  name: string; division?: string; size?: number; isChampion?: boolean;
}) {
  const hash = hashString(name);
  const isLeague = division === 'league';
  const isMale = division === 'male';
  const primaryColor = isLeague ? '#d4a853' : isMale ? '#22d3ee' : '#c084fc';
  const secondaryColor = isLeague ? '#f5d78e' : isMale ? '#06b6d4' : '#a855f7';
  const lightColor = isLeague ? '#f5d78e' : isMale ? '#67e8f9' : '#e9d5ff';
  const darkColor = isLeague ? '#a07c30' : isMale ? '#0e7490' : '#7c3aed';

  // Generate pattern variants based on hash
  const segments = 5 + (hash % 4); // 5-8 radial segments
  const rotation = (hash % 360);
  const innerPattern = hash % 5; // 0-4 different inner pattern types
  const accentCount = 3 + (hash % 3); // 3-5 accent dots

  // Extract initials: take first letter of each word, up to 3
  const words = name.trim().split(/\s+/);
  const initials = words.length >= 2
    ? words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : name.slice(0, 2).toUpperCase();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Champion glow ring — animated pulse */}
      {isChampion && (
        <>
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              inset: -8,
              border: `2px solid rgba(234, 179, 8, 0.3)`,
              boxShadow: `0 0 20px rgba(234, 179, 8, 0.15), 0 0 40px rgba(234, 179, 8, 0.05)`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: -4,
              border: `1px solid rgba(234, 179, 8, 0.15)`,
            }}
          />
        </>
      )}

      {/* Main logo SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="drop-shadow-2xl"
        style={{ filter: isChampion ? 'drop-shadow(0 0 12px rgba(234, 179, 8, 0.2))' : undefined }}
      >
        <defs>
          {/* Main gradient */}
          <linearGradient id={`grad-${hash}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={secondaryColor} />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>

          {/* Overlay gradient for depth */}
          <linearGradient id={`grad2-${hash}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lightColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.05" />
          </linearGradient>

          {/* Champion shimmer gradient */}
          {isChampion && (
            <linearGradient id={`shimmer-${hash}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(250, 204, 21, 0.15)" />
              <stop offset="55%" stopColor="transparent" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          )}

          {/* Clip path for shield shape */}
          <clipPath id={`shield-${hash}`}>
            <path d="M60 4 L112 24 L112 68 Q112 102 60 117 Q8 102 8 68 L8 24 Z" />
          </clipPath>

          {/* Radial glow filter */}
          <filter id={`glow-${hash}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Shield background fill ── */}
        <path
          d="M60 4 L112 24 L112 68 Q112 102 60 117 Q8 102 8 68 L8 24 Z"
          fill={`url(#grad-${hash})`}
          opacity="0.12"
        />

        {/* ── Inner patterns (clipped to shield) ── */}
        <g clipPath={`url(#shield-${hash})`}>
          {/* Radial segment lines */}
          {Array.from({ length: segments }).map((_, i) => {
            const angle = (360 / segments) * i + rotation;
            return (
              <line
                key={`seg-${i}`}
                x1="60" y1="60"
                x2={60 + Math.cos(angle * Math.PI / 180) * 120}
                y2={60 + Math.sin(angle * Math.PI / 180) * 120}
                stroke={lightColor}
                strokeWidth="0.5"
                opacity="0.1"
              />
            );
          })}

          {/* Inner pattern variations */}
          {innerPattern === 0 && (
            /* Diamond grid */
            <>
              <rect x="30" y="30" width="60" height="60" rx="2"
                transform="rotate(45 60 60)" fill="none" stroke={lightColor} strokeWidth="0.4" opacity="0.12" />
              <rect x="38" y="38" width="44" height="44" rx="2"
                transform="rotate(45 60 60)" fill="none" stroke={lightColor} strokeWidth="0.3" opacity="0.08" />
            </>
          )}
          {innerPattern === 1 && (
            /* Horizontal stripes */
            Array.from({ length: 7 }).map((_, i) => (
              <line
                key={`stripe-${i}`}
                x1="8" y1={25 + i * 14}
                x2="112" y2={25 + i * 14}
                stroke={lightColor}
                strokeWidth="0.4"
                opacity="0.08"
              />
            ))
          )}
          {innerPattern === 2 && (
            /* Concentric circles */
            <>
              <circle cx="60" cy="60" r="40" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.1" />
              <circle cx="60" cy="60" r="30" fill="none" stroke={primaryColor} strokeWidth="0.4" opacity="0.08" />
              <circle cx="60" cy="60" r="20" fill="none" stroke={primaryColor} strokeWidth="0.3" opacity="0.06" />
            </>
          )}
          {innerPattern === 3 && (
            /* Cross-hatch */
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <line
                  key={`ch1-${i}`}
                  x1={20 + i * 16} y1="4"
                  x2={20 + i * 16} y2="117"
                  stroke={lightColor} strokeWidth="0.3" opacity="0.06"
                />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <line
                  key={`ch2-${i}`}
                  x1="8" y1={20 + i * 16}
                  x2="112" y2={20 + i * 16}
                  stroke={lightColor} strokeWidth="0.3" opacity="0.06"
                />
              ))}
            </>
          )}
          {innerPattern === 4 && (
            /* Chevron pattern */
            <>
              <polyline points="20,35 60,20 100,35" fill="none" stroke={lightColor} strokeWidth="0.5" opacity="0.1" />
              <polyline points="20,55 60,40 100,55" fill="none" stroke={lightColor} strokeWidth="0.5" opacity="0.08" />
              <polyline points="20,75 60,60 100,75" fill="none" stroke={lightColor} strokeWidth="0.5" opacity="0.06" />
              <polyline points="20,95 60,80 100,95" fill="none" stroke={lightColor} strokeWidth="0.5" opacity="0.04" />
            </>
          )}

          {/* Central decorative circles */}
          <circle cx="60" cy="58" r="32" fill="none" stroke={primaryColor} strokeWidth="0.8" opacity="0.12" />
          <circle cx="60" cy="58" r="22" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.08" />

          {/* Accent dots at intersections */}
          {Array.from({ length: accentCount }).map((_, i) => {
            const dotAngle = (360 / accentCount) * i + rotation * 0.5;
            const dotR = 28;
            return (
              <circle
                key={`dot-${i}`}
                cx={60 + Math.cos(dotAngle * Math.PI / 180) * dotR}
                cy={58 + Math.sin(dotAngle * Math.PI / 180) * dotR}
                r="1.5"
                fill={lightColor}
                opacity="0.2"
              />
            );
          })}

          {/* Depth overlay gradient */}
          <path
            d="M60 4 L112 24 L112 68 Q112 102 60 117 Q8 102 8 68 L8 24 Z"
            fill={`url(#grad2-${hash})`}
          />
        </g>

        {/* ── Shield outer border ── */}
        <path
          d="M60 4 L112 24 L112 68 Q112 102 60 117 Q8 102 8 68 L8 24 Z"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          opacity="0.35"
        />

        {/* ── Shield inner border ── */}
        <path
          d="M60 11 L105 27 L105 66 Q105 96 60 110 Q15 96 15 66 L15 27 Z"
          fill="none"
          stroke={primaryColor}
          strokeWidth="0.5"
          opacity="0.15"
        />

        {/* ── Top accent chevron ── */}
        <path
          d="M60 14 L98 28 L98 32 L60 20 L22 32 L22 28 Z"
          fill={primaryColor}
          opacity="0.08"
        />

        {/* ── Bottom accent chevron ── */}
        <path
          d="M60 106 Q90 96 100 80 L100 84 Q90 100 60 110 Q30 100 20 84 L20 80 Q30 96 60 106 Z"
          fill={primaryColor}
          opacity="0.06"
        />

        {/* ── Club initials ── */}
        <text
          x="60"
          y="62"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={primaryColor}
          fontSize={initials.length > 2 ? '20' : '26'}
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
          opacity="0.85"
          filter={`url(#glow-${hash})`}
        >
          {initials}
        </text>

        {/* ── Champion shimmer overlay ── */}
        {isChampion && (
          <path
            d="M60 4 L112 24 L112 68 Q112 102 60 117 Q8 102 8 68 L8 24 Z"
            fill={`url(#shimmer-${hash})`}
          >
            <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
          </path>
        )}
      </svg>

      {/* Champion shimmer sweep overlay (CSS) */}
      {isChampion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: '16px' }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(250, 204, 21, 0.08) 45%, rgba(250, 204, 21, 0.15) 50%, rgba(250, 204, 21, 0.08) 55%, transparent 60%)',
              animation: 'clubLogoShimmer 3s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );
})

// ─── Banner Geometric Pattern ───
function BannerPattern({ division }: { division?: string }) {
  const isMale = division === 'male';
  const color = division === 'league' ? '#d4a853' : isMale ? '#22d3ee' : '#c084fc';

  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 220">
      <defs>
        <linearGradient id="banner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Diagonal lines */}
      <line x1="0" y1="0" x2="400" y2="220" stroke={color} strokeWidth="0.5" opacity="0.06" />
      <line x1="50" y1="0" x2="400" y2="175" stroke={color} strokeWidth="0.3" opacity="0.04" />
      <line x1="100" y1="0" x2="400" y2="150" stroke={color} strokeWidth="0.3" opacity="0.04" />
      <line x1="0" y1="50" x2="350" y2="220" stroke={color} strokeWidth="0.3" opacity="0.04" />
      <line x1="300" y1="0" x2="400" y2="55" stroke={color} strokeWidth="0.3" opacity="0.03" />
      <line x1="350" y1="0" x2="400" y2="27" stroke={color} strokeWidth="0.3" opacity="0.03" />

      {/* Geometric shapes */}
      <polygon points="320,20 340,10 360,20 360,40 340,50 320,40" fill="none" stroke={color} strokeWidth="0.5" opacity="0.07" />
      <polygon points="40,130 55,120 70,130 70,150 55,160 40,150" fill="none" stroke={color} strokeWidth="0.5" opacity="0.05" />
      <circle cx="360" cy="160" r="25" fill="none" stroke={color} strokeWidth="0.4" opacity="0.05" />
      <circle cx="360" cy="160" r="15" fill="none" stroke={color} strokeWidth="0.3" opacity="0.04" />
      <rect x="70" y="30" width="30" height="30" rx="2" transform="rotate(15 85 45)" fill="none" stroke={color} strokeWidth="0.4" opacity="0.05" />

      {/* Accent dots */}
      <circle cx="150" cy="20" r="1.5" fill={color} opacity="0.1" />
      <circle cx="250" cy="40" r="1" fill={color} opacity="0.08" />
      <circle cx="50" cy="80" r="1.5" fill={color} opacity="0.06" />
      <circle cx="370" cy="90" r="1" fill={color} opacity="0.08" />
      <circle cx="200" cy="180" r="1.5" fill={color} opacity="0.05" />
    </svg>
  );
}

function StatBlock({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

export function ClubProfile({ club, onClose, rank, onPlayerClick }: ClubProfileProps) {
  const dt = useDivisionTheme();
  const totalMatches = club.wins + club.losses;
  const winRate = totalMatches > 0 ? Math.round((club.wins / totalMatches) * 100) : 0;
  const isUndefeated = club.losses === 0 && club.wins > 0;
  const isChampion = rank === 1;

  const rankLabel = rank === 1 ? '🏆 Juara League' : rank === 2 ? '🥈 Juara 2' : rank === 3 ? '🥉 Peringkat 3' : rank ? `#${rank}` : '';

  // Members from actual data only — no fake fallback data
  const members = club.members || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-background w-full sm:max-w-md sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header Banner ── */}
          <div className="relative h-52 overflow-hidden">
            {/* AI-generated division background */}
            <img src={club.division === 'female' ? '/bg-female.jpg' : '/bg-male.jpg'} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />

            {/* Division gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/40 to-background/80" />

            {/* Geometric SVG pattern overlay */}
            <BannerPattern division={club.division} />

            {/* Bottom fade to background */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

            {/* Decorative large shield watermark */}
            <div className="absolute top-3 right-3 opacity-[0.06]">
              <Shield className={`w-28 h-28 ${dt.text}`} />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Rank Badge — top left */}
            {rank && rank <= 3 && (
              <div className="absolute top-3 left-3 z-10">
                <Badge className={`text-xs font-bold border-0 ${
                  rank === 1 ? `bg-yellow-500/20 text-yellow-500 ${dt.glowChampion}` :
                  rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                  'bg-amber-600/20 text-amber-600'
                }`}>
                  {rankLabel}
                </Badge>
              </div>
            )}

            {/* ── Large Club Logo — overlapping banner bottom ── */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-10">
              <div className={`rounded-2xl border-4 border-background ${
                isChampion ? 'bg-yellow-500/5' : ''
              }`}>
                <ClubLogo
                  name={club.name}
                  division={club.division}
                  size={120}
                  isChampion={isChampion}
                />
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="px-4 pt-20 pb-6">
            {/* Name & Division */}
            <div className="text-center mb-4">
              <h2 className={`text-xl font-bold ${dt.gradientText}`}>{club.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                {club.division && (
                  <Badge className={`text-[10px] border-0 ${club.division === 'league' ? 'bg-[#d4a853]/10 text-[#d4a853]' : dt.badgeBg}`}>
                    {club.division === 'league' ? '🏆 Liga Akbar' : club.division === 'male' ? '🕺 Divisi Male' : '💃 Divisi Female'}
                  </Badge>
                )}
                {isUndefeated && (
                  <Badge className="bg-green-500/10 text-green-500 text-[10px] border-0">
                    🔥 Tak Terkalahkan
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 max-w-xs mx-auto">
                {rank === 1
                  ? 'Juara League — Club terbaik dengan performa luar biasa'
                  : rank === 2
                  ? 'Juara 2 — Pesaing kuat yang mengejar gelar'
                  : 'Club kompetitif di season IDM League'
                }
              </p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatBlock icon={Trophy} label="Poin" value={club.points} color={dt.text} />
              <StatBlock icon={Target} label="Rasio Win" value={`${winRate}%`} sub={`${club.wins}W/${club.losses}L`} color="text-green-500" />
              <StatBlock icon={Music} label="Selisih Game" value={club.gameDiff > 0 ? `+${club.gameDiff}` : club.gameDiff} color="text-yellow-500" />
            </div>

            {/* Detailed Stats */}
            <div className="space-y-3 mb-4">
              {/* Win Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Rasio Win</span>
                  <span className={`font-bold ${dt.text}`}>{winRate}%</span>
                </div>
                <Progress value={winRate} className="h-2" />
              </div>

              {/* Record */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium">Win</span>
                </div>
                <span className="text-sm font-bold text-green-500">{club.wins}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium">Kekalahan</span>
                </div>
                <span className="text-sm font-bold text-red-500">{club.losses}</span>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${dt.text}`} />
                  <span className="text-xs font-medium">Total Match</span>
                </div>
                <span className={`text-sm font-bold ${dt.text}`}>{totalMatches}</span>
              </div>
            </div>

            {/* Roster */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className={`w-4 h-4 ${dt.text}`} />
                <h3 className="text-sm font-semibold">Daftar Pemain</h3>
                <Badge className={`${dt.badgeBg} text-[10px] ml-auto`}>{members.length} Players</Badge>
              </div>
              {members.length > 0 ? (
                <div className="space-y-1.5">
                  {members.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors cursor-pointer interactive-scale"
                      onClick={() => onPlayerClick?.(p)}
                    >
                      <div className="relative w-8 rounded-md overflow-hidden shrink-0" style={{ aspectRatio: '3/4' }}>
                        <img src={getAvatarUrl(p.gamertag, (club.division === 'league' ? (p as { division?: string }).division || 'male' : club.division === 'male' ? 'male' : 'female') as 'male' | 'female', p.avatar)} alt={p.gamertag} className="w-full h-full object-cover object-top" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06]/50 via-transparent to-transparent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{p.gamertag}</span>
                          <TierBadge tier={p.tier} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{p.name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${dt.text}`}>{p.points}</p>
                        <p className="text-[9px] text-muted-foreground">pts</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-4 rounded-lg ${dt.bgSubtle} border ${dt.borderSubtle} text-center`}>
                  <Users className={`w-5 h-5 ${dt.text} mx-auto mb-1.5 opacity-40`} />
                  <p className="text-xs text-muted-foreground">Belum ada anggota</p>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className={`w-4 h-4 ${dt.text}`} />
                <h3 className="text-sm font-semibold">Prestasi</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {club.wins >= 1 && (
                  <Badge className="bg-green-500/10 text-green-500 text-[10px] border-0">
                    <Star className="w-3 h-3 mr-1" /> Win Pertama
                  </Badge>
                )}
                {club.wins >= 3 && (
                  <Badge className="bg-blue-500/10 text-blue-500 text-[10px] border-0">
                    <Trophy className="w-3 h-3 mr-1" /> 3+ Win
                  </Badge>
                )}
                {isUndefeated && club.wins >= 2 && (
                  <Badge className="bg-orange-500/10 text-orange-500 text-[10px] border-0">
                    <Flame className="w-3 h-3 mr-1" /> Tak Terkalahkan
                  </Badge>
                )}
                {rank === 1 && (
                  <Badge className={`bg-yellow-500/10 text-yellow-500 text-[10px] border-0 ${dt.glowChampion}`}>
                    <Crown className="w-3 h-3 mr-1" /> Juara League
                  </Badge>
                )}
                {rank && rank <= 4 && rank > 1 && (
                  <Badge className={`${dt.badgeBg} text-[10px] border-0`}>
                    <Shield className="w-3 h-3 mr-1" /> 4 Besar
                  </Badge>
                )}
                {club.gameDiff >= 5 && (
                  <Badge className="bg-amber-500/10 text-amber-500 text-[10px] border-0">
                    <Music className="w-3 h-3 mr-1" /> Dominan (+{club.gameDiff} GD)
                  </Badge>
                )}
                {totalMatches >= 5 && (
                  <Badge className="bg-amber-600/10 text-amber-600 text-[10px] border-0">
                    <BarChart3 className="w-3 h-3 mr-1" /> Club Veteran
                  </Badge>
                )}
                {winRate >= 70 && club.wins > 0 && (
                  <Badge className={`${dt.badgeBg} text-[10px] border-0`}>
                    <TrendingUp className="w-3 h-3 mr-1" /> Rasio Win 70%+
                  </Badge>
                )}
              </div>
            </div>

            {/* Recent Matches — only shown when club has match history */}
            {totalMatches > 0 ? (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Music className={`w-4 h-4 ${dt.text}`} />
                  <h3 className="text-sm font-semibold">Rekor Match</h3>
                </div>
                <div className={`p-3 rounded-lg ${dt.bgSubtle} border ${dt.borderSubtle}`}>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-500">{club.wins}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Win</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-muted-foreground">0</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Seri</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-500">{club.losses}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Kekalahan</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Music className={`w-4 h-4 ${dt.text}`} />
                  <h3 className="text-sm font-semibold">Rekor Match</h3>
                </div>
                <div className={`p-4 rounded-lg ${dt.bgSubtle} border ${dt.borderSubtle} text-center`}>
                  <Music className={`w-5 h-5 ${dt.text} mx-auto mb-1.5 opacity-40`} />
                  <p className="text-xs text-muted-foreground">Belum ada match dimainkan</p>
                </div>
              </div>
            )}

            {/* Points Breakdown */}
            <div className={`p-3 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${dt.text}`} />
                <span className="text-xs font-semibold">Rincian Poin</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus Win ({club.wins} win × 2pts)</span>
                  <span className={`font-bold ${dt.text}`}>+{club.wins * 2} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selisih Game ({club.gameDiff > 0 ? '+' : ''}{club.gameDiff})</span>
                  <span className={`font-bold ${club.gameDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>{club.gameDiff > 0 ? '+' : ''}{club.gameDiff} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partisipasi ({totalMatches} match)</span>
                  <span className="font-bold text-green-500">+{totalMatches * 5} pts</span>
                </div>
                {isUndefeated && club.wins > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bonus Tak Terkalahkan</span>
                    <span className="font-bold text-orange-500">+20 pts</span>
                  </div>
                )}
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className={dt.text}>{club.points} pts</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
