import { NextRequest, NextResponse } from 'next/server';
import { CourseRepository } from '@/lib/repositories/CourseRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

const courseRepo = new CourseRepository();

export async function GET(request: NextRequest) {
  try {
    const stats = courseRepo.getCourseStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch course statistics' },
      { status: 500 }
    );
  }
}