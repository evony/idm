'use client';

import { Zap, UserPlus, Swords, TrendingUp, Crown } from 'lucide-react';
import { SectionHeader } from './shared';
import { useMemo } from 'react';

/* ── Default Step Data ── */
const DEFAULT_STEPS = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Daftar',
    description: 'Daftar sebagai peserta dan pilih divisi Male atau Female',
  },
  {
    number: 2,
    icon: Swords,
    title: 'Tarkam',
    description: 'Ikuti tournament mingguan dan raih kemenangan',
  },
  {
    number: 3,
    icon: TrendingUp,
    title: 'Kumpulkan Poin',
    description: 'Setiap kemenangan memberikan poin untuk peringkat',
  },
  {
    number: 4,
    icon: Crown,
    title: 'Jadi Champion',
    description: 'Raih gelar Season Champion dan MVP',
  },
] as const;

/* ── Step Card ── */
function StepCard({ step, index }: { step: { number: number; icon: React.ComponentType<{ className?: string }>; title: string; description: string }; index: number }) {
  const Icon = step.icon;
  return (
    <div
      className={`reveal reveal-fade-up reveal-delay-${index + 1} relative group`}
    >
      {/* Card */}
      <div className="relative rounded-2xl border border-[rgba(212,168,83,0.10)] bg-mid p-5 sm:p-6 text-center transition-all duration-300 hover:border-[rgba(212,168,83,0.20)] hover:shadow-[0_0_30px_rgba(212,168,83,0.08)] hover:-translate-y-1">
        {/* Subtle radial glow on hover */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(212,168,83,0.04), transparent 70%)' }} />

        {/* Step Number */}
        <div className="relative z-10 flex justify-center mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a853] to-[#e8d5a3] flex items-center justify-center shadow-[0_0_12px_rgba(212,168,83,0.25)]">
            <span className="text-mid font-black text-sm">{step.number}</span>
          </div>
        </div>

        {/* Icon */}
        <div className="relative z-10 w-12 h-12 mx-auto mb-3 rounded-2xl bg-[rgba(212,168,83,0.08)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-[#d4a853]" />
        </div>

        {/* Title */}
        <h3 className="relative z-10 text-lg font-bold text-foreground mb-2">{step.title}</h3>

        {/* Description */}
        <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   How It Works Section
   ═══════════════════════════════════════════════════════════════ */
export function HowItWorksSection({ cmsSettings }: { cmsSettings?: Record<string, string> }) {
  // Merge CMS settings with defaults
  const label = cmsSettings?.howitworks_label || 'Cara Bermain';
  const title = cmsSettings?.howitworks_title || 'Bagaimana Cara Kerjanya?';
  const subtitle = cmsSettings?.howitworks_subtitle || 'Empat langkah sederhana untuk menjadi champion';

  const steps = useMemo(() => {
    return DEFAULT_STEPS.map((step, i) => ({
      ...step,
      title: cmsSettings?.[`howitworks_step_${i + 1}_title`] || step.title,
      description: cmsSettings?.[`howitworks_step_${i + 1}_description`] || step.description,
    }));
  }, [cmsSettings]);

  return (
    <section id="how-it-works" aria-label="Cara Bermain" className="landing-section relative py-16 sm:py-24 px-4 overflow-hidden bg-deep">
      {/* ── Top edge glow — section boundary ── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[rgba(212,168,83,0.025)] to-transparent pointer-events-none" aria-hidden="true" />

      {/* Background — subtle gold grid overlay */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Warm radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(212,168,83,0.06) 0%, transparent 50%)' }} />

      {/* Bilateral cyan+purple atmosphere — living color depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(46,159,255,0.04) 0%, transparent 45%), radial-gradient(ellipse at 85% 50%, rgba(255,45,120,0.04) 0%, transparent 45%)' }} />

      {/* Bottom edge glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.12)] to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="reveal reveal-fade-up">
          <SectionHeader
            icon={Zap}
            label={label}
            title={title}
            subtitle={subtitle}
          />
        </div>

        {/* Steps — Desktop: horizontal with connecting line, Mobile: vertical with left line */}
        <div
          className="relative"
        >
          {/* ── Desktop connecting line (horizontal, between cards) ── */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px pointer-events-none" aria-hidden="true">
            <div className="w-full h-full border-t-2 border-dashed border-[rgba(212,168,83,0.15)]" />
            {/* Gold glow dots at connection points */}
            {[0, 33.33, 66.66].map((left, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#d4a853]/30"
                style={{ left: `${left}%` }}
              />
            ))}
          </div>

          {/* ── Mobile connecting line (vertical, left side) ── */}
          <div className="lg:hidden absolute top-0 bottom-0 left-7 pointer-events-none" aria-hidden="true">
            <div className="w-px h-full border-l-2 border-dashed border-[rgba(212,168,83,0.15)]" />
          </div>

          {/* ── Step Cards Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {/* Mobile: gold dot on the left connecting line */}
                <div className="lg:hidden absolute left-5 top-[52px] -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-[#d4a853] to-[#e8d5a3] shadow-[0_0_8px_rgba(212,168,83,0.3)] z-10" aria-hidden="true" />

                <div className="lg:pl-0 pl-12">
                  <StepCard step={step} index={i} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
