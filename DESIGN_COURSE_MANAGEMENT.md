# Course Management System Design

Date: 2025-11-05

## Overview
Design a comprehensive course management system enabling admins and faculty to manage courses, schedules, modules, assignments, and grading.

---

## 1. Database Schema Extensions

### 1.1 Weekly Schedule Table
```sql
CREATE TABLE course_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TEXT NOT NULL,  -- Format: 'HH:MM'
  end_time TEXT NOT NULL,    -- Format: 'HH:MM'
  room TEXT,
  lecture_type TEXT CHECK(lecture_type IN ('lecture', 'lab', 'tutorial', 'seminar')) DEFAULT 'lecture',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_schedules_course ON course_schedules(course_id);
CREATE INDEX idx_course_schedules_day ON course_schedules(day_of_week);
```

**Rationale**: Credits = weekly lecture hours. A 3-credit course = 3 hours/week. Schedule tracks when those hours occur.

### 1.2 Enhanced Course Modules Table
```sql
-- Already exists, but add these fields:
ALTER TABLE course_modules ADD COLUMN module_order INTEGER DEFAULT 0;
ALTER TABLE course_modules ADD COLUMN duration_weeks INTEGER DEFAULT 1;
ALTER TABLE course_modules ADD COLUMN learning_objectives TEXT;
ALTER TABLE course_modules ADD COLUMN resources TEXT; -- JSON array of resource links
ALTER TABLE course_modules ADD COLUMN faculty_id INTEGER REFERENCES users(id);
```

### 1.3 Enhanced Assignments Table
```sql
-- Already exists, but add these fields:
ALTER TABLE assignments ADD COLUMN module_id INTEGER REFERENCES course_modules(id);
ALTER TABLE assignments ADD COLUMN assignment_type TEXT CHECK(assignment_type IN ('homework', 'quiz', 'project', 'exam', 'lab')) DEFAULT 'homework';
ALTER TABLE assignments ADD COLUMN weight REAL DEFAULT 1.0; -- Percentage of final grade
ALTER TABLE assignments ADD COLUMN instructions TEXT;
ALTER TABLE assignments ADD COLUMN rubric TEXT; -- JSON grading rubric
```

### 1.4 Lecturer Assignments Table (Simplified)
```sql
CREATE TABLE course_lecturers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  lecturer_id INTEGER NOT NULL,
  assigned_by INTEGER REFERENCES users(id), -- Admin who assigned
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(course_id, lecturer_id)
);

CREATE INDEX idx_course_lecturers_course ON course_lecturers(course_id);
CREATE INDEX idx_course_lecturers_lecturer ON course_lecturers(lecturer_id);
```

### 1.5 Lecture Attendance Table
```sql
CREATE TABLE lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  schedule_id INTEGER REFERENCES course_schedules(id),
  lecture_date DATE NOT NULL,
  topic TEXT,
  conducted_by INTEGER REFERENCES users(id),
  status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE lecture_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lecture_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'absent',
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  marked_by INTEGER REFERENCES users(id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(lecture_id, student_id)
);

CREATE INDEX idx_lectures_course ON lectures(course_id);
CREATE INDEX idx_lectures_date ON lectures(lecture_date);
CREATE INDEX idx_attendance_lecture ON lecture_attendance(lecture_id);
CREATE INDEX idx_attendance_student ON lecture_attendance(student_id);
```

### 1.6 Enhanced Submissions for Progress Tracking
```sql
-- Extend submissions table to track contribution to progress
ALTER TABLE submissions ADD COLUMN contributes_to_progress INTEGER DEFAULT 1; -- Boolean flag
ALTER TABLE submissions ADD COLUMN submission_percentage REAL; -- Calculated as (score/total_points) * 100
```

---

## 2. User Roles & Permissions

### 2.1 Admin Permissions
- ✅ Create/Edit/Delete courses
- ✅ Assign lecturers to courses
- ✅ Set course schedules (weekly timetable)
- ✅ View all course analytics and attendance reports
- ✅ Approve course changes
- ❌ Cannot directly add modules/assignments (lecturer responsibility)

