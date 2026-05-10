'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useTournament } from '@/hooks/use-tournament'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Sun,
  Moon,
  Menu,
  Trophy,
  Swords,
  Flower2,
  Globe,
  Calendar,
  Users,
  Coins,
  Heart,
  Zap,
  Flame,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { setAdminOpen, activeTab } = useTournament()

  // Division-aware colors
  const colors =
    activeTab === 'MALE'
      ? {
          logoBg: 'from-cyan-500/20 to-cyan-600/10',
          logoBorder: 'border-cyan-400/25',
          logoIcon: 'text-cyan-400',
          subtitle: 'text-cyan-400/50',
          glowLine: 'via-cyan-400/50',
          glowLineBlur: 'via-cyan-400/15',
          themeHover: 'hover:border-cyan-400/25',
          adminIcon: 'text-cyan-400/70',
          adminHover: 'hover:text-cyan-400',
          adminBorder: 'border-cyan-400/20',
          adminHoverBorder: 'hover:border-cyan-400/30',
        }
      : activeTab === 'FEMALE'
      ? {
          logoBg: 'from-pink-300/20 to-pink-400/10',
          logoBorder: 'border-pink-300/25',
          logoIcon: 'text-pink-300',
          subtitle: 'text-pink-300/50',
          glowLine: 'via-pink-300/50',
          glowLineBlur: 'via-pink-300/15',
          themeHover: 'hover:border-pink-300/25',
          adminIcon: 'text-pink-300/70',
          adminHover: 'hover:text-pink-300',
          adminBorder: 'border-pink-300/20',
          adminHoverBorder: 'hover:border-pink-300/30',
        }
      : {
          logoBg: 'from-emerald-500/20 to-emerald-600/10',
          logoBorder: 'border-emerald-400/25',
          logoIcon: 'text-emerald-400',
          subtitle: 'text-emerald-400/50',
          glowLine: 'via-emerald-400/50',
          glowLineBlur: 'via-emerald-400/15',
          themeHover: 'hover:border-emerald-400/25',
          adminIcon: 'text-emerald-400/70',
          adminHover: 'hover:text-emerald-400',
          adminBorder: 'border-emerald-400/20',
          adminHoverBorder: 'hover:border-emerald-400/30',
        }

  return (
    <header className="sticky top-0 z-50 w-full md:hidden">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />

      {/* Subtle noise */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Bottom accent glow line — changes with division */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${colors.glowLine} to-transparent`} />
            <div className={`absolute inset-0 blur-sm bg-gradient-to-r from-transparent ${colors.glowLineBlur} to-transparent`} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex h-14 items-center justify-between px-4">
        {/* Logo area */}
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className={`relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.logoBg} border ${colors.logoBorder}`}>
            <Trophy className={`h-4 w-4 ${colors.logoIcon}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-extrabold tracking-tight text-foreground">
              IDOL META
            </span>
            <span className={`text-[9px] uppercase tracking-[0.18em] -mt-0.5 font-medium ${colors.subtitle}`}>
              Fan Made Edition
            </span>
          </div>
        </motion.div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative h-9 w-9 text-muted-foreground/60 hover:text-foreground rounded-2xl border border-border/50 ${colors.themeHover} transition-all duration-300`}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </motion.div>

          {/* Admin button */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAdminOpen(true)}
              className={`h-9 w-9 ${colors.adminIcon} ${colors.adminHover} rounded-2xl border ${colors.adminBorder} ${colors.adminHoverBorder} transition-all duration-300`}
            >
              <Shield className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Hamburger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 text-muted-foreground/60 hover:text-foreground rounded-2xl border border-border/50 ${colors.themeHover} transition-all duration-300`}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 overflow-hidden border-border">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  const { activeTab, setActiveTab } = useTournament()

  const tabs = [
    {
      key: 'SEMUA' as const,
      label: 'Semua',
      icon: Globe,
      activeColor: 'text-emerald-300',
      activeBorder: 'border-emerald-400/30',
      activeBg: 'bg-emerald-500/15',
      activeShadow: 'shadow-emerald-500/15',
    },
    {
      key: 'MALE' as const,
      label: 'Male',
      icon: Swords,
      activeColor: 'text-cyan-300',
      activeBorder: 'border-cyan-400/30',
      activeBg: 'bg-cyan-500/15',
      activeShadow: 'shadow-cyan-500/15',
    },
    {
      key: 'FEMALE' as const,
      label: 'Female',
      icon: Flower2,
      activeColor: 'text-pink-200',
      activeBorder: 'border-pink-300/30',
      activeBg: 'bg-pink-300/15',
      activeShadow: 'shadow-pink-300/15',
    },
  ]

  const infoItems = [
    { icon: Calendar, label: 'Weekly Tournament', accent: 'text-emerald-400/50' },
    { icon: Users, label: 'Random Teams', accent: 'text-cyan-400/50' },
    { icon: Coins, label: 'Sawer / Donate', accent: 'text-emerald-400/50' },
    { icon: Heart, label: 'Community Driven', accent: 'text-pink-300/50' },
  ]

  // Division-aware badge colors
  const badgeClasses =
    activeTab === 'MALE'
      ? 'bg-cyan-500/10 border-cyan-400/15 text-cyan-300/70'
      : activeTab === 'FEMALE'
      ? 'bg-pink-300/10 border-pink-300/15 text-pink-200/70'
      : 'bg-emerald-500/10 border-emerald-400/15 text-emerald-300/70'

  return (
    <div className="flex flex-col h-full relative">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-card/90 backdrop-blur-xl" />

      {/* Subtle noise */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Left accent glow line */}
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
            <div className={`absolute inset-0 bg-gradient-to-b ${activeTab === 'MALE' ? 'from-cyan-400/50 via-cyan-500/30 to-cyan-400/50' : activeTab === 'FEMALE' ? 'from-pink-300/50 via-pink-300/30 to-pink-300/50' : 'from-emerald-400/50 via-emerald-500/30 to-emerald-400/50'}`} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo area */}
        <div className="p-5 pb-4">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className={`relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${activeTab === 'MALE' ? 'from-cyan-500/20 to-cyan-600/10 border-cyan-400/25' : activeTab === 'FEMALE' ? 'from-pink-300/20 to-pink-400/10 border-pink-300/25' : 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/25'} border`}>
              <Flame className={`h-4 w-4 ${activeTab === 'MALE' ? 'text-cyan-400' : activeTab === 'FEMALE' ? 'text-pink-300' : 'text-emerald-400'}`} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] text-foreground">IDOL META</span>
              <span className={`text-[9px] uppercase tracking-[0.18em] font-medium ${activeTab === 'MALE' ? 'text-cyan-400/50' : activeTab === 'FEMALE' ? 'text-pink-300/50' : 'text-emerald-400/50'}`}>
                Fan Made Edition
              </span>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Navigation — iOS pill style */}
        <nav className="flex flex-col gap-1 px-3 pt-4 flex-1">
          <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-2 px-2 font-semibold">Divisi</p>
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.06,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-300 border ${
                  isActive
                    ? `${tab.activeBg} ${tab.activeColor} ${tab.activeBorder} shadow-lg ${tab.activeShadow}`
                    : 'border-transparent text-muted-foreground/50 hover:text-foreground/60 hover:bg-muted/30'
                }`}
              >
                <Icon className={`h-4 w-4 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_6px_currentColor]' : ''}`} />
                {tab.label}
                {isActive && (
                  <motion.div
                    className="ml-auto"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  </motion.div>
                )}
              </motion.button>
            )
          })}

          <div className="border-t border-border/50 my-4" />

          <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 mb-2 px-2 font-semibold">Info</p>
          <div className="space-y-2.5 px-2 text-[11px] text-muted-foreground/50">
            {infoItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-2.5 group">
                  <Icon className={`h-3.5 w-3.5 ${item.accent} transition-transform duration-200 group-hover:scale-110`} />
                  <span className="transition-colors duration-200 group-hover:text-muted-foreground/70">{item.label}</span>
                </div>
              )
            })}
          </div>
        </nav>

        {/* Bottom badge */}
        <div className="px-5 py-4 border-t border-border/50">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${badgeClasses} text-[10px] font-bold uppercase tracking-wider`}>
            <Zap className="h-3 w-3" />
            IDM League
          </div>
        </div>
      </div>
    </div>
  )
}
