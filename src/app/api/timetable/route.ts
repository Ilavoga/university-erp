import { NextRequest, NextResponse } from 'next/server';
import scheduleRepository from '@/lib/repositories/ScheduleRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lecturerId = searchParams.get('lecturerId');

    if (lecturerId) {
      // Get lecturer's personal timetable
      const timetable = scheduleRepository.getLecturerTimetable(parseInt(lecturerId));
      return NextResponse.json({ timetable, type: 'lecturer' });
    } else {
      // Get master weekly timetable
      const timetable = scheduleRepository.getWeeklyTimetable();
      return NextResponse.json({ timetable, type: 'master' });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch timetable';
    console.error('Failed to fetch timetable:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
