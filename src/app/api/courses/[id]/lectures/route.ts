import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import Database from 'better-sqlite3';

initDatabase();
const db = new Database('./university.db');

interface TimeSlot {
  start: string;
  end: string;
}

interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'faculty' | 'room' | 'student' | 'exam_period';
    message: string;
    conflictingLecture?: any;
  }>;
}

// Calculate week number within semester
function getWeekNumber(date: Date, semesterStart: Date): number {
  const diffTime = date.getTime() - semesterStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
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

// Check if date is in examination period (weeks 14-16)
function isExamPeriod(weekNumber: number): boolean {
  return weekNumber >= 14 && weekNumber <= 16;
}

// Check for conflicts
function checkConflicts(params: {
  lectureDate: string;
  startTime: string;
  endTime: string;
  facultyId: number;
  courseId: number;
  location?: string;
  excludeLectureId?: number;
}): ConflictCheck {
  const conflicts: ConflictCheck['conflicts'] = [];

  // Get course semester info
  const course = db.prepare('SELECT semester, year FROM courses WHERE id = ?').get(params.courseId) as any;
  if (course) {
    const semesterStart = getSemesterStart(course.semester, course.year);
    const lectureDate = new Date(params.lectureDate);
    const weekNumber = getWeekNumber(lectureDate, semesterStart);

    // Check if in exam period
    if (isExamPeriod(weekNumber)) {
      conflicts.push({
        type: 'exam_period',
        message: 'Cannot schedule lectures during examination period (weeks 14-16)'
      });
    }
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
      ${params.excludeLectureId ? 'AND l.id != ?' : ''}
    LIMIT 1
  `;
  
  const facultyParams = [
    params.facultyId,
    params.lectureDate,
    params.endTime,
    params.startTime
  ];
  
  if (params.excludeLectureId) {
    facultyParams.push(params.excludeLectureId);
  }
  
  const facultyConflict = db.prepare(facultyConflictQuery).get(...facultyParams) as any;
  
  if (facultyConflict) {
    conflicts.push({
      type: 'faculty',
      message: `Faculty already teaching ${facultyConflict.code} at this time`,
      conflictingLecture: facultyConflict
    });
  }

  // Check room conflicts (only for physical classes)
  if (params.location) {
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
        ${params.excludeLectureId ? 'AND l.id != ?' : ''}
      LIMIT 1
    `;
    
    const roomParams = [
      params.location,
      params.lectureDate,
      params.endTime,
      params.startTime
    ];
    
    if (params.excludeLectureId) {
      roomParams.push(params.excludeLectureId);
    }
    
    const roomConflict = db.prepare(roomConflictQuery).get(...roomParams) as any;
    
    if (roomConflict) {
      conflicts.push({
        type: 'room',
        message: `Room ${params.location} already booked for ${roomConflict.code}`,
        conflictingLecture: roomConflict
      });
    }
  }

  // Check student conflicts (students enrolled in multiple courses)
  const studentConflictQuery = `
    SELECT l.*, c.code, c.name, COUNT(DISTINCT e.student_id) as affected_students
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
    ${params.excludeLectureId ? 'AND l.id != ?' : ''}
    GROUP BY l.id
    LIMIT 1
  `;
  
  const studentParams = [
    params.courseId,
    params.lectureDate,
    params.endTime,
    params.startTime,
    params.courseId
  ];
  
  if (params.excludeLectureId) {
    studentParams.push(params.excludeLectureId);
  }
  
  const studentConflict = db.prepare(studentConflictQuery).get(...studentParams) as any;
  
  if (studentConflict) {
    conflicts.push({
      type: 'student',
      message: `${studentConflict.affected_students} student(s) have conflicting class: ${studentConflict.code}`,
      conflictingLecture: studentConflict
    });
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

export async function GET(
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

    const searchParams = request.nextUrl.searchParams;
    const groupBy = searchParams.get('groupBy');

    if (groupBy === 'module') {
      // Get lectures grouped by module
      const query = `
        SELECT 
          l.*,
          m.title as module_title,
          m.sequence as module_sequence,
          m.description as module_description,
          u.name as faculty_name
        FROM lectures l
        LEFT JOIN course_modules m ON l.module_id = m.id
        LEFT JOIN users u ON l.conducted_by = u.id
        WHERE l.course_id = ?
        ORDER BY m.sequence, l.week_number, l.lecture_date
      `;
      
      const lectures = db.prepare(query).all(courseId);
      
      // Group by module
      const grouped = lectures.reduce((acc: any, lecture: any) => {
        const moduleId = lecture.module_id || 'unassigned';
        if (!acc[moduleId]) {
          acc[moduleId] = {
            module: {
              id: lecture.module_id,
              title: lecture.module_title,
              sequence: lecture.module_sequence,
              description: lecture.module_description
            },
            lectures: []
          };
        }
        acc[moduleId].lectures.push(lecture);
        return acc;
      }, {});
      
      return NextResponse.json({
        lectures: Object.values(grouped)
      });
    } else {
      // Get all lectures for course
      const query = `
        SELECT 
          l.*,
          m.title as module_title,
          u.name as faculty_name,
          (SELECT COUNT(*) FROM lecture_attendance WHERE lecture_id = l.id) as attendance_count
        FROM lectures l
        LEFT JOIN course_modules m ON l.module_id = m.id
        LEFT JOIN users u ON l.conducted_by = u.id
        WHERE l.course_id = ?
        ORDER BY l.lecture_date, l.start_time
      `;
      
      const lectures = db.prepare(query).all(courseId);
      
      return NextResponse.json({ lectures });
    }
  } catch (error: unknown) {
    console.error('Failed to fetch lectures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lectures' },
      { status: 500 }
    );
  }
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
      module_id,
      lecture_date,
      start_time,
      end_time,
      delivery_mode,
      location,
      meeting_link,
      topic,
      conducted_by
    } = body;

    // Validate required fields
    if (!module_id || !lecture_date || !start_time || !end_time || !delivery_mode || !conducted_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate delivery mode requirements
    if (delivery_mode === 'physical' && !location) {
      return NextResponse.json(
        { error: 'Location is required for physical classes' },
        { status: 400 }
      );
    }

    if (delivery_mode === 'online' && !meeting_link) {
      return NextResponse.json(
        { error: 'Meeting link is required for online classes' },
        { status: 400 }
      );
    }

    // Get course info for week calculation
    const course = db.prepare('SELECT semester, year FROM courses WHERE id = ?').get(courseId) as any;
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const semesterStart = getSemesterStart(course.semester, course.year);
    const lectureDate = new Date(lecture_date);
    const weekNumber = getWeekNumber(lectureDate, semesterStart);

    // Check conflicts
    const conflictCheck = checkConflicts({
      lectureDate: lecture_date,
      startTime: start_time,
      endTime: end_time,
      facultyId: conducted_by,
      courseId,
      location: delivery_mode === 'physical' ? location : undefined
    });

    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        { 
          success: false,
          conflicts: conflictCheck.conflicts 
        },
        { status: 409 }
      );
    }

    // Get module title for default topic
    const module = db.prepare('SELECT title FROM course_modules WHERE id = ?').get(module_id) as any;
    const finalTopic = topic || module?.title || 'Lecture';

    // Insert lecture
    const result = db.prepare(`
      INSERT INTO lectures (
        course_id, module_id, lecture_date, start_time, end_time,
        delivery_mode, location, meeting_link, topic, conducted_by,
        week_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `).run(
      courseId,
      module_id,
      lecture_date,
      start_time,
      end_time,
      delivery_mode,
      delivery_mode === 'physical' ? location : null,
      delivery_mode === 'online' ? meeting_link : null,
      finalTopic,
      conducted_by,
      weekNumber
    );

    const lecture = db.prepare(`
      SELECT l.*, m.title as module_title, u.name as faculty_name
      FROM lectures l
      LEFT JOIN course_modules m ON l.module_id = m.id
      LEFT JOIN users u ON l.conducted_by = u.id
      WHERE l.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({
      success: true,
      lecture
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Failed to create lecture:', error);
    return NextResponse.json(
      { error: 'Failed to create lecture' },
      { status: 500 }
    );
  }
}
