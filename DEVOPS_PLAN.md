# CI/CD DevOps Plan for University ERP

## Overview
This document outlines the complete DevOps strategy including task breakdown, commit message conventions, branching strategy, CI/CD pipelines, and deployment workflows.

---

## 1. Commit Message Convention

We follow **Conventional Commits** specification for clear, semantic commit messages:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `style`: Code style changes (formatting, whitespace)
- `test`: Adding or updating tests
- `docs`: Documentation updates
- `build`: Build system or dependencies
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks

### Scopes
- `auth`: Authentication system
- `courses`: Course management
- `events`: Event system
- `learning`: Learning platform
- `db`: Database changes
- `ui`: UI components
- `api`: API routes
- `repo`: Repository layer
- `utils`: Utility functions
- `config`: Configuration files

### Examples
```
feat(courses): add semester localization system

- Replace hardcoded "Semester 1/2/3" with year + month range
- Add calculateSemesterDates() utility function
- Support January-April, May-August, September-December periods

Closes #123
```

```
fix(api): validate semester year must be current or next year

Previously allowed any year. Now restricts to 2025-2026.

Related to #124
```

---

## 2. Task Breakdown: Atomic Commits

### Phase 1: Project Setup & Configuration ✅

#### Task 1.1: Initialize Next.js project
```
Commit: build(init): initialize Next.js 15 project with TypeScript

- Set up Next.js 15.5.6 with App Router
- Configure TypeScript with strict mode
- Add ESLint and Prettier
- Set up Tailwind CSS 3.x
```

#### Task 1.2: Add UI component library
```
Commit: build(ui): add shadcn/ui component library

- Install Radix UI primitives
- Configure shadcn/ui components.json
- Add base UI components: Button, Card, Input, Table
- Set up Tailwind theme tokens
```

#### Task 1.3: Configure database
```
Commit: build(db): set up SQLite database with better-sqlite3

- Add better-sqlite3 dependency
- Configure database connection in src/lib/db.ts
- Enable foreign key constraints
- Set up database initialization function
```

### Phase 2: Database Schema & Migrations ✅

#### Task 2.1: Create core user tables
```
Commit: feat(db): create users and students tables

- Add users table with role-based access
- Add students table with academic information
- Create indexes on email and user_id
- Add bcrypt password hashing
```

#### Task 2.2: Create course tables
```
Commit: feat(db): create courses and enrollments tables

- Add courses table with faculty reference
- Add enrollments table linking students to courses
- Add course_modules table for content structure
- Create foreign key relationships
```

#### Task 2.3: Create assignment tables
```
Commit: feat(db): create assignments and submissions tables

- Add assignments table with rubric support
- Add submissions table with grading
- Support multiple assignment types (homework, quiz, project, exam)
- Add contributes_to_progress flag
```

#### Task 2.4: Create lecture and attendance tables
```
Commit: feat(db): create lectures and attendance tables

- Add lectures table with schedule references
- Add lecture_attendance table for tracking
- Add course_schedules table for timetabling
- Add course_lecturers table for assignments
```

#### Task 2.5: Create event tables
```
Commit: feat(db): create events and registrations tables

- Add events table with capacity limits
- Add event_registrations table
- Support multiple event categories
- Add created_by foreign key
```

#### Task 2.6: Create learning resources tables
```
Commit: feat(db): create learning resources and tracking tables

- Add learning_resources table (video, document, link, quiz)
- Add resource_views table for progress tracking
- Add achievements table
- Add recommendations table with AI scoring
```

#### Task 2.7: Add semester localization columns
```
Commit: feat(db): add semester year and month range columns

- Add semester_year INTEGER to courses
- Add semester_start_month INTEGER
- Add semester_end_month INTEGER
- Keep semester TEXT for backward compatibility
- Create indexes for efficient querying
```

### Phase 3: Authentication System ✅

#### Task 3.1: Create auth context
```
Commit: feat(auth): implement authentication context

- Create AuthContext with React Context API
- Add login/logout functions
- Store user session in localStorage
- Add isLoading state for initialization
```

#### Task 3.2: Create login API
```
Commit: feat(api): create login authentication endpoint

POST /api/auth/login
- Validate credentials with bcrypt
- Return user object with role
- Handle errors gracefully
```

