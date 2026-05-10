'use client';

import { useAppStore, type AppView } from '@/lib/store';
import Image from 'next/image';
import {
  Users, Shield,
  Home, LogOut, KeyRound, LogIn,
  PanelLeftClose, ChevronRight, Download, X, UserCircle,
  Calendar, ShoppingBag, Radio, BookOpen, UserPlus, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CasinoHeroSkeleton, StatsRowSkeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { useShellTheme } from '@/hooks/use-shell-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWA } from '@/hooks/use-pwa';
import { usePusherRealtime } from '@/hooks/use-pusher';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useHaptic, PullToRefresh } from '@/components/idm/ui/mobile-interactions';

/* ─── Lazy-loaded view components (code-split for smaller initial bundle) ─── */
const viewLoading = (
  <div className="space-y-4">
    <CasinoHeroSkeleton />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card/60 p-4">
        <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
      </div>
      <div className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-2">
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        <div className="skeleton-shimmer h-6 w-32 rounded" />
        <div className="skeleton-shimmer h-1.5 w-full rounded-full" />
      </div>
    </div>
    <StatsRowSkeleton count={4} />
  </div>
);

const Dashboard = dynamic(() => import('./dashboard').then(m => ({ default: m.Dashboard })), {
  loading: () => viewLoading,
});
const LeagueView = dynamic(() => import('./league-view').then(m => ({ default: m.LeagueView })), {
  loading: () => viewLoading,
});
const AdminPanel = dynamic(() => import('./admin-panel').then(m => ({ default: m.AdminPanel })), {
  loading: () => <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-idm-gold-warm border-t-transparent rounded-full animate-spin" /></div>,
});
const MatchDayCenter = dynamic(() => import('./match-day-center').then(m => ({ default: m.MatchDayCenter })), {
  loading: () => viewLoading,
});
const RegistrationForm = dynamic(() => import('./registration-form').then(m => ({ default: m.RegistrationForm })), {
  loading: () => <div className="max-w-md mx-auto"><div className="skeleton-shimmer h-96 rounded-2xl" /></div>,
});
const CommunityDashboard = dynamic(() => import('./community-dashboard').then(m => ({ default: m.CommunityDashboard })), {
  loading: () => viewLoading,
});

const MarketplaceView = dynamic(() => import('./marketplace-view').then(m => ({ default: m.MarketplaceView })), {
  loading: () => viewLoading,
});
const BracketPage = dynamic(() => import('./bracket-page').then(m => ({ default: m.BracketPage })), {
  loading: () => viewLoading,
});

/* ─── ★ LandingPage: Direct import (NOT dynamic) to prevent FOUC on skinMap ───
   Previously used dynamic() which caused a blank loading placeholder to flash
   over the SSR-rendered content, making skins disappear for a fraction of a second
   after every page refresh. Since LandingPage is the default/primary view, there's
   no benefit to lazy-loading it — it should be immediately available. */
import { LandingPage } from './landing-page';
const DonationPopup = dynamic(() => import('./donation-popup').then(m => ({ default: m.DonationPopup })), {
  loading: () => null,
});

const UnifiedLoginModal = dynamic(() => import('./unified-login-modal').then(m => ({ default: m.UnifiedLoginModal })), {
  loading: () => null,
});

const RegistrationModal = dynamic(() => import('./registration-modal').then(m => ({ default: m.RegistrationModal })), {
  loading: () => null,
});

/* ─── Navigation Items — Unified Community Dashboard ─── */
type NavItemDef = {
  id: AppView;
  label: string;
  icon: typeof Home;
  division?: 'male' | 'female';
  isSubItem?: boolean;
};

const communityNavItems: NavItemDef[] = [
  { id: 'community', label: 'Komunitas', icon: Users },
  { id: 'matchday', label: 'Arena Live', icon: Radio },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'league', label: 'Peraturan', icon: BookOpen },
];

