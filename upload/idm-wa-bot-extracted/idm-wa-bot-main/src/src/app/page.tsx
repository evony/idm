'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/idm/app-shell';
import { SplashScreen } from '@/components/idm/splash-screen';

export default function Home() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30000, refetchOnWindowFocus: false },
    },
  }));
  const [seeded, setSeeded] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    async function checkAndSeed() {
      try {
        // Check if data exists
        const res = await fetch('/api/stats?division=male');
        const data = await res.json();
        if (!data.hasData) {
          await fetch('/api/seed', { method: 'POST' });
        }

        // Initialize super admin if not exists
        await fetch('/api/init-admin', { method: 'POST' });

        setSeeded(true);
      } catch {
        setSeeded(true);
      }
    }
    checkAndSeed();
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  // Show splash screen first, then app
  if (!splashDone) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Simple loading if data not ready after splash
  if (!seeded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl overflow-hidden mb-4">
          <img src="/logo.webp" alt="IDM" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Preparing stage...</span>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
