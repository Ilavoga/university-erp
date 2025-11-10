# Phase 2 Complete: Course Management API Endpoints

## Overview
Phase 2 implementation provides comprehensive REST API endpoints for the course management system, exposing all functionality from the repository layer via HTTP.

## API Endpoints Summary

### 📅 Schedule Management (5 endpoints)

#### 1. Get Course Schedule
```http
GET /api/courses/{id}/schedules
```
**Response:**
```json
{
  "schedules": [
    {
      "id": 1,
      "course_id": 1,
      "day_of_week": "Monday",
      "start_time": "10:00",
      "end_time": "11:00",
      "room": "Room 201",
      "lecture_type": "lecture"
    }
  ],
  "validation": {
    "valid": true,
    "totalHours": 3,
    "requiredCredits": 3,
    "message": "Schedule meets credit requirements"
  }
}
```

#### 2. Create Schedule Entry
```http
POST /api/courses/{id}/schedules
Content-Type: application/json

{
  "day_of_week": "Monday",
  "start_time": "10:00",
  "end_time": "11:00",
  "room": "Room 201",
  "lecture_type": "lecture"
}
```
**Validations:**
- Checks room conflicts (same room, overlapping times)
- Checks faculty conflicts (lecturer double-booked)
- Returns 409 Conflict if collision detected

#### 3. Update Schedule Entry
```http
PUT /api/courses/{id}/schedules/{scheduleId}
Content-Type: application/json

{
  "start_time": "11:00",
  "end_time": "12:00"
}
```

#### 4. Delete Schedule Entry
```http
DELETE /api/courses/{id}/schedules/{scheduleId}
```

#### 5. Get Weekly Timetable
```http
GET /api/timetable
GET /api/timetable?lecturerId=3
```
**Response:**
```json
{
  "timetable": [
    {
      "day": "Monday",
      "schedules": [
        {
          "id": 1,
          "course_name": "Introduction to Programming",
          "course_code": "CS101",
          "lecturer_name": "Dr. Wilson",
          "start_time": "10:00",
          "end_time": "11:00",
          "room": "Room 201"
        }
      ]
    }
  ],
  "type": "master"
}
```

### 👨‍🏫 Lecturer Assignment (4 endpoints)

#### 1. Get Course Lecturers
```http
GET /api/courses/{id}/lecturers
```

#### 2. Assign Lecturer to Course
```http
POST /api/courses/{id}/lecturers
Content-Type: application/json

{
  "lecturer_id": 3,
  "assigned_by": 2
}
```
**Validations:**
- User must have role='faculty'
- Prevents duplicate assignments
- Returns 409 if already assigned

#### 3. Remove Lecturer Assignment
```http
DELETE /api/courses/{id}/lecturers?lecturerId=3
```

#### 4. Get Lecturer's Courses
```http
GET /api/lecturers/{id}/courses
```
**Response:**
```json
{
  "lecturer_id": 3,
  "courses": [
    {
      "course_id": 1,
      "course_code": "CS101",
      "course_name": "Introduction to Programming",
      "credits": 3,
      "assigned_at": "2024-10-01T00:00:00.000Z"
    }
  ],
  "workload": {
    "total_credits": 11,
    "course_count": 3
  }
}
```

### 📊 Admin Views (1 endpoint)

#### Get Assignment Overview
```http
GET /api/admin/assignments
GET /api/admin/assignments?view=workload
GET /api/admin/assignments?view=unassigned
```
**Views:**
- **default**: All courses with their lecturers
- **workload**: Faculty workload report (credits per lecturer)
- **unassigned**: Courses without assigned lecturers

### 📚 Lecture Management (5 endpoints)

#### 1. Get Lectures
```http
GET /api/lectures?courseId=1
GET /api/lectures?courseId=1&upcoming=true&limit=5
GET /api/lectures?lecturerId=3&startDate=2024-11-01&endDate=2024-11-30
```

