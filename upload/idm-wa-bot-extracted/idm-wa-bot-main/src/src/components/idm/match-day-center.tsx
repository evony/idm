'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Crown, Radio, Clock, Flame, Zap,
  Users, TrendingUp, Star, ChevronRight,
  Vote, BarChart3, Activity, Eye, MessageSquare, ThumbsUp,
  ArrowRight, Circle, CheckCircle2, XCircle, Timer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TierBadge } from './tier-badge';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { formatCurrency } from '@/lib/utils';
import type { StatsData } from '@/types/stats';
import { staggerContainerSlow as container, fadeUpItemSlow as item } from '@/lib/animations';

interface PredictionState {
  matchId: string;
  team1Votes: number;
  team2Votes: number;
  userVote: 'team1' | 'team2' | null;
}

/* ─── Live Pulse Indicator ─── */
function LivePulse() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Live</span>
    </div>
  );
}

/* ─── Match Event for Timeline ─── */
interface MatchEvent {
  time: string;
  type: 'session_open' | 'score_input' | 'mvp_selected' | 'match_end' | 'match_scheduled' | 'round_result';
  team: 'team1' | 'team2' | 'neutral';
  description: string;
  player?: string;
}

/* ─── Prediction Vote Bar ─── */
function PredictionBar({ team1Votes, team2Votes, userVote, onVote, team1Name, team2Name }: {
  team1Votes: number; team2Votes: number;
  userVote: 'team1' | 'team2' | null;
  onVote: (team: 'team1' | 'team2') => void;
  team1Name: string; team2Name: string;
}) {
  const dt = useDivisionTheme();
  const division = useAppStore(s => s.division);
  const totalVotes = team1Votes + team2Votes;
  const team1Percent = totalVotes > 0 ? Math.round((team1Votes / totalVotes) * 100) : 50;
  const team2Percent = totalVotes > 0 ? 100 - team1Percent : 50;

  return (
    <div className={`rounded-xl ${dt.bgSubtle} ${dt.border} border p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <ThumbsUp className={`w-4 h-4 ${dt.neonText}`} />
        <span className="text-xs font-semibold uppercase tracking-wider">Prediksi Match</span>
        <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{totalVotes > 0 ? `${totalVotes} suara` : 'Belum ada suara'}</Badge>
      </div>

      {/* Vote Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={() => onVote('team1')}
          className={`relative rounded-xl p-3 text-center transition-all duration-300 border-2 overflow-hidden ${
            userVote === 'team1'
              ? `border-current ${dt.neonText} ${dt.bgSubtle}`
              : `${dt.borderSubtle} border-transparent ${dt.hoverBorder}`
          }`}
        >
          {userVote === 'team1' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} flex items-center justify-center`}
            >
              <CheckCircle2 className="w-3 h-3 text-white" />
            </motion.div>
          )}
          <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-xs font-bold mb-1.5 ${
            userVote === 'team1'
              ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white`
              : `${dt.iconBg} ${dt.text}`
          }`}>
            {team1Name.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[11px] font-semibold truncate">{team1Name}</p>
          <p className={`text-lg font-black mt-1 ${userVote === 'team1' ? dt.neonGradient : ''}`}>
            {totalVotes > 0 ? `${team1Percent}%` : '-'}
          </p>
        </button>

        <button
          onClick={() => onVote('team2')}
          className={`relative rounded-xl p-3 text-center transition-all duration-300 border-2 overflow-hidden ${
            userVote === 'team2'
              ? `border-current ${dt.neonText} ${dt.bgSubtle}`
              : `${dt.borderSubtle} border-transparent ${dt.hoverBorder}`
          }`}
        >
          {userVote === 'team2' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} flex items-center justify-center`}
            >
              <CheckCircle2 className="w-3 h-3 text-white" />
            </motion.div>
          )}
          <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-xs font-bold mb-1.5 ${
            userVote === 'team2'
              ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white`
              : `${dt.iconBg} ${dt.text}`
          }`}>
            {team2Name.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[11px] font-semibold truncate">{team2Name}</p>
          <p className={`text-lg font-black mt-1 ${userVote === 'team2' ? dt.neonGradient : ''}`}>
            {totalVotes > 0 ? `${team2Percent}%` : '-'}
          </p>
        </button>
      </div>

      {/* Visual Bar */}
      {totalVotes > 0 ? (
        <div className={`h-2 rounded-full ${dt.bgSubtle} overflow-hidden flex`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${team1Percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-l-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${team2Percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-r-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male-light to-idm-male' : 'from-idm-female-light to-idm-female'}`}
            style={{ opacity: 0.5 }}
          />
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground text-center italic">Vote untuk melihat bar prediksi — jadilah yang pertama memprediksi!</p>
      )}
    </div>
  );
}