### 2.2 Lecturer Permissions
- ✅ View assigned courses
- ✅ Add/Edit/Delete modules for assigned courses
- ✅ Create/Edit/Delete assignments for assigned courses
- ✅ Create lecture sessions and mark attendance
- ✅ Grade student submissions
- ✅ Update module completion status
- ✅ View attendance reports
- ✅ Export grades and attendance
- ❌ Cannot change course schedules (admin only)
- ❌ Cannot assign other lecturers

### 2.3 Student Permissions
- ✅ View enrolled courses
- ✅ View course schedules
- ✅ View modules and assignments
- ✅ Submit assignments, lectures, and quizzes
- ✅ View grades and progress percentage
- ✅ View personal attendance metrics (percentage, late count, etc.)
- ✅ View lecture history
- ❌ Cannot view other students' attendance

---

## 3. API Endpoints Design

### 3.1 Schedule Management (Admin Only)
```
POST   /api/courses/{id}/schedules       - Create schedule entry
GET    /api/courses/{id}/schedules       - Get course schedule
PUT    /api/courses/{id}/schedules/{sid} - Update schedule entry
DELETE /api/courses/{id}/schedules/{sid} - Delete schedule entry
GET    /api/schedules/weekly             - Get weekly timetable (all courses)
```

### 3.2 Lecturer Assignment (Admin Only)
```
POST   /api/courses/{id}/lecturers       - Assign lecturer to course
GET    /api/courses/{id}/lecturers       - Get assigned lecturers
DELETE /api/courses/{id}/lecturers/{lid} - Remove lecturer assignment
GET    /api/lecturers/{id}/courses       - Get lecturer's assigned courses
```

### 3.3 Lecture & Attendance Management (Lecturer Only)
```
POST   /api/courses/{id}/lectures        - Create lecture session
GET    /api/courses/{id}/lectures        - List lectures
PUT    /api/lectures/{id}                - Update lecture
POST   /api/lectures/{id}/attendance     - Mark attendance (bulk)
GET    /api/lectures/{id}/attendance     - Get lecture attendance
GET    /api/courses/{id}/attendance/stats - Get course attendance statistics
GET    /api/students/{id}/attendance     - Get student's attendance across all courses
```

### 3.4 Module Management (Lecturer Only)
```
POST   /api/courses/{id}/modules         - Create module
GET    /api/courses/{id}/modules         - List modules
PUT    /api/courses/{id}/modules/{mid}   - Update module
DELETE /api/courses/{id}/modules/{mid}   - Delete module
POST   /api/modules/{id}/reorder         - Reorder modules
```

### 3.5 Assignment Management (Lecturer Only)
```
POST   /api/courses/{id}/assignments     - Create assignment
GET    /api/courses/{id}/assignments     - List assignments
PUT    /api/assignments/{id}             - Update assignment
DELETE /api/assignments/{id}             - Delete assignment
GET    /api/assignments/{id}/submissions - Get all submissions (lecturer view)
```

### 3.6 Progress Calculation (Auto-calculated)
```
GET    /api/students/{id}/progress/{courseId} - Get detailed progress breakdown
  Response includes:
  - Module completion: % of modules completed
  - Assignment completion: % of assignments submitted
  - Lecture attendance: % of lectures attended
  - Quiz scores: Average quiz performance
  - Overall progress: Weighted average of all components
```
```
POST   /api/courses/{id}/modules         - Create module
GET    /api/courses/{id}/modules         - List modules
PUT    /api/courses/{id}/modules/{mid}   - Update module
DELETE /api/courses/{id}/modules/{mid}   - Delete module
POST   /api/modules/{id}/reorder         - Reorder modules
```

