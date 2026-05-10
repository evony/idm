'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { Crown, Music, Trophy } from 'lucide-react';

/* ─── Match interface ─── */
interface Match {
  id: string;
  score1: number | null;
  score2: number | null;
  status: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  mvpPlayer: { id: string; name: string; gamertag: string } | null;
  round?: number;
}

interface BracketViewProps {
  matches: Match[];
  bracketType: 'single_elimination' | 'double_elimination' | 'group_stage' | 'round_robin';
}

/* ─── Round labels ─── */
function getRoundLabel(roundIdx: number, totalRounds: number): string {
  if (totalRounds <= 2) {
    return roundIdx === 0 ? 'Semi Final' : 'Final';
  }
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return 'Grand Final';
  if (fromEnd === 1) return 'Semi Final';
  if (fromEnd === 2) return 'Quarter Final';
  return `Ronde ${roundIdx + 1}`;
}

/* ─── Single bracket match card — MPL style ─── */
function BracketMatchCard({ match }: { match: Match }) {
  const dt = useDivisionTheme();
  const hasScore = match.score1 !== null && match.score2 !== null;
  const winner1 = hasScore && match.score1! > match.score2!;
  const winner2 = hasScore && match.score2! > match.score1!;
  const isLive = match.status === 'live' || match.status === 'main_event';
  const isCompleted = match.status === 'completed' || match.status === 'scoring';

  return (
    <div
      className={`bracket-match-card rounded-lg overflow-hidden ${
        isLive ? `border-2 border-red-500/60 ${dt.neonPulse}` :
        isCompleted ? `border ${dt.border}` :
        `border ${dt.borderSubtle}`
      } transition-all hover:shadow-lg`}
      style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
    >
      {/* Team 1 */}
      <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''}`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold mr-2 shrink-0 ${
          winner1 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
          `${dt.iconBg} ${dt.text}`
        }`}>
          {match.team1.name.slice(0, 2).toUpperCase()}
        </div>
        <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-foreground/80'}`}>
          {match.team1.name || 'TBD'}
        </span>
        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
          {hasScore ? match.score1 : '-'}
        </span>
      </div>
      {/* Team 2 */}
      <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''}`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold mr-2 shrink-0 ${
          winner2 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
          `${dt.iconBg} ${dt.text}`
        }`}>
          {match.team2.name.slice(0, 2).toUpperCase()}
        </div>
        <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-foreground/80'}`}>
          {match.team2.name || 'TBD'}
        </span>
        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
          {hasScore ? match.score2 : '-'}
        </span>
      </div>
      {/* MVP indicator */}
      {match.mvpPlayer && (
        <div className={`flex items-center gap-1 px-3 py-1 border-t ${dt.borderSubtle}`}>
          <Crown className="w-2.5 h-2.5 text-yellow-500" />
          <span className="text-[9px] text-yellow-500 font-medium truncate">MVP: {match.mvpPlayer.gamertag}</span>
        </div>
      )}
    </div>
  );
}

/* ─── SVG Connector Lines Component — MPL Style ─── */
interface ConnectorPath {
  key: string;
  d: string;
  color: string;
  isWinner?: boolean;
}