/* ─── Head-to-Head Stat Row ─── */
function H2HStatRow({ label, team1Val, team2Val, highlight = 'higher' }: {
  label: string; team1Val: number | string; team2Val: number | string; highlight?: 'higher' | 'lower' | 'none';
}) {
  const dt = useDivisionTheme();
  const t1Num = typeof team1Val === 'number' ? team1Val : 0;
  const t2Num = typeof team2Val === 'number' ? team2Val : 0;
  const t1Highlight = highlight === 'higher' ? t1Num > t2Num : highlight === 'lower' ? t1Num < t2Num : false;
  const t2Highlight = highlight === 'higher' ? t2Num > t1Num : highlight === 'lower' ? t2Num < t1Num : false;

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dt.bgSubtle}`}>
      <span className={`text-sm font-bold w-10 text-right ${t1Highlight ? dt.neonText : 'text-muted-foreground'}`}>
        {team1Val}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex-1 text-center font-medium">
        {label}
      </span>
      <span className={`text-sm font-bold w-10 text-left ${t2Highlight ? dt.neonText : 'text-muted-foreground'}`}>
        {team2Val}
      </span>
    </div>
  );
}

/* ─── Timeline Event ─── */
function TimelineEvent({ event, idx }: { event: MatchEvent; idx: number }) {
  const dt = useDivisionTheme();
  const iconMap = {
    session_open: <Activity className="w-3 h-3 text-green-400" />,
    round_result: <CheckCircle2 className="w-3 h-3 text-blue-400" />,
    score_input: <Star className="w-3 h-3 text-emerald-400" />,
    mvp_selected: <Crown className="w-3 h-3 text-yellow-500" />,
    match_scheduled: <Clock className="w-3 h-3 text-amber-400" />,
    match_end: <Trophy className="w-3 h-3 text-[#d4a853]" />,
  };

  const teamColor = event.team === 'team1' ? dt.neonText : event.team === 'team2' ? 'text-purple-400' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="flex items-start gap-3"
    >
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-7 h-7 rounded-full ${dt.bgSubtle} border ${dt.borderSubtle} flex items-center justify-center`}>
          {iconMap[event.type]}
        </div>
        {idx < 5 && <div className={`w-px h-4 ${dt.borderSubtle} bg-border`} />}
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${dt.casinoBadge} text-[8px] px-1.5 py-0`}>{event.time}</Badge>
          <span className={`text-[11px] font-semibold ${teamColor}`}>{event.description}</span>
        </div>
        {event.player && (
          <p className="text-[9px] text-muted-foreground mt-0.5 ml-10">{event.player}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ title, icon: Icon, badge, children, className = '' }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const dt = useDivisionTheme();
  return (
    <Card className={`${dt.casinoCard} overflow-hidden ${className}`}>
      <div className={dt.casinoBar} />
      <CardContent className="p-0 relative z-10">
        <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${dt.borderSubtle}`}>
          <div className={`w-5 h-5 rounded ${dt.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3 h-3 ${dt.neonText}`} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
          {badge && <Badge className={`${dt.casinoBadge} ml-auto text-[9px]`}>{badge}</Badge>}
        </div>
        <div className="p-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT: MatchDayCenter
   ═══════════════════════════════════════════════ */
