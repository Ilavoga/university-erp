import db from '../db';

export interface LecturerAssignment {
  id: number;
  course_id: number;
  lecturer_id: number;
  assigned_by: number;
  assigned_at: string;
}

export interface LecturerWithCourses {
  lecturer_id: number;
  lecturer_name: string;
  lecturer_email: string;
  courses: {
    course_id: number;
    course_code: string;
    course_name: string;
    credits: number;
    assigned_at: string;
  }[];
}

export interface CourseWithLecturer {
  course_id: number;
  course_code: string;
  course_name: string;
  lecturer_id: number | null;
  lecturer_name: string | null;
  lecturer_email: string | null;
  assigned_at: string | null;
  assigned_by: number | null;
}

export class LecturerAssignmentRepository {
  /**
   * Assign a lecturer to a course
   */
  assignLecturer(courseId: number, lecturerId: number, assignedBy: number): number {
    // Check if lecturer is already assigned
    const existing = db.prepare(`
      SELECT id FROM course_lecturers 
      WHERE course_id = ? AND lecturer_id = ?
    `).get(courseId, lecturerId) as { id: number } | undefined;

    if (existing) {
      throw new Error('Lecturer is already assigned to this course');
    }

    // Check if lecturer exists and has faculty role
    const lecturer = db.prepare(`
      SELECT id, role FROM users WHERE id = ?
    `).get(lecturerId) as { id: number; role: string } | undefined;

    if (!lecturer) {
      throw new Error('Lecturer not found');
    }

    if (lecturer.role !== 'faculty') {
      throw new Error('User is not a faculty member');
    }

    const result = db.prepare(`
      INSERT INTO course_lecturers (course_id, lecturer_id, assigned_by)
      VALUES (?, ?, ?)
    `).run(courseId, lecturerId, assignedBy);

    return result.lastInsertRowid as number;
  }

  /**
   * Remove a lecturer assignment from a course
   */
  removeLecturerAssignment(courseId: number, lecturerId: number): boolean {
    const result = db.prepare(`
      DELETE FROM course_lecturers
      WHERE course_id = ? AND lecturer_id = ?
    `).run(courseId, lecturerId);

    return result.changes > 0;
  }

  /**
   * Get all lecturers assigned to a course
   */
  getCourseLecturers(courseId: number): (LecturerAssignment & { lecturer_name: string; lecturer_email: string; assigned_by_name: string })[] {
    const lecturers = db.prepare(`
      SELECT 
        cl.*,
        u.name as lecturer_name,
        u.email as lecturer_email,
        assigner.name as assigned_by_name
      FROM course_lecturers cl
      JOIN users u ON cl.lecturer_id = u.id
      LEFT JOIN users assigner ON cl.assigned_by = assigner.id
      WHERE cl.course_id = ?
      ORDER BY cl.assigned_at DESC
    `).all(courseId) as (LecturerAssignment & { lecturer_name: string; lecturer_email: string; assigned_by_name: string })[];

    return lecturers;
  }

  /**
   * Get all courses assigned to a lecturer
   */
  getLecturerCourses(lecturerId: number): CourseWithLecturer[] {
    const courses = db.prepare(`
      SELECT 
        c.id as course_id,
        c.code as course_code,
        c.name as course_name,
        c.credits,
        c.semester,
        cl.assigned_at,
        cl.assigned_by
      FROM course_lecturers cl
      JOIN courses c ON cl.course_id = c.id
      WHERE cl.lecturer_id = ?
      ORDER BY c.semester DESC, c.code
    `).all(lecturerId) as { course_id: number; course_code: string; course_name: string; credits: number; semester: string; assigned_at: string; assigned_by: number }[];

    return courses as unknown as CourseWithLecturer[];
  }

  /**
   * Get all courses with their assigned lecturers
   */
  getAllCoursesWithLecturers(): CourseWithLecturer[] {
    const courses = db.prepare(`
      SELECT 
        c.id as course_id,
        c.code as course_code,
        c.name as course_name,
        cl.lecturer_id,
        u.name as lecturer_name,
        u.email as lecturer_email,
        cl.assigned_at,
        cl.assigned_by
      FROM courses c
      LEFT JOIN course_lecturers cl ON c.id = cl.course_id
      LEFT JOIN users u ON cl.lecturer_id = u.id
      ORDER BY c.code
    `).all() as CourseWithLecturer[];

    return courses;
  }