function BracketConnectors({ paths }: { paths: ConnectorPath[] }) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      {paths.map((p) => (
        <g key={p.key}>
          {/* Glow layer */}
          <path
            d={p.d}
            stroke={p.color}
            strokeWidth="3"
            fill="none"
            opacity="0.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main line */}
          <path
            d={p.d}
            stroke={p.color}
            strokeWidth="1.5"
            fill="none"
            opacity={p.isWinner ? "0.7" : "0.4"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  );
}

/* ─── Group Stage Table ─── */
function GroupStageView({ matches, roundsData }: { matches: Match[]; roundsData: { round: number; label: string; matches: Match[] }[] }) {
  const dt = useDivisionTheme();

  // Extract unique teams and build standings
  const teamStats = useMemo(() => {
    const teams = new Map<string, { name: string; wins: number; losses: number; points: number; gamesWon: number; gamesLost: number }>();
    matches.forEach(m => {
      const hasScore = m.score1 !== null && m.score2 !== null;
      if (!teams.has(m.team1.name)) teams.set(m.team1.name, { name: m.team1.name, wins: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0 });
      if (!teams.has(m.team2.name)) teams.set(m.team2.name, { name: m.team2.name, wins: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0 });
      if (hasScore) {
        const t1 = teams.get(m.team1.name)!;
        const t2 = teams.get(m.team2.name)!;
        t1.gamesWon += m.score1!; t1.gamesLost += m.score2!;
        t2.gamesWon += m.score2!; t2.gamesLost += m.score1!;
        if (m.score1! > m.score2!) { t1.wins++; t1.points += 3; t2.losses++; }
        else if (m.score2! > m.score1!) { t2.wins++; t2.points += 3; t1.losses++; }
        else { t1.points++; t2.points++; }
      }
    });
    return Array.from(teams.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);
  }, [matches]);

  return (
    <div className="space-y-5">
      {/* Group Standings Table */}
      <div className={`rounded-xl overflow-hidden border ${dt.border}`}>
        <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${dt.borderSubtle}`}>
          <Trophy className={`w-4 h-4 ${dt.neonText}`} />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Klasemen Grup</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${dt.borderSubtle} bg-muted/20`}>
                <th className="w-8 text-center py-2 font-semibold">#</th>
                <th className="text-left py-2 px-3 font-semibold">Tim</th>
                <th className="w-12 text-center py-2 font-semibold">W</th>
                <th className="w-12 text-center py-2 font-semibold">L</th>
                <th className="w-16 text-center py-2 font-semibold">GW</th>
                <th className="w-16 text-center py-2 font-semibold">GL</th>
                <th className="w-14 text-center py-2 font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {teamStats.map((t, i) => (
                <tr key={t.name} className={`border-b ${dt.borderSubtle} ${i < 2 ? dt.bgSubtle : ''} ${dt.hoverBgSubtle} transition-colors`}>
                  <td className="text-center py-2">
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      i === 1 ? 'bg-green-500/20 text-green-500' :
                      'text-muted-foreground'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold ${
                        i < 2 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
                        `${dt.iconBg} ${dt.text}`
                      }`}>{t.name.slice(0, 2).toUpperCase()}</div>
                      <span className={`font-semibold truncate ${i < 2 ? dt.neonText : ''}`}>{t.name}</span>
                    </div>
                  </td>
                  <td className="text-center font-semibold text-green-500">{t.wins}</td>
                  <td className="text-center font-semibold text-red-500">{t.losses}</td>
                  <td className="text-center text-muted-foreground">{t.gamesWon}</td>
                  <td className="text-center text-muted-foreground">{t.gamesLost}</td>
                  <td className="text-center font-bold">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Schedule by Round */}
      {roundsData.map((round) => (
        <div key={round.round}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-3 py-1.5 rounded-lg ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider`}>
              {round.label}
            </div>
            <div className={`flex-1 h-px ${dt.borderSubtle}`} />
            <span className="text-[10px] text-muted-foreground">{round.matches.length} pertandingan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {round.matches.map((m) => {
              const hasScore = m.score1 !== null && m.score2 !== null;
              const winner1 = hasScore && m.score1! > m.score2!;
              const winner2 = hasScore && m.score2! > m.score1!;
              const isLive = m.status === 'live' || m.status === 'main_event';
              return (
                <motion.div
                  key={m.id}
                  whileHover={{ scale: 1.01 }}
                  className={`rounded-lg overflow-hidden border ${isLive ? `border-red-500/30 ${dt.neonPulse}` : dt.borderSubtle} transition-all ${dt.hoverBorder}`}
                  style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
                >
                  <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : 'text-foreground/80'}`}>
                      {m.team1.name || 'TBD'}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                      {hasScore ? m.score1 : '-'}
                    </span>
                  </div>
                  <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : 'text-foreground/80'}`}>
                      {m.team2.name || 'TBD'}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                      {hasScore ? m.score2 : '-'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main BracketView Component ─── */
export function BracketView({ matches, bracketType }: BracketViewProps) {
  const dt = useDivisionTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectors, setConnectors] = useState<ConnectorPath[]>([]);
  const [activeType, setActiveType] = useState(bracketType);

  /* Group matches by round — auto-split if all in one round */
  const roundsData = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    const grouped = matches.reduce<Record<number, Match[]>>((acc, m) => {
      const round = m.round ?? 1;
      if (!acc[round]) acc[round] = [];
      acc[round].push(m);
      return acc;
    }, {});

    // If all matches are in a single round, auto-split into bracket rounds
    if (Object.keys(grouped).length === 1 && bracketType !== 'group_stage' && bracketType !== 'round_robin') {
      const allMatches = Object.values(grouped)[0];
      const totalMatches = allMatches.length;

      const rounds: { round: number; label: string; matches: Match[] }[] = [];
      let remaining = [...allMatches];
      let roundNum = 1;
      let matchesInRound = Math.pow(2, Math.floor(Math.log2(totalMatches)));

      if (matchesInRound < totalMatches) {
        matchesInRound = totalMatches - matchesInRound / 2;
      }

      while (remaining.length > 0) {
        const roundMatches = remaining.splice(0, Math.max(1, matchesInRound));
        rounds.push({
          round: roundNum,
          label: getRoundLabel(roundNum - 1, Math.ceil(Math.log2(totalMatches + 1))),
          matches: roundMatches.map((m) => ({ ...m, round: roundNum })),
        });
        matchesInRound = Math.max(1, Math.floor(matchesInRound / 2));
        roundNum++;
      }

      return rounds;
    }

    const sortedRounds = Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, roundMatches], idx) => ({
        round: idx + 1,
        label: getRoundLabel(idx, Object.keys(grouped).length),
        matches: roundMatches,
      }));

    return sortedRounds;
  }, [matches, bracketType]);

  /* Calculate SVG connector paths after layout — MPL Style */
  const calculateConnectors = useCallback(() => {
    if (!containerRef.current || roundsData.length < 2) {
      setConnectors([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const newConnectors: ConnectorPath[] = [];
    const strokeColor = dt.color;

    for (let r = 0; r < roundsData.length - 1; r++) {
      const currentRound = roundsData[r];
      const nextRound = roundsData[r + 1];

      for (let ni = 0; ni < nextRound.matches.length; ni++) {
        const nextMatch = nextRound.matches[ni];
        const nextCardEl = cardRefs.current.get(`round-${r + 1}-match-${nextMatch.id}`);
        if (!nextCardEl) continue;

        const nextRect = nextCardEl.getBoundingClientRect();
        const nextY = nextRect.top + nextRect.height / 2 - containerRect.top;
        const nextX = nextRect.left - containerRect.left;

        // Find the two feeder matches from the current round
        const feederIdx1 = ni * 2;
        const feederIdx2 = ni * 2 + 1;
        const feederMatch1 = currentRound.matches[feederIdx1];
        const feederMatch2 = currentRound.matches[feederIdx2];

        if (!feederMatch1 && !feederMatch2) continue;

        const feederEl1 = feederMatch1 ? cardRefs.current.get(`round-${r}-match-${feederMatch1.id}`) : null;
        const feederEl2 = feederMatch2 ? cardRefs.current.get(`round-${r}-match-${feederMatch2.id}`) : null;

        if (!feederEl1 && !feederEl2) continue;

        const getCenter = (el: HTMLDivElement | null | undefined) => {
          if (!el) return { x: nextX, y: nextY };
          const rect = el.getBoundingClientRect();
          return {
            x: rect.right - containerRect.left,
            y: rect.top + rect.height / 2 - containerRect.top,
          };
        };

        const p1 = getCenter(feederEl1);
        const p2 = getCenter(feederEl2);

        // Midpoint X between feeder and next match
        const midX = nextX - (nextX - Math.max(p1.x, p2.x)) / 2;

        // MPL-style bracket connectors:
        // Horizontal from feeder right edge → midX, then vertical to merge, then horizontal to next match left edge
        
        // Check if feeder1 is winner to highlight path
        const f1Winner = feederMatch1 && feederMatch1.score1 !== null && feederMatch1.score2 !== null &&
          ((feederMatch1.score1! > feederMatch1.score2!) || (feederMatch1.score2! > feederMatch1.score1!));
        const f2Winner = feederMatch2 && feederMatch2.score1 !== null && feederMatch2.score2 !== null &&
          ((feederMatch2.score1! > feederMatch2.score2!) || (feederMatch2.score2! > feederMatch2.score1!));

        // Feeder 1 → midX → merge point → next match
        if (feederEl1) {
          const d1 = `M ${p1.x} ${p1.y} H ${midX} V ${nextY} H ${nextX}`;
          newConnectors.push({
            key: `conn-${r}-${ni}-1`,
            d: d1,
            color: strokeColor,
            isWinner: f1Winner,
          });
        }

        // Feeder 2 → midX (just the horizontal arm to the vertical line)
        if (feederEl2 && feederEl1) {
          const d2 = `M ${p2.x} ${p2.y} H ${midX}`;
          newConnectors.push({
            key: `conn-${r}-${ni}-2`,
            d: d2,
            color: strokeColor,
            isWinner: f2Winner,
          });
        } else if (feederEl2 && !feederEl1) {
          const d2 = `M ${p2.x} ${p2.y} H ${midX} V ${nextY} H ${nextX}`;
          newConnectors.push({
            key: `conn-${r}-${ni}-2`,
            d: d2,
            color: strokeColor,
            isWinner: f2Winner,
          });
        }

        // Small circle at junction point (MPL style)
        newConnectors.push({
          key: `conn-${r}-${ni}-dot`,
          d: `M ${midX - 2} ${nextY} h 4`,
          color: strokeColor,
          isWinner: true,
        });
      }
    }

    setConnectors(newConnectors);
  }, [roundsData, dt.color]);

  useEffect(() => {
    const attempts = [50, 200, 500, 1000];
    const timers = attempts.map(delay => setTimeout(calculateConnectors, delay));
    const handleResize = () => calculateConnectors();
    window.addEventListener('resize', handleResize);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateConnectors]);

  /* Set card ref helper */
  const setCardRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(key, el);
    } else {
      cardRefs.current.delete(key);
    }
  }, []);

  /* ─── Render: Group Stage ─── */
  if (bracketType === 'group_stage') {
    return (
      <div>
        <GroupStageView matches={matches} roundsData={roundsData} />
      </div>
    );
  }

  /* ─── Render: Round Robin ─── */
  if (bracketType === 'round_robin') {
    // Round Robin shows all matches organized by round with a standings table
    return (
      <div className="space-y-5">
        {/* Standings Table */}
        <GroupStageView matches={matches} roundsData={roundsData} />
      </div>
    );
  }

  /* ─── Render: Single/Double Elimination Bracket with SVG Connectors ─── */
  return (
    <div>
      <div className="relative" ref={containerRef}>
        {/* SVG connector overlay */}
        {connectors.length > 0 && <BracketConnectors paths={connectors} />}

        {/* Bracket columns — MPL horizontal layout */}
        <div className="overflow-x-auto custom-scrollbar pb-2 -mx-1">
          <div className="flex gap-10 min-w-max px-1">
            {roundsData.map((round, roundIdx) => {
              // Calculate vertical spacing for proper bracket alignment
              const gapMultiplier = Math.pow(2, roundIdx);

              return (
                <div key={round.round} className="flex flex-col" style={{ minWidth: '200px' }}>
                  {/* Round label — MPL pill style */}
                  <div className="text-center mb-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider`}>
                      {roundIdx === roundsData.length - 1 && <span>🏆</span>}
                      {round.label}
                    </div>
                  </div>
                  {/* Match cards with proper spacing */}
                  <div className="flex-1 flex flex-col justify-around" style={{ gap: `${gapMultiplier * 24 + 16}px` }}>
                    {round.matches.map((m) => (
                      <div
                        key={m.id}
                        ref={(el) => setCardRef(`round-${roundIdx}-match-${m.id}`, el)}
                      >
                        <BracketMatchCard match={m} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Double Elimination: Elimination Bracket */}
      {activeType === 'double_elimination' && roundsData.length > 1 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider`}>
              Elimination Bracket
            </div>
            <div className={`flex-1 h-px ${dt.borderSubtle}`} />
          </div>
          <div className={`p-4 rounded-xl border ${dt.borderSubtle} ${dt.bgSubtle}`}>
            <p className="text-xs text-muted-foreground text-center">
              Pertandingan bracket kalahan akan muncul di sini saat tim tereliminasi dari bracket pemenang.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
