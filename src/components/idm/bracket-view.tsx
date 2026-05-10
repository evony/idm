'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { Crown, Music, Trophy, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Match interface ─── */
interface Match {
  id: string;
  score1: number | null;
  score2: number | null;
  status: string;
  team1: { id: string; name: string } | null;
  team2: { id: string; name: string } | null;
  mvpPlayer: { id: string; name: string; gamertag: string } | null;
  round?: number;
  matchNumber?: number;
  bracket?: string;
  groupLabel?: string;
}

/** Parse groupLabel (e.g., "U1-2", "U2-1", "SF1", "Final") to get bracket position.
 *  Position is 1-indexed within the round, used for determining feeder relationships. */
function getBracketPosition(groupLabel: string | undefined): number {
  if (!groupLabel) return 0;
  // Format: "U{round}-{position}" e.g., "U1-2" → position 2
  const match = groupLabel.match(/-(\d+)$/);
  if (match) return parseInt(match[1]);
  // Named labels: map to standard positions
  const namedPositions: Record<string, number> = {
    'QF1': 1, 'QF2': 2, 'QF3': 3, 'QF4': 4,
    'SF1': 1, 'SF2': 2,
    'Final': 1, '3rd': 2,
  };
  return namedPositions[groupLabel] || 0;
}

interface BracketViewProps {
  matches: Match[];
  bracketType: 'single_elimination' | 'group_stage' | 'round_robin' | 'swiss';
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
  // A "bye match" is when exactly one team is present (they got a walkover).
  // In this bracket system, R1 bye matches are NOT created — bye teams go directly to R2+.
  // So a null team in any match always means "waiting for a winner" → TBD, not BYE.
  // However, we still mark single-team matches for the BYE badge indicator.
  const isByeMatch = (!match.team1 || !match.team2) && (match.team1 || match.team2) && !isCompleted;

  // Helper to get team display name: always TBD for null teams
  // (In this bracket system, null teams are always "waiting for winner", never a true bye)
  const getTeamLabel = (team: { id: string; name: string } | null) => {
    if (team) return team.name;
    return 'TBD';
  };

  // Helper to get team score display
  const getTeamScore = (team: { id: string; name: string } | null, score: number | null) => {
    if (!team) {
      if (match.status === 'pending' || match.status === 'ready') return '-';
      return hasScore ? score : '-';
    }
    if (hasScore) return score;
    return '-';
  };

