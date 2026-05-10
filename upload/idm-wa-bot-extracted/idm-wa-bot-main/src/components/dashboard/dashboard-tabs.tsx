'use client'

import { useTournament, type DivisionTab } from '@/hooks/use-tournament'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Swords, Flower2 } from 'lucide-react'

interface DashboardTabsProps {
  activeTab: DivisionTab
  onTabChange: (tab: DivisionTab) => void
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const tabs = [
    {
      key: 'SEMUA' as const,
      label: 'Semua',
      icon: Globe,
      activeBg: 'bg-emerald-500/18',
      activeBorder: 'border-emerald-400/30',
      activeText: 'text-emerald-300',
      activeIconGlow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15),0_0_40px_rgba(16,185,129,0.08)]',
    },
    {
      key: 'MALE' as const,
      label: 'Male',
      icon: Swords,
      activeBg: 'bg-idm-male/18',
      activeBorder: 'border-idm-male/30',
      activeText: 'text-idm-male-light',
      activeIconGlow: 'drop-shadow-[0_0_8px_rgba(46,159,255,0.5)]',
      glowShadow: 'shadow-[0_0_20px_rgba(46,159,255,0.15),0_0_40px_rgba(46,159,255,0.08)]',
    },
    {
      key: 'FEMALE' as const,
      label: 'Female',
      icon: Flower2,
      activeBg: 'bg-pink-300/18',
      activeBorder: 'border-pink-300/30',
      activeText: 'text-pink-200',
      activeIconGlow: 'drop-shadow-[0_0_8px_rgba(249,168,212,0.5)]',
      glowShadow: 'shadow-[0_0_20px_rgba(249,168,212,0.15),0_0_40px_rgba(249,168,212,0.08)]',
    },
  ]

  return (
    <div className="flex items-center justify-center w-full py-4">
      {/* iOS segmented control container */}
      <div className="relative inline-flex items-center gap-0.5 p-1.5 rounded-2xl border border-border/60 overflow-hidden">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-card/70 backdrop-blur-xl" />

        {/* Subtle noise */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-medium transition-colors duration-200 ${
                isActive
                  ? `font-semibold ${tab.activeText} ${tab.glowShadow}`
                  : 'text-muted-foreground/50 hover:text-foreground/60'
              }`}
            >
              {/* Animated indicator pill with layoutId */}
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.div
                    layoutId="dashboard-tab-indicator"
                    className={`absolute inset-0 rounded-2xl ${tab.activeBg} border ${tab.activeBorder}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}
              </AnimatePresence>

              <Icon
                className={`h-[16px] w-[16px] relative z-10 transition-all duration-300 ${
                  isActive ? `scale-110 ${tab.activeIconGlow}` : ''
                }`}
              />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