#### Task 3.3: Create login page
```
Commit: feat(auth): create login page UI

- Build login form with email/password
- Add validation and error messages
- Redirect to dashboard on success
- Support role-based routing
```

### Phase 4: Repository Layer ✅

#### Task 4.1: Create User repository
```
Commit: feat(repo): implement UserRepository

- Add findByEmail() method
- Add findById() method
- Add verifyPassword() with bcrypt
- Add getStudentDetails()
- Add getAllStudents()
```

#### Task 4.2: Create Course repository
```
Commit: feat(repo): implement CourseRepository

- Add getAllCourses() with enrollment counts
- Add getCourseById() with joins
- Add getCoursesByFaculty()
- Add getEnrolledStudents()
- Add createCourse() with validation
- Add updateCourse() with partial updates
- Add deleteCourse()
- Add enrollStudent() and dropStudent()
- Add getCourseStats()
```

#### Task 4.3: Create Event repository
```
Commit: feat(repo): implement EventRepository

- Add getAllEvents() with attendee counts
- Add getEventById()
- Add createEvent()
- Add updateEvent()
- Add deleteEvent()
- Add registerForEvent() with capacity check
- Add unregisterFromEvent()
- Add getUserEvents()
- Add getUpcomingEvents()
```

#### Task 4.4: Create Learning repository
```
Commit: feat(repo): implement LearningRepository

- Add getStudentCourses() with progress
- Add getStudentAssignments()
- Add getStudentResources()
- Add getStudentAchievements()
- Add getRecommendations() with AI scoring
- Add updateResourceProgress()
- Add submitAssignment()
```

#### Task 4.5: Create Progress repository
```
Commit: feat(repo): implement ProgressRepository

- Add getCourseModules() with completion status
- Add getAssignmentsByCourse()
- Add getCourseProgress() with predictions
- Add completeModule()
- Add getAllCourseProgress()
```

#### Task 4.6: Create Attendance repository
```
Commit: feat(repo): implement AttendanceRepository

- Add createLecture()
- Add updateLecture()
- Add markAttendance() bulk operation
- Add markStudentAttendance()
- Add getLectureAttendance()
- Add getCourseLectures()
- Add getStudentAttendance() with percentage
- Add getCourseAttendanceReport()
- Add autoCreateLectures()
```

#### Task 4.7: Create Schedule repository
```
Commit: feat(repo): implement ScheduleRepository

- Add getCourseSchedule()
- Add createScheduleEntry()
- Add updateScheduleEntry()
- Add deleteScheduleEntry()
- Add validateScheduleHours() (credits = hours)
- Add checkRoomConflict()
- Add checkFacultyConflict()
- Add getWeeklyTimetable()
- Add getLecturerTimetable()
```

#### Task 4.8: Create Lecturer Assignment repository
```
Commit: feat(repo): implement LecturerAssignmentRepository

- Add assignLecturer()
- Add removeLecturerAssignment()
- Add getCourseLecturers()
- Add getLecturerCourses()
- Add getAllCoursesWithLecturers()
- Add getAllLecturersWithCourses()
- Add canManageCourse()
- Add getLecturerWorkload()
- Add reassignCourse()
- Add getUnassignedCourses()
```

#### Task 4.9: Create Progress Calculation repository
```
Commit: feat(repo): implement ProgressCalculationRepository

- Add calculateProgress() with weighted formula
- Formula: Module×0.25 + Assignment×0.40 + Attendance×0.20 + Quiz×0.15
- Add getDetailedProgress()
- Add getAllCourseProgress()
- Add updateProgressOnSubmission()
- Add updateProgressOnAttendance()
- Add updateProgressOnModuleCompletion()
- Add getClassProgressSummary()
- Add getStudentsAtRisk()
```

#### Task 4.10: Create Recommendation repository
```
Commit: feat(repo): implement RecommendationRepository

- Add getRecommendations() with filters
- Add getRecommendationById()
- Add dismissRecommendation()
- Add createRecommendation()
- Add getRecommendationStats()
```

### Phase 5: Semester Localization System ✅

#### Task 5.1: Create semester utilities
```
Commit: feat(utils): create semester date calculation utilities

- Add MonthRange type: January-April, May-August, September-December
- Add calculateSemesterDates() for 16-week calendar
- Add isValidSemesterYear() validation (current year + 1 only)
- Add isSemesterInFuture() validation
- Add formatDateRange() helper
- Add getWeekLabel() with assessment/exam indicators
- Add monthRangeToMonths() converter
- Add monthsToMonthRange() converter
```

