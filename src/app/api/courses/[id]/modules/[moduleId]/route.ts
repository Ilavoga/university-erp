import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import progressCalculationRepository from '@/lib/repositories/ProgressCalculationRepository';
import { initDatabase } from '@/lib/db';

initDatabase();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    const moduleId = parseInt(params.moduleId);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, sequence, duration_weeks, learning_objectives, resources } = body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (sequence !== undefined) {
      fields.push('sequence = ?');
      values.push(sequence);
    }
    if (duration_weeks !== undefined) {
      fields.push('duration_weeks = ?');
      values.push(duration_weeks);
    }
    if (learning_objectives !== undefined) {
      fields.push('learning_objectives = ?');
      values.push(JSON.stringify(learning_objectives));
    }
    if (resources !== undefined) {
      fields.push('resources = ?');
      values.push(JSON.stringify(resources));
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(moduleId);
    const result = db.prepare(`
      UPDATE course_modules
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: moduleId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update module';
    console.error('Failed to update module:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    const moduleId = parseInt(params.moduleId);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const result = db.prepare('DELETE FROM course_modules WHERE id = ?').run(moduleId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete module';
    console.error('Failed to delete module:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Mark module as complete for a student
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    const moduleId = parseInt(params.moduleId);

    if (isNaN(moduleId)) {
      return NextResponse.json(
        { error: 'Invalid module ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { student_id, score } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing required field: student_id' },
        { status: 400 }
      );
    }

    // Check if already completed
    const existing = db.prepare(`
      SELECT id FROM module_completions
      WHERE student_id = ? AND module_id = ?
    `).get(student_id, moduleId);

    if (existing) {
      return NextResponse.json(
        { error: 'Module already completed' },
        { status: 409 }
      );
    }

    // Mark as complete
    const result = db.prepare(`
      INSERT INTO module_completions (student_id, module_id, score)
      VALUES (?, ?, ?)
    `).run(student_id, moduleId, score || null);

    // Update progress
    const progress = progressCalculationRepository.updateProgressOnModuleCompletion(
      student_id,
      moduleId
    );

    return NextResponse.json({
      id: result.lastInsertRowid,
      student_id,
      module_id: moduleId,
      score,
      updated_progress: {
        overall_progress: progress.overall_progress,
        module_progress: progress.module_progress
      }
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete module';
    console.error('Failed to complete module:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
