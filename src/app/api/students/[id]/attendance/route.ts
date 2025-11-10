import { NextRequest, NextResponse } from 'next/server';
import attendanceRepository from '@/lib/repositories/AttendanceRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (courseId) {
      // Get attendance for specific course
      const stats = attendanceRepository.getStudentAttendance(studentId, parseInt(courseId));
      return NextResponse.json({ attendance: stats });
    } else {
      // Get attendance for all enrolled courses
      const allAttendance = attendanceRepository.getStudentAllAttendance(studentId);
      return NextResponse.json({ attendance: allAttendance });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch student attendance';
    console.error('Failed to fetch student attendance:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
