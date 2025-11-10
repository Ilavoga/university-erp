import { NextRequest, NextResponse } from 'next/server';
import { LearningRepository } from '@/lib/repositories/LearningRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const learningRepo = new LearningRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const recommendations = learningRepo.getRecommendations(parseInt(studentId));
    return NextResponse.json(recommendations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}