import { NextRequest, NextResponse } from 'next/server';
import { CourseRepository } from '@/lib/repositories/CourseRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const courseRepo = new CourseRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const course = courseRepo.getCourseById(courseId);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const students = courseRepo.getEnrolledStudents(courseId);

    const transformedCourse = {
      id: course.id.toString(),
      code: course.code,
      name: course.name,
      description: course.description || '',
      facultyId: course.faculty_id.toString(),
      facultyName: course.faculty_name,
      credits: course.credits,
      semester: course.semester,
      enrolledStudents: students.map(s => s.id.toString()),
      students: students,
    };

    return NextResponse.json(transformedCourse);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const body = await request.json();

    const updateData: any = {};
    
    if (body.code) updateData.code = body.code;
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.facultyId) updateData.faculty_id = parseInt(body.facultyId);
    if (body.credits) updateData.credits = parseInt(body.credits);
    if (body.semester) updateData.semester = body.semester;

    const course = courseRepo.updateCourse(courseId, updateData);

    const transformedCourse = {
      id: course.id.toString(),
      code: course.code,
      name: course.name,
      description: course.description || '',
      facultyId: course.faculty_id.toString(),
      credits: course.credits,
      semester: course.semester,
      enrolledStudents: [],
    };

    return NextResponse.json(transformedCourse);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update course' },
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
    courseRepo.deleteCourse(courseId);

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete course' },
      { status: 500 }
    );
  }
}