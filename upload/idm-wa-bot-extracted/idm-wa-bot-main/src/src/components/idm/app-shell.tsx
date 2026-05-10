'use client';

import { useAppStore, type AppView } from '@/lib/store';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2, Trophy, Users, Shield, Music,
  Sun, Moon, Menu, X, Home, Flame, Radio, UserPlus, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { AdminLogin } from './admin-login';
import { LandingPage } from './landing-page';
import { DonationPopup } from './donation-popup';
import { NotificationStack } from './notification-stack';
import { useEffect, useState, useCallback } from 'react';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { toast } from 'sonner';

/* ─── Lazy-loaded view components (code-split for smaller initial bundle) ─── */
const viewLoading = (
  <div className="space-y-5 max-w-5xl mx-auto">
    <Skeleton className="h-44 rounded-2xl" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  </div>
);

const Dashboard = dynamic(() => import('./dashboard').then(m => ({ default: m.Dashboard })), {
  loading: () => viewLoading,
});
const TournamentView = dynamic(() => import('./tournament-view').then(m => ({ default: m.TournamentView })), {
  loading: () => viewLoading,
});
const LeagueView = dynamic(() => import('./league-view').then(m => ({ default: m.LeagueView })), {
  loading: () => viewLoading,
});
const AdminPanel = dynamic(() => import('./admin-panel').then(m => ({ default: m.AdminPanel })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" /></div>,
});
const MatchDayCenter = dynamic(() => import('./match-day-center').then(m => ({ default: m.MatchDayCenter })), {
  loading: () => viewLoading,
});
const RegistrationForm = dynamic(() => import('./registration-form').then(m => ({ default: m.RegistrationForm })), {
  loading: () => <div className="max-w-md mx-auto"><Skeleton className="h-96 rounded-2xl" /></div>,
});

const navItems: { id: AppView; label: string; icon: typeof Gamepad2 }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Gamepad2 },
  { id: 'matchday', label: 'Match Day', icon: Radio },
  { id: 'tournament', label: 'Tournament', icon: Music },
  { id: 'league', label: 'League', icon: Trophy },
  { id: 'admin', label: 'Admin', icon: Shield },
];

const actionItems: { id: AppView; label: string; icon: typeof UserPlus }[] = [
  { id: 'register', label: 'Daftar', icon: UserPlus },
];