/* ─── Collapsible Desktop Sidebar ─── */
function DesktopSidebar({ onOpenAccountModal, onOpenAdminModal }: { onOpenAccountModal: () => void; onOpenAdminModal: () => void }) {
  const { currentView, setCurrentView, division, setDivision, adminAuth, clearAdminAuth, sidebarCollapsed, toggleSidebarCollapsed, playerAuth, clearPlayerAuth } = useAppStore();
  const dt = useShellTheme();

  const { data: leagueSummary } = useQuery<{ seasonNumber: number; status: string; completedWeeks: number; totalWeeks: number; percentage: number }>({
    queryKey: ['league-summary'],
    queryFn: () => fetch('/api/league').then(r => r.json()).then(d => {
      const sn = d.tarkamChampion?.seasonNumber || d.season?.number || 1;
      const tw = d.stats?.totalWeeks || 0;
      const cw = d.stats?.playedWeeks || 0;
      return {
        seasonNumber: sn,
        status: d.tarkamChampion ? 'completed' : d.preSeason ? 'pre-season' : d.hasData ? 'active' : 'upcoming',
        completedWeeks: cw,
        totalWeeks: tw,
        percentage: tw > 0 ? Math.round((cw / tw) * 100) : 0,
      };
    }),
    staleTime: 300_000,
    refetchOnMount: false,
    // refetchOnWindowFocus tetap TRUE (default) — kalau admin update,
    // user yang switch tab balik akan auto-refresh kalau data sudah stale
  });

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    clearAdminAuth();
    setCurrentView('landing');
    toast.success('Berhasil logout');
  };

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-border/60 ${dt.glassStrong} shrink-0 h-full overflow-hidden shadow-lg shadow-black/5 transition-[width] duration-150 ease-in-out ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Logo + Toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-5'} pt-4 pb-2`}>
        <div className={`rounded-2xl overflow-hidden shrink-0 ${collapsed ? 'w-9 h-9' : 'w-11 h-11 lg:shadow-lg lg:shadow-idm-gold/10'}`}>
          <Image src="/logo1.webp" alt="IDM" width={48} height={48} className="w-full h-full object-cover" priority />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="text-gradient-fury text-base font-bold leading-tight truncate">Tarkam IDM</h1>
            <p className="text-[10px] text-muted-foreground">Fan Made Edition</p>
          </div>
        )}
        {/* Toggle — compact, inline with logo */}
        <button
          onClick={toggleSidebarCollapsed}
          className={`group relative p-1 rounded-lg transition-all duration-200 ${collapsed ? '' : 'shrink-0'}`}
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          <span className="relative z-10 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted/60 rounded-md transition-colors">
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <PanelLeftClose className="w-3.5 h-3.5" />
            }
          </span>
        </button>
      </div>

      {/* ═══ Season Context — Visual Anchor, right after branding ═══ */}
      {!collapsed && (
        <div className={`mx-4 mt-1 mb-2 p-2.5 rounded-2xl ${dt.cardPremium} border border-border/40`}>
          {leagueSummary ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className={`w-3.5 h-3.5 ${dt.text}`} />
                  <span className={`text-[11px] font-bold ${dt.text} tracking-wide`}>IDM TARKAM Season {leagueSummary.seasonNumber}</span>
                </div>
                <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                  leagueSummary.status === 'active' ? 'bg-green-500/15 text-green-400' :
                  leagueSummary.status === 'completed' ? 'bg-idm-gold/15 text-idm-gold' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {leagueSummary.status === 'active' ? 'AKTIF' : leagueSummary.status === 'completed' ? 'SELESAI' : 'UPCOMING'}
                </span>
              </div>
              {/* Week progress bar */}
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${currentView === 'community' ? 'from-idm-gold-warm to-idm-amber' : division === 'male' ? 'from-idm-male to-idm-male-light' : 'from-idm-female to-idm-female-light'} transition-all duration-700`}
                  style={{ width: `${leagueSummary.percentage || 0}%` }}
                />
              </div>
              {/* Week dots indicator */}
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: leagueSummary.totalWeeks || 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < (leagueSummary.completedWeeks || 0)
                        ? division === 'male' ? 'bg-idm-male' : 'bg-idm-female'
                        : 'bg-muted'
                    }`
                    }
                  />
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
                Week {leagueSummary.completedWeeks}/{leagueSummary.totalWeeks || '?'} • {leagueSummary.percentage}%
              </p>
            </>
          ) : (
            /* Skeleton placeholder — prevents CLS when data loads */
            <div className="space-y-2 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-32 rounded bg-muted/40" />
                <div className="h-3 w-12 rounded bg-muted/40" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/40" />
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full bg-muted/40" />
                ))}
              </div>
              <div className="h-2 w-20 mx-auto rounded bg-muted/40" />
            </div>
          )}
        </div>
      )}

      {/* Collapsed: mini season indicator */}
      {collapsed && leagueSummary && (
        <div className="px-2 py-1 flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-lg ${dt.cardPremium} border border-border/40 flex flex-col items-center justify-center`}
            title={`IDM TARKAM Season ${leagueSummary.seasonNumber} — Week ${leagueSummary.completedWeeks}/${leagueSummary.totalWeeks}`}>
            <span className={`text-[8px] font-bold ${dt.text}`}>S{leagueSummary.seasonNumber}</span>
            <span className="text-[6px] text-muted-foreground">{leagueSummary.completedWeeks}/{leagueSummary.totalWeeks || '?'}</span>
          </div>
        </div>
      )}

      <div className="section-divider !my-0" />

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-1.5' : 'px-3'} py-3 space-y-0.5 overflow-y-auto custom-scrollbar`}>
        {/* Home */}
        <NavButton
          icon={Home} label="Home" collapsed={collapsed}
          isActive={currentView === 'landing'}
          iconBg={currentView === 'landing' ? dt.iconBg : ''}
          activeGlow={currentView === 'landing'}
          division={division}
          navActive={dt.navActive}
          onClick={() => setCurrentView('landing')}
        />

        {!collapsed && (
          <div className="px-3 py-1.5">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Arena</p>
          </div>
        )}

        {collapsed && <div className="my-1 mx-auto w-6 h-px bg-border/40" />}

        {/* Community + Division Nav Items */}
        {communityNavItems.map((item) => {
          const isActive = item.division
            ? currentView === item.id && division === item.division
            : currentView === item.id;

          let iconBg = '';
          if (isActive) {
            if (item.division === 'male') iconBg = 'bg-idm-male/15';
            else if (item.division === 'female') iconBg = 'bg-idm-female/15';
            else if (item.id === 'marketplace') iconBg = 'bg-idm-gold-warm/15';
            else if (item.id === 'league') iconBg = 'bg-idm-gold-warm/15';
            else if (item.id === 'matchday') iconBg = 'bg-red-500/15';
            else iconBg = dt.iconBg;
          }

          return (
            <NavButton
              key={`nav-${item.label}`}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              isActive={isActive}
              iconBg={iconBg}
              activeGlow={isActive}
              division={item.division || division}
              navActive={dt.navActive}
              isCommunity={!item.division}
              onClick={() => {
                if (item.division) setDivision(item.division);
                setCurrentView(item.id);
              }}
            />
          );
        })}

        {collapsed && <div className="my-1 mx-auto w-6 h-px bg-border/40" />}

        {!collapsed && (
          <div className="px-3 py-1.5">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Lainnya</p>
          </div>
        )}

        {/* Admin */}
        <NavButton
          icon={Shield} label="Admin" collapsed={collapsed}
          isActive={currentView === 'admin'}
          iconBg={currentView === 'admin' ? dt.iconBg : ''}
          activeGlow={currentView === 'admin'}
          division={division}
          navActive={dt.navActive}
          onClick={() => adminAuth.isAuthenticated ? setCurrentView('admin') : onOpenAdminModal()}
        />
      </nav>

      {/* ═══ Bottom Section — Unified Identity ═══ */}
      {!collapsed && (
        <>
          {(playerAuth.isAuthenticated || adminAuth.isAuthenticated) ? (
            <div className="mx-4 mb-3 p-2.5 rounded-2xl bg-card/60 border border-border/50">
              {playerAuth.isAuthenticated && playerAuth.account && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${currentView === 'community' ? 'bg-idm-gold-warm/15' : division === 'male' ? 'bg-idm-male/15' : 'bg-idm-female/15'}`}>
                    <UserCircle className={`w-3.5 h-3.5 ${currentView === 'community' ? 'text-idm-gold-warm' : division === 'male' ? 'text-idm-male' : 'text-idm-female'}`} />
                  </div>
                  <span className="text-[11px] text-foreground font-medium truncate flex-1">{playerAuth.account.player.gamertag}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      onClick={onOpenAccountModal} title="Akun Saya">
                      <UserCircle className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={async () => { try { await fetch('/api/account/logout', { method: 'POST' }); } catch {} clearPlayerAuth(); toast.success('Berhasil logout'); }} title="Logout">
                      <LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              {playerAuth.isAuthenticated && adminAuth.isAuthenticated && (
                <div className="h-px bg-border/40 my-1.5" />
              )}
              {adminAuth.isAuthenticated && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-idm-gold/20 shadow-[0_0_6px_rgba(212,168,83,0.2)]">
                    <Shield className="w-4 h-4 text-idm-gold drop-shadow-[0_0_4px_rgba(212,168,83,0.5)]" />
                  </div>
                  <span className="text-[11px] text-foreground font-medium truncate flex-1">{adminAuth.admin?.username}</span>
                  {adminAuth.admin && (
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-idm-gold/15 text-idm-gold uppercase tracking-wider shrink-0">
                      {adminAuth.admin.role === 'super_admin' ? 'SA' : 'ADM'}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-idm-gold hover:bg-idm-gold/10"
                      onClick={() => setCurrentView('admin')} title="Admin Panel">
                      <KeyRound className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={handleLogout} title="Logout">
                      <LogOut className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mx-4 mb-3">
              <button
                onClick={onOpenAccountModal}
                className="w-full flex items-center gap-2 p-2.5 rounded-2xl border border-idm-gold-warm/25 bg-idm-gold-warm/[0.06] hover:bg-idm-gold-warm/[0.12] hover:border-idm-gold-warm/40 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-idm-gold-warm/20 relative">
                  <LogIn className="w-3.5 h-3.5 text-idm-gold-warm" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-idm-gold-warm shadow-[0_0_6px_rgba(212,168,83,0.8)]" />
                </div>
                <span className="text-[11px] text-idm-gold-warm font-bold">Login</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Collapsed: mini identity indicator */}
      {collapsed && (
        <div className="px-2 pb-2 flex flex-col items-center gap-1">
          {adminAuth.isAuthenticated && (
            <div className="w-8 h-8 rounded-lg bg-idm-gold/15 border border-idm-gold/30 flex items-center justify-center shadow-[0_0_8px_rgba(212,168,83,0.2)]"
              title={`${adminAuth.admin?.username} (${adminAuth.admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'})`}>
              <Shield className="w-4 h-4 text-idm-gold drop-shadow-[0_0_4px_rgba(212,168,83,0.5)]" />
            </div>
          )}
          {playerAuth.isAuthenticated && !adminAuth.isAuthenticated && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentView === 'community' ? 'bg-idm-gold-warm/10 border border-idm-gold-warm/25' : division === 'male' ? 'bg-idm-male/10 border border-idm-male/20' : 'bg-idm-female/10 border border-idm-female/20'}`}
              title={playerAuth.account?.player.gamertag}>
              <UserCircle className={`w-3.5 h-3.5 ${currentView === 'community' ? 'text-idm-gold-warm' : division === 'male' ? 'text-idm-male' : 'text-idm-female'}`} />
            </div>
          )}
          {!playerAuth.isAuthenticated && !adminAuth.isAuthenticated && (
            <button
              onClick={onOpenAccountModal}
              className="w-8 h-8 rounded-lg bg-idm-gold-warm/12 border border-idm-gold-warm/25 flex items-center justify-center text-idm-gold-warm hover:text-idm-gold-warm hover:bg-idm-gold-warm/20 transition-colors relative shadow-[0_0_6px_rgba(212,168,83,0.15)]"
              title="Login"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-idm-gold-warm shadow-[0_0_6px_rgba(212,168,83,0.8)]" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

/* ─── Nav Button — shared between collapsed & expanded ─── */
function NavButton({ icon: Icon, label, collapsed, isActive, iconBg, activeGlow, division, isSubItem, navActive, isCommunity, onClick }: {
  icon: typeof Home; label: string; collapsed: boolean;
  isActive: boolean; iconBg: string; activeGlow: boolean; division: string;
  isSubItem?: boolean; navActive: string; isCommunity?: boolean;
  onClick: () => void;
}) {
  const accentBar = isCommunity ? 'bg-idm-gold-warm' : division === 'male' ? 'bg-idm-male' : 'bg-idm-female';
  const accentBorder = isCommunity ? 'border-l-idm-gold-warm' : division === 'male' ? 'border-l-idm-male' : 'border-l-idm-female';
  const accentDot = accentBar;

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        title={label}
        className={`w-full flex items-center justify-center py-2.5 rounded-lg transition-all duration-200 relative ${
          isActive
            ? navActive
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }`}
      >
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        {isActive && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${accentBar}`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-sm font-medium transition-all duration-200 rounded-lg ${
        isSubItem ? 'pl-10' : ''
      } ${
        isActive
          ? `${navActive} border-l-2 ${accentBorder}`
          : isSubItem
            ? 'text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      <div className={`flex items-center justify-center ${isSubItem ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg ${iconBg} shrink-0`}>
        <Icon className={`${isSubItem ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      </div>
      <span className={`py-2.5 ${isSubItem ? 'text-xs' : ''}`}>{label}</span>
      {isActive && (
        <div className={`ml-auto w-1.5 h-1.5 rounded-full ${accentDot}`} />
      )}
    </button>
  );
}

export function AppShell() {
  const { currentView, donationPopup, hideDonationPopup, division, setDivision, adminAuth, setAdminAuth, clearAdminAuth, setCurrentView, playerAuth, setPlayerAuth, clearPlayerAuth, refreshPlayerSession } = useAppStore();
  const dt = useShellTheme();
  const { hapticTap } = useHaptic();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { canInstall: _canInstall, promptInstall } = usePWA();
  const _pusherRealtime = usePusherRealtime();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('pwa-install-dismissed');
  });
  const canInstall = _canInstall && !dismissed;
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalDefaultTab, setAccountModalDefaultTab] = useState<'peserta' | 'admin'>('peserta');
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  // ★ Parallel session checks — both run at the same time
  useEffect(() => {
    async function checkSessions() {
      const [adminRes, playerRes] = await Promise.allSettled([
        fetch('/api/auth/session').then(r => r.json()),
        fetch('/api/account/session').then(r => r.json()),
      ]);
      if (adminRes.status === 'fulfilled' && adminRes.value.authenticated && adminRes.value.admin) {
        setAdminAuth({ isAuthenticated: true, admin: adminRes.value.admin });
      } else {
        // Session invalid — clear stale auth state so user sees login prompt
        clearAdminAuth();
      }
      if (playerRes.status === 'fulfilled' && playerRes.value.authenticated && playerRes.value.account) {
        setPlayerAuth({ isAuthenticated: true, account: playerRes.value.account });
      } else {
        clearPlayerAuth();
      }
    }
    checkSessions();
  }, [setAdminAuth, setPlayerAuth, clearAdminAuth, clearPlayerAuth]);

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
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
      case 'community': return <CommunityDashboard />;
      case 'matchday': return <MatchDayCenter />;
      case 'league': return <LeagueView />;
      case 'admin': return adminAuth.isAuthenticated ? <AdminPanel /> : (() => { setTimeout(() => { setAccountModalDefaultTab('admin'); setAccountModalOpen(true); setCurrentView('community'); }, 0); return null; })();
      case 'register': return <RegistrationForm />;

      case 'marketplace': return <MarketplaceView onLoginRequired={() => { setAccountModalDefaultTab('peserta'); setAccountModalOpen(true); }} />;
      case 'bracket': return <BracketPage />;
      default: return <CommunityDashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-40 ${dt.glassStrong} px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {currentView !== 'landing' && currentView !== 'community' && currentView !== 'dashboard' && (
            <button
              onClick={() => { hapticTap(); setCurrentView('community'); }}
              className="w-8 h-8 flex items-center justify-center text-idm-gold-warm hover:bg-idm-gold-warm/10 rounded-lg transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <Image src="/logo1.webp" alt="IDM" width={28} height={28} className="w-full h-full object-cover" priority />
          </div>
          <span className="text-gradient-fury text-sm font-bold">
            Tarkam IDM{currentView !== 'landing' && currentView !== 'community' && currentView !== 'dashboard' && (
              <span className="text-idm-gold-warm"> · {{
                matchday: 'Arena Live',
                marketplace: 'Marketplace',
                league: 'Peraturan',
                bracket: 'Bracket',
                register: 'Daftar',
                admin: 'Admin',
              }[currentView as string] || ''}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!playerAuth.isAuthenticated && !adminAuth.isAuthenticated ? (
            <button
              onClick={() => { hapticTap(); setAccountModalDefaultTab('peserta'); setAccountModalOpen(true); }}
              className="btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border border-idm-gold-warm/25 text-idm-gold-warm hover:bg-idm-gold-warm/10 hover:border-idm-gold-warm/40 active:scale-95"
              title="Login"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
              <span className="w-1.5 h-1.5 rounded-full bg-idm-gold-warm shadow-[0_0_6px_rgba(212,168,83,0.8)]" />
            </button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 relative ${playerAuth.isAuthenticated ? (currentView === 'community' ? 'text-idm-gold-warm' : division === 'male' ? 'text-idm-male' : 'text-idm-female') : adminAuth.isAuthenticated ? 'text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.3)]' : 'text-idm-gold-warm/80'}`}
              onClick={() => { hapticTap(); setAccountModalDefaultTab('peserta'); setAccountModalOpen(true); }}
              title={playerAuth.isAuthenticated ? `Akun: ${playerAuth.account?.player.gamertag}` : adminAuth.isAuthenticated ? `Admin: ${adminAuth.admin?.username}` : 'Login'}
            >
              {playerAuth.isAuthenticated ? (
                <UserCircle className="w-4.5 h-4.5" />
              ) : adminAuth.isAuthenticated ? (
                <Shield className="w-4.5 h-4.5 text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]" />
              ) : (
                <LogIn className="w-4.5 h-4.5" />
              )}
            </Button>
          )}
        </div>
      </header>

      {/* PWA Install Banner — fixed overlay so it doesn't push content (CLS fix) */}
      {canInstall && !dismissed && (
        <div className={`lg:hidden fixed top-12 left-0 right-0 z-30 ${dt.glassStrong} border-b ${dt.border} px-3 py-2 flex items-center gap-2`}>
          <Download className="w-4 h-4 text-idm-gold-warm shrink-0" />
          <p className="text-[11px] flex-1">Install Tarkam IDM di HP-mu untuk akses cepat!</p>
          <button
            onClick={() => { promptInstall(); }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-idm-gold-warm to-[#e8d5a3] text-black shrink-0"
          >
            Install
          </button>
          <button
            onClick={() => { setDismissed(true); localStorage.setItem('pwa-install-dismissed', '1'); }}
            className="p-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <DesktopSidebar onOpenAccountModal={() => { setAccountModalDefaultTab('peserta'); setAccountModalOpen(true); }} onOpenAdminModal={() => { setAccountModalDefaultTab('admin'); setAccountModalOpen(true); }} />

        <main className={`flex-1 min-w-0 overflow-y-auto ${dt.bgMesh}`}>
          {(() => {
            /* Mobile: edge-to-edge (no horizontal padding) for community/dashboard views
               to eliminate the 3-layer background gap issue.
               iOS style: content touches screen edges, cards have their own internal padding. */
            const isFullBleed = currentView === 'dashboard' || currentView === 'community' || currentView === 'marketplace' || currentView === 'bracket' || currentView === 'matchday' || currentView === 'league';
            const contentClass = `pt-2 ${isFullBleed ? 'px-0' : 'px-3'} pb-28 sm:pt-6 sm:px-4 sm:pb-28 lg:p-8 lg:pb-8 ${currentView === 'admin' ? 'max-w-[2200px]' : isFullBleed ? 'max-w-7xl' : 'max-w-[1600px]'} mx-auto`;
            const content = <div key={currentView} className={contentClass}>{renderView()}</div>;
            return isMobile
              ? <PullToRefresh onRefresh={async () => { queryClient.invalidateQueries(); refreshPlayerSession(); }}>{content}</PullToRefresh>
              : content;
          })()}
        </main>
      </div>

      {/* Mobile Bottom Nav — 4 regular + 1 center FAB (Live) */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${dt.glassStrong} border-t border-border safe-area-bottom`}>
        <div className="flex justify-around items-end py-1 px-1 relative">
          {/* Left group: Home + Komunitas */}
          <button
            onClick={() => { hapticTap(); setCurrentView('landing'); }}
            className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 min-h-[44px] rounded-lg transition-all duration-200 relative ${
              (currentView as AppView) === 'landing' ? 'text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]' : 'text-muted-foreground/70'
            }`}
          >
            <Home className={`w-5 h-5 transition-transform duration-200 ${(currentView as AppView) === 'landing' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-semibold leading-tight">Home</span>
            {(currentView as AppView) === 'landing' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-idm-gold-warm shadow-[0_0_6px_rgba(212,168,83,0.5)]" />
            )}
          </button>

          <button
            onClick={() => { hapticTap(); setCurrentView('community'); }}
            className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 min-h-[44px] rounded-lg transition-all duration-200 relative ${
              currentView === 'community' ? 'text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]' : 'text-muted-foreground/70'
            }`}
          >
            <Users className={`w-5 h-5 transition-transform duration-200 ${currentView === 'community' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-semibold leading-tight">Komunitas</span>
            {currentView === 'community' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-idm-gold-warm shadow-[0_0_6px_rgba(212,168,83,0.5)]" />
            )}
          </button>

          {/* ★ Center FAB — Arena Live (golden, elevated) ★ */}
          <div className="flex flex-col items-center -mt-4 relative z-50">
            <button
              onClick={() => { hapticTap(); setCurrentView('matchday'); }}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
                currentView === 'matchday'
                  ? 'bg-gradient-to-br from-idm-gold-warm to-[#e8b94a] shadow-idm-gold-warm/50 scale-105 animate-pulse'
                  : 'bg-gradient-to-br from-idm-gold-warm to-[#d4a03c] shadow-idm-gold-warm/30 hover:scale-105'
              }`}
              title="Arena Live"
            >
              <Radio className="w-5 h-5 text-black" />
            </button>
            <span className={`text-[9px] font-bold mt-0.5 leading-tight ${
              currentView === 'matchday' ? 'text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]' : 'text-idm-gold-warm/70'
            }`}>
              Live
            </span>
          </div>

          {/* Right group: Marketplace + Peraturan */}
          <button
            onClick={() => { hapticTap(); setCurrentView('marketplace'); }}
            className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 min-h-[44px] rounded-lg transition-all duration-200 relative ${
              currentView === 'marketplace' ? 'text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]' : 'text-muted-foreground/70'
            }`}
          >
            <ShoppingBag className={`w-5 h-5 transition-transform duration-200 ${currentView === 'marketplace' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-semibold leading-tight">Market</span>
            {currentView === 'marketplace' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-idm-gold-warm shadow-[0_0_6px_rgba(212,168,83,0.5)]" />
            )}
          </button>

          <button
            onClick={() => { hapticTap(); setCurrentView('league'); }}
            className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-2 min-h-[44px] rounded-lg transition-all duration-200 relative ${
              currentView === 'league' ? 'text-idm-gold-warm drop-shadow-[0_0_4px_rgba(212,168,83,0.4)]' : 'text-muted-foreground/70'
            }`}
          >
            <BookOpen className={`w-5 h-5 transition-transform duration-200 ${currentView === 'league' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-semibold leading-tight">Aturan</span>
            {currentView === 'league' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-idm-gold-warm shadow-[0_0_6px_rgba(212,168,83,0.5)]" />
            )}
          </button>
        </div>
      </nav>

      {/* FAB — Daftar Tarkam (mobile only, opens registration modal) */}
      {currentView !== 'landing' && (
        <button
          onClick={() => { hapticTap(); setRegistrationModalOpen(true); }}
          className="lg:hidden fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full bg-idm-gold-warm shadow-lg shadow-idm-gold-warm/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          title="Daftar Tarkam"
        >
          <UserPlus className="w-5 h-5 text-black" />
        </button>
      )}

      <DonationPopup
        show={donationPopup.show}
        message={donationPopup.message}
        onClose={hideDonationPopup}
      />

      <UnifiedLoginModal
        open={accountModalOpen}
        onOpenChange={setAccountModalOpen}
        defaultTab={accountModalDefaultTab}
      />

      <RegistrationModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
      />

      {/* Footer — desktop only */}
      <footer className="shrink-0 py-3 text-center text-[11px] text-muted-foreground/60 border-t border-border/40 hidden lg:block">
        <span className="text-gradient-fury font-semibold">Tarkam IDM</span> — Fan Made Edition © 2026
      </footer>
    </div>
  );
}