#### 2. Create Lecture
```http
POST /api/lectures
Content-Type: application/json

{
  "course_id": 1,
  "schedule_id": 1,
  "lecture_date": "2024-11-18",
  "topic": "Advanced Functions",
  "conducted_by": 3,
  "status": "scheduled"
}
```

#### 3. Update Lecture
```http
PUT /api/lectures/{id}
Content-Type: application/json

{
  "topic": "Advanced Functions and Closures",
  "status": "completed"
}
```

#### 4. Delete Lecture
```http
DELETE /api/lectures/{id}
```
**Note:** Cascades to delete attendance records

#### 5. Auto-Generate Lectures
```http
POST /api/courses/{id}/lectures/generate
Content-Type: application/json

{
  "start_date": "2024-11-11",
  "end_date": "2024-12-20",
  "lecturer_id": 3
}
```
**Behavior:**
- Reads course schedule
- Creates lecture sessions for all scheduled days in date range
- Skips dates that already have lectures
- Returns count of lectures created

### ✅ Attendance Management (3 endpoints)

#### 1. Get Lecture Attendance
```http
GET /api/lectures/{id}/attendance
```

#### 2. Mark Attendance (Bulk)
```http
POST /api/lectures/{id}/attendance
Content-Type: application/json

{
  "attendance_records": [
    { "student_id": 1, "status": "present" },
    { "student_id": 2, "status": "late" },
    { "student_id": 3, "status": "absent" }
  ],
  "marked_by": 3
}
```
**Status Options:** `present`, `absent`, `late`, `excused`

**Auto-Update:** Recalculates progress for all affected students

**Response:**
```json
{
  "marked_count": 3,
  "updated_progress": [
    { "student_id": 1, "overall_progress": 87.5 },
    { "student_id": 2, "overall_progress": 82.0 }
  ]
}
```

#### 3. Get Student Attendance
```http
GET /api/students/{id}/attendance
GET /api/students/{id}/attendance?courseId=1
```
**Response:**
```json
{
  "attendance": {
    "student_id": 1,
    "course_id": 1,
    "total_lectures": 6,
    "present_count": 4,
    "late_count": 1,
    "absent_count": 1,
    "excused_count": 0,
    "attendance_percentage": 75.0
  }
}
```

### 📈 Attendance Reports (1 endpoint)

#### Get Course Attendance Report
```http
GET /api/courses/{id}/attendance
```
**Response:**
```json
{
  "course_id": 1,
  "report": [
    {
      "student_id": 1,
      "total_lectures": 6,
      "present_count": 4,
      "late_count": 1,
      "absent_count": 1,
      "excused_count": 0,
      "attendance_percentage": 75.0
    }
  ],
  "summary": {
    "total_students": 1,
    "average_attendance": 75.0,
    "students_at_risk": 1,
    "excellent_attendance": 0
  }
}
```

### 📖 Module Management (4 endpoints)

#### 1. Get Course Modules
```http
GET /api/courses/{id}/modules
```

#### 2. Create Module
```http
POST /api/courses/{id}/modules
Content-Type: application/json

{
  "title": "Introduction to Variables",
  "description": "Learn about variables and data types",
  "sequence": 1,
  "duration_weeks": 2,
  "learning_objectives": [
    "Understand variable declaration",
    "Apply basic operators"
  ],
  "resources": {
    "textbook": "Chapter 1-2",
    "videos": ["intro-video-1"]
  }
}
```

#### 3. Update Module
```http
PUT /api/courses/{id}/modules/{moduleId}
Content-Type: application/json

{
  "duration_weeks": 3,
  "learning_objectives": [
    "Understand variable declaration",
    "Apply basic operators",
    "Debug variable errors"
  ]
}
```

#### 4. Delete Module
```http
DELETE /api/courses/{id}/modules/{moduleId}
```

#### 5. Complete Module (Student)
```http
POST /api/courses/{id}/modules/{moduleId}
Content-Type: application/json

{
  "student_id": 1,
  "score": 95
}
```
**Auto-Update:** Recalculates student progress

