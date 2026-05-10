'use client';

import { Share2, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface SocialShareButtonProps {
  playerGamertag: string;
  playerId: string;
  className?: string;
}

/**
 * Social share button for player profiles.
 * Uses Web Share API when available (mobile), falls back to clipboard copy.
 */
export function SocialShareButton({ playerGamertag, playerId, className = '' }: SocialShareButtonProps) {
  const [copied, setCopied] = useState(false);

  // Build the player stats URL
  const playerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?player=${encodeURIComponent(playerId)}`
    : '';

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${playerGamertag} — Tarkam IDM Profile`,
      text: `Lihat profil ${playerGamertag} di Tarkam IDM!`,
      url: playerUrl,
    };

    // Try Web Share API first (available on mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall back to clipboard
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopied(true);
      toast.success('Link profil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin link');
    }
  }, [playerGamertag, playerUrl]);

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
        copied
          ? 'bg-green-500/15 text-green-400'
          : 'bg-muted/30 text-muted-foreground hover:text-idm-gold-warm hover:bg-idm-gold-warm/10'
      } ${className}`}
      title={copied ? 'Link tersalin!' : 'Bagikan profil'}
      aria-label={copied ? 'Link tersalin' : 'Bagikan profil'}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Share2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
