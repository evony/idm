'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Trophy, Gift, TrendingUp, Calendar,
  Crown, Flame, Activity, ArrowUpRight, ArrowDownRight, Music
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { formatCurrency } from '@/lib/utils';
import { container, item } from '@/lib/animations';

interface AdminOverviewProps {
  division: 'male' | 'female';
}

export function AdminOverview({ division }: AdminOverviewProps) {
  const dt = useDivisionTheme();

  const { data: stats } = useQuery({
    queryKey: ['stats', division],
    queryFn: async () => {
      const res = await fetch(`/api/stats?division=${division}`);
      return res.json();
    },
  });

  const { data: players } = useQuery({
    queryKey: ['admin-players-all', division],
    queryFn: async () => {
      const res = await fetch(`/api/players?division=${division}`);
      return res.json();
    },
  });

  // Calculate tier distribution
  const tierDistribution = players?.reduce((acc: Record<string, number>, p: { tier: string }) => {
    acc[p.tier] = (acc[p.tier] || 0) + 1;
    return acc;
  }, { S: 0, A: 0, B: 0 }) || { S: 0, A: 0, B: 0 };

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Players',
      value: stats?.totalPlayers || 0,
      icon: Users,
      change: '+12%',
      changeType: 'up' as const,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Tournaments',
      value: stats?.tournaments?.length || 0,
      icon: Music,
      change: `${stats?.seasonProgress?.completedWeeks || 0}/${stats?.seasonProgress?.totalWeeks || 11}`,
      changeType: 'neutral' as const,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Prize Pool',
      value: formatCurrency(stats?.totalPrizePool || 0),
      icon: Gift,
      change: '+23%',
      changeType: 'up' as const,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Matches Played',
      value: stats?.recentMatches?.length || 0,
      icon: Trophy,
      change: 'This week',
      changeType: 'neutral' as const,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} variants={item}>
              <Card className={`${dt.casinoCard} overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    {stat.changeType !== 'neutral' && (
                      <Badge className={`text-[9px] border-0 ${
                        stat.changeType === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {stat.changeType === 'up' ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                        {stat.change}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Season Progress & Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Season Progress */}
        <motion.div variants={item}>
          <Card className={dt.casinoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${dt.text}`} />
                Season Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Week {stats?.seasonProgress?.completedWeeks || 0} of {stats?.seasonProgress?.totalWeeks || 11}</span>
                  <span className="font-medium">{stats?.seasonProgress?.percentage || 0}%</span>
                </div>
                <Progress value={stats?.seasonProgress?.percentage || 0} className="h-2" />
              </div>

              {/* Week indicators */}
              <div className="flex gap-1">
                {Array.from({ length: stats?.seasonProgress?.totalWeeks || 11 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full ${
                      i < (stats?.seasonProgress?.completedWeeks || 0)
                        ? division === 'male' ? 'bg-idm-male' : 'bg-idm-female'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tier Distribution */}
        <motion.div variants={item}>
          <Card className={dt.casinoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className={`w-4 h-4 ${dt.text}`} />
                Player Tier Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tier: 'S', count: tierDistribution.S, color: 'bg-gradient-to-r from-amber-500 to-yellow-400', label: 'S-Tier' },
                  { tier: 'A', count: tierDistribution.A, color: 'bg-gradient-to-r from-purple-500 to-pink-400', label: 'A-Tier' },
                  { tier: 'B', count: tierDistribution.B, color: 'bg-gradient-to-r from-blue-500 to-cyan-400', label: 'B-Tier' },
                ].map(({ tier, count, color, label }) => {
                  const total = tierDistribution.S + tierDistribution.A + tierDistribution.B;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={tier}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{count} players ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Players & Recent Champions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Players */}
        <motion.div variants={item}>
          <Card className={dt.casinoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${dt.text}`} />
                Top Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {stats?.topPlayers?.slice(0, 5).map((player: {
                  id: string;
                  gamertag: string;
                  points: number;
                  totalWins: number;
                  tier: string;
                  streak: number;
                }, i: number) => (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? 'bg-amber-500 text-white' :
                      i === 1 ? 'bg-slate-400 text-white' :
                      i === 2 ? 'bg-amber-700 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{player.gamertag}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{player.points} pts</span>
                        <span>•</span>
                        <span>{player.totalWins}W</span>
                        {player.streak > 1 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-400">🔥{player.streak}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-[9px] border-0 ${
                      player.tier === 'S' ? 'bg-amber-500/10 text-amber-500' :
                      player.tier === 'A' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {player.tier}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Champions */}
        <motion.div variants={item}>
          <Card className={dt.casinoCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                Recent Champions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {stats?.weeklyChampions?.slice(0, 5).map((champ: {
                  weekNumber: number;
                  winnerTeam?: { name: string; players: Array<{ gamertag: string }> } | null;
                  mvp?: { gamertag: string } | null;
                  prizePool: number;
                }) => (
                  <div key={champ.weekNumber} className="p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="text-[9px] border-0 bg-yellow-500/10 text-yellow-500">
                        Week {champ.weekNumber}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatCurrency(champ.prizePool)}
                      </span>
                    </div>
                    {champ.winnerTeam && (
                      <p className="text-xs font-medium">{champ.winnerTeam.name}</p>
                    )}
                    {champ.mvp && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" /> MVP: {champ.mvp.gamertag}
                      </p>
                    )}
                  </div>
                ))}
                {(!stats?.weeklyChampions || stats.weeklyChampions.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">No champions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
