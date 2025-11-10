import { NextRequest, NextResponse } from 'next/server';
import attendanceRepository from '@/lib/repositories/AttendanceRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const lecturerId = searchParams.get('lecturerId');
    const upcoming = searchParams.get('upcoming');

    if (courseId && upcoming === 'true') {
      // Get upcoming lectures for a course
      const limit = parseInt(searchParams.get('limit') || '10');
      const lectures = attendanceRepository.getUpcomingLectures(parseInt(courseId), limit);
      return NextResponse.json({ lectures });
    } else if (courseId) {
      // Get all lectures for a course with attendance
      const lectures = attendanceRepository.getCourseLectures(parseInt(courseId));
      return NextResponse.json({ lectures });
    } else if (lecturerId) {
      // Get lectures by lecturer
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const lectures = attendanceRepository.getLecturerLectures(
        parseInt(lecturerId),
        startDate,
        endDate
      );
      return NextResponse.json({ lectures });
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: courseId or lecturerId' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch lectures';
    console.error('Failed to fetch lectures:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, schedule_id, lecture_date, topic, conducted_by, status } = body;

    if (!course_id || !lecture_date) {
      return NextResponse.json(
        { error: 'Missing required fields: course_id, lecture_date' },
        { status: 400 }
      );
    }

    const lectureId = attendanceRepository.createLecture({
      course_id,
      schedule_id: schedule_id || null,
      lecture_date,
      topic: topic || null,
      conducted_by: conducted_by || null,
      status: status || 'scheduled'
    });

    return NextResponse.json({
      id: lectureId,
      course_id,
      lecture_date,
      status: status || 'scheduled'
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create lecture';
    console.error('Failed to create lecture:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
