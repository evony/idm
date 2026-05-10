'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { getAvatarUrl, getClubLogoUrl, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence, useScroll, useTransform, useInView, type Variants } from 'framer-motion';
import {
  Trophy, Music, Users, Shield, Crown, Star,
  Gift, ArrowRight, Sparkles, Play,
  Medal, Clock, Wallet, ChevronUp, ChevronDown, Gamepad2, Camera, UserPlus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TierBadge } from './tier-badge';
import { PlayerProfile } from './player-profile';
import { ClubProfile } from './club-profile';
import { DonationModal } from './donation-modal';
import { GallerySection } from './gallery-section';
import { MarqueeTicker } from './marquee-ticker';
import { RegistrationModal } from './registration-modal';
import { useState, useRef, useMemo, useEffect, type ReactNode, useCallback } from 'react';
import type { StatsData } from '@/types/stats';

/* ========== Animation Variants ========== */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } }
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};


/* ========== Scroll-triggered Section Wrapper ========== */
function AnimatedSection({ children, className = '', variant = 'fadeUp' }: {
  children: ReactNode;
  className?: string;
  variant?: 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'scaleIn';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const variants = { fadeUp, fadeLeft, fadeRight, scaleIn };
  const selected = variants[variant] || fadeUp;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={selected}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ========== Section Header Component ========== */
function SectionHeader({ icon: Icon, label, title, subtitle }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={fadeUp} className="text-center mb-14">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#d4a853]" />
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5">
          <Icon className="w-4 h-4 text-[#d4a853]" />
          <span className="text-[11px] font-bold text-[#d4a853] uppercase tracking-[0.25em]">{label}</span>
        </div>
        <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#d4a853]" />
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gradient-champion">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">{subtitle}</p>}
    </motion.div>
  );
}

