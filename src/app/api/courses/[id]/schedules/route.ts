import { NextRequest, NextResponse } from 'next/server';
import scheduleRepository from '@/lib/repositories/ScheduleRepository';
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

    const schedules = scheduleRepository.getCourseSchedule(courseId);
    
    // Validate total hours vs credits
    const validation = scheduleRepository.validateScheduleHours(courseId);

    return NextResponse.json({
      schedules,
      validation: {
        valid: validation.valid,
        totalHours: validation.totalHours,
        requiredCredits: validation.requiredCredits,
        message: validation.valid 
          ? 'Schedule meets credit requirements'
          : `Schedule has ${validation.totalHours} hours but course requires ${validation.requiredCredits} credits (hours)`
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch schedules';
    console.error('Failed to fetch schedules:', error);
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
    const courseId = parseInt(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { day_of_week, start_time, end_time, room, lecture_type } = body;

    // Validate required fields
    if (!day_of_week || !start_time || !end_time || !room || !lecture_type) {
      return NextResponse.json(
        { error: 'Missing required fields: day_of_week, start_time, end_time, room, lecture_type' },
        { status: 400 }
      );
    }

    // Check for room conflicts
    const roomConflict = scheduleRepository.checkRoomConflict(
      day_of_week,
      start_time,
      end_time,
      room
    );

    if (roomConflict) {
      return NextResponse.json(
        { error: 'Room conflict detected', conflict: roomConflict },
        { status: 409 }
      );
    }

    // Check for faculty conflicts
    const facultyConflict = scheduleRepository.checkFacultyConflict(
      courseId,
      day_of_week,
      start_time,
      end_time
    );

    if (facultyConflict) {
      return NextResponse.json(
        { error: 'Faculty conflict detected', conflict: facultyConflict },
        { status: 409 }
      );
    }

    // Create schedule entry
    const scheduleId = scheduleRepository.createScheduleEntry({
      course_id: courseId,
      day_of_week,
      start_time,
      end_time,
      room,
      lecture_type
    });

    // Return created schedule with validation
    const schedules = scheduleRepository.getCourseSchedule(courseId);
    const validation = scheduleRepository.validateScheduleHours(courseId);

    return NextResponse.json({
      id: scheduleId,
      schedules,
      validation: {
        valid: validation.valid,
        totalHours: validation.totalHours,
        requiredCredits: validation.requiredCredits
      }
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule';
    console.error('Failed to create schedule:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
