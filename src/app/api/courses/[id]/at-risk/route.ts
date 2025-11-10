import { NextRequest, NextResponse } from 'next/server';
import progressCalculationRepository from '@/lib/repositories/ProgressCalculationRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const threshold = parseInt(searchParams.get('threshold') || '50');

    const studentsAtRisk = progressCalculationRepository.getStudentsAtRisk(courseId, threshold);

    return NextResponse.json({
      course_id: courseId,
      threshold,
      count: studentsAtRisk.length,
      students: studentsAtRisk
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch at-risk students';
    console.error('Failed to fetch at-risk students:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
