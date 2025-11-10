# Faculty & Admin Course Management - Implementation Plan (Revised)

**Date:** November 8, 2025  
**Focus:** Module-centric lecture scheduling with semester-based timetabling

---

## Academic Calendar Structure

### Semester System (3 periods/year)
Each semester is defined by:
- **Year:** Current year or next year only (e.g., 2025, 2026)
- **Semester Duration:** One of three 4-month periods:
  - **January - April** (16 weeks total)
  - **May - August** (16 weeks total)
  - **September - December** (16 weeks total)

**System automatically calculates:**
- Start date (1st day of starting month)
- End date (last day of ending month)
- Week boundaries (Monday-Sunday)
- Actual calendar dates for each of the 16 weeks

**Example Input:**
```
Year: 2025
Semester Duration: January - April
→ System calculates: Jan 1, 2025 - Apr 30, 2025
→ Week 1: Jan 1-5, 2025
→ Week 2: Jan 6-12, 2025
→ ... (16 weeks total)
```

### Student Progression
- **Duration:** 4 years (8 active semesters)
- **Pattern:** 2 consecutive semester periods → 1 period break → repeat
- **Flexible Start:** Student's first registered semester becomes their starting point
  - e.g., Student registers in September-December 2025 → Their 1st active semester
  - Next active: January-April 2026 → Their 2nd active semester
  - Break: May-August 2026 (no registration)
  - Resume: September-December 2026 → Their 3rd active semester
- **Course Load:** Maximum 8 courses per semester per student

### Course Scheduling (16-week semester)
- **Week 1-4:** Lectures (Module content)
- **Week 5:** Assessment 1 (Quiz or Assignment) - NO lecture, covers weeks 1-4
- **Week 6-9:** Lectures (Module content)
- **Week 10:** Assessment 2 (Quiz or Assignment) - NO lecture, covers weeks 6-9
- **Week 11-13:** Lectures (Module content for final exam)
- **Week 14-16:** Examination Period (Final exam, covers all material)

**Lecture Time:**
- Session Duration: 3 hours (one time slot)
- Available Days: Monday - Friday
- Time Slots: 7-10 AM, 10 AM-1 PM, 1-4 PM, 4-7 PM

**Assessment Scheduling:**
- Assessment 1: Week 5 (replaces lecture slot, 3-hour session)
- Assessment 2: Week 10 (replaces lecture slot, 3-hour session)
- Assessments are scheduled during regular class time
- No separate lecture on assessment weeks

**Key Constraint:**
- **Actual teaching weeks:** 11 weeks (13 total - 2 assessment weeks)
- **Modules must fit in:** Maximum 11 weeks of content
- **Example:** 11 modules × 1 week each OR 5 modules × 2 weeks + 1 module × 1 week
- **Semester Assignment:** Each course belongs to specific semester (Jan-Apr, May-Aug, Sep-Dec)

### Module-to-Week Mapping
- **Each module = 1-4 weeks** (based on `duration_weeks`)
- **Each week = 1 lecture session** (3 hours)
- **Total lecture weeks available:** 11 weeks (not 13!)
  - Weeks 1-4: 4 lecture weeks
  - Week 5: Assessment 1 (no lecture)
  - Weeks 6-9: 4 lecture weeks
  - Week 10: Assessment 2 (no lecture)
  - Weeks 11-13: 3 lecture weeks
- **Auto-schedule validation:**
  - Must check: Total module duration_weeks ≤ 11
  - If total > 11: Error - "Course content exceeds available lecture time"
- **Week 14-16:** Reserved for final examinations (physical, 70% of grade)

---

## Core Concept: Lectures → Modules (1:1 Relationship)

**Key Design Decision:**
- Each lecture session teaches **exactly one module**
- Module topic becomes the lecture topic
- **1 module = 1-4 weeks**, **1 week = 1 lecture (3 hours)**
- Each lecture can be **online** (with meeting link) or **physical** (with location)

---

## 1. Database Schema Updates

### 1.1 Enhance `courses` Table (Semester Assignment)
```sql
-- Add semester field to courses
ALTER TABLE courses ADD COLUMN semester TEXT CHECK(semester IN ('Semester 1', 'Semester 2', 'Semester 3'));
ALTER TABLE courses ADD COLUMN year INTEGER DEFAULT 1;  -- 1, 2, 3, 4
ALTER TABLE courses ADD COLUMN max_students INTEGER DEFAULT 50;

-- Courses are now semester-specific
-- e.g., "COMP 120" offered in "Semester 1" for "Year 1" students
```

### 1.2 Enhance `students` Table (Track Academic Progress)
```sql
-- Add student academic tracking
ALTER TABLE students ADD COLUMN entry_semester TEXT;  -- 'Semester 1', 'Semester 2', 'Semester 3'
ALTER TABLE students ADD COLUMN entry_year INTEGER DEFAULT 2025;
ALTER TABLE students ADD COLUMN current_year INTEGER DEFAULT 1;  -- 1-4
ALTER TABLE students ADD COLUMN current_semester TEXT;  -- Current active semester
```

