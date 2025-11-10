import { NextRequest, NextResponse } from 'next/server';
import lecturerAssignmentRepository from '@/lib/repositories/LecturerAssignmentRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lecturerId = parseInt(params.id);

    if (isNaN(lecturerId)) {
      return NextResponse.json(
        { error: 'Invalid lecturer ID' },
        { status: 400 }
      );
    }

    const courses = lecturerAssignmentRepository.getLecturerCourses(lecturerId);
    const workload = lecturerAssignmentRepository.getLecturerWorkload(lecturerId);

    return NextResponse.json({
      lecturer_id: lecturerId,
      courses,
      workload
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch lecturer courses';
    console.error('Failed to fetch lecturer courses:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
