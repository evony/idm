import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

// POST seed default CMS content
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!(admin instanceof Object)) return admin;

  try {
    // Seed default settings
    const defaultSettings = [
      { key: 'logo_url', value: '/logo1.webp', type: 'image' },
      { key: 'site_title', value: 'IDM League', type: 'text' },
      { key: 'hero_title', value: 'Idol Meta', type: 'text' },
      { key: 'hero_subtitle', value: 'Fan Made Edition', type: 'text' },
      { key: 'hero_tagline', value: 'Tempat dancer terbaik berkompetisi. Tournament mingguan, liga profesional, dan podium yang menunggu.', type: 'text' },
      { key: 'hero_bg_desktop', value: '/bg-default.jpg', type: 'image' },
      { key: 'hero_bg_mobile', value: '/bg-mobiledefault.jpg', type: 'image' },
      { key: 'nav_cta_male_text', value: 'MALE DIVISION', type: 'text' },
      { key: 'nav_cta_female_text', value: 'FEMALE DIVISION', type: 'text' },
      { key: 'footer_text', value: '© 2025 IDM League — Idol Meta Fan Made Edition. All rights reserved.', type: 'text' },
      { key: 'footer_tagline', value: 'Dance. Compete. Dominate.', type: 'text' },
    ];

    for (const s of defaultSettings) {
      await db.cmsSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, type: s.type },
        create: s,
      });
    }

    // Seed default sections
    const defaultSections = [
      { slug: 'header', title: 'Header', subtitle: 'Navigasi & Logo', description: 'Pengaturan header dan navigasi website', order: 1 },
      { slug: 'hero', title: 'Hero Section', subtitle: 'Landing Hero', description: 'Bagian utama hero di halaman landing', order: 2 },
      { slug: 'champions', title: 'Season Champion', subtitle: 'Aula Champion', description: 'Juara terbaru dari setiap divisi', order: 3 },
      { slug: 'mvp', title: 'MVP Arena', subtitle: 'Hall of Fame', description: 'Pemain terbaik dari setiap divisi', order: 4 },
      { slug: 'clubs', title: 'Club & Peserta', subtitle: 'Liga', description: 'Daftar club dan peserta liga', order: 5 },
      { slug: 'gallery', title: 'Galeri', subtitle: 'Kegiatan Komunitas', description: 'Dokumentasi kegiatan komunitas game', order: 6 },
      { slug: 'sawer', title: 'Sawer & Donasi', subtitle: 'Support Kami', description: 'Bagian sawer dan donasi komunitas', order: 7 },
      { slug: 'cta', title: 'Join Community', subtitle: 'Call to Action', description: 'Ajakan bergabung ke komunitas', order: 8 },
      { slug: 'footer', title: 'Footer', subtitle: 'Informasi', description: 'Bagian bawah website dengan informasi tambahan', order: 9 },
    ];

    for (const s of defaultSections) {
      await db.cmsSection.upsert({
        where: { slug: s.slug },
        update: { title: s.title, subtitle: s.subtitle, description: s.description, order: s.order },
        create: { ...s, isActive: true },
      });
    }

    // Seed default cards for hero section (hero badges)
    const heroSection = await db.cmsSection.findUnique({ where: { slug: 'hero' } });
    if (heroSection) {
      const existingCards = await db.cmsCard.count({ where: { sectionId: heroSection.id } });
      if (existingCards === 0) {
        await db.cmsCard.createMany({
          data: [
            { sectionId: heroSection.id, title: 'Season 1', tag: 'badge', tagColor: '#d4a853', order: 1 },
            { sectionId: heroSection.id, title: 'Dance Tournament', tag: 'badge', tagColor: '#d4a853', order: 2 },
            { sectionId: heroSection.id, title: 'Pro League', tag: 'badge', tagColor: '#d4a853', order: 3 },
          ],
        });
      }
    }

    // Seed default cards for CTA section
    const ctaSection = await db.cmsSection.findUnique({ where: { slug: 'cta' } });
    if (ctaSection) {
      const existingCards = await db.cmsCard.count({ where: { sectionId: ctaSection.id } });
      if (existingCards === 0) {
        await db.cmsCard.createMany({
          data: [
            { sectionId: ctaSection.id, title: 'WhatsApp Group', description: 'Bergabung dengan komunitas IDM League di WhatsApp', imageUrl: '', linkUrl: '#', tag: 'Community', tagColor: '#25D366', order: 1 },
            { sectionId: ctaSection.id, title: 'Discord Server', description: 'Chat dan diskusi di server Discord kami', imageUrl: '', linkUrl: '#', tag: 'Chat', tagColor: '#5865F2', order: 2 },
            { sectionId: ctaSection.id, title: 'Instagram', description: 'Follow Instagram untuk update terbaru', imageUrl: '', linkUrl: '#', tag: 'Social', tagColor: '#E4405F', order: 3 },
          ],
        });
      }
    }

    return NextResponse.json({ success: true, message: 'CMS content seeded successfully' });
  } catch (error) {
    console.error('CMS seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
