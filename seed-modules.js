const Database = require('better-sqlite3');
const db = new Database('./university.db');

console.log('📚 Adding sample course modules...\n');

try {
  // Get existing courses
  const courses = db.prepare('SELECT id, code, name FROM courses').all();
  console.log(`Found ${courses.length} courses:\n`);
  courses.forEach(c => console.log(`  ${c.code} - ${c.name}`));
  console.log();

  // Sample modules for different courses
  const modulesData = [
    // COMP 120: Structured Programming
    {
      course_id: 1,
      title: 'Introduction to Programming',
      sequence: 1,
      description: 'Basic programming concepts, variables, and data types',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Understand basic programming concepts',
        'Work with variables and data types',
        'Write simple programs'
      ])
    },
    {
      course_id: 1,
      title: 'Control Structures',
      sequence: 2,
      description: 'Conditional statements and loops',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Use if-else statements',
        'Implement loops (for, while)',
        'Apply nested control structures'
      ])
    },
    {
      course_id: 1,
      title: 'Functions and Procedures',
      sequence: 3,
      description: 'Creating and using functions, parameter passing',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Define and call functions',
        'Understand parameter passing',
        'Use return values effectively'
      ])
    },
    {
      course_id: 1,
      title: 'Arrays and Collections',
      sequence: 4,
      description: 'Working with arrays and basic data structures',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Declare and manipulate arrays',
        'Use multi-dimensional arrays',
        'Implement basic algorithms'
      ])
    },

    // COMP 232: Data Structures
    {
      course_id: 2,
      title: 'Introduction to Data Structures',
      sequence: 1,
      description: 'Overview of data structures and their importance',
      duration_weeks: 1,
      learning_objectives: JSON.stringify([
        'Understand abstraction and ADTs',
        'Analyze algorithm complexity',
        'Choose appropriate data structures'
      ])
    },
    {
      course_id: 2,
      title: 'Linked Lists',
      sequence: 2,
      description: 'Singly and doubly linked lists',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Implement linked lists',
        'Perform insertions and deletions',
        'Compare with arrays'
      ])
    },
    {
      course_id: 2,
      title: 'Stacks and Queues',
      sequence: 3,
      description: 'LIFO and FIFO data structures',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Implement stacks and queues',
        'Apply to real-world problems',
        'Understand applications'
      ])
    },
    {
      course_id: 2,
      title: 'Trees and Graphs',
      sequence: 4,
      description: 'Binary trees, BST, and graph fundamentals',
      duration_weeks: 3,
      learning_objectives: JSON.stringify([
        'Implement tree structures',
        'Traverse trees and graphs',
        'Apply tree/graph algorithms'
      ])
    },

    // COMP 335: Database Systems
    {
      course_id: 3,
      title: 'Database Fundamentals',
      sequence: 1,
      description: 'Introduction to databases and DBMS',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Understand database concepts',
        'Learn DBMS architecture',
        'Explore database models'
      ])
    },
    {
      course_id: 3,
      title: 'Relational Model & SQL',
      sequence: 2,
      description: 'Relational algebra and SQL queries',
      duration_weeks: 3,
      learning_objectives: JSON.stringify([
        'Write SQL queries',
        'Understand relational algebra',
        'Use joins effectively'
      ])
    },
    {
      course_id: 3,
      title: 'Database Design',
      sequence: 3,
      description: 'ER modeling and normalization',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Create ER diagrams',
        'Apply normalization',
        'Design efficient schemas'
      ])
    },
    {
      course_id: 3,
      title: 'Transactions and Concurrency',
      sequence: 4,
      description: 'ACID properties and concurrency control',
      duration_weeks: 2,
      learning_objectives: JSON.stringify([
        'Understand transactions',
        'Implement concurrency control',
        'Handle deadlocks'
      ])
    }
  ];

  // Insert modules
  const insertStmt = db.prepare(`
    INSERT INTO course_modules 
    (course_id, title, sequence, description, duration_weeks, learning_objectives, resources)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const module of modulesData) {
    try {
      insertStmt.run(
        module.course_id,
        module.title,
        module.sequence,
        module.description,
        module.duration_weeks,
        module.learning_objectives,
        null // resources
      );
      inserted++;
      console.log(`✓ Added: ${module.title}`);
    } catch (error) {
      console.log(`✗ Skipped: ${module.title} (may already exist)`);
    }
  }

  console.log(`\n✅ Successfully added ${inserted} modules!`);

  // Show summary
  const summary = db.prepare(`
    SELECT c.code, c.name, COUNT(cm.id) as module_count
    FROM courses c
    LEFT JOIN course_modules cm ON c.id = cm.course_id
    GROUP BY c.id
    ORDER BY c.code
  `).all();

  console.log('\n📊 Course Module Summary:');
  summary.forEach(s => {
    console.log(`  ${s.code}: ${s.module_count} module(s)`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