### 1.3 Enhance `lectures` Table
```sql
-- Add module_id as REQUIRED field
ALTER TABLE lectures ADD COLUMN module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE;

-- Add delivery mode and location fields
ALTER TABLE lectures ADD COLUMN delivery_mode TEXT CHECK(delivery_mode IN ('online', 'physical')) NOT NULL DEFAULT 'physical';
ALTER TABLE lectures ADD COLUMN location TEXT;      -- Physical: 'Room 101', Online: NULL
ALTER TABLE lectures ADD COLUMN meeting_link TEXT;  -- Online: Zoom/Teams link, Physical: NULL
ALTER TABLE lectures ADD COLUMN start_time TEXT NOT NULL DEFAULT '07:00';
ALTER TABLE lectures ADD COLUMN end_time TEXT NOT NULL DEFAULT '10:00';
ALTER TABLE lectures ADD COLUMN week_number INTEGER;  -- Week 1-16 of semester

-- Update indexes
CREATE INDEX idx_lectures_module ON lectures(module_id);
CREATE INDEX idx_lectures_datetime ON lectures(lecture_date, start_time);
CREATE INDEX idx_lectures_week ON lectures(week_number);
```

**Rationale:**
- `module_id` links each lecture to a specific course module
- `topic` field can be auto-populated from module title or customized
- `delivery_mode` determines if it's online or in-person
- `week_number` tracks which week of semester (1-16)
- Time slots enable conflict detection

### 1.2 Course Restrictions Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS course_restrictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  major TEXT NOT NULL,
  year_level INTEGER,  -- NULL = all years
  semester TEXT,       -- '2024-Fall', '2025-Spring'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(course_id, major, year_level, semester)
);

CREATE INDEX idx_course_restrictions_course ON course_restrictions(course_id);
CREATE INDEX idx_course_restrictions_major ON course_restrictions(major);
```

**Purpose:** Limit course enrollment to specific majors/year levels

### 1.3 Examination Schedule Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS exam_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  exam_type TEXT CHECK(exam_type IN ('midterm', 'final', 'practical')) DEFAULT 'final',
  exam_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,  -- Exam duration
  location TEXT NOT NULL,             -- Physical location (always physical)
  max_capacity INTEGER,               -- Room capacity
  instructions TEXT,
  materials_allowed TEXT,             -- JSON: ['calculator', 'notes']
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS exam_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_schedule_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('present', 'absent', 'excused')) DEFAULT 'absent',
  seat_number TEXT,
  check_in_time DATETIME,
  check_out_time DATETIME,
  marked_by INTEGER,
  notes TEXT,
  FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id),
  UNIQUE(exam_schedule_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_schedule_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL,
  percentage REAL GENERATED ALWAYS AS ((score / max_score) * 100) STORED,
  grade TEXT,  -- A+, A, B+, etc.
  uploaded_by INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  comments TEXT,
  FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  UNIQUE(exam_schedule_id, student_id)
);

CREATE INDEX idx_exam_schedules_course ON exam_schedules(course_id);
CREATE INDEX idx_exam_schedules_date ON exam_schedules(exam_date, start_time);
CREATE INDEX idx_exam_attendance_exam ON exam_attendance(exam_schedule_id);
CREATE INDEX idx_exam_attendance_student ON exam_attendance(student_id);
CREATE INDEX idx_exam_results_exam ON exam_results(exam_schedule_id);
CREATE INDEX idx_exam_results_student ON exam_results(student_id);
```

**Purpose:**
- Schedule exams during the 3-week examination period (weeks 14-16)
- Track physical attendance for exams (always in-person)
- Upload and manage exam results
- Prevent exam conflicts for students

### 1.4 Enhanced Assignments Table
```sql
ALTER TABLE assignments ADD COLUMN assignment_type TEXT 
  CHECK(assignment_type IN ('assignment', 'quiz', 'exam')) DEFAULT 'assignment';
ALTER TABLE assignments ADD COLUMN weight REAL DEFAULT 15.0;  -- Fixed: 15% each (30% total max)
ALTER TABLE assignments ADD COLUMN scheduled_week INTEGER;     -- Week 5 or Week 10
ALTER TABLE assignments ADD COLUMN allows_file_submission INTEGER DEFAULT 1;
ALTER TABLE assignments ADD COLUMN file_types TEXT;           -- JSON: ['pdf', 'docx']
ALTER TABLE assignments ADD COLUMN max_file_size INTEGER DEFAULT 10485760; -- 10MB
ALTER TABLE assignments ADD COLUMN instructions TEXT;
ALTER TABLE assignments ADD COLUMN grading_rubric TEXT;       -- JSON structure
ALTER TABLE assignments ADD COLUMN coverage_weeks TEXT;       -- JSON: [1,2,3,4] or [6,7,8,9]
```

**Assessment Scheduling Rules:**
- **Maximum 2 assessments per course per semester** (quiz or assignment, interchangeable)
- **Assessment 1:** Scheduled in Week 5
  - Replaces regular lecture in week 5 time slot
  - Covers content from weeks 1-4
  - Worth 15% of final grade (15 marks)
  - Duration: 3 hours (uses lecture time)
- **Assessment 2:** Scheduled in Week 10
  - Replaces regular lecture in week 10 time slot
  - Covers content from weeks 6-9
  - Worth 15% of final grade (15 marks)
  - Duration: 3 hours (uses lecture time)

**Grading Formula:**
- **Assessments (Assignment/Quiz)** = 30% of final grade (15% + 15%)
- **Final Exam (Week 14-16)** = 70% of final grade
- **Total:** 100%

