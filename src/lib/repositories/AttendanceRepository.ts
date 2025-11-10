import db from '../db';

export interface Lecture {
  id: number;
  course_id: number;
  schedule_id: number | null;
  lecture_date: string;
  topic: string | null;
  conducted_by: number | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  lecture_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at: string;
  marked_by: number | null;
}

export interface StudentAttendanceStats {
  student_id: number;
  course_id: number;
  total_lectures: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  attendance_percentage: number;
}

export interface LectureWithAttendance {
  lecture: Lecture & { course_name: string; course_code: string };
  attendance_records: (AttendanceRecord & { student_name: string; student_id_text: string })[];
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
}

export class AttendanceRepository {
  /**
   * Create a new lecture session
   */
  createLecture(lectureData: Omit<Lecture, 'id' | 'created_at'>): number {
    const result = db.prepare(`
      INSERT INTO lectures (course_id, schedule_id, lecture_date, topic, conducted_by, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      lectureData.course_id,
      lectureData.schedule_id,
      lectureData.lecture_date,
      lectureData.topic,
      lectureData.conducted_by,
      lectureData.status
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Update lecture details
   */
  updateLecture(lectureId: number, updates: Partial<Omit<Lecture, 'id' | 'course_id' | 'created_at'>>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.lecture_date !== undefined) {
      fields.push('lecture_date = ?');
      values.push(updates.lecture_date);
    }
    if (updates.topic !== undefined) {
      fields.push('topic = ?');
      values.push(updates.topic);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.conducted_by !== undefined) {
      fields.push('conducted_by = ?');
      values.push(updates.conducted_by);
    }

    if (fields.length === 0) return false;

    values.push(lectureId);
    const result = db.prepare(`
      UPDATE lectures
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    return result.changes > 0;
  }

  /**
   * Mark attendance for multiple students (bulk operation)
   */
  markAttendance(
    lectureId: number,
    attendanceData: { student_id: number; status: 'present' | 'absent' | 'late' | 'excused' }[],
    markedBy: number
  ): number {
    const insert = db.prepare(`
      INSERT INTO lecture_attendance (lecture_id, student_id, status, marked_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(lecture_id, student_id) 
      DO UPDATE SET status = excluded.status, marked_at = CURRENT_TIMESTAMP, marked_by = excluded.marked_by
    `);

    const transaction = db.transaction((records: { student_id: number; status: string }[]) => {
      for (const record of records) {
        insert.run(lectureId, record.student_id, record.status, markedBy);
      }
    });

    transaction(attendanceData);
    return attendanceData.length;
  }

  /**
   * Mark attendance for a single student
   */
  markStudentAttendance(
    lectureId: number,
    studentId: number,
    status: 'present' | 'absent' | 'late' | 'excused',
    markedBy: number
  ): boolean {
    const result = db.prepare(`
      INSERT INTO lecture_attendance (lecture_id, student_id, status, marked_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(lecture_id, student_id)
      DO UPDATE SET status = excluded.status, marked_at = CURRENT_TIMESTAMP, marked_by = excluded.marked_by
    `).run(lectureId, studentId, status, markedBy);

    return result.changes > 0;
  }

  /**
   * Get attendance records for a specific lecture
   */
  getLectureAttendance(lectureId: number): (AttendanceRecord & { student_name: string; student_id_text: string })[] {
    const records = db.prepare(`
      SELECT 
        la.*,
        u.name as student_name,
        s.student_id as student_id_text
      FROM lecture_attendance la
      JOIN users u ON la.student_id = u.id
      JOIN students s ON u.id = s.user_id
      WHERE la.lecture_id = ?
      ORDER BY s.student_id
    `).all(lectureId) as (AttendanceRecord & { student_name: string; student_id_text: string })[];

    return records;
  }

  /**
   * Get all lectures for a course with attendance summaries
   */
  getCourseLectures(courseId: number): LectureWithAttendance[] {
    const lectures = db.prepare(`
      SELECT 
        l.*,
        c.name as course_name,
        c.code as course_code
      FROM lectures l
      JOIN courses c ON l.course_id = c.id
      WHERE l.course_id = ?
      ORDER BY l.lecture_date DESC
    `).all(courseId) as (Lecture & { course_name: string; course_code: string })[];

    const result: LectureWithAttendance[] = [];
    for (const lecture of lectures) {
      const attendanceRecords = this.getLectureAttendance(lecture.id);
      
      const stats = {
        present_count: attendanceRecords.filter(r => r.status === 'present').length,
        absent_count: attendanceRecords.filter(r => r.status === 'absent').length,
        late_count: attendanceRecords.filter(r => r.status === 'late').length,
        excused_count: attendanceRecords.filter(r => r.status === 'excused').length
      };

      result.push({
        lecture,
        attendance_records: attendanceRecords,
        ...stats
      });
    }

    return result;
  }

  /**
   * Get student's attendance for a specific course
   */
  getStudentAttendance(studentId: number, courseId: number): StudentAttendanceStats {
    const stats = db.prepare(`
      SELECT 
        ? as student_id,
        ? as course_id,
        COUNT(DISTINCT l.id) as total_lectures,
        SUM(CASE WHEN la.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN la.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN la.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN la.status = 'excused' THEN 1 ELSE 0 END) as excused_count
      FROM lectures l
      LEFT JOIN lecture_attendance la ON l.id = la.lecture_id AND la.student_id = ?
      WHERE l.course_id = ? AND l.status = 'completed'
    `).get(studentId, courseId, studentId, courseId) as Omit<StudentAttendanceStats, 'attendance_percentage'>;

    // Calculate attendance percentage (late counts as 50%, excused excluded from denominator)
    const attendedLectures = stats.present_count + (stats.late_count * 0.5);
    const totalCountedLectures = stats.total_lectures - stats.excused_count;
    const attendance_percentage = totalCountedLectures > 0 
      ? (attendedLectures / totalCountedLectures) * 100 
      : 0;

    return {
      ...stats,
      attendance_percentage: Math.round(attendance_percentage * 100) / 100
    };
  }

  /**
   * Get attendance report for all students in a course
   */
  getCourseAttendanceReport(courseId: number): StudentAttendanceStats[] {
    // Get all enrolled students
    const students = db.prepare(`
      SELECT DISTINCT u.id as student_id
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ? AND e.status = 'active'
    `).all(courseId) as { student_id: number }[];

    const report: StudentAttendanceStats[] = [];
    for (const student of students) {
      const stats = this.getStudentAttendance(student.student_id, courseId);
      report.push(stats);
    }

    return report.sort((a, b) => b.attendance_percentage - a.attendance_percentage);
  }

  /**
   * Get student's attendance across all enrolled courses
   */
  getStudentAllAttendance(studentId: number): StudentAttendanceStats[] {
    const enrollments = db.prepare(`
      SELECT course_id FROM enrollments
      WHERE student_id = ? AND status = 'active'
    `).all(studentId) as { course_id: number }[];

    const attendance: StudentAttendanceStats[] = [];
    for (const enrollment of enrollments) {
      const stats = this.getStudentAttendance(studentId, enrollment.course_id);
      attendance.push(stats);
    }

    return attendance;
  }

  /**
   * Get lectures conducted by a specific lecturer
   */
  getLecturerLectures(lecturerId: number, startDate?: string, endDate?: string): Lecture[] {
    let query = `
      SELECT l.*
      FROM lectures l
      WHERE l.conducted_by = ?
    `;

    const params: unknown[] = [lecturerId];

    if (startDate) {
      query += ' AND l.lecture_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND l.lecture_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY l.lecture_date DESC';

    const lectures = db.prepare(query).all(...params) as Lecture[];
    return lectures;
  }

  /**
   * Delete a lecture (and its attendance records)
   */
  deleteLecture(lectureId: number): boolean {
    const result = db.prepare('DELETE FROM lectures WHERE id = ?').run(lectureId);
    return result.changes > 0;
  }

  /**
   * Get upcoming lectures for a course
   */
  getUpcomingLectures(courseId: number, limit = 10): Lecture[] {
    const lectures = db.prepare(`
      SELECT *
      FROM lectures
      WHERE course_id = ? 
        AND status = 'scheduled'
        AND lecture_date >= date('now')
      ORDER BY lecture_date ASC
      LIMIT ?
    `).all(courseId, limit) as Lecture[];

    return lectures;
  }

  /**
   * Auto-create lectures based on course schedule
   */
  autoCreateLectures(courseId: number, startDate: string, endDate: string, lecturerId: number): number {
    // Get course schedule
    const schedules = db.prepare(`
      SELECT * FROM course_schedules
      WHERE course_id = ?
    `).all(courseId) as { id: number; day_of_week: string }[];

    if (schedules.length === 0) {
      throw new Error('No schedule found for this course');
    }

    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    let created = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const schedule of schedules) {
      const targetDay = dayMap[schedule.day_of_week];
      
      // Find all dates matching this day of week
      const current = new Date(start);
      while (current <= end) {
        if (current.getDay() === targetDay) {
          const lectureDate = current.toISOString().split('T')[0];
          
          // Check if lecture already exists
          const existing = db.prepare(`
            SELECT id FROM lectures
            WHERE course_id = ? AND lecture_date = ?
          `).get(courseId, lectureDate);

          if (!existing) {
            this.createLecture({
              course_id: courseId,
              schedule_id: schedule.id,
              lecture_date: lectureDate,
              topic: null,
              conducted_by: lecturerId,
              status: 'scheduled'
            });
            created++;
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return created;
  }
}

const attendanceRepository = new AttendanceRepository();
export default attendanceRepository;
