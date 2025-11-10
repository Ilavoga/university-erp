const Database = require('better-sqlite3');
const db = new Database('./university.db');

console.log('🔄 Migrating course_modules table...\n');

try {
  // Check current schema
  const currentColumns = db.prepare('PRAGMA table_info(course_modules)').all();
  console.log('Current columns:', currentColumns.map(c => c.name).join(', '));

  // Add missing columns if they don't exist
  const columnNames = currentColumns.map(c => c.name);

  if (!columnNames.includes('duration_weeks')) {
    console.log('Adding duration_weeks column...');
    db.prepare('ALTER TABLE course_modules ADD COLUMN duration_weeks INTEGER').run();
  }

  if (!columnNames.includes('learning_objectives')) {
    console.log('Adding learning_objectives column...');
    db.prepare('ALTER TABLE course_modules ADD COLUMN learning_objectives TEXT').run();
  }

  if (!columnNames.includes('resources')) {
    console.log('Adding resources column...');
    db.prepare('ALTER TABLE course_modules ADD COLUMN resources TEXT').run();
  }

  console.log('\n✅ Migration complete!\n');

  // Show updated schema
  const updatedColumns = db.prepare('PRAGMA table_info(course_modules)').all();
  console.log('Updated schema:');
  updatedColumns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ' DEFAULT ' + col.dflt_value : ''}`);
  });

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