### 1.4 Assignment Submissions Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_path TEXT,          -- Server path: /uploads/assignments/[id]/[student]/file.pdf
  file_name TEXT,          -- Original filename
  file_size INTEGER,       -- Bytes
  submission_text TEXT,    -- For non-file submissions
  status TEXT CHECK(status IN ('submitted', 'graded', 'late', 'resubmitted')) DEFAULT 'submitted',
  score REAL,              -- Points earned
  max_score REAL,          -- Total points possible
  feedback TEXT,
  graded_by INTEGER,       -- Faculty user_id
  graded_at DATETIME,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_status ON assignment_submissions(status);
```

---

## 2. Timetabling System

### 2.1 Semester & Time Configuration
```typescript
// Academic year structure
const SEMESTERS = {
  SEMESTER_1: {
    name: 'Semester 1',
    months: ['January', 'February', 'March', 'April'],
    startMonth: 1, // January
    endMonth: 4,   // April
    weeks: 16
  },
  SEMESTER_2: {
    name: 'Semester 2', 
    months: ['May', 'June', 'July', 'August'],
    startMonth: 5,
    endMonth: 8,
    weeks: 16
  },
  SEMESTER_3: {
    name: 'Semester 3',
    months: ['September', 'October', 'November', 'December'],
    startMonth: 9,
    endMonth: 12,
    weeks: 16
  }
} as const;

// Student progression pattern (example for Sep start)
const PROGRESSION_PATTERN = {
  'Sep 2025': { year: 1, semester: 1 },
  'Jan 2026': { year: 1, semester: 2 },
  // May 2026: Break
  'Sep 2026': { year: 2, semester: 1 },
  'Jan 2027': { year: 2, semester: 2 },
  // May 2027: Break
  // ... continues for 4 years = 8 active semesters
};

// 3-hour time slots (one per course per week)
const TIME_SLOTS = [
  { id: 1, start: '07:00', end: '10:00', label: '7-10 AM (Morning)', duration: 3 },
  { id: 2, start: '10:00', end: '13:00', label: '10 AM-1 PM (Late Morning)', duration: 3 },
  { id: 3, start: '13:00', end: '16:00', label: '1-4 PM (Afternoon)', duration: 3 },
  { id: 4, start: '16:00', end: '19:00', label: '4-7 PM (Evening)', duration: 3 },
] as const;

// Lecture days (excluding weekends)
const LECTURE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

// Calculate semester date ranges
function getSemesterDates(semester: string, year: number): { start: Date; end: Date; examStart: Date } {
  const config = SEMESTERS[semester];
  const start = new Date(year, config.startMonth - 1, 1);
  const end = new Date(year, config.endMonth, 0); // Last day of end month
  
  // Exam period: last 3 weeks (weeks 14-16)
  const examStart = new Date(start);
  examStart.setDate(examStart.getDate() + (13 * 7)); // Start of week 14
  
  return { start, end, examStart };
}

// Get week number within semester (1-16)
function getWeekNumber(date: Date, semesterStart: Date): number {
  const diffTime = date.getTime() - semesterStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

// Check if date is in examination period
function isExamPeriod(date: Date, semesterStart: Date): boolean {
  const week = getWeekNumber(date, semesterStart);
  return week >= 14 && week <= 16;
}
```

### 2.2 Conflict Detection Rules (Lectures & Exams)

```typescript
interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'faculty' | 'room' | 'student' | 'course';
    message: string;
    conflictingLecture: Lecture;
  }>;
}

class TimetableConflictDetector {
  /**
   * Check if a lecture can be scheduled at the given time
   */
  checkLectureConflicts(params: {
    lectureDate: Date;
    startTime: string;
    endTime: string;
    facultyId: number;
    courseId: number;
    location?: string;  // Only for physical classes
    excludeLectureId?: number; // For editing existing lecture
  }): ConflictCheck {
    const conflicts = [];
    
    // Rule 0: Cannot schedule lectures during exam period (weeks 14-16)
    const semesterStart = this.getSemesterStart(params.lectureDate);
    if (isExamPeriod(params.lectureDate, semesterStart)) {
      conflicts.push({
        type: 'course',
        message: 'Cannot schedule lectures during examination period (weeks 14-16)',
        conflictingLecture: null
      });
    }
    
    // Rule 1: Faculty cannot teach two classes simultaneously
    const facultyConflict = this.checkFacultyConflict(params);
    if (facultyConflict) conflicts.push(facultyConflict);
    
    // Rule 2: Physical room cannot be double-booked
    if (params.location) {
      const roomConflict = this.checkRoomConflict(params);
      if (roomConflict) conflicts.push(roomConflict);
    }
    
    // Rule 3: Students enrolled in multiple courses shouldn't have time conflicts
    const studentConflict = this.checkStudentConflict(params);
    if (studentConflict) conflicts.push(studentConflict);
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }
  
