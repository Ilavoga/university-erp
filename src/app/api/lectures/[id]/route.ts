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

// Check conflicts
function checkConflicts(params: {
  lectureDate: string;
  startTime: string;
  endTime: string;
  facultyId: number;
  courseId: number;
  location?: string;
  excludeLectureId?: number;
}) {
  const conflicts: Array<any> = [];

  // Get course semester info
  const course = db.prepare('SELECT semester, year FROM courses WHERE id = ?').get(params.courseId) as any;
  if (course) {
    const semesterStart = getSemesterStart(course.semester, course.year);
    const lectureDate = new Date(params.lectureDate);
    const weekNumber = getWeekNumber(lectureDate, semesterStart);

    if (isExamPeriod(weekNumber)) {
      conflicts.push({
        type: 'exam_period',
        message: 'Cannot schedule lectures during examination period (weeks 14-16)'
      });
    }
  }

  // Faculty conflicts
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
  
  const facultyParams = [params.facultyId, params.lectureDate, params.endTime, params.startTime];
  if (params.excludeLectureId) facultyParams.push(params.excludeLectureId);
  
  const facultyConflict = db.prepare(facultyConflictQuery).get(...facultyParams) as any;
  if (facultyConflict) {
    conflicts.push({
      type: 'faculty',
      message: `Faculty already teaching ${facultyConflict.code} at this time`,
      conflictingLecture: facultyConflict
    });
  }

  // Room conflicts
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
    
    const roomParams = [params.location, params.lectureDate, params.endTime, params.startTime];
    if (params.excludeLectureId) roomParams.push(params.excludeLectureId);
    
    const roomConflict = db.prepare(roomConflictQuery).get(...roomParams) as any;
    if (roomConflict) {
      conflicts.push({
        type: 'room',
        message: `Room ${params.location} already booked for ${roomConflict.code}`,
        conflictingLecture: roomConflict
      });
    }
  }

  // Student conflicts
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
  
  const studentParams = [params.courseId, params.lectureDate, params.endTime, params.startTime, params.courseId];
  if (params.excludeLectureId) studentParams.push(params.excludeLectureId);
  
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
    const lectureId = parseInt(id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: 'Invalid lecture ID' },
        { status: 400 }
      );
    }

    const lecture = db.prepare(`
      SELECT 
        l.*,
        c.code as course_code,
        c.name as course_name,
        m.title as module_title,
        u.name as faculty_name,
        (SELECT COUNT(*) FROM lecture_attendance WHERE lecture_id = l.id) as attendance_count,
        (SELECT COUNT(*) FROM lecture_attendance WHERE lecture_id = l.id AND status = 'present') as present_count
      FROM lectures l
      JOIN courses c ON l.course_id = c.id
      LEFT JOIN course_modules m ON l.module_id = m.id
      LEFT JOIN users u ON l.conducted_by = u.id
      WHERE l.id = ?
    `).get(lectureId);

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lecture });
  } catch (error: unknown) {
    console.error('Failed to fetch lecture:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lecture' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lectureId = parseInt(id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: 'Invalid lecture ID' },
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
      status
    } = body;

    // Get existing lecture
    const existingLecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(lectureId) as any;
    if (!existingLecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Build update object
    const fields: string[] = [];
    const values: any[] = [];

    if (module_id !== undefined) {
      fields.push('module_id = ?');
      values.push(module_id);
    }
    if (topic !== undefined) {
      fields.push('topic = ?');
      values.push(topic);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status);
    }

    // Check if time/date/location changed (requires conflict check)
    const needsConflictCheck = 
      lecture_date !== undefined ||
      start_time !== undefined ||
      end_time !== undefined ||
      location !== undefined;

    if (needsConflictCheck) {
      const finalDate = lecture_date || existingLecture.lecture_date;
      const finalStartTime = start_time || existingLecture.start_time;
      const finalEndTime = end_time || existingLecture.end_time;
      const finalDeliveryMode = delivery_mode || existingLecture.delivery_mode;
      const finalLocation = location !== undefined ? location : existingLecture.location;

      // Validate delivery mode requirements
      if (finalDeliveryMode === 'physical' && !finalLocation) {
        return NextResponse.json(
          { error: 'Location is required for physical classes' },
          { status: 400 }
        );
      }

      // Get course info for week calculation
      const course = db.prepare('SELECT semester, year FROM courses WHERE id = ?').get(existingLecture.course_id) as any;
      if (course) {
        const semesterStart = getSemesterStart(course.semester, course.year);
        const lectureDate = new Date(finalDate);
        const weekNumber = getWeekNumber(lectureDate, semesterStart);

        // Check conflicts
        const conflictCheck = checkConflicts({
          lectureDate: finalDate,
          startTime: finalStartTime,
          endTime: finalEndTime,
          facultyId: existingLecture.conducted_by,
          courseId: existingLecture.course_id,
          location: finalDeliveryMode === 'physical' ? finalLocation : undefined,
          excludeLectureId: lectureId
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

        // Update week number if date changed
        if (lecture_date !== undefined) {
          fields.push('lecture_date = ?', 'week_number = ?');
          values.push(finalDate, weekNumber);
        }
      }

      if (start_time !== undefined) {
        fields.push('start_time = ?');
        values.push(start_time);
      }
      if (end_time !== undefined) {
        fields.push('end_time = ?');
        values.push(end_time);
      }
    }

    if (delivery_mode !== undefined) {
      fields.push('delivery_mode = ?');
      values.push(delivery_mode);
    }
    if (location !== undefined) {
      fields.push('location = ?');
      values.push(delivery_mode === 'physical' ? location : null);
    }
    if (meeting_link !== undefined) {
      fields.push('meeting_link = ?');
      values.push(delivery_mode === 'online' ? meeting_link : null);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Execute update
    values.push(lectureId);
    db.prepare(`
      UPDATE lectures
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    // Fetch updated lecture
    const lecture = db.prepare(`
      SELECT l.*, m.title as module_title, u.name as faculty_name
      FROM lectures l
      LEFT JOIN course_modules m ON l.module_id = m.id
      LEFT JOIN users u ON l.conducted_by = u.id
      WHERE l.id = ?
    `).get(lectureId);

    return NextResponse.json({
      success: true,
      lecture
    });

  } catch (error: unknown) {
    console.error('Failed to update lecture:', error);
    return NextResponse.json(
      { error: 'Failed to update lecture' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lectureId = parseInt(id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: 'Invalid lecture ID' },
        { status: 400 }
      );
    }

    // Check if lecture exists
    const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(lectureId);
    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      );
    }

    // Mark as cancelled instead of deleting (preserve attendance records)
    db.prepare('UPDATE lectures SET status = ? WHERE id = ?').run('cancelled', lectureId);

    return NextResponse.json({
      success: true,
      message: 'Lecture cancelled successfully'
    });

  } catch (error: unknown) {
    console.error('Failed to delete lecture:', error);
    return NextResponse.json(
      { error: 'Failed to delete lecture' },
      { status: 500 }
    );
  }
}