  /**
   * Get all lecturers with their assigned courses
   */
  getAllLecturersWithCourses(): LecturerWithCourses[] {
    // Get all faculty members
    const lecturers = db.prepare(`
      SELECT id as lecturer_id, name as lecturer_name, email as lecturer_email
      FROM users
      WHERE role = 'faculty'
      ORDER BY name
    `).all() as { lecturer_id: number; lecturer_name: string; lecturer_email: string }[];

    // Get courses for each lecturer
    const result: LecturerWithCourses[] = [];
    for (const lecturer of lecturers) {
      const courses = db.prepare(`
        SELECT 
          c.id as course_id,
          c.code as course_code,
          c.name as course_name,
          c.credits,
          cl.assigned_at
        FROM course_lecturers cl
        JOIN courses c ON cl.course_id = c.id
        WHERE cl.lecturer_id = ?
        ORDER BY c.code
      `).all(lecturer.lecturer_id) as { course_id: number; course_code: string; course_name: string; credits: number; assigned_at: string }[];

      result.push({
        ...lecturer,
        courses
      });
    }

    return result;
  }

  /**
   * Check if a lecturer can manage a course (is assigned to it)
   */
  canManageCourse(lecturerId: number, courseId: number): boolean {
    const assignment = db.prepare(`
      SELECT id FROM course_lecturers
      WHERE lecturer_id = ? AND course_id = ?
    `).get(lecturerId, courseId) as { id: number } | undefined;

    return assignment !== undefined;
  }

  /**
   * Get lecturer workload (total credits assigned)
   */
  getLecturerWorkload(lecturerId: number): { total_credits: number; course_count: number } {
    const result = db.prepare(`
      SELECT 
        COALESCE(SUM(c.credits), 0) as total_credits,
        COUNT(DISTINCT c.id) as course_count
      FROM course_lecturers cl
      JOIN courses c ON cl.course_id = c.id
      WHERE cl.lecturer_id = ?
    `).get(lecturerId) as { total_credits: number; course_count: number };

    return result;
  }

  /**
   * Get workload for all lecturers
   */
  getAllLecturerWorkloads(): { 
    lecturer_id: number; 
    lecturer_name: string; 
    total_credits: number; 
    course_count: number 
  }[] {
    const workloads = db.prepare(`
      SELECT 
        u.id as lecturer_id,
        u.name as lecturer_name,
        COALESCE(SUM(c.credits), 0) as total_credits,
        COUNT(DISTINCT c.id) as course_count
      FROM users u
      LEFT JOIN course_lecturers cl ON u.id = cl.lecturer_id
      LEFT JOIN courses c ON cl.course_id = c.id
      WHERE u.role = 'faculty'
      GROUP BY u.id, u.name
      ORDER BY total_credits DESC, u.name
    `).all() as { lecturer_id: number; lecturer_name: string; total_credits: number; course_count: number }[];

    return workloads;
  }

  /**
   * Reassign a course from one lecturer to another
   */
  reassignCourse(courseId: number, oldLecturerId: number, newLecturerId: number, assignedBy: number): boolean {
    const transaction = db.transaction(() => {
      // Remove old assignment
      this.removeLecturerAssignment(courseId, oldLecturerId);
      
      // Add new assignment
      this.assignLecturer(courseId, newLecturerId, assignedBy);
    });

    try {
      transaction();
      return true;
    } catch (error) {
      console.error('Error reassigning course:', error);
      return false;
    }
  }

  /**
   * Get unassigned courses (courses without lecturers)
   */
  getUnassignedCourses(): { course_id: number; course_code: string; course_name: string; credits: number; semester: string }[] {
    const courses = db.prepare(`
      SELECT 
        c.id as course_id,
        c.code as course_code,
        c.name as course_name,
        c.credits,
        c.semester
      FROM courses c
      LEFT JOIN course_lecturers cl ON c.id = cl.course_id
      WHERE cl.id IS NULL
      ORDER BY c.code
    `).all() as { course_id: number; course_code: string; course_name: string; credits: number; semester: string }[];

    return courses;
  }
}

const lecturerAssignmentRepository = new LecturerAssignmentRepository();
export default lecturerAssignmentRepository;