  /**
   * Check if an exam can be scheduled (for examination period)
   */
  checkExamConflicts(params: {
    examDate: Date;
    startTime: string;
    endTime: string;
    courseId: number;
    location: string;  // Always required for exams
    excludeExamId?: number;
  }): ConflictCheck {
    const conflicts = [];
    
    // Rule 0: Must be during examination period (weeks 14-16)
    const semesterStart = this.getSemesterStart(params.examDate);
    if (!isExamPeriod(params.examDate, semesterStart)) {
      conflicts.push({
        type: 'course',
        message: 'Exams must be scheduled during examination period (weeks 14-16)',
        conflictingLecture: null
      });
    }
    
    // Rule 1: Exam room cannot be double-booked
    const roomConflict = this.checkExamRoomConflict(params);
    if (roomConflict) conflicts.push(roomConflict);
    
    // Rule 2: Students cannot have overlapping exams
    const studentConflict = this.checkExamStudentConflict(params);
    if (studentConflict) conflicts.push(studentConflict);
    
    // Rule 4: Same course shouldn't have overlapping lectures
    const courseConflict = this.checkCourseConflict(params);
    if (courseConflict) conflicts.push(courseConflict);
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }
  
  /**
   * Suggest alternative time slots
   */
  suggestAlternatives(params: {
    facultyId: number;
    courseId: number;
    startDate: Date;
    endDate: Date;
  }): Array<{ date: Date; timeSlot: typeof TIME_SLOTS[number] }> {
    const suggestions = [];
    
    // Iterate through dates and time slots
    // Check each for conflicts
    // Return top 10 conflict-free options
    
    return suggestions;
  }
}
```

### 2.3 Auto-Schedule Feature

```typescript
interface AutoScheduleParams {
  courseId: number;
  facultyId: number;
  semester: 'Semester 1' | 'Semester 2' | 'Semester 3';
  year: number;  // 2025, 2026, etc.
  preferredDay?: string;  // 'Monday', 'Tuesday', etc.
  preferredTimeSlot?: number;  // 1, 2, 3, or 4
  deliveryMode: 'online' | 'physical';
  location?: string;  // For physical mode
  meetingLink?: string;  // For online mode
}

class LectureScheduler {
  /**
   * Auto-generate lecture schedule for entire semester
   * ONE 3-hour lecture per week for entire course
   * Distributes modules across 16 weeks
   */
  autoScheduleCourse(params: AutoScheduleParams): Lecture[] {
    const modules = this.getModules(params.courseId);
    const { start: semesterStart, end: semesterEnd } = getSemesterDates(params.semester, params.year);
    
    // Validate: Total module weeks should fit in 16 weeks
    const totalWeeks = modules.reduce((sum, m) => sum + (m.duration_weeks || 1), 0);
    if (totalWeeks > 16) {
      throw new Error(`Module duration (${totalWeeks} weeks) exceeds semester length (16 weeks)`);
    }
    
    const schedule: Lecture[] = [];
    let weekNumber = 1;
    let currentDate = this.getFirstLectureDate(semesterStart, params.preferredDay);
    
    // For each module, create lectures for its duration_weeks
    for (const module of modules) {
      const weekDuration = module.duration_weeks || 1;
      
      for (let week = 0; week < weekDuration; week++) {
        // One 3-hour lecture per week
        const lecture = {
          course_id: params.courseId,
          module_id: module.id,
          lecture_date: currentDate,
          start_time: TIME_SLOTS[params.preferredTimeSlot - 1].start,
          end_time: TIME_SLOTS[params.preferredTimeSlot - 1].end,
          delivery_mode: params.deliveryMode,
          location: params.location,
          meeting_link: params.meetingLink,
          topic: module.title,
          conducted_by: params.facultyId,
          week_number: weekNumber,
          status: 'scheduled'
        };
        
        // Check conflicts before adding
        const conflicts = this.checkConflicts(lecture);
        if (!conflicts.hasConflict) {
          schedule.push(lecture);
        } else {
          // Try alternative days/times
          const alternative = this.findAlternativeSlot(lecture, conflicts);
          if (alternative) {
            schedule.push(alternative);
          } else {
            throw new Error(`Cannot schedule lecture for ${module.title} Week ${weekNumber}: No available slots`);
          }
        }
        
        // Move to next week (same day, same time)
        currentDate = addWeeks(currentDate, 1);
        weekNumber++;
      }
    }
    
    return schedule;
  }
  
  /**
   * Get first lecture date based on preferred day
   */
  private getFirstLectureDate(semesterStart: Date, preferredDay: string): Date {
    const date = new Date(semesterStart);
    const targetDay = LECTURE_DAYS.indexOf(preferredDay as any);
    
    // Find first occurrence of preferred day
    while (date.getDay() !== targetDay + 1) { // +1 because getDay() is 0=Sunday
      date.setDate(date.getDate() + 1);
    }
    
    return date;
  }
  
