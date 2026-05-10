'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, ArrowUpCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, History, Star, Award, Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from './tier-badge';
import { useState } from 'react';
import { toast } from 'sonner';
import { container, item } from '@/lib/animations';
import type { DivisionTheme } from '@/hooks/use-division-theme';

interface RankingPanelProps {
  division: string;
  dt: DivisionTheme;
  setConfirmDialog: (d: { open: boolean; title: string; description: string; onConfirm: () => void }) => void;
}

const REASON_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  participation: { label: 'Partisipasi', icon: '🎫', color: 'text-blue-400' },
  match_win: { label: 'Menang Match', icon: '⚔️', color: 'text-green-400' },
  prize_juara1: { label: 'Juara 1', icon: '🥇', color: 'text-yellow-400' },
  prize_juara2: { label: 'Juara 2', icon: '🥈', color: 'text-gray-300' },
  prize_juara3: { label: 'Juara 3', icon: '🥉', color: 'text-amber-600' },
  prize_mvp: { label: 'MVP', icon: '⭐', color: 'text-purple-400' },
  prize_other: { label: 'Hadiah Lain', icon: '🎁', color: 'text-pink-400' },
  admin_adjustment: { label: 'Penyesuaian Admin', icon: '🔧', color: 'text-orange-400' },
  tier_upgrade_bonus: { label: 'Bonus Upgrade Tier', icon: '🔼', color: 'text-cyan-400' },
};

