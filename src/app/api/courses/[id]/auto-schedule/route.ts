import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import Database from 'better-sqlite3';

initDatabase();
const db = new Database('./university.db');

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

interface SchedulePreferences {
  preferred_days?: number[]; // 0=Sunday, 1=Monday, etc.
  preferred_times?: string[]; // e.g., ['07:00', '10:00']
  delivery_mode: 'online' | 'physical';
  location?: string;
  meeting_link?: string;
}

// Get semester start date
function getSemesterStart(semester: string, year: number): Date {
  const monthMap: Record<string, number> = {
    'Semester 1': 0,  // January
    'Semester 2': 4,  // May
    'Semester 3': 8,  // September
  };
  return new Date(year, monthMap[semester], 1);
}

// Get date for specific week and day
function getDateForWeek(semesterStart: Date, weekNumber: number, dayOfWeek: number): string {
  const date = new Date(semesterStart);
  date.setDate(date.getDate() + ((weekNumber - 1) * 7) + (dayOfWeek - date.getDay()));
  return date.toISOString().split('T')[0];
}

// Time slots (3-hour blocks)
const TIME_SLOTS: TimeSlot[] = [
  { start: '07:00', end: '10:00', label: '7:00 AM - 10:00 AM' },
  { start: '10:00', end: '13:00', label: '10:00 AM - 1:00 PM' },
  { start: '13:00', end: '16:00', label: '1:00 PM - 4:00 PM' },
  { start: '16:00', end: '19:00', label: '4:00 PM - 7:00 PM' }
];

// Weekdays (Monday-Friday)
const WEEKDAYS = [1, 2, 3, 4, 5]; // Monday to Friday