#### Task 5.2: Update database schema
```
Commit: feat(db): migrate courses to localized semester system

- Add semester_year, semester_start_month, semester_end_month columns
- Migrate existing "Semester 1/2/3" data
- Update all indexes
- Maintain backward compatibility with semester TEXT field
```

#### Task 5.3: Update CourseRepository for localization
```
Commit: refactor(repo): update CourseRepository for semester localization

- Update createCourse() to accept year + month range
- Update all SELECT queries to include new columns
- Update updateCourse() to handle new fields
- Build display strings from structured data
```

#### Task 5.4: Update course form component
```
Commit: feat(ui): update course form with semester localization

- Replace single semester dropdown with two inputs
- Add year dropdown (current year + 1)
- Add month range dropdown (3 options)
- Add validation for past semesters
- Update form submission to use new format
```

#### Task 5.5: Update course API
```
Commit: feat(api): update course API for semester localization

POST /api/courses
- Accept semesterYear and semesterMonthRange
- Validate year is current or next year
- Validate semester is in future
- Convert to database format
- Return all semester fields
```

#### Task 5.6: Update course display
```
Commit: feat(ui): update course list to show localized format

- Add formatSemesterDisplay() helper
- Display "2025 January-April" instead of "Semester 1"
- Fall back to old format for backward compatibility
```

#### Task 5.7: Create semester data migration script
```
Commit: chore(db): create semester data migration script

scripts/migrate-semester-localization.ts
- Add new columns with error handling
- Migrate existing data
- Verify migration success
- Create database indexes
```

#### Task 5.8: Update semester display strings
```
Commit: chore(db): normalize semester display strings

scripts/update-semester-display.ts
- Map month ranges to readable format
- Update all existing course records
- Ensure consistent "YYYY Month-Month" format
```

### Phase 6: API Routes ✅

#### Task 6.1: Create courses API
```
Commit: feat(api): implement courses CRUD endpoints

GET    /api/courses - List all courses
GET    /api/courses/[id] - Get course details
POST   /api/courses - Create new course
PUT    /api/courses/[id] - Update course
DELETE /api/courses/[id] - Delete course
POST   /api/courses/[id]/enroll - Enroll student
GET    /api/courses/stats - Get statistics
```

#### Task 6.2: Create events API
```
Commit: feat(api): implement events CRUD endpoints

GET    /api/events - List all events
GET    /api/events/[id] - Get event details
POST   /api/events - Create new event
PUT    /api/events/[id] - Update event
DELETE /api/events/[id] - Delete event
POST   /api/events/[id]/register - Register for event
```

#### Task 6.3: Create learning API
```
Commit: feat(api): implement learning platform endpoints

GET /api/learning/courses - Student's courses with progress
GET /api/learning/assignments - Assignments and submissions
GET /api/learning/resources - Learning resources
GET /api/learning/achievements - Student achievements
GET /api/learning/recommendations - AI recommendations
```

#### Task 6.4: Create analytics API
```
Commit: feat(api): implement analytics endpoints

GET /api/analytics - Dashboard analytics
- Total students, courses, events
- Enrollment trends
- Performance metrics
```

#### Task 6.5: Create students API
```
Commit: feat(api): implement students endpoints

GET /api/students - List all students
GET /api/students/[id] - Get student details
```

#### Task 6.6: Create housing API
```
Commit: feat(api): implement housing endpoints

GET /api/housing - List housing listings
```

#### Task 6.7: Create marketplace API
```
Commit: feat(api): implement marketplace endpoints

GET /api/marketplace - List marketplace items
```

### Phase 7: UI Components ✅

#### Task 7.1: Create base UI components
```
Commit: feat(ui): add shadcn base components

- Add Avatar component
- Add Badge component
- Add Button component
- Add Card components
- Add Input component
- Add Label component
- Add Table components
- Add Tabs components
```

#### Task 7.2: Create dashboard layout
```
Commit: feat(ui): create dashboard layout component

- Add sidebar navigation
- Add header with user profile
- Add mobile responsive menu
- Add role-based navigation items
```

