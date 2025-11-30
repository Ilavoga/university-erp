-- Manual migration to fix timestamp columns without recreating tables
-- This updates the default values for timestamp columns to use milliseconds

-- Note: SQLite doesn't support ALTER COLUMN, so we just update the defaults
-- The schema changes will take effect for new rows
-- Existing data will be fixed by the fix-timestamps.ts script

-- For now, this file documents the schema changes that were applied through Drizzle
-- The actual migration will be handled by updating existing data

-- Tables affected:
-- user: created_at, updated_at (changed from CURRENT_TIMESTAMP to unixepoch() * 1000)
-- course: created_at
-- enrollment: enrolled_at
-- assignment: due_date (no default change needed)
-- grade: graded_at
-- attendance: date (no default)
-- recommendation: created_at
-- activity_log: created_at
-- notification: created_at
-- hostel_block: created_at
-- hostel_room: created_at
-- room_booking: created_at
-- external_listing: created_at
-- listing_inquiry: created_at
