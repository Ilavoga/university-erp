import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import Database from 'better-sqlite3';

initDatabase();
const db = new Database('./university.db');

// Get semester start date
function getSemesterStart(semester: string, year: number): Date {
  const monthMap: Record<string, number> = {
    'Semester 1': 0,  // January
    'Semester 2': 4,  // May
    'Semester 3': 8,  // September
  };
  return new Date(year, monthMap[semester], 1);
}

// Calculate week number
function getWeekNumber(date: Date, semesterStart: Date): number {
  const diffTime = date.getTime() - semesterStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

// Check if date is in examination period
function isExamPeriod(weekNumber: number): boolean {
  return weekNumber >= 14 && weekNumber <= 16;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lecture_date,
      start_time,
      end_time,
      faculty_id,
      course_id,
      location,
      delivery_mode,
      exclude_lecture_id
    } = body;

    // Validate required fields
    if (!lecture_date || !start_time || !end_time || !faculty_id || !course_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const conflicts: Array<any> = [];

    // Get course semester info
    const course = db.prepare('SELECT semester, year, code, name FROM courses WHERE id = ?').get(course_id) as any;
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const semesterStart = getSemesterStart(course.semester, course.year);
    const lectureDate = new Date(lecture_date);
    const weekNumber = getWeekNumber(lectureDate, semesterStart);

    // Check if in exam period
    if (isExamPeriod(weekNumber)) {
      conflicts.push({
        type: 'exam_period',
        severity: 'error',
        message: `Week ${weekNumber} is during examination period (weeks 14-16). Regular lectures cannot be scheduled.`,
        details: {
          week_number: weekNumber,
          semester: course.semester,
          year: course.year
        }
      });
    }

    // Check if lecture date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lectureDate < today) {
      conflicts.push({
        type: 'past_date',
        severity: 'warning',
        message: 'Lecture date is in the past',
        details: { lecture_date }
      });
    }

    // Check if day is weekend (Saturday=6, Sunday=0)
    const dayOfWeek = lectureDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      conflicts.push({
        type: 'weekend',
        severity: 'warning',
        message: 'Lecture scheduled on weekend',
        details: { 
          day: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
          lecture_date 
        }
      });
    }

    // Check faculty conflicts
    const facultyConflictQuery = `
      SELECT l.*, c.code, c.name
      FROM lectures l
      JOIN courses c ON l.course_id = c.id
      WHERE l.conducted_by = ?
        AND l.lecture_date = ?
        AND l.start_time < ?
        AND l.end_time > ?
        AND l.status != 'cancelled'
        ${exclude_lecture_id ? 'AND l.id != ?' : ''}
      LIMIT 1
    `;
    
    const facultyParams = [faculty_id, lecture_date, end_time, start_time];
    if (exclude_lecture_id) facultyParams.push(exclude_lecture_id);
    
    const facultyConflict = db.prepare(facultyConflictQuery).get(...facultyParams) as any;
    if (facultyConflict) {
      conflicts.push({
        type: 'faculty',
        severity: 'error',
        message: `Faculty already has a scheduled lecture`,
        details: {
          conflicting_course: {
            code: facultyConflict.code,
            name: facultyConflict.name
          },
          conflicting_lecture: {
            id: facultyConflict.id,
            topic: facultyConflict.topic,
            location: facultyConflict.location,
            time_slot: `${facultyConflict.start_time} - ${facultyConflict.end_time}`
          }
        }
      });
    }

    // Check room conflicts (only for physical classes)
    if (delivery_mode === 'physical' && location) {
      const roomConflictQuery = `
        SELECT l.*, c.code, c.name
        FROM lectures l
        JOIN courses c ON l.course_id = c.id
        WHERE l.location = ?
          AND l.lecture_date = ?
          AND l.start_time < ?
          AND l.end_time > ?
          AND l.delivery_mode = 'physical'
          AND l.status != 'cancelled'
          ${exclude_lecture_id ? 'AND l.id != ?' : ''}
        LIMIT 1
      `;
      
      const roomParams = [location, lecture_date, end_time, start_time];
      if (exclude_lecture_id) roomParams.push(exclude_lecture_id);
      
      const roomConflict = db.prepare(roomConflictQuery).get(...roomParams) as any;
      if (roomConflict) {
        conflicts.push({
          type: 'room',
          severity: 'error',
          message: `Room ${location} is already booked`,
          details: {
            location,
            conflicting_course: {
              code: roomConflict.code,
              name: roomConflict.name
            },
            conflicting_lecture: {
              id: roomConflict.id,
              topic: roomConflict.topic,
              time_slot: `${roomConflict.start_time} - ${roomConflict.end_time}`
            }
          }
        });
      }
    }

    // Check student conflicts
    const studentConflictQuery = `
      SELECT 
        l.*,
        c.code,
        c.name,
        COUNT(DISTINCT e.student_id) as affected_students
      FROM lectures l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id IN (
        SELECT student_id FROM enrollments WHERE course_id = ?
      )
      AND l.lecture_date = ?
      AND l.start_time < ?
      AND l.end_time > ?
      AND l.course_id != ?
      AND l.status != 'cancelled'
      ${exclude_lecture_id ? 'AND l.id != ?' : ''}
      GROUP BY l.id
      LIMIT 1
    `;
    
    const studentParams = [course_id, lecture_date, end_time, start_time, course_id];
    if (exclude_lecture_id) studentParams.push(exclude_lecture_id);
    
    const studentConflict = db.prepare(studentConflictQuery).get(...studentParams) as any;
    if (studentConflict) {
      conflicts.push({
        type: 'student',
        severity: 'error',
        message: `${studentConflict.affected_students} student(s) have a conflicting class`,
        details: {
          affected_students: studentConflict.affected_students,
          conflicting_course: {
            code: studentConflict.code,
            name: studentConflict.name
          },
          conflicting_lecture: {
            id: studentConflict.id,
            topic: studentConflict.topic,
            location: studentConflict.location,
            time_slot: `${studentConflict.start_time} - ${studentConflict.end_time}`
          }
        }
      });
    }

    // Suggest alternative slots if there are blocking conflicts
    const blockingConflicts = conflicts.filter(c => c.severity === 'error');
    let suggestions = [];
    
    if (blockingConflicts.length > 0) {
      suggestions = findAlternativeSlots({
        date: lecture_date,
        facultyId: faculty_id,
        courseId: course_id,
        location: delivery_mode === 'physical' ? location : undefined,
        excludeLectureId: exclude_lecture_id
      });
    }

    return NextResponse.json({
      has_conflicts: conflicts.length > 0,
      blocking_conflicts: blockingConflicts.length,
      warning_conflicts: conflicts.filter(c => c.severity === 'warning').length,
      conflicts,
      suggestions,
      details: {
        course: {
          code: course.code,
          name: course.name,
          semester: course.semester,
          year: course.year
        },
        requested_slot: {
          date: lecture_date,
          day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          time: `${start_time} - ${end_time}`,
          week_number: weekNumber,
          location: location || 'Online'
        }
      }
    });

  } catch (error: unknown) {
    console.error('Failed to check conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to check conflicts' },
      { status: 500 }
    );
  }
}

