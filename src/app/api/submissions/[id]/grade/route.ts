import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import progressCalculationRepository from '@/lib/repositories/ProgressCalculationRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = parseInt(params.id);

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { score, feedback } = body;

    if (score === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: score' },
        { status: 400 }
      );
    }

    // Get submission and assignment details
    const submission = db.prepare(`
      SELECT s.*, a.total_points, a.id as assignment_id
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.id = ?
    `).get(submissionId) as { student_id: number; assignment_id: number; total_points: number } | undefined;

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Calculate percentage
    const percentage = (score / submission.total_points) * 100;

    // Update submission
    const result = db.prepare(`
      UPDATE submissions
      SET score = ?, feedback = ?, status = 'graded', submission_percentage = ?
      WHERE id = ?
    `).run(score, feedback || null, percentage, submissionId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    // Update progress
    const progress = progressCalculationRepository.updateProgressOnSubmission(
      submission.student_id,
      submission.assignment_id
    );

    return NextResponse.json({
      id: submissionId,
      score,
      percentage,
      feedback,
      status: 'graded',
      updated_progress: {
        overall_progress: progress.overall_progress,
        assignment_progress: progress.assignment_progress,
        quiz_progress: progress.quiz_progress
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to grade submission';
    console.error('Failed to grade submission:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
