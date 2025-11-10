import { NextRequest, NextResponse } from 'next/server';
import { CourseRepository } from '@/lib/repositories/CourseRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const courseRepo = new CourseRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    courseRepo.enrollStudent(parseInt(studentId), courseId);

    return NextResponse.json({ 
      message: 'Successfully enrolled in course',
      courseId,
      studentId 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    courseRepo.dropStudent(parseInt(studentId), courseId);

    return NextResponse.json({ 
      message: 'Successfully dropped course',
      courseId,
      studentId 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to drop course' },
      { status: 500 }
    );
  }
}