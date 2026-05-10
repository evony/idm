'use client';

import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, TrendingUp, Flame, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FeedItem {
  id: string;
  type: 'match_result' | 'achievement' | 'mvp' | 'tournament' | 'champion';
  title: string;
  description?: string;
  image?: string;
  timestamp: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  author?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

interface SocialFeedProps {
  items: FeedItem[];
  className?: string;
}

export function SocialFeed({ items, className = '' }: SocialFeedProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <FeedCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

function FeedCard({ item, index }: { item: FeedItem; index: number }) {
  const [liked, setLiked] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'match_result':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'achievement':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'mvp':
        return <Users className="w-4 h-4 text-[#d4a853]" />;
      case 'tournament':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'champion':
        return <TrendingUp className="w-4 h-4 text-[#d4a853]" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="feed-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {item.author?.avatar && (
          <img
            src={item.author.avatar}
            alt={item.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{item.author?.name || 'IDM League'}</span>
            {getIcon()}
          </div>
          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <h4 className="font-bold text-base mb-1">{item.title}</h4>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
      </div>

      {/* Image */}
      {item.image && (
        <div className="rounded-lg overflow-hidden mb-3">
          <img src={item.image} alt="" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* Engagement */}
      {item.engagement && (
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <button
            onClick={() => setLiked(!liked)}
            className={`engagement-badge ${liked ? 'text-red-400' : ''}`}
          >
            <Heart
              className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`}
            />
            <span>{item.engagement.likes + (liked ? 1 : 0)}</span>
          </button>
          <button className="engagement-badge">
            <MessageCircle className="w-4 h-4" />
            <span>{item.engagement.comments}</span>
          </button>
          <button className="engagement-badge">
            <Share2 className="w-4 h-4" />
            <span>{item.engagement.shares}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Live Match Banner Component
interface LiveMatchBannerProps {
  team1: { name: string; logo?: string };
  team2: { name: string; logo?: string };
  score1?: number;
  score2?: number;
  division: 'male' | 'female';
  tournamentName: string;
  className?: string;
}

export function LiveMatchBanner({
  team1,
  team2,
  score1 = 0,
  score2 = 0,
  division,
  tournamentName,
  className = '',
}: LiveMatchBannerProps) {
  const accentColor = division === 'male' ? '#22d3ee' : '#c084fc';

  return (
    <motion.div
      className={`relative rounded-xl p-4 overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${accentColor}30`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Live indicator */}
      <div className="absolute top-3 right-3">
        <motion.div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-red-400 uppercase">Live</span>
        </motion.div>
      </div>

      {/* Tournament name */}
      <div className="text-xs text-muted-foreground mb-3">{tournamentName}</div>

      {/* Match */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {team1.logo && (
            <img src={team1.logo} alt={team1.name} className="w-8 h-8 rounded-full" />
          )}
          <span className="font-bold">{team1.name}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-background">
          <span className="text-xl font-bold" style={{ color: accentColor }}>{score1}</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-xl font-bold" style={{ color: accentColor }}>{score2}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold">{team2.name}</span>
          {team2.logo && (
            <img src={team2.logo} alt={team2.name} className="w-8 h-8 rounded-full" />
          )}
        </div>
      </div>

      {/* Watch button */}
      <motion.button
        className="mt-4 w-full py-2 rounded-lg text-sm font-bold"
        style={{
          background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
          border: `1px solid ${accentColor}30`,
          color: accentColor,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Tonton Sekarang
      </motion.button>
    </motion.div>
  );
}

// Countdown Timer Component
interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  className?: string;
}

export function CountdownTimer({ targetDate, label, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className={`text-center ${className}`}>
      {label && <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>}
      <div className="flex items-center justify-center gap-2">
        {[
          { value: timeLeft.days, label: 'D' },
          { value: timeLeft.hours, label: 'H' },
          { value: timeLeft.minutes, label: 'M' },
          { value: timeLeft.seconds, label: 'S' },
        ].map((item, index) => (
          <div key={index} className="text-center">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg bg-[#d4a853]/10 border border-[#d4a853]/20"
              key={`${item.value}-${index}`}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-xl sm:text-2xl font-black text-[#d4a853]">
                {String(item.value).padStart(2, '0')}
              </span>
            </motion.div>
            <span className="text-[10px] text-muted-foreground mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
