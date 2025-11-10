import { NextRequest, NextResponse } from 'next/server';
import { LearningRepository } from '@/lib/repositories/LearningRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const learningRepo = new LearningRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const achievements = learningRepo.getStudentAchievements(
      parseInt(studentId),
      limit ? parseInt(limit) : 10
    );
    return NextResponse.json(achievements);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}