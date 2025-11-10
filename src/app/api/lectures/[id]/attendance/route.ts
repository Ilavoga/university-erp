import { NextRequest, NextResponse } from 'next/server';
import attendanceRepository from '@/lib/repositories/AttendanceRepository';
import progressCalculationRepository from '@/lib/repositories/ProgressCalculationRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = parseInt(params.id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: 'Invalid lecture ID' },
        { status: 400 }
      );
    }

    const attendance = attendanceRepository.getLectureAttendance(lectureId);

    return NextResponse.json({ attendance });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance';
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = parseInt(params.id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: 'Invalid lecture ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { attendance_records, marked_by } = body;

    if (!Array.isArray(attendance_records) || !marked_by) {
      return NextResponse.json(
        { error: 'Missing required fields: attendance_records (array), marked_by' },
        { status: 400 }
      );
    }

    // Validate attendance records
    for (const record of attendance_records) {
      if (!record.student_id || !record.status) {
        return NextResponse.json(
          { error: 'Each attendance record must have student_id and status' },
          { status: 400 }
        );
      }
      if (!['present', 'absent', 'late', 'excused'].includes(record.status)) {
        return NextResponse.json(
          { error: 'Status must be one of: present, absent, late, excused' },
          { status: 400 }
        );
      }
    }

    // Mark attendance (bulk)
    const count = attendanceRepository.markAttendance(
      lectureId,
      attendance_records,
      marked_by
    );

    // Update progress for all affected students
    const updatedProgress = [];
    for (const record of attendance_records) {
      try {
        const progress = progressCalculationRepository.updateProgressOnAttendance(
          record.student_id,
          lectureId
        );
        updatedProgress.push({
          student_id: record.student_id,
          overall_progress: progress.overall_progress
        });
      } catch (error) {
        console.error(`Failed to update progress for student ${record.student_id}:`, error);
      }
    }

    return NextResponse.json({
      marked_count: count,
      updated_progress: updatedProgress
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark attendance';
    console.error('Failed to mark attendance:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
