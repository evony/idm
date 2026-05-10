'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon, Type, Layout, Save, Plus, Trash2, Upload, ChevronDown,
  ChevronUp, Eye, EyeOff, Edit3, X, Loader2, Palette,
  FileText, Settings2, Globe, Sparkles, PanelTop, PanelBottom
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { container, item } from '@/lib/animations';

/* ========== Types ========== */
interface CmsCard {
  id: string;
  sectionId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  linkUrl: string | null;
  tag: string | null;
  tagColor: string | null;
  isActive: boolean;
  order: number;
}

interface CmsSection {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  bannerUrl: string | null;
  isActive: boolean;
  order: number;
  cards: CmsCard[];
}

/* ========== Section Icon Map ========== */
const sectionIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  header: PanelTop,
  hero: Sparkles,
  champions: Layout,
  mvp: Layout,
  clubs: Layout,
  gallery: ImageIcon,
  sawer: Layout,
  cta: Layout,
  footer: PanelBottom,
};

/* ========== Image Upload Button ========== */
function ImageUploadButton({
  value,
  onChange,
  label,
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/cms/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload gagal');
      }
      const data = await res.json();
      onChange(data.url);
      toast.success('Gambar berhasil diupload!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/uploads/image.jpg atau URL"
          className="text-xs flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-[10px] shrink-0"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
          Upload
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      {value && (
        <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/20">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

/* ========== Card Editor ========== */
function CardEditor({
  card,
  onSave,
  onDelete,
  isPending,
}: {
  card: CmsCard;
  onSave: (data: Partial<CmsCard>) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: card.title,
    subtitle: card.subtitle,
    description: card.description,
    imageUrl: card.imageUrl || '',
    linkUrl: card.linkUrl || '',
    tag: card.tag || '',
    tagColor: card.tagColor || '#d4a853',
    isActive: card.isActive,
    order: card.order,
  });

  const handleSave = () => {
    onSave({
      id: card.id,
      sectionId: card.sectionId,
      ...form,
    });
    setEditing(false);
  };

  return (
    <motion.div variants={item} className="group">
      <div className={`p-3 rounded-xl border ${card.isActive ? 'bg-card border-border/50' : 'bg-muted/30 border-border/20 opacity-60'} transition-all`}>
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Judul</label>
                <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="text-xs h-8" placeholder="Judul card" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Subtitle</label>
                <Input value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} className="text-xs h-8" placeholder="Subtitle" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Deskripsi</label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="text-xs min-h-[60px]" placeholder="Deskripsi card" />
            </div>
            <ImageUploadButton label="Gambar Card" value={form.imageUrl} onChange={(url) => setForm(p => ({ ...p, imageUrl: url }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Link URL</label>
                <Input value={form.linkUrl} onChange={(e) => setForm(p => ({ ...p, linkUrl: e.target.value }))} className="text-xs h-8" placeholder="https://..." />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Tag/Badge</label>
                <Input value={form.tag} onChange={(e) => setForm(p => ({ ...p, tag: e.target.value }))} className="text-xs h-8" placeholder="Contoh: Community" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Warna Tag</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={form.tagColor} onChange={(e) => setForm(p => ({ ...p, tagColor: e.target.value }))} className="w-7 h-7 rounded cursor-pointer border-0" />
                  <Input value={form.tagColor} onChange={(e) => setForm(p => ({ ...p, tagColor: e.target.value }))} className="text-[10px] h-7" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Urutan</label>
                <Input type="number" value={form.order} onChange={(e) => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="text-xs h-8" />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant={form.isActive ? 'default' : 'outline'}
                  className={`text-[10px] h-8 w-full ${form.isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                >
                  {form.isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  {form.isActive ? 'Aktif' : 'Nonaktif'}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" className="text-[10px] h-7" onClick={() => setEditing(false)}>Batal</Button>
              <Button size="sm" className="text-[10px] h-7 bg-[#d4a853] hover:bg-[#b8912e] text-black" disabled={isPending} onClick={handleSave}>
                {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            {/* Card Preview */}
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/30 bg-muted/30 shrink-0">
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold truncate">{card.title || 'Untitled Card'}</p>
                {card.tag && (
                  <Badge className="text-[8px] px-1.5 py-0 border-0" style={{ backgroundColor: `${card.tagColor || '#d4a853'}20`, color: card.tagColor || '#d4a853' }}>
                    {card.tag}
                  </Badge>
                )}
                {!card.isActive && <Badge className="text-[8px] bg-muted text-muted-foreground border-0">Nonaktif</Badge>}
              </div>
              {card.subtitle && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{card.subtitle}</p>}
              {card.description && <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{card.description}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ========== Section Editor ========== */
function SectionEditor({
  section,
  onSaveSection,
  onSaveCard,
  onDeleteCard,
  onCreateCard,
  onDeleteSection,
  isPending,
}: {
  section: CmsSection;
  onSaveSection: (data: Partial<CmsSection>) => void;
  onSaveCard: (data: Partial<CmsCard>) => void;
  onDeleteCard: (id: string) => void;
  onCreateCard: (sectionId: string) => void;
  onDeleteSection: (id: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingSection, setEditingSection] = useState(false);
  const [form, setForm] = useState({
    title: section.title,
    subtitle: section.subtitle,
    description: section.description,
    bannerUrl: section.bannerUrl || '',
    isActive: section.isActive,
    order: section.order,
  });

  const IconComponent = sectionIconMap[section.slug] || Layout;

  const handleSaveSection = () => {
    onSaveSection({
      id: section.id,
      slug: section.slug,
      ...form,
    });
    setEditingSection(false);
  };

  return (
    <motion.div variants={item}>
      <Card className={`overflow-hidden border transition-all ${section.isActive ? 'border-border/50' : 'border-border/20 opacity-70'}`}>
        {/* Section Header - Clickable to expand */}
        <div
          className="p-3 cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-3"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-8 h-8 rounded-lg bg-[#d4a853]/10 flex items-center justify-center shrink-0">
            <IconComponent className="w-4 h-4 text-[#d4a853]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{section.title}</p>
              <Badge className="text-[8px] border-0 bg-[#d4a853]/10 text-[#d4a853]">{section.slug}</Badge>
              {!section.isActive && <Badge className="text-[8px] bg-red-500/10 text-red-500 border-0">Nonaktif</Badge>}
            </div>
            {section.subtitle && <p className="text-[10px] text-muted-foreground">{section.subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="text-[9px] border-0 bg-muted text-muted-foreground">{section.cards?.length || 0} card</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            <Separator />

            {/* Section Edit Form */}
            {editingSection ? (
              <div className="space-y-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                <h4 className="text-xs font-semibold flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Edit Section</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Judul Section</label>
                    <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="text-xs h-8" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Subtitle</label>
                    <Input value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} className="text-xs h-8" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Deskripsi</label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="text-xs min-h-[50px]" />
                </div>
                <ImageUploadButton label="Banner Section" value={form.bannerUrl} onChange={(url) => setForm(p => ({ ...p, bannerUrl: url }))} />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Urutan</label>
                    <Input type="number" value={form.order} onChange={(e) => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="text-xs h-8" />
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant={form.isActive ? 'default' : 'outline'}
                      className={`text-[10px] h-8 w-full ${form.isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                    >
                      {form.isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {form.isActive ? 'Aktif' : 'Nonaktif'}
                    </Button>
                  </div>
                  <div className="flex items-end gap-1">
                    <Button size="sm" variant="ghost" className="text-[10px] h-8 flex-1" onClick={() => setEditingSection(false)}>Batal</Button>
                    <Button size="sm" className="text-[10px] h-8 bg-[#d4a853] hover:bg-[#b8912e] text-black" disabled={isPending} onClick={handleSaveSection}>
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Simpan
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{section.description}</p>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => setEditingSection(true)}>
                    <Edit3 className="w-3 h-3 mr-1" /> Edit Section
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[10px] h-7 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDeleteSection(section.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-[#d4a853]" /> Cards ({section.cards?.length || 0})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-7"
                  onClick={() => onCreateCard(section.id)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Tambah Card
                </Button>
              </div>

              {section.cards?.length > 0 ? (
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                  {section.cards.map((card) => (
                    <CardEditor
                      key={card.id}
                      card={card}
                      onSave={onSaveCard}
                      onDelete={() => onDeleteCard(card.id)}
                      isPending={isPending}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="py-6 text-center border border-dashed border-border/30 rounded-xl">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Belum ada card. Klik "Tambah Card" untuk menambahkan.</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

/* ========== Main CMS Panel ========== */
export function CmsPanel() {
  const qc = useQueryClient();

  /* ========== Queries ========== */
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['cms-sections'],
    queryFn: async () => {
      const res = await fetch('/api/cms/sections', { credentials: 'include' });
      return res.json() as Promise<CmsSection[]>;
    },
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/settings', { credentials: 'include' });
      return res.json() as Promise<{ settings: { id: string; key: string; value: string; type: string }[]; map: Record<string, string> }>;
    },
  });

  /* ========== Mutations ========== */
  const saveSection = useMutation({
    mutationFn: async (data: Partial<CmsSection>) => {
      const res = await fetch('/api/cms/sections', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Section berhasil disimpan!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/cms/sections', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Section berhasil dihapus!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const saveCard = useMutation({
    mutationFn: async (data: Partial<CmsCard>) => {
      const res = await fetch('/api/cms/cards', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Card berhasil disimpan!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/cms/cards', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Card berhasil dihapus!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const saveSetting = useMutation({
    mutationFn: async (data: { key: string; value: string; type?: string }) => {
      const res = await fetch('/api/cms/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-settings'] }); toast.success('Setting berhasil disimpan!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const seedCms = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cms/seed', {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-sections'] });
      qc.invalidateQueries({ queryKey: ['cms-settings'] });
      toast.success('CMS content berhasil di-seed!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const createSection = useMutation({
    mutationFn: async (data: { slug: string; title: string; subtitle?: string }) => {
      const res = await fetch('/api/cms/sections', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, order: (sections?.length || 0) + 1, isActive: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Section berhasil dibuat!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  /* ========== Settings Form State ========== */
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  // Initialize settings form when data loads
  if (settingsData?.map && !settingsInitialized) {
    setSettingsForm(settingsData.map);
    setSettingsInitialized(true);
  }

  /* ========== New Section State ========== */
  const [newSection, setNewSection] = useState({ slug: '', title: '' });

  const isPending = saveSection.isPending || saveCard.isPending || deleteSection.isPending || deleteCard.isPending;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#d4a853]" />
          <h2 className="text-lg font-bold text-gradient-fury">CMS Landing Page</h2>
          <Badge className="bg-[#d4a853]/10 text-[#d4a853] text-[10px] border-0">MANAGE</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => seedCms.mutate()}
          disabled={seedCms.isPending}
        >
          {seedCms.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
          Seed Default
        </Button>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-muted/50 h-auto">
          <TabsTrigger value="settings" className="text-xs py-2"><Settings2 className="w-3 h-3 mr-1" />Settings & Branding</TabsTrigger>
          <TabsTrigger value="sections" className="text-xs py-2"><Layout className="w-3 h-3 mr-1" />Sections & Cards</TabsTrigger>
        </TabsList>

        {/* ====== SETTINGS TAB ====== */}
        <TabsContent value="settings">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#d4a853]" />
              </div>
            ) : (
              <>
                {/* Site Identity */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#d4a853]" /> Identitas Situs
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Judul Situs</label>
                        <Input
                          value={settingsForm.site_title || ''}
                          onChange={(e) => setSettingsForm(p => ({ ...p, site_title: e.target.value }))}
                          className="text-sm"
                          placeholder="IDM League"
                        />
                      </div>
                      <ImageUploadButton
                        label="Logo"
                        value={settingsForm.logo_url}
                        onChange={(url) => setSettingsForm(p => ({ ...p, logo_url: url }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        size="sm"
                        className="text-[10px] bg-[#d4a853] hover:bg-[#b8912e] text-black"
                        onClick={() => {
                          saveSetting.mutate({ key: 'site_title', value: settingsForm.site_title || '', type: 'text' });
                          saveSetting.mutate({ key: 'logo_url', value: settingsForm.logo_url || '', type: 'image' });
                        }}
                        disabled={saveSetting.isPending}
                      >
                        {saveSetting.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Identitas
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Hero Settings */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4a853]" /> Hero Section
                    </h3>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Judul Hero</label>
                          <Input
                            value={settingsForm.hero_title || ''}
                            onChange={(e) => setSettingsForm(p => ({ ...p, hero_title: e.target.value }))}
                            className="text-sm"
                            placeholder="Idol Meta"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Subtitle Hero</label>
                          <Input
                            value={settingsForm.hero_subtitle || ''}
                            onChange={(e) => setSettingsForm(p => ({ ...p, hero_subtitle: e.target.value }))}
                            className="text-sm"
                            placeholder="Fan Made Edition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tagline Hero</label>
                        <Textarea
                          value={settingsForm.hero_tagline || ''}
                          onChange={(e) => setSettingsForm(p => ({ ...p, hero_tagline: e.target.value }))}
                          className="text-sm"
                          placeholder="Tempat dancer terbaik berkompetisi..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ImageUploadButton
                          label="Background Desktop"
                          value={settingsForm.hero_bg_desktop}
                          onChange={(url) => setSettingsForm(p => ({ ...p, hero_bg_desktop: url }))}
                        />
                        <ImageUploadButton
                          label="Background Mobile"
                          value={settingsForm.hero_bg_mobile}
                          onChange={(url) => setSettingsForm(p => ({ ...p, hero_bg_mobile: url }))}
                        />
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="text-[10px] bg-[#d4a853] hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSetting.mutate({ key: 'hero_title', value: settingsForm.hero_title || '', type: 'text' });
                        saveSetting.mutate({ key: 'hero_subtitle', value: settingsForm.hero_subtitle || '', type: 'text' });
                        saveSetting.mutate({ key: 'hero_tagline', value: settingsForm.hero_tagline || '', type: 'text' });
                        saveSetting.mutate({ key: 'hero_bg_desktop', value: settingsForm.hero_bg_desktop || '', type: 'image' });
                        saveSetting.mutate({ key: 'hero_bg_mobile', value: settingsForm.hero_bg_mobile || '', type: 'image' });
                      }}
                      disabled={saveSetting.isPending}
                    >
                      {saveSetting.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Hero
                    </Button>
                  </CardContent>
                </Card>

                {/* CTA Text */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Type className="w-4 h-4 text-[#d4a853]" /> Teks CTA
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Teks Tombol Male</label>
                        <Input
                          value={settingsForm.nav_cta_male_text || ''}
                          onChange={(e) => setSettingsForm(p => ({ ...p, nav_cta_male_text: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Teks Tombol Female</label>
                        <Input
                          value={settingsForm.nav_cta_female_text || ''}
                          onChange={(e) => setSettingsForm(p => ({ ...p, nav_cta_female_text: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] bg-[#d4a853] hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSetting.mutate({ key: 'nav_cta_male_text', value: settingsForm.nav_cta_male_text || '', type: 'text' });
                        saveSetting.mutate({ key: 'nav_cta_female_text', value: settingsForm.nav_cta_female_text || '', type: 'text' });
                      }}
                      disabled={saveSetting.isPending}
                    >
                      {saveSetting.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan CTA
                    </Button>
                  </CardContent>
                </Card>

                {/* Footer Settings */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <PanelBottom className="w-4 h-4 text-[#d4a853]" /> Footer
                    </h3>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Teks Footer</label>
                      <Textarea
                        value={settingsForm.footer_text || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, footer_text: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tagline Footer</label>
                      <Input
                        value={settingsForm.footer_tagline || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, footer_tagline: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] bg-[#d4a853] hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSetting.mutate({ key: 'footer_text', value: settingsForm.footer_text || '', type: 'text' });
                        saveSetting.mutate({ key: 'footer_tagline', value: settingsForm.footer_tagline || '', type: 'text' });
                      }}
                      disabled={saveSetting.isPending}
                    >
                      {saveSetting.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Footer
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* ====== SECTIONS TAB ====== */}
        <TabsContent value="sections">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {/* Add new section */}
            <Card className="border border-dashed border-[#d4a853]/30 bg-[#d4a853]/5">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#d4a853]" /> Tambah Section Baru
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Slug (contoh: sponsors)"
                    value={newSection.slug}
                    onChange={(e) => setNewSection(p => ({ ...p, slug: e.target.value }))}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Judul Section"
                    value={newSection.title}
                    onChange={(e) => setNewSection(p => ({ ...p, title: e.target.value }))}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    className="text-xs bg-[#d4a853] hover:bg-[#b8912e] text-black"
                    disabled={!newSection.slug || !newSection.title || createSection.isPending}
                    onClick={() => {
                      createSection.mutate(newSection);
                      setNewSection({ slug: '', title: '' });
                    }}
                  >
                    {createSection.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />} Buat Section
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sections List */}
            {sectionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#d4a853]" />
              </div>
            ) : (sections?.length ?? 0) > 0 ? (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                {sections!.map((section) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onSaveSection={(data) => saveSection.mutate(data)}
                    onSaveCard={(data) => saveCard.mutate(data)}
                    onDeleteCard={(id) => deleteCard.mutate(id)}
                    onCreateCard={(sectionId) => {
                      saveCard.mutate({
                        sectionId,
                        title: 'New Card',
                        subtitle: '',
                        description: '',
                        order: (section.cards?.length || 0) + 1,
                        isActive: true,
                      });
                    }}
                    onDeleteSection={(id) => deleteSection.mutate(id)}
                    isPending={isPending}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="py-12 text-center">
                <Layout className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Belum ada section</p>
                <Button size="sm" className="bg-[#d4a853] hover:bg-[#b8912e] text-black" onClick={() => seedCms.mutate()} disabled={seedCms.isPending}>
                  {seedCms.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Seed Default Content
                </Button>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
