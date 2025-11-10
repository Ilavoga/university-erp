import db from '../db';

export interface CourseSchedule {
  id: number;
  course_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  lecture_type: 'lecture' | 'lab' | 'tutorial';
  created_at: string;
}

export interface ScheduleConflict {
  type: 'room' | 'faculty';
  conflicting_schedule: CourseSchedule;
  message: string;
}

export class ScheduleRepository {
  /**
   * Get all schedule entries for a course
   */
  getCourseSchedule(courseId: number): CourseSchedule[] {
    const schedules = db.prepare(`
      SELECT * FROM course_schedules
      WHERE course_id = ?
      ORDER BY 
        CASE day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        start_time
    `).all(courseId) as CourseSchedule[];

    return schedules;
  }

  /**
   * Create a new schedule entry
   */
  createScheduleEntry(scheduleData: Omit<CourseSchedule, 'id' | 'created_at'>): number {
    const result = db.prepare(`
      INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, room, lecture_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      scheduleData.course_id,
      scheduleData.day_of_week,
      scheduleData.start_time,
      scheduleData.end_time,
      scheduleData.room,
      scheduleData.lecture_type
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Update an existing schedule entry
   */
  updateScheduleEntry(scheduleId: number, updates: Partial<Omit<CourseSchedule, 'id' | 'course_id' | 'created_at'>>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.day_of_week !== undefined) {
      fields.push('day_of_week = ?');
      values.push(updates.day_of_week);
    }
    if (updates.start_time !== undefined) {
      fields.push('start_time = ?');
      values.push(updates.start_time);
    }
    if (updates.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(updates.end_time);
    }
    if (updates.room !== undefined) {
      fields.push('room = ?');
      values.push(updates.room);
    }
    if (updates.lecture_type !== undefined) {
      fields.push('lecture_type = ?');
      values.push(updates.lecture_type);
    }

    if (fields.length === 0) return false;

    values.push(scheduleId);
    const result = db.prepare(`
      UPDATE course_schedules
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    return result.changes > 0;
  }

  /**
   * Delete a schedule entry
   */
  deleteScheduleEntry(scheduleId: number): boolean {
    const result = db.prepare('DELETE FROM course_schedules WHERE id = ?').run(scheduleId);
    return result.changes > 0;
  }

  /**
   * Validate that total weekly hours equals course credits
   */
  validateScheduleHours(courseId: number): { valid: boolean; totalHours: number; requiredCredits: number } {
    const course = db.prepare('SELECT credits FROM courses WHERE id = ?').get(courseId) as { credits: number } | undefined;
    
    if (!course) {
      throw new Error('Course not found');
    }

    const schedules = this.getCourseSchedule(courseId);
    
    let totalHours = 0;
    for (const schedule of schedules) {
      const start = this.parseTime(schedule.start_time);
      const end = this.parseTime(schedule.end_time);
      const duration = (end - start) / 60; // Convert minutes to hours
      totalHours += duration;
    }

    return {
      valid: totalHours === course.credits,
      totalHours,
      requiredCredits: course.credits
    };
  }

  /**
   * Check for room conflicts (same room, same time, same day)
   */
  checkRoomConflict(
    day: string, 
    startTime: string, 
    endTime: string, 
    room: string, 
    excludeScheduleId?: number
  ): ScheduleConflict | null {
    let query = `
      SELECT cs.*, c.name as course_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.day_of_week = ? 
        AND cs.room = ?
        AND (
          (cs.start_time < ? AND cs.end_time > ?)
          OR (cs.start_time < ? AND cs.end_time > ?)
          OR (cs.start_time >= ? AND cs.end_time <= ?)
        )
    `;

    const params: (string | number)[] = [day, room, endTime, startTime, endTime, startTime, startTime, endTime];

    if (excludeScheduleId) {
      query += ' AND cs.id != ?';
      params.push(excludeScheduleId);
    }

    const conflict = db.prepare(query).get(...params) as (CourseSchedule & { course_name: string }) | undefined;

    if (conflict) {
      return {
        type: 'room',
        conflicting_schedule: conflict,
        message: `Room ${room} is already booked on ${day} from ${conflict.start_time} to ${conflict.end_time} for ${conflict.course_name}`
      };
    }

    return null;
  }

  /**
   * Check for faculty conflicts (same lecturer, same time, same day)
   */
  checkFacultyConflict(
    courseId: number,
    day: string,
    startTime: string,
    endTime: string,
    excludeScheduleId?: number
  ): ScheduleConflict | null {
    // Get the lecturer assigned to this course
    const lecturer = db.prepare(`
      SELECT lecturer_id FROM course_lecturers WHERE course_id = ?
    `).get(courseId) as { lecturer_id: number } | undefined;

    if (!lecturer) {
      return null; // No lecturer assigned yet
    }

    // Find all courses taught by this lecturer
    const lecturerCourses = db.prepare(`
      SELECT course_id FROM course_lecturers WHERE lecturer_id = ?
    `).all(lecturer.lecturer_id) as { course_id: number }[];

    const courseIds = lecturerCourses.map(c => c.course_id);

    if (courseIds.length === 0) {
      return null;
    }

    // Check for schedule conflicts
    let query = `
      SELECT cs.*, c.name as course_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.course_id IN (${courseIds.map(() => '?').join(',')})
        AND cs.day_of_week = ?
        AND (
          (cs.start_time < ? AND cs.end_time > ?)
          OR (cs.start_time < ? AND cs.end_time > ?)
          OR (cs.start_time >= ? AND cs.end_time <= ?)
        )
        AND cs.course_id != ?
    `;

    const params: (string | number)[] = [...courseIds, day, endTime, startTime, endTime, startTime, startTime, endTime, courseId];

    if (excludeScheduleId) {
      query += ' AND cs.id != ?';
      params.push(excludeScheduleId);
    }

    const conflict = db.prepare(query).get(...params) as (CourseSchedule & { course_name: string }) | undefined;

    if (conflict) {
      return {
        type: 'faculty',
        conflicting_schedule: conflict,
        message: `Lecturer is already scheduled to teach ${conflict.course_name} on ${day} from ${conflict.start_time} to ${conflict.end_time}`
      };
    }

    return null;
  }

  /**
   * Get weekly timetable view for all courses
   */
  getWeeklyTimetable(): { day: string; schedules: (CourseSchedule & { course_name: string; lecturer_name: string })[] }[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timetable: { day: string; schedules: (CourseSchedule & { course_name: string; lecturer_name: string })[] }[] = [];

    for (const day of days) {
      const schedules = db.prepare(`
        SELECT cs.*, c.name as course_name, c.code as course_code, u.name as lecturer_name
        FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        LEFT JOIN course_lecturers cl ON c.id = cl.course_id
        LEFT JOIN users u ON cl.lecturer_id = u.id
        WHERE cs.day_of_week = ?
        ORDER BY cs.start_time
      `).all(day) as (CourseSchedule & { course_name: string; lecturer_name: string })[];

      timetable.push({ day, schedules });
    }

    return timetable;
  }

  /**
   * Get lecturer's personal timetable
   */
  getLecturerTimetable(lecturerId: number): { day: string; schedules: (CourseSchedule & { course_name: string })[] }[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timetable: { day: string; schedules: (CourseSchedule & { course_name: string })[] }[] = [];

    for (const day of days) {
      const schedules = db.prepare(`
        SELECT cs.*, c.name as course_name, c.code as course_code
        FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        JOIN course_lecturers cl ON c.id = cl.course_id
        WHERE cl.lecturer_id = ? AND cs.day_of_week = ?
        ORDER BY cs.start_time
      `).all(lecturerId, day) as (CourseSchedule & { course_name: string })[];

      timetable.push({ day, schedules });
    }

    return timetable;
  }

  /**
   * Helper: Parse time string (HH:MM) to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

const scheduleRepository = new ScheduleRepository();
export default scheduleRepository;