  return (
    <div
      className={`bracket-match-card rounded-lg overflow-hidden ${
        isLive ? `border-2 border-red-500/60 ${dt.neonPulse}` :
        isCompleted ? `border ${dt.border}` :
        `border ${dt.borderSubtle}`
      } transition-all hover:shadow-lg relative`}
      style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
    >
      {/* BYE/WALKOVER badge — shows when one team got a bye to this round */}
      {isByeMatch && (
        <div className="absolute top-0.5 right-1 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded z-10">
          WALKOVER
        </div>
      )}
      {/* Team 1 */}
      <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!match.team1 ? 'opacity-50' : ''}`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold mr-2 shrink-0 ${
          winner1 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
          `${dt.iconBg} ${dt.text}`
        }`}>
          {getTeamLabel(match.team1).slice(0, 2).toUpperCase()}
        </div>
        <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !match.team1 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
          {getTeamLabel(match.team1)}
        </span>
        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
          {getTeamScore(match.team1, match.score1)}
        </span>
      </div>
      {/* Team 2 */}
      <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!match.team2 ? 'opacity-50' : ''}`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold mr-2 shrink-0 ${
          winner2 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
          `${dt.iconBg} ${dt.text}`
        }`}>
          {getTeamLabel(match.team2).slice(0, 2).toUpperCase()}
        </div>
        <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !match.team2 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
          {getTeamLabel(match.team2)}
        </span>
        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
          {getTeamScore(match.team2, match.score2)}
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
      {paths.map((p) => {
        const isDot = p.key.endsWith('-dot');
        const isRail = p.key.endsWith('-rail');
        const isArm = p.key.endsWith('-arm1') || p.key.endsWith('-arm2');

        if (isDot) {
          // Junction dot — small filled circle
          const match = p.d.match(/M ([\d.]+) ([\d.]+) h ([\d.]+)/);
          if (match) {
            const cx = parseFloat(match[1]) + parseFloat(match[3]) / 2;
            const cy = parseFloat(match[2]);
            return (
              <circle
                key={p.key}
                cx={cx}
                cy={cy}
                r="3"
                fill={p.color}
                opacity="0.6"
              />
            );
          }
        }

        return (
          <g key={p.key}>
            {/* Glow layer — thicker, faded */}
            <path
              d={p.d}
              stroke={p.color}
              strokeWidth={isArm ? "4" : isRail ? "4" : "4"}
              fill="none"
              opacity="0.12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main line */}
            <path
              d={p.d}
              stroke={p.color}
              strokeWidth={isArm ? "1.5" : isRail ? "1.5" : "1.5"}
              fill="none"
              opacity={p.isWinner ? "0.6" : "0.35"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Zoomable Container — Touch pinch-zoom + drag-pan for mobile ─── */
function ZoomableContainer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Use refs for transform state to avoid re-renders during active gestures
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const [displayState, setDisplayState] = useState({ scale: 1, tx: 0, ty: 0, isAnimating: false });
  const [isInteracting, setIsInteracting] = useState(false);
  const [isMouseDragging, setIsMouseDragging] = useState(false);

  const isDragging = useRef(false);
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const mouseDragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const rafId = useRef<number>(0);

  // Double-tap detection
  const lastTapTime = useRef(0);
  const lastTapPos = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  /* Flush transform from refs to the DOM via rAF */
  const flushTransform = useCallback((animate = false) => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setDisplayState({
        scale: scaleRef.current,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
        isAnimating: animate,
      });
    });
  }, []);

  const handleZoom = useCallback((newScale: number) => {
    scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    flushTransform(true);
  }, [flushTransform]);

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    flushTransform(true);
    setIsInteracting(false);
  }, [flushTransform]);

  /* Double-tap to reset zoom */
  const handleDoubleTap = useCallback((x: number, y: number) => {
    const now = Date.now();
    const dt = now - lastTapTime.current;
    const dx = x - lastTapPos.current.x;
    const dy = y - lastTapPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dt < 300 && dist < 30) {
      // Double-tap detected — reset zoom
      resetZoom();
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
      lastTapPos.current = { x, y };
    }
  }, [resetZoom]);

  /* Touch: pinch-to-zoom + drag-to-pan */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      isDragging.current = false;
      setIsInteracting(true);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      // Check for double-tap
      handleDoubleTap(touch.clientX, touch.clientY);

      if (scaleRef.current > 1) {
        // Pan start (only when zoomed in)
        isDragging.current = true;
        dragStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          tx: translateRef.current.x,
          ty: translateRef.current.y,
        };
      }
    }
  }, [handleDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastTouchDist.current > 0) {
        const delta = dist / lastTouchDist.current;
        scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * delta));
      }
      lastTouchDist.current = dist;

      // Pan while pinching
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      translateRef.current = {
        x: translateRef.current.x + (center.x - lastTouchCenter.current.x),
        y: translateRef.current.y + (center.y - lastTouchCenter.current.y),
      };
      lastTouchCenter.current = center;
      flushTransform(false);
    } else if (e.touches.length === 1 && isDragging.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      translateRef.current = {
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      };
      flushTransform(false);
    }
  }, [flushTransform]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = 0;
    isDragging.current = false;
    if (scaleRef.current <= 1) {
      setIsInteracting(false);
    }
  }, []);

  /* Mouse drag-to-pan for desktop (when zoomed in) */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scaleRef.current > 1 && e.button === 0) {
      e.preventDefault();
      mouseDragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
      };
      setIsInteracting(true);
      setIsMouseDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mouseDragStart.current) {
      const dx = e.clientX - mouseDragStart.current.x;
      const dy = e.clientY - mouseDragStart.current.y;
      translateRef.current = {
        x: mouseDragStart.current.tx + dx,
        y: mouseDragStart.current.ty + dy,
      };
      flushTransform(false);
    }
  }, [flushTransform]);

  const handleMouseUp = useCallback(() => {
    mouseDragStart.current = null;
    setIsMouseDragging(false);
    if (scaleRef.current <= 1) {
      setIsInteracting(false);
    }
  }, []);

  /* Wheel zoom for desktop trackpad */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * delta));
      flushTransform(true);
    }
  }, [flushTransform]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const cursorStyle = displayState.scale > 1
    ? (isMouseDragging ? 'grabbing' : 'grab')
    : 'default';

  return (
    <div className="relative">
      {/* Zoom controls — mobile only, positioned top area */}
      <div className="lg:hidden flex items-center gap-1.5 mb-2 px-1">
        <button
          onClick={() => handleZoom(displayState.scale - 0.25)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-background/90 hover:bg-muted border border-border/60 shadow-sm transition-colors active:scale-95"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-foreground" />
        </button>
        <div className="px-2.5 py-1 rounded-md bg-background/90 border border-border/60 text-[10px] font-semibold tabular-nums min-w-[3.2rem] text-center shadow-sm">
          {Math.round(displayState.scale * 100)}%
        </div>
        <button
          onClick={() => handleZoom(displayState.scale + 0.25)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-background/90 hover:bg-muted border border-border/60 shadow-sm transition-colors active:scale-95"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={resetZoom}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-background/90 hover:bg-muted border border-border/60 shadow-sm transition-colors active:scale-95"
          aria-label="Reset zoom"
        >
          <Maximize2 className="w-3.5 h-3.5 text-foreground" />
        </button>
        <span className="text-[9px] text-muted-foreground ml-2">Pinch to zoom • Drag to pan</span>
      </div>

      {/* Desktop zoom hint — shown when zoomed in */}
      {displayState.scale > 1 && (
        <div className="hidden lg:flex items-center gap-1.5 mb-2 px-1">
          <div className="px-2.5 py-1 rounded-md bg-background/90 border border-border/60 text-[10px] font-semibold tabular-nums min-w-[3.2rem] text-center shadow-sm">
            {Math.round(displayState.scale * 100)}%
          </div>
          <button
            onClick={resetZoom}
            className="flex items-center justify-center h-7 px-2 rounded-md bg-background/90 hover:bg-muted border border-border/60 text-[10px] font-medium shadow-sm transition-colors"
            aria-label="Reset zoom"
          >
            <Maximize2 className="w-3 h-3 text-foreground mr-1" />
            Reset
          </button>
          <span className="text-[9px] text-muted-foreground ml-1">Ctrl+Scroll to zoom • Drag to pan</span>
        </div>
      )}

      {/* Scrollable/pannable container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg relative touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: cursorStyle }}
      >
        <div
          ref={contentRef}
          className="origin-top-left"
          style={{
            transform: `translate(${displayState.tx}px, ${displayState.ty}px) scale(${displayState.scale})`,
            transformOrigin: '0 0',
            willChange: isInteracting ? 'transform' : 'auto',
            transition: displayState.isAnimating && !isInteracting ? 'transform 200ms ease-out' : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Group Stage Table ─── */
function GroupStageView({ matches, roundsData }: { matches: Match[]; roundsData: { round: number; label: string; matches: Match[] }[] }) {
  const dt = useDivisionTheme();

  // Separate group matches from playoff matches
  const groupMatches = useMemo(() => matches.filter(m => (m as Match & { bracket?: string }).bracket === 'group'), [matches]);
  const playoffMatches = useMemo(() => matches.filter(m => (m as Match & { bracket?: string }).bracket !== 'group'), [matches]);

  // Group group-matches by groupLabel
  const groupsByLabel = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    groupMatches.forEach(m => {
      const label = (m as Match & { groupLabel?: string }).groupLabel || 'A';
      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    });
    return groups;
  }, [groupMatches]);

  // Build standings per group
  const standingsByGroup = useMemo(() => {
    const result: Record<string, { name: string; wins: number; draws: number; losses: number; points: number; gamesWon: number; gamesLost: number }[]> = {};
    for (const [label, gMatches] of Object.entries(groupsByLabel)) {
      const teams = new Map<string, { name: string; wins: number; draws: number; losses: number; points: number; gamesWon: number; gamesLost: number }>();
      gMatches.forEach(m => {
        const hasScore = m.score1 !== null && m.score2 !== null;
        if (!teams.has((m.team1?.name || 'TBD'))) teams.set((m.team1?.name || 'TBD'), { name: (m.team1?.name || 'TBD'), wins: 0, draws: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0 });
        if (!teams.has((m.team2?.name || 'TBD'))) teams.set((m.team2?.name || 'TBD'), { name: (m.team2?.name || 'TBD'), wins: 0, draws: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0 });
        if (hasScore) {
          const t1 = teams.get((m.team1?.name || 'TBD'))!;
          const t2 = teams.get((m.team2?.name || 'TBD'))!;
          t1.gamesWon += m.score1!; t1.gamesLost += m.score2!;
          t2.gamesWon += m.score2!; t2.gamesLost += m.score1!;
          if (m.score1! > m.score2!) { t1.wins++; t1.points += 3; t2.losses++; }
          else if (m.score2! > m.score1!) { t2.wins++; t2.points += 3; t1.losses++; }
          else { t1.draws++; t2.draws++; t1.points++; t2.points++; }
        }
      });
      result[label] = Array.from(teams.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);
    }
    return result;
  }, [groupsByLabel]);

  return (
    <div className="space-y-5">
      {/* Group Standings Tables */}
      {Object.entries(standingsByGroup).map(([label, teamStats]) => (
        <div key={label} className={`rounded-2xl overflow-hidden border ${dt.border}`}>
          <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${dt.borderSubtle}`}>
            <Trophy className={`w-4 h-4 ${dt.neonText}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Grup {label}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${dt.borderSubtle} bg-muted/20`}>
                  <th className="w-8 text-center py-2 font-semibold">#</th>
                  <th className="text-left py-2 px-3 font-semibold">Tim</th>
                  <th className="w-10 text-center py-2 font-semibold">W</th>
                  <th className="w-10 text-center py-2 font-semibold">D</th>
                  <th className="w-10 text-center py-2 font-semibold">L</th>
                  <th className="w-14 text-center py-2 font-semibold">GW</th>
                  <th className="w-14 text-center py-2 font-semibold">GL</th>
                  <th className="w-12 text-center py-2 font-semibold">Pts</th>
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
                    <td className="text-center font-semibold text-yellow-500">{t.draws}</td>
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
      ))}

      {/* Group Stage Match Schedule */}
      {Object.entries(groupsByLabel).map(([label, gMatches]) => (
        <div key={`matches-${label}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-3 py-1.5 rounded-lg ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider`}>
              Grup {label}
            </div>
            <div className={`flex-1 h-px ${dt.borderSubtle}`} />
            <span className="text-[10px] text-muted-foreground">{gMatches.length} pertandingan</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {gMatches.map((m) => {
              const hasScore = m.score1 !== null && m.score2 !== null;
              const winner1 = hasScore && m.score1! > m.score2!;
              const winner2 = hasScore && m.score2! > m.score1!;
              const isDraw = hasScore && m.score1 === m.score2;
              const isLive = m.status === 'live' || m.status === 'main_event';
              return (
                <div
                  key={m.id}
                  className={`hover-scale-sm rounded-lg overflow-hidden border ${isLive ? `border-red-500/30 ${dt.neonPulse}` : dt.borderSubtle} transition-all ${dt.hoverBorder} relative`}
                  style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
                >
                  {(!m.team1 || !m.team2) && (m.team1 || m.team2) && m.status !== 'completed' && (
                    <div className="absolute top-0.5 right-1 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded z-10">
                      WALKOVER
                    </div>
                  )}
                  <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!m.team1 ? 'opacity-50' : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !m.team1 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                      {m.team1?.name || 'TBD'}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : isDraw ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {m.team1 ? (hasScore ? m.score1 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score1 : '-'))}
                    </span>
                  </div>
                  <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!m.team2 ? 'opacity-50' : ''}`}>
                    <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !m.team2 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                      {m.team2?.name || 'TBD'}
                    </span>
                    <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : isDraw ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {m.team2 ? (hasScore ? m.score2 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score2 : '-'))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Playoff Matches — Bracket visual */}
      {playoffMatches.length > 0 && (() => {
        const sf1 = playoffMatches.find(m => m.groupLabel === 'SF1');
        const sf2 = playoffMatches.find(m => m.groupLabel === 'SF2');
        const grandFinal = playoffMatches.find(m => m.groupLabel === 'Final');
        const thirdPlace = playoffMatches.find(m => m.groupLabel === '3rd');
        const semiFinals = [sf1, sf2].filter(Boolean) as Match[];
        const finals = [grandFinal, thirdPlace].filter(Boolean) as Match[];

        // Helper to render playoff card
        const renderPlayoffCard = (m: Match, labelOverride?: string) => {
          const hasScore = m.score1 !== null && m.score2 !== null;
          const winner1 = hasScore && m.score1! > m.score2!;
          const winner2 = hasScore && m.score2! > m.score1!;
          const isLive = m.status === 'live' || m.status === 'main_event';
          const label = labelOverride || m.groupLabel || '';
          const isGrandFinal = label === 'Final';
          const is3rd = label === '3rd';
          const matchLabel = label === 'SF1' ? 'Semi Final 1' : label === 'SF2' ? 'Semi Final 2' : label === 'Final' ? 'Grand Final' : label === '3rd' ? '3rd Place' : label;
          const isByeMatch = (!m.team1 || !m.team2) && (m.team1 || m.team2) && m.status !== 'completed';

          return (
            <div
              key={m.id}
              className={`hover-scale-sm rounded-lg overflow-hidden border transition-all relative ${
                isLive ? `border-red-500/30 ${dt.neonPulse}` :
                isGrandFinal ? 'border-idm-gold-warm/40 shadow-[0_0_12px_rgba(212,168,83,0.15)]' :
                is3rd ? 'border-orange-500/20' :
                'border-idm-gold-warm/20'
              }`}
              style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
            >
              <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center justify-between ${
                isGrandFinal ? 'bg-idm-gold-warm/10 text-idm-gold-warm' :
                is3rd ? 'bg-orange-500/5 text-orange-400' :
                `${dt.neonText} bg-idm-gold-warm/5`
              }`}>
                <span className="flex items-center gap-1.5">
                  {isGrandFinal && <span>🏆</span>}
                  {is3rd && <span>🥉</span>}
                  {matchLabel}
                </span>
                {isByeMatch && (
                  <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">WALKOVER</span>
                )}
              </div>
              <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!m.team1 ? 'opacity-50' : ''}`}>
                <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !m.team1 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                  {m.team1?.name || 'TBD'}
                </span>
                <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                  {m.team1 ? (hasScore ? m.score1 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score1 : '-'))}
                </span>
              </div>
              <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!m.team2 ? 'opacity-50' : ''}`}>
                <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !m.team2 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                  {m.team2?.name || 'TBD'}
                </span>
                <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                  {m.team2 ? (hasScore ? m.score2 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score2 : '-'))}
                </span>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-4">
            {/* ── Semi Final Section ── */}
            {semiFinals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-3 py-1.5 rounded-lg bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] font-bold uppercase tracking-wider`}>
                    ⚔️ Semi Final
                  </div>
                  <div className={`flex-1 h-px ${dt.borderSubtle}`} />
                  <span className="text-[9px] text-muted-foreground">Pemenang lolos Grand Final</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sf1 && renderPlayoffCard(sf1, 'SF1')}
                  {sf2 && renderPlayoffCard(sf2, 'SF2')}
                </div>
              </div>
            )}

            {/* Connection visual */}
            {semiFinals.length > 0 && finals.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-1">
                <div className="flex-1 flex items-center justify-end">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-idm-gold-warm uppercase tracking-wider">🏆 Pemenang</span>
                    <div className="h-px w-8 bg-idm-gold-warm/30" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-px h-3 bg-idm-gold-warm/20" />
                  <div className="w-3 h-3 rounded-full border border-idm-gold-warm/30 bg-idm-gold-warm/5 flex items-center justify-center">
                    <Crown className="w-2 h-2 text-idm-gold-warm" />
                  </div>
                  <div className="w-px h-3 bg-orange-500/20" />
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-orange-500/20" />
                    <span className="text-[8px] font-bold text-orange-400 uppercase tracking-wider">Kalah → 🥉</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Grand Final + 3rd Place Section ── */}
            {finals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1.5 rounded-lg bg-idm-gold-warm/15 text-idm-gold-warm text-[10px] font-bold uppercase tracking-wider border border-idm-gold-warm/20">
                    🏆 Grand Final
                  </div>
                  <div className={`flex-1 h-px ${dt.borderSubtle}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {grandFinal && renderPlayoffCard(grandFinal, 'Final')}
                  {thirdPlace && renderPlayoffCard(thirdPlace, '3rd')}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

/* ─── Swiss Stage View — Premium MPL-style standings + round-by-round matches ─── */
function SwissView({ matches, roundsData }: { matches: Match[]; roundsData: { round: number; label: string; matches: Match[] }[] }) {
  const dt = useDivisionTheme();

  // Track which Swiss round sections are expanded (default: all expanded)
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set(roundsData.map(r => r.round)));

  // Separate Swiss bracket matches from playoff matches
  const swissMatches = useMemo(() => matches.filter(m => m.bracket === 'swiss'), [matches]);
  const playoffMatches = useMemo(() => matches.filter(m => m.bracket !== 'swiss'), [matches]);

  // Group Swiss matches by round
  const swissRounds = useMemo(() => {
    const grouped = new Map<number, Match[]>();
    swissMatches.forEach(m => {
      const round = m.round ?? 1;
      if (!grouped.has(round)) grouped.set(round, []);
      grouped.get(round)!.push(m);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => ({
        round,
        label: `🇨🇭 Swiss Round ${round}`,
        matches: roundMatches.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)),
      }));
  }, [swissMatches]);

  // ── Build Swiss Standings from ALL Swiss bracket matches ──
  interface SwissTeamStats {
    name: string;
    id: string;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    buchholz: number;
    gamesWon: number;
    gamesLost: number;
    opponentPoints: string[]; // track opponent team names for Buchholz calculation
  }

  const standings = useMemo(() => {
    const teams = new Map<string, SwissTeamStats>();

    // Initialize all teams first
    swissMatches.forEach(m => {
      if (m.team1) {
        const key = m.team1.name;
        if (!teams.has(key)) teams.set(key, { name: key, id: m.team1.id, wins: 0, draws: 0, losses: 0, points: 0, buchholz: 0, gamesWon: 0, gamesLost: 0, opponentPoints: [] });
      }
      if (m.team2) {
        const key = m.team2.name;
        if (!teams.has(key)) teams.set(key, { name: key, id: m.team2.id, wins: 0, draws: 0, losses: 0, points: 0, buchholz: 0, gamesWon: 0, gamesLost: 0, opponentPoints: [] });
      }
    });

    // Process scored matches
    swissMatches.forEach(m => {
      const hasScore = m.score1 !== null && m.score2 !== null;
      if (!hasScore || !m.team1 || !m.team2) return;

      const t1 = teams.get(m.team1.name)!;
      const t2 = teams.get(m.team2.name)!;

      // Games won/lost
      t1.gamesWon += m.score1!; t1.gamesLost += m.score2!;
      t2.gamesWon += m.score2!; t2.gamesLost += m.score1!;

      // Win/Draw/Loss + Points
      if (m.score1! > m.score2!) {
        t1.wins++; t1.points += 3; t2.losses++;
      } else if (m.score2! > m.score1!) {
        t2.wins++; t2.points += 3; t1.losses++;
      } else {
        t1.draws++; t2.draws++; t1.points++; t2.points++;
      }

      // Track opponent names for Buchholz
      t1.opponentPoints.push(m.team2.name);
      t2.opponentPoints.push(m.team1.name);
    });

    // Calculate Buchholz (sum of all opponents' points)
    teams.forEach(team => {
      let buchholz = 0;
      team.opponentPoints.forEach(oppName => {
        const opp = teams.get(oppName);
        if (opp) buchholz += opp.points;
      });
      team.buchholz = buchholz;
    });

    // Sort: Points DESC → Buchholz DESC → Games Won DESC
    return Array.from(teams.values()).sort((a, b) =>
      b.points - a.points ||
      b.buchholz - a.buchholz ||
      b.gamesWon - a.gamesWon
    );
  }, [swissMatches]);

  // Toggle round expansion
  const toggleRound = (round: number) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Swiss Standings Table (MAIN visual element) ── */}
      <div className={`rounded-2xl overflow-hidden border ${dt.border}`}>
        {/* Header */}
        <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${dt.borderSubtle}`}>
          <Trophy className={`w-4 h-4 ${dt.neonText}`} />
          <h3 className="text-xs font-semibold uppercase tracking-wider">🇨🇭 Swiss Standings</h3>
          <span className="text-[9px] text-muted-foreground ml-auto">Top 4 qualify for playoff</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${dt.borderSubtle} bg-muted/20`}>
                <th className="w-8 text-center py-2 font-semibold">#</th>
                <th className="text-left py-2 px-3 font-semibold">Tim</th>
                <th className="w-10 text-center py-2 font-semibold">W</th>
                <th className="w-10 text-center py-2 font-semibold">D</th>
                <th className="w-10 text-center py-2 font-semibold">L</th>
                <th className="w-12 text-center py-2 font-semibold">Pts</th>
                <th className="w-14 text-center py-2 font-semibold hidden sm:table-cell">BH</th>
                <th className="w-14 text-center py-2 font-semibold hidden md:table-cell">GW</th>
                <th className="w-14 text-center py-2 font-semibold hidden md:table-cell">GL</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr
                  key={t.name}
                  className={`border-b ${dt.borderSubtle} ${dt.hoverBgSubtle} transition-colors relative ${
                    i < 4 ? dt.bgSubtle : ''
                  } ${i === 4 ? 'border-t-2 border-t-idm-gold-warm/30' : ''}`}
                >
                  {/* Rank */}
                  <td className="text-center py-2">
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      i === 1 ? 'bg-green-500/20 text-green-500' :
                      i === 2 ? 'bg-emerald-500/15 text-emerald-500' :
                      i === 3 ? `bg-idm-gold-warm/10 text-idm-gold-warm` :
                      'text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  {/* Team name with optional trophy badge for qualifying teams */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold ${
                        i < 4 ? `bg-gradient-to-br ${dt.division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} text-white` :
                        `${dt.iconBg} ${dt.text}`
                      }`}>{t.name.slice(0, 2).toUpperCase()}</div>
                      <span className={`font-semibold truncate ${i < 4 ? dt.neonText : ''}`}>{t.name}</span>
                      {i < 4 && <span className="text-[10px]" title="Qualified for playoff">🏆</span>}
                    </div>
                  </td>
                  {/* W / D / L */}
                  <td className="text-center font-semibold text-green-500">{t.wins}</td>
                  <td className="text-center font-semibold text-yellow-500">{t.draws}</td>
                  <td className="text-center font-semibold text-red-500">{t.losses}</td>
                  {/* Points */}
                  <td className="text-center font-bold">{t.points}</td>
                  {/* Buchholz (hidden on small screens) */}
                  <td className="text-center text-muted-foreground hidden sm:table-cell">{t.buchholz}</td>
                  {/* GW / GL (hidden on smaller screens) */}
                  <td className="text-center text-muted-foreground hidden md:table-cell">{t.gamesWon}</td>
                  <td className="text-center text-muted-foreground hidden md:table-cell">{t.gamesLost}</td>
                </tr>
              ))}
              {/* Cut-line indicator if more than 4 teams */}
              {standings.length > 4 && (
                <tr>
                  <td colSpan={9} className="py-0">
                    <div className="relative h-4 flex items-center">
                      <div className="absolute inset-x-3 border-t-2 border-dashed border-idm-gold-warm/25" />
                      <span className="mx-auto px-2 text-[8px] font-bold text-idm-gold-warm/60 uppercase tracking-wider bg-background relative z-10">
                        ── Cut Line ──
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className={`flex items-center gap-4 px-4 py-1.5 border-t ${dt.borderSubtle} text-[8px] text-muted-foreground`}>
          <span><span className="text-[10px]">🏆</span> = Qualified</span>
          <span><strong className="text-idm-gold-warm">BH</strong> = Buchholz</span>
          <span><strong>GW</strong> = Games Won</span>
          <span><strong>GL</strong> = Games Lost</span>
        </div>
      </div>

      {/* ── Round-by-Round Swiss Match Cards ── */}
      {swissRounds.map(({ round, label, matches: roundMatches }) => {
        const isExpanded = expandedRounds.has(round);
        return (
          <div key={round}>
            {/* Round header — collapsible */}
            <button
              onClick={() => toggleRound(round)}
              className={`w-full flex items-center gap-2 mb-2 group`}
            >
              <div className={`px-3 py-1.5 rounded-lg ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5`}>
                {label}
                <span className="text-muted-foreground">{roundMatches.length} match</span>
              </div>
              <div className={`flex-1 h-px ${dt.borderSubtle}`} />
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>

            {/* Match cards grid */}
            {isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {roundMatches.map((m) => {
                  const hasScore = m.score1 !== null && m.score2 !== null;
                  const winner1 = hasScore && m.score1! > m.score2!;
                  const winner2 = hasScore && m.score2! > m.score1!;
                  const isDraw = hasScore && m.score1 === m.score2;
                  const isLive = m.status === 'live' || m.status === 'main_event';
                  return (
                    <div
                      key={m.id}
                      className={`hover-scale-sm rounded-lg overflow-hidden border ${
                        isLive ? `border-red-500/30 ${dt.neonPulse}` : dt.borderSubtle
                      } transition-all ${dt.hoverBorder} relative`}
                      style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
                    >
                      {/* Team 1 row */}
                      <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!m.team1 ? 'opacity-50' : ''}`}>
                        <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !m.team1 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                          {m.team1?.name || 'TBD'}
                        </span>
                        {/* Score badge: W/L for completed, score otherwise */}
                        {hasScore && m.team1 && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            winner1 ? 'bg-green-500/15 text-green-500' :
                            isDraw ? 'bg-yellow-500/15 text-yellow-500' :
                            'bg-red-500/15 text-red-500'
                          }`}>
                            {winner1 ? 'W' : isDraw ? 'D' : 'L'}
                          </span>
                        )}
                        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : isDraw ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                          {m.team1 ? (hasScore ? m.score1 : '-') : '-'}
                        </span>
                      </div>
                      {/* Team 2 row */}
                      <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!m.team2 ? 'opacity-50' : ''}`}>
                        <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !m.team2 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                          {m.team2?.name || 'TBD'}
                        </span>
                        {/* Score badge: W/L for completed, score otherwise */}
                        {hasScore && m.team2 && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            winner2 ? 'bg-green-500/15 text-green-500' :
                            isDraw ? 'bg-yellow-500/15 text-yellow-500' :
                            'bg-red-500/15 text-red-500'
                          }`}>
                            {winner2 ? 'W' : isDraw ? 'D' : 'L'}
                          </span>
                        )}
                        <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : isDraw ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                          {m.team2 ? (hasScore ? m.score2 : '-') : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Playoff Section — Bracket-style visual ── */}
      {playoffMatches.length > 0 && (() => {
        // Categorize playoff matches by groupLabel
        const sf1 = playoffMatches.find(m => m.groupLabel === 'SF1');
        const sf2 = playoffMatches.find(m => m.groupLabel === 'SF2');
        const grandFinal = playoffMatches.find(m => m.groupLabel === 'Final');
        const thirdPlace = playoffMatches.find(m => m.groupLabel === '3rd');
        const semiFinals = [sf1, sf2].filter(Boolean) as Match[];
        const finals = [grandFinal, thirdPlace].filter(Boolean) as Match[];
        // Other playoff matches not matching known labels
        const otherPlayoff = playoffMatches.filter(m => !['SF1', 'SF2', 'Final', '3rd'].includes(m.groupLabel || ''));

        // Helper to render a playoff match card
        const renderPlayoffCard = (m: Match, labelOverride?: string) => {
          const hasScore = m.score1 !== null && m.score2 !== null;
          const winner1 = hasScore && m.score1! > m.score2!;
          const winner2 = hasScore && m.score2! > m.score1!;
          const isLive = m.status === 'live' || m.status === 'main_event';
          const label = labelOverride || m.groupLabel || (m.bracket === 'lower' ? '3rd Place' : `R${m.round}`);
          const matchLabel = label === 'SF1' ? 'Semi Final 1' : label === 'SF2' ? 'Semi Final 2' : label === 'Final' ? 'Grand Final' : label === '3rd' ? '3rd Place' : label;
          const isGrandFinal = label === 'Final';
          const is3rd = label === '3rd';
          const isByeMatch = (!m.team1 || !m.team2) && (m.team1 || m.team2) && m.status !== 'completed';

          return (
            <div
              key={m.id}
              className={`hover-scale-sm rounded-lg overflow-hidden border transition-all relative ${
                isLive ? `border-red-500/30 ${dt.neonPulse}` :
                isGrandFinal ? 'border-idm-gold-warm/40 shadow-[0_0_12px_rgba(212,168,83,0.15)]' :
                is3rd ? 'border-orange-500/20' :
                'border-idm-gold-warm/20'
              }`}
              style={{ background: 'var(--card-bg, rgba(20,17,10,0.6))' }}
            >
              <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center justify-between ${
                isGrandFinal ? 'bg-idm-gold-warm/10 text-idm-gold-warm' :
                is3rd ? 'bg-orange-500/5 text-orange-400' :
                `${dt.neonText} bg-idm-gold-warm/5`
              }`}>
                <span className="flex items-center gap-1.5">
                  {isGrandFinal && <span>🏆</span>}
                  {is3rd && <span>🥉</span>}
                  {matchLabel}
                </span>
                {isByeMatch && (
                  <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">WALKOVER</span>
                )}
              </div>
              <div className={`flex items-center px-3 py-2 border-b ${dt.borderSubtle} ${winner1 ? dt.bgSubtle : ''} ${!m.team1 ? 'opacity-50' : ''}`}>
                <span className={`text-[11px] font-semibold truncate flex-1 ${winner1 ? dt.neonText : !m.team1 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                  {m.team1?.name || 'TBD'}
                </span>
                <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner1 ? dt.neonText : 'text-muted-foreground'}`}>
                  {m.team1 ? (hasScore ? m.score1 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score1 : '-'))}
                </span>
              </div>
              <div className={`flex items-center px-3 py-2 ${winner2 ? dt.bgSubtle : ''} ${!m.team2 ? 'opacity-50' : ''}`}>
                <span className={`text-[11px] font-semibold truncate flex-1 ${winner2 ? dt.neonText : !m.team2 ? 'text-muted-foreground italic' : 'text-foreground/80'}`}>
                  {m.team2?.name || 'TBD'}
                </span>
                <span className={`text-xs font-bold tabular-nums w-6 text-right ${winner2 ? dt.neonText : 'text-muted-foreground'}`}>
                  {m.team2 ? (hasScore ? m.score2 : '-') : (m.status === 'pending' || m.status === 'ready' ? '' : (hasScore ? m.score2 : '-'))}
                </span>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-4">
            {/* ── Semi Final Section ── */}
            {semiFinals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-3 py-1.5 rounded-lg bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] font-bold uppercase tracking-wider`}>
                    ⚔️ Semi Final
                  </div>
                  <div className={`flex-1 h-px ${dt.borderSubtle}`} />
                  <span className="text-[9px] text-muted-foreground">Pemenang lolos Grand Final</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {semiFinals.map(m => renderPlayoffCard(m))}
                </div>
              </div>
            )}

            {/* ── Connection visual: SF → Finals ── */}
            {semiFinals.length > 0 && finals.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-1">
                {/* Winner path */}
                <div className="flex-1 flex items-center justify-end">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-idm-gold-warm uppercase tracking-wider">🏆 Pemenang</span>
                    <div className="h-px w-8 bg-idm-gold-warm/30" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-px h-3 bg-idm-gold-warm/20" />
                  <div className="w-3 h-3 rounded-full border border-idm-gold-warm/30 bg-idm-gold-warm/5 flex items-center justify-center">
                    <Crown className="w-2 h-2 text-idm-gold-warm" />
                  </div>
                  <div className="w-px h-3 bg-orange-500/20" />
                </div>
                {/* Loser path */}
                <div className="flex-1 flex items-center">
                  <div className="flex items-center gap-1">
                    <div className="h-px w-8 bg-orange-500/20" />
                    <span className="text-[8px] font-bold text-orange-400 uppercase tracking-wider">Kalah → 🥉</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Grand Final + 3rd Place Section ── */}
            {finals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1.5 rounded-lg bg-idm-gold-warm/15 text-idm-gold-warm text-[10px] font-bold uppercase tracking-wider border border-idm-gold-warm/20">
                    🏆 Grand Final
                  </div>
                  <div className={`flex-1 h-px ${dt.borderSubtle}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Grand Final card (left/prominent) */}
                  {grandFinal && renderPlayoffCard(grandFinal, 'Final')}
                  {/* 3rd Place card (right) */}
                  {thirdPlace && renderPlayoffCard(thirdPlace, '3rd')}
                </div>
              </div>
            )}

            {/* ── Other playoff matches fallback ── */}
            {otherPlayoff.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-3 py-1.5 rounded-lg bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] font-bold uppercase tracking-wider`}>
                    🏆 Playoff
                  </div>
                  <div className={`flex-1 h-px ${dt.borderSubtle}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otherPlayoff.sort((a, b) => (a.round ?? 0) - (b.round ?? 0)).map(m => renderPlayoffCard(m))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
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
    if (Object.keys(grouped).length === 1 && bracketType !== 'group_stage' && bracketType !== 'round_robin' && bracketType !== 'swiss') {
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
        matches: [...roundMatches].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)),
      }));

    return sortedRounds;
  }, [matches, bracketType]);

  /* Calculate SVG connector paths after layout — Clean MPL Style
     Bracket connector pattern:
     [Feeder 1] ──────┐
                        ├────── [Next Match]
     [Feeder 2] ──────┘
     Segments: 1) Horizontal arms  2) Vertical rail  3) Horizontal to next  4) Junction dot

     IMPORTANT: Uses bracket position (from groupLabel) to determine feeder relationships,
     NOT simple array index. This handles BYE matches correctly where R1 has fewer matches
     than expected (e.g., 6 teams → 2 R1 matches, 2 R2 matches with 2 bye teams).
  */
  const calculateConnectors = useCallback(() => {
    if (!containerRef.current || roundsData.length < 2) {
      setConnectors([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const newConnectors: ConnectorPath[] = [];
    const strokeColor = dt.color;

    // Build position lookup for each round: position → match
    // Position is derived from groupLabel (e.g., "U1-2" → position 2)
    const positionLookupByRound: Map<number, Map<number, Match>> = new Map();
    for (let r = 0; r < roundsData.length; r++) {
      const lookup = new Map<number, Match>();
      for (const m of roundsData[r].matches) {
        const pos = getBracketPosition(m.groupLabel);
        if (pos > 0) lookup.set(pos, m);
      }
      positionLookupByRound.set(r, lookup);
    }

    for (let r = 0; r < roundsData.length - 1; r++) {
      const currentRound = roundsData[r];
      const nextRound = roundsData[r + 1];
      const currentPositionLookup = positionLookupByRound.get(r) || new Map();
      const hasPositions = currentPositionLookup.size > 0;

      for (let ni = 0; ni < nextRound.matches.length; ni++) {
        const nextMatch = nextRound.matches[ni];
        const nextCardEl = cardRefs.current.get(`round-${r + 1}-match-${nextMatch.id}`);
        if (!nextCardEl) continue;

        const nextRect = nextCardEl.getBoundingClientRect();
        const nextY = nextRect.top + nextRect.height / 2 - containerRect.top;
        const nextX = nextRect.left - containerRect.left;

        // ── Determine feeder matches using bracket position ──
        // In a standard bracket, next match at position P is fed by:
        //   Feeder 1: position (2P - 1) in the previous round
        //   Feeder 2: position (2P) in the previous round
        // Example: P=1 → feeders at positions 1,2; P=2 → feeders at positions 3,4
        let feederMatch1: Match | null = null;
        let feederMatch2: Match | null = null;

        if (hasPositions) {
          // Use groupLabel-based position mapping (handles BYE matches correctly)
          const nextPos = getBracketPosition(nextMatch.groupLabel);
          if (nextPos > 0) {
            const feederPos1 = nextPos * 2 - 1; // e.g., nextPos=1 → 1; nextPos=2 → 3
            const feederPos2 = nextPos * 2;       // e.g., nextPos=1 → 2; nextPos=2 → 4
            feederMatch1 = currentPositionLookup.get(feederPos1) || null;
            feederMatch2 = currentPositionLookup.get(feederPos2) || null;
          }
        }

        // Fallback: simple index-based pairing (for matches without groupLabel)
        if (!feederMatch1 && !feederMatch2) {
          const feederIdx1 = ni * 2;
          const feederIdx2 = ni * 2 + 1;
          feederMatch1 = currentRound.matches[feederIdx1] || null;
          feederMatch2 = currentRound.matches[feederIdx2] || null;
        }

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

        // Midpoint X between feeder and next match (the vertical rail position)
        const midX = nextX - (nextX - Math.max(p1.x, p2.x)) / 2;

        // Check if feeder match has a winner (for highlighting)
        const f1HasWinner = !!(feederMatch1 && feederMatch1.score1 !== null && feederMatch1.score2 !== null &&
          feederMatch1.score1 !== feederMatch1.score2);
        const f2HasWinner = !!(feederMatch2 && feederMatch2.score1 !== null && feederMatch2.score2 !== null &&
          feederMatch2.score1 !== feederMatch2.score2);

        // ── Segment 1: Horizontal arm from Feeder 1 to midX ──
        if (feederEl1) {
          newConnectors.push({
            key: `conn-${r}-${ni}-arm1`,
            d: `M ${p1.x} ${p1.y} H ${midX}`,
            color: strokeColor,
            isWinner: f1HasWinner,
          });
        }

        // ── Segment 2: Horizontal arm from Feeder 2 to midX ──
        if (feederEl2) {
          newConnectors.push({
            key: `conn-${r}-${ni}-arm2`,
            d: `M ${p2.x} ${p2.y} H ${midX}`,
            color: strokeColor,
            isWinner: f2HasWinner,
          });
        }

        // ── Segment 3: Vertical rail at midX connecting both feeders ──
        if (feederEl1 && feederEl2) {
          const topY = Math.min(p1.y, p2.y);
          const bottomY = Math.max(p1.y, p2.y);
          newConnectors.push({
            key: `conn-${r}-${ni}-rail`,
            d: `M ${midX} ${topY} V ${bottomY}`,
            color: strokeColor,
            isWinner: f1HasWinner || f2HasWinner,
          });
        } else if (feederEl1 && !feederEl2) {
          // Single feeder — vertical rail from feeder to nextY level
          newConnectors.push({
            key: `conn-${r}-${ni}-rail`,
            d: `M ${midX} ${p1.y} V ${nextY}`,
            color: strokeColor,
            isWinner: f1HasWinner,
          });
        } else if (feederEl2 && !feederEl1) {
          newConnectors.push({
            key: `conn-${r}-${ni}-rail`,
            d: `M ${midX} ${p2.y} V ${nextY}`,
            color: strokeColor,
            isWinner: f2HasWinner,
          });
        }

        // ── Segment 4: Horizontal from midX at nextY to next match ──
        newConnectors.push({
          key: `conn-${r}-${ni}-bridge`,
          d: `M ${midX} ${nextY} H ${nextX}`,
          color: strokeColor,
          isWinner: f1HasWinner || f2HasWinner,
        });

        // ── Segment 5: Junction dot at merge point ──
        newConnectors.push({
          key: `conn-${r}-${ni}-dot`,
          d: `M ${midX - 3} ${nextY} h 6`,
          color: strokeColor,
          isWinner: true,
        });
      }
    }

    setConnectors(newConnectors);
  }, [roundsData, dt.color]);

  useEffect(() => {
    // Multiple attempts to recalculate after layout settles
    // Alignment runs at 100, 300, 600, 1200ms — connectors must run AFTER alignment
    const attempts = [80, 150, 350, 700, 1300];
    const timers = attempts.map(delay => setTimeout(calculateConnectors, delay));
    const handleResize = () => { alignBracketCards(); setTimeout(calculateConnectors, 50); };

    // Also recalculate when the scrollable container is scrolled
    // (cards shift position relative to viewport, need to update SVG)
    const scrollContainer = containerRef.current?.parentElement;
    const handleScroll = () => calculateConnectors();

    window.addEventListener('resize', handleResize);
    scrollContainer?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
      scrollContainer?.removeEventListener('scroll', handleScroll);
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

  /* ─── Bracket card alignment — position R2+ cards at vertical midpoint of feeders ─── */
  // This must be declared BEFORE any early returns (React hooks rule)
  const alignBracketCards = useCallback(() => {
    if (!containerRef.current || roundsData.length < 2) return;

    // Only align if we have groupLabel positions
    const r0HasPositions = roundsData[0].matches.some(m => getBracketPosition(m.groupLabel) > 0);
    if (!r0HasPositions) {
      // Fallback: use exponential gap for rounds without positions
      for (let r = 1; r < roundsData.length; r++) {
        const gapMultiplier = Math.pow(2, r);
        const roundCols = containerRef.current.querySelectorAll(`[data-round="${r}"]`);
        roundCols.forEach((col) => {
          const cards = col.children;
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            if (i === 0) {
              card.style.marginTop = `${(gapMultiplier - 1) * 20}px`;
            } else {
              card.style.marginTop = `${gapMultiplier * 24 + 16}px`;
            }
          }
        });
      }
      return;
    }

    // Build a map of card elements by round + match ID
    const cardElMap = new Map<string, HTMLDivElement>();
    for (const [key, el] of cardRefs.current.entries()) {
      cardElMap.set(key, el);
    }

    // For each round starting from R2, position cards at midpoint of their feeders
    for (let r = 1; r < roundsData.length; r++) {
      const currentRound = roundsData[r];
      const prevRound = roundsData[r - 1];

      // Build position lookup for previous round
      const prevPosMap = new Map<number, HTMLDivElement>();
      for (const pm of prevRound.matches) {
        const pos = getBracketPosition(pm.groupLabel);
        const el = cardElMap.get(`round-${r - 1}-match-${pm.id}`);
        if (pos > 0 && el) prevPosMap.set(pos, el);
      }

      for (let mi = 0; mi < currentRound.matches.length; mi++) {
        const m = currentRound.matches[mi];
        const bracketPos = getBracketPosition(m.groupLabel);
        const el = cardElMap.get(`round-${r}-match-${m.id}`);
        if (!el || bracketPos <= 0) continue;

        // Find feeder elements
        const feederPos1 = bracketPos * 2 - 1;
        const feederPos2 = bracketPos * 2;
        const feederEl1 = prevPosMap.get(feederPos1);
        const feederEl2 = prevPosMap.get(feederPos2);

        // Calculate offset accounting for previously applied marginTop.
        // This prevents the oscillation bug where successive alignment runs
        // alternate between correct and zero margins because getBoundingClientRect()
        // includes the current margin but offset = target - current doesn't account for it.
        // Fix: naturalCenterY = currentCenterY - currentMarginTop
        //      offset = targetCenterY - naturalCenterY
        const currentMarginTop = parseFloat(el.style.marginTop) || 0;

        if (feederEl1 && feederEl2) {
          // Both feeders exist — position this card at their vertical midpoint
          const f1Rect = feederEl1.getBoundingClientRect();
          const f2Rect = feederEl2.getBoundingClientRect();
          const cardRect = el.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          const f1CenterY = f1Rect.top + f1Rect.height / 2 - containerRect.top;
          const f2CenterY = f2Rect.top + f2Rect.height / 2 - containerRect.top;
          const targetCenterY = (f1CenterY + f2CenterY) / 2;
          const currentCenterY = cardRect.top + cardRect.height / 2 - containerRect.top;

          // Offset relative to natural position (without margin)
          const naturalCenterY = currentCenterY - currentMarginTop;
          const offset = targetCenterY - naturalCenterY;
          el.style.marginTop = `${offset}px`;
        } else if (feederEl1 || feederEl2) {
          // Single feeder (BYE) — align with that feeder
          const feederEl = feederEl1 || feederEl2!;
          const fRect = feederEl.getBoundingClientRect();
          const cardRect = el.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();

          const fCenterY = fRect.top + fRect.height / 2 - containerRect.top;
          const currentCenterY = cardRect.top + cardRect.height / 2 - containerRect.top;

          // Offset relative to natural position (without margin)
          const naturalCenterY = currentCenterY - currentMarginTop;
          const offset = fCenterY - naturalCenterY;
          el.style.marginTop = `${offset}px`;
        }
      }
    }
  }, [roundsData]);

  // Run alignment after layout
  useEffect(() => {
    const timers = [100, 300, 600, 1200].map(delay => setTimeout(alignBracketCards, delay));
    return () => timers.forEach(clearTimeout);
  }, [alignBracketCards]);

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
    return (
      <div className="space-y-5">
        <GroupStageView matches={matches} roundsData={roundsData} />
      </div>
    );
  }

  /* ─── Render: Swiss ─── */
  if (bracketType === 'swiss') {
    return (
      <div>
        <SwissView matches={matches} roundsData={roundsData} />
      </div>
    );
  }

  /* ─── Bracket content (shared for single/double elimination) ─── */
  const bracketContent = (
    <div className="overflow-x-auto custom-scrollbar pb-2 -mx-1">
      <div className="relative min-w-max px-1" ref={containerRef}>
        {/* SVG connector overlay — inside scrollable area so lines move with cards */}
        {connectors.length > 0 && <BracketConnectors paths={connectors} />}

        {/* Bracket columns — MPL horizontal layout with position-based alignment */}
        <div className="flex gap-10">
          {roundsData.map((round, roundIdx) => {
            return (
              <div key={round.round} className="flex flex-col" style={{ minWidth: '200px' }}>
                {/* Round label — MPL pill style */}
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${dt.bg} ${dt.text} text-[10px] font-bold uppercase tracking-wider`}>
                    {roundIdx === roundsData.length - 1 && <span>🏆</span>}
                    {round.label}
                  </div>
                </div>
                {/* Match cards container — R1 uses flex gap, R2+ uses margin-top set by alignBracketCards() */}
                <div
                  className="flex-1 flex flex-col"
                  data-round={roundIdx}
                  style={{ gap: roundIdx === 0 ? '24px' : '0px' }}
                >
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
  );

  /* ─── Render: Single/Double Elimination Bracket with Zoom ─── */
  return (
    <div>
      <ZoomableContainer>
        {bracketContent}
      </ZoomableContainer>

      {/* Double Elimination: Elimination Bracket — removed, DE not supported */}
    </div>
  );
}
