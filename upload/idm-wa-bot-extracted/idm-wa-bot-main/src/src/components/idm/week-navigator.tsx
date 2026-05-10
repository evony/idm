'use client';

import { useState, useMemo } from 'react';

interface WeekItem {
  weekNumber: number;
  label?: string;
  status?: 'completed' | 'live' | 'upcoming';
}

interface Phase {
  key: string;
  label: string;
  emoji: string;
  weekRange: [number, number]; // [start, end] inclusive
}

interface WeekNavigatorProps {
  totalWeeks: number;
  completedWeeks: number[];
  liveWeek?: number;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  accent?: string;        // hex color e.g. '#06b6d4'
  accentLight?: string;   // hex color e.g. '#22d3ee'
  phases?: Phase[];
  size?: 'sm' | 'md';
}

function buildPhases(totalWeeks: number): Phase[] {
  if (totalWeeks <= 4) {
    return [{ key: 'all', label: 'Season', emoji: '🏆', weekRange: [1, totalWeeks] }];
  }
  if (totalWeeks <= 6) {
    return [
      { key: 'early', label: 'Early', emoji: '🟢', weekRange: [1, 3] },
      { key: 'late', label: 'Late', emoji: '🔥', weekRange: [4, totalWeeks] },
    ];
  }
  if (totalWeeks <= 11) {
    // 7-11 weeks: 3 phases — Early, Mid, Final
    const midStart = totalWeeks <= 8 ? 4 : 5;
    const midEnd = totalWeeks <= 8 ? totalWeeks - 1 : 8;
    return [
      { key: 'early', label: 'Early', emoji: '🟢', weekRange: [1, midStart - 1] },
      { key: 'mid', label: 'Mid', emoji: '🔥', weekRange: [midStart, midEnd] },
      { key: 'final', label: 'Final', emoji: '🏆', weekRange: [midEnd + 1, totalWeeks] },
    ];
  }
  // 12+ weeks: 4 phases
  const q1 = Math.floor(totalWeeks / 4);
  const q2 = Math.floor(totalWeeks / 2);
  return [
    { key: 'early', label: 'Early', emoji: '🟢', weekRange: [1, q1] },
    { key: 'mid', label: 'Mid', emoji: '⚡', weekRange: [q1 + 1, q2] },
    { key: 'late', label: 'Late', emoji: '🔥', weekRange: [q2 + 1, totalWeeks - 2] },
    { key: 'final', label: 'Final', emoji: '🏆', weekRange: [totalWeeks - 1, totalWeeks] },
  ];
}

export function WeekNavigator({
  totalWeeks,
  completedWeeks,
  liveWeek,
  selectedWeek,
  onWeekChange,
  accent = '#06b6d4',
  accentLight = '#22d3ee',
  phases: customPhases,
  size = 'md',
}: WeekNavigatorProps) {
  const phases = customPhases || buildPhases(totalWeeks);

  // Determine active phase based on selectedWeek
  const activePhase = useMemo(() => {
    return phases.find(p => selectedWeek >= p.weekRange[0] && selectedWeek <= p.weekRange[1]) || phases[0];
  }, [selectedWeek, phases]);

  const [manualPhase, setManualPhase] = useState<string | null>(null);
  const currentPhase = manualPhase ? phases.find(p => p.key === manualPhase) || activePhase : activePhase;

  // Build week dots for current phase
  const phaseWeeks = useMemo(() => {
    const weeks: WeekItem[] = [];
    for (let w = currentPhase.weekRange[0]; w <= currentPhase.weekRange[1]; w++) {
      if (w > totalWeeks) break;
      weeks.push({
        weekNumber: w,
        status: completedWeeks.includes(w)
          ? 'completed'
          : liveWeek === w
            ? 'live'
            : 'upcoming',
      });
    }
    return weeks;
  }, [currentPhase, totalWeeks, completedWeeks, liveWeek]);

  const isSm = size === 'sm';

  return (
    <div className="space-y-2">
      {/* Phase Tabs */}
      {phases.length > 1 && (
        <div className="flex items-center gap-1">
          {phases.map(phase => {
            const isActive = currentPhase.key === phase.key;
            return (
              <button
                key={phase.key}
                onClick={() => setManualPhase(phase.key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  isSm ? 'px-2 py-0.5' : ''
                } ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-transparent'
                }`}
                style={isActive ? { backgroundColor: `${accent}25`, color: accentLight } : undefined}
              >
                <span className="mr-1">{phase.emoji}</span>
                {phase.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Week Dots */}
      <div className="flex items-center gap-1.5">
        <span className={`text-[9px] font-semibold mr-0.5 ${isSm ? 'text-[8px]' : ''}`} style={{ color: `${accentLight}50` }}>
          W
        </span>
        {phaseWeeks.map(w => {
          const isSelected = selectedWeek === w.weekNumber;
          const isCompleted = w.status === 'completed';
          const isLive = w.status === 'live';
          const isUpcoming = w.status === 'upcoming';

          return (
            <button
              key={w.weekNumber}
              onClick={() => onWeekChange(w.weekNumber)}
              className={`relative flex items-center justify-center transition-all duration-200 ${
                isSm ? 'w-6 h-6' : 'w-7 h-7'
              } rounded-full text-[9px] font-black ${
                isSelected
                  ? 'text-white shadow-md'
                  : isLive
                    ? 'text-white'
                    : isCompleted
                      ? ''
                      : 'opacity-40'
              }`}
              style={
                isSelected
                  ? { backgroundColor: accent, boxShadow: `0 0 12px ${accent}80` }
                  : isLive
                    ? { backgroundColor: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }
                    : { backgroundColor: `${accent}10`, color: `${accentLight}60` }
              }
            >
              {w.weekNumber}
              {/* Live pulse */}
              {isLive && !isSelected && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              {/* Completed check */}
              {isCompleted && !isSelected && !isLive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: accent }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
