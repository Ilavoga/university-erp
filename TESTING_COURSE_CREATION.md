# Testing Guide: Course Creation with Localized Semester System

## What Changed

The course creation form now uses **Year + Month Range** selectors instead of hardcoded semester names like "Spring 2025" or "Semester 1".

### New Form Fields

**Before:**
- Single dropdown: "Semester" (Fall 2025, Spring 2026, Summer 2026)

**After:**
- **Academic Year** dropdown: 2025 or 2026 only
- **Semester Period** dropdown: January-April, May-August, September-December

## How to Test

### 1. Navigate to Courses Page

Go to: `http://localhost:3001/dashboard/courses`

### 2. Click "Create Course" Button

You should see a dialog with the new form fields.

### 3. Test Valid Input

Fill in the form:
- **Course Code**: TEST101
- **Credits**: 3
- **Course Name**: Test Course
- **Description**: Testing new semester system
- **Academic Year**: 2025
- **Semester Period**: January-April

Click "Create Course"

**Expected Result:**
- Course created successfully
- Displays as "2025 January-April" in the course list
- No errors in console

### 4. Test Year Validation

Try to create a course with year 2024 (in the past):
- Open browser console (F12)
- Manually edit the year value (if possible)

**Expected Result:**
- API returns 400 error: "Cannot create course in a past semester"
- Form displays error message

### 5. Test Past Semester Validation

Try to select:
- **Academic Year**: 2025
- **Semester Period**: January-April (already passed since current date is Nov 9, 2025)

**Expected Result:**
- API returns 400 error: "Cannot create course in a past semester"
- Form shows validation error

### 6. Test Valid Future Semester

Create course with:
- **Academic Year**: 2026
- **Semester Period**: January-April

**Expected Result:**
- Course created successfully
- Displays as "2026 January-April"

### 7. Verify Database Storage

Check the database directly:

```powershell
# Open database
$db = New-Object -TypeName System.Data.SQLite.SQLiteConnection
$db.ConnectionString = "Data Source=university.db"
$db.Open()

$cmd = $db.CreateCommand()
$cmd.CommandText = "SELECT code, name, semester, semester_year, semester_start_month, semester_end_month FROM courses WHERE code = 'TEST101'"

$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host "Course: $($reader['code'])"
    Write-Host "  Old semester field: $($reader['semester'])"
    Write-Host "  Year: $($reader['semester_year'])"
    Write-Host "  Start month: $($reader['semester_start_month'])"
    Write-Host "  End month: $($reader['semester_end_month'])"
}

$db.Close()
```

**Expected Output:**
```
Course: TEST101
  Old semester field: 2026 January-April
  Year: 2026
  Start month: 1
  End month: 4
```

### 8. Verify Display Format

Look at the course card in the courses list.

**Expected Display:**
```
📅 2026 January-April
```

NOT:
- "Semester 1"
- "Spring 2026"
- "Fall 2025"

## API Testing with PowerShell

### Test POST /api/courses

```powershell
$body = @{
    code = "API101"
    name = "API Test Course"
    description = "Testing API with new format"
    credits = 3
    semesterYear = 2026
    semesterMonthRange = "May-August"
    facultyId = "3"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3001/api/courses" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "id": "4",
  "code": "API101",
  "name": "API Test Course",
  "description": "Testing API with new format",
  "facultyId": "3",
  "credits": 3,
  "semesterYear": 2026,
  "semesterStartMonth": 5,
  "semesterEndMonth": 8,
  "enrolledStudents": []
}
```

### Test Invalid Year

```powershell
$body = @{
    code = "BAD101"
    name = "Bad Course"
    credits = 3
    semesterYear = 2027  # Too far in future
    semesterMonthRange = "January-April"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3001/api/courses" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response:**
```json
{
  "error": "Year must be current year or next year"
}
```
HTTP Status: 400

### Test GET /api/courses

```powershell
$courses = Invoke-RestMethod -Uri "http://localhost:3001/api/courses"

$courses | ForEach-Object {
    Write-Host "$($_.code): $($_.semesterYear) $(
        switch ($_.semesterStartMonth) {
            1 { 'January-April' }
            5 { 'May-August' }
            9 { 'September-December' }
        }
    )"
}
```

**Expected Output:**
```
COMP 120: 2025 January-April
COMP 223: 2025 January-April
CS101: 2025 September-December
TEST101: 2026 January-April
API101: 2026 May-August
```

## Validation Rules

### Year Validation
- ✅ Current year (2025)
- ✅ Next year (2026)
- ❌ Past years (2024)
- ❌ Years beyond next (2027+)

### Past Semester Validation
Based on current date: **November 9, 2025**

- ❌ 2025 January-April (already passed)
- ❌ 2025 May-August (already passed)
- ❌ 2025 September-December (currently active, but cannot create new)
- ✅ 2026 January-April
- ✅ 2026 May-August
- ✅ 2026 September-December

### Month Range Validation
- ✅ January-April (months 1-4)
- ✅ May-August (months 5-8)
- ✅ September-December (months 9-12)
- ❌ Any other combination

## Troubleshooting

### Issue: Form shows old "Semester" dropdown

**Solution:**
1. Hard refresh the page: Ctrl+Shift+R
2. Clear browser cache
3. Check that CreateCourseDialog.tsx was updated

### Issue: API returns "Missing required fields"

**Solution:**
- Verify request body includes `semesterYear` and `semesterMonthRange`
- NOT `semester`

### Issue: Semester displays as "undefined undefined"

**Solution:**
- Check that GET /api/courses returns `semesterYear`, `semesterStartMonth`, `semesterEndMonth`
- Verify CourseRepository queries include new fields

### Issue: Database errors about unknown columns

**Solution:**
- Run migration: `npx tsx scripts/migrate-semester-localization.ts`
- Verify columns exist: `PRAGMA table_info(courses)`

## Success Criteria

- [x] Form shows two dropdowns (Year + Month Range)
- [x] Year dropdown only shows 2025 and 2026
- [x] Month Range dropdown shows 3 options
- [x] Creating course stores year and months in database
- [x] Course list displays "2026 January-April" format
- [x] API validates year is current or next year
- [x] API prevents creating courses in past semesters
- [x] Database has semester_year, semester_start_month, semester_end_month columns
- [x] Existing courses migrated successfully

## Files Modified

1. **src/components/courses/CreateCourseDialog.tsx**
   - Updated form fields to use year + month range
   - Added validation before API call

2. **src/app/api/courses/route.ts**
   - Updated POST to accept new format
   - Added year and past semester validation
   - Updated GET to return new fields

3. **src/lib/repositories/CourseRepository.ts**
   - Updated interfaces to include new fields
   - Modified createCourse to handle both formats
   - Updated queries to select new columns

4. **src/lib/types.ts**
   - Added optional semester fields to Course interface

5. **src/app/dashboard/courses/page.tsx**
   - Added helper function to format semester display
   - Uses new format when available, falls back to old

6. **src/lib/semester-utils.ts**
   - New utility file with date calculation functions
   - Validation functions for year and past semesters

7. **Database (university.db)**
   - Added semester_year, semester_start_month, semester_end_month columns
   - Migrated existing courses

---

**Testing Status**: Ready for manual testing on http://localhost:3001
