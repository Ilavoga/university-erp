import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';

console.log('Migrating database...');
migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations applied successfully!');
