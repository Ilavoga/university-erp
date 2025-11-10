import { NextRequest, NextResponse } from 'next/server';
import scheduleRepository from '@/lib/repositories/ScheduleRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; scheduleId: string } }
) {
  try {
    const scheduleId = parseInt(params.scheduleId);

    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { error: 'Invalid schedule ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { day_of_week, start_time, end_time, room, lecture_type } = body;

    // Check for room conflicts if room or time changed
    if (room && start_time && end_time && day_of_week) {
      const roomConflict = scheduleRepository.checkRoomConflict(
        day_of_week,
        start_time,
        end_time,
        room,
        scheduleId
      );

      if (roomConflict) {
        return NextResponse.json(
          { error: 'Room conflict detected', conflict: roomConflict },
          { status: 409 }
        );
      }
    }

    // Update schedule
    const updated = scheduleRepository.updateScheduleEntry(scheduleId, {
      day_of_week,
      start_time,
      end_time,
      room,
      lecture_type
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Schedule not found or no changes made' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: scheduleId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update schedule';
    console.error('Failed to update schedule:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; scheduleId: string } }
) {
  try {
    const scheduleId = parseInt(params.scheduleId);

    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { error: 'Invalid schedule ID' },
        { status: 400 }
      );
    }

    const deleted = scheduleRepository.deleteScheduleEntry(scheduleId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete schedule';
    console.error('Failed to delete schedule:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
