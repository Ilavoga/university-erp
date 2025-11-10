const Database = require('better-sqlite3');
const db = new Database('./university.db');

console.log('🔄 Updating existing data with semester information...\n');

try {
  // Get existing courses
  const courses = db.prepare('SELECT id, code, name FROM courses').all();
  console.log(`Found ${courses.length} courses to update:\n`);

  // Assign semester and year to existing courses
  const updateCourse = db.prepare(`
    UPDATE courses 
    SET semester = ?, year = ? 
    WHERE id = ?
  `);

  // For demonstration: assign different semesters
  // In production, admin would set these
  const semesterAssignments = [
    { id: 1, semester: 'Semester 1', year: 2025 },  // COMP 120
    { id: 2, semester: 'Semester 1', year: 2025 },  // COMP 223
    { id: 3, semester: 'Semester 2', year: 2025 },  // If exists
  ];

  for (const assignment of semesterAssignments) {
    const course = courses.find(c => c.id === assignment.id);
    if (course) {
      updateCourse.run(assignment.semester, assignment.year, assignment.id);
      console.log(`✓ Updated ${course.code}: ${assignment.semester} ${assignment.year}`);
    }
  }

  // Update students with entry information
  console.log('\n📝 Updating student entry information...');
  
  const students = db.prepare('SELECT user_id, student_id FROM students').all();
  const updateStudent = db.prepare(`
    UPDATE students 
    SET entry_semester = ?, entry_year = ?, current_year = ?, current_semester = ?
    WHERE user_id = ?
  `);

  for (const student of students) {
    // Default: all students started Semester 1 2025, currently in Year 1
    updateStudent.run('Semester 1', 2025, 1, 'Semester 1', student.user_id);
  }
  
  console.log(`✓ Updated ${students.length} student(s)`);

  // Update existing lectures with module links
  console.log('\n📝 Linking lectures to modules...');
  
  const lectures = db.prepare('SELECT id, course_id, topic FROM lectures').all();
  const modules = db.prepare('SELECT id, course_id, title, sequence FROM course_modules ORDER BY course_id, sequence').all();
  
  const updateLecture = db.prepare(`
    UPDATE lectures 
    SET module_id = ?, start_time = ?, end_time = ?, week_number = ?, delivery_mode = ?, location = ?
    WHERE id = ?
  `);

  let updatedCount = 0;
  for (const lecture of lectures) {
    // Find corresponding module (use first module of course as default)
    const module = modules.find(m => m.course_id === lecture.course_id);
    
    if (module) {
      // Assign week number based on lecture sequence (simplified)
      const lectureWeek = (updatedCount % 13) + 1; // Weeks 1-13
      
      updateLecture.run(
        module.id,           // module_id
        '10:00',            // start_time (default)
        '13:00',            // end_time (default - 3 hours)
        lectureWeek,        // week_number
        'physical',         // delivery_mode
        'Room 101',         // location
        lecture.id
      );
      updatedCount++;
    }
  }
  
  console.log(`✓ Updated ${updatedCount} lecture(s) with module links`);

  console.log('\n✅ Data update completed successfully!\n');
  
  // Show summary
  console.log('📊 Current State:');
  const courseStats = db.prepare(`
    SELECT 
      c.code,
      c.name,
      c.semester,
      c.year,
      COUNT(DISTINCT cm.id) as module_count,
      COUNT(DISTINCT l.id) as lecture_count
    FROM courses c
    LEFT JOIN course_modules cm ON c.id = cm.course_id
    LEFT JOIN lectures l ON c.id = l.course_id
    GROUP BY c.id
    ORDER BY c.code
  `).all();

  console.log('\nCourses:');
  courseStats.forEach(stat => {
    console.log(`  ${stat.code} (${stat.semester} ${stat.year})`);
    console.log(`    - ${stat.module_count} module(s)`);
    console.log(`    - ${stat.lecture_count} lecture(s)`);
  });

  console.log('\n🎯 Ready for Phase 2: API Development!\n');

} catch (error) {
  console.error('❌ Update failed:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
} finally {
  db.close();
}
