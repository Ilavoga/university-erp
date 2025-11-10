import db from '../db';

export interface StudentCourse {
  id: number;
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: string;
  progress: number;
  nextClass: string;
  assignmentsDue: number;
}

export interface Assignment {
  id: number;
  course_id: number;
  course_name: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  submission_status?: 'submitted' | 'graded' | 'late' | 'pending';
  score?: number;
}

export interface LearningResource {
  id: number;
  course_id: number;
  course_name: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'link' | 'quiz';
  url: string;
  progress: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  type: string;
  earned_at: string;
}

export interface LearningRecommendation {
  type: 'course' | 'resource' | 'tutor';
  title: string;
  description: string;
  relevance: number;
  course_id?: number;
}

export class LearningRepository {
  // Get student's enrolled courses with progress
  getStudentCourses(studentId: number): StudentCourse[] {
    const stmt = db.prepare(`
      SELECT 
        c.id,
        c.code,
        c.name,
        c.description,
        c.credits,
        c.semester,
        COALESCE(
          (SELECT COUNT(*) * 100.0 / NULLIF(
            (SELECT COUNT(*) FROM assignments WHERE course_id = c.id), 0
          )
          FROM submissions s
          JOIN assignments a ON s.assignment_id = a.id
          WHERE s.student_id = ? AND a.course_id = c.id
          ), 0
        ) as progress,
        (SELECT COUNT(*) 
         FROM assignments a
         WHERE a.course_id = c.id 
         AND a.due_date >= date('now')
         AND NOT EXISTS (
           SELECT 1 FROM submissions s 
           WHERE s.assignment_id = a.id AND s.student_id = ?
         )
        ) as assignmentsDue
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ? AND e.status = 'active'
      ORDER BY c.code
    `);

    const courses = stmt.all(studentId, studentId, studentId) as any[];
    
    return courses.map(course => ({
      ...course,
      nextClass: this.getNextClass(course.id),
    }));
  }

  // Get next class time (mock implementation - would need actual schedule table)
  private getNextClass(courseId: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'];
    
    const dayIndex = courseId % days.length;
    const timeIndex = courseId % times.length;
    
    return `${days[dayIndex]} ${times[timeIndex]}`;
  }

  // Get student's assignments
  getStudentAssignments(studentId: number, limit: number = 10): Assignment[] {
    const stmt = db.prepare(`
      SELECT 
        a.id,
        a.course_id,
        c.name as course_name,
        a.title,
        a.description,
        a.due_date,
        a.total_points,
        COALESCE(s.status, 'pending') as submission_status,
        s.score
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE e.student_id = ? AND e.status = 'active'
      ORDER BY 
        CASE 
          WHEN s.status IS NULL THEN 0
          ELSE 1
        END,
        a.due_date ASC
      LIMIT ?
    `);

    return stmt.all(studentId, studentId, limit) as Assignment[];
  }

  // Get learning resources for student
  getStudentResources(studentId: number, limit: number = 10): LearningResource[] {
    const stmt = db.prepare(`
      SELECT 
        lr.id,
        lr.course_id,
        c.name as course_name,
        lr.title,
        lr.description,
        lr.type,
        lr.url,
        COALESCE(rv.progress, 0) as progress
      FROM learning_resources lr
      JOIN courses c ON lr.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN resource_views rv ON lr.id = rv.resource_id AND rv.student_id = ?
      WHERE e.student_id = ? AND e.status = 'active'
      ORDER BY lr.created_at DESC
      LIMIT ?
    `);

    return stmt.all(studentId, studentId, limit) as LearningResource[];
  }

  // Get student achievements
  getStudentAchievements(studentId: number, limit: number = 10): Achievement[] {
    const stmt = db.prepare(`
      SELECT id, title, description, type, earned_at
      FROM achievements
      WHERE student_id = ?
      ORDER BY earned_at DESC
      LIMIT ?
    `);

    return stmt.all(studentId, limit) as Achievement[];
  }

  // Get AI recommendations based on student performance
  getRecommendations(studentId: number): LearningRecommendation[] {
    // Get student's enrolled courses
    const enrolledCourses = db.prepare(`
      SELECT c.id, c.code, c.name, c.description
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ? AND e.status = 'active'
    `).all(studentId) as any[];

    // Get student's performance
    const avgScore = db.prepare(`
      SELECT AVG(score) as avg_score
      FROM submissions
      WHERE student_id = ? AND score IS NOT NULL
    `).get(studentId) as { avg_score: number | null };

    const recommendations: LearningRecommendation[] = [];

    // Course recommendations based on enrolled courses
    const recommendedCourses = db.prepare(`
      SELECT id, code, name, description
      FROM courses
      WHERE id NOT IN (
        SELECT course_id FROM enrollments WHERE student_id = ?
      )
      LIMIT 3
    `).all(studentId) as any[];

    recommendedCourses.forEach((course, index) => {
      recommendations.push({
        type: 'course',
        title: course.name,
        description: `Based on your current courses, you might enjoy ${course.code}`,
        relevance: 92 - (index * 4),
        course_id: course.id,
      });
    });

    // Resource recommendations
    if (avgScore && avgScore.avg_score < 80) {
      recommendations.push({
        type: 'resource',
        title: 'Study Skills Workshop',
        description: 'Improve your learning techniques and time management',
        relevance: 88,
      });
    }

    // Tutor recommendations
    if (enrolledCourses.length > 0) {
      recommendations.push({
        type: 'tutor',
        title: `${enrolledCourses[0].name} Study Group`,
        description: 'Join peers studying this course',
        relevance: 85,
      });
    }

    return recommendations;
  }

  // Update resource view progress
  updateResourceProgress(studentId: number, resourceId: number, progress: number): void {
    const existing = db.prepare(`
      SELECT id FROM resource_views 
      WHERE resource_id = ? AND student_id = ?
    `).get(resourceId, studentId);

    if (existing) {
      db.prepare(`
        UPDATE resource_views 
        SET progress = ?, viewed_at = CURRENT_TIMESTAMP
        WHERE resource_id = ? AND student_id = ?
      `).run(progress, resourceId, studentId);
    } else {
      db.prepare(`
        INSERT INTO resource_views (resource_id, student_id, progress)
        VALUES (?, ?, ?)
      `).run(resourceId, studentId, progress);
    }
  }

  // Submit assignment
  submitAssignment(studentId: number, assignmentId: number): void {
    const existing = db.prepare(`
      SELECT id FROM submissions 
      WHERE assignment_id = ? AND student_id = ?
    `).get(assignmentId, studentId);

    if (existing) {
      throw new Error('Assignment already submitted');
    }

    // Check if late
    const assignment = db.prepare(`
      SELECT due_date FROM assignments WHERE id = ?
    `).get(assignmentId) as { due_date: string };

    const isLate = new Date() > new Date(assignment.due_date);

    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, status)
      VALUES (?, ?, ?)
    `).run(assignmentId, studentId, isLate ? 'late' : 'submitted');
  }
}