### 3.4 Assignment Management (Faculty Only)
```
POST   /api/courses/{id}/assignments     - Create assignment
GET    /api/courses/{id}/assignments     - List assignments
PUT    /api/assignments/{id}             - Update assignment
DELETE /api/assignments/{id}             - Delete assignment
GET    /api/assignments/{id}/submissions - Get all submissions (faculty view)
```

### 3.5 Grading (Faculty Only)
```
POST   /api/submissions/{id}/grade       - Grade a submission
PUT    /api/submissions/{id}/grade       - Update grade
GET    /api/courses/{id}/grades          - Get grade book
POST   /api/courses/{id}/grades/export   - Export grades (CSV)
```

---

## 4. UI Components & Pages

### 4.1 Admin Dashboard
**Pages**:
1. `/dashboard/admin/courses` - Course management (CRUD)
2. `/dashboard/admin/courses/{id}/edit` - Edit course details
3. `/dashboard/admin/courses/{id}/schedule` - Weekly schedule builder
4. `/dashboard/admin/courses/{id}/faculty` - Faculty assignment interface
5. `/dashboard/admin/timetable` - Master weekly timetable view

**Components**:
- `ScheduleBuilder.tsx` - Drag-drop weekly schedule grid
- `FacultyAssignmentDialog.tsx` - Assign faculty modal
- `TimetableView.tsx` - Weekly calendar view
- `CourseFormDialog.tsx` - Create/Edit course form

### 4.2 Faculty Dashboard
**Pages**:
1. `/dashboard/faculty/courses` - My assigned courses
2. `/dashboard/faculty/courses/{id}` - Course management hub
3. `/dashboard/faculty/courses/{id}/modules` - Module manager
4. `/dashboard/faculty/courses/{id}/assignments` - Assignment manager
5. `/dashboard/faculty/courses/{id}/gradebook` - Grade book

**Components**:
- `ModuleEditor.tsx` - Create/edit module form
- `AssignmentEditor.tsx` - Create/edit assignment form
- `GradebookTable.tsx` - Spreadsheet-style grading
- `SubmissionGrader.tsx` - Individual submission grading view
- `RubricBuilder.tsx` - Create grading rubric

### 4.3 Enhanced Student Views
**Pages**:
1. `/dashboard/courses/{id}/schedule` - Weekly class schedule
2. `/dashboard/courses/{id}/syllabus` - Full syllabus view (modules + assignments)

---

## 5. Business Rules & Validation

### 5.1 Schedule Rules
1. **Credits = Weekly Hours**: A 3-credit course must have exactly 3 hours/week scheduled
2. **No Overlaps**: Same faculty cannot be scheduled at overlapping times
3. **Room Conflicts**: Same room cannot be double-booked
4. **Time Slots**: Classes in 30-minute increments (e.g., 9:00, 9:30, 10:00)
5. **Working Hours**: Classes between 8:00 AM - 8:00 PM

### 5.2 Module Rules
1. **Sequential Ordering**: Modules have explicit order (module_order field)
2. **Duration Validation**: Total module duration ≤ semester weeks (typically 16 weeks)
3. **Faculty Ownership**: Only assigned faculty can edit modules
4. **Pre-requisites**: Modules can reference previous modules

### 5.3 Assignment Rules
1. **Due Date Validation**: Due date must be within semester dates
2. **Weight Validation**: Total assignment weights per course should = 100%
3. **Module Association**: Assignments must link to a module
4. **Submission Window**: Define submission start/end dates
5. **Late Submission**: Define late penalty policy

### 5.4 Grading Rules
1. **Score Range**: 0 ≤ score ≤ total_points
2. **Grade Calculation**: Weighted average based on assignment weights
3. **Grade Lock**: Once published, grades can only be edited with reason
4. **Bulk Operations**: Lecturer can grade multiple submissions at once
5. **Rubric Enforcement**: If rubric exists, enforce rubric categories

### 5.5 Progress Calculation Rules
**Formula**: `Overall Progress = (Module × 0.25) + (Assignment × 0.40) + (Attendance × 0.20) + (Quiz × 0.15)`

