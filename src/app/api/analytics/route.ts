import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-data';

export async function GET() {
  try {
    // Calculate total students and courses
    const totalStudents = db.students.length;
    const totalCourses = db.courses.length;

    // Calculate average GPA
    const averageGPA = db.students.reduce((sum, s) => sum + s.gpa, 0) / db.students.length;

    // Mock attendance rate (in real app, this would come from attendance records)
    const attendanceRate = 0.87;

    // Calculate enrollment trends (mock data based on student enrollment dates)
    const enrollmentTrends = [
      { month: 'January', count: Math.floor(totalStudents * 0.15) },
      { month: 'February', count: Math.floor(totalStudents * 0.18) },
      { month: 'March', count: Math.floor(totalStudents * 0.20) },
      { month: 'April', count: Math.floor(totalStudents * 0.22) },
      { month: 'May', count: Math.floor(totalStudents * 0.25) },
    ];

    // Group students by department and calculate average GPA
    const departmentMap = new Map<string, { totalGPA: number; count: number }>();
    
    db.students.forEach(student => {
      const dept = student.major;
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { totalGPA: 0, count: 0 });
      }
      const deptData = departmentMap.get(dept)!;
      deptData.totalGPA += student.gpa;
      deptData.count += 1;
    });

    const performanceByDepartment = Array.from(departmentMap.entries())
      .map(([department, data]) => ({
        department,
        avgGPA: data.totalGPA / data.count,
        studentCount: data.count,
      }))
      .sort((a, b) => b.avgGPA - a.avgGPA);

    return NextResponse.json({
      totalStudents,
      totalCourses,
      averageGPA,
      attendanceRate,
      enrollmentTrends,
      performanceByDepartment,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