#### Task 7.3: Create course components
```
Commit: feat(ui): create course management components

- CreateCourseDialog component
- Course list view
- Course detail view
- Enrollment management
```

#### Task 7.4: Create event components
```
Commit: feat(ui): create event management components

- CreateEventDialog component
- Event list view
- Event detail view
- Registration management
```

#### Task 7.5: Create learning components
```
Commit: feat(ui): create learning platform components

- CourseDetailDialog component
- Assignment list
- Resource viewer
- Progress tracker
```

### Phase 8: Pages & Routes ✅

#### Task 8.1: Create main dashboard
```
Commit: feat(ui): create main dashboard page

/dashboard
- Show analytics cards
- Display upcoming events
- Show recent activity
- Quick actions
```

#### Task 8.2: Create courses page
```
Commit: feat(ui): create courses management page

/dashboard/courses
- List all courses
- Filter by semester
- Create new course
- Edit/delete courses
```

#### Task 8.3: Create events page
```
Commit: feat(ui): create events management page

/dashboard/events
- List all events
- Filter by category
- Create new event
- Register for events
```

#### Task 8.4: Create learning page
```
Commit: feat(ui): create learning platform page

/dashboard/learning
- Student course view
- Assignments and resources
- Progress tracking
- Recommendations
```

### Phase 9: Testing & Quality Assurance

#### Task 9.1: Add unit tests for repositories
```
Commit: test(repo): add unit tests for repository layer

- Test CRUD operations
- Test validation logic
- Test error handling
- Use Jest and @testing-library
```

#### Task 9.2: Add integration tests for APIs
```
Commit: test(api): add integration tests for API routes

- Test all endpoints
- Test authentication
- Test authorization
- Test error responses
```

#### Task 9.3: Add E2E tests
```
Commit: test(e2e): add end-to-end tests with Playwright

- Test user flows
- Test course creation
- Test event registration
- Test learning platform
```

#### Task 9.4: Add API testing scripts
```
Commit: test(scripts): add PowerShell API testing scripts

- Create test-api-phase2.ps1
- Create test-phase2.js
- Add comprehensive test scenarios
```

### Phase 10: Documentation

#### Task 10.1: Create API documentation
```
Commit: docs(api): create comprehensive API documentation

- Document all endpoints
- Add request/response examples
- Document error codes
- Add authentication guide
```

#### Task 10.2: Create database schema documentation
```
Commit: docs(db): document database schema

- Entity relationship diagrams
- Table definitions
- Index documentation
- Migration guide
```

#### Task 10.3: Create deployment guide
```
Commit: docs(deploy): create deployment documentation

- Environment setup
- Database initialization
- Configuration guide
- Troubleshooting
```

#### Task 10.4: Create faculty implementation plan
```
Commit: docs(faculty): create faculty feature implementation plan

FACULTY_IMPLEMENTATION_PLAN.md
- 7-tab interface design
- Course hub wireframes
- API requirements
- Phase breakdown
```

---

## 3. Branching Strategy

### Branch Structure
```
main (production-ready code)
├── develop (integration branch)
│   ├── feature/semester-localization
│   ├── feature/faculty-hub
│   ├── feature/assignment-system
│   └── feature/exam-system
├── release/v1.0.0
└── hotfix/critical-bug
```

### Branch Naming Convention
- `feature/<short-description>` - New features
- `bugfix/<issue-number>-<description>` - Bug fixes
- `hotfix/<critical-issue>` - Production hotfixes
- `release/<version>` - Release preparation
- `refactor/<component>` - Code refactoring
- `docs/<topic>` - Documentation updates

### Workflow
1. Create feature branch from `develop`
2. Make atomic commits following convention
3. Push to remote
4. Create Pull Request to `develop`
5. Code review and approval
6. Merge to `develop`
7. After testing, merge `develop` to `main`

---

## 4. CI/CD Pipeline Configuration

### GitHub Actions Workflow

#### File: `.github/workflows/ci.yml`
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage
      
  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: .next
```

#### File: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: '.next'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 5. Environment Configuration

### Development Environment
```env
# .env.local
NODE_ENV=development
DATABASE_PATH=./university.db
JWT_SECRET=dev-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production Environment
```env
# .env.production
NODE_ENV=production
DATABASE_PATH=/var/data/university.db
JWT_SECRET=${SECRET_FROM_ENV_MANAGER}
NEXT_PUBLIC_API_URL=https://university-erp.netlify.app
```

