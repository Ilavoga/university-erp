-- Migration: Update Semester System to Year + Month Range
-- Date: 2025-11-09
-- Description: Replace generic 'semester' TEXT field with year + month range fields
--              to support localized semester selection and calendar date calculations

-- Step 1: Add new columns for year and month range
ALTER TABLE courses ADD COLUMN semester_year INTEGER;
ALTER TABLE courses ADD COLUMN semester_start_month INTEGER; -- 1, 5, or 9
ALTER TABLE courses ADD COLUMN semester_end_month INTEGER;   -- 4, 8, or 12

-- Step 2: Migrate existing data from old 'semester' column
-- Assuming old format was like "Semester 1 2025", "Semester 2 2025", "Semester 3 2025"

UPDATE courses
SET 
  semester_year = CAST(substr(semester, -4) AS INTEGER),
  semester_start_month = CASE
    WHEN semester LIKE 'Semester 1%' OR semester LIKE '%January%' THEN 1
    WHEN semester LIKE 'Semester 2%' OR semester LIKE '%May%' THEN 5
    WHEN semester LIKE 'Semester 3%' OR semester LIKE '%September%' THEN 9
    ELSE 1 -- Default to January if unrecognized
  END,
  semester_end_month = CASE
    WHEN semester LIKE 'Semester 1%' OR semester LIKE '%January%' THEN 4
    WHEN semester LIKE 'Semester 2%' OR semester LIKE '%May%' THEN 8
    WHEN semester LIKE 'Semester 3%' OR semester LIKE '%September%' THEN 12
    ELSE 4 -- Default to April if unrecognized
  END
WHERE semester IS NOT NULL;

-- Step 3: Make new columns NOT NULL after migration
-- Note: In SQLite, we can't use ALTER TABLE to add NOT NULL constraint
--       We need to recreate the table. For now, we'll add validation via CHECK constraints.

-- Step 4: Add CHECK constraints for valid month ranges
-- SQLite doesn't support adding constraints to existing tables, so we document them here
-- These should be enforced in application code and future table recreations:
-- CHECK (semester_year >= 2025 AND semester_year <= 2026)
-- CHECK (semester_start_month IN (1, 5, 9))
-- CHECK (semester_end_month IN (4, 8, 12))
-- CHECK (
--   (semester_start_month = 1 AND semester_end_month = 4) OR
--   (semester_start_month = 5 AND semester_end_month = 8) OR
--   (semester_start_month = 9 AND semester_end_month = 12)
-- )

-- Step 5: Create indexes for efficient querying by semester
CREATE INDEX IF NOT EXISTS idx_courses_semester_year 
  ON courses(semester_year);

CREATE INDEX IF NOT EXISTS idx_courses_semester_months 
  ON courses(semester_start_month, semester_end_month);

CREATE INDEX IF NOT EXISTS idx_courses_full_semester 
  ON courses(semester_year, semester_start_month, semester_end_month);

-- Step 6: Drop old semester column (optional, can be done after verification)
-- ALTER TABLE courses DROP COLUMN semester;
-- Note: Commented out for safety. Run manually after verifying migration success.

-- Verification queries:
-- SELECT 
--   id,
--   name,
--   semester AS old_semester,
--   semester_year,
--   semester_start_month,
--   semester_end_month
-- FROM courses;

-- Expected results:
-- | id | name      | old_semester    | year | start | end |
-- |----|-----------|-----------------|------|-------|-----|
-- | 1  | COMP 120  | Semester 1 2025 | 2025 | 1     | 4   |
-- | 2  | COMP 223  | Semester 1 2025 | 2025 | 1     | 4   |
