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

    const resources = learningRepo.getStudentResources(
      parseInt(studentId),
      limit ? parseInt(limit) : 10
    );
    return NextResponse.json(resources);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { studentId, resourceId, progress } = await request.json();

    if (!studentId || !resourceId || progress === undefined) {
      return NextResponse.json(
        { error: 'Student ID, Resource ID, and Progress are required' },
        { status: 400 }
      );
    }

    learningRepo.updateResourceProgress(
      parseInt(studentId),
      parseInt(resourceId),
      parseInt(progress)
    );
    return NextResponse.json({ message: 'Progress updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}