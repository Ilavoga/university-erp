// Seed modules for existing courses
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'university.db');
const db = new Database(dbPath);

try {
  console.log('Starting module seeding...');
  
  // Get existing courses
  const courses = db.prepare('SELECT id, code, name FROM courses').all();
  console.log('Found courses:', courses);
  
  if (courses.length === 0) {
    console.log('No courses found. Please create courses first.');
    process.exit(0);
  }
  
  const moduleInsert = db.prepare(`
    INSERT INTO course_modules (course_id, title, description, sequence)
    VALUES (?, ?, ?, ?)
  `);
  
  const assignmentInsert = db.prepare(`
    INSERT INTO assignments (course_id, title, description, due_date, total_points)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  // Add modules for each course
  for (const course of courses) {
    console.log(`\nAdding modules for ${course.code} - ${course.name}...`);
    
    if (course.code === 'COMP 120') {
      // COMP 120: Structured Programming
      moduleInsert.run(
        course.id, 
        'Python Fundamentals', 
        'Variables, data types, and basic operators',
        1
      );
      
      moduleInsert.run(
        course.id, 
        'Control Flow',
        'If statements, loops, and conditional logic',
        2
      );
      
      moduleInsert.run(
        course.id, 
        'Functions',
        'Defining and calling functions, parameters and return values',
        3
      );
      
      moduleInsert.run(
        course.id, 
        'Data Structures',
        'Lists, dictionaries, tuples, and sets',
        4
      );
      
      console.log(`  Added 4 modules`);
      
      // Add assignments
      assignmentInsert.run(
        course.id,
        'Python Basics Assignment', 
        'Complete basic Python exercises',
        '2024-12-15', 
        100
      );
      
      assignmentInsert.run(
        course.id,
        'Control Flow Quiz',
        'Online quiz on if statements and loops',
        '2024-12-20',
        100
      );
      
      assignmentInsert.run(
        course.id,
        'Functions Project',
        'Build a calculator using functions',
        '2025-01-10',
        100
      );
      
      console.log(`  Added 3 assignments`);
      
    } else if (course.code === 'COMP 223') {
      // COMP 223: Fundamentals of Programming
      moduleInsert.run(
        course.id, 
        'Programming Basics', 
        'Introduction to programming concepts',
        1
      );
      
      moduleInsert.run(
        course.id, 
        'Object-Oriented Programming',
        'Classes, objects, and OOP principles',
        2
      );
      
      moduleInsert.run(
        course.id, 
        'File I/O and Error Handling',
        'Reading/writing files and exception handling',
        3
      );
      
      console.log(`  Added 3 modules`);
      
      // Add assignments
      assignmentInsert.run(
        course.id,
        'Hello World Variants',
        'Write programs in different programming paradigms',
        '2024-12-10',
        50
      );
      
      assignmentInsert.run(
        course.id,
        'OOP Design Project',
        'Design a class hierarchy for a library system',
        '2025-01-15',
        150
      );
      
      console.log(`  Added 2 assignments`);
    }
  }
  
  console.log('\n✅ Module seeding completed successfully!');
  
  // Verify
  const moduleCounts = db.prepare(`
    SELECT c.code, c.name, COUNT(m.id) as module_count, COUNT(a.id) as assignment_count
    FROM courses c
    LEFT JOIN course_modules m ON c.id = m.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    GROUP BY c.id
  `).all();
  
  console.log('\nCourse summary:');
  console.table(moduleCounts);
  
} catch (error) {
  console.error('Error seeding modules:', error);
  process.exit(1);
} finally {
  db.close();
}
