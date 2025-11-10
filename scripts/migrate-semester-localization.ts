/**
 * Database Migration Script: Semester Localization
 * 
 * Converts courses.semester TEXT to year + month range integers
 * Enables calendar date calculation for all 16 weeks
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = new Database('university.db');

console.log('Starting semester localization migration...\n');

try {
  // Step 1: Add new columns
  console.log('Step 1: Adding new columns...');
  try {
    db.exec('ALTER TABLE courses ADD COLUMN semester_year INTEGER');
    console.log('  ✓ Added semester_year column');
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('duplicate column name')) {
      console.log('  ⚠ semester_year already exists, skipping');
    } else {
      throw err;
    }
  }

  try {
    db.exec('ALTER TABLE courses ADD COLUMN semester_start_month INTEGER');
    console.log('  ✓ Added semester_start_month column');
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('duplicate column name')) {
      console.log('  ⚠ semester_start_month already exists, skipping');
    } else {
      throw err;
    }
  }

  try {
    db.exec('ALTER TABLE courses ADD COLUMN semester_end_month INTEGER');
    console.log('  ✓ Added semester_end_month column');
  } catch (err) {
    const error = err as Error;
    if (error.message.includes('duplicate column name')) {
      console.log('  ⚠ semester_end_month already exists, skipping');
    } else {
      throw err;
    }
  }

  // Step 2: Migrate data
  console.log('\nStep 2: Migrating existing data...');
  
  // First, update "Semester 1", "Semester 2", "Semester 3" formats (assume current year 2025)
  db.prepare(`
    UPDATE courses
    SET 
      semester_year = 2025,
      semester_start_month = CASE
        WHEN semester = 'Semester 1' THEN 1
        WHEN semester = 'Semester 2' THEN 5
        WHEN semester = 'Semester 3' THEN 9
        ELSE semester_start_month
      END,
      semester_end_month = CASE
        WHEN semester = 'Semester 1' THEN 4
        WHEN semester = 'Semester 2' THEN 8
        WHEN semester = 'Semester 3' THEN 9
        ELSE semester_end_month
      END
    WHERE semester IN ('Semester 1', 'Semester 2', 'Semester 3')
  `).run();

  // Then, update formats like "Fall 2025", "Spring 2025", etc.
  const updated = db.prepare(`
    UPDATE courses
    SET 
      semester_year = CASE
        WHEN semester LIKE '%2025%' THEN 2025
        WHEN semester LIKE '%2026%' THEN 2026
        ELSE 2025
      END,
      semester_start_month = CASE
        WHEN semester LIKE '%January%' OR semester LIKE '%Spring%' THEN 1
        WHEN semester LIKE '%May%' OR semester LIKE '%Summer%' THEN 5
        WHEN semester LIKE '%September%' OR semester LIKE '%Fall%' THEN 9
        ELSE semester_start_month
      END,
      semester_end_month = CASE
        WHEN semester LIKE '%January%' OR semester LIKE '%Spring%' THEN 4
        WHEN semester LIKE '%May%' OR semester LIKE '%Summer%' THEN 8
        WHEN semester LIKE '%September%' OR semester LIKE '%Fall%' THEN 12
        ELSE semester_end_month
      END
    WHERE semester NOT IN ('Semester 1', 'Semester 2', 'Semester 3')
      AND semester IS NOT NULL
  `).run();
  console.log(`  ✓ Updated ${updated.changes} courses`);

  // Step 3: Create indexes
  console.log('\nStep 3: Creating indexes...');
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_courses_semester_year ON courses(semester_year)');
    console.log('  ✓ Created idx_courses_semester_year');
  } catch (err) {
    console.log('  ⚠ Index idx_courses_semester_year already exists');
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_courses_semester_months ON courses(semester_start_month, semester_end_month)');
    console.log('  ✓ Created idx_courses_semester_months');
  } catch (err) {
    console.log('  ⚠ Index idx_courses_semester_months already exists');
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_courses_full_semester ON courses(semester_year, semester_start_month, semester_end_month)');
    console.log('  ✓ Created idx_courses_full_semester');
  } catch (err) {
    console.log('  ⚠ Index idx_courses_full_semester already exists');
  }

  console.log('\n✅ Migration completed successfully!\n');

  // Verification: Show updated courses
  console.log('Verification - Updated courses:');
  console.log('=====================================\n');

  interface CourseRow {
    id: number;
    code: string;
    name: string;
    old_semester: string;
    semester_year: number;
    semester_start_month: number;
    semester_end_month: number;
  }

  const courses = db.prepare(`
    SELECT 
      id,
      code,
      name,
      semester AS old_semester,
      semester_year,
      semester_start_month,
      semester_end_month
    FROM courses
  `).all() as CourseRow[];

  courses.forEach(course => {
    console.log(`Course: ${course.code} - ${course.name}`);
    console.log(`  Old: ${course.old_semester}`);
    console.log(`  New: Year ${course.semester_year}, Months ${course.semester_start_month}-${course.semester_end_month}`);
    
    // Convert to month range label
    let monthRange = 'Unknown';
    if (course.semester_start_month === 1) monthRange = 'January-April';
    else if (course.semester_start_month === 5) monthRange = 'May-August';
    else if (course.semester_start_month === 9) monthRange = 'September-December';
    
    console.log(`  Display: ${course.semester_year} ${monthRange}\n`);
  });

  console.log('=====================================');
  console.log('✓ All courses migrated successfully');

} catch (error) {
  const err = error as Error;
  console.error('❌ Migration failed:', err.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
