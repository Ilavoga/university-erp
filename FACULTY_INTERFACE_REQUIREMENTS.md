# Faculty Course Management - Interface Requirements Review

**Date:** November 9, 2025  
**Issue:** Faculty seeing student-style course detail page instead of management interface

---

## Current Problem

The screenshot shows a faculty member viewing a course detail page with:
- Module Completion: 0/1 (student-centric metric)
- Assignments: 0/0 graded (passive view)
- Current Grade: N/A (student metric)
- Predicted Grade: N/A (student metric)
- Course Modules section (read-only list)
- Assignments section (empty table)

**This is a STUDENT view, not a FACULTY management interface!**

---

## Required Faculty Course Management Interface

### Page: `/dashboard/faculty/courses/[id]`

Faculty should see a **management dashboard** with these tabs/sections:

### 1. **Overview Tab** (Default)
**Purpose:** Quick summary and key actions

**Metrics Cards:**
- Total Enrolled Students (e.g., "25 students")
- Lectures Scheduled (e.g., "8/13 weeks")
- Assignments/Quizzes (e.g., "1/2 issued" - max 2 per semester)
- Exam Scheduled (e.g., "Not scheduled" or "Final: Week 15")
- Average Class Grade (e.g., "78.5%")
- At-Risk Students (e.g., "3 students <60%")

**Quick Actions:**
- Schedule Lecture
- Create Assignment/Quiz
- Schedule Exam
- View Student List
- Export Gradebook

---

### 2. **Schedule Tab**
**Purpose:** Manage weekly lectures for the semester

**Features:**
- **Calendar View:** 13-week teaching period + 3-week exam period
- **Week-by-Week List:**
  - Week 1: Module 1 - "Introduction to Programming" (Mon 10-1 PM, Room 301) ✅ Completed
  - Week 2: Module 1 - "Control Structures" (Mon 10-1 PM, Room 301) 🕐 Upcoming
  - Week 3: (Not scheduled) [+ Schedule Lecture]
- **Auto-Schedule Button:** Generate full 13-week schedule
- **Actions per Lecture:**
  - Edit (change time/location)
  - Mark Attendance
  - Cancel/Reschedule
  - View Attendance Report

**Display for each lecture:**
- Week number
- Module name
- Date & time
- Location (Room or Online link)
- Status (Scheduled/Completed/Cancelled)
- Attendance (e.g., "22/25 present")

---

### 3. **Assignments & Quizzes Tab**
**Purpose:** Manage assessments that contribute to 30% of final grade

**Key Rule:** Maximum 2 assignments/quizzes per semester, each worth 15 marks (30 total)

**Features:**
- **Current Assessments Table:**
  | Title | Type | Due Date | Weight | Submitted | Graded | Avg Score | Actions |
  |-------|------|----------|--------|-----------|--------|-----------|---------|
  | Midterm Quiz | Quiz | Week 7 | 15% | 22/25 | 18/22 | 82% | Grade/Edit/Delete |
  | Final Project | Assignment | Week 12 | 15% | 0/25 | 0/0 | - | Edit/Delete |

- **Create Button:** Opens dialog to create new assignment/quiz
- **Validation:** System prevents creating more than 2 per semester
- **Type Selection:**
  - **Assignment:** File upload allowed, extended deadline
  - **Quiz:** Text/multiple choice, shorter duration
  - Both worth 15 marks (fixed)

**Grading Interface:**
- Click "Grade" → Opens submission list
- For each student:
  - View submitted file/answers
  - Score input (0-15)
  - Written feedback
  - Publish grade button
- Bulk actions: Download all, Grade all

---

### 4. **Exams Tab**
**Purpose:** Manage physical exams that contribute to 70% of final grade

**Key Rules:**
- Exams must be scheduled in weeks 14-16 (exam period)
- Physical location required
- Manual score input (no auto-grading)
- Attendance tracking mandatory

**Features:**
- **Exam Schedule:**
  - Midterm Exam (if any) - Week 7-8
  - Final Exam - Week 15
  - Practical Exam - Week 16

- **Create Exam Dialog:**
  - Exam Type: Midterm/Final/Practical
  - Date: Dropdown (only weeks 14-16 for finals)
  - Time: 3-hour slot selection
  - Location: Room number (physical only)
  - Duration: Minutes input
  - Max Score: 70 marks (for final)
  - Instructions: Rich text editor
  - Materials Allowed: Checklist

- **Attendance Tracking:**
  - Student list with checkboxes
  - Seat assignments
  - Check-in time
  - Mark: Present/Absent/Excused
  - Bulk actions

- **Results Upload:**
  - Manual entry per student: Score out of 70
  - Or CSV bulk upload
  - Auto-calculate percentage
  - Letter grade assignment
  - Comments field
  - Publish all button