**Component Calculations**:
1. **Module Completion (25% weight)**:
   - `module_percentage = (completed_modules / total_modules) × 100`
   - Module marked complete when all its assignments submitted

2. **Assignment Completion (40% weight)**:
   - `assignment_percentage = (submitted_assignments / total_assignments) × 100`
   - `average_score = AVG(score/total_points × 100)` for graded assignments
   - Contributes even if not graded yet (submission counts)

3. **Lecture Attendance (20% weight)**:
   - `attendance_percentage = (present_count + late_count × 0.5) / total_lectures × 100`
   - Late attendance counts as 50% credit
   - Excused absences excluded from denominator

4. **Quiz Performance (15% weight)**:
   - `quiz_percentage = AVG(quiz_scores)`
   - Only graded quizzes included
   - Type filter: `assignment_type = 'quiz'`

**Auto-Update Triggers**:
- Submit assignment → recalculate assignment + overall progress
- Mark attendance → recalculate attendance + overall progress
- Complete module → recalculate module + overall progress
- Grade quiz → recalculate quiz + overall progress

**Progress Thresholds**:
- 0-39%: At Risk (red)
- 40-59%: Needs Improvement (orange)
- 60-79%: Satisfactory (yellow)
- 80-89%: Good (blue)
- 90-100%: Excellent (green)

---

## 6. Repository Layer Design

### 6.1 ScheduleRepository
```typescript
interface CourseSchedule {
  id: number;
  course_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  lecture_type: string;
}

class ScheduleRepository {
  getCourseSchedule(courseId: number): CourseSchedule[]
  createScheduleEntry(data: CreateScheduleData): CourseSchedule
  updateScheduleEntry(id: number, data: Partial<CreateScheduleData>): CourseSchedule
  deleteScheduleEntry(id: number): void
  validateSchedule(courseId: number): ValidationResult // Check credits = hours
  checkRoomConflict(room: string, day: string, startTime: string, endTime: string): boolean
  checkFacultyConflict(facultyId: number, day: string, startTime: string, endTime: string): boolean
  getWeeklyTimetable(filters?: TimetableFilters): CourseSchedule[]
}
```

### 6.2 LecturerAssignmentRepository
```typescript
interface LecturerAssignment {
  id: number;
  course_id: number;
  lecturer_id: number;
  lecturer_name: string;
  assigned_at: string;
}

class LecturerAssignmentRepository {
  assignLecturer(courseId: number, lecturerId: number): LecturerAssignment
  removeLecturerAssignment(courseId: number, lecturerId: number): void
  getCourseLecturers(courseId: number): LecturerAssignment[]
  getLecturerCourses(lecturerId: number): CourseWithSchedule[]
  canManageCourse(lecturerId: number, courseId: number): boolean
}
```

### 6.3 AttendanceRepository
```typescript
interface Lecture {
  id: number;
  course_id: number;
  schedule_id: number | null;
  lecture_date: string;
  topic: string;
  conducted_by: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface AttendanceRecord {
  id: number;
  lecture_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at: string;
}

interface AttendanceMetrics {
  total_lectures: number;
  attended: number;
  late: number;
  absent: number;
  excused: number;
  attendance_percentage: number;
}

class AttendanceRepository {
  createLecture(courseId: number, data: CreateLectureData): Lecture
  markAttendance(lectureId: number, attendanceList: AttendanceData[]): void
  getStudentAttendance(studentId: number, courseId: number): AttendanceMetrics
  getLectureAttendance(lectureId: number): AttendanceRecord[]
  getCourseAttendanceReport(courseId: number): CourseAttendanceReport
}
```