---

## 6. Database Migration Strategy

### Migration Files
Store in: `prisma/migrations/`

#### Naming Convention
```
YYYYMMDD_HHMMSS_description.sql
```

Examples:
- `20251110_120000_create_users_table.sql`
- `20251110_130000_add_semester_columns.sql`
- `20251110_140000_create_indexes.sql`

### Migration Process
1. Create migration file
2. Test locally
3. Commit with `feat(db): <description>`
4. Apply to staging
5. Verify data integrity
6. Apply to production with backup

---

## 7. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Type checking passed
- [ ] Linting passed
- [ ] Build successful
- [ ] Database migrations prepared
- [ ] Environment variables set
- [ ] Backup current database

### Deployment Steps
1. Run database migrations
2. Build production bundle
3. Deploy to Netlify
4. Verify health endpoints
5. Run smoke tests
6. Monitor error logs

### Post-Deployment
- [ ] Verify all pages load
- [ ] Test critical user flows
- [ ] Check API responses
- [ ] Monitor performance metrics
- [ ] Check error tracking

---

## 8. Monitoring & Logging

### Tools
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics
- **Logs**: CloudWatch or Netlify logs
- **Uptime**: UptimeRobot

### Metrics to Track
- API response times
- Error rates
- User session duration
- Database query performance
- Memory usage
- CPU usage

---

## 9. Rollback Procedure

### Steps
1. Identify issue severity
2. Stop deployment if in progress
3. Revert to previous Git tag
4. Rollback database migrations
5. Deploy previous version
6. Verify system stability
7. Communicate with team

### Commands
```bash
# Revert to previous release
git checkout v1.0.0
npm run build
npm run deploy

# Rollback database
npm run db:rollback
```

---

## 10. Security Best Practices

### Code Security
- [ ] No hardcoded secrets
- [ ] Use environment variables
- [ ] Validate all inputs
- [ ] Sanitize SQL queries
- [ ] Use parameterized statements
- [ ] Implement rate limiting

### Authentication
- [ ] Use bcrypt for passwords (12+ rounds)
- [ ] Implement JWT with expiry
- [ ] Secure session storage
- [ ] Role-based access control

### Database
- [ ] Enable foreign key constraints
- [ ] Use transactions for critical operations
- [ ] Regular backups
- [ ] Encrypted connections

---

## 11. Quick Reference

### Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build           # Build production
npm run lint            # Run linter
npm run type-check      # TypeScript check
npm run test            # Run tests

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed data
npm run db:backup       # Backup database

# Deployment
npm run deploy          # Deploy to production
npm run deploy:staging  # Deploy to staging
```

### Useful Git Aliases
```bash
git config alias.co checkout
git config alias.br branch
git config alias.cm 'commit -m'
git config alias.st status
git config alias.lg "log --oneline --graph --decorate"
```

---

## 12. Support & Maintenance

### Issue Triage
- **P0 (Critical)**: Production down, data loss
- **P1 (High)**: Core feature broken
- **P2 (Medium)**: Non-critical bug
- **P3 (Low)**: Enhancement, cosmetic

### Response Times
- P0: Immediate
- P1: Within 4 hours
- P2: Within 24 hours
- P3: Next sprint

---

## Appendix: Completed Work Summary

### ✅ Completed Tasks
1. Project initialization with Next.js 15
2. Database schema with 20+ tables
3. Repository layer (10 repositories)
4. API routes (10+ endpoints)
5. Authentication system
6. Semester localization system
7. UI components (shadcn/ui)
8. Dashboard pages
9. Course management
10. Event management
11. Learning platform

### 📊 Current Statistics
- **Files Created**: 50+
- **Lines of Code**: ~50,000+
- **Database Tables**: 20+
- **API Endpoints**: 30+
- **UI Components**: 15+
- **Repository Methods**: 100+

### 🎯 Next Priorities
1. Build faculty course hub (7 tabs)
2. Implement assignment system APIs
3. Implement exam system APIs
4. Add timetable conflict detection
5. Build auto-schedule API
6. Add comprehensive testing
7. Set up CI/CD pipelines

---

**Last Updated**: November 10, 2025
**Version**: 1.0.0
**Maintainer**: Development Team
