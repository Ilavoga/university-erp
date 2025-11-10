// Test script for Phase 2 Lecture Management APIs
const Database = require('better-sqlite3');
const db = new Database('./university.db');

console.log('🧪 Testing Phase 2: Lecture Management APIs\n');

// Test 1: Check database state
console.log('📊 Current Database State:');
const courses = db.prepare('SELECT * FROM courses').all();
const modules = db.prepare('SELECT * FROM course_modules').all();
const faculty = db.prepare("SELECT * FROM users WHERE role = 'faculty'").all();

console.log(`  Courses: ${courses.length}`);
courses.forEach(c => {
  console.log(`    - ${c.code}: ${c.name} (${c.semester} ${c.year})`);
});

console.log(`\n  Modules: ${modules.length}`);
modules.forEach(m => {
  const course = courses.find(c => c.id === m.course_id);
  console.log(`    - ${course?.code}: ${m.title} (${m.duration_weeks} weeks)`);
});

console.log(`\n  Faculty: ${faculty.length}`);
faculty.forEach(f => {
  console.log(`    - ${f.name} (ID: ${f.id})`);
});

// Test 2: Check if we have faculty users
if (faculty.length === 0) {
  console.log('\n⚠️  No faculty users found. Creating test faculty...');
  
  // Create a test faculty user
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `).run('Dr. Jane Smith', 'jane.smith@university.edu', 'hashedpassword', 'faculty');
  
  console.log(`✅ Created faculty user (ID: ${result.lastInsertRowid})`);
}

// Test 3: Get semester start dates
console.log('\n📅 Semester Start Dates (2025):');
const semesterStarts = {
  'Semester 1': new Date(2025, 0, 1), // January
  'Semester 2': new Date(2025, 4, 1), // May
  'Semester 3': new Date(2025, 8, 1), // September
};

Object.entries(semesterStarts).forEach(([sem, date]) => {
  console.log(`  ${sem}: ${date.toDateString()}`);
});

// Test 4: Calculate week dates for Semester 1
console.log('\n📆 Week Dates for Semester 1 2025:');
const sem1Start = new Date(2025, 0, 1);

for (let week = 1; week <= 16; week++) {
  const weekStart = new Date(sem1Start);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const isPeriod = week >= 14 ? ' 🎓 EXAM PERIOD' : week <= 13 ? ' 📚 Teaching' : '';
  console.log(`  Week ${week.toString().padStart(2)}: ${weekStart.toDateString()} - ${weekEnd.toDateString()}${isPeriod}`);
}

// Test 5: Show available time slots
console.log('\n⏰ Available Time Slots:');
const timeSlots = [
  { start: '07:00', end: '10:00', label: '7:00 AM - 10:00 AM (Morning)' },
  { start: '10:00', end: '13:00', label: '10:00 AM - 1:00 PM (Late Morning)' },
  { start: '13:00', end: '16:00', label: '1:00 PM - 4:00 PM (Afternoon)' },
  { start: '16:00', end: '19:00', label: '4:00 PM - 7:00 PM (Evening)' }
];

timeSlots.forEach(slot => {
  console.log(`  ${slot.label}`);
});

// Test 6: Show current lectures
console.log('\n📝 Current Lectures:');
const lectures = db.prepare('SELECT * FROM lectures').all();
console.log(`  Total: ${lectures.length}`);

if (lectures.length > 0) {
  lectures.forEach(l => {
    const course = courses.find(c => c.id === l.course_id);
    console.log(`    - ${course?.code}: ${l.topic} on ${l.lecture_date} at ${l.start_time}`);
  });
} else {
  console.log('  (None scheduled yet)');
}

console.log('\n✅ Database Ready for API Testing!');
console.log('\n📋 Next Steps:');
console.log('  1. Start the development server: npm run dev');
console.log('  2. Test POST /api/courses/1/lectures (create lecture)');
console.log('  3. Test GET /api/courses/1/lectures?groupBy=module');
console.log('  4. Test POST /api/timetable/check-conflicts');
console.log('  5. Test POST /api/courses/1/auto-schedule (generate full schedule)');
console.log('  6. Test GET /api/timetable/faculty/1 (view faculty timetable)');

db.close();