### 6.3 AttendanceRepository
```typescript
interface Lecture {
  id: number;
  course_id: number;
  schedule_id: number | null;
  lecture_date: string;
  topic: string;
  conducted_by: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface AttendanceRecord {
  id: number;
  lecture_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at: string;
}

interface AttendanceMetrics {
  total_lectures: number;
  attended: number;
  late: number;
  absent: number;
  excused: number;
  attendance_percentage: number;
}

class AttendanceRepository {
  createLecture(courseId: number, data: CreateLectureData): Lecture
  markAttendance(lectureId: number, attendanceList: AttendanceData[]): void
  getStudentAttendance(studentId: number, courseId: number): AttendanceMetrics
  getLectureAttendance(lectureId: number): AttendanceRecord[]
  getCourseAttendanceReport(courseId: number): CourseAttendanceReport
}
```

### 6.4 ProgressCalculationRepository
```typescript
interface ProgressBreakdown {
  course_id: number;
  student_id: number;
  
  // Module progress (25% weight)
  total_modules: number;
  completed_modules: number;
  module_completion_percentage: number;
  
  // Assignment progress (40% weight)
  total_assignments: number;
  submitted_assignments: number;
  assignment_completion_percentage: number;
  average_assignment_score: number;
  
  // Attendance (20% weight)
  total_lectures: number;
  attended_lectures: number;
  attendance_percentage: number;
  
  // Quiz progress (15% weight)
  total_quizzes: number;
  completed_quizzes: number;
  average_quiz_score: number;
  
  // Overall weighted progress
  overall_progress_percentage: number;
}

class ProgressCalculationRepository {
  calculateProgress(studentId: number, courseId: number): ProgressBreakdown
  updateProgressOnSubmission(submissionId: number): void
  updateProgressOnModuleComplete(moduleId: number, studentId: number): void
  updateProgressOnAttendance(lectureId: number, studentId: number): void
  getProgressHistory(studentId: number, courseId: number): ProgressSnapshot[]
}
```
```typescript
interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string;
  module_order: number;
  duration_weeks: number;
  learning_objectives: string;
  resources: Resource[];
  faculty_id: number;
}

class ModuleRepository {
  createModule(courseId: number, data: CreateModuleData): Module
  updateModule(id: number, data: Partial<CreateModuleData>): Module
  deleteModule(id: number): void
  reorderModules(courseId: number, newOrder: number[]): void
  getCourseModules(courseId: number): Module[]
  validateModuleDuration(courseId: number): boolean // Check total weeks ≤ semester
}
```

### 6.4 AssignmentRepository
```typescript
interface Assignment {
  id: number;
  course_id: number;
  module_id: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  total_points: number;
  weight: number;
  assignment_type: string;
  rubric: GradingRubric;
}

class AssignmentRepository {
  createAssignment(courseId: number, data: CreateAssignmentData): Assignment
  updateAssignment(id: number, data: Partial<CreateAssignmentData>): Assignment
  deleteAssignment(id: number): void
  getCourseAssignments(courseId: number): Assignment[]
  validateAssignmentWeights(courseId: number): boolean // Check total = 100%
}
```

### 6.5 GradingRepository
```typescript
interface GradeEntry {
  submission_id: number;
  student_id: number;
  student_name: string;
  assignment_id: number;
  score: number;
  total_points: number;
  feedback: string;
  graded_by: number;
  graded_at: string;
}

class GradingRepository {
  gradeSubmission(submissionId: number, score: number, feedback: string, gradedBy: number): GradeEntry
  bulkGradeSubmissions(grades: BulkGradeData[]): GradeEntry[]
  getCourseGradebook(courseId: number): Gradebook
  exportGrades(courseId: number, format: 'csv' | 'xlsx'): Buffer
  calculateFinalGrade(studentId: number, courseId: number): number
}
```

---

## 7. Implementation Phases

### Phase 1: Database & Repositories (Week 1)
1. ✅ Create migration for new tables (schedules, faculty_assignments)
2. ✅ Enhance existing tables (modules, assignments)
3. ✅ Implement ScheduleRepository
4. ✅ Implement FacultyAssignmentRepository
5. ✅ Implement enhanced ModuleRepository
6. ✅ Implement enhanced AssignmentRepository
7. ✅ Implement GradingRepository
8. ✅ Add seed data for testing

