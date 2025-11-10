import { NextRequest, NextResponse } from 'next/server';
import { ProgressRepository } from '@/lib/repositories/ProgressRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const progressRepo = new ProgressRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const courseId = parseInt(id);
    
    // Get comprehensive progress summary
    const summary = progressRepo.getCourseProgress(courseId, parseInt(studentId));
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get detailed modules
    const modules = progressRepo.getCourseModules(courseId, parseInt(studentId));
    
    // Get assignments with submission status
    const assignments = progressRepo.getAssignmentsByCourse(courseId, parseInt(studentId));

    const response = {
      ...summary,
      modules,
      assignments,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Failed to fetch course progress:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch course progress' },
      { status: 500 }
    );
  }
}
