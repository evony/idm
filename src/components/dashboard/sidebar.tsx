'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Swords,
  Flower2,
  Globe,
  Heart,
  Coins,
  Calendar,
  Users,
  Sun,
  Moon,
  Shield,
  Flame,
  Zap,
  Trophy,
} from 'lucide-react'
import { useTournament } from '@/hooks/use-tournament'
import {
  getDivisionTextColor,
  getDivisionBadgeClasses,
  getDivisionBtnGradient,
  getDivisionBtnShadow,
} from '@/hooks/use-3d'

export function Sidebar() {
  const { activeTab, setActiveTab, setAdminOpen } = useTournament()
  const { theme, setTheme } = useTheme()

  // Division-aware accent color classes
  const divisionAccent =
    activeTab === 'MALE'
      ? {
          glowLine: 'from-idm-male/60 via-idm-male/30 to-idm-male/60',
          glowLineBlur: 'from-idm-male/30 via-idm-male/15 to-idm-male/30',
          spotTop: 'bg-idm-male/[0.06]',
          spotBottom: 'bg-idm-male/[0.04]',
          logoBg: 'from-idm-male/20 to-idm-male/10',
          logoBorder: 'border-idm-male/25',
          logoIcon: 'text-idm-male',
          logoBlur: 'bg-idm-male/[0.08]',
          logoText: 'from-idm-male to-idm-male-light',
          logoSub: 'text-idm-male/50',
          adminBg: 'bg-idm-male/10',
          adminBorder: 'border-idm-male/20',
          adminText: 'text-idm-male/80',
          adminHover: 'hover:bg-idm-male/20 hover:text-idm-male-light hover:border-idm-male/30 hover:shadow-[0_0_12px_rgba(46,159,255,0.12)]',
          themeHover: 'hover:border-idm-male/25',
          badgeBg: 'from-idm-male/10 to-idm-male/5',
          badgeBorder: 'border-idm-male/15',
          badgeText: 'text-idm-male-light/70',
        }
      : activeTab === 'FEMALE'
      ? {
          glowLine: 'from-pink-300/60 via-pink-300/30 to-pink-300/60',
          glowLineBlur: 'from-pink-300/30 via-pink-300/15 to-pink-300/30',
          spotTop: 'bg-pink-300/[0.06]',
          spotBottom: 'bg-pink-300/[0.04]',
          logoBg: 'from-pink-300/20 to-pink-400/10',
          logoBorder: 'border-pink-300/25',
          logoIcon: 'text-pink-300',
          logoBlur: 'bg-pink-300/[0.08]',
          logoText: 'from-pink-300 to-pink-200',
          logoSub: 'text-pink-300/50',
          adminBg: 'bg-pink-300/10',
          adminBorder: 'border-pink-300/20',
          adminText: 'text-pink-300/80',
          adminHover: 'hover:bg-pink-300/20 hover:text-pink-200 hover:border-pink-300/30 hover:shadow-[0_0_12px_rgba(249,168,212,0.12)]',
          themeHover: 'hover:border-pink-300/25',
          badgeBg: 'from-pink-300/10 to-pink-200/5',
          badgeBorder: 'border-pink-300/15',
          badgeText: 'text-pink-200/70',
        }
      : {
          glowLine: 'from-emerald-400/60 via-emerald-500/30 to-emerald-400/60',
          glowLineBlur: 'from-emerald-400/30 via-emerald-500/15 to-emerald-400/30',
          spotTop: 'bg-emerald-500/[0.06]',
          spotBottom: 'bg-emerald-400/[0.04]',
          logoBg: 'from-emerald-500/20 to-emerald-600/10',
          logoBorder: 'border-emerald-400/25',
          logoIcon: 'text-emerald-400',
          logoBlur: 'bg-emerald-500/[0.08]',
          logoText: 'from-emerald-400 to-emerald-300',
          logoSub: 'text-emerald-400/50',
          adminBg: 'bg-emerald-500/10',
          adminBorder: 'border-emerald-400/20',
          adminText: 'text-emerald-400/80',
          adminHover: 'hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.12)]',
          themeHover: 'hover:border-emerald-400/25',
          badgeBg: 'from-emerald-500/10 to-emerald-400/5',
          badgeBorder: 'border-emerald-400/15',
          badgeText: 'text-emerald-300/70',
        }

  const navItems = [
    {
      key: 'SEMUA' as const,
      label: 'Semua',
      icon: Globe,
      activeBg: 'bg-emerald-500/15',
      activeBorder: 'border-emerald-400/30',
      activeText: 'text-emerald-300',
      activeShadow: 'shadow-emerald-500/20',
      inactiveHover: 'hover:bg-emerald-500/[0.06]',
    },
    {
      key: 'MALE' as const,
      label: 'Male',
      icon: Swords,
      activeBg: 'bg-idm-male/15',
      activeBorder: 'border-idm-male/30',
      activeText: 'text-idm-male-light',
      activeShadow: 'shadow-idm-male/20',
      inactiveHover: 'hover:bg-idm-male/[0.06]',
    },
    {
      key: 'FEMALE' as const,
      label: 'Female',
      icon: Flower2,
      activeBg: 'bg-pink-300/15',
      activeBorder: 'border-pink-300/30',
      activeText: 'text-pink-200',
      activeShadow: 'shadow-pink-300/20',
      inactiveHover: 'hover:bg-pink-300/[0.06]',
    },
  ]

  const infoItems = [
    { icon: Calendar, label: 'Weekly Tournament', color: 'text-emerald-400/60' },
    { icon: Users, label: 'Random Teams', color: 'text-cyan-400/60' },
    { icon: Coins, label: 'Sawer / Donate', color: 'text-emerald-400/60' },
    { icon: Heart, label: 'Community Driven', color: 'text-pink-300/60' },
  ]

  return (
    <aside className="hidden md:flex flex-col w-56 overflow-hidden relative">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Left accent glow line — changes with active division */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] z-[2]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${divisionAccent.glowLine}`} />
            <div className={`absolute inset-0 blur-[3px] bg-gradient-to-b ${divisionAccent.glowLineBlur}`} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top accent glow line */}
      <div className="absolute top-0 left-0 right-0 h-px z-[2]">
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${activeTab === 'MALE' ? 'via-cyan-400/30' : activeTab === 'FEMALE' ? 'via-pink-300/30' : 'via-emerald-400/30'} to-transparent`} />
      </div>

      {/* Ambient glow spots */}
      <div className={`absolute top-24 -left-10 w-36 h-36 rounded-full blur-3xl z-[1] transition-colors duration-700 ${divisionAccent.spotTop}`} />
      <div className={`absolute bottom-24 -right-10 w-36 h-36 rounded-full blur-3xl z-[1] transition-colors duration-700 ${divisionAccent.spotBottom}`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Logo area — Apple Settings style */}
        <div className="p-4 pb-3">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className={`relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${divisionAccent.logoBg} border ${divisionAccent.logoBorder}`}>
              <Flame className={`h-4 w-4 ${divisionAccent.logoIcon}`} />
              <div className={`absolute -inset-1 rounded-2xl ${divisionAccent.logoBlur} blur-md`} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-extrabold bg-gradient-to-r ${divisionAccent.logoText} bg-clip-text text-transparent`}>
                IDOL META
              </span>
              <span className={`text-[9px] uppercase tracking-[0.18em] font-medium ${divisionAccent.logoSub}`}>
                Dashboard
              </span>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Navigation — iOS pill style */}
        <nav className="flex flex-col gap-1 flex-1 px-3 pt-4">
          <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-2 px-2 font-semibold">Divisi</p>
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            return (
              <motion.button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.06,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ x: 3, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-300 overflow-hidden border ${
                  isActive
                    ? `${item.activeBg} ${item.activeText} ${item.activeBorder} shadow-lg ${item.activeShadow}`
                    : `text-muted-foreground/50 border-transparent ${item.inactiveHover} hover:text-foreground/60`
                }`}
              >
                {/* Active indicator pill background */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className={`absolute inset-0 rounded-2xl ${item.activeBg}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  )}
                </AnimatePresence>

                <Icon className={`h-4 w-4 relative z-10 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_6px_currentColor]' : ''}`} />
                <span className="relative z-10">{item.label}</span>

                {isActive && (
                  <motion.div
                    className="ml-auto relative z-10 flex items-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  </motion.div>
                )}
              </motion.button>
            )
          })}

          <div className="border-t border-border/50 my-4" />

          <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-2 px-2 font-semibold">Info</p>
          <div className="space-y-2.5 px-2">
            {infoItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-2.5 group cursor-default">
                  <Icon className={`h-3.5 w-3.5 ${item.color} transition-all duration-200 group-hover:scale-110`} />
                  <span className="text-[11px] text-muted-foreground/40 transition-colors duration-200 group-hover:text-muted-foreground/60">{item.label}</span>
                </div>
              )
            })}
          </div>
        </nav>

        {/* Bottom actions — Apple iOS style */}
        <div className="px-3 py-3 border-t border-border/50 space-y-2.5">
          {/* Admin button + Theme toggle */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setAdminOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-2xl ${divisionAccent.adminBg} border ${divisionAccent.adminBorder} text-[11px] font-semibold ${divisionAccent.adminText} ${divisionAccent.adminHover} transition-all duration-300`}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </motion.button>
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              className={`relative flex items-center justify-center h-9 w-9 rounded-2xl border border-border/60 text-muted-foreground/50 hover:text-foreground/70 ${divisionAccent.themeHover} hover:bg-muted/30 transition-all duration-300`}
            >
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </motion.button>
          </div>

          {/* IDM League badge */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${divisionAccent.badgeBg} border ${divisionAccent.badgeBorder} text-[10px] font-bold uppercase tracking-wider ${divisionAccent.badgeText}`}>
              <Zap className="h-3 w-3" />
              IDM League
            </div>
            <span className="text-[10px] text-muted-foreground/20 font-mono">v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
