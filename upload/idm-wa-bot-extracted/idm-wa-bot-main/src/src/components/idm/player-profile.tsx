'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X, Trophy, Flame, Crown, Shield, Target,
  TrendingUp, Award, Calendar, Star, BarChart3,
  ChevronRight, Activity, Gamepad2, MapPin, Users, CircleDot
} from 'lucide-react';
import { TierBadge } from './tier-badge';
import { Badge } from '@/components/ui/badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { getAvatarUrl, hashString } from '@/lib/utils';
import { AchievementList } from './achievement-badge';

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
    club?: string;
    division?: string;
  };
  onClose: () => void;
  rank?: number;
}

/* ─── Procedural Player Banner — uses AI-generated division background ─── */
function PlayerBanner({ gamertag, division, tier, rank }: {
  gamertag: string; division: string; tier: string; rank?: number
}) {
  const hash = hashString(gamertag);
  const isMale = division === 'male';
  const primaryColor = isMale ? '#22d3ee' : '#c084fc';
  const secondaryColor = isMale ? '#06b6d4' : '#a855f7';
  const bgImage = isMale ? '/bg-male.jpg' : '/bg-female.jpg';

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layer 1: AI-generated division background image */}
      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />

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
        <text x="90%" y="60%" textAnchor="end" dominantBaseline="middle"
          fill={primaryColor} fontSize="80" fontWeight="900" opacity="0.06"
          fontFamily="system-ui" letterSpacing="-2">
          {gamertag.toUpperCase()}
        </text>

        {/* Tier watermark */}
        <text x="10%" y="85%" textAnchor="start" dominantBaseline="middle"
          fill={secondaryColor} fontSize="32" fontWeight="700" opacity="0.04"
          fontFamily="system-ui">
          {tier} TIER
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
function StatBlock({ icon: Icon, label, value, sub, color, highlight, size = 'normal' }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  highlight?: boolean;
  size?: 'normal' | 'large';
}) {
  const dt = useDivisionTheme();
  const division = useAppStore(s => s.division);
  return (
    <div className={`relative rounded-xl p-3 text-center transition-all overflow-hidden ${
      highlight ? `${dt.bgSubtle} border ${dt.border}` : `bg-muted/10 border border-border/10`
    }`}>
      {/* Background decoration for highlighted stat */}
      {highlight && (
        <div className={`absolute inset-0 opacity-5`}>
          <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
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

export function PlayerProfile({ player, onClose, rank }: PlayerProfileProps) {
  const dt = useDivisionTheme();
  const division = useAppStore(s => s.division);
  const winRate = player.matches > 0 ? Math.round((player.totalWins / player.matches) * 100) : 0;
  const mvpRate = player.matches > 0 ? Math.round((player.totalMvp / player.matches) * 100) : 0;
  const losses = player.matches - player.totalWins;
  const isChampion = rank === 1;
  const isTop3 = rank !== undefined && rank <= 3;
  const isSTier = player.tier === 'S';

  // Fetch player achievements from API
  const { data: achievementData } = useQuery({
    queryKey: ['player-achievements', player.id],
    queryFn: async () => {
      const res = await fetch(`/api/players/${player.id}/achievements`);
      return res.json();
    },
    enabled: !!player.id,
  });

  const tierConfig: Record<string, { label: string; color: string; desc: string }> = {
    S: { label: 'S Tier', color: 'text-red-500', desc: 'Penari Elite — Performer teratas dengan ritme luar biasa' },
    A: { label: 'A Tier', color: 'text-yellow-500', desc: 'Penari Mahir — Performer tangguh dengan rekam jejak terbukti' },
    B: { label: 'B Tier', color: 'text-green-500', desc: 'Penari Meningkat — Performer berkembang dengan potensi' },
  };
  const tier = tierConfig[player.tier] || tierConfig.B;

  const rankLabel = rank === 1 ? 'JUARA' : rank === 2 ? 'JUARA 2' : rank === 3 ? 'PERINGKAT 3' : rank ? `#${rank}` : '';

  // No demo data — all data comes from actual organizer-input results only.
  // The game is not integrated with this server, so we cannot show
  // in-game performance metrics or per-match score trends.
  const hasMatchHistory = player.matches > 0;
  const avatarSrc = getAvatarUrl(player.gamertag, division, player.avatar);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-background w-full sm:max-w-lg sm:rounded-2xl overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══ HERO BANNER — Full Avatar Card Style ═══ */}
          <div className="relative h-96 overflow-hidden">
            {/* Full AI-generated avatar as background */}
            <img src={avatarSrc} alt={player.gamertag} className="absolute inset-0 w-full h-full object-cover object-[center_25%]" />

            {/* Dark overlay gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />

            {/* Division color tint overlay */}
            <div className="absolute inset-0" style={{
              background: division === 'male'
                ? 'radial-gradient(ellipse at 50% 30%, rgba(34,211,238,0.1) 0%, transparent 60%)'
                : 'radial-gradient(ellipse at 50% 30%, rgba(192,132,252,0.1) 0%, transparent 60%)'
            }} />

            {/* SVG procedural overlay for depth */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
              <text x="90%" y="50%" textAnchor="end" dominantBaseline="middle"
                fill={division === 'male' ? '#22d3ee' : '#c084fc'} fontSize="70" fontWeight="900" opacity="0.04"
                fontFamily="system-ui" letterSpacing="-2">
                {player.gamertag.toUpperCase()}
              </text>
              {/* Corner brackets */}
              <line x1="0" y1="0" x2="25%" y2="0" stroke={division === 'male' ? '#22d3ee' : '#c084fc'} strokeWidth="2" opacity="0.2" />
              <line x1="0" y1="0" x2="0" y2="25%" stroke={division === 'male' ? '#22d3ee' : '#c084fc'} strokeWidth="2" opacity="0.2" />
              <line x1="100%" y1="100%" x2="75%" y2="100%" stroke={division === 'male' ? '#22d3ee' : '#c084fc'} strokeWidth="2" opacity="0.2" />
              <line x1="100%" y1="100%" x2="100%" y2="75%" stroke={division === 'male' ? '#22d3ee' : '#c084fc'} strokeWidth="2" opacity="0.2" />
            </svg>

            {/* Tier-colored top accent line */}
            <div className={`absolute top-0 inset-x-0 h-1 ${
              player.tier === 'S' ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' :
              player.tier === 'A' ? 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent' :
              'bg-gradient-to-r from-transparent via-green-500 to-transparent'
            }`} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors z-20 border border-border/30"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Rank badge — top-left */}
            {isTop3 && (
              <div className="absolute top-3 left-3 z-10">
                <Badge className={`text-[10px] font-black border-0 backdrop-blur-sm px-2.5 py-1 ${
                  rank === 1 ? 'bg-yellow-500/25 text-yellow-400 shadow-lg shadow-yellow-500/10' :
                  rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                  'bg-amber-600/20 text-amber-500'
                }`}>
                  {rank === 1 ? '👑' : ''} {rankLabel}
                </Badge>
              </div>
            )}

            {/* Division badge */}
            <div className="absolute top-3 left-3 z-10" style={{ marginTop: isTop3 ? '28px' : 0 }}>
              <Badge className={`${dt.casinoBadge} text-[9px] backdrop-blur-sm`}>
                {division === 'male' ? '🕺 Divisi Male' : '💃 Divisi Female'}
              </Badge>
            </div>

            {/* Bottom info overlay — name, tier, club */}
            <div className="absolute bottom-0 inset-x-0 z-10 p-4">
              {/* S-tier animated glow ring around name */}
              {isSTier && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 80%, rgba(239, 68, 68, 0.08) 0%, transparent 50%)',
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <div className="relative z-10">
                <h2 className="text-2xl font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">{player.gamertag}</h2>
                <p className="text-xs text-white/60 mt-0.5">{player.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <TierBadge tier={player.tier} />
                  <span className={`text-xs font-semibold drop-shadow-sm ${tier.color}`}>{tier.label}</span>
                  {player.streak > 1 && (
                    <Badge className="bg-orange-500/20 text-orange-400 text-[10px] border-0 backdrop-blur-sm">
                      🔥 {player.streak} Streak
                    </Badge>
                  )}
                </div>
                {player.club && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Shield className={`w-3.5 h-3.5 ${dt.text}`} />
                    <span className={`text-xs ${dt.text} font-medium drop-shadow-sm`}>{player.club}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ CONTENT ═══ */}
          <div className="px-4 pt-4 pb-6">
            {/* Tier description */}
            <p className="text-[10px] text-muted-foreground text-center max-w-xs mx-auto mb-4">{tier.desc}</p>

            {/* ═══ Main Stats Grid — Dance Tournament HUD Style ═══ */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <StatBlock icon={Trophy} label="Poin" value={player.points} color={dt.text} highlight size="large" />
              <StatBlock icon={Target} label="Win Rate" value={`${winRate}%`} sub={`${player.totalWins}W/${losses}L`} color="text-green-500" />
              <StatBlock icon={Crown} label="MVP" value={player.totalMvp} sub={`${mvpRate}% rasio`} color="text-yellow-500" />
              <StatBlock icon={Activity} label="Match" value={player.matches} color="text-blue-400" />
            </div>

            {/* ═══ Performance Overview — based on actual record only ═══ */}
            {hasMatchHistory ? (
              <div className={`p-3.5 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle} mb-4`}>
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
              <div className={`p-3.5 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle} mb-4 text-center`}>
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${winRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    winRate >= 60
                      ? `bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`
                      : winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
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
                  achievements={achievementData.achievements.map((a: { achievement: { id: string; name: string; displayName: string; description: string; icon: string; tier: string } }) => ({
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
                  {player.tier === 'S' && (
                    <Badge className="bg-red-500/10 text-red-500 text-[10px] border-0">
                      <Star className="w-3 h-3 mr-1" /> Elit
                    </Badge>
                  )}
                  {rank === 1 && (
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
                <div className={`p-3 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
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
                <div className={`p-4 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle} text-center`}>
                  <Calendar className={`w-5 h-5 ${dt.text} mx-auto mb-1.5 opacity-40`} />
                  <p className="text-xs text-muted-foreground">Belum ada match tercatat</p>
                </div>
              </div>
            )}

            {/* ═══ Points Breakdown ═══ */}
            <div className={`p-3.5 rounded-xl ${dt.bgSubtle} border ${dt.borderSubtle}`}>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
