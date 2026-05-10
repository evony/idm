import { NextRequest, NextResponse } from 'next/server';

// Deterministic color from club name
function nameToColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const bg = `hsl(${hue}, 45%, 18%)`;
  const text = `hsl(${hue}, 65%, 70%)`;
  return { bg, text };
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || 'CLUB';
  const { bg, text } = nameToColor(name);

  // Generate initials (max 3 chars)
  const initials = name
    .split(/[\s_]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);

  const size = 200;
  const fontSize = initials.length <= 2 ? 72 : 56;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bg};stop-opacity:0.7" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="24" fill="url(#bg)"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${fontSize}" font-weight="900" fill="${text}" letter-spacing="2">${initials}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
