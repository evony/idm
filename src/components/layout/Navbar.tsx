'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AuthDialog } from '@/components/auth/AuthDialog';
import {
  Menu,
  X,
  Gamepad2,
  User,
  Settings,
  LogOut,
  Trophy,
  Users,
  ShoppingBag,
  MessageCircle,
  Shield,
  Crown,
  Home,
  Calendar,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Tournaments', href: '#tournaments', icon: Trophy },
  { name: 'Divisions', href: '#divisions', icon: Users },
  { name: 'Clubs', href: '#clubs', icon: Crown },
];

const adminItems = [
  { name: 'Dashboard', href: '#admin', icon: BarChart3 },
  { name: 'Tournaments', href: '#admin/tournaments', icon: Trophy },
  { name: 'Teams', href: '#admin/teams', icon: Users },
  { name: 'Bot Control', href: '#admin/bot', icon: MessageCircle },
  { name: 'Settings', href: '#admin/settings', icon: Settings },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAdmin = user && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role);

  useEffect(() => {
    // Set mounted state after initial render
    const mountedTimer = setTimeout(() => setMounted(true), 0);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(mountedTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-amber-500/20"
            : "bg-transparent"
        )}
      >
        {/* Animated neon line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Gamepad2 className="w-8 h-8 text-amber-500 group-hover:text-amber-400 transition-colors" />
                <div className="absolute inset-0 blur-md bg-amber-500/50 group-hover:bg-amber-400/60 transition-all" />
              </div>
              <div>
                <span className={cn(
                  "text-xl font-bold",
                  scrolled
                    ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 bg-clip-text text-transparent"
                    : "text-white"
                )}>
                  IDOL META
                </span>
                <span className={cn(
                  "text-xs block -mt-1",
                  scrolled
                    ? "text-amber-500"
                    : "text-amber-400"
                )}>
                  FAN MADE
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium",
                    scrolled
                      ? "text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-cyan-500/10"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={cn(
                    "rounded-full",
                    scrolled
                      ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      : "text-white hover:bg-white/10"
                  )}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
              )}

              {user ? (
                <>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "hidden md:flex",
                            scrolled
                              ? "text-gray-700 dark:text-gray-300 hover:text-purple-500 hover:bg-purple-500/10"
                              : "text-white/90 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DropdownMenuLabel className="text-gray-500 dark:text-gray-400">Admin Panel</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                        {adminItems.map((item) => (
                          <DropdownMenuItem key={item.name} asChild>
                            <Link href={item.href} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-purple-500 cursor-pointer">
                              <item.icon className="w-4 h-4" />
                              {item.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "relative flex items-center space-x-2",
                          scrolled
                            ? "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            : "text-white/90 hover:text-white"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {user.name?.charAt(0) || user.phone.charAt(0)}
                        </div>
                        <span className="hidden md:block">{user.name || user.phone}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <DropdownMenuLabel className="text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white">{user.name || 'User'}</span>
                          <span className="text-xs text-cyan-500">{user.role}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem asChild>
                        <Link href="#profile" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="#my-tournaments" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                          <Trophy className="w-4 h-4" />
                          My Tournaments
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem
                        onClick={logout}
                        className="text-red-500 hover:text-red-400 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  onClick={() => setAuthOpen(true)}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn(
                    "md:hidden",
                    scrolled
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-white"
                  )}>
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-white dark:bg-gray-900 border-amber-500/20">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-lg font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                        Menu
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(false)}
                        className="text-muted-foreground"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <nav className="flex-1 space-y-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      ))}

                      {isAdmin && (
                        <>
                          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Admin
                            </p>
                            {adminItems.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                              >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </nav>

                    {!user && (
                      <Button
                        onClick={() => {
                          setMobileOpen(false);
                          setAuthOpen(true);
                        }}
                        className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-purple-600"
                      >
                        Sign In
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
