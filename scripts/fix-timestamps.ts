/**
 * This script fixes timestamp values in the database by converting them to milliseconds
 * Run this after applying the schema migration
 */

import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = resolve(__dirname, '..', 'sqlite.db');
const db = new Database(dbPath);

console.log('🔧 Starting timestamp fix...');

// Tables and their timestamp columns that need fixing
const tables = [
  { name: 'user', columns: ['created_at', 'updated_at'] },
  { name: 'course', columns: ['created_at'] },
  { name: 'enrollment', columns: ['enrolled_at'] },
  { name: 'assignment', columns: ['due_date'] },
  { name: 'grade', columns: ['graded_at'] },
  { name: 'attendance', columns: ['date'] },
  { name: 'recommendation', columns: ['created_at'] },
  { name: 'activity_log', columns: ['created_at'] },
  { name: 'notification', columns: ['created_at'] },
  { name: 'hostel_block', columns: ['created_at'] },
  { name: 'hostel_room', columns: ['created_at'] },
  { name: 'room_booking', columns: ['created_at'] },
  { name: 'external_listing', columns: ['created_at'] },
  { name: 'listing_inquiry', columns: ['created_at'] },
];

db.exec('PRAGMA foreign_keys = OFF;');

try {
  db.exec('BEGIN TRANSACTION;');

  for (const table of tables) {
    console.log(`\n📋 Processing table: ${table.name}`);
    
    for (const column of table.columns) {
      // Check if the column exists and has data
      const checkQuery = `SELECT COUNT(*) as count FROM ${table.name} WHERE ${column} IS NOT NULL AND ${column} > 0`;
      const result = db.prepare(checkQuery).get() as { count: number };
      
      if (result.count > 0) {
        console.log(`  ├─ Fixing ${column} (${result.count} rows)`);
        
        // Update timestamps that are too small (likely in seconds) to milliseconds
        // Unix epoch in seconds is around 1.7 billion, in milliseconds it's around 1.7 trillion
        // So any value less than 100 billion is probably in seconds
        const updateQuery = `
          UPDATE ${table.name}
          SET ${column} = CASE
            WHEN ${column} < 100000000000 AND ${column} > 0 THEN ${column} * 1000
            WHEN ${column} = 0 THEN (unixepoch() * 1000)
            ELSE ${column}
          END
          WHERE ${column} IS NOT NULL
        `;
        
        const info = db.prepare(updateQuery).run();
        console.log(`  └─ Updated ${info.changes} rows`);
      } else {
        console.log(`  └─ No data in ${column}, skipping`);
      }
    }
  }

  db.exec('COMMIT;');
  console.log('\n✅ Timestamp fix completed successfully!');
} catch (error) {
  db.exec('ROLLBACK;');
  console.error('\n❌ Error fixing timestamps:', error);
  process.exit(1);
} finally {
  db.exec('PRAGMA foreign_keys = ON;');
  db.close();
}
