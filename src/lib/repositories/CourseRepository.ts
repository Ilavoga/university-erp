import db from '../db';

export interface CourseData {
  id: number;
  code: string;
  name: string;
  description: string;
  faculty_id: number;
  faculty_name?: string;
  credits: number;
  semester: string;
  semester_year?: number;
  semester_start_month?: number;
  semester_end_month?: number;
  enrolled_count: number;
}

export interface CreateCourseData {
  code: string;
  name: string;
  description: string;
  faculty_id: number;
  credits: number;
  semester?: string; // For backward compatibility
  semester_year?: number;
  semester_start_month?: number;
  semester_end_month?: number;
}

export interface CourseWithEnrollments extends CourseData {
  enrolledStudents: string[];
}

export class CourseRepository {
  // Get all courses with enrollment count
  getAllCourses(): CourseData[] {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.description,
        c.faculty_id,
        u.name as faculty_name,
        c.credits,
        c.semester,
        c.semester_year,
        c.semester_start_month,
        c.semester_end_month,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.faculty_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      GROUP BY c.id
      ORDER BY c.code
    `);

    return stmt.all() as CourseData[];
  }

  // Get course by ID
  getCourseById(courseId: number): CourseData | undefined {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.description,
        c.faculty_id,
        u.name as faculty_name,
        c.credits,
        c.semester,
        c.semester_year,
        c.semester_start_month,
        c.semester_end_month,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.faculty_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.id = ?
      GROUP BY c.id
    `);

    return stmt.get(courseId) as CourseData | undefined;
  }

  // Get courses by faculty
  getCoursesByFaculty(facultyId: number): CourseData[] {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.description,
        c.faculty_id,
        u.name as faculty_name,
        c.credits,
        c.semester,
        c.semester_year,
        c.semester_start_month,
        c.semester_end_month,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.faculty_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.faculty_id = ?
      GROUP BY c.id
      ORDER BY c.code
    `);

    return stmt.all(facultyId) as CourseData[];
  }

  // Get enrolled students for a course
  getEnrolledStudents(courseId: number): Array<{ id: number; name: string; email: string; student_id: string }> {
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        s.student_id
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN students s ON u.id = s.user_id
      WHERE e.course_id = ? AND e.status = 'active'
      ORDER BY u.name
    `);

    return stmt.all(courseId) as Array<{ id: number; name: string; email: string; student_id: string }>;
  }

  // Create new course
  createCourse(courseData: CreateCourseData): CourseData {
    // Support both old and new semester formats
    if (courseData.semester_year && courseData.semester_start_month && courseData.semester_end_month) {
      // New format with year and month range
      const stmt = db.prepare(`
        INSERT INTO courses (code, name, description, faculty_id, credits, semester, semester_year, semester_start_month, semester_end_month)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Build display semester string for backward compatibility
      const monthRangeMap: { [key: string]: string } = {
        '1-4': 'January-April',
        '5-8': 'May-August',
        '9-12': 'September-December',
      };
      const rangeKey = `${courseData.semester_start_month}-${courseData.semester_end_month}`;
      const displaySemester = `${courseData.semester_year} ${monthRangeMap[rangeKey] || 'Unknown'}`;

      const result = stmt.run(
        courseData.code,
        courseData.name,
        courseData.description,
        courseData.faculty_id,
        courseData.credits,
        displaySemester,
        courseData.semester_year,
        courseData.semester_start_month,
        courseData.semester_end_month
      );

      const course = this.getCourseById(result.lastInsertRowid as number);
      if (!course) {
        throw new Error('Failed to create course');
      }

      return course;
    } else {
      // Old format with semester string
      const stmt = db.prepare(`
        INSERT INTO courses (code, name, description, faculty_id, credits, semester)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        courseData.code,
        courseData.name,
        courseData.description,
        courseData.faculty_id,
        courseData.credits,
        courseData.semester || 'Unknown'
      );

      const course = this.getCourseById(result.lastInsertRowid as number);
      if (!course) {
        throw new Error('Failed to create course');
      }

      return course;
    }
  }

  // Update course
  updateCourse(courseId: number, courseData: Partial<CreateCourseData>): CourseData {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (courseData.code !== undefined) {
      updates.push('code = ?');
      values.push(courseData.code);
    }
    if (courseData.name !== undefined) {
      updates.push('name = ?');
      values.push(courseData.name);
    }
    if (courseData.description !== undefined) {
      updates.push('description = ?');
      values.push(courseData.description);
    }
    if (courseData.faculty_id !== undefined) {
      updates.push('faculty_id = ?');
      values.push(courseData.faculty_id);
    }
    if (courseData.credits !== undefined) {
      updates.push('credits = ?');
      values.push(courseData.credits);
    }
    if (courseData.semester !== undefined) {
      updates.push('semester = ?');
      values.push(courseData.semester);
    }
    if (courseData.semester_year !== undefined) {
      updates.push('semester_year = ?');
      values.push(courseData.semester_year);
    }
    if (courseData.semester_start_month !== undefined) {
      updates.push('semester_start_month = ?');
      values.push(courseData.semester_start_month);
    }
    if (courseData.semester_end_month !== undefined) {
      updates.push('semester_end_month = ?');
      values.push(courseData.semester_end_month);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(courseId);

    const stmt = db.prepare(`
      UPDATE courses 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    const course = this.getCourseById(courseId);
    if (!course) {
      throw new Error('Course not found after update');
    }

    return course;
  }

  // Delete course
  deleteCourse(courseId: number): void {
    const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
    stmt.run(courseId);
  }

  // Enroll student in course
  enrollStudent(studentId: number, courseId: number): void {
    const existing = db.prepare(`
      SELECT id FROM enrollments 
      WHERE student_id = ? AND course_id = ?
    `).get(studentId, courseId);

    if (existing) {
      throw new Error('Student already enrolled in this course');
    }

    const stmt = db.prepare(`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES (?, ?, 'active')
    `);

    stmt.run(studentId, courseId);
  }

  // Drop student from course
  dropStudent(studentId: number, courseId: number): void {
    const stmt = db.prepare(`
      UPDATE enrollments 
      SET status = 'dropped'
      WHERE student_id = ? AND course_id = ? AND status = 'active'
    `);

    const result = stmt.run(studentId, courseId);

    if (result.changes === 0) {
      throw new Error('Enrollment not found or already dropped');
    }
  }

  // Get course statistics
  getCourseStats() {
    const stmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.id) as total_enrollments,
        CAST(COUNT(DISTINCT e.id) AS REAL) / NULLIF(COUNT(DISTINCT c.id), 0) as avg_class_size
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
    `);

    return stmt.get() as {
      total_courses: number;
      total_enrollments: number;
      avg_class_size: number;
    };
  }

  // Get courses by semester
  getCoursesBySemester(semester: string): CourseData[] {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.description,
        c.faculty_id,
        u.name as faculty_name,
        c.credits,
        c.semester,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.faculty_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.semester = ?
      GROUP BY c.id
      ORDER BY c.code
    `);

    return stmt.all(semester) as CourseData[];
  }
}