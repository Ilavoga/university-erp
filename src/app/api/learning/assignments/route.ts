import { NextRequest, NextResponse } from 'next/server';
import { LearningRepository } from '@/lib/repositories/LearningRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const learningRepo = new LearningRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const assignments = learningRepo.getStudentAssignments(
      parseInt(studentId),
      limit ? parseInt(limit) : 10
    );
    return NextResponse.json(assignments);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, assignmentId } = await request.json();

    if (!studentId || !assignmentId) {
      return NextResponse.json(
        { error: 'Student ID and Assignment ID are required' },
        { status: 400 }
      );
    }

    learningRepo.submitAssignment(parseInt(studentId), parseInt(assignmentId));
    return NextResponse.json({ message: 'Assignment submitted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}