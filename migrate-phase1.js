const Database = require('better-sqlite3');
const db = new Database('./university.db');

console.log('🔄 Phase 1: Database Migration - Academic Semester System\n');

try {
  console.log('Step 1: Enhancing courses table...');
  
  // Check existing columns in courses
  const courseColumns = db.prepare('PRAGMA table_info(courses)').all();
  const courseColumnNames = courseColumns.map(c => c.name);
  
  if (!courseColumnNames.includes('semester')) {
    console.log('  Adding semester column...');
    db.prepare("ALTER TABLE courses ADD COLUMN semester TEXT CHECK(semester IN ('Semester 1', 'Semester 2', 'Semester 3'))").run();
  }
  
  if (!courseColumnNames.includes('year')) {
    console.log('  Adding year column...');
    db.prepare('ALTER TABLE courses ADD COLUMN year INTEGER DEFAULT 1').run();
  }
  
  if (!courseColumnNames.includes('max_students')) {
    console.log('  Adding max_students column...');
    db.prepare('ALTER TABLE courses ADD COLUMN max_students INTEGER DEFAULT 50').run();
  }
  
  console.log('\nStep 2: Enhancing students table...');
  
  // Check if students table exists, if not we'll add to users
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);
  
  if (tableNames.includes('students')) {
    const studentColumns = db.prepare('PRAGMA table_info(students)').all();
    const studentColumnNames = studentColumns.map(c => c.name);
    
    if (!studentColumnNames.includes('entry_semester')) {
      console.log('  Adding entry_semester column...');
      db.prepare("ALTER TABLE students ADD COLUMN entry_semester TEXT").run();
    }
    
    if (!studentColumnNames.includes('entry_year')) {
      console.log('  Adding entry_year column...');
      db.prepare('ALTER TABLE students ADD COLUMN entry_year INTEGER DEFAULT 2025').run();
    }
    
    if (!studentColumnNames.includes('current_year')) {
      console.log('  Adding current_year column...');
      db.prepare('ALTER TABLE students ADD COLUMN current_year INTEGER DEFAULT 1').run();
    }
    
    if (!studentColumnNames.includes('current_semester')) {
      console.log('  Adding current_semester column...');
      db.prepare("ALTER TABLE students ADD COLUMN current_semester TEXT").run();
    }
  } else {
    console.log('  Note: Students table not found, academic tracking will be added to users table');
  }
  
  console.log('\nStep 3: Enhancing lectures table...');
  
  const lectureColumns = db.prepare('PRAGMA table_info(lectures)').all();
  const lectureColumnNames = lectureColumns.map(c => c.name);
  
  if (!lectureColumnNames.includes('module_id')) {
    console.log('  Adding module_id column...');
    db.prepare('ALTER TABLE lectures ADD COLUMN module_id INTEGER REFERENCES course_modules(id) ON DELETE CASCADE').run();
  }
  
  if (!lectureColumnNames.includes('delivery_mode')) {
    console.log('  Adding delivery_mode column...');
    db.prepare("ALTER TABLE lectures ADD COLUMN delivery_mode TEXT CHECK(delivery_mode IN ('online', 'physical')) DEFAULT 'physical'").run();
  }
  
  if (!lectureColumnNames.includes('location')) {
    console.log('  Adding location column...');
    db.prepare('ALTER TABLE lectures ADD COLUMN location TEXT').run();
  }
  
  if (!lectureColumnNames.includes('meeting_link')) {
    console.log('  Adding meeting_link column...');
    db.prepare('ALTER TABLE lectures ADD COLUMN meeting_link TEXT').run();
  }
  
  if (!lectureColumnNames.includes('start_time')) {
    console.log('  Adding start_time column...');
    db.prepare("ALTER TABLE lectures ADD COLUMN start_time TEXT DEFAULT '07:00'").run();
  }
  
  if (!lectureColumnNames.includes('end_time')) {
    console.log('  Adding end_time column...');
    db.prepare("ALTER TABLE lectures ADD COLUMN end_time TEXT DEFAULT '10:00'").run();
  }
  
  if (!lectureColumnNames.includes('week_number')) {
    console.log('  Adding week_number column...');
    db.prepare('ALTER TABLE lectures ADD COLUMN week_number INTEGER').run();
  }
  
  console.log('\nStep 4: Creating course_restrictions table...');
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS course_restrictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      major TEXT NOT NULL,
      year_level INTEGER,
      semester TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(course_id, major, year_level, semester)
    )
  `).run();
  
  console.log('\nStep 5: Enhancing assignments table...');
  
  const assignmentColumns = db.prepare('PRAGMA table_info(assignments)').all();
  const assignmentColumnNames = assignmentColumns.map(c => c.name);
  
  if (!assignmentColumnNames.includes('assignment_type')) {
    console.log('  Adding assignment_type column...');
    db.prepare("ALTER TABLE assignments ADD COLUMN assignment_type TEXT CHECK(assignment_type IN ('assignment', 'quiz', 'exam')) DEFAULT 'assignment'").run();
  }
  
  if (!assignmentColumnNames.includes('weight')) {
    console.log('  Adding weight column...');
    db.prepare('ALTER TABLE assignments ADD COLUMN weight REAL DEFAULT 10.0').run();
  }
  
  if (!assignmentColumnNames.includes('allows_file_submission')) {
    console.log('  Adding allows_file_submission column...');
    db.prepare('ALTER TABLE assignments ADD COLUMN allows_file_submission INTEGER DEFAULT 1').run();
  }
  
  if (!assignmentColumnNames.includes('file_types')) {
    console.log('  Adding file_types column...');
    db.prepare('ALTER TABLE assignments ADD COLUMN file_types TEXT').run();
  }
  
  if (!assignmentColumnNames.includes('max_file_size')) {
    console.log('  Adding max_file_size column...');
    db.prepare('ALTER TABLE assignments ADD COLUMN max_file_size INTEGER DEFAULT 10485760').run();
  }
  
  if (!assignmentColumnNames.includes('instructions')) {
    console.log('  Adding instructions column...');
    db.prepare('ALTER TABLE assignments ADD COLUMN instructions TEXT').run();
  }
  
  if (!assignmentColumnNames.includes('grading_rubric')) {
    console.log('  Adding grading_rubric column...');
    db.prepare('ALTER TABLE assignments ADD COLUMN grading_rubric TEXT').run();
  }
  
  console.log('\nStep 6: Creating assignment_submissions table...');
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      submission_text TEXT,
      status TEXT CHECK(status IN ('submitted', 'graded', 'late', 'resubmitted')) DEFAULT 'submitted',
      score REAL,
      max_score REAL,
      feedback TEXT,
      graded_by INTEGER,
      graded_at DATETIME,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (graded_by) REFERENCES users(id),
      UNIQUE(assignment_id, student_id)
    )
  `).run();
  
  console.log('\nStep 7: Creating indexes...');
  
  // Lectures indexes
  db.prepare('CREATE INDEX IF NOT EXISTS idx_lectures_module ON lectures(module_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_lectures_datetime ON lectures(lecture_date, start_time)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_lectures_week ON lectures(week_number)').run();
  
  // Course restrictions indexes
  db.prepare('CREATE INDEX IF NOT EXISTS idx_course_restrictions_course ON course_restrictions(course_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_course_restrictions_major ON course_restrictions(major)').run();
  
  // Assignment submissions indexes
  db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status)').run();
  
  console.log('\nStep 8: Updating existing course data with semester info...');
  
  // Update existing courses with default semester
  db.prepare("UPDATE courses SET semester = 'Semester 1', year = 1 WHERE semester IS NULL").run();
  
  console.log('\n✅ Phase 1 Migration Complete!\n');
  
  // Show summary
  console.log('📊 Updated Schema Summary:');
  console.log('\nCourses table:');
  db.prepare('PRAGMA table_info(courses)').all().forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}`);
  });
  
  console.log('\nLectures table (selected columns):');
  const lectureCols = db.prepare('PRAGMA table_info(lectures)').all();
  ['module_id', 'delivery_mode', 'location', 'meeting_link', 'start_time', 'end_time', 'week_number'].forEach(name => {
    const col = lectureCols.find(c => c.name === name);
    if (col) console.log(`  - ${col.name}: ${col.type}`);
  });
  
  console.log('\nNew tables created:');
  console.log('  - course_restrictions');
  console.log('  - assignment_submissions');
  
  console.log('\n🎓 Academic Calendar Configuration:');
  console.log('  - Semester 1: January - April (16 weeks)');
  console.log('  - Semester 2: May - August (16 weeks)');
  console.log('  - Semester 3: September - December (16 weeks)');
  console.log('  - 3-hour lecture slots: 7-10 AM, 10 AM-1 PM, 1-4 PM, 4-7 PM');
  console.log('  - Lecture days: Monday - Friday');
  console.log('  - Max courses per student per semester: 8');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
