'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Heart, Sparkles, Wallet, Music, Shield,
  Loader2, CheckCircle2, X, ChevronRight, Flame
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

type DonationType = 'weekly' | 'season';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: DonationType;
  defaultAmount?: number;
}

const presetAmounts: { amount: number; label: string; emoji: string }[] = [
  { amount: 5000, label: '5K', emoji: '☕' },
  { amount: 10000, label: '10K', emoji: '🍟' },
  { amount: 25000, label: '25K', emoji: '💎' },
  { amount: 50000, label: '50K', emoji: '🔥' },
  { amount: 100000, label: '100K', emoji: '👑' },
  { amount: 250000, label: '250K', emoji: '🏆' },
];

export function DonationModal({ open, onOpenChange, defaultType = 'weekly', defaultAmount }: DonationModalProps) {
  const dt = useDivisionTheme();
  const division = useAppStore((s) => s.division);
  const addNotification = useAppStore((s) => s.addNotification);

  const [donationType, setDonationType] = useState<DonationType>(defaultType);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(defaultAmount || null);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const finalAmount = customAmount ? parseInt(customAmount.replace(/\D/g, '')) || 0 : (selectedAmount || 0);

  const isFormValid = donorName.trim().length > 0 && finalAmount >= 1000;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donorName.trim(),
          amount: finalAmount,
          message: message.trim() || null,
          type: donationType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitResult({ success: true, message: data.message });
        addNotification('donation', `${donorName.trim()} menyawer ${formatCurrency(finalAmount)}! 🎉`);
        toast.success('Donasi berhasil!', { description: `Terima kasih, ${donorName.trim()}!` });
      } else {
        setSubmitResult({ success: false, message: data.error || 'Gagal memproses donasi' });
      }
    } catch {
      setSubmitResult({ success: false, message: 'Terjadi kesalahan jaringan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitResult(null);
      setSelectedAmount(null);
      setCustomAmount('');
      setDonorName('');
      setMessage('');
      onOpenChange(false);
    }
  };

  const typeConfig = {
    weekly: {
      icon: Gift,
      title: 'Sawer Prize Pool',
      subtitle: 'Sawer untuk menambah hadiah mingguan tournament',
      accent: '#d4a853',
      accentLight: '#e8d5a3',
      gradient: 'from-[#d4a853] to-[#e8d5a3]',
      bgAccent: 'bg-[#d4a853]',
      borderAccent: 'border-[#d4a853]',
      textAccent: 'text-[#d4a853]',
      bgSubtle: 'bg-[#d4a853]/5',
      borderSubtle: 'border-[#d4a853]/20',
      hoverBg: 'hover:bg-[#d4a853]/15',
      emoji: '💰',
    },
    season: {
      icon: Sparkles,
      title: 'Donasi Liga',
      subtitle: 'Donasi untuk mendanai liga season berikutnya',
      accent: '#22d3ee',
      accentLight: '#67e8f9',
      gradient: 'from-[#06b6d4] to-[#22d3ee]',
      bgAccent: 'bg-[#22d3ee]',
      borderAccent: 'border-[#22d3ee]',
      textAccent: 'text-[#22d3ee]',
      bgSubtle: 'bg-[#22d3ee]/5',
      borderSubtle: 'border-[#22d3ee]/20',
      hoverBg: 'hover:bg-[#22d3ee]/15',
      emoji: '✨',
    },
  };

  const config = typeConfig[donationType];
  const TypeIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
        {/* Accessible title - visually hidden */}
        <DialogHeader className="sr-only">
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.subtitle}</DialogDescription>
        </DialogHeader>
        {/* Header with animated gradient */}
        <div className={`relative h-28 bg-gradient-to-br ${config.gradient} overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20" />
          {/* Animated sparkles */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10 flex items-center gap-3 p-5 h-full">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <TypeIcon className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-black text-white drop-shadow-sm">{config.title}</h2>
              <p className="text-[11px] text-white/80 max-w-[220px]">{config.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Success State */}
          <AnimatePresence>
            {submitResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6"
              >
                {submitResult.success ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4"
                    >
                      <CheckCircle2 className="w-9 h-9 text-green-500" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-green-500 mb-1">Berhasil! 🎉</h3>
                    <p className="text-sm text-muted-foreground mb-1">{submitResult.message}</p>
                    <p className="text-xs text-muted-foreground/70">
                      {donorName} — {formatCurrency(finalAmount)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      onClick={handleClose}
                    >
                      Tutup
                    </Button>
                  </>
                ) : (
                  <>
                    <X className="w-9 h-9 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-red-500 mb-1">Gagal</h3>
                    <p className="text-sm text-muted-foreground">{submitResult.message}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setSubmitResult(null)}
                    >
                      Coba Lagi
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          {!submitResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Type Toggle */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Jenis Dukungan</label>
                <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => { setDonationType('weekly'); }}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      donationType === 'weekly'
                        ? `${config.bgAccent} text-white shadow-md`
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Sawer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDonationType('season'); }}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      donationType === 'season'
                        ? `${config.bgAccent} text-white shadow-md`
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Donasi
                  </button>
                </div>
              </div>

              {/* Preset Amounts */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Pilih Nominal</label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((btn) => (
                    <motion.button
                      key={btn.amount}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelectedAmount(btn.amount); setCustomAmount(''); }}
                      className={`px-2 py-3 rounded-xl border text-center transition-all duration-200 ${
                        selectedAmount === btn.amount && !customAmount
                          ? `${config.borderAccent} ${config.bgSubtle} ${config.textAccent} border-2 shadow-sm`
                          : `border-border/50 bg-background/50 ${config.hoverBg} hover:border-border`
                      }`}
                    >
                      <span className="text-base">{btn.emoji}</span>
                      <p className={`text-xs font-bold mt-0.5 ${selectedAmount === btn.amount && !customAmount ? config.textAccent : ''}`}>
                        Rp {btn.label}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Atau Masukkan Nominal Lain
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 75000"
                    value={customAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustomAmount(val);
                      if (val) setSelectedAmount(null);
                    }}
                    className="pl-9 font-semibold"
                  />
                  {customAmount && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {formatCurrency(parseInt(customAmount) || 0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Donor Name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Nama / Nick <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Masukkan nama kamu"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="pl-9"
                    maxLength={30}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Pesan <span className="text-muted-foreground/50 text-[10px]">(opsional)</span>
                </label>
                <Textarea
                  placeholder="Tulis pesan semangat atau dukungan..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                  maxLength={200}
                />
                {message.length > 0 && (
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5 text-right">{message.length}/200</p>
                )}
              </div>

              {/* Summary & Submit */}
              <div className={`rounded-xl ${config.bgSubtle} ${config.borderSubtle} border p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Total {donationType === 'weekly' ? 'Sawer' : 'Donasi'}</span>
                  <span className={`text-lg font-black ${config.textAccent}`}>
                    {formatCurrency(finalAmount || 0)}
                  </span>
                </div>
                <Button
                  className={`w-full font-bold bg-gradient-to-r ${config.gradient} text-black hover:opacity-90 transition-opacity`}
                  size="lg"
                  disabled={!isFormValid || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <span className="mr-1">{config.emoji}</span>
                  )}
                  {isSubmitting
                    ? 'Memproses...'
                    : `${donationType === 'weekly' ? 'Sawer' : 'Donasi'} Sekarang`
                  }
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground/60">
                {donationType === 'weekly'
                  ? '💰 Sawer langsung menambah prize pool tournament mingguan'
                  : '✨ Donasi membantu mendanai liga season berikutnya'
                }
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
