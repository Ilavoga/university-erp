# Phase 2 API Testing Guide

## Database State
- **Courses**: 2 (COMP 120, COMP 223) - both Semester 1 2025
- **Modules**: 8 total
  - COMP 120: 4 modules (8 weeks total)
  - COMP 223: 4 modules (8 weeks total)
- **Faculty**: Dr. Wilson (ID: 3)
- **Students**: 1 enrolled

## Semester 1 2025 Schedule
- **Start Date**: January 1, 2025 (Wednesday)
- **Weeks 1-13**: Teaching period
- **Weeks 14-16**: Examination period (April 2-22, 2025)

## Available Time Slots (Monday-Friday)
1. **Morning**: 7:00 AM - 10:00 AM
2. **Late Morning**: 10:00 AM - 1:00 PM
3. **Afternoon**: 1:00 PM - 4:00 PM
4. **Evening**: 4:00 PM - 7:00 PM

---

## API Endpoints

### 1. Create Single Lecture
**POST** `/api/courses/1/lectures`

Create a lecture for COMP 120 on Monday, Week 1 (Jan 6, 2025).

```json
{
  "module_id": 1,
  "lecture_date": "2025-01-06",
  "start_time": "10:00",
  "end_time": "13:00",
  "delivery_mode": "physical",
  "location": "Room 301",
  "topic": "Introduction to Programming Concepts",
  "conducted_by": 3
}
```

**Expected Response:**
```json
{
  "success": true,
  "lecture": {
    "id": 1,
    "module_title": "Introduction to Programming",
    "faculty_name": "Dr. Wilson",
    "week_number": 1,
    ...
  }
}
```

---

### 2. Create Online Lecture
**POST** `/api/courses/2/lectures`

Create an online lecture for COMP 223.

```json
{
  "module_id": 5,
  "lecture_date": "2025-01-07",
  "start_time": "13:00",
  "end_time": "16:00",
  "delivery_mode": "online",
  "meeting_link": "https://zoom.us/j/123456789",
  "topic": "Data Structures Overview",
  "conducted_by": 3
}
```

---

### 3. Get All Lectures (Flat List)
**GET** `/api/courses/1/lectures`

Returns all lectures for COMP 120 in chronological order.

**Expected Response:**
```json
{
  "lectures": [
    {
      "id": 1,
      "lecture_date": "2025-01-06",
      "start_time": "10:00",
      "module_title": "Introduction to Programming",
      "faculty_name": "Dr. Wilson",
      "attendance_count": 0,
      ...
    }
  ]
}
```

---

### 4. Get Lectures Grouped by Module
**GET** `/api/courses/1/lectures?groupBy=module`

Returns lectures organized by module.

**Expected Response:**
```json
{
  "lectures": [
    {
      "module": {
        "id": 1,
        "title": "Introduction to Programming",
        "sequence": 1
      },
      "lectures": [
        { /* lecture 1 */ },
        { /* lecture 2 */ }
      ]
    }
  ]
}
```

---

### 5. Check for Conflicts
**POST** `/api/timetable/check-conflicts`

Check if a proposed lecture has any scheduling conflicts.

```json
{
  "lecture_date": "2025-01-06",
  "start_time": "10:00",
  "end_time": "13:00",
  "faculty_id": 3,
  "course_id": 2,
  "location": "Room 301",
  "delivery_mode": "physical"
}
```

**Expected Response (With Conflict):**
```json
{
  "has_conflicts": true,
  "blocking_conflicts": 2,
  "warning_conflicts": 0,
  "conflicts": [
    {
      "type": "faculty",
      "severity": "error",
      "message": "Faculty already has a scheduled lecture",
      "details": {
        "conflicting_course": {
          "code": "COMP 120",
          "name": "Structured Programming"
        }
      }
    },
    {
      "type": "room",
      "severity": "error",
      "message": "Room 301 is already booked"
    }
  ],
  "suggestions": [
    {
      "date": "2025-01-06",
      "time_slot": "7:00 AM - 10:00 AM",
      "available": true
    }
  ]
}
```

**Expected Response (No Conflict):**
```json
{
  "has_conflicts": false,
  "blocking_conflicts": 0,
  "warning_conflicts": 0,
  "conflicts": [],
  "suggestions": []
}
```

---

### 6. Generate Auto-Schedule (Preview)
**POST** `/api/courses/1/auto-schedule`

Generate a complete 13-week schedule for COMP 120.

```json
{
  "faculty_id": 3,
  "preferences": {
    "preferred_days": [1, 3],
    "preferred_times": ["10:00"],
    "delivery_mode": "physical",
    "location": "Room 301"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "course": {
    "code": "COMP 120",
    "name": "Structured Programming",
    "semester": "Semester 1",
    "year": 2025
  },
  "summary": {
    "total_modules": 4,
    "total_weeks": 8,
    "lectures_scheduled": 8,
    "conflicts": 0
  },
  "schedule": [
    {
      "module_id": 1,
      "module_title": "Introduction to Programming",
      "week_number": 1,
      "lecture_date": "2025-01-06",
      "day_of_week": "Monday",
      "start_time": "10:00",
      "end_time": "13:00",
      "location": "Room 301",
      "topic": "Introduction to Programming - Week 1"
    },
    {
      "module_id": 1,
      "module_title": "Introduction to Programming",
      "week_number": 2,
      "lecture_date": "2025-01-13",
      "day_of_week": "Monday",
      "start_time": "10:00",
      "end_time": "13:00",
      "location": "Room 301",
      "topic": "Introduction to Programming - Week 2"
    }
    // ... 6 more lectures
  ],
  "conflicts": [],
  "next_steps": "Review the schedule and confirm to save all lectures"
}
```

