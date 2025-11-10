/**
 * Update existing courses to use the new semester display format
 */

import Database from 'better-sqlite3';

const db = new Database('university.db');

console.log('Updating course semester display strings...\n');

try {
  // Update all courses to have proper display strings
  const courses = db.prepare('SELECT id, code, semester_year, semester_start_month, semester_end_month FROM courses').all() as Array<{
    id: number;
    code: string;
    semester_year: number;
    semester_start_month: number;
    semester_end_month: number;
  }>;

  courses.forEach(course => {
    let displaySemester = '';
    
    // Map months to readable format
    if (course.semester_start_month === 1 && course.semester_end_month === 4) {
      displaySemester = `${course.semester_year} January-April`;
    } else if (course.semester_start_month === 5 && course.semester_end_month === 8) {
      displaySemester = `${course.semester_year} May-August`;
    } else if (course.semester_start_month === 9 && course.semester_end_month === 12) {
      displaySemester = `${course.semester_year} September-December`;
    } else {
      displaySemester = `${course.semester_year} Unknown`;
    }

    // Update the semester display string
    db.prepare('UPDATE courses SET semester = ? WHERE id = ?').run(displaySemester, course.id);
    
    console.log(`✓ Updated ${course.code}: ${displaySemester}`);
  });

  console.log('\n✅ All courses updated successfully!\n');

  // Show final result
  console.log('Updated courses:');
  console.log('='.repeat(70));
  const updatedCourses = db.prepare(`
    SELECT id, code, semester, semester_year, semester_start_month, semester_end_month 
    FROM courses 
    ORDER BY id
  `).all();
  console.table(updatedCourses);

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} finally {
  db.close();
}
