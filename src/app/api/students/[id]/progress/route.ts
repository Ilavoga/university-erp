import { NextRequest, NextResponse } from 'next/server';
import progressCalculationRepository from '@/lib/repositories/ProgressCalculationRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id);

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (courseId) {
      // Get detailed progress for specific course
      const progress = progressCalculationRepository.getDetailedProgress(
        studentId,
        parseInt(courseId)
      );
      return NextResponse.json({ progress });
    } else {
      // Get progress for all enrolled courses
      const allProgress = progressCalculationRepository.getAllCourseProgress(studentId);
      return NextResponse.json({ courses: allProgress });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch progress';
    console.error('Failed to fetch progress:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
