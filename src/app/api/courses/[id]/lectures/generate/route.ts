import { NextRequest, NextResponse } from 'next/server';
import attendanceRepository from '@/lib/repositories/AttendanceRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function POST(
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

    const body = await request.json();
    const { start_date, end_date, lecturer_id } = body;

    if (!start_date || !end_date || !lecturer_id) {
      return NextResponse.json(
        { error: 'Missing required fields: start_date, end_date, lecturer_id' },
        { status: 400 }
      );
    }

    // Auto-create lectures based on course schedule
    const count = attendanceRepository.autoCreateLectures(
      courseId,
      start_date,
      end_date,
      lecturer_id
    );

    return NextResponse.json({
      course_id: courseId,
      lectures_created: count,
      start_date,
      end_date
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate lectures';
    console.error('Failed to generate lectures:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
