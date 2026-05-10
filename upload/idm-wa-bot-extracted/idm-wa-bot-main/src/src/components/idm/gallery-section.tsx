'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Camera, Trophy, Users, Film, Award,
  ChevronLeft, ChevronRight, X, Eye, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ========== Gallery Data ========== */
interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  category: 'tournament' | 'community' | 'behind' | 'achievement';
  date: string;
  tag: string;
  featured?: boolean;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1', src: '/gallery/tournament-stage.png', alt: 'Tournament Stage',
    title: 'IDM League Arena', description: 'Panggung utama IDM League dengan efek holografik dan pencahayaan neon yang memukau',
    category: 'tournament', date: '2025-01-15', tag: 'LIVE EVENT',
    featured: true,
  },
  {
    id: 'g2', src: '/gallery/dance-battle.png', alt: 'Dance Battle',
    title: 'Dance Battle Face-Off', description: 'Momen duel dance paling intens di atas panggung',
    category: 'tournament', date: '2025-01-22', tag: 'WEEK 3',
  },
  {
    id: 'g3', src: '/gallery/bracket-display.png', alt: 'Bracket Display',
    title: 'Bracket Elimination', description: 'Papan bracket turnamen — setiap match menentukan nasib',
    category: 'tournament', date: '2025-02-05', tag: 'BRACKET',
  },
  {
    id: 'g4', src: '/gallery/dance-performance.png', alt: 'Dance Performance',
    title: 'Penampilan Lorent', description: 'Penampilan dance dengan laser show dan efek panggung yang memukau',
    category: 'tournament', date: '2025-02-12', tag: 'PERFORMANCE',
  },
  {
    id: 'g5', src: '/gallery/community-meetup.png', alt: 'Community Meetup',
    title: 'Community Game Night', description: 'Members komunitas berkumpul untuk game night bersama',
    category: 'community', date: '2025-01-10', tag: 'KOMUNITAS',
    featured: true,
  },
  {
    id: 'g6', src: '/gallery/streamer-setup.png', alt: 'Streamer Setup',
    title: 'Streamer Corner', description: 'Setup streaming para member — dari bedroom studio hingga professional booth',
    category: 'community', date: '2025-01-18', tag: 'CREATOR',
  },
  {
    id: 'g10', src: '/gallery/champion-celebration.png', alt: 'Champion Celebration',
    title: 'Juara League!', description: 'Momen kemenangan tim juara — confetti, trophy, dan air mata bahagia',
    category: 'achievement', date: '2025-02-15', tag: 'CHAMPION',
    featured: true,
  },
  {
    id: 'g11', src: '/gallery/award-ceremony.png', alt: 'Award Ceremony',
    title: 'Upacara Penghargaan', description: 'Penghargaan untuk pemain & tim terbaik sepanjang season',
    category: 'achievement', date: '2025-02-20', tag: 'AWARD',
  },
];

/* ========== Category Definitions ========== */
const CATEGORIES = [
  { id: 'all' as const, label: 'Semua', icon: Camera },
  { id: 'tournament' as const, label: 'Turnamen', icon: Trophy },
  { id: 'community' as const, label: 'Komunitas', icon: Users },
  { id: 'achievement' as const, label: 'Prestasi', icon: Award },
];

type CategoryId = (typeof CATEGORIES)[number]['id'];