function DivisionToggle() {
  const { division, setDivision } = useAppStore();
  return (
    <div className="flex items-center bg-muted rounded-full p-1 gap-1">
      <button
        onClick={() => setDivision('male')}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
          division === 'male'
            ? 'bg-idm-male text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        🕺 Male
      </button>
      <button
        onClick={() => setDivision('female')}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
          division === 'female'
            ? 'bg-idm-female text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        💃 Female
      </button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, []);

  if (!mounted) return <div className="w-10 h-10" />;

  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-16 h-8 rounded-full bg-muted transition-all duration-300 hover:scale-105"
      title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
    >
      <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-xs ${
        isDark
          ? 'left-9 bg-amber-500 text-white glow-gold'
          : 'left-1 bg-violet-500 text-white'
      }`}>
        {isDark ? '🌙' : '✨'}
      </div>
    </button>
  );
}

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { currentView, setCurrentView, division, adminAuth, clearAdminAuth } = useAppStore();
  const dt = useDivisionTheme();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    }
    clearAdminAuth();
    setCurrentView('landing');
    toast.success('Berhasil logout');
    onNav?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-11 h-11 rounded-xl overflow-hidden glow-pulse shrink-0">
            <img src="/logo1.webp" alt="IDM" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-gradient-fury text-base font-bold leading-tight">IDM League</h1>
            <p className="text-[10px] text-muted-foreground">Fan Made Edition</p>
          </div>
        </div>
      </div>

      {/* Division Toggle */}
      <div className="px-4 pb-3">
        <DivisionToggle />
      </div>

      <div className="section-divider !my-0" />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        <button
          onClick={() => { setCurrentView('landing'); onNav?.(); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            currentView === 'landing'
              ? `${dt.navActive} glow-pulse`
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Home className="w-4 h-4" />
          Home
        </button>

        <div className="px-3 py-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Navigasi</p>
        </div>

        {actionItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); onNav?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${division === 'male' ? 'from-idm-male/20 to-idm-male/5 text-idm-male' : 'from-idm-female/20 to-idm-female/5 text-idm-female'} glow-pulse`
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'drop-shadow-[0_0_8px_var(--idm-glow)]' : ''}`} />
              {item.label}
              {isActive && (
                <div className={`ml-auto w-1.5 h-1.5 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
              )}
            </button>
          );
        })}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); onNav?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? `${dt.navActive} glow-pulse`
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'drop-shadow-[0_0_8px_var(--idm-glow)]' : ''}`} />
              {item.label}
              {isActive && (
                <div className={`ml-auto w-1.5 h-1.5 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Status / Logout */}
      {adminAuth.isAuthenticated && (
        <div className="mx-3 p-3 rounded-xl bg-idm-gold/5 border border-idm-gold/20 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3 h-3 text-idm-gold" />
            <span className="text-[10px] font-semibold text-idm-gold uppercase tracking-wider">
              {adminAuth.admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground font-medium">{adminAuth.admin?.username}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Season Status */}
      <div className={`mx-3 p-3 rounded-xl ${dt.cardPremium} mb-3`}>
        <div className="flex items-center gap-2 mb-2">
          <Flame className={`w-3 h-3 ${dt.text}`} />
          <span className={`text-[10px] font-semibold ${dt.text} uppercase tracking-wider`}>Season 1</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full w-3/5 rounded-full bg-gradient-to-r ${division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'}`} />
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5">60% Selesai • Week 5/11</p>
      </div>

      {/* Theme Toggle */}
      <div className="p-4 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {division === 'male' ? '✨ Mode Terang' : '🌙 Mode Gelap'}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { currentView, donationPopup, hideDonationPopup, division, adminAuth, setAdminAuth, setCurrentView } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dt = useDivisionTheme();

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.admin) {
          setAdminAuth({ isAuthenticated: true, admin: data.admin });
        }
      } catch {
        // Not authenticated
      }
    }
    checkSession();
  }, [setAdminAuth]);

  // Landing page is standalone - no sidebar/header
  if ((currentView as AppView) === 'landing') {
    return (
      <>
        <LandingPage />
        <DonationPopup
          show={donationPopup.show}
          message={donationPopup.message}
          onClose={hideDonationPopup}
        />
        <NotificationStack />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'matchday': return <MatchDayCenter />;
      case 'tournament': return <TournamentView />;
      case 'league': return <LeagueView />;
      case 'admin': return adminAuth.isAuthenticated ? <AdminPanel /> : <AdminLogin />;
      case 'register': return <RegistrationForm />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-40 ${dt.glassStrong} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden glow-pulse">
            <img src="/logo1.webp" alt="IDM" className="w-full h-full object-cover" />
          </div>
          <span className="text-gradient-fury text-sm font-bold">IDM League</span>
        </div>
        <div className="flex items-center gap-2">
          <DivisionToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onNav={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block w-64 border-r border-border ${dt.glassStrong} sticky top-0 h-screen overflow-y-auto custom-scrollbar`}>
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className={`flex-1 min-w-0 ${dt.bgMesh}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="p-4 lg:p-6 pb-24 lg:pb-6"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav - Premium */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${dt.glassStrong} border-t border-border safe-area-bottom`}>
        <div className="flex justify-around py-1 px-1">
          <button
            onClick={() => useAppStore.getState().setCurrentView('landing')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 relative ${
              (currentView as AppView) === 'landing' ? dt.text : 'text-muted-foreground'
            }`}
          >
            <Home className={`w-5 h-5 ${(currentView as AppView) === 'landing' ? 'drop-shadow-[0_0_8px_var(--idm-glow)]' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
            {(currentView as AppView) === 'landing' && (
              <motion.div layoutId="mobileNav" className={`absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
            )}
          </button>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => useAppStore.getState().setCurrentView(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 relative ${
                  isActive
                    ? dt.text
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_var(--idm-glow)]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div layoutId="mobileNav" className={`absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${division === 'male' ? 'bg-idm-male' : 'bg-idm-female'}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Donation Popup */}
      <DonationPopup
        show={donationPopup.show}
        message={donationPopup.message}
        onClose={hideDonationPopup}
      />

      {/* Notification Stack */}
      <NotificationStack />

      {/* Footer */}
      <footer className="mt-auto py-3 text-center text-xs text-muted-foreground border-t border-border hidden lg:block">
        <span className="text-gradient-fury font-semibold">IDM League</span> — Fan Made Edition © 2025
      </footer>
    </div>
  );
}
