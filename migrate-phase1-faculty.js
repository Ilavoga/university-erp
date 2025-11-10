const Database = require('better-sqlite3');
const db = new Database('./university.db');

console.log('🔄 Phase 1: Database Migration for Faculty Management System\n');
console.log('📋 Adding: Exam schedules, enhanced lectures, student tracking, restrictions\n');

try {
  db.exec('BEGIN TRANSACTION');

  // Check current schemas
  console.log('Checking current database structure...\n');
  
  const lectureColumns = db.prepare('PRAGMA table_info(lectures)').all();
  const courseColumns = db.prepare('PRAGMA table_info(courses)').all();
  const studentColumns = db.prepare('PRAGMA table_info(students)').all();
  const assignmentColumns = db.prepare('PRAGMA table_info(assignments)').all();
  
  const lectureColNames = lectureColumns.map(c => c.name);
  const courseColNames = courseColumns.map(c => c.name);
  const studentColNames = studentColumns.map(c => c.name);
  const assignmentColNames = assignmentColumns.map(c => c.name);

  // 1. Enhance lectures table
  console.log('📝 Enhancing lectures table...');
  
  if (!lectureColNames.includes('module_id')) {
    console.log('  - Adding module_id column');
    db.prepare('ALTER TABLE lectures ADD COLUMN module_id INTEGER REFERENCES course_modules(id) ON DELETE CASCADE').run();
  }
  
  if (!lectureColNames.includes('delivery_mode')) {
    console.log('  - Adding delivery_mode column');
    db.prepare("ALTER TABLE lectures ADD COLUMN delivery_mode TEXT CHECK(delivery_mode IN ('online', 'physical')) DEFAULT 'physical'").run();
  }
  
  if (!lectureColNames.includes('location')) {
    console.log('  - Adding location column');
    db.prepare('ALTER TABLE lectures ADD COLUMN location TEXT').run();
  }
  
  if (!lectureColNames.includes('meeting_link')) {
    console.log('  - Adding meeting_link column');
    db.prepare('ALTER TABLE lectures ADD COLUMN meeting_link TEXT').run();
  }
  
  if (!lectureColNames.includes('start_time')) {
    console.log('  - Adding start_time column');
    db.prepare("ALTER TABLE lectures ADD COLUMN start_time TEXT DEFAULT '07:00'").run();
  }
  
  if (!lectureColNames.includes('end_time')) {
    console.log('  - Adding end_time column');
    db.prepare("ALTER TABLE lectures ADD COLUMN end_time TEXT DEFAULT '10:00'").run();
  }
  
  if (!lectureColNames.includes('week_number')) {
    console.log('  - Adding week_number column');
    db.prepare('ALTER TABLE lectures ADD COLUMN week_number INTEGER').run();
  }

  // 2. Enhance courses table
  console.log('\n📝 Enhancing courses table...');
  
  if (!courseColNames.includes('semester')) {
    console.log('  - Adding semester column');
    db.prepare("ALTER TABLE courses ADD COLUMN semester TEXT CHECK(semester IN ('Semester 1', 'Semester 2', 'Semester 3'))").run();
  }
  
  if (!courseColNames.includes('year')) {
    console.log('  - Adding year column');
    db.prepare('ALTER TABLE courses ADD COLUMN year INTEGER DEFAULT 2025').run();
  }
  
  if (!courseColNames.includes('max_students')) {
    console.log('  - Adding max_students column');
    db.prepare('ALTER TABLE courses ADD COLUMN max_students INTEGER DEFAULT 50').run();
  }

  // 3. Enhance students table
  console.log('\n📝 Enhancing students table...');
  
  if (!studentColNames.includes('entry_semester')) {
    console.log('  - Adding entry_semester column');
    db.prepare('ALTER TABLE students ADD COLUMN entry_semester TEXT').run();
  }
  
  if (!studentColNames.includes('entry_year')) {
    console.log('  - Adding entry_year column');
    db.prepare('ALTER TABLE students ADD COLUMN entry_year INTEGER DEFAULT 2025').run();
  }
  
  if (!studentColNames.includes('current_year')) {
    console.log('  - Adding current_year column');
    db.prepare('ALTER TABLE students ADD COLUMN current_year INTEGER DEFAULT 1').run();
  }
  
  if (!studentColNames.includes('current_semester')) {
    console.log('  - Adding current_semester column');
    db.prepare('ALTER TABLE students ADD COLUMN current_semester TEXT').run();
  }

  // 4. Enhance assignments table
  console.log('\n📝 Enhancing assignments table...');
  
  if (!assignmentColNames.includes('assignment_type')) {
    console.log('  - Adding assignment_type column');
    db.prepare("ALTER TABLE assignments ADD COLUMN assignment_type TEXT CHECK(assignment_type IN ('assignment', 'quiz', 'exam')) DEFAULT 'assignment'").run();
  }
  
  if (!assignmentColNames.includes('weight')) {
    console.log('  - Adding weight column');
    db.prepare('ALTER TABLE assignments ADD COLUMN weight REAL DEFAULT 10.0').run();
  }
  
  if (!assignmentColNames.includes('allows_file_submission')) {
    console.log('  - Adding allows_file_submission column');
    db.prepare('ALTER TABLE assignments ADD COLUMN allows_file_submission INTEGER DEFAULT 1').run();
  }
  
  if (!assignmentColNames.includes('file_types')) {
    console.log('  - Adding file_types column');
    db.prepare('ALTER TABLE assignments ADD COLUMN file_types TEXT').run();
  }
  
  if (!assignmentColNames.includes('max_file_size')) {
    console.log('  - Adding max_file_size column');
    db.prepare('ALTER TABLE assignments ADD COLUMN max_file_size INTEGER DEFAULT 10485760').run();
  }
  
  if (!assignmentColNames.includes('instructions')) {
    console.log('  - Adding instructions column');
    db.prepare('ALTER TABLE assignments ADD COLUMN instructions TEXT').run();
  }
  
  if (!assignmentColNames.includes('grading_rubric')) {
    console.log('  - Adding grading_rubric column');
    db.prepare('ALTER TABLE assignments ADD COLUMN grading_rubric TEXT').run();
  }

  // 5. Create new tables
  console.log('\n📝 Creating new tables...');
  
  // Course restrictions
  console.log('  - Creating course_restrictions table');
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

  // Assignment submissions
  console.log('  - Creating assignment_submissions table');
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

  // Exam schedules
  console.log('  - Creating exam_schedules table');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS exam_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      exam_type TEXT CHECK(exam_type IN ('midterm', 'final', 'practical')) DEFAULT 'final',
      exam_date DATE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      location TEXT NOT NULL,
      max_capacity INTEGER,
      instructions TEXT,
      materials_allowed TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `).run();

  // Exam attendance
  console.log('  - Creating exam_attendance table');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS exam_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_schedule_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'excused')) DEFAULT 'absent',
      seat_number TEXT,
      check_in_time DATETIME,
      check_out_time DATETIME,
      marked_by INTEGER,
      notes TEXT,
      FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (marked_by) REFERENCES users(id),
      UNIQUE(exam_schedule_id, student_id)
    )
  `).run();

  // Exam results
  console.log('  - Creating exam_results table');
  db.prepare(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_schedule_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      score REAL NOT NULL,
      max_score REAL NOT NULL,
      percentage REAL,
      grade TEXT,
      uploaded_by INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      comments TEXT,
      FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id),
      UNIQUE(exam_schedule_id, student_id)
    )
  `).run();

  // 6. Create indexes
  console.log('\n📝 Creating indexes...');
  
  db.prepare('CREATE INDEX IF NOT EXISTS idx_lectures_module ON lectures(module_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_lectures_datetime ON lectures(lecture_date, start_time)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_lectures_week ON lectures(week_number)').run();
  
  db.prepare('CREATE INDEX IF NOT EXISTS idx_course_restrictions_course ON course_restrictions(course_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_course_restrictions_major ON course_restrictions(major)').run();
  
  db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status)').run();
  
  db.prepare('CREATE INDEX IF NOT EXISTS idx_exam_schedules_course ON exam_schedules(course_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_exam_schedules_date ON exam_schedules(exam_date, start_time)').run();
  
  db.prepare('CREATE INDEX IF NOT EXISTS idx_exam_attendance_exam ON exam_attendance(exam_schedule_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_exam_attendance_student ON exam_attendance(student_id)').run();
  
  db.prepare('CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_schedule_id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id)').run();

  db.exec('COMMIT');

  console.log('\n✅ Migration completed successfully!\n');
  
  // Show summary
  console.log('📊 Summary of changes:');
  console.log('  ✓ Enhanced lectures table (7 new columns)');
  console.log('  ✓ Enhanced courses table (3 new columns)');
  console.log('  ✓ Enhanced students table (4 new columns)');
  console.log('  ✓ Enhanced assignments table (7 new columns)');
  console.log('  ✓ Created course_restrictions table');
  console.log('  ✓ Created assignment_submissions table');
  console.log('  ✓ Created exam_schedules table');
  console.log('  ✓ Created exam_attendance table');
  console.log('  ✓ Created exam_results table');
  console.log('  ✓ Created 13 new indexes\n');
  
  console.log('🎯 Next Steps:');
  console.log('  1. Update existing data (set semesters, module_ids, etc.)');
  console.log('  2. Build API endpoints for exam management');
  console.log('  3. Create UI components for scheduling\n');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
} finally {
  db.close();
}