// Check if slot is available
function isSlotAvailable(params: {
  date: string;
  startTime: string;
  endTime: string;
  facultyId: number;
  courseId: number;
  location?: string;
}): boolean {
  // Check faculty conflicts
  const facultyConflict = db.prepare(`
    SELECT 1 FROM lectures 
    WHERE conducted_by = ? AND lecture_date = ?
      AND start_time < ? AND end_time > ?
      AND status != 'cancelled'
    LIMIT 1
  `).get(params.facultyId, params.date, params.endTime, params.startTime);

  if (facultyConflict) return false;

  // Check room conflicts (for physical classes)
  if (params.location) {
    const roomConflict = db.prepare(`
      SELECT 1 FROM lectures 
      WHERE location = ? AND lecture_date = ?
        AND start_time < ? AND end_time > ?
        AND delivery_mode = 'physical'
        AND status != 'cancelled'
      LIMIT 1
    `).get(params.location, params.date, params.endTime, params.startTime);

    if (roomConflict) return false;
  }

  // Check student conflicts
  const studentConflict = db.prepare(`
    SELECT 1 FROM lectures l
    JOIN enrollments e ON l.course_id = e.course_id
    WHERE e.student_id IN (SELECT student_id FROM enrollments WHERE course_id = ?)
      AND l.lecture_date = ?
      AND l.start_time < ?
      AND l.end_time > ?
      AND l.course_id != ?
      AND l.status != 'cancelled'
    LIMIT 1
  `).get(params.courseId, params.date, params.endTime, params.startTime, params.courseId);

  if (studentConflict) return false;

  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      faculty_id,
      preferences = {}
    }: {
      faculty_id: number;
      preferences: SchedulePreferences;
    } = body;

    if (!faculty_id) {
      return NextResponse.json(
        { error: 'faculty_id is required' },
        { status: 400 }
      );
    }

    // Get course info
    const course = db.prepare(`
      SELECT id, code, name, semester, year 
      FROM courses 
      WHERE id = ?
    `).get(courseId) as any;

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get modules for the course
    const modules = db.prepare(`
      SELECT id, title, sequence, duration_weeks 
      FROM course_modules 
      WHERE course_id = ?
      ORDER BY sequence
    `).all(courseId) as any[];

    if (modules.length === 0) {
      return NextResponse.json(
        { error: 'No modules found for this course' },
        { status: 400 }
      );
    }

    // Calculate total weeks needed
    const totalWeeksNeeded = modules.reduce((sum, m) => sum + m.duration_weeks, 0);

    if (totalWeeksNeeded > 13) {
      return NextResponse.json(
        { 
          error: 'Total module duration exceeds 13 weeks',
          details: {
            total_weeks_needed: totalWeeksNeeded,
            max_weeks: 13,
            modules: modules.map(m => ({
              title: m.title,
              duration_weeks: m.duration_weeks
            }))
          }
        },
        { status: 400 }
      );
    }

    // Get semester start date
    const semesterStart = getSemesterStart(course.semester, course.year);

    // Set preferences defaults
    const preferredDays = preferences.preferred_days && preferences.preferred_days.length > 0
      ? preferences.preferred_days.filter(d => WEEKDAYS.includes(d))
      : WEEKDAYS;

    const preferredTimes = preferences.preferred_times && preferences.preferred_times.length > 0
      ? TIME_SLOTS.filter(slot => preferences.preferred_times!.includes(slot.start))
      : TIME_SLOTS;

    const deliveryMode = preferences.delivery_mode || 'physical';
    const location = deliveryMode === 'physical' ? preferences.location : undefined;
    const meetingLink = deliveryMode === 'online' ? preferences.meeting_link : undefined;

    if (deliveryMode === 'physical' && !location) {
      return NextResponse.json(
        { error: 'Location is required for physical delivery mode' },
        { status: 400 }
      );
    }

    if (deliveryMode === 'online' && !meetingLink) {
      return NextResponse.json(
        { error: 'Meeting link is required for online delivery mode' },
        { status: 400 }
      );
    }

    // Generate schedule
    const schedule: any[] = [];
    const conflicts: any[] = [];
    let currentWeek = 1;

    for (const module of modules) {
      for (let weekOffset = 0; weekOffset < module.duration_weeks; weekOffset++) {
        const weekNumber = currentWeek + weekOffset;

        if (weekNumber > 13) {
          conflicts.push({
            module_id: module.id,
            module_title: module.title,
            week: weekNumber,
            error: 'Exceeds 13-week teaching period'
          });
          break;
        }

        let scheduled = false;

        // Try preferred days and times first
        for (const day of preferredDays) {
          if (scheduled) break;

          for (const timeSlot of preferredTimes) {
            const date = getDateForWeek(semesterStart, weekNumber, day);

            if (isSlotAvailable({
              date,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              facultyId: faculty_id,
              courseId,
              location
            })) {
              schedule.push({
                module_id: module.id,
                module_title: module.title,
                module_sequence: module.sequence,
                week_number: weekNumber,
                lecture_date: date,
                day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
                start_time: timeSlot.start,
                end_time: timeSlot.end,
                time_slot: timeSlot.label,
                delivery_mode: deliveryMode,
                location: location || null,
                meeting_link: meetingLink || null,
                topic: `${module.title} - Week ${weekOffset + 1}`
              });
              scheduled = true;
              break;
            }
          }
        }

        // If not scheduled, try all days and times
        if (!scheduled) {
          for (const day of WEEKDAYS) {
            if (scheduled) break;

            for (const timeSlot of TIME_SLOTS) {
              const date = getDateForWeek(semesterStart, weekNumber, day);

              if (isSlotAvailable({
                date,
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                facultyId: faculty_id,
                courseId,
                location
              })) {
                schedule.push({
                  module_id: module.id,
                  module_title: module.title,
                  module_sequence: module.sequence,
                  week_number: weekNumber,
                  lecture_date: date,
                  day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
                  start_time: timeSlot.start,
                  end_time: timeSlot.end,
                  time_slot: timeSlot.label,
                  delivery_mode: deliveryMode,
                  location: location || null,
                  meeting_link: meetingLink || null,
                  topic: `${module.title} - Week ${weekOffset + 1}`
                });
                scheduled = true;
                break;
              }
            }
          }
        }

        if (!scheduled) {
          conflicts.push({
            module_id: module.id,
            module_title: module.title,
            week: weekNumber,
            error: 'No available time slots'
          });
        }
      }

      currentWeek += module.duration_weeks;
    }

    // Return preview (don't save yet)
    return NextResponse.json({
      success: schedule.length > 0,
      course: {
        code: course.code,
        name: course.name,
        semester: course.semester,
        year: course.year
      },
      summary: {
        total_modules: modules.length,
        total_weeks: totalWeeksNeeded,
        lectures_scheduled: schedule.length,
        conflicts: conflicts.length
      },
      schedule,
      conflicts,
      preferences: {
        delivery_mode: deliveryMode,
        location: location || 'Online',
        preferred_days: preferredDays.map(d => 
          ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
        ),
        preferred_times: preferredTimes.map(t => t.label)
      },
      next_steps: schedule.length > 0 && conflicts.length === 0
        ? 'Review the schedule and confirm to save all lectures'
        : 'Resolve conflicts before saving'
    });

  } catch (error: unknown) {
    console.error('Failed to generate schedule:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}

// Confirm and save the schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { faculty_id, schedule } = body;

    if (!faculty_id || !schedule || !Array.isArray(schedule)) {
      return NextResponse.json(
        { error: 'faculty_id and schedule array are required' },
        { status: 400 }
      );
    }

    // Insert all lectures in a transaction
    const insertStmt = db.prepare(`
      INSERT INTO lectures (
        course_id, module_id, lecture_date, start_time, end_time,
        delivery_mode, location, meeting_link, topic, conducted_by,
        week_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `);

    const insertMany = db.transaction((lectures: any[]) => {
      for (const lecture of lectures) {
        insertStmt.run(
          courseId,
          lecture.module_id,
          lecture.lecture_date,
          lecture.start_time,
          lecture.end_time,
          lecture.delivery_mode,
          lecture.location,
          lecture.meeting_link,
          lecture.topic,
          faculty_id,
          lecture.week_number
        );
      }
    });

    insertMany(schedule);

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled ${schedule.length} lectures`,
      lectures_created: schedule.length
    });

  } catch (error: unknown) {
    console.error('Failed to save schedule:', error);
    return NextResponse.json(
      { error: 'Failed to save schedule' },
      { status: 500 }
    );
  }
}
