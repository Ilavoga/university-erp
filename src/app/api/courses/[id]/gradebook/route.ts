import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import progressCalculationRepository from '@/lib/repositories/ProgressCalculationRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Get all enrolled students
    const students = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        s.student_id as student_number
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN students s ON u.id = s.user_id
      WHERE e.course_id = ? AND e.status = 'active'
      ORDER BY s.student_id
    `).all(courseId) as { id: number; name: string; email: string; student_number: string }[];

    // Get progress for each student
    const gradebook = [];
    for (const student of students) {
      const progress = progressCalculationRepository.getDetailedProgress(student.id, courseId);
      
      // Get assignment grades
      const assignments = db.prepare(`
        SELECT 
          a.id,
          a.title,
          a.assignment_type,
          a.total_points,
          s.score,
          s.submission_percentage,
          s.status
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
        WHERE a.course_id = ?
        ORDER BY a.due_date
      `).all(student.id, courseId) as {
        id: number;
        title: string;
        assignment_type: string;
        total_points: number;
        score: number | null;
        submission_percentage: number | null;
        status: string | null;
      }[];

      gradebook.push({
        student_id: student.id,
        student_number: student.student_number,
        student_name: student.name,
        email: student.email,
        overall_progress: progress.overall_progress,
        components: progress.components,
        average_grade: progress.average_grade,
        quiz_average: progress.quiz_average,
        attendance_percentage: progress.attendance_stats.attendance_percentage,
        assignments
      });
    }

    // Get class summary
    const summary = progressCalculationRepository.getClassProgressSummary(courseId);

    return NextResponse.json({
      course_id: courseId,
      gradebook,
      summary
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch gradebook';
    console.error('Failed to fetch gradebook:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
