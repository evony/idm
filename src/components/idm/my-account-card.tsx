'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  LogOut, Settings, Shield, Trophy, Crown, Flame,
  ChevronRight, Gamepad2, Star, Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useDivisionTheme } from '@/hooks/use-division-theme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkinBadgesRow, SkinAvatarFrame, SkinName } from './skin-renderer';
import { getPrimarySkin } from '@/lib/skin-utils';
import { getAvatarUrl, clubToString } from '@/lib/utils';
import { toast } from 'sonner';

interface MyAccountCardProps {
  onOpenProfile: () => void;
}

export function MyAccountCard({ onOpenProfile }: MyAccountCardProps) {
  const { playerAuth, clearPlayerAuth, division, setDivision } = useAppStore();
  const dt = useDivisionTheme();

  const [loggingOut, setLoggingOut] = useState(false);

  if (!playerAuth.isAuthenticated || !playerAuth.account) return null;

  const { account } = playerAuth;
  const player = account.player;
  const playerDivision = player.division as 'male' | 'female';
  const avatarSrc = getAvatarUrl(player.gamertag, playerDivision, player.avatar);
  const winRate = player.matches > 0 ? Math.round((player.totalWins / player.matches) * 100) : 0;

  // Skin data
  const skins = account.skins || [];
  const primarySkin = getPrimarySkin(skins);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/account/logout', { method: 'POST' });
      clearPlayerAuth();
      toast.success('Berhasil logout');
    } catch {
      clearPlayerAuth();
    } finally {
      setLoggingOut(false);
    }
  };

  // Switch to player's division when viewing account
  const switchToMyDivision = () => {
    if (player.division !== division) {
      setDivision(player.division as 'male' | 'female');
      toast.success(player.division === 'male' ? '🕺 Male Division' : '💃 Female Division');
    }
  };

  return (
    <div className={`stagger-item-subtle stagger-d4 rounded-2xl ${primarySkin ? 'border border-border/50' : dt.casinoCard + ' border ' + dt.border} overflow-hidden`} style={primarySkin ? undefined : undefined}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 ${dt.bgSubtle} border-b ${dt.borderSubtle}`}>
        <Sparkles className={`w-3.5 h-3.5 ${primarySkin ? 'text-idm-gold' : dt.text}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Akun Saya</span>
        {skins.length > 0 && (
          <Badge className={`${dt.casinoBadge} text-[8px] ml-auto`}>
            <Star className="w-2.5 h-2.5 mr-0.5" /> {skins.length} Skin
          </Badge>
        )}
      </div>

      {/* Player Info */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Avatar with skin frame */}
          <div className="relative shrink-0">
            <SkinAvatarFrame skin={primarySkin}>
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-border/30 shadow-lg">
                <Image
                  src={avatarSrc}
                  alt={player.gamertag}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </SkinAvatarFrame>
          </div>

          {/* Name & Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <SkinName skin={primarySkin}>
                <span className="text-sm font-bold truncate">{player.gamertag}</span>
              </SkinName>
            </div>
            {/* Skin badges row */}
            {skins.length > 0 && (
              <div className="mt-0.5">
                <SkinBadgesRow skins={skins} />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {player.city ? player.city + ' · ' : ''}{playerDivision === 'male' ? '🕺 Male' : '💃 Female'}
            </p>

            {/* Quick Stats Row */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Trophy className={`w-3 h-3 ${dt.text}`} />
                <span className="text-[10px] font-bold">{player.points}</span>
                <span className="text-[9px] text-muted-foreground">pts</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-green-500" />
                <span className="text-[10px] font-bold">{player.totalWins}</span>
                <span className="text-[9px] text-muted-foreground">W</span>
              </div>
              {player.totalMvp > 0 && (
                <div className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className="text-[10px] font-bold">{player.totalMvp}</span>
                  <span className="text-[9px] text-muted-foreground">MVP</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold">{winRate}%</span>
                <span className="text-[9px] text-muted-foreground">WR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] flex-1 bg-muted/30 hover:bg-muted/50"
            onClick={() => { switchToMyDivision(); onOpenProfile(); }}
          >
            <Gamepad2 className="w-3.5 h-3.5 mr-1.5" />
            Profil Saya
          </Button>
          {player.division !== division && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-[11px] ${dt.bgSubtle} hover:bg-muted/50`}
              onClick={switchToMyDivision}
            >
              {playerDivision === 'male' ? '🕺' : '💃'} Divisi Saya
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
