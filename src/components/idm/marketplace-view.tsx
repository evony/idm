'use client';

import { ShoppingBag, Zap, TrendingUp, Flame, ShieldCheck, Sparkles } from 'lucide-react';
import { CommunityMarketplace } from './community-dashboard/community-marketplace';

/* ═══════════════════════════════════════════════════════
   GOLD-ANCHORED THEME — consistent with app identity
   ═══════════════════════════════════════════════════════ */
const GOLD = {
  primary: '#d4a853',
  light: '#f5d78e',
  dark: '#a07c30',
  glow: 'rgba(212,168,83,0.08)',
};

/* ═══════════════════════════════════════════════════════
   MARKETPLACE VIEW — Gold-anchored
   ═══════════════════════════════════════════════════════ */
export function MarketplaceView({ onLoginRequired }: { onLoginRequired?: () => void }) {
  return (
    <div className="lg:community-surface lg:rounded-3xl lg:border lg:border-border/30 overflow-hidden relative">
      {/* Subtle gold radial glow at top — desktop only */}
      <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-48 bg-idm-gold-warm/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-2 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
      {/* ═══ Context Header — consistent with all views ═══ */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/15 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4 text-idm-gold-warm" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-idm-gold-warm">Marketplace</h2>
          <p className="text-[10px] text-muted-foreground/60">Jual-beli item & jasa komunitas</p>
        </div>
      </div>

      {/* ═══ Hero Banner — Gold-anchored ═══ */}
      <div className="relative overflow-hidden rounded-2xl border border-idm-gold-warm/15 bg-gradient-to-br from-[#0d0b05] via-[#100e08] to-[#0a0804]">
        {/* Gold radial haze */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 40%, ${GOLD.glow} 0%, transparent 65%)` }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(${GOLD.primary}33 1px, transparent 1px), linear-gradient(90deg, ${GOLD.primary}33 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

        <div className="relative z-10 p-6 sm:p-10">
          {/* Decorative accent */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-idm-gold-warm/40" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-idm-gold-warm/20 bg-idm-gold-warm/[0.06]">
              <ShoppingBag className="w-3 h-3 text-idm-gold-warm" />
              <span className="text-[9px] sm:text-[10px] text-idm-gold-warm font-bold tracking-[0.15em] uppercase">MARKETPLACE</span>
            </div>
            <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-idm-gold-warm/40" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2" style={{
                background: 'linear-gradient(135deg, #f5d78e 0%, #d4a853 30%, #e8b94a 50%, #a07c30 70%, #d4a853 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Marketplace
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground/80 max-w-lg">
                Jual-beli item & jasa game online. Pasang iklanmu dan temukan penawaran terbaik dari komunitas Tarkam IDM!
              </p>
            </div>

            {/* Stats Badges — gold base, orange as accent only */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-idm-gold-warm/10 border border-idm-gold-warm/15">
                <Flame className="w-3.5 h-3.5 text-idm-gold-warm" />
                <span className="text-[10px] font-bold text-idm-gold-warm">Live Deals</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/15">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300">Verified</span>
              </div>
            </div>
          </div>

          {/* Animated underline */}
          <div
            className="h-px sm:h-[1.5px] rounded-full mt-5 animate-width-expand"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD.primary}, transparent)`, maxWidth: '60%' }}
          />
        </div>
      </div>

      {/* ═══ Quick Feature Highlights — gold accent ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, title: 'Jual Cepat', desc: 'Pasang iklan dan temukan pembeli dari komunitas', color: 'text-idm-gold-warm' },
          { icon: ShieldCheck, title: 'Penjual Verified', desc: 'Penjual terverifikasi dengan akun nickname resmi', color: 'text-emerald-400' },
          { icon: Sparkles, title: 'Kategori Lengkap', desc: 'Avatar, jasa GB, joki, item, dan banyak lagi', color: 'text-idm-gold-warm' },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 p-4 rounded-2xl border border-idm-gold-warm/10 bg-gradient-to-br from-idm-gold-warm/[0.02] to-transparent hover:border-idm-gold-warm/20 transition-all">
            <div className={`w-9 h-9 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center shrink-0`}>
              <f.icon className={`w-4 h-4 ${f.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">{f.title}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Marketplace Content — Full Width ═══ */}
      <CommunityMarketplace onLoginRequired={onLoginRequired} />
      </div>
    </div>
  );
}
