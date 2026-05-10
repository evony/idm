'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Pencil, Trash2, ExternalLink, Image, Star, Loader2, X, Link
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
import { CloudinaryPicker } from './cloudinary-picker';

interface Sponsor {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
  description: string | null;
  tier: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    tournamentSponsors: number;
    sponsoredPrizes: number;
    banners: number;
  };
}

interface SponsorForm {
  name: string;
  logo: string;
  website: string;
  description: string;
  tier: string;
}

const emptyForm: SponsorForm = {
  name: '',
  logo: '',
  website: '',
  description: '',
  tier: 'bronze',
};

const tierColors: Record<string, string> = {
  platinum: 'bg-gradient-to-r from-slate-300 to-slate-100 text-slate-800',
  gold: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900',
  silver: 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800',
  bronze: 'bg-gradient-to-r from-amber-700 to-amber-600 text-white',
};

const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function AdminSponsorPanel() {
  const dt = useDivisionTheme();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<{ id: string; data: SponsorForm } | null>(null);
  const [formData, setFormData] = useState<SponsorForm>(emptyForm);
  const [cloudinaryOpen, setCloudinaryOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: async () => {
      const res = await fetch('/api/sponsors');
      return res.json();
    },
  });

  // Create mutation
  const createSponsor = useMutation({
    mutationFn: async (data: SponsorForm) => {
      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor berhasil ditambahkan!');
      setFormOpen(false);
      setFormData(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Update mutation
  const updateSponsor = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SponsorForm> }) => {
      const res = await fetch(`/api/sponsors?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor berhasil diperbarui!');
      setFormOpen(false);
      setEditingSponsor(null);
      setFormData(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete mutation
  const deleteSponsor = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sponsors?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Sponsor berhasil dihapus!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Toggle active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/sponsors?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sponsors'] });
      toast.success('Status sponsor diperbarui!');
    },
  });

  const openNewForm = () => {
    setEditingSponsor(null);
    setFormData(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (sponsor: Sponsor) => {
    setEditingSponsor({
      id: sponsor.id,
      data: {
        name: sponsor.name,
        logo: sponsor.logo || '',
        website: sponsor.website || '',
        description: sponsor.description || '',
        tier: sponsor.tier,
      },
    });
    setFormData({
      name: sponsor.name,
      logo: sponsor.logo || '',
      website: sponsor.website || '',
      description: sponsor.description || '',
      tier: sponsor.tier,
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Nama sponsor wajib diisi');
      return;
    }

    if (editingSponsor) {
      updateSponsor.mutate({ id: editingSponsor.id, data: formData });
    } else {
      createSponsor.mutate(formData);
    }
  };

  // Filter sponsors
  const filteredSponsors = (sponsors?.sponsors || [])
    .filter((s: Sponsor) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
      return matchesSearch && matchesTier;
    })
    .sort((a: Sponsor, b: Sponsor) => {
      const tierDiff = (tierOrder[a.tier as keyof typeof tierOrder] || 99) - (tierOrder[b.tier as keyof typeof tierOrder] || 99);
      if (tierDiff !== 0) return tierDiff;
      return a.name.localeCompare(b.name);
    });

  // Group by tier
  const groupedSponsors = filteredSponsors.reduce((acc: Record<string, Sponsor[]>, sponsor: Sponsor) => {
    const tier = sponsor.tier;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(sponsor);
    return acc;
  }, {});

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Cari sponsor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNewForm}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Sponsor
        </Button>
      </div>

      {/* Sponsors List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSponsors).map(([tier, tierSponsors]) => (
            <motion.div key={tier} variants={item}>
              <Card className={dt.casinoCard}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className={`w-4 h-4 ${tier === 'platinum' ? 'text-slate-300' : tier === 'gold' ? 'text-amber-400' : tier === 'silver' ? 'text-slate-400' : 'text-amber-700'}`} />
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsors
                    <Badge className="text-[9px] border-0 bg-muted">{(tierSponsors as Sponsor[]).length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(tierSponsors as Sponsor[]).map((sponsor: Sponsor) => (
                      <div
                        key={sponsor.id}
                        className={`p-3 rounded-xl border ${sponsor.isActive ? 'bg-card border-border/50' : 'bg-muted/30 border-border/30 opacity-60'}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Logo */}
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {sponsor.logo ? (
                              <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium truncate">{sponsor.name}</p>
                              {!sponsor.isActive && (
                                <Badge className="text-[8px] border-0 bg-red-500/10 text-red-500">Inactive</Badge>
                              )}
                            </div>
                            {sponsor.website && (
                              <a
                                href={sponsor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                              >
                                <Link className="w-2.5 h-2.5" />
                                {sponsor.website.replace(/^https?:\/\//, '').split('/')[0]}
                              </a>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                              <span>{sponsor._count?.tournamentSponsors || 0} tournaments</span>
                              <span>•</span>
                              <span>{sponsor._count?.sponsoredPrizes || 0} prizes</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border/30">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px]"
                            onClick={() => toggleActive.mutate({ id: sponsor.id, isActive: !sponsor.isActive })}
                          >
                            {sponsor.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => openEditForm(sponsor)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => setConfirmDialog({
                              open: true,
                              title: 'Hapus Sponsor?',
                              description: `Hapus "${sponsor.name}". Tindakan ini tidak dapat dibatalkan.`,
                              onConfirm: () => deleteSponsor.mutate(sponsor.id),
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
          ))}

          {filteredSponsors.length === 0 && (
            <Card className={dt.casinoCard}>
              <CardContent className="py-8 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada sponsor ditemukan</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openNewForm}>
                  <Plus className="w-3 h-3 mr-1" /> Tambah Sponsor Pertama
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSponsor ? 'Edit Sponsor' : 'Tambah Sponsor Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Logo */}
            <div>
              <Label className="text-xs text-muted-foreground">Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCloudinaryOpen(true)}
                >
                  Pilih Logo
                </Button>
                {formData.logo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => setFormData(p => ({ ...p, logo: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-xs text-muted-foreground">Nama Sponsor <span className="text-red-400">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="Nama brand/perusahaan"
                className="mt-1"
              />
            </div>

            {/* Website */}
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>

            {/* Tier */}
            <div>
              <Label className="text-xs text-muted-foreground">Tier</Label>
              <Select value={formData.tier} onValueChange={(v) => setFormData(p => ({ ...p, tier: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300" /> Platinum
                    </span>
                  </SelectItem>
                  <SelectItem value="gold">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Gold
                    </span>
                  </SelectItem>
                  <SelectItem value="silver">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" /> Silver
                    </span>
                  </SelectItem>
                  <SelectItem value="bronze">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-700" /> Bronze
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground">Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi singkat tentang sponsor..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={createSponsor.isPending || updateSponsor.isPending || !formData.name.trim()}
            >
              {(createSponsor.isPending || updateSponsor.isPending) && (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              )}
              {editingSponsor ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloudinary Picker */}
      <CloudinaryPicker
        open={cloudinaryOpen}
        onClose={() => setCloudinaryOpen(false)}
        onSelect={(url) => {
          setFormData(p => ({ ...p, logo: url }));
          setCloudinaryOpen(false);
        }}
      />

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
