import { NextRequest, NextResponse } from 'next/server';
import { CourseRepository } from '@/lib/repositories/CourseRepository';
import { initDatabase } from '@/lib/db';
import { 
  isValidSemesterYear, 
  isSemesterInFuture, 
  monthRangeToMonths,
  type MonthRange 
} from '@/lib/semester-utils';

initDatabase();

const courseRepo = new CourseRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyId = searchParams.get('facultyId');
    const semester = searchParams.get('semester');

    let courses;
    
    if (facultyId) {
      courses = courseRepo.getCoursesByFaculty(parseInt(facultyId));
    } else if (semester) {
      courses = courseRepo.getCoursesBySemester(semester);
    } else {
      courses = courseRepo.getAllCourses();
    }

    // Transform to match frontend Course interface
    const transformedCourses = courses.map(course => ({
      id: course.id.toString(),
      code: course.code,
      name: course.name,
      description: course.description || '',
      facultyId: course.faculty_id.toString(),
      credits: course.credits,
      semester: course.semester,
      semesterYear: course.semester_year,
      semesterStartMonth: course.semester_start_month,
      semesterEndMonth: course.semester_end_month,
      enrolledStudents: Array(course.enrolled_count).fill('student'), // Simplified for now
    }));

    return NextResponse.json(transformedCourses);
  } catch (error) {
    const err = error as Error;
    console.error('Failed to fetch courses:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { code, name, description, facultyId, credits, semesterYear, semesterMonthRange } = body;
    
    if (!code || !name || !credits || !semesterYear || !semesterMonthRange) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate year
    const year = parseInt(semesterYear);
    if (!isValidSemesterYear(year)) {
      return NextResponse.json(
        { error: 'Year must be current year or next year' },
        { status: 400 }
      );
    }

    // Validate semester is not in the past
    const monthRange = semesterMonthRange as MonthRange;
    if (!isSemesterInFuture(year, monthRange)) {
      return NextResponse.json(
        { error: 'Cannot create course in a past semester' },
        { status: 400 }
      );
    }

    // Convert month range to database format
    const { startMonth, endMonth } = monthRangeToMonths(monthRange);

    const course = courseRepo.createCourse({
      code,
      name,
      description: description || '',
      faculty_id: facultyId ? parseInt(facultyId) : 3, // Default to Dr. Wilson
      credits: parseInt(credits),
      semester_year: year,
      semester_start_month: startMonth,
      semester_end_month: endMonth,
    });

    // Transform response
    const transformedCourse = {
      id: course.id.toString(),
      code: course.code,
      name: course.name,
      description: course.description || '',
      facultyId: course.faculty_id.toString(),
      credits: course.credits,
      semesterYear: course.semester_year,
      semesterStartMonth: course.semester_start_month,
      semesterEndMonth: course.semester_end_month,
      enrolledStudents: [],
    };

    return NextResponse.json(transformedCourse, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Failed to create course:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}