/* ========== Parallax Stats Counter ========== */
function StatCard({ icon: Icon, value, label, delay }: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative p-3 sm:p-5 rounded-xl sm:rounded-2xl glass border-0 card-shine card-border-glow text-center transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,168,83,0.15)]">
        <div className="w-7 h-7 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-3 rounded-lg sm:rounded-xl bg-[#d4a853]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#d4a853]" />
        </div>
        <p className="text-sm sm:text-2xl font-black text-gradient-fury">{value}</p>
        <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const { setCurrentView, setDivision } = useAppStore();
  const [selectedPlayer, setSelectedPlayer] = useState<StatsData['topPlayers'][0] & { division?: string } | null>(null);
  const [selectedClub, setSelectedClub] = useState<(StatsData['clubs'][0] & { division?: string }) | null>(null);
  const [showAllClubs, setShowAllClubs] = useState(false);
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  /* ========== Donation Modal State ========== */
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationModalType, setDonationModalType] = useState<'weekly' | 'season'>('weekly');
  const [donationModalAmount, setDonationModalAmount] = useState<number | undefined>(undefined);

  /* ========== Registration Modal State ========== */
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  const openDonationModal = useCallback((type: 'weekly' | 'season', amount?: number) => {
    setDonationModalType(type);
    setDonationModalAmount(amount);
    setDonationModalOpen(true);
  }, []);


  /* ========== Parallax Refs ========== */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(heroScroll, [0, 1], ['0%', '40%']);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);
  const contentY = useTransform(heroScroll, [0, 1], ['0%', '20%']);

  /* ========== Section Refs (no parallax — performance optimized) ========== */
  const championsRef = useRef<HTMLElement>(null);
  const clubsRef = useRef<HTMLElement>(null);
  const dreamRef = useRef<HTMLElement>(null);
  const sawerRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  /* ========== Hero Mid-depth Parallax ========== */
  const heroMidY = useTransform(heroScroll, [0, 1], ['0%', '12%']);

  /* ========== Data Queries ========== */
  const { data: rawMaleData } = useQuery<StatsData>({
    queryKey: ['stats', 'male'],
    queryFn: async () => { const res = await fetch('/api/stats?division=male'); return res.json(); },
  });

  const { data: rawFemaleData } = useQuery<StatsData>({
    queryKey: ['stats', 'female'],
    queryFn: async () => { const res = await fetch('/api/stats?division=female'); return res.json(); },
  });

  // CMS content query — dynamic landing page content
  const { data: cmsData } = useQuery({
    queryKey: ['cms-content'],
    queryFn: async () => { const res = await fetch('/api/cms/content'); if (!res.ok) return { settings: {}, sections: {} }; return res.json(); },
    staleTime: 30000,
  });

  // CMS helpers with fallback defaults
  const cms = cmsData?.settings || {};
  const cmsSections = cmsData?.sections || {};
  const cmsLogo = cms.logo_url || '/logo1.webp';
  const cmsSiteTitle = cms.site_title || 'IDM League';
  const cmsHeroTitle = cms.hero_title || 'Idol Meta';
  const cmsHeroSubtitle = cms.hero_subtitle || 'Fan Made Edition';
  const cmsHeroTagline = cms.hero_tagline || 'Tempat dancer terbaik berkompetisi. Tournament mingguan, liga profesional, dan podium yang menunggu.';
  const cmsHeroBgDesktop = cms.hero_bg_desktop || '/bg-default.jpg';
  const cmsHeroBgMobile = cms.hero_bg_mobile || '/bg-mobiledefault.jpg';
  const cmsMaleCta = cms.nav_cta_male_text || 'MALE DIVISION';
  const cmsFemaleCta = cms.nav_cta_female_text || 'FEMALE DIVISION';
  const cmsFooterText = cms.footer_text || '© 2025 IDM League — Idol Meta Fan Made Edition. All rights reserved.';
  const cmsFooterTagline = cms.footer_tagline || 'Dance. Compete. Dominate.';

  // Use real API data only — no demo/hardcoded fallbacks
  const maleData = rawMaleData;
  const femaleData = rawFemaleData;



  const enterApp = (division: 'male' | 'female') => {
    setDivision(division);
    setCurrentView('dashboard');
  };

  /* ========== Floating Particles — Reduced for performance ========== */
  const particles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 14,
      duration: 14 + Math.random() * 18,
      opacity: 0.12 + Math.random() * 0.2,
      alt: i % 3 === 0,
    }));
  }, []);

  /* ========== Nav scroll state ========== */
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 500);
      // Scroll progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track active section for nav highlight
  useEffect(() => {
    const sectionIds = ['champions', 'mvp', 'sawer', 'clubs', 'gallery'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden landing-scroll pb-20 sm:pb-0">

      {/* ========== FIXED NAVIGATION HEADER ========== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-[#d4a853]/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : 'bg-transparent'
      }`}>
        {/* Scroll Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-[#d4a853] via-[#e8d5a3] to-[#d4a853] shadow-[0_0_8px_rgba(212,168,83,0.4)]"
            style={{ width: `${scrollProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden glow-pulse shrink-0">
              <img src={cmsLogo} alt="IDM" className="w-full h-full object-cover" />
            </div>
            <span className="text-gradient-fury text-sm font-bold tracking-tight">{cmsSiteTitle}</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { id: 'champions', label: 'Champion' },
              { id: 'mvp', label: 'MVP' },
              { id: 'sawer', label: 'Sawer' },
              { id: 'clubs', label: 'Club' },
              { id: 'gallery', label: 'Galeri' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`relative px-3 py-1.5 text-sm transition-all duration-300 cursor-pointer rounded-md ${
                  activeSection === item.id
                    ? 'text-[#d4a853] font-semibold'
                    : 'text-muted-foreground hover:text-[#d4a853]/70'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#d4a853] rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Division Switch - Segmented Control */}
          <div className="relative flex items-center bg-background/50 backdrop-blur-sm rounded-full p-1 border border-[#d4a853]/20 shadow-[0_0_15px_rgba(212,168,83,0.1)]">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => enterApp('male')}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors duration-300 text-[#22d3ee] hover:text-white"
            >
              Male
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => enterApp('female')}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors duration-300 text-[#c084fc] hover:text-white"
            >
              Female
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-[#d4a853]/10 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { id: 'champions', label: 'Champion', icon: Crown },
            { id: 'mvp', label: 'MVP', icon: Star },
            { id: 'sawer', label: 'Sawer', icon: Gift },
            { id: 'clubs', label: 'Club', icon: Users },
            { id: 'gallery', label: 'Galeri', icon: Camera },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-300 ${
                activeSection === item.id
                  ? 'text-[#d4a853]'
                  : 'text-muted-foreground hover:text-[#d4a853]/70'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
              {activeSection === item.id && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -bottom-0.5 w-8 h-0.5 bg-[#d4a853] rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ========== HERO SECTION — Cinematic Parallax ========== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Multi-layer Parallax Background — 3 depth layers */}
        {/* Layer 1: Deep background (slowest) */}
        <motion.div className="absolute inset-0 hidden sm:block" style={{ y: heroY, scale: heroScale }}>
          <img src={cmsHeroBgDesktop} alt="" className="w-full h-[130%] object-cover" aria-hidden="true" />
        </motion.div>
        <motion.div className="absolute inset-0 sm:hidden" style={{ y: heroY, scale: heroScale }}>
          <img src={cmsHeroBgMobile} alt="" className="w-full h-[130%] object-cover object-top" aria-hidden="true" />
        </motion.div>

        {/* Layer 2: Mid-depth gold haze */}
        <motion.div
          className="absolute inset-0"
          style={{
            y: heroMidY,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(212,168,83,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Gradient Overlays — Multiple layers for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/10 to-transparent" />

        {/* Animated Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        {/* Ambient Orbit Light */}
        <div className="ambient-light" style={{ top: '30%', left: '20%' }} />
        <div className="ambient-light" style={{ top: '60%', right: '10%', animationDelay: '-10s', animationDuration: '25s' }} />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className={p.alt ? 'particle-alt' : 'particle'}
              style={{
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <motion.div className="relative z-10 text-center px-4 max-w-4xl mx-auto" style={{ opacity: heroOpacity, y: contentY }}>
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {/* Decorative top accent line */}
            <motion.div variants={scaleIn} className="mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent to-[#d4a853]/60" />
                <div className="w-2 h-2 rounded-full bg-[#d4a853]/70 shadow-[0_0_8px_rgba(212,168,83,0.4)]" />
                <div className="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent to-[#d4a853]/60" />
              </div>
            </motion.div>

            {/* Brand Label */}
            <motion.div variants={fadeUp}>
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.5em' }}
                animate={{ opacity: 1, letterSpacing: '0.25em' }}
                transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-sm text-[#d4a853]/60 font-bold tracking-[0.25em] uppercase"
              >
                {cmsSiteTitle}
              </motion.p>
            </motion.div>

            {/* Main Title */}
            <motion.div variants={fadeUp}>
              <motion.h1
                initial={{ opacity: 0, letterSpacing: '0.3em' }}
                animate={{ opacity: 1, letterSpacing: '0.12em' }}
                transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl sm:text-5xl lg:text-6xl text-gradient-fury font-black tracking-[0.12em] uppercase mt-2"
              >
                {cmsHeroTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.3em' }}
                animate={{ opacity: 1, letterSpacing: '0.15em' }}
                transition={{ delay: 1.0, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg sm:text-2xl lg:text-3xl text-[#e8d5a3] font-light tracking-[0.15em] uppercase mt-1"
              >
                {cmsHeroSubtitle}
              </motion.p>
            </motion.div>

            {/* Animated Badges — from CMS hero section cards */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2.5 mt-6 flex-wrap">
              {(cmsSections.hero?.cards?.length > 0
                ? cmsSections.hero.cards.filter((c: { isActive: boolean }) => c.isActive).map((c: { title: string; order: number }) => ({ text: c.title, glow: c.order === 1 }))
                : [
                    { text: 'Season 1', glow: true },
                    { text: 'Dance Tournament', glow: false },
                    { text: 'Pro League', glow: false },
                  ]
              ).map((badge: { text: string; glow: boolean }, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 1 + i * 0.15, type: 'spring', stiffness: 200 }}
                >
                  <Badge className={`bg-[#d4a853]/10 text-[#d4a853] text-xs border border-[#d4a853]/20 px-4 py-2 ${badge.glow ? 'glow-pulse' : ''}`}>
                    {badge.text}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            {/* Tagline */}
            <motion.p variants={fadeUp} className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-10 mt-8 leading-relaxed">
              {cmsHeroTagline}
            </motion.p>

            {/* Hero CTA — Register Button */}
            <motion.div variants={fadeUp} className="flex items-center justify-center">
              <motion.button
                onClick={() => setRegistrationModalOpen(true)}
                className="group relative cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative px-5 py-3 sm:px-10 sm:py-5 border-2 border-[#d4a853]/60 rounded-sm transform -rotate-3 transition-all duration-300 group-hover:rotate-0 group-hover:scale-105 group-hover:border-[#d4a853]/80">
                  <div className="absolute inset-0 bg-[#d4a853]/5 group-hover:bg-[#d4a853]/10 transition-colors duration-300" />
                  <div className="relative z-10">
                    <span className="font-bold text-base sm:text-xl tracking-[0.12em] sm:tracking-[0.15em] text-[#d4a853] group-hover:text-[#f0c674] transition-colors">
                      DAFTAR SEKARANG
                    </span>
                    <div className="flex items-center justify-center gap-2 mt-1 sm:mt-1.5">
                      <div className="h-px flex-1 bg-[#d4a853]/30" />
                      <span className="text-[8px] sm:text-[9px] text-[#d4a853]/50 tracking-widest">GABUNG IDM LEAGUE</span>
                      <div className="h-px flex-1 bg-[#d4a853]/30" />
                    </div>
                  </div>
                  {/* Corner brackets */}
                  <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-[#d4a853]/40 group-hover:border-[#d4a853]/60 transition-colors" />
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-[#d4a853]/40 group-hover:border-[#d4a853]/60 transition-colors" />
                  <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-[#d4a853]/40 group-hover:border-[#d4a853]/60 transition-colors" />
                  <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-[#d4a853]/40 group-hover:border-[#d4a853]/60 transition-colors" />
                </div>
              </motion.button>
            </motion.div>

            {/* Quick Stats — Animated Counters */}
            <motion.div variants={fadeUp} className="mt-8 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
              <StatCard icon={Users} value={`${maleData?.totalPlayers || 0}`} label="Players" delay={0} />
              <StatCard icon={Trophy} value={`${maleData?.clubs?.length || 0}`} label="Club" delay={0.1} />
              <StatCard icon={Wallet} value={formatCurrency(maleData?.totalPrizePool || 0)} label="Prize Pool" delay={0.2} />
              <StatCard icon={Clock} value={`${maleData?.seasonProgress?.totalWeeks || 0}`} label="Week/Season" delay={0.3} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] text-[#d4a853]/50 uppercase tracking-[0.3em] font-semibold">Jelajahi</span>
            <div className="w-6 h-10 rounded-full border-2 border-[#d4a853]/20 flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-[#d4a853]/60"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== LIVE INFO TICKER — Marquee Banner ========== */}
      <div className="relative z-40 py-2.5 bg-background/60 backdrop-blur-md border-y border-[#d4a853]/10">
        <MarqueeTicker />
      </div>

      {/* ========== SEASON CHAMPION — Smooth Reveal Parallax ========== */}
      <section id="champions" ref={championsRef} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Fixed background with subtle parallax - only the BG moves, NOT cards */}
        <div className="absolute inset-0">
          {/* Static background — no parallax for performance */}
          <img src="/bg-default.jpg" alt="" className="w-full h-[120%] object-cover opacity-[0.06] dark:opacity-[0.10]" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        </div>

        {/* Subtle ambient glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)' }} />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 60%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Section Header — Fade in from below */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionHeader icon={Crown} label={cmsSections.champions?.subtitle || "Aula Champion"} title={cmsSections.champions?.title || "Season Champion"} subtitle={cmsSections.champions?.description || "Juara terbaru dari setiap divisi — 1 tim, 3 pemain, 1 gelar"} />
          </motion.div>

          {/* Both Divisions Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            {/* Vertical Gold Divider */}
            <div className="hidden lg:block absolute top-12 bottom-12 left-1/2 w-px bg-gradient-to-b from-transparent via-[#d4a853]/30 to-transparent z-10" />

            {([['male', maleData, Music], ['female', femaleData, Shield]] as const).map(([division, data, DivisionIcon], divIdx) => {
              const isMale = division === 'male';
              const accent = isMale ? '#06b6d4' : '#a855f7';
              const accentLight = isMale ? '#22d3ee' : '#c084fc';
              const accentFaint = isMale ? '#67e8f9' : '#e9d5ff';

              return (
                <motion.div
                  key={division}
                  initial={{ opacity: 0, x: isMale ? -50 : 50, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.8, delay: divIdx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  {(!data || !data.weeklyChampions?.length) ? (
                    <Card className="overflow-hidden border" style={{ borderColor: `${accent}20` }}>
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: accent }} />
                      <CardContent className="p-0">
                        <div className="relative h-48 overflow-hidden">
                          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}08 0%, ${accent}04 50%, transparent 100%)` }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/60 to-transparent" />
                          <div className="absolute bottom-4 inset-x-0 px-5 flex items-end justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                                <DivisionIcon className="w-4 h-4" style={{ color: accentLight }} />
                              </div>
                              <div>
                                <h3 className="text-base font-black uppercase tracking-wider" style={{ color: accentLight }}>{division} Division</h3>
                                <p className="text-[9px] font-semibold text-white/40">SEASON CHAMPION</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 text-center space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accent}10` }}>
                            <Crown className="w-8 h-8" style={{ color: `${accent}30` }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white/60">Musim Baru Dimulai</p>
                            <p className="text-xs text-muted-foreground/50 mt-1">Champion akan muncul setelah week pertama selesai</p>
                          </div>
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-20 h-24 rounded-xl border border-dashed flex items-center justify-center" style={{ borderColor: `${accent}15` }}>
                                <span className="text-[10px] font-bold" style={{ color: `${accent}25` }}>#{i}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (() => {
                    const champions = data.weeklyChampions;
                    const selected = champions[champions.length - 1];
                    return (
                      <Card className="overflow-hidden border card-shine group transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,168,83,0.15)]" style={{ borderColor: `${accent}20` }}>
                        {/* Neon accent line — division color */}
                        <div className="h-0.5 bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: accent }} />
                        <CardContent className="p-0">
                          {/* Banner Header */}
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src="/bg-section.jpg"
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover opacity-15 transition-transform duration-500 group-hover:scale-110"
                              aria-hidden="true"
                            />
                            {/* Division color tint */}
                            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}30 0%, ${accent}15 50%, transparent 100%)` }} />
                            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 40%, ${accent}35, transparent 60%)` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/60 to-transparent" />
                            {/* Crown Glow */}
                            <div className="absolute top-4 right-6">
                              <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                                <Crown className="w-8 h-8" style={{ color: accentLight, filter: `drop-shadow(0 0 16px ${accent}80)` }} />
                              </motion.div>
                            </div>
                            {/* Division + Week Badges */}
                            <div className="absolute bottom-4 inset-x-0 px-5 flex items-end justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}25` }}>
                                  <DivisionIcon className="w-4 h-4" style={{ color: accentLight }} />
                                </div>
                                <div>
                                  <h3 className="text-base font-black uppercase tracking-wider" style={{ color: accentLight }}>{division} Division</h3>
                                  <p className="text-[9px] font-semibold text-white/40">SEASON CHAMPION</p>
                                </div>
                              </div>
                              <Badge style={{ backgroundColor: `${accent}25`, color: accentLight, borderColor: `${accent}40` }} className="text-[10px] border px-2.5 py-0.5">
                                <Crown className="w-3 h-3 mr-1" />Week {selected.weekNumber}
                              </Badge>
                            </div>
                          </div>

                          <div className="p-5 space-y-4">
                            {/* Team Info */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Trophy className="w-5 h-5" style={{ color: accentLight }} />
                                <span className="text-xl sm:text-2xl font-black text-white">{selected.winnerTeam?.name || 'TBD'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {selected.prizePool > 0 && (
                                  <span className="text-[10px] font-bold text-[#d4a853] bg-[#d4a853]/10 px-2.5 py-1 rounded-lg">💰 {selected.prizePool.toLocaleString()}</span>
                                )}
                                {selected.mvp && (
                                  <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5" />MVP {selected.mvp.gamertag}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 3 Player Avatars */}
                            {selected.winnerTeam && selected.winnerTeam.players.length > 0 ? (
                              <div className="flex rounded-2xl overflow-hidden border" style={{ height: '320px', borderColor: `${accent}15` }}>
                                {selected.winnerTeam.players.slice(0, 3).map((player, pIdx) => (
                                  <div
                                    key={player.id}
                                    className="relative flex-1 cursor-pointer group/avatar overflow-hidden"
                                    onClick={() => {
                                      const found = data.topPlayers?.find(tp => tp.id === player.id);
                                      if (found) setSelectedPlayer({ ...found, division });
                                    }}
                                  >
                                    <img src={getAvatarUrl(player.gamertag, division as 'male' | 'female', player.avatar)} alt={player.gamertag} className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover/avatar:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/20 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a06]/30 via-transparent to-transparent" />
                                    {pIdx < 2 && <div className="absolute right-0 top-6 bottom-6 w-px z-20" style={{ backgroundColor: `${accent}20` }} />}
                                    <div className="absolute top-3 left-3 z-10">
                                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black backdrop-blur-sm" style={{ backgroundColor: `${accent}30`, color: accentLight }}>
                                        {pIdx + 1}
                                      </div>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 p-3 z-10">
                                      <p className="text-sm sm:text-base font-black text-white truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{player.gamertag}</p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <TierBadge tier={player.tier} />
                                        {pIdx === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: accentLight, backgroundColor: `${accent}25` }}>CPT</span>}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] font-bold" style={{ color: accentFaint }}>{player.points}pts</span>
                                        <span className="text-[10px] font-bold text-green-400">{player.totalWins}W</span>
                                        <span className="text-[10px] font-bold text-orange-400">🔥{player.streak}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center text-sm text-muted-foreground rounded-xl border border-dashed" style={{ borderColor: `${accent}15` }}>Belum ada data week ini</div>
                            )}


                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ========== MVP ARENA — Dramatic Split Hero Cards ========== */}
      <section id="mvp" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-[#0c0a06]/10 to-background" />
        <div className="ambient-light" style={{ top: '30%', left: '15%', animationDuration: '20s' }} />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}>
            <SectionHeader icon={Medal} label={cmsSections.mvp?.subtitle || "Hall of Fame"} title={cmsSections.mvp?.title || "MVP Arena"} subtitle={cmsSections.mvp?.description || "Pemain terbaik dari setiap divisi — Dipilih admin berdasarkan skor tertinggi"} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative max-w-5xl mx-auto">
              {/* Vertical Gold Divider */}
              <div className="hidden md:block absolute top-12 bottom-12 left-1/2 w-px bg-gradient-to-b from-transparent via-[#d4a853]/30 to-transparent z-10" />

              {/* Male MVP — Left DRAMATIC HERO CARD */}
              <motion.div variants={fadeLeft}>
                {(() => {
                  const mvp = maleData?.mvpHallOfFame?.[0];
                  if (!mvp) return <div className="py-16 text-center"><div className="w-20 h-20 mx-auto rounded-2xl bg-[#06b6d4]/10 flex items-center justify-center mb-4"><Medal className="w-10 h-10 text-[#06b6d4]/25" /></div><p className="text-sm font-semibold text-white/50">MVP Belum Dipilih</p><p className="text-xs text-muted-foreground/40 mt-1">Pemain terbaik akan muncul setelah turnamen pertama</p></div>;
                  return (
                    <div
                      className="relative rounded-2xl overflow-hidden cursor-pointer group min-h-[520px] border border-[#06b6d4]/15 hover:border-[#06b6d4]/30 transition-all duration-300"
                      style={{ boxShadow: '0 0 40px rgba(6,182,212,0.08)' }}
                      onClick={() => {
                        const found = maleData?.topPlayers?.find(p => p.gamertag === mvp.gamertag);
                        if (found) setSelectedPlayer({ ...found, division: 'male' });
                      }}
                    >
                      {/* Neon accent line — male */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent z-20" />
                      {/* Full-Bleed Avatar Background */}
                      <img src={getAvatarUrl(mvp.gamertag, 'male', mvp.avatar)} alt={mvp.gamertag} className="absolute inset-0 w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-700" />
                      {/* Multi-layer Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/50 to-[#0c0a06]/30" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a06]/70 via-transparent to-transparent" />
                      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.15), transparent 60%)' }} />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                        <div className="flex items-center gap-2 bg-[#06b6d4]/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#06b6d4]/30">
                          <Music className="w-4 h-4 text-[#22d3ee]" />
                          <span className="text-[11px] font-bold text-[#22d3ee] uppercase tracking-wider">Male</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-yellow-500/25 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-500/40">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span className="text-[10px] font-black text-yellow-300 uppercase">MVP</span>
                        </div>
                      </div>

                      {/* Bottom Info — DRAMATIC */}
                      <div className="absolute bottom-0 inset-x-0 p-5 z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-3.5 h-3.5 text-[#22d3ee]" />
                          <span className="text-[11px] font-bold text-[#22d3ee]">Week {mvp.weekNumber}</span>
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{mvp.gamertag}</p>
                        <div className="flex items-center gap-2.5 mt-2">
                          <TierBadge tier={mvp.tier} />
                          {mvp.totalMvp > 1 && <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/20 px-2.5 py-1 rounded-lg">{mvp.totalMvp}x MVP</span>}
                        </div>
                        {/* Big Stats */}
                        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/10">
                          <div>
                            <p className="text-2xl font-black text-[#22d3ee]">{mvp.points}</p>
                            <p className="text-[9px] text-[#67e8f9]/50 uppercase font-semibold">Points</p>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div>
                            <p className="text-2xl font-black text-green-400">{mvp.totalWins}</p>
                            <p className="text-[9px] text-green-400/50 uppercase font-semibold">Wins</p>
                          </div>
                          {mvp.streak > 0 && (
                            <>
                              <div className="w-px h-8 bg-white/10" />
                              <div>
                                <p className="text-2xl font-black text-orange-400">🔥{mvp.streak}</p>
                                <p className="text-[9px] text-orange-400/50 uppercase font-semibold">Streak</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>

              {/* Female MVP — Right DRAMATIC HERO CARD */}
              <motion.div variants={fadeRight}>
                {(() => {
                  const mvp = femaleData?.mvpHallOfFame?.[0];
                  if (!mvp) return <div className="py-16 text-center"><div className="w-20 h-20 mx-auto rounded-2xl bg-[#a855f7]/10 flex items-center justify-center mb-4"><Medal className="w-10 h-10 text-[#a855f7]/25" /></div><p className="text-sm font-semibold text-white/50">MVP Belum Dipilih</p><p className="text-xs text-muted-foreground/40 mt-1">Pemain terbaik akan muncul setelah turnamen pertama</p></div>;
                  return (
                    <div
                      className="relative rounded-2xl overflow-hidden cursor-pointer group min-h-[520px] border border-[#a855f7]/15 hover:border-[#a855f7]/30 transition-all duration-300"
                      style={{ boxShadow: '0 0 40px rgba(168,85,247,0.08)' }}
                      onClick={() => {
                        const found = femaleData?.topPlayers?.find(p => p.gamertag === mvp.gamertag);
                        if (found) setSelectedPlayer({ ...found, division: 'female' });
                      }}
                    >
                      {/* Neon accent line — female */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent z-20" />
                      {/* Full-Bleed Avatar Background */}
                      <img src={getAvatarUrl(mvp.gamertag, 'female', mvp.avatar)} alt={mvp.gamertag} className="absolute inset-0 w-full h-full object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-700" />
                      {/* Multi-layer Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/50 to-[#0c0a06]/30" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a06]/70 via-transparent to-transparent" />
                      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.15), transparent 60%)' }} />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                        <div className="flex items-center gap-2 bg-[#a855f7]/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#a855f7]/30">
                          <Shield className="w-4 h-4 text-[#c084fc]" />
                          <span className="text-[11px] font-bold text-[#c084fc] uppercase tracking-wider">Female</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-yellow-500/25 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-500/40">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span className="text-[10px] font-black text-yellow-300 uppercase">MVP</span>
                        </div>
                      </div>

                      {/* Bottom Info — DRAMATIC */}
                      <div className="absolute bottom-0 inset-x-0 p-5 z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-3.5 h-3.5 text-[#c084fc]" />
                          <span className="text-[11px] font-bold text-[#c084fc]">Week {mvp.weekNumber}</span>
                        </div>
                        <p className="text-3xl sm:text-4xl font-black text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{mvp.gamertag}</p>
                        <div className="flex items-center gap-2.5 mt-2">
                          <TierBadge tier={mvp.tier} />
                          {mvp.totalMvp > 1 && <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/20 px-2.5 py-1 rounded-lg">{mvp.totalMvp}x MVP</span>}
                        </div>
                        {/* Big Stats */}
                        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/10">
                          <div>
                            <p className="text-2xl font-black text-[#c084fc]">{mvp.points}</p>
                            <p className="text-[9px] text-[#e9d5ff]/50 uppercase font-semibold">Points</p>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div>
                            <p className="text-2xl font-black text-green-400">{mvp.totalWins}</p>
                            <p className="text-[9px] text-green-400/50 uppercase font-semibold">Wins</p>
                          </div>
                          {mvp.streak > 0 && (
                            <>
                              <div className="w-px h-8 bg-white/10" />
                              <div>
                                <p className="text-2xl font-black text-orange-400">🔥{mvp.streak}</p>
                                <p className="text-[9px] text-orange-400/50 uppercase font-semibold">Streak</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== DONATION & SAWER — After MVP, CTA-Style Background ========== */}
      <section id="sawer" ref={sawerRef} className="relative py-24 px-4 overflow-hidden">
        {/* Background — CTA/Dream style */}
        <div className="absolute inset-0">
          <img src="/bg-section.jpg" alt="" className="w-full h-full object-cover opacity-10" aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.12) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(6,182,212,0.04) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.04) 0%, transparent 40%)' }} />
        </div>
        {/* Ambient orbs */}
        <div className="ambient-light" style={{ top: '20%', right: '15%', animationDuration: '20s' }} />
        <div className="ambient-light" style={{ bottom: '30%', left: '10%', animationDuration: '18s', animationDelay: '-6s' }} />

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}>
            {/* Section Header */}
            <motion.div variants={fadeUp} className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#d4a853]" />
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5">
                  <Gift className="w-4 h-4 text-[#d4a853]" />
                  <span className="text-[11px] font-bold text-[#d4a853] uppercase tracking-[0.25em]">Support</span>
                </div>
                <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#d4a853]" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gradient-champion">Sawer & Donasi</h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">Dukung komunitas dance — sawer untuk hadiah mingguan, donasi untuk masa depan liga</p>
            </motion.div>

            {(() => {
              const maleSawer = maleData?.seasonDonationTotal || 0;
              const femaleSawer = femaleData?.seasonDonationTotal || 0;
              const totalSawer = maleSawer + femaleSawer;
              const totalPrizePool = (maleData?.totalPrizePool || 0) + (femaleData?.totalPrizePool || 0);
              const sawerGoal = Math.max(maleSawer, femaleSawer, totalSawer, 1) * 2;
              const donasiGoal = sawerGoal * 5;
              const maleSawerPercent = Math.min(100, Math.round((maleSawer / (sawerGoal / 2)) * 100));
              const femaleSawerPercent = Math.min(100, Math.round((femaleSawer / (sawerGoal / 2)) * 100));
              const sawerPercent = Math.min(100, Math.round((totalSawer / sawerGoal) * 100));
              const donasiPercent = Math.min(100, Math.round((totalSawer * 0.3 / donasiGoal) * 100));
              const allDonors = [...(maleData?.topDonors || []), ...(femaleData?.topDonors || [])].sort((a, b) => b.totalAmount - a.totalAmount);
              const maleDonors = [...(maleData?.topDonors || [])].sort((a, b) => b.totalAmount - a.totalAmount);
              const femaleDonors = [...(femaleData?.topDonors || [])].sort((a, b) => b.totalAmount - a.totalAmount);

              const getDonorTier = (amount: number) => {
                if (amount >= 500000) return { tier: '💎 Diamond', tierColor: '#60a5fa', tierIcon: '💎' };
                if (amount >= 200000) return { tier: '🥇 Gold', tierColor: '#d4a853', tierIcon: '🥇' };
                if (amount >= 100000) return { tier: '🥈 Silver', tierColor: '#94a3b8', tierIcon: '🥈' };
                return { tier: '🥉 Bronze', tierColor: '#d97706', tierIcon: '🥉' };
              };

              const DonorsList = ({ donors, accent }: { donors: typeof allDonors; accent: string }) => {
                if (donors.length === 0) return null;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-[#d4a853]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: accent }}>Top Contributors</h3>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {donors.slice(0, 6).map((donor, idx) => {
                        const rankColors = [
                          { bg: 'bg-[#d4a853]/20', text: 'text-[#d4a853]', border: 'border-[#d4a853]/30' },
                          { bg: 'bg-slate-400/15', text: 'text-slate-300', border: 'border-slate-400/20' },
                          { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-400/20' },
                        ];
                        const rank = idx < 3 ? rankColors[idx] : { bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/10' };
                        return (
                          <motion.div
                            key={`${donor.donorName}-${idx}`}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -10 : 10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className={`flex items-center justify-between p-3 rounded-xl bg-white/[0.03] backdrop-blur-sm border ${rank.border} transition-all hover:bg-white/[0.06]`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${rank.text} ${rank.bg}`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{donor.donorName}</p>
                                <span className="text-[9px]" style={{ color: getDonorTier(donor.totalAmount).tierColor }}>{getDonorTier(donor.totalAmount).tierIcon} {getDonorTier(donor.totalAmount).tier}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold" style={{ color: accent }}>{formatCurrency(donor.totalAmount)}</p>
                              <p className="text-[9px] text-muted-foreground">{donor.donationCount}x sawer</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              };

              const SawerCard = ({ division }: { division: 'male' | 'female' | 'all' }) => {
                const isMale = division === 'male';
                const isFemale = division === 'female';
                const isAll = division === 'all';
                const accent = isMale ? '#06b6d4' : isFemale ? '#a855f7' : '#d4a853';
                const accentLight = isMale ? '#22d3ee' : isFemale ? '#c084fc' : '#e8d5a3';
                const amount = isMale ? maleSawer : isFemale ? femaleSawer : totalSawer;
                const goal = isAll ? sawerGoal : sawerGoal / 2;
                const percent = isMale ? maleSawerPercent : isFemale ? femaleSawerPercent : sawerPercent;
                const divisionLabel = isMale ? 'Male Division' : isFemale ? 'Female Division' : '';
                const DivisionIcon = isMale ? Music : isFemale ? Shield : Gift;
                const donors = isMale ? maleDonors : isFemale ? femaleDonors : allDonors;

                return (
                  <div className="space-y-6">
                    <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-sm border p-6 transition-all duration-300 hover:bg-white/[0.06] hover:shadow-[0_8px_30px_rgba(212,168,83,0.08)]" style={{ borderColor: `${accent}15` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: accent }} />
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                          <DivisionIcon className="w-5 h-5" style={{ color: accentLight }} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white">Weekly Prize Pool {divisionLabel && <span style={{ color: accentLight }} className="text-sm">{divisionLabel}</span>}</h3>
                          <p className="text-[10px] text-muted-foreground">Sawer untuk menambah hadiah mingguan</p>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black" style={{ color: accent }}>{formatCurrency(amount)}</span>
                          <span className="text-sm text-muted-foreground/60">/ {formatCurrency(goal)}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: accent }}>{percent}%</span>
                      </div>
                      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_12px_rgba(212,168,83,0.4)]"
                          style={{ background: `linear-gradient(to right, ${accent}, ${accentLight}, ${accent})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 mb-5">
                        <span>🔥 {formatCurrency(amount)} collected</span>
                        <span>Goal: {formatCurrency(goal)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[10000, 25000, 50000, 100000].map((amt) => (
                          <motion.button
                            key={amt}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openDonationModal('weekly', amt)}
                            className="px-2 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer"
                            style={{ borderColor: `${accent}20`, backgroundColor: `${accent}08`, color: accentLight }}
                          >
                            💰 Rp {amt >= 1000 ? `${amt / 1000}K` : amt}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <DonorsList donors={donors} accent={accent} />
                    <div className="text-center pt-1">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-sm border" style={{ borderColor: `${accent}15` }}>
                        <Gift className="w-3.5 h-3.5" style={{ color: accent }} />
                        <span className="text-xs font-bold" style={{ color: accent }}>Total Sawer {divisionLabel || 'Semua'}: {formatCurrency(amount)}</span>
                      </div>
                    </div>
                  </div>
                );
              };

              const DonasiCard = () => (
                <div className="space-y-6">
                  <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-[#22d3ee]/15 p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-[#22d3ee]/25 hover:shadow-[0_8px_30px_rgba(6,182,212,0.08)]">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent" />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#22d3ee]" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Season 2 League</h3>
                        <p className="text-[10px] text-muted-foreground">Donasi untuk mendanai liga season berikutnya — bersifat global</p>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-[#22d3ee]">{formatCurrency(Math.round(totalSawer * 0.3))}</span>
                        <span className="text-sm text-muted-foreground/60">/ {formatCurrency(donasiGoal)}</span>
                      </div>
                      <span className="text-sm font-black text-[#22d3ee]">{donasiPercent}%</span>
                    </div>
                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${donasiPercent}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 mb-5">
                      <span>✨ {formatCurrency(Math.round(totalSawer * 0.3))} collected</span>
                      <span>Goal: {formatCurrency(donasiGoal)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[25000, 50000, 100000, 250000].map((amt) => (
                        <motion.button
                          key={amt}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openDonationModal('season', amt)}
                          className="px-2 py-2.5 rounded-xl border border-[#06b6d4]/20 bg-[#06b6d4]/5 text-[#22d3ee] text-xs font-bold hover:bg-[#06b6d4]/15 hover:border-[#06b6d4]/40 transition-all duration-200 cursor-pointer"
                        >
                          ✨ Rp {amt >= 1000 ? `${amt / 1000}K` : amt}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="text-center pt-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-sm border border-[#22d3ee]/15">
                      <Sparkles className="w-3.5 h-3.5 text-[#22d3ee]" />
                      <span className="text-xs font-bold text-[#22d3ee]">Donasi bersifat global — tidak terikat divisi</span>
                    </div>
                  </div>
                </div>
              );

              return (
                <Tabs defaultValue="all" className="w-full">
                  <div className="border-b border-[#d4a853]/10 mb-8">
                    <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
                      {[
                        { value: 'all', label: 'Semua', icon: Sparkles },
                        { value: 'sawer-male', label: 'Sawer Male', icon: Music },
                        { value: 'sawer-female', label: 'Sawer Female', icon: Shield },
                        { value: 'donasi', label: 'Donasi', icon: Wallet },
                      ].map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative px-3 sm:px-5 py-2.5 text-[11px] sm:text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#d4a853] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#d4a853] text-muted-foreground hover:text-[#d4a853]/70 transition-colors"
                        >
                          <tab.icon className="w-3.5 h-3.5 mr-1.5 inline" />
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="mt-0">
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div variants={fadeLeft}>
                          <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-[#d4a853]/15 p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-[#d4a853]/25 hover:shadow-[0_8px_30px_rgba(212,168,83,0.08)]">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent" />
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-10 h-10 rounded-xl bg-[#d4a853]/20 flex items-center justify-center">
                                <Gift className="w-5 h-5 text-[#e8d5a3]" />
                              </div>
                              <div>
                                <h3 className="text-base font-black text-white">Weekly Prize Pool</h3>
                                <p className="text-[10px] text-muted-foreground">Sawer untuk menambah hadiah mingguan</p>
                              </div>
                            </div>
                            <div className="flex items-baseline justify-between mb-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black text-[#d4a853]">{formatCurrency(totalSawer)}</span>
                                <span className="text-sm text-muted-foreground/60">/ {formatCurrency(sawerGoal)}</span>
                              </div>
                              <span className="text-sm font-black text-[#d4a853]">{sawerPercent}%</span>
                            </div>
                            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${sawerPercent}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#d4a853] via-[#e8d5a3] to-[#d4a853] shadow-[0_0_12px_rgba(212,168,83,0.4)]" />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 mb-5">
                              <span>🔥 {formatCurrency(totalSawer)} collected</span>
                              <span>Goal: {formatCurrency(sawerGoal)}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {[10000, 25000, 50000, 100000].map((amt) => (
                                <motion.button key={amt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openDonationModal('weekly', amt)} className="px-2 py-2.5 rounded-xl border border-[#d4a853]/20 bg-[#d4a853]/5 text-[#d4a853] text-xs font-bold hover:bg-[#d4a853]/15 hover:border-[#d4a853]/40 transition-all duration-200 cursor-pointer">
                                  💰 Rp {amt >= 1000 ? `${amt / 1000}K` : amt}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </motion.div>

                        <motion.div variants={fadeRight}>
                          <div className="relative rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-[#22d3ee]/15 p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-[#22d3ee]/25 hover:shadow-[0_8px_30px_rgba(6,182,212,0.08)]">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent" />
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-10 h-10 rounded-xl bg-[#22d3ee]/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#22d3ee]" />
                              </div>
                              <div>
                                <h3 className="text-base font-black text-white">Season 2 League</h3>
                                <p className="text-[10px] text-muted-foreground">Donasi untuk mendanai liga season berikutnya</p>
                              </div>
                            </div>
                            <div className="flex items-baseline justify-between mb-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black text-[#22d3ee]">{formatCurrency(Math.round(totalSawer * 0.3))}</span>
                                <span className="text-sm text-muted-foreground/60">/ {formatCurrency(donasiGoal)}</span>
                              </div>
                              <span className="text-sm font-black text-[#22d3ee]">{donasiPercent}%</span>
                            </div>
                            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: `${donasiPercent}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 mb-5">
                              <span>✨ {formatCurrency(Math.round(totalSawer * 0.3))} collected</span>
                              <span>Goal: {formatCurrency(donasiGoal)}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {[25000, 50000, 100000, 250000].map((amt) => (
                                <motion.button key={amt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openDonationModal('season', amt)} className="px-2 py-2.5 rounded-xl border border-[#06b6d4]/20 bg-[#06b6d4]/5 text-[#22d3ee] text-xs font-bold hover:bg-[#06b6d4]/15 hover:border-[#06b6d4]/40 transition-all duration-200 cursor-pointer">
                                  ✨ Rp {amt >= 1000 ? `${amt / 1000}K` : amt}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                      <DonorsList donors={allDonors} accent="#d4a853" />
                      <motion.div variants={fadeUp} className="text-center pt-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-sm border border-[#d4a853]/15">
                          <Gift className="w-3.5 h-3.5 text-[#d4a853]" />
                          <span className="text-xs font-bold text-[#d4a853]">Total Dukungan: {formatCurrency(totalSawer + totalPrizePool)}</span>
                        </div>
                      </motion.div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sawer-male" className="mt-0">
                    <SawerCard division="male" />
                  </TabsContent>

                  <TabsContent value="sawer-female" className="mt-0">
                    <SawerCard division="female" />
                  </TabsContent>

                  <TabsContent value="donasi" className="mt-0">
                    <DonasiCard />
                  </TabsContent>
                </Tabs>
              );
            })()}
          </motion.div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ========== CLUB PESERTA — Premium Parallax Showcase ========== */}
      <section id="clubs" ref={clubsRef} className="relative py-24 px-4 overflow-hidden">
        {/* Parallax Background Layer */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(212,168,83,0.04) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(212,168,83,0.03) 0%, transparent 50%)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>
        {/* Floating ambient orbs */}
        <div className="ambient-light" style={{ top: '15%', left: '5%', animationDuration: '22s' }} />
        <div className="ambient-light" style={{ bottom: '20%', right: '8%', animationDuration: '18s', animationDelay: '-8s' }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}>
            <SectionHeader icon={Users} label={cmsSections.clubs?.subtitle || "Kompetisi"} title={cmsSections.clubs?.title || "Club & Peserta"} subtitle={cmsSections.clubs?.description || "Club-club terbaik yang bertarung di arena IDM League"} />

            {(() => {
              // Merge clubs from both divisions - combine same clubs into one
              const clubMap = new Map<string, StatsData['clubs'][0] & { divisions: string[] }>();

              // Process male clubs
              if (maleData?.clubs?.length) {
                maleData.clubs.forEach(c => {
                  const existing = clubMap.get(c.name);
                  if (existing) {
                    // Merge data
                    existing.points += c.points;
                    existing.wins += c.wins;
                    existing.losses += c.losses;
                    existing._count.members += c._count?.members || 0;
                    existing.divisions.push('male');
                  } else {
                    clubMap.set(c.name, {
                      ...c,
                      divisions: ['male'],
                      _count: { members: c._count?.members || 0 },
                    });
                  }
                });
              }

              // Process female clubs
              if (femaleData?.clubs?.length) {
                femaleData.clubs.forEach(c => {
                  const existing = clubMap.get(c.name);
                  if (existing) {
                    // Merge data
                    existing.points += c.points;
                    existing.wins += c.wins;
                    existing.losses += c.losses;
                    existing._count.members += c._count?.members || 0;
                    if (!existing.divisions.includes('female')) {
                      existing.divisions.push('female');
                    }
                  } else {
                    clubMap.set(c.name, {
                      ...c,
                      divisions: ['female'],
                      _count: { members: c._count?.members || 0 },
                    });
                  }
                });
              }

              const sortedClubs = Array.from(clubMap.values()).sort((a, b) => a.name.localeCompare(b.name));

              // Top players per division — sorted alphabetically (list, not leaderboard)
              const malePlayers = [...(maleData?.topPlayers || [])].sort((a, b) => a.gamertag.localeCompare(b.gamertag));
              const femalePlayers = [...(femaleData?.topPlayers || [])].sort((a, b) => a.gamertag.localeCompare(b.gamertag));

              return (
                <Tabs defaultValue="clubs" className="w-full">
                  {/* Tab Navigation — Toornament underline style */}
                  <div className="border-b border-[#d4a853]/10 mb-8">
                    <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
                      {[
                        { value: 'clubs', label: 'Club', icon: Users },
                        { value: 'male', label: 'Player Male', icon: Music },
                        { value: 'female', label: 'Player Female', icon: Shield },
                      ].map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative px-4 sm:px-6 py-2.5 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#d4a853] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#d4a853] text-muted-foreground hover:text-[#d4a853]/70 transition-colors"
                        >
                          <tab.icon className="w-3.5 h-3.5 mr-1.5 inline" />
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* ═══════════════ CLUB TAB ═══════════════ */}
                  <TabsContent value="clubs" className="mt-0">
                    {sortedClubs.length === 0 ? null : (
                      <>
                        {/* Club Grid - Limited display */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(showAllClubs ? sortedClubs : sortedClubs.slice(0, 6)).map((club, idx) => {
                            return (
                              <motion.div
                                key={club.name}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -4, scale: 1.03 }}
                                className="cursor-pointer group/club"
                                onClick={() => setSelectedClub(club)}
                              >
                                <div className="relative rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] p-3 text-center transition-all duration-300 overflow-hidden hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#d4a853]/20 bg-white/5 mb-2 group-hover/club:scale-105 transition-transform duration-300">
                                    <img src={getClubLogoUrl(club.name, club.logo)} alt={club.name} className="w-full h-full object-cover" />
                                  </div>
                                  <p className="text-xs sm:text-sm font-black text-white truncate group-hover/club:text-[#d4a853] transition-colors duration-200">{club.name}</p>
                                  <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
                                    <span className="font-black text-[#e8d5a3]">{club.points} PTS</span>
                                    <span className="text-white/30">•</span>
                                    <span className="font-bold text-green-400">{club.wins}W</span>
                                    <span className="text-white/40">/</span>
                                    <span className="font-bold text-red-400">{club.losses}L</span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Show More/Less Button */}
                        {sortedClubs.length > 6 && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => setShowAllClubs(!showAllClubs)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4a853]/10 text-[#d4a853] text-xs font-semibold border border-[#d4a853]/20 hover:bg-[#d4a853]/20 transition-all"
                            >
                              {showAllClubs ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Tampilkan Lebih Sedikit
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Lihat Semua ({sortedClubs.length} Club)
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* ═══════════════ PLAYER MALE TAB ═══════════════ */}
                  <TabsContent value="male" className="mt-0">
                    {malePlayers.length === 0 ? (
                      <div className="py-12 text-center">
                        <Music className="w-10 h-10 text-[#06b6d4]/15 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Belum ada player male</p>
                      </div>
                    ) : (
                      <>
                        {/* Player Grid - Compact */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(showAllPlayers ? malePlayers : malePlayers.slice(0, 6)).map((player, idx) => {
                            const losses = player.matches - player.totalWins;
                            return (
                              <motion.div
                                key={player.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -4, scale: 1.03 }}
                                className="cursor-pointer group/player"
                                onClick={() => setSelectedPlayer({ ...player, division: 'male' })}
                              >
                                <div className="relative rounded-xl bg-white/[0.03] backdrop-blur-sm border border-[#06b6d4]/10 text-center transition-all duration-300 overflow-hidden hover:shadow-[0_8px_24px_rgba(6,182,212,0.08)]">
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent z-20" />
                                  <div className="relative h-28 sm:h-32 overflow-hidden group-hover/player:scale-105 transition-transform duration-500">
                                    <img src={getAvatarUrl(player.gamertag, 'male', player.avatar)} alt={player.gamertag} className="w-full h-full object-cover object-top" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/30 to-transparent" />
                                  </div>
                                  <div className="relative px-2 pb-2.5 pt-1">
                                    <p className="text-xs font-black text-white truncate group-hover/player:text-[#22d3ee] transition-colors duration-200">{player.gamertag}</p>
                                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px]">
                                      <TierBadge tier={player.tier} />
                                      <span className="font-black text-[#22d3ee]">{player.points}</span>
                                      <span className="text-green-400">{player.totalWins}W</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Show More/Less Button */}
                        {malePlayers.length > 6 && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => setShowAllPlayers(!showAllPlayers)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#06b6d4]/10 text-[#22d3ee] text-xs font-semibold border border-[#06b6d4]/20 hover:bg-[#06b6d4]/20 transition-all"
                            >
                              {showAllPlayers ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Tampilkan Lebih Sedikit
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Lihat Semua ({malePlayers.length} Player)
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* ═══════════════ PLAYER FEMALE TAB ═══════════════ */}
                  <TabsContent value="female" className="mt-0">
                    {femalePlayers.length === 0 ? (
                      <div className="py-12 text-center">
                        <Shield className="w-10 h-10 text-[#a855f7]/15 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Belum ada player female</p>
                      </div>
                    ) : (
                      <>
                        {/* Player Grid - Compact */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(showAllPlayers ? femalePlayers : femalePlayers.slice(0, 6)).map((player, idx) => {
                            return (
                              <motion.div
                                key={player.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -4, scale: 1.03 }}
                                className="cursor-pointer group/player"
                                onClick={() => setSelectedPlayer({ ...player, division: 'female' })}
                              >
                                <div className="relative rounded-xl bg-white/[0.03] backdrop-blur-sm border border-[#a855f7]/10 text-center transition-all duration-300 overflow-hidden hover:shadow-[0_8px_24px_rgba(168,85,247,0.08)]">
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent z-20" />
                                  <div className="relative h-28 sm:h-32 overflow-hidden group-hover/player:scale-105 transition-transform duration-500">
                                    <img src={getAvatarUrl(player.gamertag, 'female', player.avatar)} alt={player.gamertag} className="w-full h-full object-cover object-top" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a06] via-[#0c0a06]/30 to-transparent" />
                                  </div>
                                  <div className="relative px-2 pb-2.5 pt-1">
                                    <p className="text-xs font-black text-white truncate group-hover/player:text-[#c084fc] transition-colors duration-200">{player.gamertag}</p>
                                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px]">
                                      <TierBadge tier={player.tier} />
                                      <span className="font-black text-[#c084fc]">{player.points}</span>
                                      <span className="text-green-400">{player.totalWins}W</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Show More/Less Button */}
                        {femalePlayers.length > 6 && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => setShowAllPlayers(!showAllPlayers)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#a855f7]/10 text-[#c084fc] text-xs font-semibold border border-[#a855f7]/20 hover:bg-[#a855f7]/20 transition-all"
                            >
                              {showAllPlayers ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Tampilkan Lebih Sedikit
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Lihat Semua ({femalePlayers.length} Player)
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              );
            })()}
          </motion.div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ========== GALLERY — Premium Parallax Showcase ========== */}
      <GallerySection />

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ========== SEASON GOAL TRACKER — "The Dream" ========== */}
      <section id="dream" ref={dreamRef} className="relative py-28 px-4 overflow-hidden">
        {/* Background — clean gradient without image */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(6,182,212,0.03) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.03) 0%, transparent 40%)' }} />
        {/* Ambient orbs */}
        <div className="ambient-light" style={{ top: '20%', right: '15%', animationDuration: '20s' }} />
        <div className="ambient-light" style={{ bottom: '30%', left: '10%', animationDuration: '18s', animationDelay: '-6s' }} />

        {/* Decorative ring behind content */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#d4a853]/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-[#d4a853]/8" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#d4a853]/50" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5">
                <Crown className="w-4 h-4 text-[#d4a853]" />
                <span className="text-[11px] font-bold text-[#d4a853] uppercase tracking-[0.25em]">Season Goal</span>
              </div>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#d4a853]/50" />
            </div>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-5xl sm:text-7xl font-black text-gradient-champion leading-none">
            The Dream
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
            Setiap dancer punya mimpi — podium tertinggi. Season ini, siapa yang akan mengukir nama di IDM League?
          </motion.p>

          {/* Glass Stat Cards — 3 columns */}
          <motion.div variants={fadeUp} className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Clock, value: `${maleData?.seasonProgress?.completedWeeks || 0}/${maleData?.seasonProgress?.totalWeeks || 11}`, label: 'Minggu', accent: 'border-[#d4a853]/15' },
              { icon: Users, value: `${(maleData?.clubs?.length || 0) + (femaleData?.clubs?.length || 0)}`, label: 'Club', accent: 'border-white/[0.08]' },
              { icon: Trophy, value: formatCurrency((maleData?.totalPrizePool || 0) + (femaleData?.totalPrizePool || 0)), label: 'Prize Pool', accent: 'border-[#d4a853]/15' },
            ].map((s, i) => (
              <div key={s.label} className={`rounded-2xl bg-white/[0.03] backdrop-blur-sm border ${s.accent} p-4 sm:p-5 transition-all duration-300 hover:bg-white/[0.06] hover:scale-[1.02]`}>
                <s.icon className="w-4 h-4 text-[#d4a853] mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-black text-white truncate">{s.value}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Season Progress Bar */}
          <motion.div variants={fadeUp} className="mt-8">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 mb-2 max-w-md mx-auto">
              <span>Season Progress</span>
              <span className="font-bold text-[#d4a853]">{maleData?.seasonProgress?.percentage || 0}%</span>
            </div>
            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mx-auto max-w-md">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${maleData?.seasonProgress?.percentage || 0}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#d4a853] via-[#e8d5a3] to-[#d4a853] shadow-[0_0_20px_rgba(212,168,83,0.3)]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => openDonationModal('weekly')} className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#d4a853] to-[#e8d5a3] text-[#0c0a06] font-black text-sm tracking-wider shadow-[0_0_30px_rgba(212,168,83,0.2)] hover:shadow-[0_0_60px_rgba(212,168,83,0.4)] transition-shadow">
              <Gift className="w-4 h-4 inline mr-2" />Dukung Liga
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== CTA — Premium Glass Reveal ========== */}
      <section ref={ctaRef} className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/bg-section.jpg" alt="" className="w-full h-full object-cover opacity-10" aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.08) 0%, transparent 50%)' }} />
        </div>

        {/* Decorative corner accents */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-[#d4a853]/10 rounded-tl-xl" />
          <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-[#d4a853]/10 rounded-tr-xl" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-[#d4a853]/10 rounded-bl-xl" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-[#d4a853]/10 rounded-br-xl" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="relative z-10 max-w-lg mx-auto text-center"
        >
          <motion.div variants={scaleIn}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-10 h-10 text-[#d4a853]" />
            </motion.div>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-black text-gradient-champion mb-3">
            {cmsSections.cta?.title || 'Punya Skill? Buktikan.'}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-xs text-muted-foreground mb-8">
            {cmsSections.cta?.description || 'Daftar sekarang dan tunjukkan siapa dancer terbaik.'}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="w-full sm:w-auto btn-male px-8 py-6 text-sm font-bold rounded-2xl transition-all"
                onClick={() => enterApp('male')}
              >
                Male Division <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto btn-female px-8 py-6 text-sm font-bold rounded-2xl transition-all"
                onClick={() => enterApp('female')}
              >
                Female Division <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== FOOTER — Premium ========== */}
      <footer className="relative py-12 px-4 border-t border-[#d4a853]/10 bg-[#0c0a06]/50 overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-24 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(212,168,83,0.04) 0%, transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Top row: Brand + Tagline + Nav links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              {/* Brand */}
              <div className="flex flex-col items-center sm:items-start gap-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden glow-pulse shrink-0">
                    <img src={cmsLogo} alt="IDM" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-lg text-gradient-fury font-bold">{cmsSiteTitle}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/50 tracking-wider">{cmsHeroTitle} — {cmsHeroSubtitle}</p>
              </div>

              {/* Quick Nav */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
                {[
                  { id: 'champions', label: 'Champion' },
                  { id: 'mvp', label: 'MVP' },
                  { id: 'clubs', label: 'Club' },
                  { id: 'gallery', label: 'Galeri' },
                  { id: 'sawer', label: 'Sawer' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-[11px] text-muted-foreground/50 hover:text-[#d4a853] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Social */}
              <div className="flex items-center gap-2">
                <a href="#" className="w-9 h-9 rounded-xl glass border border-border/30 flex items-center justify-center text-muted-foreground/60 hover:text-[#d4a853] hover:border-[#d4a853]/30 transition-all" aria-label="Discord">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-xl glass border border-border/30 flex items-center justify-center text-muted-foreground/60 hover:text-[#d4a853] hover:border-[#d4a853]/30 transition-all" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-xl glass border border-border/30 flex items-center justify-center text-muted-foreground/60 hover:text-[#d4a853] hover:border-[#d4a853]/30 transition-all" aria-label="YouTube">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#d4a853]/10 to-transparent mb-6" />

            {/* Bottom row: Tagline + Copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-[#d4a853]/40 font-semibold tracking-wider uppercase">{cmsFooterTagline}</p>
              <p className="text-[9px] text-muted-foreground/30">{cmsFooterText}</p>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          rank={((selectedPlayer.division === 'male' ? maleData : femaleData)?.topPlayers?.findIndex(p => p.id === selectedPlayer.id) ?? -1) + 1}
        />
      )}

      {/* Club Profile Modal */}
      {selectedClub && (
        <ClubProfile
          club={{
            ...selectedClub,
            rank: ((selectedClub.division === 'male' ? maleData : femaleData)?.clubs?.findIndex(c => c.id === selectedClub.id) ?? -1) + 1,
          }}
          onClose={() => setSelectedClub(null)}
          rank={((selectedClub.division === 'male' ? maleData : femaleData)?.clubs?.findIndex(c => c.id === selectedClub.id) ?? -1) + 1}
        />
      )}

      {/* ========== DONATION MODAL ========== */}
      <DonationModal
        open={donationModalOpen}
        onOpenChange={setDonationModalOpen}
        defaultType={donationModalType}
        defaultAmount={donationModalAmount}
      />

      {/* ========== REGISTRATION MODAL ========== */}
      <RegistrationModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
      />

      {/* ========== BACK TO TOP BUTTON ========== */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full glass-strong border border-border/30 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Kembali ke atas"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
