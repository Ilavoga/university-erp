import db from '../db';

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  sequence: number;
  description: string;
  created_at: string;
  completed: boolean;
  completed_at: string | null;
  grade: number | null;
}

export interface AssignmentWithSubmission {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  created_at: string;
  submission_id: number | null;
  submission_date: string | null;
  submission_status: 'submitted' | 'graded' | 'late' | 'pending' | null;
  score: number | null;
  feedback: string | null;
}

export interface CourseProgressSummary {
  course_id: number;
  course_code: string;
  course_name: string;
  total_modules: number;
  completed_modules: number;
  module_completion_percentage: number;
  total_assignments: number;
  submitted_assignments: number;
  graded_assignments: number;
  assignment_completion_percentage: number;
  average_grade: number | null;
  predicted_final_grade: number | null;
  predicted_completion_date: string | null;
}

export class ProgressRepository {
  // Get modules for a course with student completion status
  getCourseModules(courseId: number, studentId: number): CourseModule[] {
    const stmt = db.prepare(`
      SELECT 
        cm.id,
        cm.course_id,
        cm.title,
        cm.sequence,
        cm.description,
        cm.created_at,
        CASE WHEN mc.id IS NOT NULL THEN 1 ELSE 0 END as completed,
        mc.completed_at,
        mc.grade
      FROM course_modules cm
      LEFT JOIN module_completions mc ON cm.id = mc.module_id AND mc.student_id = ?
      WHERE cm.course_id = ?
      ORDER BY cm.sequence ASC
    `);

    return stmt.all(studentId, courseId) as CourseModule[];
  }

  // Get assignments for a course with student submission status
  getAssignmentsByCourse(courseId: number, studentId: number): AssignmentWithSubmission[] {
    const stmt = db.prepare(`
      SELECT 
        a.id,
        a.course_id,
        a.title,
        a.description,
        a.due_date,
        a.total_points,
        a.created_at,
        s.id as submission_id,
        s.submission_date,
        s.status as submission_status,
        s.score,
        s.feedback
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE a.course_id = ?
      ORDER BY a.due_date ASC
    `);

    return stmt.all(studentId, courseId) as AssignmentWithSubmission[];
  }

  // Get comprehensive progress summary for a course
  getCourseProgress(courseId: number, studentId: number): CourseProgressSummary | null {
    // Get course info
    const courseStmt = db.prepare(`
      SELECT id, code, name
      FROM courses
      WHERE id = ?
    `);
    const course = courseStmt.get(courseId) as { id: number; code: string; name: string } | undefined;
    
    if (!course) return null;

    // Module statistics
    const moduleStatsStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_modules,
        COUNT(mc.id) as completed_modules,
        ROUND(COUNT(mc.id) * 100.0 / NULLIF(COUNT(*), 0), 2) as module_completion_percentage,
        AVG(mc.grade) as avg_module_grade
      FROM course_modules cm
      LEFT JOIN module_completions mc ON cm.id = mc.module_id AND mc.student_id = ?
      WHERE cm.course_id = ?
    `);
    const moduleStats = moduleStatsStmt.get(studentId, courseId) as {
      total_modules: number;
      completed_modules: number;
      module_completion_percentage: number;
      avg_module_grade: number | null;
    };

    // Assignment statistics
    const assignmentStatsStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_assignments,
        COUNT(s.id) as submitted_assignments,
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_assignments,
        ROUND(COUNT(s.id) * 100.0 / NULLIF(COUNT(*), 0), 2) as assignment_completion_percentage,
        AVG(CASE WHEN s.score IS NOT NULL THEN s.score * 100.0 / a.total_points END) as avg_assignment_grade
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE a.course_id = ?
    `);
    const assignmentStats = assignmentStatsStmt.get(studentId, courseId) as {
      total_assignments: number;
      submitted_assignments: number;
      graded_assignments: number;
      assignment_completion_percentage: number;
      avg_assignment_grade: number | null;
    };

    // Calculate average grade (weighted: 40% modules, 60% assignments)
    let averageGrade: number | null = null;
    if (moduleStats.avg_module_grade !== null || assignmentStats.avg_assignment_grade !== null) {
      const moduleWeight = 0.4;
      const assignmentWeight = 0.6;
      const moduleGrade = moduleStats.avg_module_grade || 0;
      const assignmentGrade = assignmentStats.avg_assignment_grade || 0;
      averageGrade = Math.round(moduleGrade * moduleWeight + assignmentGrade * assignmentWeight);
    }

    // Predict final grade based on current performance
    let predictedFinalGrade: number | null = null;
    if (averageGrade !== null) {
      // Simple prediction: current average with slight regression to mean (75%)
      predictedFinalGrade = Math.round(averageGrade * 0.9 + 75 * 0.1);
    }

    // Predict completion date based on current pace
    let predictedCompletionDate: string | null = null;
    if (moduleStats.completed_modules > 0 && moduleStats.total_modules > moduleStats.completed_modules) {
      const remainingModules = moduleStats.total_modules - moduleStats.completed_modules;
      // Assume 1 week per module
      const weeksToComplete = remainingModules * 1;
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + weeksToComplete * 7);
      predictedCompletionDate = completionDate.toISOString().split('T')[0];
    }

    return {
      course_id: course.id,
      course_code: course.code,
      course_name: course.name,
      total_modules: moduleStats.total_modules,
      completed_modules: moduleStats.completed_modules,
      module_completion_percentage: moduleStats.module_completion_percentage || 0,
      total_assignments: assignmentStats.total_assignments,
      submitted_assignments: assignmentStats.submitted_assignments,
      graded_assignments: assignmentStats.graded_assignments,
      assignment_completion_percentage: assignmentStats.assignment_completion_percentage || 0,
      average_grade: averageGrade,
      predicted_final_grade: predictedFinalGrade,
      predicted_completion_date: predictedCompletionDate,
    };
  }

  // Complete a module
  completeModule(moduleId: number, studentId: number, grade?: number): void {
    const stmt = db.prepare(`
      INSERT INTO module_completions (module_id, student_id, grade)
      VALUES (?, ?, ?)
      ON CONFLICT(module_id, student_id) 
      DO UPDATE SET 
        completed_at = CURRENT_TIMESTAMP,
        grade = COALESCE(?, grade)
    `);

    stmt.run(moduleId, studentId, grade || null, grade || null);
  }

  // Get all course progress for a student
  getAllCourseProgress(studentId: number): CourseProgressSummary[] {
    // Get all enrolled courses
    const coursesStmt = db.prepare(`
      SELECT DISTINCT c.id
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ? AND e.status = 'active'
    `);

    const courses = coursesStmt.all(studentId) as { id: number }[];
    
    return courses
      .map(c => this.getCourseProgress(c.id, studentId))
      .filter((p): p is CourseProgressSummary => p !== null);
  }
}
