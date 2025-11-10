import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = path.join(process.cwd(), 'university.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export async function initDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'admin', 'faculty', 'business')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        student_id TEXT UNIQUE NOT NULL,
        program TEXT NOT NULL,
        year INTEGER NOT NULL,
        gpa REAL DEFAULT 0.0,
        enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        faculty_id INTEGER,
        credits INTEGER NOT NULL,
        semester TEXT NOT NULL,
        FOREIGN KEY (faculty_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'dropped', 'completed')),
        final_grade TEXT,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE(student_id, course_id)
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        location TEXT NOT NULL,
        category TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'registered',
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        module_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        instructions TEXT,
        due_date TEXT NOT NULL,
        total_points INTEGER NOT NULL,
        weight REAL DEFAULT 1.0,
        assignment_type TEXT CHECK(assignment_type IN ('homework', 'quiz', 'project', 'exam', 'lab', 'lecture')) DEFAULT 'homework',
        rubric TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        submission_date TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'graded', 'late')),
        score INTEGER,
        feedback TEXT,
        contributes_to_progress INTEGER DEFAULT 1,
        submission_percentage REAL,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(assignment_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS learning_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK(type IN ('video', 'document', 'link', 'quiz')),
        url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS resource_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        progress INTEGER DEFAULT 0,
        FOREIGN KEY (resource_id) REFERENCES learning_resources(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('course', 'event', 'resource', 'marketplace')),
        target_id INTEGER NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        reason_text TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        dismissed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS course_modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        sequence INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        duration_weeks INTEGER DEFAULT 1,
        learning_objectives TEXT,
        resources TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS module_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        grade REAL,
        FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(module_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS course_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        room TEXT,
        lecture_type TEXT CHECK(lecture_type IN ('lecture', 'lab', 'tutorial', 'seminar')) DEFAULT 'lecture',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS course_lecturers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        lecturer_id INTEGER NOT NULL,
        assigned_by INTEGER,
        assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        UNIQUE(course_id, lecturer_id)
      );

      CREATE TABLE IF NOT EXISTS lectures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        schedule_id INTEGER,
        lecture_date TEXT NOT NULL,
        topic TEXT,
        conducted_by INTEGER,
        status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES course_schedules(id),
        FOREIGN KEY (conducted_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS lecture_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lecture_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'absent',
        marked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        marked_by INTEGER,
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES users(id),
        UNIQUE(lecture_id, student_id)
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
      CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
      CREATE INDEX IF NOT EXISTS idx_resources_course ON learning_resources(course_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
      CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
      CREATE INDEX IF NOT EXISTS idx_module_completions_student ON module_completions(student_id);
      CREATE INDEX IF NOT EXISTS idx_course_schedules_course ON course_schedules(course_id);
      CREATE INDEX IF NOT EXISTS idx_course_schedules_day ON course_schedules(day_of_week);
      CREATE INDEX IF NOT EXISTS idx_course_lecturers_course ON course_lecturers(course_id);
      CREATE INDEX IF NOT EXISTS idx_course_lecturers_lecturer ON course_lecturers(lecturer_id);
      CREATE INDEX IF NOT EXISTS idx_lectures_course ON lectures(course_id);
      CREATE INDEX IF NOT EXISTS idx_lectures_date ON lectures(lecture_date);
      CREATE INDEX IF NOT EXISTS idx_attendance_lecture ON lecture_attendance(lecture_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student ON lecture_attendance(student_id);
    `);

    // Insert demo data if users table is empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      await seedDatabase();
    }

    console.log('Database initialized successfully with new tables');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

async function seedDatabase() {
  const saltRounds = 10;
  
  const insert = db.prepare(`
    INSERT INTO users (email, name, password_hash, role) 
    VALUES (?, ?, ?, ?)
  `);

  // Hash demo passwords using bcrypt
  const demoHash = await bcrypt.hash('demo_password', saltRounds);

  insert.run('john.doe@university.edu', 'John Doe', demoHash, 'student');
  insert.run('admin@university.edu', 'Admin User', demoHash, 'admin');
  insert.run('dr.wilson@university.edu', 'Dr. Wilson', demoHash, 'faculty');
  insert.run('business@university.edu', 'Campus Store', demoHash, 'business');

  // Add student details for John Doe
  const studentInsert = db.prepare(`
    INSERT INTO students (user_id, student_id, program, year, gpa) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  studentInsert.run(1, 'STU001', 'Computer Science', 3, 3.75);

  // Add demo courses
  const courseInsert = db.prepare(`
    INSERT INTO courses (code, name, description, faculty_id, credits, semester)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  courseInsert.run('CS101', 'Introduction to Programming', 'Learn the fundamentals of programming', 3, 3, 'Fall 2024');
  courseInsert.run('CS301', 'Data Structures & Algorithms', 'Advanced data structures and algorithm design', 3, 4, 'Fall 2024');
  courseInsert.run('CS401', 'Machine Learning', 'Introduction to machine learning concepts', 3, 4, 'Fall 2024');

  // Enroll student in courses
  const enrollmentInsert = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, status)
    VALUES (?, ?, ?)
  `);

  enrollmentInsert.run(1, 1, 'active');
  enrollmentInsert.run(1, 2, 'active');

  // Add assignments with enhanced fields
  const assignmentInsert = db.prepare(`
    INSERT INTO assignments (course_id, module_id, title, description, instructions, due_date, total_points, weight, assignment_type, rubric)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // CS101 assignments
  assignmentInsert.run(
    1, 1, 
    'Python Basics Assignment', 
    'Complete basic Python exercises',
    'Write Python programs to solve 10 problems covering variables, data types, and operators. Submit as .py files.',
    '2024-11-15', 100, 1.0, 'homework',
    JSON.stringify({ syntax: 30, logic: 40, documentation: 20, testing: 10 })
  );

  assignmentInsert.run(
    1, 2,
    'Control Flow Quiz',
    'Online quiz on if statements and loops',
    'Complete the online quiz covering conditional logic and iteration. 20 multiple choice questions, 30 minutes.',
    '2024-11-10', 100, 0.5, 'quiz',
    JSON.stringify({ correctness: 100 })
  );

  assignmentInsert.run(
    1, 3,
    'Functions Project',
    'Build a calculator using functions',
    'Create a command-line calculator with functions for add, subtract, multiply, divide. Include error handling.',
    '2024-11-20', 100, 1.5, 'project',
    JSON.stringify({ functionality: 40, code_quality: 30, documentation: 20, testing: 10 })
  );

  // CS301 assignments
  assignmentInsert.run(
    2, 5,
    'Complexity Analysis Lab',
    'Analyze time complexity of algorithms',
    'Complete lab exercises analyzing Big O notation for various algorithms. Show work.',
    '2024-11-12', 100, 1.0, 'lab',
    JSON.stringify({ analysis: 60, justification: 40 })
  );

  assignmentInsert.run(
    2, 7,
    'Binary Trees Implementation',
    'Implement binary search tree',
    'Create a BST class with insert, delete, search, and traversal methods. Include unit tests.',
    '2024-11-20', 100, 2.0, 'project',
    JSON.stringify({ correctness: 40, efficiency: 30, code_quality: 20, tests: 10 })
  );

  assignmentInsert.run(
    2, 7,
    'Trees Midterm Exam',
    'Comprehensive exam on tree structures',
    'Closed-book exam covering binary trees, BST, AVL trees, and traversals. 90 minutes.',
    '2024-11-18', 100, 3.0, 'exam',
    JSON.stringify({ theory: 40, problem_solving: 60 })
  );

  // Add submissions with enhanced fields
  const submissionInsert = db.prepare(`
    INSERT INTO submissions (assignment_id, student_id, status, score, feedback, contributes_to_progress, submission_percentage)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  submissionInsert.run(
    1, 1, 'graded', 95, 
    'Excellent work! Clean code with good documentation. Minor syntax improvements suggested.',
    1, 95.0
  );

  submissionInsert.run(
    2, 1, 'graded', 88,
    'Good understanding of control flow. Review nested loop performance.',
    1, 88.0
  );

  submissionInsert.run(
    4, 1, 'graded', 92,
    'Strong analysis skills. Big O notation correctly applied.',
    1, 92.0
  );

  // Add learning resources
  const resourceInsert = db.prepare(`
    INSERT INTO learning_resources (course_id, title, description, type, url)
    VALUES (?, ?, ?, ?, ?)
  `);

  resourceInsert.run(2, 'Binary Search Trees Tutorial', 'Comprehensive guide to BST', 'video', 'https://example.com/bst-tutorial');
  resourceInsert.run(1, 'Python Documentation', 'Official Python docs', 'document', 'https://docs.python.org');

  // Add resource views
  const viewInsert = db.prepare(`
    INSERT INTO resource_views (resource_id, student_id, progress)
    VALUES (?, ?, ?)
  `);

  viewInsert.run(1, 1, 100);

  // Add achievements
  const achievementInsert = db.prepare(`
    INSERT INTO achievements (student_id, title, description, type)
    VALUES (?, ?, ?, ?)
  `);

  achievementInsert.run(1, 'Week Streak Badge', 'Completed 7 days of learning', 'streak');
  achievementInsert.run(1, 'First Assignment', 'Submitted your first assignment', 'milestone');

  // Add course modules with enhanced fields
  const moduleInsert = db.prepare(`
    INSERT INTO course_modules (course_id, title, description, sequence, duration_weeks, learning_objectives, resources)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Modules for CS101 - Introduction to Programming (12 weeks total)
  moduleInsert.run(
    1, 'Python Fundamentals', 
    'Variables, data types, and basic operators',
    1, 2,
    JSON.stringify(['Understand variable declaration and types', 'Apply basic operators', 'Write simple Python programs']),
    JSON.stringify({ textbook: 'Chapter 1-2', videos: ['python-basics-1', 'python-basics-2'] })
  );
  
  moduleInsert.run(
    1, 'Control Flow',
    'If statements, loops, and conditional logic',
    2, 3,
    JSON.stringify(['Master conditional statements', 'Implement for and while loops', 'Use nested control structures']),
    JSON.stringify({ textbook: 'Chapter 3-4', videos: ['control-flow-1', 'loops-tutorial'] })
  );
  
  moduleInsert.run(
    1, 'Functions',
    'Defining and calling functions, parameters and return values',
    3, 3,
    JSON.stringify(['Define and call functions', 'Use parameters and return values', 'Understand scope and lifetime']),
    JSON.stringify({ textbook: 'Chapter 5', videos: ['functions-intro', 'lambda-functions'] })
  );
  
  moduleInsert.run(
    1, 'Data Structures',
    'Lists, dictionaries, tuples, and sets',
    4, 4,
    JSON.stringify(['Work with Python lists', 'Use dictionaries for key-value storage', 'Apply tuples and sets appropriately']),
    JSON.stringify({ textbook: 'Chapter 6-7', videos: ['data-structures-overview'] })
  );

  // Modules for CS301 - Data Structures & Algorithms (15 weeks total)
  moduleInsert.run(
    2, 'Algorithm Analysis',
    'Big O notation and complexity analysis',
    1, 2,
    JSON.stringify(['Analyze time complexity', 'Apply Big O notation', 'Compare algorithm efficiency']),
    JSON.stringify({ textbook: 'Chapter 1', papers: ['big-o-primer.pdf'] })
  );
  
  moduleInsert.run(
    2, 'Arrays and Linked Lists',
    'Linear data structures and operations',
    2, 3,
    JSON.stringify(['Implement array operations', 'Build linked lists from scratch', 'Analyze linear data structure performance']),
    JSON.stringify({ textbook: 'Chapter 2-3', videos: ['linked-lists-explained'] })
  );
  
  moduleInsert.run(
    2, 'Trees',
    'Binary trees, BST, and tree traversals',
    3, 4,
    JSON.stringify(['Understand tree structures', 'Implement BST operations', 'Master tree traversal algorithms']),
    JSON.stringify({ textbook: 'Chapter 4-5', videos: ['bst-tutorial', 'tree-traversals'] })
  );
  
  moduleInsert.run(
    2, 'Graphs',
    'Graph representations and algorithms',
    4, 3,
    JSON.stringify(['Represent graphs as adjacency lists/matrices', 'Implement graph traversal', 'Apply shortest path algorithms']),
    JSON.stringify({ textbook: 'Chapter 6', videos: ['graph-algorithms'] })
  );
  
  moduleInsert.run(
    2, 'Sorting Algorithms',
    'Quick sort, merge sort, and comparison',
    5, 3,
    JSON.stringify(['Implement quicksort and mergesort', 'Compare sorting algorithms', 'Choose appropriate sorting for scenarios']),
    JSON.stringify({ textbook: 'Chapter 7', videos: ['sorting-visualized'] })
  );

  // Modules for CS401 - Machine Learning (16 weeks total)
  moduleInsert.run(
    3, 'Introduction to ML',
    'Overview of machine learning concepts',
    1, 3,
    JSON.stringify(['Define machine learning', 'Distinguish supervised vs unsupervised learning', 'Understand ML workflow']),
    JSON.stringify({ textbook: 'Chapter 1', videos: ['ml-introduction'] })
  );
  
  moduleInsert.run(
    3, 'Supervised Learning',
    'Classification and regression techniques',
    2, 5,
    JSON.stringify(['Build classification models', 'Implement regression algorithms', 'Evaluate model performance']),
    JSON.stringify({ textbook: 'Chapter 2-4', notebooks: ['linear-regression.ipynb', 'classification.ipynb'] })
  );
  
  moduleInsert.run(
    3, 'Unsupervised Learning',
    'Clustering and dimensionality reduction',
    3, 4,
    JSON.stringify(['Apply k-means clustering', 'Use PCA for dimensionality reduction', 'Analyze unsupervised learning results']),
    JSON.stringify({ textbook: 'Chapter 5-6', notebooks: ['clustering.ipynb'] })
  );
  
  moduleInsert.run(
    3, 'Neural Networks',
    'Deep learning fundamentals',
    4, 4,
    JSON.stringify(['Understand neural network architecture', 'Train deep learning models', 'Apply CNNs and RNNs']),
    JSON.stringify({ textbook: 'Chapter 7-9', notebooks: ['neural-networks.ipynb', 'cnn-tutorial.ipynb'] })
  );

  // Add module completions for student
  const moduleCompletionInsert = db.prepare(`
    INSERT INTO module_completions (student_id, module_id, completed_at, score)
    VALUES (?, ?, ?, ?)
  `);

  // CS101 completions
  moduleCompletionInsert.run(1, 1, '2024-10-01', 95);
  moduleCompletionInsert.run(1, 2, '2024-10-08', 92);
  moduleCompletionInsert.run(1, 3, '2024-10-15', 88);
  // Module 4 not yet completed

  // CS301 completions
  moduleCompletionInsert.run(1, 5, '2024-10-05', 90);
  moduleCompletionInsert.run(1, 6, '2024-10-12', 85);
  // Modules 7-9 not yet completed

  // Add course schedules (validating credits = hours)
  const scheduleInsert = db.prepare(`
    INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, room, lecture_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // CS101 (3 credits = 3 hours): MWF 10:00-11:00
  scheduleInsert.run(1, 'Monday', '10:00', '11:00', 'Room 201', 'lecture');
  scheduleInsert.run(1, 'Wednesday', '10:00', '11:00', 'Room 201', 'lecture');
  scheduleInsert.run(1, 'Friday', '10:00', '11:00', 'Room 201', 'lecture');

  // CS301 (4 credits = 4 hours): MW 14:00-15:30, F 14:00-15:00
  scheduleInsert.run(2, 'Monday', '14:00', '15:30', 'Lab 105', 'lecture');
  scheduleInsert.run(2, 'Wednesday', '14:00', '15:30', 'Lab 105', 'lecture');
  scheduleInsert.run(2, 'Friday', '14:00', '15:00', 'Lab 105', 'lab');

  // CS401 (4 credits = 4 hours): TTh 13:00-15:00
  scheduleInsert.run(3, 'Tuesday', '13:00', '15:00', 'Room 301', 'lecture');
  scheduleInsert.run(3, 'Thursday', '13:00', '15:00', 'Room 301', 'lecture');

  // Assign lecturers to courses
  const lecturerInsert = db.prepare(`
    INSERT INTO course_lecturers (course_id, lecturer_id, assigned_by)
    VALUES (?, ?, ?)
  `);

  // Dr. Wilson (user_id=3) assigned to all courses by Admin (user_id=2)
  lecturerInsert.run(1, 3, 2);
  lecturerInsert.run(2, 3, 2);
  lecturerInsert.run(3, 3, 2);

  // Add lecture sessions (past 2 weeks + upcoming week)
  const lectureInsert = db.prepare(`
    INSERT INTO lectures (course_id, schedule_id, lecture_date, topic, conducted_by, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // CS101 lectures (Week 1: Oct 28-Nov 1)
  lectureInsert.run(1, 1, '2024-10-28', 'Variables and Data Types', 3, 'completed');
  lectureInsert.run(1, 2, '2024-10-30', 'Basic Operators', 3, 'completed');
  lectureInsert.run(1, 3, '2024-11-01', 'String Manipulation', 3, 'completed');

  // CS101 lectures (Week 2: Nov 4-8)
  lectureInsert.run(1, 1, '2024-11-04', 'If Statements', 3, 'completed');
  lectureInsert.run(1, 2, '2024-11-06', 'For Loops', 3, 'completed');
  lectureInsert.run(1, 3, '2024-11-08', 'While Loops', 3, 'completed');

  // CS101 lectures (Week 3: Nov 11-15 - upcoming)
  lectureInsert.run(1, 1, '2024-11-11', 'Function Basics', 3, 'scheduled');
  lectureInsert.run(1, 2, '2024-11-13', 'Parameters and Returns', 3, 'scheduled');
  lectureInsert.run(1, 3, '2024-11-15', 'Lambda Functions', 3, 'scheduled');

  // CS301 lectures (Week 1: Oct 28-Nov 1)
  lectureInsert.run(2, 4, '2024-10-28', 'Big O Notation', 3, 'completed');
  lectureInsert.run(2, 5, '2024-10-30', 'Time Complexity', 3, 'completed');
  lectureInsert.run(2, 6, '2024-11-01', 'Lab: Complexity Analysis', 3, 'completed');

  // CS301 lectures (Week 2: Nov 4-8)
  lectureInsert.run(2, 4, '2024-11-04', 'Array Operations', 3, 'completed');
  lectureInsert.run(2, 5, '2024-11-06', 'Linked Lists', 3, 'completed');
  lectureInsert.run(2, 6, '2024-11-08', 'Lab: Linked List Implementation', 3, 'completed');

  // Add attendance records for completed lectures
  const attendanceInsert = db.prepare(`
    INSERT INTO lecture_attendance (lecture_id, student_id, status, marked_by)
    VALUES (?, ?, ?, ?)
  `);

  // CS101 Week 1 attendance (John Doe - student_id=1)
  attendanceInsert.run(1, 1, 'present', 3);
  attendanceInsert.run(2, 1, 'present', 3);
  attendanceInsert.run(3, 1, 'late', 3);

  // CS101 Week 2 attendance
  attendanceInsert.run(4, 1, 'present', 3);
  attendanceInsert.run(5, 1, 'absent', 3);
  attendanceInsert.run(6, 1, 'present', 3);

  // CS301 Week 1 attendance
  attendanceInsert.run(10, 1, 'present', 3);
  attendanceInsert.run(11, 1, 'present', 3);
  attendanceInsert.run(12, 1, 'present', 3);

  // CS301 Week 2 attendance
  attendanceInsert.run(13, 1, 'late', 3);
  attendanceInsert.run(14, 1, 'present', 3);
  attendanceInsert.run(15, 1, 'excused', 3);

  // Add recommendations
  const recommendationInsert = db.prepare(`
    INSERT INTO recommendations (user_id, type, target_id, score, reason_text, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  recommendationInsert.run(
    1, 
    'course', 
    3, 
    0.92, 
    'Based on your strong performance in CS301 and interest in algorithms',
    JSON.stringify({ category: 'Computer Science', level: 'Advanced' })
  );

  recommendationInsert.run(
    1,
    'resource',
    1,
    0.88,
    'This tutorial complements your current coursework in Data Structures',
    JSON.stringify({ type: 'video', duration: '45 minutes' })
  );

  recommendationInsert.run(
    1,
    'resource',
    2,
    0.75,
    'Official documentation to deepen your Python knowledge',
    JSON.stringify({ type: 'document', difficulty: 'intermediate' })
  );

  console.log('Database seeded with demo data');
}

// Initialize on import
initDatabase().catch(console.error);

export default db;