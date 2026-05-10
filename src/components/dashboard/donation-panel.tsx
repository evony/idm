'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Heart, Send, Zap, Sparkles, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cdnImage } from '@/lib/utils'

interface DonationPanelProps {
  donations: {
    id: string
    donorName: string
    amount: number
    message: string | null
    isAnonymous: boolean
    createdAt: string
    player: { id: string; name: string; avatarUrl: string | null } | null
    tournament: { id: string; name: string; division: string }
  }[]
  prizePool: number
  tournamentId: string | null
  onDonationComplete?: () => void
  division?: string
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

// Division color system
function getDivisionTheme(division?: string) {
  if (division === 'MALE') {
    return {
      coinIcon: 'text-cyan-400',
      liveBg: 'bg-cyan-500/10', liveBorder: 'border-cyan-500/20', liveText: 'text-cyan-400', liveDot: 'bg-cyan-400',
      barGradient: 'from-cyan-500 via-cyan-400 to-cyan-300',
      barGlow: 'shadow-cyan-400/40',
      btnGradient: 'from-cyan-500 via-cyan-400 to-cyan-500',
      btnGlow: 'shadow-cyan-400/30',
      quickActive: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
      accentBorder: 'border-cyan-400/20',
      accentBg: 'bg-cyan-500/8',
      medalColors: ['bg-cyan-400/20 text-cyan-300 border-cyan-400/30', 'bg-slate-300/20 text-slate-300 border-slate-400/30', 'bg-sky-400/20 text-sky-300 border-sky-400/30'],
      bottomBars: ['bg-cyan-400/50', 'bg-slate-400/40', 'bg-sky-400/40'],
      submitGradient: 'from-cyan-500 via-cyan-400 to-cyan-500',
      submitGlow: 'shadow-cyan-400/25',
      amountColor: 'text-cyan-400/70',
      donorBorder: 'border-l-cyan-400/30',
      heartColor: 'text-cyan-300/50',
    }
  }
  if (division === 'FEMALE') {
    return {
      coinIcon: 'text-pink-300',
      liveBg: 'bg-pink-300/10', liveBorder: 'border-pink-300/20', liveText: 'text-pink-300', liveDot: 'bg-pink-300',
      barGradient: 'from-pink-400 via-pink-300 to-pink-200',
      barGlow: 'shadow-pink-300/40',
      btnGradient: 'from-pink-400 via-pink-300 to-pink-400',
      btnGlow: 'shadow-pink-300/30',
      quickActive: 'bg-pink-300/15 border-pink-300/30 text-pink-300',
      accentBorder: 'border-pink-300/20',
      accentBg: 'bg-pink-300/8',
      medalColors: ['bg-pink-300/20 text-pink-300 border-pink-300/30', 'bg-slate-300/20 text-slate-300 border-slate-400/30', 'bg-rose-300/20 text-rose-300 border-rose-300/30'],
      bottomBars: ['bg-pink-300/50', 'bg-slate-400/40', 'bg-rose-300/40'],
      submitGradient: 'from-pink-400 via-pink-300 to-pink-400',
      submitGlow: 'shadow-pink-300/25',
      amountColor: 'text-pink-300/70',
      donorBorder: 'border-l-pink-300/30',
      heartColor: 'text-pink-300/50',
    }
  }
  return {
    coinIcon: 'text-emerald-400',
    liveBg: 'bg-emerald-500/10', liveBorder: 'border-emerald-500/20', liveText: 'text-emerald-400', liveDot: 'bg-emerald-400',
    barGradient: 'from-emerald-500 via-emerald-400 to-emerald-300',
    barGlow: 'shadow-emerald-400/40',
    btnGradient: 'from-emerald-500 via-emerald-400 to-emerald-500',
    btnGlow: 'shadow-emerald-400/30',
    quickActive: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    accentBorder: 'border-emerald-400/20',
    accentBg: 'bg-emerald-500/8',
    medalColors: ['bg-emerald-400/20 text-emerald-300 border-emerald-400/30', 'bg-slate-300/20 text-slate-300 border-slate-400/30', 'bg-teal-400/20 text-teal-300 border-teal-400/30'],
    bottomBars: ['bg-emerald-400/50', 'bg-slate-400/40', 'bg-teal-400/40'],
    submitGradient: 'from-emerald-500 via-emerald-400 to-emerald-500',
    submitGlow: 'shadow-emerald-400/25',
    amountColor: 'text-emerald-400/70',
    donorBorder: 'border-l-emerald-400/30',
    heartColor: 'text-emerald-300/50',
  }
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function DonationPanel({ donations, prizePool, tournamentId, onDonationComplete, division }: DonationPanelProps) {
  const [donorName, setDonorName] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)

  const theme = getDivisionTheme(division)
  const totalDonated = donations.reduce((s, d) => s + d.amount, 0)
  const goal = Math.max(prizePool, 500000)
  const progressPct = Math.min((totalDonated / goal) * 100, 100)

  // Top donors aggregation
  const topDonors = donations
    .filter(d => !d.isAnonymous)
    .reduce<Record<string, number>>((acc, d) => {
      acc[d.donorName] = (acc[d.donorName] || 0) + d.amount
      return acc
    }, {})

  const sortedDonors = Object.entries(topDonors).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const handleSubmit = async () => {
    if (!tournamentId || !amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          donorName: isAnonymous ? 'Anonymous' : (donorName || 'Anonymous'),
          amount: Number(amount),
          message: message || undefined,
          isAnonymous,
        }),
      })
      if (res.ok) {
        setSuccessFlash(true)
        setTimeout(() => setSuccessFlash(false), 1500)
        setDonorName('')
        setAmount('')
        setMessage('')
        setDialogOpen(false)
        onDonationComplete?.()
      }
    } catch (err) {
      console.error('Donation failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const quickAmounts = [10000, 25000, 50000, 100000]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: '1000px' }}
      className="rounded-3xl border border-border overflow-hidden bg-card"
    >
      {/* Frosted glass header */}
      <div className="relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${cdnImage('/images/sawer-live.png')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-card" />

        {/* Header content */}
        <div className="relative z-10 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-background/20 backdrop-blur-xl border border-border/40">
              <Coins className={`h-4 w-4 ${theme.coinIcon}`} />
              <h3 className="font-semibold text-sm text-foreground">Live Sawer</h3>
              <Sparkles className="h-3 w-3 text-amber-400/60" />
            </div>
            {/* Live indicator */}
            <span className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl ${theme.liveBg} backdrop-blur-xl border ${theme.liveBorder} text-[10px] font-bold uppercase tracking-wider ${theme.liveText}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.liveDot} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.liveDot}`} />
              </span>
              Live
            </span>
          </div>
          <p className="text-xs text-muted-foreground/60 ml-1">Support the tournament prize pool</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 space-y-5">
        {/* Progress bar with division gradient + shimmer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground tabular-nums">{formatRupiah(totalDonated)}</span>
            <span className="text-xs text-muted-foreground/50 tabular-nums">{formatRupiah(goal)}</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-muted/40 overflow-hidden">
            {/* Glow behind bar */}
            {progressPct > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className={`absolute top-0 left-0 h-full rounded-full blur-sm ${theme.barGlow}`}
                style={{ width: `${progressPct}%`, background: 'currentColor' }}
              />
            )}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient} relative`}
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2.5s_infinite]" />
            </motion.div>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">
              {progressPct.toFixed(1)}% tercapai
            </span>
          </div>
        </div>

        {/* Top donors podium (1st, 2nd, 3rd with medals) */}
        {sortedDonors.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 font-bold">Top Donatur</p>
            <div className="flex items-end justify-center gap-2">
              {sortedDonors.slice(0, 3).map(([name, amt], i) => {
                const displayOrder = i === 0 ? 1 : i === 1 ? 0 : 2
                const heights = ['h-[72px]', 'h-[56px]', 'h-[44px]']
                const isFirst = i === 0
                const medals = ['🥇', '🥈', '🥉']

                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springTransition, delay: i * 0.1 }}
                    className="flex-1 flex flex-col items-center"
                    style={{ order: displayOrder }}
                  >
                    <span className={`text-${isFirst ? '2xl' : 'xl'} mb-1`}>{medals[i]}</span>
                    <div className={`${heights[i]} w-full rounded-t-2xl bg-muted/20 backdrop-blur-sm border border-border/40 border-b-0 flex flex-col items-center justify-end p-2.5 transition-all duration-300 hover:bg-muted/30`}>
                      <p className={`font-bold ${isFirst ? 'text-xs' : 'text-[10px]'} text-foreground truncate max-w-full`}>{name}</p>
                      <p className={`text-[9px] ${theme.amountColor} font-semibold mt-0.5`}>{formatRupiah(amt)}</p>
                    </div>
                    <div className={`w-full h-1 rounded-b-sm ${theme.bottomBars[i] || 'bg-muted/30'}`} />
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Remaining top donors (4th, 5th) */}
        {sortedDonors.length > 3 && (
          <div className="flex gap-2">
            {sortedDonors.slice(3).map(([name, amt], i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-muted/20 border border-border/40"
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-muted/40 text-muted-foreground/60">
                  {i + 4}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/80 truncate">{name}</p>
                </div>
                <p className={`text-[10px] ${theme.amountColor} font-semibold`}>{formatRupiah(amt)}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent donations with division accent */}
        {donations.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 font-bold">Donasi Terbaru</p>
            <ScrollArea className="max-h-36">
              <div className="space-y-1">
                {donations.slice(0, 8).map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className={`flex items-center gap-2.5 text-xs py-2 px-3 rounded-2xl hover:bg-muted/15 transition-colors border-l-2 ${theme.donorBorder}`}
                  >
                    <Heart className={`h-3 w-3 ${theme.heartColor} shrink-0`} />
                    <span className="text-foreground/70 truncate">{d.isAnonymous ? 'Anonymous' : d.donorName}</span>
                    {d.message && (
                      <span className="text-muted-foreground/40 truncate text-[10px] hidden sm:inline">&middot; {d.message}</span>
                    )}
                    <span className={`${theme.amountColor} font-semibold ml-auto shrink-0`}>{formatRupiah(d.amount)}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Glowing "Sawer Sekarang" button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full group cursor-pointer"
            >
              {/* Outer glow */}
              <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${theme.btnGradient} blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
              <div className={`relative flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.btnGradient} text-white font-bold text-sm shadow-lg ${theme.btnGlow} transition-all duration-300`}>
                <Zap className="h-4 w-4" />
                Sawer Sekarang
                <span className={`absolute inset-0 rounded-2xl animate-[pulse-ring_2.5s_ease-out_infinite] border ${theme.accentBorder}`} />
              </div>
            </motion.button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2.5 text-base">
                <div className={`flex items-center justify-center h-8 w-8 rounded-2xl ${theme.accentBg}`}>
                  <Coins className={`h-4 w-4 ${theme.coinIcon}`} />
                </div>
                Sawer / Donasi
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-3">
                <Input
                  placeholder="Nama Donatur"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  disabled={isAnonymous}
                  className="bg-muted/20 border-border rounded-2xl h-11 text-foreground/80 placeholder:text-muted-foreground/40 focus:border-ring/30"
                />
                <Input
                  placeholder="Jumlah (Rp)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-muted/20 border-border rounded-2xl h-11 text-foreground/80 placeholder:text-muted-foreground/40 focus:border-ring/30"
                />
                {/* Quick-select buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((val) => (
                    <motion.button
                      key={val}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAmount(String(val))}
                      className={`text-[10px] font-medium py-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        amount === String(val)
                          ? theme.quickActive
                          : 'bg-muted/20 border-border text-muted-foreground/60 hover:bg-muted/30'
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}K` : formatRupiah(val)}
                    </motion.button>
                  ))}
                </div>
                <Input
                  placeholder="Pesan (opsional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-muted/20 border-border rounded-2xl h-11 text-foreground/80 placeholder:text-muted-foreground/40 focus:border-ring/30"
                />
                <label className="flex items-center gap-2.5 text-sm cursor-pointer text-muted-foreground py-1">
                  <div
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                      isAnonymous
                        ? `${theme.quickActive} border-current`
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    {isAnonymous && <Check className="h-3 w-3" />}
                  </div>
                  Donasi sebagai Anonymous
                </label>
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting || !amount || Number(amount) <= 0}
                className="relative w-full group disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${theme.submitGradient} blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
                <div className={`relative flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r ${theme.submitGradient} text-white font-semibold text-sm shadow-lg transition-all duration-200`}>
                  <AnimatePresence mode="wait">
                    {successFlash ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Berhasil!
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {submitting ? 'Mengirim...' : `Sawer ${amount ? formatRupiah(Number(amount)) : ''}`}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}
