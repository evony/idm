import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Assign achievement to player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, achievementId, tournamentId, context } = body;

    if (!playerId || !achievementId) {
      return NextResponse.json({ error: 'Player ID and Achievement ID are required' }, { status: 400 });
    }

    // Check if already has this achievement
    const existing = await prisma.playerAchievement.findUnique({
      where: {
        playerId_achievementId: {
          playerId,
          achievementId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Player already has this achievement' }, { status: 400 });
    }

    // Get achievement to check for reward points
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    // Create achievement record
    const playerAchievement = await prisma.playerAchievement.create({
      data: {
        playerId,
        achievementId,
        tournamentId,
        context,
      },
    });

    // Award points if achievement has reward points
    if (achievement && achievement.rewardPoints > 0) {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          points: { increment: achievement.rewardPoints },
        },
      });

      // Record point transaction
      await prisma.playerPoint.create({
        data: {
          playerId,
          tournamentId,
          amount: achievement.rewardPoints,
          reason: 'achievement_reward',
          description: `Earned achievement: ${achievement.displayName}`,
        },
      });
    }

    return NextResponse.json({ success: true, playerAchievement });
  } catch (error) {
    console.error('Error assigning achievement:', error);
    return NextResponse.json({ error: 'Failed to assign achievement' }, { status: 500 });
  }
}

// GET - Get player achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const achievements = await prisma.playerAchievement.findMany({
      where: { playerId },
      include: {
        achievement: true,
        tournament: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Error fetching player achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}
