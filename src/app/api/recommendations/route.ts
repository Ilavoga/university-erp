import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRepository } from '@/lib/repositories/RecommendationRepository';

const recommendationRepo = new RecommendationRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as 'course' | 'event' | 'resource' | 'marketplace' | null;
    const minScore = searchParams.get('minScore');
    const limit = searchParams.get('limit');
    const includeDismissed = searchParams.get('includeDismissed') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const filters = {
      type: type || undefined,
      minScore: minScore ? parseFloat(minScore) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      includeDismissed,
    };

    const recommendations = recommendationRepo.getRecommendations(parseInt(userId), filters);
    const stats = recommendationRepo.getRecommendationStats(parseInt(userId));

    return NextResponse.json({
      recommendations,
      stats,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, targetId, score, reasonText, metadata } = body;

    if (!userId || !type || !targetId || score === undefined) {
      return NextResponse.json(
        { error: 'userId, type, targetId, and score are required' },
        { status: 400 }
      );
    }

    const recommendation = recommendationRepo.createRecommendation(
      userId,
      type,
      targetId,
      score,
      reasonText,
      metadata
    );

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Error creating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create recommendation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id and userId are required' },
        { status: 400 }
      );
    }

    recommendationRepo.dismissRecommendation(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss recommendation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
