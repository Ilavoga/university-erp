import { NextRequest, NextResponse } from 'next/server';
import lecturerAssignmentRepository from '@/lib/repositories/LecturerAssignmentRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view');

    if (view === 'workload') {
      // Get workload report for all lecturers
      const workloads = lecturerAssignmentRepository.getAllLecturerWorkloads();
      return NextResponse.json({ workloads });
    } else if (view === 'unassigned') {
      // Get courses without lecturers
      const courses = lecturerAssignmentRepository.getUnassignedCourses();
      return NextResponse.json({ courses });
    } else {
      // Get all courses with their lecturers
      const courses = lecturerAssignmentRepository.getAllCoursesWithLecturers();
      return NextResponse.json({ courses });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch admin data';
    console.error('Failed to fetch admin data:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
