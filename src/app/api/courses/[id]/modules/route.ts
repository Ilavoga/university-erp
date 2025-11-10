import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
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

    const modules = db.prepare(`
      SELECT * FROM course_modules
      WHERE course_id = ?
      ORDER BY sequence
    `).all(courseId);

    return NextResponse.json({ modules });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch modules';
    console.error('Failed to fetch modules:', error);
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
    const { title, description, sequence, duration_weeks, learning_objectives, resources } = body;

    if (!title || sequence === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, sequence' },
        { status: 400 }
      );
    }

    const result = db.prepare(`
      INSERT INTO course_modules (course_id, title, description, sequence, duration_weeks, learning_objectives, resources)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      courseId,
      title,
      description || null,
      sequence,
      duration_weeks || null,
      learning_objectives ? JSON.stringify(learning_objectives) : null,
      resources ? JSON.stringify(resources) : null
    );

    return NextResponse.json({
      id: result.lastInsertRowid,
      course_id: courseId,
      title,
      sequence
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create module';
    console.error('Failed to create module:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
