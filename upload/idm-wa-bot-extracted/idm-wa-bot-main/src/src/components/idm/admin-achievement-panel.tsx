'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Award, Plus, Pencil, Trash2, Users, Loader2, X, Star, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { container, item } from '@/lib/animations';

interface Achievement {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  tier: string;
  criteria: string;
  rewardPoints: number;
  isActive: boolean;
  _count?: {
    playerAchievements: number;
  };
}

interface PlayerWithAchievements {
  id: string;
  gamertag: string;
  name: string;
  avatar: string | null;
  division: string;
  _count?: {
    achievements: number;
  };
}

const categoryIcons: Record<string, typeof Award> = {
  tournament: Award,
  mvp: Star,
  points: Zap,
  club: Users,
};

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-slate-400 text-white',
  gold: 'bg-amber-500 text-white',
  platinum: 'bg-gradient-to-r from-slate-300 to-cyan-200 text-slate-800',
  diamond: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
};

export function AdminAchievementPanel() {
  const dt = useDivisionTheme();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  // Fetch achievements
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['admin-achievements'],
    queryFn: async () => {
      const res = await fetch('/api/achievements');
      return res.json();
    },
  });

  // Fetch players for assignment
  const { data: players } = useQuery({
    queryKey: ['admin-players-all'],
    queryFn: async () => {
      const res = await fetch('/api/players?limit=100');
      return res.json();
    },
  });

  // Create/Update achievement
  const saveAchievement = useMutation({
    mutationFn: async (data: Partial<Achievement> & { id?: string }) => {
      const url = data.id ? `/api/achievements/${data.id}` : '/api/achievements';
      const method = data.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast.success('Achievement berhasil disimpan!');
      setFormOpen(false);
      setSelectedAchievement(null);
    },
  });

  // Delete achievement
  const deleteAchievement = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/achievements?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast.success('Achievement berhasil dihapus!');
    },
  });

  // Toggle active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/achievements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast.success('Status achievement diperbarui!');
    },
  });

  // Assign achievement to player
  const assignAchievement = useMutation({
    mutationFn: async ({ playerId, achievementId }: { playerId: string; achievementId: string }) => {
      const res = await fetch('/api/players/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ playerId, achievementId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-achievements'] });
      qc.invalidateQueries({ queryKey: ['admin-players-all'] });
      toast.success('Achievement berhasil diberikan!');
      setAssignOpen(false);
    },
  });

  // Filter achievements
  const filteredAchievements = (achievements?.achievements || [])
    .filter((a: Achievement) => {
      const matchesSearch = a.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

  // Group by category
  const groupedAchievements = filteredAchievements.reduce((acc: Record<string, Achievement[]>, achievement: Achievement) => {
    const cat = achievement.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(achievement);
    return acc;
  }, {});

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Cari achievement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="tournament">Tournament</SelectItem>
              <SelectItem value="mvp">MVP</SelectItem>
              <SelectItem value="points">Points</SelectItem>
              <SelectItem value="club">Club</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            <Users className="w-4 h-4 mr-1" /> Assign
          </Button>
          <Button onClick={() => { setSelectedAchievement(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Tambah
          </Button>
        </div>
      </div>

      {/* Achievements List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedAchievements).map(([category, catAchievements]) => {
            const CatIcon = categoryIcons[category] || Award;
            return (
              <motion.div key={category} variants={item}>
                <Card className={dt.casinoCard}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 capitalize">
                      <CatIcon className={`w-4 h-4 ${dt.text}`} />
                      {category} Achievements
                      <Badge className="text-[9px] border-0 bg-muted">{(catAchievements as Achievement[]).length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(catAchievements as Achievement[]).map((achievement: Achievement) => (
                        <div
                          key={achievement.id}
                          className={`p-3 rounded-xl border ${achievement.isActive ? 'bg-card border-border/50' : 'bg-muted/30 border-border/30 opacity-60'}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${tierColors[achievement.tier] || 'bg-muted'}`}>
                              {achievement.icon}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium truncate">{achievement.displayName}</p>
                                {!achievement.isActive && (
                                  <Badge className="text-[8px] border-0 bg-red-500/10 text-red-500">Inactive</Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{achievement.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                <Badge className={`text-[9px] border-0 ${tierColors[achievement.tier] || ''}`}>
                                  {achievement.tier}
                                </Badge>
                                {achievement.rewardPoints > 0 && (
                                  <span className="text-green-500">+{achievement.rewardPoints} pts</span>
                                )}
                                <span>•</span>
                                <span>{achievement._count?.playerAchievements || 0} earned</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border/30">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[10px]"
                              onClick={() => toggleActive.mutate({ id: achievement.id, isActive: !achievement.isActive })}
                            >
                              {achievement.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => { setSelectedAchievement(achievement); setFormOpen(true); }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => setConfirmDialog({
                                open: true,
                                title: 'Hapus Achievement?',
                                description: `Hapus "${achievement.displayName}". Tindakan ini tidak dapat dibatalkan.`,
                                onConfirm: () => deleteAchievement.mutate(achievement.id),
                              })}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filteredAchievements.length === 0 && (
            <Card className={dt.casinoCard}>
              <CardContent className="py-8 text-center">
                <Award className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada achievement ditemukan</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Achievement Form Dialog - Simplified */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAchievement ? 'Edit Achievement' : 'Tambah Achievement'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground">
            Achievement management akan diimplementasikan lebih lanjut.
            <br />
            Gunakan tombol "Assign" untuk memberikan achievement ke player.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Achievement Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Achievement ke Player</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Achievement selector - would be a select */}
            <div>
              <Label className="text-xs text-muted-foreground">Pilih Achievement</Label>
              <Select onValueChange={(val) => setSelectedAchievement(
                achievements?.achievements?.find((a: Achievement) => a.id === val)
              )}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih achievement..." />
                </SelectTrigger>
                <SelectContent>
                  {(achievements?.achievements || []).map((a: Achievement) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <span>{a.icon}</span>
                        <span>{a.displayName}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Players list */}
            <div>
              <Label className="text-xs text-muted-foreground">Pilih Player</Label>
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                {(players || []).slice(0, 20).map((p: PlayerWithAchievements) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      if (selectedAchievement) {
                        assignAchievement.mutate({
                          playerId: p.id,
                          achievementId: selectedAchievement.id,
                        });
                      } else {
                        toast.error('Pilih achievement terlebih dahulu');
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.gamertag} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{p.gamertag}</p>
                        <p className="text-[10px] text-muted-foreground">{p.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] border-0 bg-muted">
                        {p._count?.achievements || 0} 🏆
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px]">
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
