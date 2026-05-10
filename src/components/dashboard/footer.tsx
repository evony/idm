'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Heart, MessageCircle, Gamepad2, ExternalLink } from 'lucide-react'
import { useTournament } from '@/hooks/use-tournament'

export function Footer() {
  const { activeTab } = useTournament()

  // Division-colored accent line
  const accentColors =
    activeTab === 'MALE'
      ? {
          glowLine: 'via-cyan-400/40',
          glowLineBlur: 'via-cyan-400/10',
          logoBg: 'from-cyan-500/15 to-cyan-600/5',
          logoBorder: 'border-cyan-400/20',
          logoIcon: 'text-cyan-400/70',
          pillBg: 'bg-cyan-500/8',
          pillBorder: 'border-cyan-400/15',
          pillHover: 'hover:bg-cyan-500/15 hover:border-cyan-400/25 hover:text-cyan-400/80',
          pillText: 'text-muted-foreground/50',
        }
      : activeTab === 'FEMALE'
      ? {
          glowLine: 'via-pink-300/40',
          glowLineBlur: 'via-pink-300/10',
          logoBg: 'from-pink-300/15 to-pink-400/5',
          logoBorder: 'border-pink-300/20',
          logoIcon: 'text-pink-300/70',
          pillBg: 'bg-pink-300/8',
          pillBorder: 'border-pink-300/15',
          pillHover: 'hover:bg-pink-300/15 hover:border-pink-300/25 hover:text-pink-300/80',
          pillText: 'text-muted-foreground/50',
        }
      : {
          glowLine: 'via-emerald-400/40',
          glowLineBlur: 'via-emerald-400/10',
          logoBg: 'from-emerald-500/15 to-emerald-600/5',
          logoBorder: 'border-emerald-400/20',
          logoIcon: 'text-emerald-400/70',
          pillBg: 'bg-emerald-500/8',
          pillBorder: 'border-emerald-400/15',
          pillHover: 'hover:bg-emerald-500/15 hover:border-emerald-400/25 hover:text-emerald-400/80',
          pillText: 'text-muted-foreground/50',
        }

  return (
    <footer className="mt-auto border-t border-border/50 relative overflow-hidden">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />

      {/* Top accent glow line — division-colored */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${accentColors.glowLine} to-transparent`} />
            <div className={`absolute inset-0 blur-sm bg-gradient-to-r from-transparent ${accentColors.glowLineBlur} to-transparent`} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 py-5 px-4 md:px-6">
        <div className="flex flex-col gap-4">
          {/* Main content row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Logo and title */}
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className={`relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${accentColors.logoBg} border ${accentColors.logoBorder}`}>
                <Trophy className={`h-3 w-3 ${accentColors.logoIcon}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground/70 tracking-tight">IDOL META</span>
                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.15em]">Fan Made Edition</span>
              </div>
            </motion.div>

            {/* Social links — iOS pill style */}
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <a
                href="#"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${accentColors.pillBg} border ${accentColors.pillBorder} ${accentColors.pillText} ${accentColors.pillHover} text-[11px] font-medium transition-all duration-300`}
              >
                <MessageCircle className="h-3 w-3" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
              <a
                href="#"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${accentColors.pillBg} border ${accentColors.pillBorder} ${accentColors.pillText} ${accentColors.pillHover} text-[11px] font-medium transition-all duration-300`}
              >
                <Gamepad2 className="h-3 w-3" />
                <span className="hidden sm:inline">Discord</span>
              </a>
              <a
                href="#"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${accentColors.pillBg} border ${accentColors.pillBorder} ${accentColors.pillText} ${accentColors.pillHover} text-[11px] font-medium transition-all duration-300`}
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Community</span>
              </a>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/30" />

          {/* Bottom row */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-1.5">
              <span>Built with</span>
              <Heart className="h-3 w-3 text-pink-300/50" />
              <span>by Community</span>
            </div>
            <div className="flex items-center gap-3">
              <span>&copy; {new Date().getFullYear()} IDM League</span>
              <span className="text-muted-foreground/15">|</span>
              <span className="text-muted-foreground/20 font-mono text-[10px]">v1.0</span>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
