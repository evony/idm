'use client';

import { useAppStore } from '@/lib/store';
import type { Division } from '@/lib/store';

export interface DivisionTheme {
  division: Division;
  text: string;
  textLight: string;
  bg: string;
  bgSubtle: string;
  border: string;
  borderSubtle: string;
  glow: string;
  gradientText: string;
  iconBg: string;
  color: string;
  colorLight: string;
  tabBg: string;
  navActive: string;
  badgeBg: string;
  /* Card frame/border tokens — division neon */
  cardGold: string;
  cardChampion: string;
  glowChampion: string;
  cardGlowHover: string;
  cardPrize: string;
  cardPremium: string;
  /* Division-specific bg/border for inline use */
  prizeBg: string;
  prizeBorder: string;
  prizeText: string;
  /* Casino SpinWin tokens */
  casinoCard: string;
  casinoBar: string;
  casinoGlow: string;
  casinoBadge: string;
  neonText: string;
  neonGradient: string;
  neonPulse: string;
  cornerAccent: string;
  /* Division-tinted background/glass tokens */
  bgMesh: string;
  glassStrong: string;
  /* Hover utility tokens — static CSS classes for Tailwind-safe hover */
  hoverBorder: string;
  hoverBgSubtle: string;
  hoverBg: string;
}

const maleTheme: DivisionTheme = {
  division: 'male',
  text: 'text-idm-male',
  textLight: 'text-idm-male-light',
  bg: 'bg-idm-male/10',
  bgSubtle: 'bg-idm-male/5',
  border: 'border-idm-male/20',
  borderSubtle: 'border-idm-male/10',
  glow: 'glow-male',
  gradientText: 'text-gradient-male',
  iconBg: 'bg-idm-male/10',
  color: '#22d3ee',
  colorLight: '#67e8f9',
  tabBg: 'bg-idm-male/20',
  navActive: 'bg-idm-male/10 text-idm-male',
  badgeBg: 'bg-idm-male/20 text-idm-male border-idm-male/30',
  /* Card neon tokens — cyan */
  cardGold: 'card-gold-male',
  cardChampion: 'card-champion-male',
  glowChampion: 'glow-champion-male',
  cardGlowHover: 'card-glow-hover-male',
  cardPrize: 'card-prize-male',
  cardPremium: 'card-premium card-premium-male',
  /* Inline division colors */
  prizeBg: 'bg-idm-male/5',
  prizeBorder: 'border-idm-male/15',
  prizeText: 'text-idm-male',
  /* Casino SpinWin tokens — male cyan */
  casinoCard: 'casino-card casino-card-male',
  casinoBar: 'casino-card-bar-male',
  casinoGlow: 'casino-glow-male',
  casinoBadge: 'casino-badge casino-badge-male',
  neonText: 'neon-text-male',
  neonGradient: 'text-neon-male',
  neonPulse: 'neon-pulse-male',
  cornerAccent: 'casino-corner-accent',
  /* Division-tinted background/glass tokens */
  bgMesh: 'bg-mesh-male',
  glassStrong: 'glass-strong glass-strong-male',
  /* Hover utility tokens — static CSS classes */
  hoverBorder: 'hover-border-male',
  hoverBgSubtle: 'hover-bg-subtle-male',
  hoverBg: 'hover-bg-male',
};

const femaleTheme: DivisionTheme = {
  division: 'female',
  text: 'text-idm-female',
  textLight: 'text-idm-female-light',
  bg: 'bg-idm-female/10',
  bgSubtle: 'bg-idm-female/5',
  border: 'border-idm-female/20',
  borderSubtle: 'border-idm-female/10',
  glow: 'glow-female',
  gradientText: 'text-gradient-female',
  iconBg: 'bg-idm-female/10',
  color: '#c084fc',
  colorLight: '#e9d5ff',
  tabBg: 'bg-idm-female/20',
  navActive: 'bg-idm-female/10 text-idm-female',
  badgeBg: 'bg-idm-female/20 text-idm-female border-idm-female/30',
  /* Card neon tokens — purple */
  cardGold: 'card-gold-female',
  cardChampion: 'card-champion-female',
  glowChampion: 'glow-champion-female',
  cardGlowHover: 'card-glow-hover-female',
  cardPrize: 'card-prize-female',
  cardPremium: 'card-premium card-premium-female',
  /* Inline division colors */
  prizeBg: 'bg-idm-female/5',
  prizeBorder: 'border-idm-female/15',
  prizeText: 'text-idm-female',
  /* Casino SpinWin tokens — female purple */
  casinoCard: 'casino-card casino-card-female',
  casinoBar: 'casino-card-bar-female',
  casinoGlow: 'casino-glow-female',
  casinoBadge: 'casino-badge casino-badge-female',
  neonText: 'neon-text-female',
  neonGradient: 'text-neon-female',
  neonPulse: 'neon-pulse-female',
  cornerAccent: 'casino-corner-accent casino-corner-accent-female',
  /* Division-tinted background/glass tokens */
  bgMesh: 'bg-mesh-female',
  glassStrong: 'glass-strong glass-strong-female',
  /* Hover utility tokens — static CSS classes */
  hoverBorder: 'hover-border-female',
  hoverBgSubtle: 'hover-bg-subtle-female',
  hoverBg: 'hover-bg-female',
};

export function useDivisionTheme(): DivisionTheme {
  const division = useAppStore((s) => s.division);
  return division === 'male' ? maleTheme : femaleTheme;
}