**Exam Results Display:**
| Student | Attendance | Score | Percentage | Grade | Status |
|---------|------------|-------|------------|-------|--------|
| John Doe | Present | 58/70 | 83% | B+ | Published |
| Jane Smith | Absent | - | - | - | Not graded |

---

### 5. **Attendance Tab**
**Purpose:** Track and manage student attendance for all lectures

**Features:**
- **Summary Statistics:**
  - Total Lectures: 8 completed, 5 upcoming
  - Average Attendance: 88%
  - Students with <75%: 3 (flagged)

- **Lecture-by-Lecture View:**
  - Week 1 (Jan 6): 23/25 present, 2 absent
  - Week 2 (Jan 13): 25/25 present
  - [Click to view/edit attendance]

- **Student-by-Student View:**
  | Student | Present | Late | Absent | Excused | Rate | Status |
  |---------|---------|------|--------|---------|------|--------|
  | John Doe | 7 | 1 | 0 | 0 | 100% | ✅ Good |
  | Jane Smith | 5 | 0 | 2 | 1 | 71% | ⚠️ At Risk |

- **Mark Attendance Dialog:**
  - Select lecture date
  - Student list with status dropdowns
  - Bulk actions: Mark all present
  - Late time input
  - Notes field for excused absences
  - Save button

---

### 6. **Students Tab**
**Purpose:** View enrolled students and their individual progress

**Features:**
- **Student List Table:**
  | Name | Student ID | Overall Grade | Module Progress | Assignment Progress | Attendance | Status |
  |------|------------|---------------|-----------------|---------------------|------------|--------|
  | John Doe | STU001 | 85% | 7/8 (88%) | 2/2 (92%) | 100% | ✅ On Track |
  | Jane Smith | STU002 | 58% | 4/8 (50%) | 1/2 (60%) | 71% | ⚠️ At Risk |

- **Click Student → Detail View:**
  - Full breakdown of grades
  - Module completion timeline
  - Assignment scores
  - Attendance record
  - Performance chart
  - Action: Send message, Flag for counseling

- **Filters:**
  - At Risk (<60%)
  - Low Attendance (<75%)
  - Missing Submissions
  - All Students

---

### 7. **Gradebook Tab**
**Purpose:** Comprehensive view of all grades and calculations

**Features:**
- **Grade Calculation Display:**
  ```
  Final Grade Formula:
  = (Assignment 1 + Assignment 2) × 0.30 + (Exam Score) × 0.70
  = (12/15 + 14/15) × 0.30 + (58/70) × 0.70
  = 26/30 × 0.30 + 82.9% × 0.70
  = 25.9% + 58.0%
  = 83.9% (B+)
  ```

- **Full Gradebook Table:**
  | Student | Assign 1 | Assign 2 | A&Q Total | Exam | Final | Grade |
  |---------|----------|----------|-----------|------|-------|-------|
  | John | 12/15 | 14/15 | 26/30 | 58/70 | 84% | B+ |
  | Jane | 10/15 | 9/15 | 19/30 | 42/70 | 63% | D |

- **Export Options:**
  - Download CSV
  - Print PDF
  - Share with department

- **Statistics:**
  - Class Average
  - Grade Distribution (A, B, C, D, F counts)
  - Highest/Lowest scores
  - Pass rate

---

## Comparison: Student vs Faculty Views

### Student View (Current - Wrong for Faculty)
❌ Module Completion: 0/1 (passive metric)  
❌ Assignments: 0/0 graded (no action)  
❌ Current Grade: N/A (recipient view)  
❌ Predicted Grade: N/A (forecast)  
❌ Course Modules: Read-only list  
❌ Assignments: Empty table (no management)

### Faculty View (Required)
✅ **Overview:** Metrics, quick actions  
✅ **Schedule:** 13-week lecture calendar with attendance  
✅ **Assignments:** Create, grade, manage (max 2, 15 marks each)  
✅ **Exams:** Schedule (weeks 14-16), attendance, results (70 marks)  
✅ **Attendance:** Track all lectures, flag at-risk students  
✅ **Students:** Individual progress, intervention actions  
✅ **Gradebook:** Full calculation (30% A&Q + 70% exam)

---

## Grading System Details

### Assignment/Quiz Component (30% of Final Grade)
- **Maximum:** 2 per semester
- **Weight:** 15 marks each (30 total)
- **Types:**
  - **Assignment:** File upload, longer deadline, project-based
  - **Quiz:** In-system, shorter, knowledge check
- **Both worth same:** 15 marks
- **Calculation:** (A1 + A2) / 30 × 0.30 = Assignment component

### Exam Component (70% of Final Grade)
- **Type:** Physical only (no online exams)
- **Scheduling:** Must be in weeks 14-16 (exam period)
- **Attendance:** Mandatory tracking
- **Scoring:** Manual entry (0-70 marks)
- **Calculation:** Exam Score / 70 × 0.70 = Exam component