// Helper function to find alternative time slots
function findAlternativeSlots(params: {
  date: string;
  facultyId: number;
  courseId: number;
  location?: string;
  excludeLectureId?: number;
}): Array<any> {
  const alternatives: Array<any> = [];
  const requestedDate = new Date(params.date);
  
  // Time slots: 7-10, 10-13, 13-16, 16-19
  const timeSlots = [
    { start: '07:00', end: '10:00', label: '7:00 AM - 10:00 AM' },
    { start: '10:00', end: '13:00', label: '10:00 AM - 1:00 PM' },
    { start: '13:00', end: '16:00', label: '1:00 PM - 4:00 PM' },
    { start: '16:00', end: '19:00', label: '4:00 PM - 7:00 PM' }
  ];

  // Check same day, different times
  for (const slot of timeSlots) {
    const conflictCheck = checkSlotAvailability({
      date: params.date,
      startTime: slot.start,
      endTime: slot.end,
      facultyId: params.facultyId,
      courseId: params.courseId,
      location: params.location,
      excludeLectureId: params.excludeLectureId
    });

    if (!conflictCheck.hasConflict) {
      alternatives.push({
        date: params.date,
        day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][requestedDate.getDay()],
        time_slot: slot.label,
        start_time: slot.start,
        end_time: slot.end,
        available: true
      });
    }
  }

  return alternatives.slice(0, 5); // Return up to 5 suggestions
}

// Check if a specific slot is available
function checkSlotAvailability(params: {
  date: string;
  startTime: string;
  endTime: string;
  facultyId: number;
  courseId: number;
  location?: string;
  excludeLectureId?: number;
}): { hasConflict: boolean } {
  // Check faculty
  const facultyQuery = `
    SELECT 1 FROM lectures 
    WHERE conducted_by = ? AND lecture_date = ?
      AND start_time < ? AND end_time > ?
      AND status != 'cancelled'
      ${params.excludeLectureId ? 'AND id != ?' : ''}
    LIMIT 1
  `;
  const facultyParams = [params.facultyId, params.date, params.endTime, params.startTime];
  if (params.excludeLectureId) facultyParams.push(params.excludeLectureId);
  
  if (db.prepare(facultyQuery).get(...facultyParams)) {
    return { hasConflict: true };
  }

  // Check room
  if (params.location) {
    const roomQuery = `
      SELECT 1 FROM lectures 
      WHERE location = ? AND lecture_date = ?
        AND start_time < ? AND end_time > ?
        AND delivery_mode = 'physical'
        AND status != 'cancelled'
        ${params.excludeLectureId ? 'AND id != ?' : ''}
      LIMIT 1
    `;
    const roomParams = [params.location, params.date, params.endTime, params.startTime];
    if (params.excludeLectureId) roomParams.push(params.excludeLectureId);
    
    if (db.prepare(roomQuery).get(...roomParams)) {
      return { hasConflict: true };
    }
  }

  // Check students
  const studentQuery = `
    SELECT 1 FROM lectures l
    JOIN enrollments e ON l.course_id = e.course_id
    WHERE e.student_id IN (SELECT student_id FROM enrollments WHERE course_id = ?)
      AND l.lecture_date = ?
      AND l.start_time < ?
      AND l.end_time > ?
      AND l.course_id != ?
      AND l.status != 'cancelled'
      ${params.excludeLectureId ? 'AND l.id != ?' : ''}
    LIMIT 1
  `;
  const studentParams = [params.courseId, params.date, params.endTime, params.startTime, params.courseId];
  if (params.excludeLectureId) studentParams.push(params.excludeLectureId);
  
  if (db.prepare(studentQuery).get(...studentParams)) {
    return { hasConflict: true };
  }

  return { hasConflict: false };
}
