import { ClientApp } from '@/components/idm/client-app';
import { fetchCmsContent } from '@/lib/cms-data';
import { fetchLandingStats, fetchLandingLeague } from '@/lib/landing-data';
import { getAvatarUrl, getClubLogoUrl } from '@/lib/utils';

export const metadata = {
  title: 'TARKAM — Idol Meta Fan Made Edition',
  description: 'Komunitas Idol Meta Indonesia. Turnamen mingguan, leaderboard, dan lebih banyak lagi.',
  openGraph: {
    title: 'TARKAM — Idol Meta Fan Made Edition',
    description: 'Komunitas Idol Meta Indonesia',
    type: 'website',
  },
};

// ★ Revalidate every 60 seconds — data is served from cache
// but revalidated in the background. This gives instant SSR
// while still keeping content fresh.
export const revalidate = 60;

/**
 * Convert a raw Cloudinary URL to an optimized version matching the cloudinary-loader.
 * The loader injects f_auto,q_auto:good,w_{width},c_limit — we must preload the SAME
 * optimized URL so the browser doesn't download the image twice (raw + optimized).
 */
function optimizeCloudinaryUrl(rawUrl: string, width: number): string {
  if (!rawUrl.includes('res.cloudinary.com')) return rawUrl;
  // If already optimized (has transformation params), return as-is
  if (rawUrl.includes('/image/upload/f_') || rawUrl.includes('/image/upload/q_')) return rawUrl;
  const optimizedWidth = Math.min(width, 1920);
  return rawUrl.replace(
    '/image/upload/',
    `/image/upload/f_auto,q_auto:good,w_${optimizedWidth},c_limit/`
  );
}

export default async function Home() {
  // ★ SSR: Fetch ALL landing page data on the server so the initial HTML
  // already contains real data. No more "stale flash" or loading delay.
  const [initialCms, initialMaleStats, initialFemaleStats, initialLeagueData] = await Promise.all([
    fetchCmsContent(),
    fetchLandingStats('male'),
    fetchLandingStats('female'),
    fetchLandingLeague(),
  ]);

  // Preload hero background image from CMS settings
  const heroBgDesktop = initialCms.settings.hero_bg_desktop || '';
  const heroBgMobile = initialCms.settings.hero_bg_mobile || '';
  const heroBg = heroBgDesktop || heroBgMobile;

  // ═══════════════════════════════════════════════════════════════
  // ★ CRITICAL IMAGE PRELOADS — Browser starts downloading these
  // BEFORE React hydration. The URLs must match what the Cloudinary
  // loader generates to avoid double-downloads.
  // ═══════════════════════════════════════════════════════════════

  // High-priority: Champion player avatars (w=400 for sharp display on retina screens)
  const criticalPreloads: { url: string; fetchPriority: 'high' | 'low' }[] = [];

  for (const stats of [initialMaleStats, initialFemaleStats]) {
    if (stats?.allSeasons) {
      const championSeason = stats.allSeasons.find(
        (s: any) => s.status === 'completed' && s.championPlayer
      );
      if (championSeason?.championPlayer?.avatar) {
        const avatarUrl = getAvatarUrl(
          championSeason.championPlayer.gamertag,
          championSeason.championPlayer.division || 'male',
          championSeason.championPlayer.avatar
        );
        if (avatarUrl.startsWith('http')) {
          // ★ Preload the OPTIMIZED URL (w=400, f_auto, q_auto:good) — sharp on retina displays
          criticalPreloads.push({
            url: optimizeCloudinaryUrl(avatarUrl, 400),
            fetchPriority: 'high',
          });
        }
      }

      // ★ Also preload champion CLUB logo (w=256 for sharp display)
      if (championSeason?.championClub?.logo) {
        const logoUrl = getClubLogoUrl(
          championSeason.championClub.name,
          championSeason.championClub.logo
        );
        if (logoUrl.startsWith('http')) {
          criticalPreloads.push({
            url: optimizeCloudinaryUrl(logoUrl, 256),
            fetchPriority: 'high',
          });
        }
      }

      // ★ Preload club member avatars (w=128 for top performers row)
      if (championSeason?.championClub?.members) {
        for (const member of championSeason.championClub.members.slice(0, 5)) {
          if (member.avatar) {
            const memberAvatarUrl = getAvatarUrl(member.gamertag, member.division, member.avatar);
            if (memberAvatarUrl.startsWith('http')) {
              criticalPreloads.push({
                url: optimizeCloudinaryUrl(memberAvatarUrl, 128),
                fetchPriority: 'low', // Members are secondary — don't block critical resources
              });
            }
          }
        }
      }
    }
  }

  // ★ Also preload hero champion avatars (w=96 for hero section circles)
  // These are the same champions but displayed smaller in the hero
  // The 144px preload already covers this size (browser caches by URL)

  return (
    <>
      {/* Preload hero background — browser starts downloading before JS loads */}
      {heroBg && (
        <link
          rel="preload"
          as="image"
          href={optimizeCloudinaryUrl(heroBg, 1920)}
          fetchPriority="high"
        />
      )}
      {/* ★ Preload season champion avatars & club logos — eliminates the visible delay
          where the avatar container is empty while Cloudinary image downloads.
          URLs are already optimized (f_auto,q_auto:good,w_XXX) to match the Cloudinary loader,
          so the browser doesn't download the same image twice. */}
      {criticalPreloads.map((preload, i) => (
        <link
          key={i}
          rel="preload"
          as="image"
          href={preload.url}
          fetchPriority={preload.fetchPriority}
        />
      ))}
      <ClientApp
        initialCms={initialCms}
        initialMaleStats={initialMaleStats}
        initialFemaleStats={initialFemaleStats}
        initialLeagueData={initialLeagueData}
      />
    </>
  );
}