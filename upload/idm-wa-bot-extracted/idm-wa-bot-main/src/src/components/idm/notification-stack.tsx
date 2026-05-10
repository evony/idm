'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Trophy, Music, Crown, Flame } from 'lucide-react';
import { useAppStore, type NotifType } from '@/lib/store';

const iconMap: Record<NotifType, React.ComponentType<{ className?: string }>> = {
  donation: Gift,
  match: Music,
  mvp: Crown,
  streak: Flame,
  victory: Trophy,
};

const colorMap: Record<NotifType, { bg: string; icon: string; border: string }> = {
  donation: { bg: 'bg-primary/5', icon: 'text-primary', border: 'border-primary/20' },
  match: { bg: 'bg-idm-amber/5', icon: 'text-idm-amber', border: 'border-idm-amber/20' },
  mvp: { bg: 'bg-yellow-500/5', icon: 'text-yellow-500', border: 'border-yellow-500/20' },
  streak: { bg: 'bg-orange-500/5', icon: 'text-orange-500', border: 'border-orange-500/20' },
  victory: { bg: 'bg-green-500/5', icon: 'text-green-500', border: 'border-green-500/20' },
};

export function NotificationStack() {
  const notifications = useAppStore(s => s.notifications);
  const removeNotification = useAppStore(s => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => {
          const Icon = iconMap[notif.type];
          const colors = colorMap[notif.type];
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`pointer-events-auto glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-lg border ${colors.border} ${colors.bg}`}
            >
              <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
              </div>
              <p className="text-xs font-medium flex-1">{notif.message}</p>
              <button
                onClick={() => removeNotification(notif.id)}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
