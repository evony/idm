'use client';

import Link from 'next/link';
import {
  Gamepad2,
  Trophy,
  Users,
  ShoppingBag,
  MessageCircle,
  Instagram,
  Youtube,
  ExternalLink
} from 'lucide-react';

const footerLinks = {
  platform: [
    { name: 'Tournaments', href: '#tournaments' },
    { name: 'Divisions', href: '#divisions' },
    { name: 'Marketplace', href: '#marketplace' },
    { name: 'Clubs', href: '#clubs' },
  ],
  support: [
    { name: 'Help Center', href: '#help' },
    { name: 'Contact Us', href: '#contact' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Report Bug', href: '#report' },
  ],
  legal: [
    { name: 'Terms of Service', href: '#terms' },
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Rules', href: '#rules' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-cyan-500/20 mt-auto">
      {/* Neon line */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <Gamepad2 className="w-8 h-8 text-cyan-400" />
                <div className="absolute inset-0 blur-md bg-cyan-400/50" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Idol Meta Weekly
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              Professional Esports Tournament Management System. Organize, compete, and win!
            </p>
            <div className="flex space-x-4">
              <a
                href="#instagram"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-pink-400 hover:bg-muted/80 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#youtube"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-muted/80 transition-all"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="#discord"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-indigo-400 hover:bg-muted/80 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              Platform
            </h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-cyan-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Support
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-purple-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-pink-400" />
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-pink-400 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Idol Meta Weekly. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              System Online
            </span>
            <span>|</span>
            <span>Made with ❤️ for Gamers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
