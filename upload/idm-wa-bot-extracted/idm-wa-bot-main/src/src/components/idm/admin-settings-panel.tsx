'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Settings, Database, RefreshCw, Trash2, Download, Upload,
  Shield, Clock, AlertTriangle, Loader2, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';
import { container, item } from '@/lib/animations';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  adminId?: string;
  adminName?: string;
  createdAt: string;
}

export function AdminSettingsPanel() {
  const dt = useDivisionTheme();
  const qc = useQueryClient();
  const { adminAuth } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  // Reseed database
  const reseedDatabase = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/seed?force=true', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to reseed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('Database berhasil di-reseed!');
    },
    onError: () => toast.error('Gagal melakukan reseed'),
  });

  // Export data
  const exportData = async (type: 'players' | 'tournaments' | 'matches' | 'all') => {
    setIsExporting(true);
    try {
      let data: Record<string, unknown> = {};

      if (type === 'players' || type === 'all') {
        const res = await fetch('/api/players?limit=1000');
        data.players = await res.json();
      }
      if (type === 'tournaments' || type === 'all') {
        const res = await fetch('/api/tournaments');
        data.tournaments = await res.json();
      }
      if (type === 'matches' || type === 'all') {
        const res = await fetch('/api/league-matches');
        data.leagueMatches = await res.json();
      }

      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `idm-league-export-${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Data ${type} berhasil di-export!`);
    } catch {
      toast.error('Gagal export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to CSV
  const exportToCSV = async (type: 'players' | 'donations') => {
    setIsExporting(true);
    try {
      let data: Array<Record<string, unknown>> = [];
      let headers: string[] = [];
      let filename = '';

      if (type === 'players') {
        const res = await fetch('/api/players?limit=1000');
        const json = await res.json();
        data = json;
        headers = ['name', 'gamertag', 'division', 'tier', 'points', 'totalWins', 'totalMvp', 'city', 'phone'];
        filename = 'players';
      } else if (type === 'donations') {
        const res = await fetch('/api/donations');
        const json = await res.json();
        data = json.donations || json;
        headers = ['donorName', 'amount', 'message', 'type', 'createdAt'];
        filename = 'donations';
      }

      // Convert to CSV
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const val = row[h];
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`;
          }
          return val ?? '';
        }).join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `idm-league-${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`CSV ${filename} berhasil di-download!`);
    } catch {
      toast.error('Gagal export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Mock activity logs (would come from API in real implementation)
  const activityLogs: ActivityLog[] = [
    { id: '1', action: 'create', entity: 'player', details: 'Added new player "ShadowDancer"', adminName: adminAuth.admin?.username, createdAt: new Date().toISOString() },
    { id: '2', action: 'update', entity: 'match', details: 'Updated score for Week 5', adminName: adminAuth.admin?.username, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', action: 'delete', entity: 'sponsor', details: 'Removed sponsor "Old Brand"', adminName: adminAuth.admin?.username, createdAt: new Date(Date.now() - 7200000).toISOString() },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Admin Info */}
      <motion.div variants={item}>
        <Card className={dt.casinoCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className={`w-4 h-4 ${dt.text}`} />
              Admin Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{adminAuth.admin?.username}</p>
                <p className="text-xs text-muted-foreground">
                  Role: <Badge className="text-[9px] border-0 bg-idm-gold/10 text-idm-gold">{adminAuth.admin?.role}</Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Session Active</p>
                <div className="flex items-center justify-end gap-1 text-green-500 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Online
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={item}>
        <Card className={dt.casinoCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className={`w-4 h-4 ${dt.text}`} />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Options */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Export Data</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => exportData('players')}
                  disabled={isExporting}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Players
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => exportData('tournaments')}
                  disabled={isExporting}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Tournaments
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => exportData('all')}
                  disabled={isExporting}
                >
                  <Download className="w-3 h-3 mr-1" />
                  All Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => exportToCSV('players')}
                  disabled={isExporting}
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-3 border-t border-border/30">
              <Label className="text-xs text-red-500 mb-2 block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Danger Zone
              </Label>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs text-red-500 border-red-500/30 hover:bg-red-500/10">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reseed Database
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reseed Database?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua data saat ini akan dihapus dan diganti dengan data awal.
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => reseedDatabase.mutate()}
                    >
                      {reseedDatabase.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      Reseed
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div variants={item}>
        <Card className={dt.casinoCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className={`w-4 h-4 ${dt.text}`} />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-refresh Dashboard</p>
                <p className="text-xs text-muted-foreground">Refresh data setiap 30 detik</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notifikasi Donasi</p>
                <p className="text-xs text-muted-foreground">Tampilkan popup saat ada donasi baru</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Efek suara untuk event</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Log */}
      <motion.div variants={item}>
        <Card className={dt.casinoCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className={`w-4 h-4 ${dt.text}`} />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    log.action === 'create' ? 'bg-green-500/10 text-green-500' :
                    log.action === 'update' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {log.action === 'create' ? '+' : log.action === 'update' ? '✎' : '×'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium capitalize">{log.action} {log.entity}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{log.details}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