### Phase 2: API Endpoints (Week 1-2)
1. ✅ Schedule management APIs
2. ✅ Faculty assignment APIs
3. ✅ Module management APIs
4. ✅ Assignment management APIs
5. ✅ Grading APIs
6. ✅ Add authorization middleware (check user role + permissions)

### Phase 3: Admin UI (Week 2-3)
1. ✅ Course schedule builder
2. ✅ Faculty assignment interface
3. ✅ Master timetable view
4. ✅ Course creation/editing forms

### Phase 4: Faculty UI (Week 3-4)
1. ✅ Faculty course dashboard
2. ✅ Module manager
3. ✅ Assignment creator/editor
4. ✅ Gradebook interface
5. ✅ Rubric builder

### Phase 5: Enhanced Student UI (Week 4)
1. ✅ Weekly schedule view
2. ✅ Syllabus view
3. ✅ Assignment detail pages

### Phase 6: Testing & Refinement (Week 5)
1. ✅ Unit tests for repositories
2. ✅ Integration tests for APIs
3. ✅ E2E tests for critical workflows
4. ✅ Performance optimization
5. ✅ Security audit

---

## 8. Validation Matrix

| Feature | Admin | Faculty | Student | Validation |
|---------|-------|---------|---------|------------|
| Create Course | ✅ | ❌ | ❌ | Code unique, credits > 0 |
| Set Schedule | ✅ | ❌ | ❌ | Hours = credits, no conflicts |
| Assign Faculty | ✅ | ❌ | ❌ | Faculty role = 'faculty' |
| Add Module | ❌ | ✅ | ❌ | Must be assigned to course |
| Create Assignment | ❌ | ✅ | ❌ | Module exists, weights valid |
| Grade Submission | ❌ | ✅ | ❌ | Score ≤ total_points |
| View Schedule | ✅ | ✅ | ✅ | Enrolled or assigned |
| Submit Assignment | ❌ | ❌ | ✅ | Enrolled, before due date |

---

## 9. Sample Data Models

### Weekly Schedule Example
```json
{
  "course_id": 1,
  "schedules": [
    {
      "day_of_week": "Monday",
      "start_time": "09:00",
      "end_time": "10:30",
      "room": "CS-101",
      "lecture_type": "lecture"
    },
    {
      "day_of_week": "Wednesday",
      "start_time": "14:00",
      "end_time": "15:30",
      "room": "CS-Lab-1",
      "lecture_type": "lab"
    }
  ]
}
```
**Total**: 3 hours/week (1.5h + 1.5h) for a 3-credit course ✅

### Module Structure Example
```json
{
  "id": 1,
  "course_id": 1,
  "title": "Introduction to Python",
  "description": "Basics of Python programming",
  "module_order": 1,
  "duration_weeks": 2,
  "learning_objectives": "Students will understand variables, data types, and control flow",
  "resources": [
    { "type": "video", "url": "https://example.com/python-intro" },
    { "type": "document", "url": "https://docs.python.org" }
  ],
  "faculty_id": 3
}
```

### Grading Rubric Example
```json
{
  "rubric": [
    { "category": "Code Quality", "points": 30, "description": "Clean, readable code" },
    { "category": "Functionality", "points": 50, "description": "Meets requirements" },
    { "category": "Documentation", "points": 20, "description": "Comments and README" }
  ],
  "total_points": 100
}
```

---

## 10. Next Steps

**Option A**: Implement Phase 1 (Database & Repositories)
- Create migration files
- Implement all 5 repositories
- Add comprehensive seed data
- Write repository unit tests

**Option B**: Implement Phase 2 (API Endpoints)
- Create all API routes
- Add authentication/authorization
- Validate business rules
- Test with Postman/Thunder Client

**Option C**: Implement Phase 3 (Admin UI)
- Build schedule builder component
- Create faculty assignment interface
- Implement timetable view

**Which phase should we start with? (Recommend A → B → C)**