  /**
   * Find alternative slot if preferred has conflict
   */
  private findAlternativeSlot(lecture: Lecture, conflicts: ConflictCheck): Lecture | null {
    // Try other days in the same week
    for (const day of LECTURE_DAYS) {
      for (const timeSlot of TIME_SLOTS) {
        const alternative = {
          ...lecture,
          lecture_date: this.adjustToDay(lecture.lecture_date, day),
          start_time: timeSlot.start,
          end_time: timeSlot.end
        };
        
        const altConflicts = this.checkConflicts(alternative);
        if (!altConflicts.hasConflict) {
          return alternative;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Adjust date to specific day of week
   */
  private adjustToDay(date: Date, targetDay: string): Date {
    const newDate = new Date(date);
    const currentDay = date.getDay();
    const targetDayIndex = LECTURE_DAYS.indexOf(targetDay as any) + 1; // +1 for Sunday=0
    const diff = targetDayIndex - currentDay;
    newDate.setDate(date.getDate() + diff);
    return newDate;
  }
}
```

---

## 3. API Endpoints

### 3.1 Lecture Management

#### Create Lecture (with conflict checking)
```typescript
POST /api/courses/[id]/lectures
Body: {
  module_id: number;       // REQUIRED - which module this lecture covers
  lecture_date: string;    // 'YYYY-MM-DD'
  start_time: string;      // '07:00', '10:00', '13:00', '16:00'
  end_time: string;        // '10:00', '13:00', '16:00', '19:00'
  delivery_mode: 'online' | 'physical';
  location?: string;       // Required if physical
  meeting_link?: string;   // Required if online
  topic?: string;          // Optional override (defaults to module title)
}

Response: {
  success: boolean;
  lecture?: Lecture;
  conflicts?: ConflictCheck;
}
```

#### List Lectures
```typescript
GET /api/courses/[id]/lectures?groupBy=module

Response: {
  lectures: Array<{
    module: Module;
    lectures: Lecture[];
  }>;
}
```

#### Update Lecture
```typescript
PUT /api/lectures/[id]
Body: Partial<LectureCreateData>

Response: {
  success: boolean;
  lecture: Lecture;
  conflicts?: ConflictCheck;
}
```

#### Delete Lecture
```typescript
DELETE /api/lectures/[id]

Response: { success: boolean }
```

#### Auto-Schedule Course (Teaching Period Only)
```typescript
POST /api/courses/[id]/auto-schedule
Body: {
  semester: 'Semester 1' | 'Semester 2' | 'Semester 3';
  year: number;  // 2025, 2026, etc.
  preferred_day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  preferred_time_slot: 1 | 2 | 3 | 4;  // 1=7-10AM, 2=10AM-1PM, 3=1-4PM, 4=4-7PM
  delivery_mode: 'online' | 'physical';
  location?: string;
  meeting_link?: string;
}

Response: {
  success: boolean;
  lectures: Lecture[];  // 13 weeks of teaching (weeks 1-13)
  conflicts: ConflictCheck[];
  summary: {
    total_lectures: number;  // Should be 13
    weeks_covered: number;    // 1-13
    modules_scheduled: number;
  };
}
```

### 3.2 Exam Management

#### Schedule Exam
```typescript
POST /api/courses/[id]/exams
Body: {
  exam_type: 'midterm' | 'final' | 'practical';
  exam_date: string;     // Must be in weeks 14-16
  start_time: string;
  duration_minutes: number;  // Exam duration
  location: string;      // Physical location (required)
  max_capacity?: number;
  instructions?: string;
  materials_allowed?: string[];  // ['calculator', 'notes', 'textbook']
}

Response: {
  success: boolean;
  exam?: ExamSchedule;
  conflicts?: ConflictCheck;
}
```

#### List Exams for Course
```typescript
GET /api/courses/[id]/exams?semester=Semester1&year=2025

Response: {
  exams: ExamSchedule[];
}
```

#### Update Exam
```typescript
PUT /api/exams/[id]
Body: Partial<ExamScheduleData>

Response: {
  success: boolean;
  exam: ExamSchedule;
  conflicts?: ConflictCheck;
}
```

#### Delete Exam
```typescript
DELETE /api/exams/[id]

Response: { success: boolean }
```

#### Mark Exam Attendance
```typescript
POST /api/exams/[id]/attendance
Body: {
  attendance_records: Array<{
    student_id: number;
    status: 'present' | 'absent' | 'excused';
    seat_number?: string;
    check_in_time?: string;
    notes?: string;
  }>;
  marked_by: number;  // Faculty ID
}

Response: {
  success: boolean;
  marked_count: number;
}
```

#### Upload Exam Results
```typescript
POST /api/exams/[id]/results
Body: {
  results: Array<{
    student_id: number;
    score: number;
    max_score: number;
    comments?: string;
  }>;
  uploaded_by: number;  // Faculty ID
}

Response: {
  success: boolean;
  uploaded_count: number;
  failed: Array<{ student_id: number; error: string }>;
}
```

#### Get Exam Results
```typescript
GET /api/exams/[id]/results

Response: {
  exam: ExamSchedule;
  results: Array<{
    student: Student;
    score: number;
    max_score: number;
    percentage: number;
    grade: string;
    attendance_status: string;
  }>;
  statistics: {
    average: number;
    median: number;
    highest: number;
    lowest: number;
    pass_rate: number;
  };
}

// Example: Course with 4 modules (4 weeks each) = 16 lectures total
// Monday 7-10 AM for 16 consecutive weeks
```

### 3.2 Assignment Management (CRUD)

#### Create Assignment
```typescript
POST /api/courses/[id]/assignments
Body: {
  title: string;
  description: string;
  assignment_type: 'assignment' | 'quiz' | 'exam';
  weight: number;  // Percentage (0-100)
  due_date: string;
  total_points: number;
  allows_file_submission: boolean;
  file_types?: string[];  // ['pdf', 'docx', 'txt']
  max_file_size?: number;  // Bytes
  instructions?: string;   // Rich text
  module_id?: number;      // Link to module
  grading_rubric?: object; // JSON structure
}
```

#### Submit Assignment (Student)
```typescript
POST /api/assignments/[id]/submit
Content-Type: multipart/form-data
Body: {
  file?: File;
  submission_text?: string;
}

Response: {
  success: boolean;
  submission: AssignmentSubmission;
}
```

#### Grade Submission (Faculty)
```typescript
PUT /api/submissions/[id]/grade
Body: {
  score: number;
  feedback: string;
}

Response: {
  success: boolean;
  submission: AssignmentSubmission;
  updatedGrade: CourseGrade;
}
```

### 3.3 Module Completion

#### Mark Module Complete
```typescript
PUT /api/modules/[id]/complete
Body: {
  student_id: number;
  completed: boolean;
  grade?: number;
  completion_date?: string;
}
```

#### Get Completion Statistics
```typescript
GET /api/courses/[id]/completion-stats

Response: {
  modules: Array<{
    module: Module;
    total_students: number;
    completed_count: number;
    completion_percentage: number;
    average_grade: number;
  }>;
}
```

### 3.4 Timetable & Conflicts

#### Check Conflicts
```typescript
POST /api/timetable/check-conflicts
Body: {
  lecture_date: string;
  start_time: string;
  end_time: string;
  faculty_id: number;
  course_id: number;
  location?: string;
}

Response: ConflictCheck
```

#### Get Faculty Timetable
```typescript
GET /api/timetable/faculty/[id]?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

Response: {
  lectures: Lecture[];
  summary: {
    total_lectures: number;
    online_lectures: number;
    physical_lectures: number;
  };
}
```

### 3.5 Course Restrictions

#### Add Restriction
```typescript
POST /api/courses/[id]/restrictions
Body: {
  major: string;
  year_level?: number;
  semester?: string;
}
```

#### Check Student Eligibility
```typescript
GET /api/courses/[id]/eligibility?studentId=123

Response: {
  eligible: boolean;
  reason?: string;
}
```

---

## 4. UI Components

### 4.1 Module-Based Lecture Scheduler

```typescript
interface ModuleLectureSchedulerProps {
  courseId: string;
  modules: Module[];
}

// Component shows modules with "Add Lecture" button per module
// Click opens LectureFormDialog pre-filled with module info
```

### 4.2 Lecture Form Dialog

```typescript
interface LectureFormDialogProps {
  courseId: string;
  moduleId: number;          // Pre-selected module
  lectureId?: number;        // For editing
  semester: string;          // Current semester
  year: number;              // Current year
  onSuccess: () => void;
}

Features:
- Module selector (or pre-filled)
- Week number display (calculated from date)
- Date picker (restricted to semester dates)
- Day selector: Mon, Tue, Wed, Thu, Fri
- Time slot dropdown (4 options: 7-10, 10-1, 1-4, 4-7)
- Delivery mode toggle (Online/Physical)
- Conditional fields:
  - If physical: Location picker with autocomplete (rooms list)
  - If online: Meeting link input (validate URL format)
- Topic input (defaults to module title, editable)
- Real-time conflict detection on date/time change
- Show conflicts with "View Alternatives" button
- Display: "This is lecture X of 16 for this course"
```

### 4.3 Timetable Calendar View

```typescript
interface TimetableCalendarProps {
  view: 'week' | 'month';
  data: Lecture[];
  onLectureClick?: (lecture: Lecture) => void;
  editable?: boolean;
}

Features:
- Week/Month toggle
- Color coding:
  - Online lectures: Blue
  - Physical lectures: Green
  - Completed: Gray
  - Cancelled: Red strikethrough
- Each cell shows:
  - Module title
  - Time range
  - Location OR meeting link icon
- Click lecture → Quick actions menu:
  - Edit
  - Mark Attendance
  - Cancel
  - View Details
```

### 4.4 Assignment Manager

```typescript
interface AssignmentManagerProps {
  courseId: string;
}

Features:
- Table view: Title | Type | Due Date | Weight | Submissions | Actions
- Type badges: Assignment (blue), Quiz (yellow), Exam (red)
- Weight display: "15% of final grade"
- Submissions: "12/25 graded"
- Actions: Edit | Delete | View Submissions
- Create button → AssignmentFormDialog
```

### 4.5 Assignment Form Dialog

```typescript
interface AssignmentFormDialogProps {
  courseId: string;
  assignmentId?: string;
  onSuccess: () => void;
}

Features:
- Basic Info:
  - Title
  - Description (rich text)
  - Type dropdown (Assignment/Quiz/Exam)
  - Module selector (optional)
- Grading:
  - Weight slider (0-100%)
  - Total points input
  - Rubric builder (JSON editor or form)
- Submission:
  - Due date picker
  - Allow file uploads toggle
  - If yes:
    - File types multiselect
    - Max size input (MB)
  - Instructions (rich text)
- Preview panel showing how students see it
```

### 4.6 Submission Grader

```typescript
interface SubmissionGraderProps {
  assignmentId: string;
  submissionId: string;
}

Features:
- Student info panel
- File preview (PDF, images, docs)
- Download button
- Grading form:
  - Score input (0 to max_points)
  - Percentage auto-calculated
  - Rubric checklist (if exists)
  - Feedback (rich text editor)
- Save draft / Publish grade
- Navigation: Previous/Next student
```

### 4.7 Module Completion Tracker

```typescript
interface ModuleCompletionTrackerProps {
  courseId: string;
  moduleId: number;
}

Features:
- Student list table
- Columns:
  - Name | Student ID | Status | Grade | Date | Actions
- Status indicator: Complete (green checkmark) / Incomplete (gray circle)
- Bulk actions:
  - Mark all complete
  - Export to CSV
- Individual actions:
  - Toggle completion
  - Edit grade
  - View student progress
```

---

## 5. Implementation Phases

### **Phase 1: Database Setup** (Day 1)
- [ ] Run migration to enhance `lectures` table
- [ ] Create `course_restrictions` table
- [ ] Enhance `assignments` table
- [ ] Create `assignment_submissions` table
- [ ] Update seed data

### **Phase 2: Lecture Management** (Days 2-3)
- [ ] Build conflict detection logic
- [ ] Create lecture CRUD APIs
- [ ] Build `LectureFormDialog` component
- [ ] Build `TimetableCalendar` component
- [ ] Integrate with faculty pages

### **Phase 3: Auto-Scheduling** (Day 4)
- [ ] Implement scheduling algorithm
- [ ] Create auto-schedule API
- [ ] Build UI for auto-schedule
- [ ] Add conflict resolution suggestions

### **Phase 4: Assignment System** (Days 5-6)
- [ ] File upload infrastructure
- [ ] Assignment CRUD APIs
- [ ] `AssignmentFormDialog` component
- [ ] Student submission flow
- [ ] File download/preview

### **Phase 5: Grading System** (Days 7-8)
- [ ] Submission grading APIs
- [ ] `SubmissionGrader` component
- [ ] Grade calculation engine (30/70 split)
- [ ] Gradebook enhancements
- [ ] Student grade view

### **Phase 6: Examination System** (Days 9-10)
- [ ] Exam scheduling APIs
- [ ] Exam conflict detection
- [ ] `ExamSchedulerDialog` component
- [ ] Exam attendance marking
- [ ] Results upload interface
- [ ] Results management

### **Phase 7: Module Completion** (Day 11)
- [ ] Module completion APIs
- [ ] `ModuleCompletionTracker` component
- [ ] Progress updates
- [ ] Analytics dashboard

### **Phase 8: Admin Features** (Day 12)
- [ ] Course restrictions UI
- [ ] University-wide timetable (lectures + exams)
- [ ] Conflict dashboard
- [ ] Semester management
- [ ] Reports and analytics

### **Phase 9: Testing & Polish** (Days 13-14)
- [ ] End-to-end testing (lectures, exams, grading)
- [ ] Semester transition testing
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Documentation

---

## 6. Key Workflows

### Faculty Creates Module Lectures:
1. Navigate to Course → Schedule
2. See modules listed with "Add Lecture" buttons
3. Click "Add Lecture" for Module 1
4. Dialog opens with:
   - Module: "Introduction to Programming" (pre-filled)
   - Date picker
   - Time slot: Select "7-10 AM"
   - Mode: Toggle to "Online"
   - Meeting link: Enter Zoom URL
   - Topic: Auto-filled "Introduction to Programming" (editable)
5. System checks conflicts → Shows "✓ No conflicts"
6. Click "Create" → Lecture saved
7. Repeat for additional sessions in the same week
8. Move to next module next week

### Faculty Auto-Schedules Course:
1. Navigate to Course → Schedule
2. Click "Auto-Schedule"
3. Dialog opens:
   - Semester: Dropdown (Semester 1, 2, or 3)
   - Year: Input (2025)
   - Preferred Day: Dropdown (Monday - Friday)
   - Preferred Time: Dropdown (7-10 AM, 10 AM-1 PM, 1-4 PM, 4-7 PM)
   - Delivery Mode: Toggle (Physical/Online)
   - If Physical: Location dropdown (Room 101, Room 201, etc.)
   - If Online: Meeting Link input
4. System validates:
   - **Course modules total ≤ 11 weeks** (not 13, due to assessment weeks!)
   - If > 11: Error "Course content exceeds 11 available lecture weeks"
   - Selected semester dates are valid
5. Click "Generate Schedule"
6. System creates schedule:
   - **Weeks 1-4:** Lectures for first batch of modules (4 weeks)
   - **Week 5:** RESERVED for Assessment 1 (no lecture scheduled)
   - **Weeks 6-9:** Lectures for second batch of modules (4 weeks)
   - **Week 10:** RESERVED for Assessment 2 (no lecture scheduled)
   - **Weeks 11-13:** Lectures for final batch of modules (3 weeks)
   - **Total:** 11 lecture weeks + 2 assessment weeks = 13 teaching weeks
   - **Example:**
     - Week 1-2: Module 1 "Intro to Programming" (Mon 7-10 AM, Room 301)
     - Week 3-4: Module 2 "Control Structures" (Mon 7-10 AM, Room 301)
     - Week 5: **[Assessment 1 - No Lecture]**
     - Week 6-7: Module 3 "Functions" (Mon 7-10 AM, Room 301)
     - Week 8-9: Module 4 "Arrays" (Mon 7-10 AM, Room 301)
     - Week 10: **[Assessment 2 - No Lecture]**
     - Week 11-13: Module 5 "Advanced Topics" (Mon 7-10 AM, Room 301)
7. Shows preview with:
   - Calendar view showing 11 lectures
   - Assessment weeks 5 and 10 marked as "Assessment Week - No Lecture"
   - Coverage indication: "Assessment 1 covers Weeks 1-4, Assessment 2 covers Weeks 6-9"
   - Any conflicts highlighted in red
   - Alternative suggestions for conflicts
8. Faculty reviews:
   - Can adjust individual lectures
   - Can change day/time for specific weeks
   - **Cannot schedule lectures on weeks 5 or 10** (reserved for assessments)
9. Click "Confirm" → All 11 lectures saved to database
10. System prompts: "Schedule assessments for weeks 5 and 10?"
11. Students enrolled in course see 13-week schedule (11 lectures + 2 assessment sessions)

### Faculty Grades Assignment:
1. Navigate to Course → Assignments → "Midterm Project"
2. See submissions table: 25 students, 20 submitted
3. Click student "John Doe"
4. Grader opens:
   - Shows submitted PDF
   - Rubric checklist visible
   - Score input: Enter 85/100
   - Feedback: "Great work on classes, needs improvement on error handling"
5. Click "Publish Grade"
6. System auto-calculates course grade update
7. Student sees grade and feedback
8. Navigate to next student

### Faculty Schedules Exam:
1. Navigate to Course → Examinations
2. See current semester info: "Semester 1 2025 - Exam Period: Week 14-16"
3. Click "Schedule Exam"
4. Dialog opens:
   - Exam Type: Select "Final Exam"
   - Date: Calendar restricted to weeks 14-16 only
   - Start Time: Select "10:00"
   - Duration: Input "180" minutes (3 hours)
   - Location: Select "Exam Hall A" (dropdown shows capacity)
5. System checks conflicts:
   - ✓ Room available
   - ✓ No student exam overlaps
6. Click "Schedule"
7. Exam created, students notified

### Faculty Marks Exam Attendance:
1. Navigate to Course → Examinations → "Final Exam"
2. Click "Mark Attendance"
3. See enrolled students list (sorted by seat number)
4. For each student:
   - Check-in: Scan student ID or click "Present"
   - Assign seat number
   - Note check-in time (auto-recorded)
5. During exam:
   - Mark late arrivals
   - Mark excused absences
6. After exam:
   - Mark check-out times
   - Add notes if needed
7. Click "Submit Attendance"
8. Attendance saved

### Faculty Uploads Exam Results:
1. Navigate to Course → Examinations → "Final Exam"
2. Click "Upload Results"
3. Options:
   - **Manual Entry:** 
     - See student list
     - Input score for each (0-100)
     - Add comments
   - **CSV Upload:**
     - Download template
     - Fill in Excel
     - Upload CSV file
4. System validates:
   - All enrolled students included
   - Scores within range
   - No duplicates
5. Preview results with statistics
6. Click "Publish Results"
7. Grades calculated (70% weight)
8. Students notified

### Admin Views Exam Schedule (University-wide):
1. Navigate to Admin → Examinations
2. See calendar view of all exams
3. Filter by:
   - Semester
   - Week (14, 15, or 16)
   - Location
4. Color-coded by department
5. Click exam → See details:
   - Course info
   - Student count
   - Location capacity
   - Attendance status
   - Results status
6. Identify conflicts (highlighted in red)
7. Export schedule to PDF

---

## 7. Grading Formula Implementation

```typescript
interface CourseGradeBreakdown {
  // 30% component
  assignments_quizzes: {
    items: Array<{ type: string; score: number; weight: number }>;
    weighted_total: number;  // Sum of (score * weight)
    total_weight: number;    // Sum of all weights
    average: number;         // weighted_total / total_weight
    contribution: number;    // average * 0.30
  };
  
  // 70% component
  exams: {
    items: Array<{ score: number; weight: number }>;
    weighted_total: number;
    total_weight: number;
    average: number;
    contribution: number;    // average * 0.70
  };
  
  // Final
  final_grade: number;       // assignments_quizzes.contribution + exams.contribution
  letter_grade: string;
}

function calculateFinalGrade(studentId: number, courseId: number): CourseGradeBreakdown {
  // Get all graded submissions
  const submissions = getGradedSubmissions(studentId, courseId);
  
  // Separate by type
  const assignmentsQuizzes = submissions.filter(s => 
    s.assignment.assignment_type === 'assignment' || 
    s.assignment.assignment_type === 'quiz'
  );
  
  const exams = submissions.filter(s => 
    s.assignment.assignment_type === 'exam'
  );
  
  // Calculate weighted averages
  const aqWeighted = calculateWeighted(assignmentsQuizzes);
  const examWeighted = calculateWeighted(exams);
  
  // Apply 30/70 split
  const aqContribution = (aqWeighted / 100) * 30;
  const examContribution = (examWeighted / 100) * 70;
  
  const finalGrade = aqContribution + examContribution;
  
  return {
    assignments_quizzes: { ...aqData, contribution: aqContribution },
    exams: { ...examData, contribution: examContribution },
    final_grade: finalGrade,
    letter_grade: getLetterGrade(finalGrade)
  };
}

function calculateWeighted(items: Submission[]): number {
  const weightedTotal = items.reduce((sum, item) => {
    const percentage = (item.score / item.max_score) * 100;
    return sum + (percentage * item.assignment.weight);
  }, 0);
  
  const totalWeight = items.reduce((sum, item) => sum + item.assignment.weight, 0);
  
  return totalWeight > 0 ? weightedTotal / totalWeight : 0;
}
```

---

**Ready to start Phase 1?** Let me know if you'd like any adjustments to this revised plan!
