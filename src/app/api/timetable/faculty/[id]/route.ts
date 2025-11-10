import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import Database from 'better-sqlite3';

initDatabase();
const db = new Database('./university.db');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const facultyId = parseInt(id);

    if (isNaN(facultyId)) {
      return NextResponse.json(
        { error: 'Invalid faculty ID' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'week'; // week, month, semester
    const date = searchParams.get('date'); // Optional: specific date to view around

    // Get faculty info
    const faculty = db.prepare(`
      SELECT id, name, email 
      FROM users 
      WHERE id = ? AND role = 'faculty'
    `).get(facultyId) as any;

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Base query for lectures
    let dateFilter = '';
    const queryParams: any[] = [facultyId];

    if (date) {
      const targetDate = new Date(date);
      
      if (view === 'week') {
        // Get week start (Monday) and end (Sunday)
        const weekStart = new Date(targetDate);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        dateFilter = 'AND l.lecture_date BETWEEN ? AND ?';
        queryParams.push(
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );
      } else if (view === 'month') {
        // Get month start and end
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        dateFilter = 'AND l.lecture_date BETWEEN ? AND ?';
        queryParams.push(
          monthStart.toISOString().split('T')[0],
          monthEnd.toISOString().split('T')[0]
        );
      }
    }

    // Get lectures
    const lectures = db.prepare(`
      SELECT 
        l.*,
        c.code as course_code,
        c.name as course_name,
        c.semester,
        c.year,
        m.title as module_title,
        m.sequence as module_sequence,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_students,
        (SELECT COUNT(*) FROM lecture_attendance WHERE lecture_id = l.id) as attendance_count,
        (SELECT COUNT(*) FROM lecture_attendance WHERE lecture_id = l.id AND status = 'present') as present_count
      FROM lectures l
      JOIN courses c ON l.course_id = c.id
      LEFT JOIN course_modules m ON l.module_id = m.id
      WHERE l.conducted_by = ?
      ${dateFilter}
      ORDER BY l.lecture_date, l.start_time
    `).all(...queryParams) as any[];

    // Get courses taught by faculty
    const courses = db.prepare(`
      SELECT DISTINCT
        c.id,
        c.code,
        c.name,
        c.semester,
        c.year,
        COUNT(DISTINCT l.id) as total_lectures,
        COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_lectures,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_students
      FROM courses c
      JOIN lectures l ON c.id = l.course_id
      WHERE l.conducted_by = ?
      GROUP BY c.id
      ORDER BY c.semester, c.code
    `).all(facultyId) as any[];

    // Statistics
    const stats = {
      total_courses: courses.length,
      total_lectures: lectures.length,
      completed_lectures: lectures.filter(l => l.status === 'completed').length,
      upcoming_lectures: lectures.filter(l => {
        const lectureDate = new Date(l.lecture_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return lectureDate >= today && l.status === 'scheduled';
      }).length,
      cancelled_lectures: lectures.filter(l => l.status === 'cancelled').length
    };

    // Group lectures by date for calendar view
    const lecturesByDate = lectures.reduce((acc: any, lecture: any) => {
      const date = lecture.lecture_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(lecture);
      return acc;
    }, {});

    // Group lectures by week for week view
    const lecturesByWeek = lectures.reduce((acc: any, lecture: any) => {
      const week = lecture.week_number;
      if (!acc[week]) {
        acc[week] = [];
      }
      acc[week].push(lecture);
      return acc;
    }, {});

    // Get next upcoming lecture
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextLecture = lectures.find(l => {
      const lectureDate = new Date(l.lecture_date);
      return lectureDate >= today && l.status === 'scheduled';
    });

    return NextResponse.json({
      faculty: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email
      },
      stats,
      courses,
      lectures,
      next_lecture: nextLecture || null,
      grouped_views: {
        by_date: lecturesByDate,
        by_week: lecturesByWeek
      },
      view_info: {
        view,
        date: date || null
      }
    });

  } catch (error: unknown) {
    console.error('Failed to fetch faculty timetable:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty timetable' },
      { status: 500 }
    );
  }
}
