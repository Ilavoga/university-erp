import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(db.students);
}

export async function POST(request: Request) {
  try {
    const student = await request.json();
    const newStudent = {
      ...student,
      id: `${db.students.length + 1}`,
      role: 'student' as const,
      createdAt: new Date(),
    };
    db.students.push(newStudent);
    db.users.push(newStudent);
    return NextResponse.json(newStudent);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
