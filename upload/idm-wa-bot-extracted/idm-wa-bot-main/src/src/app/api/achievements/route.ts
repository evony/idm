import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active') === 'true';

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const achievements = await db.achievement.findMany({
      where,
      include: {
        _count: {
          select: {
            playerAchievements: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { tier: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST - Create new achievement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      displayName,
      description,
      category,
      icon,
      tier,
      criteria,
      rewardPoints,
    } = body;

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 });
    }

    const achievement = await db.achievement.create({
      data: {
        name,
        displayName,
        description: description || '',
        category: category || 'tournament',
        icon: icon || '🏆',
        tier: tier || 'bronze',
        criteria: criteria || '{}',
        rewardPoints: rewardPoints || 0,
      },
    });

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
  }
}

// PUT - Update achievement
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    const achievement = await db.achievement.update({
      where: { id },
      data,
    });

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
  }
}

// DELETE - Delete achievement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    // First delete all player achievements
    await db.playerAchievement.deleteMany({
      where: { achievementId: id },
    });

    // Then delete the achievement
    await db.achievement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
  }
}
