# Assessment Scheduling System - Revised Structure

**Date:** November 9, 2025  
**Key Change:** Assessments occupy lecture time slots in weeks 5 and 10

---

## Semester Structure (16 Weeks Total)

### Week Breakdown

| Week | Type | Purpose | Content Coverage |
|------|------|---------|------------------|
| **1-4** | Lecture | Teaching | Modules for first section |
| **5** | **Assessment 1** | Quiz/Assignment | **Covers weeks 1-4** |
| **6-9** | Lecture | Teaching | Modules for second section |
| **10** | **Assessment 2** | Quiz/Assignment | **Covers weeks 6-9** |
| **11-13** | Lecture | Teaching | Modules for exam prep |
| **14-16** | Exam | Final Exam | **Covers all material** |

### Key Points

✅ **Available Lecture Weeks:** 11 (not 13!)
- Weeks 1-4 = 4 lecture weeks
- Week 5 = Assessment 1 (NO lecture)
- Weeks 6-9 = 4 lecture weeks
- Week 10 = Assessment 2 (NO lecture)
- Weeks 11-13 = 3 lecture weeks
- **Total:** 4 + 4 + 3 = **11 lecture weeks**

✅ **Assessment Weeks:** 2 (weeks 5 and 10)
- Replace regular lecture time slots
- Students attend at normal class time
- Duration: 3 hours (same as lecture)
- Must be scheduled in advance by faculty

✅ **Exam Weeks:** 3 (weeks 14-16)
- Physical exams only
- Scheduled by faculty
- Attendance tracked
- Manual score entry

---

## Assessment Rules

### Maximum Assessments
- **Per semester:** 2 assessments maximum
- **Types:** Assignment OR Quiz (interchangeable)
- **Timing:** Week 5 and Week 10 (fixed)
- **Weight:** 15% each = 30% total

### Assessment 1 (Week 5)
- **Scheduled:** Week 5 (replaces lecture)
- **Date:** Uses course's regular day/time slot
- **Duration:** 3 hours
- **Content:** Covers material from weeks 1-4
- **Worth:** 15% of final grade (15 marks)
- **Type:** Faculty chooses (Quiz OR Assignment)
- **Location:** Same as regular lectures (physical room or online)

### Assessment 2 (Week 10)
- **Scheduled:** Week 10 (replaces lecture)
- **Date:** Uses course's regular day/time slot
- **Duration:** 3 hours
- **Content:** Covers material from weeks 6-9
- **Worth:** 15% of final grade (15 marks)
- **Type:** Faculty chooses (Quiz OR Assignment)
- **Location:** Same as regular lectures (physical room or online)

### Final Exam (Weeks 14-16)
- **Scheduled:** Any day in weeks 14-16
- **Duration:** Typically 3 hours
- **Content:** Covers all material (weeks 1-13)
- **Worth:** 70% of final grade (70 marks)
- **Type:** Always physical (no online option)
- **Location:** Exam hall with capacity check

---

## Content Distribution

### Example: 11-Week Course

**Option 1: 11 single-week modules**
```
Week 1: Module 1
Week 2: Module 2
Week 3: Module 3
Week 4: Module 4
Week 5: [Assessment 1 covers Modules 1-4]
Week 6: Module 5
Week 7: Module 6
Week 8: Module 7
Week 9: Module 8
Week 10: [Assessment 2 covers Modules 5-8]
Week 11: Module 9
Week 12: Module 10
Week 13: Module 11
Weeks 14-16: Final Exam (covers all modules)
```

**Option 2: Mixed duration modules**
```
Weeks 1-2: Module 1 (2 weeks)
Weeks 3-4: Module 2 (2 weeks)
Week 5: [Assessment 1 covers Modules 1-2]
Weeks 6-7: Module 3 (2 weeks)
Weeks 8-9: Module 4 (2 weeks)
Week 10: [Assessment 2 covers Modules 3-4]
Weeks 11-13: Module 5 (3 weeks)
Weeks 14-16: Final Exam (covers all modules)
```

**Option 3: Uneven distribution**
```
Week 1: Module 1
Weeks 2-3: Module 2 (2 weeks)
Week 4: Module 3
Week 5: [Assessment 1 covers Modules 1-3]
Weeks 6-7: Module 4 (2 weeks)
Weeks 8-9: Module 5 (2 weeks)
Week 10: [Assessment 2 covers Modules 4-5]
Weeks 11-12: Module 6 (2 weeks)
Week 13: Module 7
Weeks 14-16: Final Exam (covers all modules)
```

---

## Grading Calculation