### Final Grade
```typescript
finalGrade = (assignmentTotal / 30 × 0.30) + (examScore / 70 × 0.70)

Example:
- Assignment 1: 12/15
- Assignment 2: 14/15
- Total: 26/30
- Component: 26/30 × 0.30 = 0.26 (26%)

- Final Exam: 58/70
- Component: 58/70 × 0.70 = 0.58 (58%)

- Final Grade: 26% + 58% = 84% (B+)
```

---

## Implementation Priority

### Phase 1: Core Faculty Interface (HIGH PRIORITY)
1. **Create Faculty Course Hub Page:** `/dashboard/faculty/courses/[id]`
2. **Tabs:** Overview, Schedule, Assignments, Exams, Attendance, Students, Gradebook
3. **Route Protection:** Only accessible by faculty/admin assigned to course

### Phase 2: Schedule Management (HIGH PRIORITY)
4. **Schedule Tab:** Week-by-week lecture list
5. **Create Lecture Dialog:** Module selection, date/time, location
6. **Auto-Schedule:** Generate 13-week plan
7. **Attendance Marking:** Per-lecture student checklist

### Phase 3: Assignment System (HIGH PRIORITY)
8. **Assignments Tab:** List view with create button
9. **Create Assignment Dialog:** Type (assignment/quiz), due date, instructions
10. **Validation:** Enforce max 2 per semester, 15 marks each
11. **Grading Interface:** Student submission list, score input, feedback
12. **File Upload:** Handle PDF, DOCX, TXT submissions

### Phase 4: Exam System (HIGH PRIORITY)
13. **Exams Tab:** Schedule, attendance, results
14. **Create Exam Dialog:** Date (weeks 14-16), location, instructions
15. **Attendance Tracking:** Student checklist, seat assignments
16. **Results Upload:** Manual entry or CSV import
17. **Grade Calculation:** Auto-compute final grades

### Phase 5: Supporting Features (MEDIUM PRIORITY)
18. **Students Tab:** Enrolled list, individual progress
19. **Gradebook Tab:** Full calculation view, export
20. **Analytics:** At-risk identification, performance trends

---

## Key Differences from Student View

| Feature | Student View | Faculty View |
|---------|--------------|--------------|
| **Purpose** | View my progress | Manage course |
| **Modules** | Check completion | Schedule lectures per module |
| **Assignments** | Submit work | Create, grade, manage |
| **Grades** | See my grade | Calculate all grades |
| **Attendance** | See my attendance | Mark all students |
| **Schedule** | View my classes | Create/edit lecture schedule |
| **Exams** | Take exam | Schedule, proctor, grade |
| **Actions** | Passive (view/submit) | Active (create/manage/grade) |

---

## Immediate Next Steps

1. **Create Faculty Course Hub:** New page at `/dashboard/faculty/courses/[id]`
2. **Implement Tab Navigation:** 7 tabs as outlined above
3. **Build Schedule Tab First:** Most critical for Phase 2 APIs
4. **Add Assignment Management:** Second priority (30% of grade)
5. **Implement Exam System:** Final priority (70% of grade)

---

## API Endpoints Already Built (Phase 2 - Complete)

✅ Lecture CRUD: `/api/courses/[id]/lectures`  
✅ Conflict Detection: `/api/timetable/check-conflicts`  
✅ Auto-Schedule: `/api/courses/[id]/auto-schedule`  
✅ Faculty Timetable: `/api/timetable/faculty/[id]`

**Ready to use for Schedule Tab!**

---

## API Endpoints Still Needed

### Assignments:
- POST `/api/courses/[id]/assignments` - Create assignment/quiz
- GET `/api/courses/[id]/assignments` - List all
- PUT `/api/assignments/[id]` - Update
- DELETE `/api/assignments/[id]` - Delete
- POST `/api/assignments/[id]/submit` - Student submission
- GET `/api/assignments/[id]/submissions` - View all submissions
- PUT `/api/submissions/[id]/grade` - Grade submission

### Exams:
- POST `/api/courses/[id]/exams` - Schedule exam
- POST `/api/exams/[id]/attendance` - Mark attendance
- POST `/api/exams/[id]/results` - Upload results
- GET `/api/exams/[id]/results` - View results

### Grades:
- GET `/api/courses/[id]/gradebook` - Full gradebook
- GET `/api/courses/[id]/grades/calculate` - Calculate final grades

---

## Conclusion

**Current State:** Faculty seeing student-style view (wrong!)

**Required:** Complete management interface with 7 tabs for creating lectures, assignments, exams, tracking attendance, and calculating grades.

**Grading System:**
- Max 2 assignments/quizzes per semester (15 marks each = 30 total)
- Physical exams in weeks 14-16 (70 marks)
- Final Grade = 30% (A&Q) + 70% (Exam)

**Next Action:** Build faculty course hub page with tab navigation and start with Schedule tab since Phase 2 APIs are ready.
