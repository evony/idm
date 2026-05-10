'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Star, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MatchResultCardProps {
  team1: {
    name: string;
    logo?: string | null;
    score: number;
    isWinner: boolean;
  };
  team2: {
    name: string;
    logo?: string | null;
    score: number;
    isWinner: boolean;
  };
  mvp?: {
    gamertag: string;
    avatar?: string | null;
  } | null;
  format?: 'BO1' | 'BO3' | 'BO5';
  scheduledAt?: string | null;
  location?: string | null;
  status: 'pending' | 'live' | 'completed';
  className?: string;
  showAnimation?: boolean;
}

export function MatchResultCard({
  team1,
  team2,
  mvp,
  format = 'BO1',
  scheduledAt,
  location,
  status,
  className = '',
  showAnimation = true,
}: MatchResultCardProps) {
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    if (status === 'completed' && showAnimation) {
      const timer = setTimeout(() => setShowScore(true), 500);
      return () => clearTimeout(timer);
    }
  }, [status, showAnimation]);

  const maxScore = format === 'BO1' ? 1 : format === 'BO3' ? 2 : 3;

  return (
    <motion.div
      className={`match-result-card ${status === 'completed' ? (team1.isWinner ? 'winner' : 'loser') : ''} rounded-xl p-4 bg-card border ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Match Info Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
            {format}
          </span>
          {status === 'live' && (
            <motion.span
              className="flex items-center gap-1 text-red-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              LIVE
            </motion.span>
          )}
          {status === 'completed' && (
            <span className="text-green-400">Selesai</span>
          )}
        </div>
        {scheduledAt && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(scheduledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Team 1 */}
        <div className="flex-1 text-center">
          <motion.div
            className={`text-lg font-bold truncate ${team1.isWinner ? 'text-[#d4a853]' : 'text-foreground'}`}
            animate={team1.isWinner && showScore ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {team1.name}
          </motion.div>
          {team1.isWinner && status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-1 mt-1"
            >
              <Trophy className="w-3 h-3 text-[#d4a853]" />
              <span className="text-[10px] text-[#d4a853]">WINNER</span>
            </motion.div>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-background">
          <motion.span
            className={`text-2xl font-black ${team1.isWinner ? 'text-[#d4a853]' : 'text-foreground'}`}
            initial={showAnimation ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
          >
            {team1.score}
          </motion.span>
          <span className="text-muted-foreground">-</span>
          <motion.span
            className={`text-2xl font-black ${team2.isWinner ? 'text-[#d4a853]' : 'text-foreground'}`}
            initial={showAnimation ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
          >
            {team2.score}
          </motion.span>
        </div>

        {/* Team 2 */}
        <div className="flex-1 text-center">
          <motion.div
            className={`text-lg font-bold truncate ${team2.isWinner ? 'text-[#d4a853]' : 'text-foreground'}`}
            animate={team2.isWinner && showScore ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {team2.name}
          </motion.div>
          {team2.isWinner && status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-1 mt-1"
            >
              <Trophy className="w-3 h-3 text-[#d4a853]" />
              <span className="text-[10px] text-[#d4a853]">WINNER</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* MVP */}
      <AnimatePresence>
        {mvp && status === 'completed' && showScore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: 1 }}
            className="mt-4 pt-3 border-t border-border"
          >
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Star className="w-4 h-4 text-[#d4a853] fill-[#d4a853]" />
              </motion.div>
              <span className="text-xs text-muted-foreground">MVP:</span>
              <span className="text-sm font-bold text-[#d4a853]">{mvp.gamertag}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Match Result Timeline (for tournament history)
interface MatchResultTimelineProps {
  matches: Array<{
    id: string;
    round: number;
    team1: { name: string; score: number; isWinner: boolean };
    team2: { name: string; score: number; isWinner: boolean };
    status: string;
  }>;
  currentRound?: number;
  className?: string;
}

export function MatchResultTimeline({ matches, currentRound, className = '' }: MatchResultTimelineProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {matches.map((match, index) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative pl-6"
        >
          {/* Timeline connector */}
          {index < matches.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
          )}
          {/* Timeline dot */}
          <div
            className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
              match.status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {match.status === 'completed' ? (
              <Trophy className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
          </div>

          <MatchResultCard
            team1={match.team1}
            team2={match.team2}
            status={match.status as 'pending' | 'live' | 'completed'}
            showAnimation={false}
            className="!p-3"
          />
        </motion.div>
      ))}
    </div>
  );
}
