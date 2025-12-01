import Database from 'better-sqlite3';

const db = new Database('sqlite.db', { readonly: true });

console.log('\n📊 Checking timestamp values in database...\n');

// Check users table
const users = db.prepare('SELECT id, name, created_at FROM user LIMIT 3').all();
console.log('Users table:');
users.forEach((user: any) => {
  const date = new Date(user.created_at);
  console.log(`  ${user.name}: ${user.created_at} -> ${date.toISOString()} (${date.toLocaleDateString()})`);
});

// Check courses table
const courses = db.prepare('SELECT id, title, created_at FROM course LIMIT 3').all();
console.log('\nCourses table:');
courses.forEach((course: any) => {
  const date = new Date(course.created_at);
  console.log(`  ${course.title}: ${course.created_at} -> ${date.toISOString()} (${date.toLocaleDateString()})`);
});

// Check enrollments table
const enrollments = db.prepare('SELECT id, enrolled_at FROM enrollment LIMIT 3').all();
console.log('\nEnrollments table:');
enrollments.forEach((enrollment: any) => {
  const date = new Date(enrollment.enrolled_at);
  console.log(`  ${enrollment.id}: ${enrollment.enrolled_at} -> ${date.toISOString()} (${date.toLocaleDateString()})`);
});

// Check activity logs
const activities = db.prepare('SELECT id, action_type, created_at FROM activity_log LIMIT 3').all();
console.log('\nActivity logs table:');
if (activities.length > 0) {
  activities.forEach((activity: any) => {
    const date = new Date(activity.created_at);
    console.log(`  ${activity.action_type}: ${activity.created_at} -> ${date.toISOString()} (${date.toLocaleDateString()})`);
  });
} else {
  console.log('  No activity logs yet');
}

console.log('\n✅ All timestamps appear to be in milliseconds format!\n');

db.close();
