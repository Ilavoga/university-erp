
# API Testing Guide

## Quick Test Commands

### 1. Test Schedule Management

#### Get CS101 Schedule
```bash
curl http://localhost:3001/api/courses/1/schedules
```

#### Get Weekly Timetable
```bash
curl http://localhost:3001/api/timetable
```

#### Get Lecturer Timetable
```bash
curl http://localhost:3001/api/timetable?lecturerId=3
```

### 2. Test Lecturer Assignments

#### Get Course Lecturers
```bash
curl http://localhost:3001/api/courses/1/lecturers
```

#### Get Lecturer Courses & Workload
```bash
curl http://localhost:3001/api/lecturers/3/courses
```

#### Get Admin Overview
```bash
curl http://localhost:3001/api/admin/assignments?view=workload
```

### 3. Test Lecture & Attendance

#### Get Course Lectures
```bash
curl http://localhost:3001/api/lectures?courseId=1
```

#### Get Upcoming Lectures
```bash
curl http://localhost:3001/api/lectures?courseId=1&upcoming=true&limit=5
```

#### Get Lecture Attendance
```bash
curl http://localhost:3001/api/lectures/1/attendance
```

#### Get Student Attendance (John Doe)
```bash
curl http://localhost:3001/api/students/1/attendance?courseId=1
```

#### Get Course Attendance Report
```bash
curl http://localhost:3001/api/courses/1/attendance
```

### 4. Test Module Management

#### Get Course Modules
```bash
curl http://localhost:3001/api/courses/1/modules
```

### 5. Test Progress & Grading

#### Get Student Progress (All Courses)
```bash
curl http://localhost:3001/api/students/1/progress
```

#### Get Student Progress (Specific Course)
```bash
curl http://localhost:3001/api/students/1/progress?courseId=1
```

#### Get Course Gradebook
```bash
curl http://localhost:3001/api/courses/1/gradebook
```

#### Get At-Risk Students
```bash
curl http://localhost:3001/api/courses/1/at-risk
```

## POST Request Examples

### Create Schedule Entry
```bash
curl -X POST http://localhost:3001/api/courses/1/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": "Tuesday",
    "start_time": "14:00",
    "end_time": "15:00",
    "room": "Room 202",
    "lecture_type": "tutorial"
  }'
```

### Assign Lecturer to Course
```bash
curl -X POST http://localhost:3001/api/courses/2/lecturers \
  -H "Content-Type: application/json" \
  -d '{
    "lecturer_id": 3,
    "assigned_by": 2
  }'
```

### Create Lecture
```bash
curl -X POST http://localhost:3001/api/lectures \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "lecture_date": "2024-11-18",
    "topic": "Advanced Functions",
    "conducted_by": 3,
    "status": "scheduled"
  }'
```

### Generate Lectures from Schedule
```bash
curl -X POST http://localhost:3001/api/courses/1/lectures/generate \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-11-18",
    "end_date": "2024-11-30",
    "lecturer_id": 3
  }'
```

### Mark Attendance (Bulk)
```bash
curl -X POST http://localhost:3001/api/lectures/1/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "attendance_records": [
      {"student_id": 1, "status": "present"}
    ],
    "marked_by": 3
  }'
```

### Create Module
```bash
curl -X POST http://localhost:3001/api/courses/1/modules \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Object-Oriented Programming",
    "description": "Learn OOP principles",
    "sequence": 5,
    "duration_weeks": 3,
    "learning_objectives": ["Understand classes", "Apply inheritance"],
    "resources": {"textbook": "Chapter 8"}
  }'
```

### Complete Module
```bash
curl -X POST http://localhost:3001/api/courses/1/modules/4 \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "score": 90
  }'
```

### Grade Submission
```bash
curl -X POST http://localhost:3001/api/submissions/2/grade \
  -H "Content-Type: application/json" \
  -d '{
    "score": 88,
    "feedback": "Good understanding of control flow. Review nested loop performance."
  }'
```

## Expected Results

### Student Progress Components
After running the test commands, John Doe's progress should show:
- **Module Progress**: 75% (3/4 modules completed)
- **Assignment Progress**: 66.67% (2/3 assignments submitted)
- **Attendance Progress**: 75% (6 lectures, 4 present + 1 late)
- **Quiz Progress**: 88% (1 quiz graded)
- **Overall Progress**: ~74.17%

### Attendance Calculation
- Present: 4 lectures = 100% credit each
- Late: 1 lecture = 50% credit
- Absent: 1 lecture = 0% credit
- Formula: (4 + 0.5) / 6 × 100 = 75%

### Gradebook Summary
- Total Students: 1
- Average Overall Progress: 74.17%
- Students At Risk (<50%): 0
- Excellent Attendance (>=90%): 0

## Testing Workflow

1. **Verify Schedule**: Confirm CS101 has 3 hours/week
2. **Check Lecturers**: Dr. Wilson assigned to CS101, CS301, CS401
3. **View Lectures**: Should see 9 CS101 lectures, 6 CS301 lectures
4. **Check Attendance**: John Doe has varied attendance (present, late, absent)
5. **View Progress**: Should calculate to ~74% overall
6. **Test Gradebook**: Full class overview with all components

## Notes
- All endpoints return JSON
- No authentication implemented (Phase 2 focus is functionality)
- Port may vary (3000 or 3001)
- Database is seeded on first run
