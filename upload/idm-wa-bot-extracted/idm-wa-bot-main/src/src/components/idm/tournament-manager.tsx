'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Play, Users, Zap, Crown, Loader2, Trash2,
  UserPlus, Check, X, Trophy, Gift, Star, ArrowRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TierBadge } from './tier-badge';
import { StatusBadge } from './status-badge';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { container, item } from '@/lib/animations';
import type { DivisionTheme } from '@/hooks/use-division-theme';

interface TournamentManagerProps {
  division: string;
  dt: DivisionTheme;
  stats: { season?: { id: string } } | null;
  setConfirmDialog: (d: { open: boolean; title: string; description: string; onConfirm: () => void }) => void;
}

const STEPS = [
  { key: 'setup', label: 'Setup' },
  { key: 'registration', label: 'Registrasi' },
  { key: 'approval', label: 'Persetujuan' },
  { key: 'team_generation', label: 'Buat Tim' },
  { key: 'bracket_generation', label: 'Buat Bracket' },
  { key: 'main_event', label: 'Main Event' },
  { key: 'finalization', label: 'Finalisasi' },
  { key: 'completed', label: 'Selesai' },
];

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: 'Single Elimination',
  double_elimination: 'Double Elimination',
  group_stage: 'Group Stage + Playoff',
};

const BRACKET_LABELS: Record<string, string> = {
  upper: 'Upper Bracket',
  lower: 'Lower Bracket',
  grand_final: 'Grand Final',
  group: 'Group Stage',
};

