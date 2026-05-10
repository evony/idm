import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const clubLogos = [
      { name: 'CROWN', logo: 'https://res.cloudinary.com/dagoryri5/image/upload/v1775722530/idm/logos/o1ujmjazgv1nxdpjzkew.webp' },
      { name: 'ALQA', logo: 'https://res.cloudinary.com/dagoryri5/image/upload/v1775722484/idm/logos/xm73kzny0klrncflhxfj.jpg' },
      { name: 'AVENUE', logo: 'https://res.cloudinary.com/dagoryri5/image/upload/v1775722508/idm/logos/j8zw91uiulijp8gf8ugg.webp' },
      { name: 'GYMSHARK', logo: 'https://res.cloudinary.com/dagoryri5/image/upload/v1775839600/idm/logos/fymwsgztdv0egvjite2o.webp' },
    ];

    const updatedClubs = [];

    for (const clubData of clubLogos) {
      // Find club by name (exact match first, then try variations)
      let club = await db.club.findFirst({
        where: { name: clubData.name },
      });

      // Try lowercase if not found
      if (!club) {
        club = await db.club.findFirst({
          where: { name: clubData.name.toLowerCase() },
        });
      }

      // Try title case if not found
      if (!club) {
        const titleCase = clubData.name.charAt(0).toUpperCase() + clubData.name.slice(1).toLowerCase();
        club = await db.club.findFirst({
          where: { name: titleCase },
        });
      }

      if (club) {
        await db.club.update({
          where: { id: club.id },
          data: { logo: clubData.logo },
        });
        updatedClubs.push({ name: clubData.name, found: club.name, updated: true });
      } else {
        updatedClubs.push({ name: clubData.name, found: null, updated: false });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Club logos updated',
      updatedClubs,
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Update club logos error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
