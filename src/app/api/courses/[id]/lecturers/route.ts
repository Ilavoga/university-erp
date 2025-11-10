import { NextRequest, NextResponse } from 'next/server';
import lecturerAssignmentRepository from '@/lib/repositories/LecturerAssignmentRepository';
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

    const lecturers = lecturerAssignmentRepository.getCourseLecturers(courseId);

    return NextResponse.json({ lecturers });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch lecturers';
    console.error('Failed to fetch lecturers:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json();
    const { lecturer_id, assigned_by } = body;

    if (!lecturer_id || !assigned_by) {
      return NextResponse.json(
        { error: 'Missing required fields: lecturer_id, assigned_by' },
        { status: 400 }
      );
    }

    const assignmentId = lecturerAssignmentRepository.assignLecturer(
      courseId,
      lecturer_id,
      assigned_by
    );

    return NextResponse.json({
      id: assignmentId,
      course_id: courseId,
      lecturer_id,
      assigned_by
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign lecturer';
    console.error('Failed to assign lecturer:', error);
    
    // Check for specific error messages
    if (errorMessage.includes('already assigned')) {
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }
    if (errorMessage.includes('not found') || errorMessage.includes('not a faculty')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);
    const searchParams = request.nextUrl.searchParams;
    const lecturerId = searchParams.get('lecturerId');

    if (isNaN(courseId) || !lecturerId) {
      return NextResponse.json(
        { error: 'Invalid course ID or missing lecturer ID' },
        { status: 400 }
      );
    }

    const removed = lecturerAssignmentRepository.removeLecturerAssignment(
      courseId,
      parseInt(lecturerId)
    );

    if (!removed) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove lecturer';
    console.error('Failed to remove lecturer:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