### Formula
```
Final Grade = (Assessment 1 + Assessment 2) × 0.30 + Final Exam × 0.70

Components:
- Assessment 1: ___ / 15 marks
- Assessment 2: ___ / 15 marks
- Total Assessments: ___ / 30 marks → × 0.30 → ___% (30% component)
- Final Exam: ___ / 70 marks → × 0.70 → ___% (70% component)
- Final Grade: 30% + 70% = ___% (Total)
```

### Example Calculation
```
Student: John Doe
- Assessment 1 (Quiz): 12/15 marks
- Assessment 2 (Assignment): 14/15 marks
- Total: 26/30 marks

Assessment Component: 26/30 × 0.30 = 0.26 (26%)

- Final Exam: 58/70 marks

Exam Component: 58/70 × 0.70 = 0.58 (58%)

Final Grade: 26% + 58% = 84% (B+)
```

---

## Faculty Workflow

### 1. Course Setup (Before Semester)
1. Create course modules (total duration ≤ 11 weeks)
2. Validate: System checks if modules fit in 11 weeks
3. Auto-schedule lectures:
   - System distributes across weeks 1-4, 6-9, 11-13
   - Automatically skips weeks 5 and 10
   - Shows 11 lecture slots + 2 reserved assessment slots

### 2. Schedule Assessments
1. Navigate to: Course → Assignments
2. Click "Create Assessment"
3. Dialog shows:
   - **Assessment Slot:** Week 5 or Week 10 (dropdown)
   - **Type:** Quiz or Assignment
   - **Date:** Auto-filled (course's regular day/time in that week)
   - **Duration:** 3 hours (fixed)
   - **Coverage:** Auto-filled based on slot
     - Week 5: "Covers material from weeks 1-4"
     - Week 10: "Covers material from weeks 6-9"
   - **Weight:** 15% (fixed, non-editable)
   - **Max Score:** 15 marks (fixed)
   - **Instructions:** Rich text editor
   - **Submission Type:** 
     - Quiz: In-system (multiple choice, short answer)
     - Assignment: File upload (PDF, DOCX, etc.)
4. System validates:
   - ❌ Cannot create more than 2 assessments per semester
   - ❌ Cannot schedule outside weeks 5 or 10
   - ✅ Assessment date doesn't conflict with other courses
5. Click "Create" → Assessment scheduled

### 3. Conduct Assessment (Week 5 or 10)
**For Quiz:**
1. Students log in at scheduled time
2. Access quiz during 3-hour window
3. Submit answers in system
4. Faculty grades manually (unless auto-graded MCQ)

**For Assignment:**
1. Students attend class (optional for file submission)
2. Upload files before deadline
3. Faculty downloads submissions
4. Grades offline, uploads scores + feedback

### 4. Grade Assessments
1. Navigate to: Course → Assignments → "Assessment 1"
2. View submissions: 25/25 submitted
3. Click student → View work
4. Enter score: ___/15
5. Add feedback: Text input
6. Click "Save Grade"
7. Repeat for all students
8. Click "Publish All Grades" → Students notified

### 5. Schedule Final Exam (Before Week 14)
1. Navigate to: Course → Exams
2. Click "Schedule Final Exam"
3. Select date in weeks 14-16
4. Select physical location
5. System checks conflicts
6. Confirm → Exam scheduled
7. Students see exam schedule

### 6. Conduct Final Exam (Week 14-16)
1. Mark attendance (physical presence)
2. Proctor exam
3. Collect answer sheets
4. Grade manually
5. Upload results to system

### 7. Final Grading
1. System auto-calculates:
   - Assessment component: (A1 + A2)/30 × 0.30
   - Exam component: Exam/70 × 0.70
   - Final grade: Sum of components
2. Faculty reviews calculated grades
3. Can adjust if needed (grade appeal, etc.)
4. Publish final grades → Students see results

---

## System Validation Rules

### Module Duration Check
```typescript
function validateModuleDuration(modules: Module[]): boolean {
  const totalWeeks = modules.reduce((sum, m) => sum + m.duration_weeks, 0);
  
  if (totalWeeks > 11) {
    throw new Error(
      `Course content (${totalWeeks} weeks) exceeds available lecture time (11 weeks). ` +
      `Remember: Weeks 5 and 10 are reserved for assessments.`
    );
  }
  
  return true;
}
```

### Assessment Limit Check
```typescript
function canCreateAssessment(courseId: number, semester: string): boolean {
  const existingAssessments = db.prepare(`
    SELECT COUNT(*) as count 
    FROM assignments 
    WHERE course_id = ? 
      AND assignment_type IN ('assignment', 'quiz')
      AND scheduled_week IN (5, 10)
  `).get(courseId);
  
  if (existingAssessments.count >= 2) {
    throw new Error('Maximum 2 assessments per semester already scheduled');
  }
  
  return true;
}
```

### Week Slot Validation
```typescript
function validateAssessmentWeek(weekNumber: number): boolean {
  const validWeeks = [5, 10];
  
  if (!validWeeks.includes(weekNumber)) {
    throw new Error('Assessments must be scheduled in week 5 or week 10 only');
  }
  
  return true;
}
```

### Auto-Schedule Logic
```typescript
function autoSchedule(courseId: number, preferences: SchedulePreferences) {
  const modules = getModules(courseId);
  const totalWeeks = modules.reduce((sum, m) => sum + m.duration_weeks, 0);
  
  // Validate fits in 11 weeks
  if (totalWeeks > 11) {
    throw new Error('Cannot auto-schedule: course content exceeds 11 weeks');
  }
  
  const lectureSlots = [];
  let currentWeek = 1;
  
  for (const module of modules) {
    for (let i = 0; i < module.duration_weeks; i++) {
      // Skip assessment weeks
      if (currentWeek === 5 || currentWeek === 10) {
        currentWeek++; // Move to next week
      }
      
      // Schedule lecture
      lectureSlots.push({
        week: currentWeek,
        module_id: module.id,
        date: getDateForWeek(currentWeek, preferences.semester),
        time: preferences.time,
        location: preferences.location
      });
      
      currentWeek++;
    }
  }
  
  return lectureSlots; // Will have 11 entries, skipping weeks 5 and 10
}
```

---

## Database Schema Updates Needed

### Add to `assignments` table:
```sql
-- Week when assessment is scheduled (5 or 10)
ALTER TABLE assignments ADD COLUMN scheduled_week INTEGER 
  CHECK(scheduled_week IN (5, 10));

-- What weeks does this assessment cover
ALTER TABLE assignments ADD COLUMN coverage_weeks TEXT;  -- JSON: [1,2,3,4] or [6,7,8,9]

-- Fixed weight for assessments
ALTER TABLE assignments 
  ALTER COLUMN weight SET DEFAULT 15.0;

-- Constraint: max 2 assessments per course per semester
CREATE UNIQUE INDEX idx_assessment_slots 
  ON assignments(course_id, scheduled_week) 
  WHERE assignment_type IN ('assignment', 'quiz');
```

---

## UI Changes Required

### Schedule View
- Show 16-week calendar
- Weeks 1-4: Green (lectures)
- **Week 5: Orange (Assessment 1) - "No lecture scheduled"**
- Weeks 6-9: Green (lectures)
- **Week 10: Orange (Assessment 2) - "No lecture scheduled"**
- Weeks 11-13: Green (lectures)
- Weeks 14-16: Red (Exams)

### Create Assessment Dialog
- **Assessment Slot:** Dropdown with 2 options
  - "Week 5 (covers weeks 1-4)"
  - "Week 10 (covers weeks 6-9)"
- **Date:** Auto-filled based on course schedule + selected week
- **Weight:** Fixed 15%, shown as read-only
- **Coverage:** Auto-filled, non-editable
- Validation message if 2 assessments already exist

### Auto-Schedule Preview
```
Week 1: Lecture - Module 1
Week 2: Lecture - Module 2
Week 3: Lecture - Module 3
Week 4: Lecture - Module 4
Week 5: [RESERVED FOR ASSESSMENT 1] ⚠️
Week 6: Lecture - Module 5
Week 7: Lecture - Module 6
Week 8: Lecture - Module 7
Week 9: Lecture - Module 8
Week 10: [RESERVED FOR ASSESSMENT 2] ⚠️
Week 11: Lecture - Module 9
Week 12: Lecture - Module 10
Week 13: Lecture - Module 11

Note: Weeks 5 and 10 are reserved for assessments. 
      Schedule assessments separately after confirming lectures.
```

---

## Summary

### Old System (Wrong)
- 13 lecture weeks available
- Assessments separate from lectures
- No fixed scheduling for assessments
- Modules could use all 13 weeks

### New System (Correct)
- **11 lecture weeks available** (weeks 1-4, 6-9, 11-13)
- **Assessments occupy lecture slots** (weeks 5 and 10)
- **Fixed scheduling:** Week 5 and Week 10 only
- **Modules limited to 11 weeks maximum**
- **Assessment 1:** Week 5, covers weeks 1-4, worth 15%
- **Assessment 2:** Week 10, covers weeks 6-9, worth 15%
- **Final Exam:** Weeks 14-16, covers all material, worth 70%

This ensures:
✅ Students know exactly when assessments occur  
✅ Assessments directly follow the content they test  
✅ Faculty can't over-schedule course content  
✅ Clear separation: 11 teaching + 2 assessment + 3 exam = 16 weeks