export function RankingPanel({ division, dt, setConfirmDialog }: RankingPanelProps) {
  const qc = useQueryClient();
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');

  // Queries
  const { data: rankings, isLoading } = useQuery({
    queryKey: ['admin-rankings', division],
    queryFn: async () => {
      const r = await fetch(`/api/rankings?division=${division}`);
      return r.json();
    },
  });

  const { data: playerDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['ranking-detail', expandedPlayer],
    queryFn: async () => {
      if (!expandedPlayer) return null;
      const r = await fetch(`/api/rankings/${expandedPlayer}`);
      return r.json();
    },
    enabled: !!expandedPlayer,
  });

  // Mutations
  const processUpgradesMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_upgrades', division }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal proses upgrade'); }
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-rankings', division] });
      if (data.count > 0) {
        toast.success(`${data.count} player berhasil di-upgrade tier! 🎉`);
      } else {
        toast.info('Tidak ada player yang eligible untuk upgrade saat ini.');
      }
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculate', division }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal recalculate'); }
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-rankings', division] });
      if (data.correctionsCount > 0) {
        toast.success(`${data.correctionsCount} poin diperbaiki!`);
      } else {
        toast.success('Semua poin sudah benar, tidak perlu koreksi.');
      }
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const upgradePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const r = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade_player', playerId }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal upgrade'); }
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-rankings', division] });
      if (data.upgraded) {
        toast.success(`Player di-upgrade dari ${data.fromTier} ke ${data.toTier}! 🎉`);
      } else {
        toast.info('Player tidak eligible untuk upgrade.');
      }
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-6 h-6 animate-spin ${dt.neonText}`} />
        <span className="ml-2 text-sm text-muted-foreground">Memuat ranking...</span>
      </div>
    );
  }

  const tierSummary = rankings?.tierSummary || { S: 0, A: 0, B: 0 };
  const pendingUpgrades = rankings?.pendingUpgrades || [];
  const thresholds = rankings?.thresholds || { B_TO_A: 15, A_TO_S: 35 };
  const allRankings = rankings?.rankings || [];

  // Filter
  const filtered = filterTier === 'all'
    ? allRankings
    : allRankings.filter((r: { tier: string }) => r.tier === filterTier);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className={dt.casinoCard}>
          <div className={dt.casinoBar} />
          <CardContent className="p-3 relative z-10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Player</p>
            <p className={`text-xl font-bold ${dt.neonText}`}>{allRankings.length}</p>
          </CardContent>
        </Card>
        <Card className={dt.casinoCard}>
          <div className={dt.casinoBar} />
          <CardContent className="p-3 relative z-10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Distribusi Tier</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge className="text-[9px] border-0 bg-red-500/10 text-red-500">S: {tierSummary.S}</Badge>
              <Badge className="text-[9px] border-0 bg-yellow-500/10 text-yellow-500">A: {tierSummary.A}</Badge>
              <Badge className="text-[9px] border-0 bg-blue-500/10 text-blue-500">B: {tierSummary.B}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className={dt.casinoCard}>
          <div className={dt.casinoBar} />
          <CardContent className="p-3 relative z-10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending Upgrade</p>
            <p className={`text-xl font-bold ${pendingUpgrades.length > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {pendingUpgrades.length}
            </p>
          </CardContent>
        </Card>
        <Card className={dt.casinoCard}>
          <div className={dt.casinoBar} />
          <CardContent className="p-3 relative z-10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Threshold</p>
            <p className="text-xs text-muted-foreground mt-1">B→A: {thresholds.B_TO_A}pts | A→S: {thresholds.A_TO_S}pts</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== PENDING UPGRADES ===== */}
      {pendingUpgrades.length > 0 && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-yellow-500">
                <ArrowUpCircle className="w-4 h-4" /> Player Eligible Upgrade Tier ({pendingUpgrades.length})
              </h3>
              <Button size="sm" className="text-[10px] h-7 bg-yellow-600 hover:bg-yellow-700 text-white"
                disabled={processUpgradesMutation.isPending}
                onClick={() => setConfirmDialog({
                  open: true,
                  title: 'Proses Semua Upgrade Tier?',
                  description: `${pendingUpgrades.length} player akan di-upgrade tier berdasarkan poin yang terkumpul. Tindakan ini tidak dapat dibatalkan.`,
                  onConfirm: () => processUpgradesMutation.mutate()
                })}>
                {processUpgradesMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ArrowUpCircle className="w-3 h-3 mr-1" />}
                Upgrade Semua
              </Button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {pendingUpgrades.map((p: {
                rank: number; id: string; gamertag: string; tier: string; points: number;
                upgradeInfo: { targetTier: string; currentTier: string; pointsToNext: number };
              }) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-6">#{p.rank}</span>
                    <TierBadge tier={p.tier} />
                    <span className="text-xs font-medium">{p.gamertag}</span>
                    <span className="text-[10px] text-muted-foreground">{p.points}pts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3" />
                      {p.tier} → {p.upgradeInfo.targetTier}
                    </span>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-green-500 hover:text-green-400 hover:bg-green-500/10"
                      disabled={upgradePlayerMutation.isPending}
                      onClick={() => upgradePlayerMutation.mutate(p.id)}>
                      Upgrade
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== ACTIONS BAR ===== */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 mr-auto">
          <Button size="sm" variant={filterTier === 'all' ? 'default' : 'outline'} className={`text-[10px] h-7 ${filterTier === 'all' ? 'bg-[#d4a853] text-black hover:bg-[#d4a853]/80' : ''}`}
            onClick={() => setFilterTier('all')}>Semua</Button>
          <Button size="sm" variant={filterTier === 'S' ? 'default' : 'outline'} className={`text-[10px] h-7 ${filterTier === 'S' ? 'bg-red-500 text-white' : ''}`}
            onClick={() => setFilterTier('S')}>S</Button>
          <Button size="sm" variant={filterTier === 'A' ? 'default' : 'outline'} className={`text-[10px] h-7 ${filterTier === 'A' ? 'bg-yellow-500 text-black' : ''}`}
            onClick={() => setFilterTier('A')}>A</Button>
          <Button size="sm" variant={filterTier === 'B' ? 'default' : 'outline'} className={`text-[10px] h-7 ${filterTier === 'B' ? 'bg-blue-500 text-white' : ''}`}
            onClick={() => setFilterTier('B')}>B</Button>
        </div>
        <Button size="sm" variant="outline" className="text-[10px] h-7"
          disabled={recalculateMutation.isPending}
          onClick={() => setConfirmDialog({
            open: true,
            title: 'Recalculate Poin?',
            description: 'Semua poin player akan dihitung ulang dari audit trail. Gunakan jika ada ketidaksesuaian data.',
            onConfirm: () => recalculateMutation.mutate()
          })}>
          {recalculateMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Recalculate
        </Button>
      </div>

      {/* ===== RANKING TABLE ===== */}
      <Card className={dt.casinoCard}>
        <div className={dt.casinoBar} />
        <CardContent className="p-0 relative z-10">
          {/* Header */}
          <div className="grid grid-cols-[2.5rem_1fr_3rem_3.5rem_3.5rem_3.5rem_3rem] sm:grid-cols-[2.5rem_1fr_3.5rem_4rem_4rem_4rem_5rem] gap-1 px-3 py-2 border-b border-border/20 text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
            <span>#</span>
            <span>Player</span>
            <span>Tier</span>
            <span>Poin</span>
            <span>Win</span>
            <span>MVP</span>
            <span className="text-right">Progress</span>
          </div>

          {/* Rows */}
          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Tidak ada data ranking</p>
            )}
            {filtered.map((p: {
              rank: number; id: string; gamertag: string; name: string; tier: string;
              points: number; totalWins: number; totalMvp: number; streak: number;
              maxStreak: number; matches: number; tournamentCount: number; club: string | null;
              upgradeInfo: { shouldUpgrade: boolean; targetTier: string; pointsToNext: number; nextThreshold: number | null };
            }) => (
              <motion.div key={p.id} variants={item}>
                <div
                  className={`grid grid-cols-[2.5rem_1fr_3rem_3.5rem_3.5rem_3.5rem_3rem] sm:grid-cols-[2.5rem_1fr_3.5rem_4rem_4rem_4rem_5rem] gap-1 px-3 py-2 items-center cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/5
                    ${p.upgradeInfo.shouldUpgrade ? 'bg-yellow-500/5' : ''}
                    ${p.rank <= 3 ? 'bg-[#d4a853]/5' : ''}`}
                  onClick={() => setExpandedPlayer(expandedPlayer === p.id ? null : p.id)}
                >
                  <span className={`text-xs font-bold ${p.rank <= 3 ? 'text-[#d4a853]' : 'text-muted-foreground'}`}>
                    {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : p.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{p.gamertag}</p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      {p.streak > 1 && <span className="text-orange-400">🔥{p.streak}</span>}
                      <span>{p.matches} match</span>
                      {p.club && <span>• {p.club}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <TierBadge tier={p.tier} />
                    {p.upgradeInfo.shouldUpgrade && <ArrowUpCircle className="w-3 h-3 text-yellow-500" />}
                  </div>
                  <span className={`text-xs font-bold ${dt.neonText}`}>{p.points}</span>
                  <span className="text-xs text-muted-foreground">{p.totalWins}</span>
                  <span className="text-xs text-muted-foreground">{p.totalMvp}</span>
                  <div className="text-right">
                    {p.tier === 'B' && (
                      <div className="w-full bg-muted/50 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (p.points / (p.upgradeInfo.nextThreshold || 15)) * 100)}%` }} />
                      </div>
                    )}
                    {p.tier === 'A' && (
                      <div className="w-full bg-muted/50 rounded-full h-1.5">
                        <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (p.points / (p.upgradeInfo.nextThreshold || 35)) * 100)}%` }} />
                      </div>
                    )}
                    {p.tier === 'S' && (
                      <span className="text-[9px] text-[#d4a853]">MAX</span>
                    )}
                    <span className="text-[8px] text-muted-foreground block">
                      {p.upgradeInfo.pointsToNext > 0 ? `${p.upgradeInfo.pointsToNext}pt lagi` : '✓'}
                    </span>
                  </div>
                </div>

                {/* ===== EXPANDED DETAIL ===== */}
                {expandedPlayer === p.id && (
                  <div className="px-3 py-3 border-b border-border/10 bg-muted/20">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : playerDetail ? (
                      <div className="space-y-3">
                        {/* Player stats overview */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <TierBadge tier={p.tier} />
                            <span className="text-xs font-semibold">{p.gamertag}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Zap className="w-3 h-3" />{p.points} poin</span>
                            <span>•</span>
                            <span>{p.totalWins} win</span>
                            <span>•</span>
                            <span>{p.totalMvp} MVP</span>
                            <span>•</span>
                            <span>🔥 max {p.maxStreak}</span>
                            <span>•</span>
                            <span>{p.tournamentCount} tournament</span>
                          </div>
                          {p.upgradeInfo.shouldUpgrade && (
                            <Button size="sm" className="text-[10px] h-6 bg-yellow-600 hover:bg-yellow-700 text-white"
                              disabled={upgradePlayerMutation.isPending}
                              onClick={(e) => { e.stopPropagation(); upgradePlayerMutation.mutate(p.id); }}>
                              <ArrowUpCircle className="w-3 h-3 mr-1" /> Upgrade ke {p.upgradeInfo.targetTier}
                            </Button>
                          )}
                        </div>

                        {/* Point breakdown */}
                        {playerDetail.breakdown && Object.keys(playerDetail.breakdown).length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" /> Ringkasan Poin
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(playerDetail.breakdown).map(([reason, amount]: [string, unknown]) => {
                                const info = REASON_LABELS[reason] || { label: reason, icon: '📊', color: 'text-muted-foreground' };
                                return (
                                  <Badge key={reason} className={`text-[9px] border-0 bg-muted/50 ${info.color}`}>
                                    {info.icon} {info.label}: +{amount as number}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Point history */}
                        {playerDetail.pointRecords?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                              <History className="w-3 h-3" /> Riwayat Poin ({playerDetail.pointRecords.length})
                            </p>
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                              {playerDetail.pointRecords.slice(0, 20).map((record: {
                                id: string; amount: number; reason: string; description: string; createdAt: string;
                                tournament: { name: string } | null;
                                match: { round: number; matchNumber: number; bracket: string } | null;
                              }) => {
                                const info = REASON_LABELS[record.reason] || { label: record.reason, icon: '📊', color: 'text-muted-foreground' };
                                return (
                                  <div key={record.id} className="flex items-center justify-between p-1.5 rounded bg-muted/30 text-[10px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span>{info.icon}</span>
                                      <span className={`font-medium ${record.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {record.amount > 0 ? '+' : ''}{record.amount}
                                      </span>
                                      <span className="text-muted-foreground truncate">{record.description}</span>
                                    </div>
                                    <span className="text-muted-foreground shrink-0 ml-2">
                                      {new Date(record.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {(!playerDetail.pointRecords || playerDetail.pointRecords.length === 0) && (
                          <p className="text-[10px] text-muted-foreground text-center py-2">Belum ada riwayat poin</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== POINT SYSTEM EXPLANATION ===== */}
      <Card className={dt.casinoCard}>
        <div className={dt.casinoBar} />
        <CardContent className="p-4 relative z-10">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
            <Award className={`w-4 h-4 ${dt.neonText}`} /> Sistem Poin & Tier
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-muted-foreground">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Cara Mendapat Poin</p>
              <p>🎫 Partisipasi Tournament: <span className="text-green-400">+1 pts</span> (sekali per tournament)</p>
              <p>⚔️ Menang Match: <span className="text-green-400">+2 pts</span> per match menang</p>
              <p>🏆 Hadiah Juara: <span className="text-green-400">prize ÷ anggota tim</span> (dihitung saat finalisasi)</p>
              <p>⭐ MVP: <span className="text-green-400">prize ÷ 1</span> (poin penuh untuk MVP)</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Upgrade Tier (Otomatis)</p>
              <p><span className="text-blue-400">B → A</span>: Minimum {thresholds.B_TO_A} poin terkumpul</p>
              <p><span className="text-yellow-400">A → S</span>: Minimum {thresholds.A_TO_S} poin terkumpul</p>
              <p><span className="text-red-400">S</span>: Tier tertinggi</p>
              <p className="text-muted-foreground/70 mt-1">⚠️ Tier hanya naik, tidak pernah turun. Admin bisa override manual.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