**Response:**
```json
{
  "id": 10,
  "student_id": 1,
  "module_id": 5,
  "score": 95,
  "updated_progress": {
    "overall_progress": 88.5,
    "module_progress": 60.0
  }
}
```

### 📝 Grading (1 endpoint)

#### Grade Submission
```http
POST /api/submissions/{id}/grade
Content-Type: application/json

{
  "score": 95,
  "feedback": "Excellent work! Clean code with good documentation."
}
```
**Auto-Calculations:**
- Calculates percentage: `(score / total_points) × 100`
- Updates submission status to 'graded'
- Recalculates student progress

**Response:**
```json
{
  "id": 1,
  "score": 95,
  "percentage": 95.0,
  "feedback": "Excellent work!",
  "status": "graded",
  "updated_progress": {
    "overall_progress": 90.5,
    "assignment_progress": 85.0,
    "quiz_progress": 88.0
  }
}
```

### 📊 Progress Tracking (3 endpoints)

#### 1. Get Student Progress
```http
GET /api/students/{id}/progress
GET /api/students/{id}/progress?courseId=1
```
**Response (Detailed):**
```json
{
  "progress": {
    "student_id": 1,
    "course_id": 1,
    "course_name": "Introduction to Programming",
    "course_code": "CS101",
    "components": {
      "module_progress": 75.0,
      "assignment_progress": 66.67,
      "attendance_progress": 75.0,
      "quiz_progress": 88.0
    },
    "overall_progress": 74.17,
    "total_modules": 4,
    "completed_modules": 3,
    "total_assignments": 3,
    "submitted_assignments": 2,
    "average_grade": 91.5,
    "quiz_average": 88.0,
    "attendance_stats": {
      "total_lectures": 6,
      "present_count": 4,
      "late_count": 1,
      "absent_count": 1,
      "excused_count": 0,
      "attendance_percentage": 75.0
    }
  }
}
```

#### 2. Get Course Gradebook
```http
GET /api/courses/{id}/gradebook
```
**Response:**
```json
{
  "course_id": 1,
  "gradebook": [
    {
      "student_id": 1,
      "student_number": "STU001",
      "student_name": "John Doe",
      "email": "john.doe@university.edu",
      "overall_progress": 74.17,
      "components": {
        "module_progress": 75.0,
        "assignment_progress": 66.67,
        "attendance_progress": 75.0,
        "quiz_progress": 88.0
      },
      "average_grade": 91.5,
      "quiz_average": 88.0,
      "attendance_percentage": 75.0,
      "assignments": [
        {
          "id": 1,
          "title": "Python Basics Assignment",
          "assignment_type": "homework",
          "total_points": 100,
          "score": 95,
          "submission_percentage": 95.0,
          "status": "graded"
        }
      ]
    }
  ],
  "summary": {
    "total_students": 1,
    "average_overall_progress": 74.17,
    "average_module_progress": 75.0,
    "average_assignment_progress": 66.67,
    "average_attendance": 75.0,
    "average_quiz_score": 88.0,
    "students_at_risk": 0
  }
}
```

#### 3. Get At-Risk Students
```http
GET /api/courses/{id}/at-risk
GET /api/courses/{id}/at-risk?threshold=60
```
**Response:**
```json
{
  "course_id": 1,
  "threshold": 50,
  "count": 0,
  "students": []
}
```
**Weak Areas Detected:**
- Modules < 50%
- Assignments < 50%
- Attendance < 75%
- Quizzes < 60%

## Progress Calculation Formula

```
Overall Progress = (Module × 0.25) + (Assignment × 0.40) + (Attendance × 0.20) + (Quiz × 0.15)

Where:
- Module Progress = completed_modules / total_modules × 100
- Assignment Progress = submitted_assignments / total_assignments × 100
- Attendance Progress = (present + late×0.5) / (total - excused) × 100
- Quiz Progress = AVG(quiz_scores)
```