---

### 7. Confirm and Save Schedule
**PUT** `/api/courses/1/auto-schedule`

Save the generated schedule to the database.

```json
{
  "faculty_id": 3,
  "schedule": [
    // Copy the entire schedule array from the POST response
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully scheduled 8 lectures",
  "lectures_created": 8
}
```

---

### 8. Update Lecture
**PUT** `/api/lectures/1`

Update an existing lecture (change time/location).

```json
{
  "start_time": "07:00",
  "end_time": "10:00",
  "location": "Room 205"
}
```

**Expected Response:**
```json
{
  "success": true,
  "lecture": {
    "id": 1,
    "start_time": "07:00",
    "end_time": "10:00",
    "location": "Room 205",
    ...
  }
}
```

---

### 9. Cancel Lecture
**DELETE** `/api/lectures/1`

Mark a lecture as cancelled (preserves attendance records).

**Expected Response:**
```json
{
  "success": true,
  "message": "Lecture cancelled successfully"
}
```

---

### 10. Get Faculty Timetable (Week View)
**GET** `/api/timetable/faculty/3?view=week&date=2025-01-06`

View Dr. Wilson's schedule for the week of January 6, 2025.

**Expected Response:**
```json
{
  "faculty": {
    "id": 3,
    "name": "Dr. Wilson",
    "email": "wilson@university.edu"
  },
  "stats": {
    "total_courses": 2,
    "total_lectures": 16,
    "completed_lectures": 0,
    "upcoming_lectures": 16,
    "cancelled_lectures": 0
  },
  "courses": [
    {
      "code": "COMP 120",
      "name": "Structured Programming",
      "total_lectures": 8,
      "completed_lectures": 0
    },
    {
      "code": "COMP 223",
      "name": "Fundamentals of Programming",
      "total_lectures": 8,
      "completed_lectures": 0
    }
  ],
  "lectures": [
    // All lectures in this week
  ],
  "next_lecture": {
    "course_code": "COMP 120",
    "lecture_date": "2025-01-06",
    "start_time": "10:00",
    ...
  },
  "grouped_views": {
    "by_date": {
      "2025-01-06": [/* lectures on Monday */],
      "2025-01-07": [/* lectures on Tuesday */]
    },
    "by_week": {
      "1": [/* all week 1 lectures */]
    }
  }
}
```

---

## Testing Scenarios

### Scenario 1: Basic Lecture Creation
1. Create single lecture for COMP 120
2. Verify with GET /api/courses/1/lectures
3. Check faculty timetable

### Scenario 2: Conflict Detection
1. Create lecture on Monday 10-1 PM in Room 301
2. Try to create another lecture at same time/room
3. Verify conflict response with suggestions

### Scenario 3: Auto-Schedule Full Semester
1. POST to auto-schedule for COMP 120 (preview)
2. Review generated schedule
3. PUT to confirm and save
4. Verify with GET lectures endpoint

### Scenario 4: Online vs Physical
1. Create physical lecture with location
2. Create online lecture with meeting link
3. Verify both appear in faculty timetable

### Scenario 5: Exam Period Protection
1. Try to schedule lecture in week 14-16
2. Verify exam_period conflict error
3. Confirm suggestions only show weeks 1-13

---

## Error Cases to Test

### Missing Required Fields
```json
POST /api/courses/1/lectures
{
  "module_id": 1,
  "lecture_date": "2025-01-06"
  // Missing start_time, end_time, etc.
}
// Expected: 400 "Missing required fields"
```

### Physical Without Location
```json
{
  "delivery_mode": "physical",
  "meeting_link": "https://zoom.us/..."
  // Missing location
}
// Expected: 400 "Location is required for physical classes"
```

### Online Without Meeting Link
```json
{
  "delivery_mode": "online",
  "location": "Room 301"
  // Missing meeting_link
}
// Expected: 400 "Meeting link is required for online classes"
```

### Module Duration Exceeds 13 Weeks
- Create course with modules totaling >13 weeks
- Try auto-schedule
- Expected: 400 with details

---

## Curl Examples

### Create Lecture
```bash
curl -X POST http://localhost:3000/api/courses/1/lectures \
  -H "Content-Type: application/json" \
  -d '{
    "module_id": 1,
    "lecture_date": "2025-01-06",
    "start_time": "10:00",
    "end_time": "13:00",
    "delivery_mode": "physical",
    "location": "Room 301",
    "conducted_by": 3
  }'
```

### Check Conflicts
```bash
curl -X POST http://localhost:3000/api/timetable/check-conflicts \
  -H "Content-Type: application/json" \
  -d '{
    "lecture_date": "2025-01-06",
    "start_time": "10:00",
    "end_time": "13:00",
    "faculty_id": 3,
    "course_id": 1,
    "location": "Room 301",
    "delivery_mode": "physical"
  }'
```

### Get Faculty Timetable
```bash
curl http://localhost:3000/api/timetable/faculty/3?view=week&date=2025-01-06
```

---

## Success Criteria

✅ All lectures can be created without conflicts  
✅ Conflict detection works for faculty, rooms, and students  
✅ Auto-schedule generates valid 13-week schedule  
✅ Exam period (weeks 14-16) blocks lecture scheduling  
✅ Faculty timetable shows correct groupings  
✅ Alternative time slots suggested when conflicts exist  
✅ Online and physical lectures handled differently  
✅ Lecture updates trigger conflict re-checking  
✅ Cancelled lectures preserve attendance data  
✅ Week numbers calculated correctly from semester start