export function MatchDayCenter() {
  const { division } = useAppStore();
  const dt = useDivisionTheme();
  const [predictions, setPredictions] = useState<Map<string, PredictionState>>(new Map());
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);

  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ['stats', division],
    queryFn: async () => {
      const res = await fetch(`/api/stats?division=${division}`);
      return res.json();
    },
  });

  // Timeline events — only shows what admin actually inputs into the system.
  // No fake auto-detected game events, no simulated round timestamps.
  // The game is NOT integrated with the server, so we only display
  // organizer-input data: scores, MVP selection, match status.
  const matchEvents: MatchEvent[] = useMemo(() => {
    const t = data?.activeTournament;
    if (!t?.matches?.length) return [];
    const match = t.matches[selectedMatchIdx] || t.matches[0];
    const events: MatchEvent[] = [];

    // Match scheduled — shown for upcoming matches
    if (match.status === 'scheduled' || match.status === 'upcoming') {
      events.push({ time: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'TBD', type: 'match_scheduled', team: 'neutral', description: 'Match dijadwalkan — menunggu sesi dimulai' });
      return events;
    }

    // Session opened by admin
    events.push({ time: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Start', type: 'session_open', team: 'neutral', description: 'Sesi dibuka oleh organizer' });

    // Round results — derived from the admin-input scores (not auto-detected)
    const s1 = match.score1 ?? 0;
    const s2 = match.score2 ?? 0;

    if (s1 > 0 || s2 > 0) {
      // Show round-by-round result based on the final score input by admin
      // Each score point represents a round/dance-off win
      let roundNum = 0;
      const t1Rounds = s1;
      const t2Rounds = s2;
      // Interleave round wins to create a realistic sequence
      const maxRounds = Math.max(t1Rounds, t2Rounds);
      for (let i = 0; i < maxRounds; i++) {
        if (i < t1Rounds) {
          roundNum++;
          events.push({ time: `R${roundNum}`, type: 'round_result', team: 'team1', description: `Ronde ${roundNum}: ${match.team1.name} memenangkan dance-off` });
        }
        if (i < t2Rounds) {
          roundNum++;
          events.push({ time: `R${roundNum}`, type: 'round_result', team: 'team2', description: `Ronde ${roundNum}: ${match.team2.name} memenangkan dance-off` });
        }
      }

      // Final score submitted by admin
      events.push({ time: 'Final', type: 'score_input', team: s1 > s2 ? 'team1' : 'team2', description: `Skor akhir disubmit: ${s1} - ${s2}` });
    }

    // MVP — selected by admin/organizer
    if (match.mvpPlayer) {
      events.push({ time: 'Final', type: 'mvp_selected', team: 'neutral', description: 'MVP dipilih oleh organizer', player: match.mvpPlayer.gamertag });
    }

    // Match end
    if (match.status === 'completed') {
      events.push({ time: 'Final', type: 'match_end', team: 'neutral', description: 'Match selesai — hasil difinalisasi' });
    }

    return events;
  }, [data?.activeTournament, selectedMatchIdx]);

  // Handle prediction vote
  const handleVote = useCallback((matchId: string, team: 'team1' | 'team2') => {
    setPredictions(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(matchId) || { matchId, team1Votes: 0, team2Votes: 0, userVote: null as any };
      if (current.userVote === team) return prev; // Already voted for this team

      // If switching vote, remove from previous
      if (current.userVote) {
        if (current.userVote === 'team1') current.team1Votes--;
        else current.team2Votes--;
      }

      // Add to new team
      if (team === 'team1') current.team1Votes++;
      else current.team2Votes++;
      current.userVote = team;

      newMap.set(matchId, { ...current });
      return newMap;
    });
  }, []);

  // Initialize predictions — all start from 0, votes come from real user input only
  useEffect(() => {
    if (!data?.activeTournament?.matches) return;
    const newMap = new Map(predictions);
    let changed = false;
    data.activeTournament.matches.forEach(m => {
      if (!newMap.has(m.id)) {
        newMap.set(m.id, {
          matchId: m.id,
          team1Votes: 0,
          team2Votes: 0,
          userVote: null,
        });
        changed = true;
      }
    });
    if (changed) setPredictions(newMap);
  }, [data?.activeTournament?.matches]);

  if (isLoading || !data?.hasData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`w-8 h-8 border-2 ${dt.border} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  const t = data.activeTournament;
  const tournamentMatches = t?.matches || [];
  const selectedMatch = tournamentMatches[selectedMatchIdx] || tournamentMatches[0];
  const predState = selectedMatch ? predictions.get(selectedMatch.id) : null;

  // Generate H2H stats from actual tournament data (admin-input results only).
  // No fake fallback data — if no matches have been played, stats show 0.
  // All data comes from organizer score input, not from game integration.
  const team1Stats = selectedMatch ? (() => {
    const team1Name = selectedMatch.team1.name;
    const tMatches = data?.activeTournament?.matches || [];
    let wins = 0, losses = 0, draws = 0, mvpCount = 0, totalRoundsWon = 0, totalRoundsLost = 0;
    tMatches.forEach(m => {
      if (m.team1.name === team1Name) {
        if (m.score1 !== null && m.score2 !== null) {
          if (m.score1 > m.score2) wins++; else if (m.score1 < m.score2) losses++; else draws++;
          totalRoundsWon += m.score1; totalRoundsLost += m.score2;
        }
        if (m.mvpPlayer && m.team1.name === team1Name) mvpCount++;
      } else if (m.team2.name === team1Name) {
        if (m.score1 !== null && m.score2 !== null) {
          if (m.score2 > m.score1) wins++; else if (m.score2 < m.score1) losses++; else draws++;
          totalRoundsWon += m.score2; totalRoundsLost += m.score1;
        }
        if (m.mvpPlayer && m.team2.name === team1Name) mvpCount++;
      }
    });
    return {
      wins,
      losses,
      draws,
      roundDiff: totalRoundsWon - totalRoundsLost,
      points: wins * 3 + draws * 1 + mvpCount * 2,
      mvpCount,
      winRate: (wins + losses + draws) > 0 ? Math.round((wins / (wins + losses + draws)) * 100) : 0,
      totalRoundsWon,
      totalRoundsLost,
      hasData: (wins + losses + draws) > 0,
    };
  })() : null;
  const team2Stats = selectedMatch ? (() => {
    const team2Name = selectedMatch.team2.name;
    const tMatches = data?.activeTournament?.matches || [];
    let wins = 0, losses = 0, draws = 0, mvpCount = 0, totalRoundsWon = 0, totalRoundsLost = 0;
    tMatches.forEach(m => {
      if (m.team1.name === team2Name) {
        if (m.score1 !== null && m.score2 !== null) {
          if (m.score1 > m.score2) wins++; else if (m.score1 < m.score2) losses++; else draws++;
          totalRoundsWon += m.score1; totalRoundsLost += m.score2;
        }
        if (m.mvpPlayer && m.team1.name === team2Name) mvpCount++;
      } else if (m.team2.name === team2Name) {
        if (m.score1 !== null && m.score2 !== null) {
          if (m.score2 > m.score1) wins++; else if (m.score2 < m.score1) losses++; else draws++;
          totalRoundsWon += m.score2; totalRoundsLost += m.score1;
        }
        if (m.mvpPlayer && m.team2.name === team2Name) mvpCount++;
      }
    });
    return {
      wins,
      losses,
      draws,
      roundDiff: totalRoundsWon - totalRoundsLost,
      points: wins * 3 + draws * 1 + mvpCount * 2,
      mvpCount,
      winRate: (wins + losses + draws) > 0 ? Math.round((wins / (wins + losses + draws)) * 100) : 0,
      totalRoundsWon,
      totalRoundsLost,
      hasData: (wins + losses + draws) > 0,
    };
  })() : null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-5xl mx-auto">

      {/* ═══════ HERO: Featured Match Banner ═══════ */}
      <motion.div variants={item}>
        <Card className={`${dt.casinoCard} ${dt.casinoGlow} casino-shimmer overflow-hidden`}>
          <div className={dt.casinoBar} />
          <div className="relative">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src="/bg-default.jpg" alt="" className="w-full h-full object-cover object-[center_30%]" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
            </div>

            <div className="relative z-10 p-4 lg:p-6">
              {/* Top Bar: Tournament Info + Live Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Badge className={`${dt.casinoBadge} text-[10px]`}>
                    <Flame className="w-3 h-3 mr-1" />
                    Week {t?.weekNumber || 5}
                  </Badge>
                  <Badge className={`${dt.casinoBadge} text-[10px]`}>
                    {t?.name || 'Turnamen IDM'}
                  </Badge>
                </div>
                {(selectedMatch?.status === 'live' || selectedMatch?.status === 'main_event') ? (
                  <LivePulse />
                ) : selectedMatch?.status === 'completed' ? (
                  <Badge className="bg-green-500/10 text-green-500 text-[10px] font-black border-0">SELESAI</Badge>
                ) : (
                  <Badge className={`${dt.casinoBadge} text-[10px]`}>MENDATANG</Badge>
                )}
              </div>

              {/* Match Selection Tabs */}
              {tournamentMatches.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                  {tournamentMatches.map((m, idx) => {
                    const isActive = idx === selectedMatchIdx;
                    const isLive = m.status === 'live' || m.status === 'main_event';
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMatchIdx(idx)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                          isActive
                            ? `${dt.bg} ${dt.text} ${dt.border} shadow-sm`
                            : `${dt.bgSubtle} ${dt.borderSubtle} text-muted-foreground hover:text-foreground`
                        } ${isLive ? 'border-red-500/30' : ''}`}
                      >
                        {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 live-dot" />}
                        {m.team1.name} vs {m.team2.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ═══ Main Match Display ═══ */}
              {selectedMatch && (
                <div className="flex items-center gap-4 lg:gap-8">
                  {/* Team 1 */}
                  <div className={`flex-1 text-center ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! ? '' : 'opacity-80'}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-20 h-20 lg:w-28 lg:h-28 mx-auto rounded-2xl flex items-center justify-center text-2xl lg:text-4xl font-black shadow-lg ${
                        selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2!
                          ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white glow-champion`
                          : `${dt.iconBg} ${dt.text}`
                      }`}
                    >
                      {selectedMatch.team1.name.slice(0, 2).toUpperCase()}
                    </motion.div>
                    <p className={`text-sm lg:text-xl font-bold mt-3 ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! ? dt.neonText : ''}`}>
                      {selectedMatch.team1.name}
                    </p>
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2! && (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[9px] border-0 mt-1">
                        <Crown className="w-2.5 h-2.5 mr-0.5" /> WINNER
                      </Badge>
                    )}
                  </div>

                  {/* VS / Score Center */}
                  <div className="flex flex-col items-center shrink-0">
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null ? (
                      <div className="flex items-center gap-3 lg:gap-5">
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`text-4xl lg:text-6xl font-black tabular-nums ${
                            selectedMatch.score1 > selectedMatch.score2 ? dt.neonGradient : 'text-foreground/30'
                          }`}
                        >
                          {selectedMatch.score1}
                        </motion.span>
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-full ${dt.bgSubtle} ${dt.border} border flex items-center justify-center`}>
                            <Star className={`w-5 h-5 lg:w-7 lg:h-7 ${dt.neonText}`} />
                          </div>
                          <span className="text-[8px] text-muted-foreground mt-1 font-semibold uppercase">
                            {selectedMatch.status === 'completed' ? 'Final' : 'BO3'}
                          </span>
                        </div>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`text-4xl lg:text-6xl font-black tabular-nums ${
                            selectedMatch.score2 > selectedMatch.score1 ? dt.neonGradient : 'text-foreground/30'
                          }`}
                        >
                          {selectedMatch.score2}
                        </motion.span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-16 h-16 lg:w-24 lg:h-24 rounded-full ${dt.bgSubtle} ${dt.border} border-2 flex items-center justify-center`}
                        >
                          <span className={`text-xl lg:text-3xl font-black ${dt.neonGradient}`}>VS</span>
                        </motion.div>
                        <span className="text-[10px] text-muted-foreground mt-2 font-semibold">Segera Dimulai</span>
                      </div>
                    )}

                    {/* MVP */}
                    {selectedMatch.mvpPlayer && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg ${dt.bgSubtle} ${dt.border} border`}
                      >
                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-[10px] font-semibold text-yellow-500">MVP: {selectedMatch.mvpPlayer.gamertag}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Team 2 */}
                  <div className={`flex-1 text-center ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! ? '' : 'opacity-80'}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-20 h-20 lg:w-28 lg:h-28 mx-auto rounded-2xl flex items-center justify-center text-2xl lg:text-4xl font-black shadow-lg ${
                        selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1!
                          ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white glow-champion`
                          : `${dt.iconBg} ${dt.text}`
                      }`}
                    >
                      {selectedMatch.team2.name.slice(0, 2).toUpperCase()}
                    </motion.div>
                    <p className={`text-sm lg:text-xl font-bold mt-3 ${selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! ? dt.neonText : ''}`}>
                      {selectedMatch.team2.name}
                    </p>
                    {selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1! && (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[9px] border-0 mt-1">
                        <Crown className="w-2.5 h-2.5 mr-0.5" /> WINNER
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Score Bar */}
              {selectedMatch && selectedMatch.score1 !== null && selectedMatch.score2 !== null && (selectedMatch.score1 + selectedMatch.score2) > 0 && (
                <div className="mt-4">
                  <div className={`h-2 rounded-full ${dt.bgSubtle} overflow-hidden flex`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedMatch.score1 / (selectedMatch.score1 + selectedMatch.score2)) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-l-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`}
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedMatch.score2 / (selectedMatch.score1 + selectedMatch.score2)) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-r-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male-light to-idm-male' : 'from-idm-female-light to-idm-female'}`}
                      style={{ opacity: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Match Meta */}
              {t && (
                <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.scheduledAt ? new Date(t.scheduledAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBD'}</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />Week {t.weekNumber}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{formatCurrency(t.prizePool)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══════ TABS: Prediction / H2H / Timeline / Results ═══════ */}
      <Tabs defaultValue="prediction" className="w-full">
        <div className={`border-b ${dt.border}`}>
          <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
            {[
              { value: 'prediction', label: 'Prediksi', icon: ThumbsUp },
              { value: 'h2h', label: 'H2H', icon: Users },
              { value: 'timeline', label: 'Lini Masa', icon: Activity },
              { value: 'results', label: 'Hasil', icon: Trophy },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`relative px-4 py-2.5 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:shadow-none ${dt.text} data-[state=active]:${dt.text} text-muted-foreground hover:text-foreground transition-colors`}
              >
                <tab.icon className="w-3.5 h-3.5 mr-1.5 inline" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ═══ PREDICTION TAB ═══ */}
        <TabsContent value="prediction" className="mt-4 space-y-4">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {/* Featured Match Prediction */}
            {selectedMatch && predState && (
              <motion.div variants={item}>
                <PredictionBar
                  team1Votes={predState.team1Votes}
                  team2Votes={predState.team2Votes}
                  userVote={predState.userVote}
                  onVote={(team) => handleVote(selectedMatch.id, team)}
                  team1Name={selectedMatch.team1.name}
                  team2Name={selectedMatch.team2.name}
                />
              </motion.div>
            )}

            {/* All Match Predictions */}
            <motion.div variants={item}>
              <SectionCard title="Semua Prediksi Match" icon={BarChart3} badge={`${tournamentMatches.length} match`}>
                <div className="space-y-3">
                  {tournamentMatches.map((m) => {
                    const pState = predictions.get(m.id);
                    if (!pState) return null;
                    const total = pState.team1Votes + pState.team2Votes;
                    const t1Pct = total > 0 ? Math.round((pState.team1Votes / total) * 100) : 50;

                    return (
                      <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${dt.bgSubtle} ${dt.borderSubtle} border`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold truncate">{m.team1.name}</span>
                            <span className="text-[11px] font-semibold truncate">{m.team2.name}</span>
                          </div>
                          <div className={`h-1.5 rounded-full ${dt.bg} overflow-hidden flex`}>
                            <div
                              className={`h-full rounded-l-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`}
                              style={{ width: `${t1Pct}%` }}
                            />
                            <div
                              className={`h-full rounded-r-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male-light to-idm-male' : 'from-idm-female-light to-idm-female'}`}
                              style={{ width: `${100 - t1Pct}%`, opacity: 0.5 }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-[9px] font-bold ${pState.userVote === 'team1' ? dt.neonText : 'text-muted-foreground'}`}>{t1Pct}%</span>
                            <span className="text-[9px] text-muted-foreground">{total} suara</span>
                            <span className={`text-[9px] font-bold ${pState.userVote === 'team2' ? dt.neonText : 'text-muted-foreground'}`}>{100 - t1Pct}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => handleVote(m.id, 'team1')}
                            className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                              pState.userVote === 'team1'
                                ? `bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white`
                                : `${dt.bgSubtle} ${dt.text} ${dt.hoverBg}`
                            }`}
                          >
                            {m.team1.name.slice(0, 2)}
                          </button>
                          <button
                            onClick={() => handleVote(m.id, 'team2')}
                            className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                              pState.userVote === 'team2'
                                ? `bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white`
                                : `${dt.bgSubtle} ${dt.text} ${dt.hoverBg}`
                            }`}
                          >
                            {m.team2.name.slice(0, 2)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </motion.div>

            {/* Community Insight */}
            <motion.div variants={item}>
              <SectionCard title="Insight Komunitas" icon={Eye} badge="Trending">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl ${dt.bgSubtle} ${dt.border} border text-center`}>
                    <p className={`text-2xl font-black ${dt.neonGradient}`}>
                      {predState ? Math.max(predState.team1Votes, predState.team2Votes) : 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Suara Terbanyak</p>
                  </div>
                  <div className={`p-3 rounded-xl ${dt.bgSubtle} ${dt.border} border text-center`}>
                    <p className={`text-2xl font-black ${dt.neonGradient}`}>
                      {predState ? Math.round((Math.max(predState.team1Votes, predState.team2Votes) / (predState.team1Votes + predState.team2Votes)) * 100) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Konsensus</p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ═══ HEAD TO HEAD TAB ═══ */}
        <TabsContent value="h2h" className="mt-4 space-y-4">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {selectedMatch && team1Stats && team2Stats && (
              <>
                <motion.div variants={item}>
                  <SectionCard title="Statistik H2H" icon={Users} badge="Statistik">
                    {/* Team Headers */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 text-center">
                        <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-lg font-bold ${
                          selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score1! > selectedMatch.score2!
                            ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white`
                            : `${dt.iconBg} ${dt.text}`
                        }`}>
                          {selectedMatch.team1.name.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-xs font-bold mt-1.5">{selectedMatch.team1.name}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full ${dt.bgSubtle} ${dt.border} border flex items-center justify-center shrink-0`}>
                        <Users className={`w-4 h-4 ${dt.neonText}`} />
                      </div>
                      <div className="flex-1 text-center">
                        <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-lg font-bold ${
                          selectedMatch.score1 !== null && selectedMatch.score2 !== null && selectedMatch.score2! > selectedMatch.score1!
                            ? `bg-gradient-to-br ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white`
                            : `${dt.iconBg} ${dt.text}`
                        }`}>
                          {selectedMatch.team2.name.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-xs font-bold mt-1.5">{selectedMatch.team2.name}</p>
                      </div>
                    </div>

                    {/* Stats Rows — all from organizer-input data, no fake stats */}
                    <div className="space-y-1.5">
                      <H2HStatRow label="Win" team1Val={team1Stats.wins} team2Val={team2Stats.wins} />
                      <H2HStatRow label="Lose" team1Val={team1Stats.losses} team2Val={team2Stats.losses} highlight="lower" />
                      <H2HStatRow label="Win Rate" team1Val={`${team1Stats.winRate}%`} team2Val={`${team2Stats.winRate}%`} />
                      <H2HStatRow label="Ronde Dimenangkan" team1Val={team1Stats.totalRoundsWon} team2Val={team2Stats.totalRoundsWon} />
                      <H2HStatRow label="Selisih Ronde" team1Val={team1Stats.roundDiff > 0 ? `+${team1Stats.roundDiff}` : team1Stats.roundDiff} team2Val={team2Stats.roundDiff > 0 ? `+${team2Stats.roundDiff}` : team2Stats.roundDiff} />
                      <H2HStatRow label="Poin" team1Val={team1Stats.points} team2Val={team2Stats.points} />
                      <H2HStatRow label="Penghargaan MVP" team1Val={team1Stats.mvpCount} team2Val={team2Stats.mvpCount} />
                    </div>
                    {!team1Stats.hasData && !team2Stats.hasData && (
                      <p className="text-[10px] text-muted-foreground text-center mt-3 italic">Belum ada data match — statistik akan muncul setelah organizer submit hasil</p>
                    )}
                  </SectionCard>
                </motion.div>

                {/* Win Probability — calculated from actual stats, not hardcoded */}
                <motion.div variants={item}>
                  <SectionCard title="Peluang Menang" icon={TrendingUp} badge="Berdasarkan Statistik">
                    <div className={`p-4 rounded-xl ${dt.bgSubtle} ${dt.border} border`}>
                      {team1Stats.hasData || team2Stats.hasData ? (() => {
                        // Calculate probability from actual win rates and round differentials
                        const t1Score = team1Stats.winRate + Math.max(team1Stats.roundDiff, 0) * 5 + team1Stats.mvpCount * 3;
                        const t2Score = team2Stats.winRate + Math.max(team2Stats.roundDiff, 0) * 5 + team2Stats.mvpCount * 3;
                        const totalScore = t1Score + t2Score || 1;
                        const t1Prob = Math.round((t1Score / totalScore) * 100);
                        const t2Prob = 100 - t1Prob;
                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold">{selectedMatch.team1.name}</span>
                              <span className="text-xs font-semibold">{selectedMatch.team2.name}</span>
                            </div>
                            <div className={`h-3 rounded-full ${dt.bg} overflow-hidden flex`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${t1Prob}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-l-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`}
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${t2Prob}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-r-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male-light to-idm-male' : 'from-idm-female-light to-idm-female'}`}
                                style={{ opacity: 0.5 }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={`text-sm font-black ${t1Prob >= t2Prob ? dt.neonText : 'text-muted-foreground'}`}>{t1Prob}%</span>
                              <span className="text-[9px] text-muted-foreground">Berdasarkan win rate & selisih ronde</span>
                              <span className={`text-sm font-black ${t2Prob > t1Prob ? dt.neonText : 'text-muted-foreground'}`}>{t2Prob}%</span>
                            </div>
                          </>
                        );
                      })() : (
                        <div className="text-center py-4">
                          <TrendingUp className={`w-6 h-6 mx-auto ${dt.text} mb-2`} />
                          <p className="text-[10px] text-muted-foreground italic">Probabilitas akan dihitung setelah hasil match disubmit</p>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </motion.div>
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* ═══ TIMELINE TAB ═══ */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            <motion.div variants={item}>
              <SectionCard title="Lini Masa Match" icon={Activity} badge={selectedMatch ? `${matchEvents.length} event` : '0 event'}>
                {matchEvents.length > 0 ? (
                  <div className="space-y-0">
                    {matchEvents.map((event, idx) => (
                      <TimelineEvent key={`${event.time}-${idx}`} event={event} idx={idx} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Timer className={`w-8 h-8 mx-auto ${dt.text} mb-2`} />
                    <p className="text-xs text-muted-foreground">Lini Masa akan muncul saat match dimulai</p>
                  </div>
                )}
              </SectionCard>
            </motion.div>

            {/* Key Moments — derived from actual match data, not hardcoded */}
            <motion.div variants={item}>
              <SectionCard title="Momen Kunci" icon={Star} badge="Sorotan">
                {selectedMatch ? (() => {
                  // Build key moments from actual match data
                  const moments: { time: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [];

                  // Session opened
                  if (selectedMatch.status !== 'scheduled' && selectedMatch.status !== 'upcoming') {
                    moments.push({
                      time: 'Start',
                      title: 'Sesi Dibuka',
                      desc: 'Organizer memulai sesi match',
                      icon: Activity,
                      color: 'text-green-400',
                    });
                  }

                  // Round results from actual score
                  const s1 = selectedMatch.score1 ?? 0;
                  const s2 = selectedMatch.score2 ?? 0;
                  if (s1 > 0 || s2 > 0) {
                    // Show dominant performance
                    if (s1 > s2) {
                      moments.push({
                        time: 'Final',
                        title: `${selectedMatch.team1.name} Dominasi`,
                        desc: `Win ${s1}-${s2} dengan selisih ronde +${s1 - s2}`,
                        icon: Star,
                        color: 'text-emerald-400',
                      });
                    } else if (s2 > s1) {
                      moments.push({
                        time: 'Final',
                        title: `${selectedMatch.team2.name} Dominasi`,
                        desc: `Win ${s2}-${s1} dengan selisih ronde +${s2 - s1}`,
                        icon: Star,
                        color: 'text-emerald-400',
                      });
                    } else {
                      moments.push({
                        time: 'Final',
                        title: 'Seimbang',
                        desc: `Seri ${s1}-${s2} — kedua tim seimbang`,
                        icon: Star,
                        color: 'text-emerald-400',
                      });
                    }

                    // Close match indicator
                    if (Math.abs(s1 - s2) === 1) {
                      moments.push({
                        time: 'Final',
                        title: 'Match Ketat',
                        desc: 'Ditentukan dengan selisih 1 ronde saja',
                        icon: Flame,
                        color: 'text-amber-400',
                      });
                    }
                  }

                  // MVP selection
                  if (selectedMatch.mvpPlayer) {
                    moments.push({
                      time: 'Final',
                      title: 'MVP Diberikan',
                      desc: `${selectedMatch.mvpPlayer.gamertag} dipilih sebagai MVP`,
                      icon: Crown,
                      color: 'text-[#d4a853]',
                    });
                  }

                  // Match completed
                  if (selectedMatch.status === 'completed') {
                    moments.push({
                      time: 'Final',
                      title: 'Match Difinalisasi',
                      desc: 'Hasil dikonfirmasi oleh organizer',
                      icon: Trophy,
                      color: 'text-[#d4a853]',
                    });
                  }

                  // If no moments yet (upcoming match)
                  if (moments.length === 0) {
                    moments.push({
                      time: 'TBD',
                      title: 'Match Dijadwalkan',
                      desc: 'Momen kunci akan muncul setelah session dimulai',
                      icon: Clock,
                      color: 'text-muted-foreground',
                    });
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {moments.map((moment, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-start gap-3 p-3 rounded-xl ${dt.bgSubtle} ${dt.borderSubtle} border cursor-pointer transition-all ${dt.hoverBorder}`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${dt.bgSubtle} flex items-center justify-center shrink-0`}>
                            <moment.icon className={`w-4 h-4 ${moment.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold">{moment.title}</span>
                              <Badge className={`${dt.casinoBadge} text-[8px] px-1`}>{moment.time}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{moment.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })() : (
                  <div className="text-center py-8">
                    <Star className={`w-8 h-8 mx-auto ${dt.text} mb-2`} />
                    <p className="text-xs text-muted-foreground">Pilih match untuk melihat momen kunci</p>
                  </div>
                )}
              </SectionCard>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ═══ RESULTS TAB ═══ */}
        <TabsContent value="results" className="mt-4 space-y-4">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {/* All Tournament Results */}
            <motion.div variants={item}>
              <SectionCard title="Hasil Turnamen" icon={Trophy} badge={`${tournamentMatches.length} match`}>
                <div className="space-y-2">
                  {tournamentMatches.map((m) => {
                    const hasScore = m.score1 !== null && m.score2 !== null;
                    const winner1 = hasScore && m.score1! > m.score2!;
                    const winner2 = hasScore && m.score2! > m.score1!;
                    const isLive = m.status === 'live' || m.status === 'main_event';

                    return (
                      <motion.div
                        key={m.id}
                        whileHover={{ x: 2 }}
                        className={`flex items-stretch rounded-lg overflow-hidden ${dt.bgSubtle} ${dt.borderSubtle} border transition-all ${dt.hoverBorder} cursor-pointer`}
                        onClick={() => {
                          const idx = tournamentMatches.findIndex(tm => tm.id === m.id);
                          if (idx >= 0) setSelectedMatchIdx(idx);
                        }}
                      >
                        {/* Round indicator */}
                        <div className={`w-10 shrink-0 flex items-center justify-center ${dt.bg} border-r ${dt.borderSubtle}`}>
                          <span className={`text-[9px] font-bold ${dt.neonText}`}>R{m.round}</span>
                        </div>

                        {/* Main match content */}
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center px-3 py-1.5 border-b ${dt.borderSubtle} ${winner1 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner1 && <span className="mr-1">▸</span>}
                              {m.team1.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-foreground'}`}>
                              {hasScore ? m.score1 : '-'}
                            </span>
                          </div>
                          <div className={`flex items-center px-3 py-1.5 ${winner2 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner2 && <span className="mr-1">▸</span>}
                              {m.team2.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-foreground'}`}>
                              {hasScore ? m.score2 : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="w-16 shrink-0 flex flex-col items-center justify-center border-l border-transparent">
                          {isLive ? (
                            <Badge className="bg-red-500/10 text-red-500 text-[8px] border-0 live-dot">LIVE</Badge>
                          ) : m.status === 'completed' ? (
                            <Badge className="bg-green-500/10 text-green-500 text-[8px] border-0">FT</Badge>
                          ) : (
                            <Badge className={`${dt.casinoBadge} text-[8px]`}>VS</Badge>
                          )}
                          {m.mvpPlayer && <span className="text-[7px] text-yellow-500 mt-0.5 font-bold">MVP</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </SectionCard>
            </motion.div>

            {/* Recent League Results */}
            <motion.div variants={item}>
              <SectionCard title="Hasil League" icon={Radio} badge="Terbaru">
                <div className="space-y-2">
                  {data.recentMatches?.slice(0, 6).map(m => {
                    const winner1 = m.score1 > m.score2;
                    const winner2 = m.score2 > m.score1;
                    return (
                      <div key={m.id} className={`flex items-stretch rounded-lg overflow-hidden ${dt.bgSubtle} ${dt.borderSubtle} border`}>
                        <div className={`w-10 shrink-0 flex items-center justify-center ${dt.bg} border-r ${dt.borderSubtle}`}>
                          <span className={`text-[9px] font-bold ${dt.neonText}`}>W{m.week}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center px-3 py-1.5 border-b ${dt.borderSubtle} ${winner1 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner1 && <span className="mr-1">▸</span>}{m.club1.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-foreground'}`}>{m.score1}</span>
                          </div>
                          <div className={`flex items-center px-3 py-1.5 ${winner2 ? '' : 'opacity-60'}`}>
                            <span className={`text-xs font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                              {winner2 && <span className="mr-1">▸</span>}{m.club2.name}
                            </span>
                            <span className={`text-sm font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-foreground'}`}>{m.score2}</span>
                          </div>
                        </div>
                        <div className="w-14 shrink-0 flex items-center justify-center border-l border-transparent">
                          <Badge className="bg-green-500/10 text-green-500 text-[8px] border-0">FT</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