export function TournamentManager({ division, dt, stats, setConfirmDialog }: TournamentManagerProps) {
  const qc = useQueryClient();
  const seasonId = stats?.season?.id;

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({
    name: '', weekNumber: '', format: 'single_elimination',
    defaultMatchFormat: 'BO1', prizePool: '', bpm: '128', location: 'Online'
  });
  const [searchPlayer, setSearchPlayer] = useState('');
  const [tierOverrides, setTierOverrides] = useState<Record<string, string>>({});
  const [prizes, setPrizes] = useState<{ label: string; position: number; prizeAmount: number; recipientCount: number; isMvp?: boolean }[]>([
    { label: 'Juara 1', position: 1, prizeAmount: 0, recipientCount: 3, isMvp: false },
    { label: 'Juara 2', position: 2, prizeAmount: 0, recipientCount: 3, isMvp: false },
    { label: 'Juara 3', position: 3, prizeAmount: 0, recipientCount: 3, isMvp: false },
    { label: 'MVP', position: 4, prizeAmount: 0, recipientCount: 1, isMvp: true },
  ]);
  const [selectedMvp, setSelectedMvp] = useState<string>('');
  const [scoreInputs, setScoreInputs] = useState<Record<string, { s1: string; s2: string }>>({});

  // Queries
  const { data: tournaments } = useQuery({
    queryKey: ['admin-tournaments', division],
    queryFn: async () => { const r = await fetch(`/api/tournaments?division=${division}`); return r.json(); },
  });

  const { data: selected } = useQuery({
    queryKey: ['admin-tournament', selectedId],
    queryFn: async () => { if (!selectedId) return null; const r = await fetch(`/api/tournaments/${selectedId}`); return r.json(); },
    enabled: !!selectedId,
  });

  const { data: players } = useQuery({
    queryKey: ['admin-players', division],
    queryFn: async () => { const r = await fetch(`/api/players?division=${division}`); return r.json(); },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch('/api/tournaments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal membuat tournament'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournaments', division] }); toast.success('Tournament berhasil dibuat!'); setNewForm({ name: '', weekNumber: '', format: 'single_elimination', defaultMatchFormat: 'BO1', prizePool: '', bpm: '128', location: 'Online' }); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const r = await fetch(`/api/tournaments/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal update'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournaments', division] }); qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); toast.success('Status diperbarui!'); },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { playerId?: string; playerIds?: string[] } }) => {
      const r = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal register'); }
      return r.json();
    },
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); toast.success(`${res.registered} player terdaftar!`); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const r = await fetch(`/api/tournaments/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal approve'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); toast.success('Player disetujui!'); },
  });

  const generateTeamsMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/tournaments/${id}/generate-teams`, { method: 'POST' });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal generate tim'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournaments', division] }); qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); toast.success('Tim berhasil di-generate!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const generateBracketMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/tournaments/${id}/generate-bracket`, { method: 'POST' });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal generate bracket'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournaments', division] }); qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); toast.success('Bracket berhasil di-generate!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const startMatchMutation = useMutation({
    mutationFn: async ({ tournamentId, matchId }: { tournamentId: string; matchId: string }) => {
      const r = await fetch(`/api/tournaments/${tournamentId}/start-match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal start match'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); toast.success('Match dimulai!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const scoreMutation = useMutation({
    mutationFn: async ({ tournamentId, matchId, score1, score2 }: { tournamentId: string; matchId: string; score1: number; score2: number }) => {
      const r = await fetch(`/api/tournaments/${tournamentId}/score`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, score1, score2 }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal submit skor'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); qc.invalidateQueries({ queryKey: ['admin-tournaments', division] }); toast.success('Skor berhasil disubmit!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const finalizeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const r = await fetch(`/api/tournaments/${id}/finalize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Gagal finalisasi'); }
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournaments', division] }); qc.invalidateQueries({ queryKey: ['admin-tournament', selectedId] }); toast.success('Tournament berhasil difinalisasi! 🎉'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Gagal hapus');
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tournaments', division] }); setSelectedId(null); toast.success('Tournament dihapus'); },
  });

  // Derived data
  const currentStepIdx = STEPS.findIndex(s => s.key === selected?.status);
  const registeredIds = useMemo(() => new Set((selected?.participations || []).map((p: { playerId: string }) => p.playerId)), [selected?.participations]);
  const unregistered = useMemo(() => (players || []).filter((p: { id: string }) => !registeredIds.has(p.id)), [players, registeredIds]);
  const filteredUnregistered = useMemo(() =>
    unregistered.filter((p: { gamertag: string; name: string }) =>
      p.gamertag.toLowerCase().includes(searchPlayer.toLowerCase()) || p.name.toLowerCase().includes(searchPlayer.toLowerCase())
    ), [unregistered, searchPlayer]);

  const pendingApprovals = useMemo(() => (selected?.participations || []).filter((p: { status: string }) => p.status === 'registered'), [selected?.participations]);
  const approvedParticipations = useMemo(() => (selected?.participations || []).filter((p: { status: string }) => ['approved', 'assigned'].includes(p.status)), [selected?.participations]);

  // Tier distribution for approval phase
  const tierDist = useMemo(() => {
    const dist = { S: 0, A: 0, B: 0 };
    for (const p of pendingApprovals) {
      const t = tierOverrides[p.playerId] || p.player?.tier || 'B';
      dist[t as keyof typeof dist]++;
    }
    for (const p of approvedParticipations) {
      const t = p.tierOverride || p.player?.tier || 'B';
      dist[t as keyof typeof dist]++;
    }
    return dist;
  }, [pendingApprovals, approvedParticipations, tierOverrides]);

  const matchesByBracket = (() => {
    if (!selected?.matches) return {};
    const grouped: Record<string, typeof selected.matches> = {};
    for (const m of selected.matches) {
      const key = m.bracket || 'upper';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    }
    return grouped;
  })();

  // Helpers
  const nextMatch = (() => {
    if (!selected?.matches) return null;
    return selected.matches.find((m: { status: string; team1Id: string | null; team2Id: string | null }) =>
      (m.status === 'ready' || m.status === 'pending') && m.team1Id && m.team2Id
    );
  })();

  const getTeamName = (teamId: string | null) => {
    if (!teamId || !selected?.teams) return 'TBD';
    const team = selected.teams.find((t: { id: string }) => t.id === teamId);
    return team?.name || 'TBD';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* ===== CREATE TOURNAMENT ===== */}
      <Card className={dt.casinoCard}>
        <div className={dt.casinoBar} />
        <CardContent className="p-4 relative z-10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Plus className={`w-4 h-4 ${dt.neonText}`} /> Buat Tournament Baru
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input placeholder="Nama Tournament" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Week #" type="number" value={newForm.weekNumber} onChange={e => setNewForm(f => ({ ...f, weekNumber: e.target.value }))} />
            <Select value={newForm.format} onValueChange={v => setNewForm(f => ({ ...f, format: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Single Elimination</SelectItem>
                <SelectItem value="double_elimination">Double Elimination</SelectItem>
                <SelectItem value="group_stage">Group Stage + Playoff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newForm.defaultMatchFormat} onValueChange={v => setNewForm(f => ({ ...f, defaultMatchFormat: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BO1">BO1</SelectItem>
                <SelectItem value="BO3">BO3</SelectItem>
                <SelectItem value="BO5">BO5</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Prize Pool (IDR)" type="number" value={newForm.prizePool} onChange={e => setNewForm(f => ({ ...f, prizePool: e.target.value }))} />
            <Input placeholder="BPM" type="number" value={newForm.bpm} onChange={e => setNewForm(f => ({ ...f, bpm: e.target.value }))} />
            <Input placeholder="Lokasi" value={newForm.location} onChange={e => setNewForm(f => ({ ...f, location: e.target.value }))} />
            <Button size="sm" disabled={!newForm.name || !newForm.weekNumber || !seasonId || createMutation.isPending}
              onClick={() => createMutation.mutate({
                name: newForm.name, weekNumber: parseInt(newForm.weekNumber), division, seasonId,
                format: newForm.format, defaultMatchFormat: newForm.defaultMatchFormat,
                prizePool: parseInt(newForm.prizePool) || 0, bpm: parseInt(newForm.bpm) || 128,
                location: newForm.location || 'Online',
              })}>
              {createMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />} Buat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== TOURNAMENT LIST ===== */}
      <div className="space-y-2">
        {tournaments?.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Belum ada tournament. Buat yang pertama!</p>
        )}
        {tournaments?.map((t: { id: string; name: string; weekNumber: number; status: string; format: string; prizePool: number; _count?: { teams: number; participations: number; matches: number } }) => (
          <motion.div key={t.id} variants={item}>
            <Card className={`${dt.casinoCard} ${dt.casinoGlow} cursor-pointer ${selectedId === t.id ? `ring-1 ring-[#d4a853]` : ''}`}
              onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}>
              <div className={dt.casinoBar} />
              <CardContent className="p-3 relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <StatusBadge status={t.status} />
                      <Badge className="text-[9px] border-0 bg-[#d4a853]/10 text-[#d4a853]">{FORMAT_LABELS[t.format] || t.format}</Badge>
                      <span className="text-[10px] text-muted-foreground">Week {t.weekNumber}</span>
                      <span className="text-[10px] text-muted-foreground">{formatCurrency(t.prizePool)}</span>
                      {t._count && <>
                        <span className="text-[10px] text-muted-foreground">{t._count.teams} tim</span>
                        <span className="text-[10px] text-muted-foreground">{t._count.participations} pemain</span>
                      </>}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {t.status === 'setup' && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => setConfirmDialog({
                          open: true, title: 'Hapus Tournament?',
                          description: `Tournament "${t.name}" akan dihapus permanen.`,
                          onConfirm: () => deleteMutation.mutate(t.id)
                        })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ===== SELECTED TOURNAMENT DETAIL ===== */}
      {selected && (
        <Card className={`${dt.casinoCard} border-[#d4a853]/20`}>
          <div className={dt.casinoBar} />
          <CardContent className="p-4 relative z-10 space-y-4">
            {/* Header + Step Progress */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{selected.name}</h3>
              <div className="flex items-center gap-2">
                <Badge className="text-[9px] border-0 bg-[#d4a853]/10 text-[#d4a853]">{FORMAT_LABELS[selected.format] || selected.format}</Badge>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* Step Progress Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center shrink-0">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium transition-all
                    ${i < currentStepIdx ? 'bg-green-500/10 text-green-500' : i === currentStepIdx ? 'bg-[#d4a853]/10 text-[#d4a853]' : 'bg-muted/50 text-muted-foreground'}`}>
                    {i < currentStepIdx ? <Check className="w-2.5 h-2.5" /> : <span>{i + 1}</span>}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/30 mx-0.5" />}
                </div>
              ))}
            </div>

            <Separator />

            {/* ===== REGISTRATION PHASE ===== */}
            {(selected.status === 'setup' || selected.status === 'registration') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-500">📋 Fase Registrasi</p>
                  {selected.status === 'setup' && (
                    <Button size="sm" variant="outline" className="text-[10px] h-7"
                      onClick={() => updateMutation.mutate({ id: selected.id, data: { status: 'registration' } })}>
                      <ArrowRight className="w-3 h-3 mr-1" /> Buka Registrasi
                    </Button>
                  )}
                </div>

                {selected.status === 'registration' && (
                  <>
                    {/* Bulk register */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-[10px] h-7"
                        disabled={unregistered.length === 0 || registerMutation.isPending}
                        onClick={() => setConfirmDialog({
                          open: true, title: 'Daftarkan Semua Player?',
                          description: `${unregistered.length} player akan didaftarkan ke tournament ini.`,
                          onConfirm: () => registerMutation.mutate({
                            id: selected.id,
                            data: { playerIds: unregistered.map((p: { id: string }) => p.id) }
                          })
                        })}>
                        {registerMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />}
                        Daftarkan Semua ({unregistered.length})
                      </Button>
                      <span className="text-[10px] text-muted-foreground">
                        Terdaftar: {registeredIds.size} / Tersedia: {unregistered.length}
                      </span>
                    </div>

                    {/* Search */}
                    <Input placeholder="🔍 Cari player..." value={searchPlayer} onChange={e => setSearchPlayer(e.target.value)} className="h-8 text-xs" />

                    {/* Available players */}
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredUnregistered.slice(0, 20).map((p: { id: string; gamertag: string; name: string; tier: string; points: number }) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <TierBadge tier={p.tier} />
                            <span className="text-xs font-medium">{p.gamertag}</span>
                            <span className="text-[10px] text-muted-foreground">{p.points}pts</span>
                          </div>
                          <Button size="sm" variant="ghost" className={`h-6 text-[10px] ${dt.neonText}`}
                            onClick={() => registerMutation.mutate({ id: selected.id, data: { playerId: p.id } })}>
                            <UserPlus className="w-3 h-3 mr-1" /> Daftar
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Already registered */}
                    {selected.participations?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Terdaftar ({selected.participations.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {selected.participations.map((p: { id: string; playerId: string; player: { gamertag: string; tier: string }; status: string }) => (
                            <Badge key={p.id} className={`text-[9px] border-0 ${p.status === 'registered' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                              <TierBadge tier={p.player?.tier || 'B'} /> {p.player?.gamertag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advance to approval */}
                    {selected.participations?.length > 0 && (
                      <Button size="sm" className="text-[10px] h-7 bg-[#d4a853] hover:bg-[#d4a853]/80 text-black"
                        onClick={() => updateMutation.mutate({ id: selected.id, data: { status: 'approval' } })}>
                        <ArrowRight className="w-3 h-3 mr-1" /> Lanjut ke Persetujuan
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== APPROVAL PHASE ===== */}
            {selected.status === 'approval' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-yellow-500">⏳ Fase Persetujuan — Set Tier & Prize Pool</p>

                {/* Prize Pool Summary */}
                <div className="p-3 rounded-lg bg-[#d4a853]/5 border border-[#d4a853]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground">Total Peserta Approved:</span>
                    <span className="text-sm font-semibold">{approvedParticipations.length} peserta</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Total Prize Pool:</span>
                    <span className="text-sm font-bold text-[#d4a853]">
                      {formatCurrency(approvedParticipations.length * 20000)}
                      <span className="text-[9px] font-normal text-muted-foreground ml-1">
                        ({approvedParticipations.length} × Rp 20.000)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Tier distribution summary */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-[10px]">Distribusi Tier:</span>
                  <Badge className="text-[9px] border-0 bg-red-500/10 text-red-500">S: {tierDist.S}</Badge>
                  <Badge className="text-[9px] border-0 bg-yellow-500/10 text-yellow-500">A: {tierDist.A}</Badge>
                  <Badge className="text-[9px] border-0 bg-blue-500/10 text-blue-500">B: {tierDist.B}</Badge>
                  {tierDist.S === tierDist.A && tierDist.A === tierDist.B && tierDist.S > 0 ? (
                    <Badge className="text-[9px] border-0 bg-green-500/10 text-green-500">✅ {tierDist.S} tim</Badge>
                  ) : (
                    <Badge className="text-[9px] border-0 bg-red-500/10 text-red-500">
                      ⚠️ Harus S=A=B (butuh {Math.max(tierDist.S, tierDist.A, tierDist.B) - tierDist.S} S, {Math.max(tierDist.S, tierDist.A, tierDist.B) - tierDist.A} A, {Math.max(tierDist.S, tierDist.A, tierDist.B) - tierDist.B} B lagi)
                    </Badge>
                  )}
                </div>

                {/* Pending approvals with tier override */}
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {pendingApprovals.map((p: { id: string; playerId: string; player: { id: string; gamertag: string; tier: string; points: number } }) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                      <div className="flex items-center gap-2">
                        <TierBadge tier={tierOverrides[p.playerId] || p.player.tier} />
                        <span className="text-xs font-medium">{p.player.gamertag}</span>
                        <span className="text-[10px] text-muted-foreground">({p.player.tier}) {p.player.points}pts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Select value={tierOverrides[p.playerId] || p.player.tier}
                          onValueChange={v => setTierOverrides(prev => ({ ...prev, [p.playerId]: v }))}>
                          <SelectTrigger className="w-16 h-6 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-green-500 hover:text-green-400"
                          onClick={() => approveMutation.mutate({
                            id: selected.id,
                            data: { playerId: p.playerId, tier: tierOverrides[p.playerId] || p.player.tier, approve: true }
                          })}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bulk approve */}
                {pendingApprovals.length > 0 && (
                  <Button size="sm" variant="outline" className="text-[10px] h-7"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate({
                      id: selected.id,
                      data: {
                        approvals: pendingApprovals.map((p: { playerId: string; player: { tier: string } }) => ({
                          playerId: p.playerId,
                          tier: tierOverrides[p.playerId] || p.player.tier,
                          approve: true
                        }))
                      }
                    })}>
                    {approveMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    Setujui Semua ({pendingApprovals.length})
                  </Button>
                )}

                {/* Prize Distribution Configuration */}
                {approvedParticipations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/20">
                    <p className="text-[10px] text-muted-foreground">
                      Pembagian Hadiah — Juara 1/2/3: Rp / 1000 / 3 = pts/org | MVP: Rp / 1000 / 1 = pts
                    </p>
                    {prizes.map((prize, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input placeholder="Label" value={prize.label} className="h-7 text-[10px] flex-1"
                          onChange={e => setPrizes(prev => prev.map((p, j) => j === i ? { ...p, label: e.target.value, isMvp: e.target.value.toLowerCase().includes('mvp') } : p))} />
                        <Input placeholder="Hadiah (Rp)" type="number" value={prize.prizeAmount || ''} className="h-7 text-[10px] w-28"
                          onChange={e => setPrizes(prev => prev.map((p, j) => j === i ? { ...p, prizeAmount: parseInt(e.target.value) || 0 } : p))} />
                        <span className="text-[10px] text-muted-foreground w-12 text-center">
                          {prize.isMvp || prize.label.toLowerCase().includes('mvp') ? '÷ 1' : '÷ 3'}
                        </span>
                        <span className="text-[9px] font-medium text-[#d4a853] w-16">
                          = {Math.floor((prize.prizeAmount / 1000) / (prize.isMvp || prize.label.toLowerCase().includes('mvp') ? 1 : 3))} pts{prize.isMvp || prize.label.toLowerCase().includes('mvp') ? '' : '/org'}
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                          onClick={() => setPrizes(prev => prev.filter((_, j) => j !== i))}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="text-[10px] h-7"
                      onClick={() => setPrizes(prev => [...prev, { label: '', position: prev.length + 1, prizeAmount: 0, recipientCount: 3, isMvp: false }])}>
                      <Plus className="w-3 h-3 mr-1" /> Tambah Hadiah
                    </Button>

                    {/* Prize Distribution Summary */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-[10px]">
                      <span>Total Terpakai:</span>
                      <span className={prizes.reduce((sum, p) => sum + p.prizeAmount, 0) === approvedParticipations.length * 20000 ? 'text-green-500 font-semibold' : 'text-red-500'}>
                        {formatCurrency(prizes.reduce((sum, p) => sum + p.prizeAmount, 0))} / {formatCurrency(approvedParticipations.length * 20000)}
                        {prizes.reduce((sum, p) => sum + p.prizeAmount, 0) !== approvedParticipations.length * 20000 && (
                          <span className="ml-1">
                            ({prizes.reduce((sum, p) => sum + p.prizeAmount, 0) > approvedParticipations.length * 20000 ? 'kelebihan' : 'kurang'} {formatCurrency(Math.abs(prizes.reduce((sum, p) => sum + p.prizeAmount, 0) - approvedParticipations.length * 20000))})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Advance to team generation */}
                {pendingApprovals.length === 0 && approvedParticipations.length > 0 && (
                  <Button size="sm" className="text-[10px] h-7 bg-[#d4a853] hover:bg-[#d4a853]/80 text-black"
                    disabled={prizes.filter(p => p.prizeAmount > 0).reduce((sum, p) => sum + p.prizeAmount, 0) !== approvedParticipations.length * 20000 || updateMutation.isPending}
                    onClick={() => setConfirmDialog({
                      open: true, title: 'Generate Tim?',
                      description: `${approvedParticipations.length} player akan dibagi menjadi tim (1S+1A+1B). Total harus habis dibagi 3. Prizes akan disimpan.`,
                      onConfirm: async () => {
                        // Save prizes first
                        await fetch(`/api/tournaments/${selected.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            prizes: prizes.filter(p => p.label && p.prizeAmount > 0).map(p => ({
                              ...p,
                              recipientCount: p.isMvp || p.label.toLowerCase().includes('mvp') ? 1 : 3
                            }))
                          })
                        });
                        // Then generate teams
                        generateTeamsMutation.mutate(selected.id);
                      }
                    })}>
                    {updateMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Users className="w-3 h-3 mr-1" />}
                    Generate Tim
                  </Button>
                )}
              </div>
            )}

            {/* ===== TEAM GENERATION ===== */}
            {(selected.status === 'team_generation' || (selected.status === 'approval' && selected.teams?.length > 0)) && selected.teams?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-green-500">✅ Tim ({selected.teams.length})</p>
                  {selected.status === 'team_generation' && (
                    <Button size="sm" variant="outline" className="text-[10px] h-7"
                      disabled={generateTeamsMutation.isPending}
                      onClick={() => setConfirmDialog({
                        open: true, title: 'Re-generate Tim?',
                        description: 'Tim yang ada akan dihapus dan dibuat ulang secara random.',
                        onConfirm: () => generateTeamsMutation.mutate(selected.id)
                      })}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Re-generate
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.teams.map((t: { id: string; name: string; power: number; isWinner: boolean; rank: number | null; teamPlayers: { player: { gamertag: string; tier: string; points: number } }[] }) => (
                    <div key={t.id} className={`p-2.5 rounded-lg text-xs ${t.isWinner ? 'bg-[#d4a853]/5 border border-[#d4a853]/20' : t.rank ? 'bg-muted/50 border border-border/30' : 'bg-muted/30'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold">{t.name} {t.isWinner && '👑'} {t.rank === 2 && '🥈'} {t.rank === 3 && '🥉'}</span>
                        <span className={dt.neonText}>⚡ {t.power}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.teamPlayers.map((tp: { player: { gamertag: string; tier: string } }) => (
                          <span key={tp.player.gamertag} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
                            <TierBadge tier={tp.player.tier}  /> {tp.player.gamertag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advance to bracket */}
                {selected.status === 'team_generation' && (
                  <Button size="sm" className="text-[10px] h-7 bg-[#d4a853] hover:bg-[#d4a853]/80 text-black"
                    onClick={() => setConfirmDialog({
                      open: true, title: 'Generate Bracket?',
                      description: `Bracket akan di-generate untuk ${selected.teams.length} tim dengan format ${FORMAT_LABELS[selected.format]}.`,
                      onConfirm: () => generateBracketMutation.mutate(selected.id)
                    })}>
                    <Zap className="w-3 h-3 mr-1" /> Generate Bracket
                  </Button>
                )}
              </div>
            )}

            {/* ===== BRACKET / MATCHES ===== */}
            {(selected.status === 'bracket_generation' || selected.status === 'main_event' || selected.status === 'finalization') && selected.matches?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-purple-500">🏆 Bracket & Pertandingan</p>
                  {selected.status === 'bracket_generation' && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="text-[10px] h-7"
                        disabled={generateBracketMutation.isPending}
                        onClick={() => setConfirmDialog({
                          open: true, title: 'Re-generate Bracket?',
                          description: 'Semua match akan dihapus dan dibuat ulang.',
                          onConfirm: () => generateBracketMutation.mutate(selected.id)
                        })}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Re-generate
                      </Button>
                      <Button size="sm" className="text-[10px] h-7 bg-[#d4a853] hover:bg-[#d4a853]/80 text-black"
                        onClick={() => updateMutation.mutate({ id: selected.id, data: { status: 'main_event' } })}>
                        <Play className="w-3 h-3 mr-1" /> Mulai Event!
                      </Button>
                    </div>
                  )}
                </div>

                {/* Next match indicator */}
                {nextMatch && selected.status === 'main_event' && (
                  <div className="p-2 rounded-lg bg-[#d4a853]/5 border border-[#d4a853]/20">
                    <p className="text-[10px] text-[#d4a853] font-semibold">▶️ Match Selanjutnya: {getTeamName(nextMatch.team1Id)} vs {getTeamName(nextMatch.team2Id)}</p>
                  </div>
                )}

                {/* Matches by bracket */}
                {Object.entries(matchesByBracket).map(([bracket, matches]) => (
                  <div key={bracket}>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">{BRACKET_LABELS[bracket] || bracket}</p>
                    <div className="space-y-1.5">
                      {matches.sort((a: { round: number; matchNumber: number }, b: { round: number; matchNumber: number }) => a.round - b.round || a.matchNumber - b.matchNumber).map((m: {
                        id: string; round: number; matchNumber: number; bracket: string; format: string;
                        team1Id: string | null; team2Id: string | null; score1: number | null; score2: number | null;
                        status: string; winnerId: string | null; loserId: string | null; mvpPlayerId: string | null;
                        team1: { name: string; teamPlayers: { player: { gamertag: string; tier: string } }[] } | null;
                        team2: { name: string; teamPlayers: { player: { gamertag: string; tier: string } }[] } | null;
                        winner: { name: string } | null; mvpPlayer: { gamertag: string } | null;
                      }) => (
                        <div key={m.id} className={`p-2.5 rounded-lg border text-xs
                          ${m.status === 'completed' ? 'bg-muted/30 border-border/20' :
                            m.status === 'live' ? 'bg-red-500/5 border-red-500/20' :
                            m.status === 'ready' ? 'bg-green-500/5 border-green-500/20' :
                            'bg-muted/20 border-border/10'}`}>

                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Badge className="text-[8px] border-0 bg-muted/50">R{m.round}M{m.matchNumber}</Badge>
                              <Badge className="text-[8px] border-0 bg-muted/50">{m.format}</Badge>
                              {m.status === 'live' && <Badge className="text-[8px] border-0 bg-red-500/10 text-red-500 animate-pulse">🔴 LIVE</Badge>}
                              {m.status === 'completed' && <Badge className="text-[8px] border-0 bg-green-500/10 text-green-500">✅ Selesai</Badge>}
                              {m.status === 'ready' && <Badge className="text-[8px] border-0 bg-green-500/10 text-green-500">Siap</Badge>}
                              {m.status === 'pending' && <Badge className="text-[8px] border-0 bg-muted/50 text-muted-foreground">Menunggu</Badge>}
                            </div>
                            {m.winner && <span className="text-[#d4a853] font-semibold">👑 {m.winner.name}</span>}
                          </div>

                          {/* Team names */}
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 ${m.winnerId === m.team1Id ? 'font-bold text-[#d4a853]' : ''}`}>
                              {getTeamName(m.team1Id)}
                              {m.team1 && <span className="text-[9px] text-muted-foreground ml-1">({m.team1.teamPlayers.map((tp: { player: { gamertag: string } }) => tp.player.gamertag).join(', ')})</span>}
                            </div>
                            {m.status === 'completed' && m.score1 !== null && m.score2 !== null ? (
                              <span className="font-mono font-bold">{m.score1} - {m.score2}</span>
                            ) : <span className="text-muted-foreground">vs</span>}
                            <div className={`flex-1 text-right ${m.winnerId === m.team2Id ? 'font-bold text-[#d4a853]' : ''}`}>
                              {getTeamName(m.team2Id)}
                              {m.team2 && <span className="text-[9px] text-muted-foreground ml-1">({m.team2.teamPlayers.map((tp: { player: { gamertag: string } }) => tp.player.gamertag).join(', ')})</span>}
                            </div>
                          </div>

                          {m.mvpPlayer && <p className="text-[9px] text-[#d4a853] mt-1">⭐ MVP: {m.mvpPlayer.gamertag}</p>}

                          {/* Actions */}
                          {selected.status === 'main_event' && m.team1Id && m.team2Id && m.status !== 'completed' && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10">
                              {(m.status === 'ready' || m.status === 'pending') && (
                                <Button size="sm" className="text-[10px] h-6 bg-green-600 hover:bg-green-700 text-white"
                                  disabled={startMatchMutation.isPending}
                                  onClick={() => startMatchMutation.mutate({ tournamentId: selected.id, matchId: m.id })}>
                                  <Play className="w-3 h-3 mr-1" /> Start
                                </Button>
                              )}
                              {m.status === 'live' && (
                                <>
                                  <Input type="number" min="0" placeholder={getTeamName(m.team1Id)} className="w-16 h-6 text-[10px]"
                                    value={scoreInputs[m.id]?.s1 || ''}
                                    onChange={e => setScoreInputs(prev => ({ ...prev, [m.id]: { ...prev[m.id], s1: e.target.value, s2: prev[m.id]?.s2 || '' } }))} />
                                  <span className="text-[10px] text-muted-foreground">vs</span>
                                  <Input type="number" min="0" placeholder={getTeamName(m.team2Id)} className="w-16 h-6 text-[10px]"
                                    value={scoreInputs[m.id]?.s2 || ''}
                                    onChange={e => setScoreInputs(prev => ({ ...prev, [m.id]: { ...prev[m.id], s2: e.target.value, s1: prev[m.id]?.s1 || '' } }))} />
                                  <Button size="sm" className="text-[10px] h-6 bg-[#d4a853] hover:bg-[#d4a853]/80 text-black"
                                    disabled={!scoreInputs[m.id]?.s1 || !scoreInputs[m.id]?.s2 || scoreMutation.isPending}
                                    onClick={() => {
                                      const s1 = parseInt(scoreInputs[m.id].s1);
                                      const s2 = parseInt(scoreInputs[m.id].s2);
                                      if (s1 === s2) { toast.error('Skor tidak boleh seri!'); return; }
                                      setConfirmDialog({
                                        open: true, title: 'Konfirmasi Skor?',
                                        description: `${getTeamName(m.team1Id)} ${s1} - ${s2} ${getTeamName(m.team2Id)}`,
                                        onConfirm: () => scoreMutation.mutate({ tournamentId: selected.id, matchId: m.id, score1: s1, score2: s2 })
                                      });
                                    }}>
                                    {scoreMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />} Submit
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Completed matches count */}
                <p className="text-[10px] text-muted-foreground text-center">
                  {selected.matches.filter((m: { status: string }) => m.status === 'completed').length} / {selected.matches.length} match selesai
                </p>
              </div>
            )}

            {/* ===== FINALIZATION ===== */}
            {selected.status === 'finalization' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#d4a853]">🏆 Fase Finalisasi — Pilih MVP & Konfirmasi</p>

                {/* Prize Summary (from approval phase) */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground">Pembagian Hadiah (dari fase persetujuan):</p>
                  {selected.prizes?.length > 0 ? (
                    selected.prizes.map((p: { id: string; label: string; prizeAmount: number; pointsPerPlayer: number; recipientCount: number }) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-[10px]">
                        <span className="font-medium">{p.label}</span>
                        <span className="text-[#d4a853]">
                          {formatCurrency(p.prizeAmount)} → {p.pointsPerPlayer} pts{p.recipientCount > 1 ? `/org × ${p.recipientCount}` : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-red-500">⚠️ Belum ada pembagian hadiah. Kembali ke fase persetujuan.</p>
                  )}
                </div>

                {/* MVP Selection */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Pilih MVP Tournament</p>
                  <Select value={selectedMvp} onValueChange={setSelectedMvp}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Pilih MVP..." /></SelectTrigger>
                    <SelectContent>
                      {selected.participations?.map((p: { playerId: string; pointsEarned: number; player: { id: string; gamertag: string } }) => (
                        <SelectItem key={p.playerId} value={p.playerId}>
                          {p.player.gamertag} ({p.pointsEarned}pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Finalize button */}
                <Button size="sm" className="text-[10px] h-8 bg-[#d4a853] hover:bg-[#d4a853]/80 text-black w-full"
                  disabled={finalizeMutation.isPending || !selected.prizes?.length}
                  onClick={() => setConfirmDialog({
                    open: true, title: 'Finalisasi Tournament?',
                    description: 'Hadiah akan didistribusikan ke pemain. Tournament akan ditandai selesai. Tindakan ini tidak dapat dibatalkan.',
                    onConfirm: () => finalizeMutation.mutate({
                      id: selected.id,
                      data: { mvpPlayerId: selectedMvp || undefined }
                    })
                  })}>
                  {finalizeMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Crown className="w-3 h-3 mr-1" />}
                  Finalisasi Tournament
                </Button>
              </div>
            )}

            {/* ===== COMPLETED ===== */}
            {selected.status === 'completed' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-green-500">🎉 Tournament Selesai!</p>

                {/* Champion / Runner-up / 3rd place */}
                {selected.teams?.filter((t: { rank: number | null }) => t.rank).sort((a: { rank: number }, b: { rank: number }) => (a.rank || 99) - (b.rank || 99)).map((t: { id: string; name: string; rank: number | null; isWinner: boolean; teamPlayers: { player: { gamertag: string; tier: string } }[] }) => (
                  <div key={t.id} className={`p-3 rounded-lg border ${t.rank === 1 ? 'bg-[#d4a853]/5 border-[#d4a853]/20' : t.rank === 2 ? 'bg-gray-500/5 border-gray-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : '🥉'}</span>
                      <div>
                        <p className="text-xs font-semibold">{t.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {t.teamPlayers.map((tp: { player: { gamertag: string; tier: string } }) => (
                            <span key={tp.player.gamertag} className="flex items-center gap-0.5 text-[9px]">
                              <TierBadge tier={tp.player.tier}  /> {tp.player.gamertag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* MVP */}
                {selected.matches?.map((m: { mvpPlayer: { gamertag: string } | null }) => m.mvpPlayer).filter(Boolean).length > 0 && (
                  <div className="p-2 rounded-lg bg-[#d4a853]/5 border border-[#d4a853]/20">
                    <p className="text-[10px] text-[#d4a853]">⭐ MVP: {selected.matches.find((m: { mvpPlayer: { gamertag: string } | null }) => m.mvpPlayer)?.mvpPlayer?.gamertag}</p>
                  </div>
                )}

                {/* Prizes */}
                {selected.prizes?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">Distribusi Hadiah:</p>
                    {selected.prizes.map((p: { id: string; label: string; prizeAmount: number; pointsPerPlayer: number; recipientCount: number }) => (
                      <div key={p.id} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-muted/30">
                        <span>{p.label}</span>
                        <span>{formatCurrency(p.prizeAmount)} → {p.pointsPerPlayer} pts/org × {p.recipientCount} penerima</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Points earned */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Poin yang Didapat:</p>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-0.5">
                    {selected.participations?.sort((a: { pointsEarned: number }, b: { pointsEarned: number }) => b.pointsEarned - a.pointsEarned).map((p: { id: string; playerId: string; pointsEarned: number; isMvp: boolean; isWinner: boolean; player: { gamertag: string } }) => (
                      <div key={p.id} className="flex items-center justify-between text-[10px] p-1 rounded bg-muted/20">
                        <span>{p.player.gamertag} {p.isMvp && '⭐'} {p.isWinner && '👑'}</span>
                        <span className="font-mono">{p.pointsEarned} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
