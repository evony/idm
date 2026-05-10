'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, X, Loader2, Crown, UserPlus, UserMinus,
  Edit3, Trash2, Check, ChevronDown, ChevronUp, Users, Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TierBadge } from './tier-badge';
import { useState } from 'react';
import { toast } from 'sonner';
import { container, item } from '@/lib/animations';
import type { DivisionTheme } from '@/hooks/use-division-theme';

interface ClubManagementProps {
  division: string;
  dt: DivisionTheme;
  seasonId: string | undefined;
  setConfirmDialog: (d: { open: boolean; title: string; description: string; onConfirm: () => void }) => void;
}

interface ClubMemberData {
  id: string;
  role: string;
  player: {
    id: string; gamertag: string; name: string; division: string;
    tier: string; points: number; totalWins: number; totalMvp: number;
    streak: number; avatar: string | null; isActive: boolean;
  };
}

interface ClubData {
  id: string; name: string; division: string; logo: string | null;
  wins: number; losses: number; points: number; gameDiff: number;
  seasonId: string;
  _count?: { members: number };
  members?: ClubMemberData[];
  season?: { name: string; division: string };
}

export function ClubManagement({ division, dt, seasonId, setConfirmDialog }: ClubManagementProps) {
  const qc = useQueryClient();
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [editingClub, setEditingClub] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [searchPlayer, setSearchPlayer] = useState('');
  const [newClubName, setNewClubName] = useState('');

  // Fetch clubs with members
  const { data: clubs, isLoading } = useQuery<ClubData[]>({
    queryKey: ['admin-clubs-manage', division, seasonId],
    queryFn: async () => {
      if (!seasonId) return [];
      const res = await fetch(`/api/clubs?seasonId=${seasonId}`);
      return res.json();
    },
    enabled: !!seasonId,
  });

  // Fetch expanded club detail
  const { data: clubDetail, isLoading: detailLoading } = useQuery<{
    id: string; name: string; logo: string | null;
    members: ClubMemberData[];
  }>({
    queryKey: ['club-detail', expandedClub],
    queryFn: async () => {
      if (!expandedClub) return null;
      const res = await fetch(`/api/clubs/${expandedClub}`);
      return res.json();
    },
    enabled: !!expandedClub,
  });

  // Fetch available players (not in any club in this season)
  const { data: allPlayers } = useQuery({
    queryKey: ['admin-players', division],
    queryFn: async () => {
      const res = await fetch(`/api/players?division=${division}`);
      return res.json();
    },
  });

  // Mutations
  const createClub = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/clubs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, division, seasonId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clubs-manage', division, seasonId] });
      toast.success('Club berhasil dibuat!');
      setNewClubName('');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const editClub = useMutation({
    mutationFn: async ({ clubId, name }: { clubId: string; name: string }) => {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clubs-manage', division, seasonId] });
      qc.invalidateQueries({ queryKey: ['club-detail', expandedClub] });
      toast.success('Club berhasil diperbarui!');
      setEditingClub(null);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const deleteClub = useMutation({
    mutationFn: async (clubId: string) => {
      const res = await fetch(`/api/clubs/${clubId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clubs-manage', division, seasonId] });
      setExpandedClub(null);
      toast.success('Club berhasil dihapus!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const addMember = useMutation({
    mutationFn: async ({ clubId, playerId, role }: { clubId: string; playerId: string; role: string }) => {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-detail', expandedClub] });
      qc.invalidateQueries({ queryKey: ['admin-clubs-manage', division, seasonId] });
      toast.success('Anggota berhasil ditambahkan!');
      setShowAddMember(null);
      setSearchPlayer('');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const removeMember = useMutation({
    mutationFn: async ({ clubId, playerId }: { clubId: string; playerId: string }) => {
      const res = await fetch(`/api/clubs/${clubId}/members?playerId=${playerId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-detail', expandedClub] });
      qc.invalidateQueries({ queryKey: ['admin-clubs-manage', division, seasonId] });
      toast.success('Anggota berhasil dihapus dari club!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const transferCaptain = useMutation({
    mutationFn: async ({ clubId, newCaptainId }: { clubId: string; newCaptainId: string }) => {
      const res = await fetch(`/api/clubs/${clubId}/captain`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCaptainId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['club-detail', expandedClub] });
      toast.success(data.message || 'Captain berhasil dipindahkan!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  // Find players not already in this club
  const clubMemberIds = new Set(clubDetail?.members?.map(m => m.player.id) || []);
  const availablePlayers = allPlayers?.filter((p: { id: string; gamertag: string; name: string; registrationStatus: string; isActive: boolean }) =>
    p.isActive && p.registrationStatus === 'approved' && !clubMemberIds.has(p.id)
  ) || [];

  const filteredPlayers = searchPlayer
    ? availablePlayers.filter((p: { gamertag: string; name: string }) =>
        p.gamertag.toLowerCase().includes(searchPlayer.toLowerCase()) ||
        p.name.toLowerCase().includes(searchPlayer.toLowerCase())
      )
    : availablePlayers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-6 h-6 animate-spin ${dt.neonText}`} />
        <span className="ml-2 text-sm text-muted-foreground">Memuat club...</span>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

      {/* ===== CREATE CLUB ===== */}
      <Card className={dt.casinoCard}>
        <div className={dt.casinoBar} />
        <CardContent className="p-4 relative z-10">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Plus className={`w-4 h-4 ${dt.neonText}`} /> Buat Club Baru
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Nama Club"
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newClubName.trim()) createClub.mutate(newClubName.trim());
              }}
            />
            <Button size="sm"
              disabled={!newClubName.trim() || createClub.isPending}
              onClick={() => createClub.mutate(newClubName.trim())}>
              {createClub.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />} Buat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== CLUBS LIST ===== */}
      {!clubs || clubs.length === 0 ? (
        <div className="text-center py-10">
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada club di season ini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clubs.map((club) => {
            const isExpanded = expandedClub === club.id;
            const isEditing = editingClub === club.id;

            return (
              <motion.div key={club.id} variants={item}>
                <Card className={`${dt.casinoCard} ${dt.casinoGlow}`}>
                  <div className={dt.casinoBar} />
                  <CardContent className="p-0 relative z-10">
                    {/* Club Header Row */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/10 transition-colors"
                      onClick={() => {
                        setExpandedClub(isExpanded ? null : club.id);
                        setEditingClub(null);
                        setShowAddMember(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${dt.iconBg}`}>
                          <Shield className={`w-4 h-4 ${dt.neonText}`} />
                        </div>
                        <div>
                          {isEditing ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-7 text-xs w-40"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && editName.trim()) editClub.mutate({ clubId: club.id, name: editName.trim() });
                                  if (e.key === 'Escape') setEditingClub(null);
                                }}
                              />
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-500"
                                onClick={() => editClub.mutate({ clubId: club.id, name: editName.trim() })}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground"
                                onClick={() => setEditingClub(null)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-semibold">{club.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span className="text-green-500 font-medium">{club.wins}W</span>
                                <span>-</span>
                                <span className="text-red-500 font-medium">{club.losses}L</span>
                                <span>•</span>
                                <span>{club.points} pts</span>
                                <span>•</span>
                                <span>GD: {club.gameDiff > 0 ? '+' : ''}{club.gameDiff}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={dt.casinoBadge}>
                          <Users className="w-3 h-3 mr-1" />
                          {club._count?.members || 0}
                        </Badge>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                            onClick={() => {
                              setEditingClub(club.id);
                              setEditName(club.name);
                            }}>
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => setConfirmDialog({
                              open: true,
                              title: 'Hapus Club?',
                              description: `Club "${club.name}" dan semua keanggotaannya akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
                              onConfirm: () => deleteClub.mutate(club.id),
                            })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* ===== EXPANDED: MEMBERS ===== */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/20 px-3 py-3 space-y-3">
                            {detailLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className={`w-4 h-4 animate-spin ${dt.neonText}`} />
                                <span className="ml-2 text-xs text-muted-foreground">Memuat anggota...</span>
                              </div>
                            ) : (
                              <>
                                {/* Members Header */}
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" /> Anggota ({clubDetail?.members?.length || 0})
                                  </p>
                                  <Button size="sm" className="text-[10px] h-7"
                                    onClick={() => {
                                      setShowAddMember(showAddMember === club.id ? null : club.id);
                                      setSearchPlayer('');
                                    }}>
                                    <UserPlus className="w-3 h-3 mr-1" /> Tambah
                                  </Button>
                                </div>

                                {/* Add Member Panel */}
                                <AnimatePresence>
                                  {showAddMember === club.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-3 rounded-lg bg-muted/30 border border-border/20 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                          <Input
                                            placeholder="Cari player..."
                                            value={searchPlayer}
                                            onChange={(e) => setSearchPlayer(e.target.value)}
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                        <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                                          {filteredPlayers.length === 0 && (
                                            <p className="text-[10px] text-muted-foreground text-center py-2">
                                              {searchPlayer ? 'Tidak ditemukan' : 'Semua player sudah terdaftar di club'}
                                            </p>
                                          )}
                                          {filteredPlayers.slice(0, 10).map((p: { id: string; gamertag: string; name: string; tier: string; points: number }) => (
                                            <div key={p.id} className="flex items-center justify-between p-1.5 rounded bg-card/50 border border-border/10">
                                              <div className="flex items-center gap-2 min-w-0">
                                                <TierBadge tier={p.tier} />
                                                <span className="text-[11px] font-medium truncate">{p.gamertag}</span>
                                                <span className="text-[9px] text-muted-foreground">{p.points}pts</span>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <Button size="sm" variant="ghost" className="h-6 text-[9px] text-muted-foreground hover:text-foreground"
                                                  onClick={() => addMember.mutate({ clubId: club.id, playerId: p.id, role: 'member' })}>
                                                  Member
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-6 text-[9px] text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                                                  onClick={() => addMember.mutate({ clubId: club.id, playerId: p.id, role: 'captain' })}>
                                                  <Crown className="w-3 h-3 mr-0.5" /> Captain
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Member List */}
                                <div className="space-y-1.5">
                                  {clubDetail?.members?.map((member) => (
                                    <div key={member.id}
                                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                                        member.role === 'captain'
                                          ? 'border-yellow-500/20 bg-yellow-500/5'
                                          : 'border-border/20 bg-card/30'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                          member.role === 'captain' ? 'bg-yellow-500/15 text-yellow-500' : dt.iconBg
                                        }`}>
                                          {member.role === 'captain' ? <Crown className="w-3.5 h-3.5" /> : member.player.gamertag.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium truncate">{member.player.gamertag}</span>
                                            <TierBadge tier={member.player.tier} />
                                            {member.role === 'captain' && (
                                              <Badge className="text-[8px] border-0 bg-yellow-500/10 text-yellow-500 h-4 px-1.5">
                                                CAPTAIN
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                                            <span>{member.player.points}pts</span>
                                            <span>•</span>
                                            <span>{member.player.totalWins}W</span>
                                            <span>•</span>
                                            <span>{member.player.totalMvp} MVP</span>
                                            {member.player.streak > 1 && <span className="text-orange-400">🔥{member.player.streak}</span>}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-0.5 shrink-0">
                                        {member.role !== 'captain' && (
                                          <Button size="sm" variant="ghost"
                                            className="h-6 w-6 p-0 text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10"
                                            title="Jadikan Captain"
                                            onClick={() => setConfirmDialog({
                                              open: true,
                                              title: 'Pindahkan Captain?',
                                              description: `Jadikan ${member.player.gamertag} sebagai captain club ${club.name}?`,
                                              onConfirm: () => transferCaptain.mutate({ clubId: club.id, newCaptainId: member.player.id }),
                                            })}>
                                            <Crown className="w-3 h-3" />
                                          </Button>
                                        )}
                                        <Button size="sm" variant="ghost"
                                          className="h-6 w-6 p-0 text-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                                          title="Hapus dari Club"
                                          onClick={() => setConfirmDialog({
                                            open: true,
                                            title: 'Hapus Anggota?',
                                            description: `Hapus ${member.player.gamertag} dari club ${club.name}?${member.role === 'captain' ? ' Captain akan otomatis dipindahkan ke anggota pertama.' : ''}`,
                                            onConfirm: () => removeMember.mutate({ clubId: club.id, playerId: member.player.id }),
                                          })}>
                                          <UserMinus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}

                                  {(!clubDetail?.members || clubDetail.members.length === 0) && (
                                    <p className="text-[10px] text-muted-foreground text-center py-4">Belum ada anggota. Klik "Tambah" untuk menambahkan.</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
