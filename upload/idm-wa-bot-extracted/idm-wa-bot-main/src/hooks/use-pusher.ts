'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to subscribe to a Pusher channel and bind to events.
 * Automatically cleans up on unmount.
 *
 * @param channelName - Pusher channel name (e.g. 'idm-feed')
 * @param events - Map of event names to callbacks
 * @param enabled - Whether to subscribe (default: true)
 */
export function usePusherChannel(
  channelName: string,
  events: Record<string, (data: any) => void>,
  enabled = true
) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!enabled) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) return;

    let pusher: any;
    let channel: any;

    import('pusher-js').then(({ default: PusherJS }) => {
      pusher = new PusherJS(pusherKey, { cluster: pusherCluster });
      channel = pusher.subscribe(channelName);

      for (const [event] of Object.entries(eventsRef.current)) {
        channel.bind(event, (data: any) => {
          eventsRef.current[event]?.(data);
        });
      }
    }).catch(() => {
      // Pusher not available — graceful fallback
    });

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusher) pusher.disconnect();
    };
  }, [channelName, enabled]);
}

/**
 * Subscribe to all Pusher channels and invalidate React Query keys on events.
 * Covers: feed updates, leaderboard changes, tournament lifecycle,
 * league matches, season changes, registrations, donations, and club member changes.
 */
export function usePusherRealtime() {
  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    // ★ Polling fallback — when Pusher is not configured, poll every 30s
    // This ensures data stays reasonably fresh even without real-time
    if (!pusherKey || !pusherCluster) {
      const pollInterval = setInterval(() => {
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
      }, 30_000);
      return () => clearInterval(pollInterval);
    }

    let pusher: any;
    const channels: any[] = [];

    import('pusher-js').then(({ default: PusherJS }) => {
      pusher = new PusherJS(pusherKey, { cluster: pusherCluster });

      // ─── Feed Channel ───
      const feedCh = pusher.subscribe('idm-feed');
      feedCh.bind('feed-updated', () => {
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['admin-players'] });
      });
      feedCh.bind('donation-approved', () => {
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        qcRef.current.invalidateQueries({ queryKey: ['donations'] });
        qcRef.current.invalidateQueries({ queryKey: ['top-donors'] });
      });
      feedCh.bind('donation-rejected', () => {
        qcRef.current.invalidateQueries({ queryKey: ['donations'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
      });
      feedCh.bind('player-registered', () => {
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['tournament-overview'] });
        qcRef.current.invalidateQueries({ queryKey: ['admin-players'] });
      });
      feedCh.bind('club-member-changed', () => {
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['clubs'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
        qcRef.current.invalidateQueries({ queryKey: ['admin-players'] });
      });
      channels.push(feedCh);

      // ─── Leaderboard Channel ───
      const lbCh = pusher.subscribe('idm-leaderboard');
      lbCh.bind('leaderboard-updated', (_data: { division?: string; seasonId?: string }) => {
        qcRef.current.invalidateQueries({ queryKey: ['leaderboard'] });
        qcRef.current.invalidateQueries({ queryKey: ['rankings'] });
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
        qcRef.current.invalidateQueries({ queryKey: ['admin-players'] });
      });
      channels.push(lbCh);

      // ─── Tournament Channel ───
      const tCh = pusher.subscribe('idm-tournament');
      tCh.bind('tournament-scored', () => {
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
      });
      tCh.bind('tournament-finalized', () => {
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        qcRef.current.invalidateQueries({ queryKey: ['tournament-overview'] });
        qcRef.current.invalidateQueries({ queryKey: ['my-tournament-status'] });
      });
      tCh.bind('tournament-status-changed', () => {
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        qcRef.current.invalidateQueries({ queryKey: ['tournament-overview'] });
        qcRef.current.invalidateQueries({ queryKey: ['my-tournament-status'] });
      });
      tCh.bind('tournament-created', () => {
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
        qcRef.current.invalidateQueries({ queryKey: ['tournament-overview'] });
      });
      channels.push(tCh);

      // ─── League Channel ───
      const lCh = pusher.subscribe('idm-league');
      lCh.bind('league-match-scored', () => {
        qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
      });
      lCh.bind('season-closed', () => {
        qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
      });
      channels.push(lCh);
    }).catch(() => {
      // Pusher not available — graceful fallback to polling
      const pollInterval = setInterval(() => {
        qcRef.current.invalidateQueries({ queryKey: ['stats'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-landing'] });
        qcRef.current.invalidateQueries({ queryKey: ['league-summary'] });
        qcRef.current.invalidateQueries({ queryKey: ['feed'] });
      }, 30_000);
      // Store cleanup for fallback polling
      return () => clearInterval(pollInterval);
    });

    return () => {
      for (const ch of channels) {
        ch.unbind_all();
        ch.unsubscribe();
      }
      if (pusher) pusher.disconnect();
    };
  }, []);
}
