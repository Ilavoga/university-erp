import { NextRequest, NextResponse } from 'next/server';
import attendanceRepository from '@/lib/repositories/AttendanceRepository';
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

    const report = attendanceRepository.getCourseAttendanceReport(courseId);

    // Calculate summary statistics
    const totalStudents = report.length;
    const avgAttendance = totalStudents > 0
      ? report.reduce((sum, student) => sum + student.attendance_percentage, 0) / totalStudents
      : 0;
    
    const studentsAtRisk = report.filter(s => s.attendance_percentage < 75).length;
    const excellentAttendance = report.filter(s => s.attendance_percentage >= 90).length;

    return NextResponse.json({
      course_id: courseId,
      report,
      summary: {
        total_students: totalStudents,
        average_attendance: Math.round(avgAttendance * 100) / 100,
        students_at_risk: studentsAtRisk,
        excellent_attendance: excellentAttendance
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance report';
    console.error('Failed to fetch attendance report:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
