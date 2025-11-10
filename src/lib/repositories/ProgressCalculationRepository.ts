import db from '../db';
import attendanceRepository from './AttendanceRepository';

export interface ProgressComponents {
  module_progress: number;
  assignment_progress: number;
  attendance_progress: number;
  quiz_progress: number;
}

export interface OverallProgress extends ProgressComponents {
  overall_progress: number;
  student_id: number;
  course_id: number;
  last_updated: string;
}

export interface DetailedProgress {
  student_id: number;
  course_id: number;
  course_name: string;
  course_code: string;
  components: ProgressComponents;
  overall_progress: number;
  total_modules: number;
  completed_modules: number;
  total_assignments: number;
  submitted_assignments: number;
  average_grade: number;
  quiz_average: number;
  attendance_stats: {
    total_lectures: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    excused_count: number;
    attendance_percentage: number;
  };
}

export class ProgressCalculationRepository {
  /**
   * Calculate overall progress using the formula:
   * Overall = (Module × 0.25) + (Assignment × 0.40) + (Attendance × 0.20) + (Quiz × 0.15)
   */
  calculateProgress(studentId: number, courseId: number): OverallProgress {
    const components = this.getProgressComponents(studentId, courseId);

    const overall_progress = 
      (components.module_progress * 0.25) +
      (components.assignment_progress * 0.40) +
      (components.attendance_progress * 0.20) +
      (components.quiz_progress * 0.15);

    return {
      student_id: studentId,
      course_id: courseId,
      ...components,
      overall_progress: Math.round(overall_progress * 100) / 100,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Get individual progress components
   */
  private getProgressComponents(studentId: number, courseId: number): ProgressComponents {
    // Module Progress: completed_modules / total_modules × 100
    const moduleStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT cm.id) as total_modules,
        COUNT(DISTINCT mc.id) as completed_modules
      FROM course_modules cm
      LEFT JOIN module_completions mc ON cm.id = mc.module_id AND mc.student_id = ?
      WHERE cm.course_id = ?
    `).get(studentId, courseId) as { total_modules: number; completed_modules: number };

    const module_progress = moduleStats.total_modules > 0
      ? (moduleStats.completed_modules / moduleStats.total_modules) * 100
      : 0;

    // Assignment Progress: submitted_assignments / total_assignments × 100
    // Only count assignments that contribute to progress
    const assignmentStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT s.id) as submitted_assignments
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ? AND s.contributes_to_progress = 1
      WHERE a.course_id = ? AND a.assignment_type != 'quiz'
    `).get(studentId, courseId) as { total_assignments: number; submitted_assignments: number };

    const assignment_progress = assignmentStats.total_assignments > 0
      ? (assignmentStats.submitted_assignments / assignmentStats.total_assignments) * 100
      : 0;

    // Attendance Progress: (present + late×0.5) / (total - excused) × 100
    const attendanceStats = attendanceRepository.getStudentAttendance(studentId, courseId);
    const attendance_progress = attendanceStats.attendance_percentage;

    // Quiz Progress: AVG(quiz_scores)
    const quizStats = db.prepare(`
      SELECT 
        AVG(s.submission_percentage) as quiz_average
      FROM assignments a
      JOIN submissions s ON a.id = s.assignment_id
      WHERE a.course_id = ? 
        AND a.assignment_type = 'quiz'
        AND s.student_id = ?
        AND s.score IS NOT NULL
    `).get(courseId, studentId) as { quiz_average: number | null };

    const quiz_progress = quizStats.quiz_average ?? 0;

    return {
      module_progress: Math.round(module_progress * 100) / 100,
      assignment_progress: Math.round(assignment_progress * 100) / 100,
      attendance_progress: Math.round(attendance_progress * 100) / 100,
      quiz_progress: Math.round(quiz_progress * 100) / 100
    };
  }