/* ========== Lightbox ========== */
function Lightbox({ item, onClose, onPrev, onNext }: {
  item: GalleryItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-[#d4a853]/20 flex items-center justify-center text-[#d4a853] hover:text-white hover:bg-[#d4a853]/20 transition-all">
          <X className="w-5 h-5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-[#d4a853]/20 flex items-center justify-center text-[#d4a853] hover:text-white hover:bg-[#d4a853]/20 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-[#d4a853]/20 flex items-center justify-center text-[#d4a853] hover:text-white hover:bg-[#d4a853]/20 transition-all">
          <ChevronRight className="w-6 h-6" />
        </button>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-5xl w-full max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-black border border-[#d4a853]/10">
            <img src={item.src} alt={item.alt} className="w-full h-full object-contain" />
          </div>
          <div className="mt-4 flex items-center gap-4 px-2">
            <div className="flex-1 min-w-0">
              <Badge className="bg-[#d4a853]/20 text-[#d4a853] border-[#d4a853]/30 text-[10px] mb-2">
                {item.tag}
              </Badge>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-sm text-white/50 mt-1">{item.description}</p>
            </div>
            <span className="text-xs text-white/30 shrink-0 font-mono tabular-nums">{item.date}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ========== Main Component ========== */
export function GallerySection() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '-5%']);

  const filteredItems = activeCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(g => g.category === activeCategory);

  // Separate featured and regular items
  const featuredItems = filteredItems.filter(item => item.featured);
  const regularItems = filteredItems.filter(item => !item.featured);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => {
    setLightboxIndex(prev => prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null);
  };
  const nextImage = () => {
    setLightboxIndex(prev => prev !== null ? (prev + 1) % filteredItems.length : null);
  };

  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex]);

  return (
    <>
      <section id="gallery" ref={sectionRef} className="relative py-20 sm:py-28 overflow-hidden bg-background">
        {/* Background with bg-section.jpg */}
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <img src="/bg-section.jpg" alt="" className="w-full h-full object-cover opacity-10" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#d4a853]" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4a853]/20 bg-[#d4a853]/5">
                <Camera className="w-4 h-4 text-[#d4a853]" />
                <span className="text-[11px] font-bold text-[#d4a853] uppercase tracking-[0.25em]">Galeri</span>
              </div>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#d4a853]" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
              Momen <span className="text-gradient-champion">Komunitas</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Kumpulan momen terbaik dari kegiatan IDM League
            </p>
          </motion.div>

          {/* ── Category Filter ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-10"
          >
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-[#d4a853]/10">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                const count = cat.id === 'all'
                  ? GALLERY_ITEMS.length
                  : GALLERY_ITEMS.filter(g => g.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-[#d4a853]/15 text-[#d4a853] shadow-sm'
                        : 'text-muted-foreground hover:text-[#d4a853]/70 hover:bg-[#d4a853]/5'
                    }`}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                    <span className={`text-[10px] tabular-nums ${isActive ? 'text-[#d4a853]/60' : 'text-muted-foreground/40'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* ── Featured Gallery (Large Cards) ── */}
          {featuredItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
            >
              {featuredItems.slice(0, 3).map((item, index) => {
                const actualIndex = filteredItems.findIndex(i => i.id === item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => openLightbox(actualIndex)}
                  >
                    <div className="relative overflow-hidden rounded-xl border border-[#d4a853]/10 bg-card transition-all duration-500 hover:border-[#d4a853]/30 hover:shadow-lg aspect-[16/10]">
                      {/* Image */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Featured badge */}
                      <Badge className="absolute top-3 right-3 bg-[#d4a853] text-black text-[10px] font-bold px-2.5 py-1 border-0">
                        {item.tag}
                      </Badge>

                      {/* Bottom content */}
                      <div className="absolute bottom-0 inset-x-0 p-4">
                        <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-[#d4a853] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-white/60 mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#d4a853]/20 backdrop-blur-sm border border-[#d4a853]/30 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-[#d4a853]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Regular Gallery (Compact Grid) ── */}
          {regularItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
            >
              {regularItems.map((item, index) => {
                const actualIndex = filteredItems.findIndex(i => i.id === item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => openLightbox(actualIndex)}
                  >
                    <div className="relative overflow-hidden rounded-lg border border-[#d4a853]/10 bg-card transition-all duration-300 hover:border-[#d4a853]/30 hover:shadow-md aspect-square">
                      {/* Image */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                      {/* Tag badge */}
                      <Badge className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 border-0">
                        {item.tag}
                      </Badge>

                      {/* Title on hover */}
                      <div className="absolute bottom-0 inset-x-0 p-2.5 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-[11px] font-semibold text-white truncate">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Camera className="w-12 h-12 text-[#d4a853]/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Belum ada foto untuk kategori ini</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <Lightbox
          item={filteredItems[lightboxIndex]}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
}