## Auto-Update Triggers

Progress is automatically recalculated when:
1. **Submission graded** → Updates assignment % and quiz % (if quiz)
2. **Attendance marked** → Updates attendance %
3. **Module completed** → Updates module %

All three trigger overall progress recalculation.

## Error Handling

### Common Status Codes
- **200 OK** - Successful GET request
- **201 Created** - Successful POST request
- **400 Bad Request** - Missing/invalid parameters
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Room/faculty conflict, duplicate assignment
- **500 Internal Server Error** - Server-side error

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### Conflict Response Format
```json
{
  "error": "Room conflict detected",
  "conflict": {
    "type": "room",
    "conflicting_schedule": { /* schedule details */ },
    "message": "Room 201 is already booked..."
  }
}
```

## API Files Created

### Schedule Management
- `src/app/api/courses/[id]/schedules/route.ts` - GET, POST
- `src/app/api/courses/[id]/schedules/[scheduleId]/route.ts` - PUT, DELETE
- `src/app/api/timetable/route.ts` - GET

### Lecturer Assignments
- `src/app/api/courses/[id]/lecturers/route.ts` - GET, POST, DELETE
- `src/app/api/lecturers/[id]/courses/route.ts` - GET
- `src/app/api/admin/assignments/route.ts` - GET

### Lectures & Attendance
- `src/app/api/lectures/route.ts` - GET, POST
- `src/app/api/lectures/[id]/route.ts` - PUT, DELETE
- `src/app/api/lectures/[id]/attendance/route.ts` - GET, POST
- `src/app/api/students/[id]/attendance/route.ts` - GET
- `src/app/api/courses/[id]/attendance/route.ts` - GET (report)
- `src/app/api/courses/[id]/lectures/generate/route.ts` - POST

### Module Management
- `src/app/api/courses/[id]/modules/route.ts` - GET, POST
- `src/app/api/courses/[id]/modules/[moduleId]/route.ts` - PUT, DELETE, POST (complete)

### Grading & Progress
- `src/app/api/submissions/[id]/grade/route.ts` - POST
- `src/app/api/students/[id]/progress/route.ts` - GET
- `src/app/api/courses/[id]/gradebook/route.ts` - GET
- `src/app/api/courses/[id]/at-risk/route.ts` - GET

## Testing Examples

### 1. Create Weekly Schedule
```bash
# Add Monday lecture
curl -X POST http://localhost:3000/api/courses/1/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": "Monday",
    "start_time": "10:00",
    "end_time": "11:00",
    "room": "Room 201",
    "lecture_type": "lecture"
  }'
```

### 2. Generate Lectures for Semester
```bash
curl -X POST http://localhost:3000/api/courses/1/lectures/generate \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-11-11",
    "end_date": "2024-12-20",
    "lecturer_id": 3
  }'
```

### 3. Mark Attendance
```bash
curl -X POST http://localhost:3000/api/lectures/1/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "attendance_records": [
      {"student_id": 1, "status": "present"}
    ],
    "marked_by": 3
  }'
```

### 4. Grade Assignment
```bash
curl -X POST http://localhost:3000/api/submissions/1/grade \
  -H "Content-Type: application/json" \
  -d '{
    "score": 95,
    "feedback": "Excellent work!"
  }'
```

### 5. View Student Progress
```bash
curl http://localhost:3000/api/students/1/progress?courseId=1
```

### 6. Get Class Gradebook
```bash
curl http://localhost:3000/api/courses/1/gradebook
```

## Status: ✅ Phase 2 Complete

All 25+ API endpoints have been implemented with:
- ✅ Full CRUD operations
- ✅ Automatic progress calculation
- ✅ Conflict detection (room, faculty)
- ✅ Validation (credits = hours)
- ✅ Error handling with proper status codes
- ✅ Type safety with TypeScript
- ✅ No compilation errors

**Total Files Created:** 18 API route files

**Ready for Phase 3:** UI Components