  /**
   * Get detailed progress information
   */
  getDetailedProgress(studentId: number, courseId: number): DetailedProgress {
    const course = db.prepare(`
      SELECT id, code, name FROM courses WHERE id = ?
    `).get(courseId) as { id: number; code: string; name: string } | undefined;

    if (!course) {
      throw new Error('Course not found');
    }

    const progress = this.calculateProgress(studentId, courseId);
    
    // Get module stats
    const moduleStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT cm.id) as total_modules,
        COUNT(DISTINCT mc.id) as completed_modules
      FROM course_modules cm
      LEFT JOIN module_completions mc ON cm.id = mc.module_id AND mc.student_id = ?
      WHERE cm.course_id = ?
    `).get(studentId, courseId) as { total_modules: number; completed_modules: number };

    // Get assignment stats (excluding quizzes)
    const assignmentStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT s.id) as submitted_assignments,
        AVG(s.submission_percentage) as average_grade
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE a.course_id = ? AND a.assignment_type != 'quiz'
    `).get(studentId, courseId) as { total_assignments: number; submitted_assignments: number; average_grade: number | null };

    // Get quiz average
    const quizStats = db.prepare(`
      SELECT AVG(s.submission_percentage) as quiz_average
      FROM assignments a
      JOIN submissions s ON a.id = s.assignment_id
      WHERE a.course_id = ? 
        AND a.assignment_type = 'quiz'
        AND s.student_id = ?
        AND s.score IS NOT NULL
    `).get(courseId, studentId) as { quiz_average: number | null };

    // Get attendance stats
    const attendanceStats = attendanceRepository.getStudentAttendance(studentId, courseId);

    return {
      student_id: studentId,
      course_id: courseId,
      course_name: course.name,
      course_code: course.code,
      components: {
        module_progress: progress.module_progress,
        assignment_progress: progress.assignment_progress,
        attendance_progress: progress.attendance_progress,
        quiz_progress: progress.quiz_progress
      },
      overall_progress: progress.overall_progress,
      total_modules: moduleStats.total_modules,
      completed_modules: moduleStats.completed_modules,
      total_assignments: assignmentStats.total_assignments,
      submitted_assignments: assignmentStats.submitted_assignments,
      average_grade: Math.round((assignmentStats.average_grade ?? 0) * 100) / 100,
      quiz_average: Math.round((quizStats.quiz_average ?? 0) * 100) / 100,
      attendance_stats: {
        total_lectures: attendanceStats.total_lectures,
        present_count: attendanceStats.present_count,
        late_count: attendanceStats.late_count,
        absent_count: attendanceStats.absent_count,
        excused_count: attendanceStats.excused_count,
        attendance_percentage: attendanceStats.attendance_percentage
      }
    };
  }

  /**
   * Get progress for all enrolled courses
   */
  getAllCourseProgress(studentId: number): DetailedProgress[] {
    const enrollments = db.prepare(`
      SELECT course_id FROM enrollments
      WHERE student_id = ? AND status = 'active'
    `).all(studentId) as { course_id: number }[];

    const progressList: DetailedProgress[] = [];
    for (const enrollment of enrollments) {
      const progress = this.getDetailedProgress(studentId, enrollment.course_id);
      progressList.push(progress);
    }

    return progressList.sort((a, b) => b.overall_progress - a.overall_progress);
  }

  /**
   * Update progress when a submission is made
   * This is called automatically by the submissions API
   */
  updateProgressOnSubmission(studentId: number, assignmentId: number): OverallProgress {
    // Get course_id from assignment
    const assignment = db.prepare(`
      SELECT course_id FROM assignments WHERE id = ?
    `).get(assignmentId) as { course_id: number } | undefined;

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Recalculate progress
    return this.calculateProgress(studentId, assignment.course_id);
  }

  /**
   * Update progress when attendance is marked
   * This is called automatically when attendance is marked
   */
  updateProgressOnAttendance(studentId: number, lectureId: number): OverallProgress {
    // Get course_id from lecture
    const lecture = db.prepare(`
      SELECT course_id FROM lectures WHERE id = ?
    `).get(lectureId) as { course_id: number } | undefined;

    if (!lecture) {
      throw new Error('Lecture not found');
    }

    // Recalculate progress
    return this.calculateProgress(studentId, lecture.course_id);
  }

  /**
   * Update progress when a module is completed
   * This is called automatically when a module is marked complete
   */
  updateProgressOnModuleCompletion(studentId: number, moduleId: number): OverallProgress {
    // Get course_id from module
    const courseModule = db.prepare(`
      SELECT course_id FROM course_modules WHERE id = ?
    `).get(moduleId) as { course_id: number } | undefined;

    if (!courseModule) {
      throw new Error('Module not found');
    }

    // Recalculate progress
    return this.calculateProgress(studentId, courseModule.course_id);
  }

  /**
   * Get class progress summary (for lecturers)
   */
  getClassProgressSummary(courseId: number): {
    course_id: number;
    total_students: number;
    average_overall_progress: number;
    average_module_progress: number;
    average_assignment_progress: number;
    average_attendance: number;
    average_quiz_score: number;
    students_at_risk: number; // progress < 50%
  } {
    // Get all enrolled students
    const students = db.prepare(`
      SELECT student_id FROM enrollments
      WHERE course_id = ? AND status = 'active'
    `).all(courseId) as { student_id: number }[];

    if (students.length === 0) {
      return {
        course_id: courseId,
        total_students: 0,
        average_overall_progress: 0,
        average_module_progress: 0,
        average_assignment_progress: 0,
        average_attendance: 0,
        average_quiz_score: 0,
        students_at_risk: 0
      };
    }

    let totalOverall = 0;
    let totalModule = 0;
    let totalAssignment = 0;
    let totalAttendance = 0;
    let totalQuiz = 0;
    let atRisk = 0;

    for (const student of students) {
      const progress = this.calculateProgress(student.student_id, courseId);
      totalOverall += progress.overall_progress;
      totalModule += progress.module_progress;
      totalAssignment += progress.assignment_progress;
      totalAttendance += progress.attendance_progress;
      totalQuiz += progress.quiz_progress;

      if (progress.overall_progress < 50) {
        atRisk++;
      }
    }

    const count = students.length;

    return {
      course_id: courseId,
      total_students: count,
      average_overall_progress: Math.round((totalOverall / count) * 100) / 100,
      average_module_progress: Math.round((totalModule / count) * 100) / 100,
      average_assignment_progress: Math.round((totalAssignment / count) * 100) / 100,
      average_attendance: Math.round((totalAttendance / count) * 100) / 100,
      average_quiz_score: Math.round((totalQuiz / count) * 100) / 100,
      students_at_risk: atRisk
    };
  }

  /**
   * Get students at risk (progress < threshold)
   */
  getStudentsAtRisk(courseId: number, threshold = 50): { 
    student_id: number; 
    student_name: string; 
    overall_progress: number;
    weak_areas: string[];
  }[] {
    const students = db.prepare(`
      SELECT e.student_id, u.name as student_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ? AND e.status = 'active'
    `).all(courseId) as { student_id: number; student_name: string }[];

    const atRisk: { student_id: number; student_name: string; overall_progress: number; weak_areas: string[] }[] = [];

    for (const student of students) {
      const progress = this.calculateProgress(student.student_id, courseId);
      
      if (progress.overall_progress < threshold) {
        const weakAreas: string[] = [];
        if (progress.module_progress < 50) weakAreas.push('Modules');
        if (progress.assignment_progress < 50) weakAreas.push('Assignments');
        if (progress.attendance_progress < 75) weakAreas.push('Attendance');
        if (progress.quiz_progress < 60) weakAreas.push('Quizzes');

        atRisk.push({
          student_id: student.student_id,
          student_name: student.student_name,
          overall_progress: progress.overall_progress,
          weak_areas: weakAreas
        });
      }
    }

    return atRisk.sort((a, b) => a.overall_progress - b.overall_progress);
  }
}

const progressCalculationRepository = new ProgressCalculationRepository();
export default progressCalculationRepository;
