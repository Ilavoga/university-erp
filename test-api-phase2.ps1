# PowerShell API Testing Script for Phase 2
# Test the lecture management APIs

Write-Host "🧪 Testing Phase 2 Lecture Management APIs" -ForegroundColor Cyan
Write-Host "Server: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# Test 1: Create a lecture for COMP 120
Write-Host "📝 Test 1: Creating lecture for COMP 120..." -ForegroundColor Yellow

$lectureData = @{
    module_id = 1
    lecture_date = "2025-01-06"
    start_time = "10:00"
    end_time = "13:00"
    delivery_mode = "physical"
    location = "Room 301"
    topic = "Introduction to Programming Concepts"
    conducted_by = 3
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/courses/1/lectures" `
        -Method Post `
        -ContentType "application/json" `
        -Body $lectureData
    
    Write-Host "✅ Lecture created successfully!" -ForegroundColor Green
    Write-Host "   Lecture ID: $($response.lecture.id)" -ForegroundColor Gray
    Write-Host "   Module: $($response.lecture.module_title)" -ForegroundColor Gray
    Write-Host "   Date: $($response.lecture.lecture_date)" -ForegroundColor Gray
    Write-Host "   Time: $($response.lecture.start_time) - $($response.lecture.end_time)" -ForegroundColor Gray
    Write-Host "   Location: $($response.lecture.location)" -ForegroundColor Gray
    Write-Host "   Week: $($response.lecture.week_number)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create lecture" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Get all lectures for course
Write-Host "📋 Test 2: Getting all lectures for COMP 120..." -ForegroundColor Yellow

try {
    $lectures = Invoke-RestMethod -Uri "http://localhost:3000/api/courses/1/lectures" `
        -Method Get
    
    Write-Host "✅ Retrieved $($lectures.lectures.Count) lecture(s)" -ForegroundColor Green
    foreach ($lecture in $lectures.lectures) {
        Write-Host "   - $($lecture.topic) on $($lecture.lecture_date)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get lectures" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Check for conflicts
Write-Host "🔍 Test 3: Checking for conflicts (same time/room)..." -ForegroundColor Yellow

$conflictCheck = @{
    lecture_date = "2025-01-06"
    start_time = "10:00"
    end_time = "13:00"
    faculty_id = 3
    course_id = 2
    location = "Room 301"
    delivery_mode = "physical"
} | ConvertTo-Json

try {
    $conflictResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/timetable/check-conflicts" `
        -Method Post `
        -ContentType "application/json" `
        -Body $conflictCheck
    
    if ($conflictResponse.has_conflicts) {
        Write-Host "⚠️  Conflicts detected!" -ForegroundColor Yellow
        Write-Host "   Blocking: $($conflictResponse.blocking_conflicts)" -ForegroundColor Red
        Write-Host "   Warnings: $($conflictResponse.warning_conflicts)" -ForegroundColor Yellow
        
        foreach ($conflict in $conflictResponse.conflicts) {
            Write-Host "   - [$($conflict.type)] $($conflict.message)" -ForegroundColor Gray
        }
        
        if ($conflictResponse.suggestions.Count -gt 0) {
            Write-Host ""
            Write-Host "   Alternative slots:" -ForegroundColor Cyan
            foreach ($suggestion in $conflictResponse.suggestions) {
                Write-Host "      - $($suggestion.time_slot) on $($suggestion.day_of_week)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "✅ No conflicts! Slot is available." -ForegroundColor Green
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to check conflicts" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Create an online lecture for COMP 223
Write-Host "📝 Test 4: Creating online lecture for COMP 223..." -ForegroundColor Yellow

$onlineLecture = @{
    module_id = 5
    lecture_date = "2025-01-07"
    start_time = "13:00"
    end_time = "16:00"
    delivery_mode = "online"
    meeting_link = "https://zoom.us/j/123456789"
    topic = "Data Structures Overview"
    conducted_by = 3
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/courses/2/lectures" `
        -Method Post `
        -ContentType "application/json" `
        -Body $onlineLecture
    
    Write-Host "✅ Online lecture created successfully!" -ForegroundColor Green
    Write-Host "   Lecture ID: $($response2.lecture.id)" -ForegroundColor Gray
    Write-Host "   Module: $($response2.lecture.module_title)" -ForegroundColor Gray
    Write-Host "   Date: $($response2.lecture.lecture_date)" -ForegroundColor Gray
    Write-Host "   Meeting Link: $($response2.lecture.meeting_link)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create online lecture" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 5: Get faculty timetable
Write-Host "📅 Test 5: Getting faculty timetable..." -ForegroundColor Yellow

try {
    $timetable = Invoke-RestMethod -Uri "http://localhost:3000/api/timetable/faculty/3?view=week&date=2025-01-06" `
        -Method Get
    
    Write-Host "✅ Faculty Timetable for $($timetable.faculty.name)" -ForegroundColor Green
    Write-Host "   Total Courses: $($timetable.stats.total_courses)" -ForegroundColor Gray
    Write-Host "   Total Lectures: $($timetable.stats.total_lectures)" -ForegroundColor Gray
    Write-Host "   Upcoming: $($timetable.stats.upcoming_lectures)" -ForegroundColor Gray
    
    if ($timetable.next_lecture) {
        Write-Host ""
        Write-Host "   Next Lecture:" -ForegroundColor Cyan
        Write-Host "      Course: $($timetable.next_lecture.course_code)" -ForegroundColor Gray
        Write-Host "      Date: $($timetable.next_lecture.lecture_date)" -ForegroundColor Gray
        Write-Host "      Time: $($timetable.next_lecture.start_time)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get timetable" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 6: Auto-schedule preview for COMP 120
Write-Host "🤖 Test 6: Generating auto-schedule for COMP 120..." -ForegroundColor Yellow

$autoScheduleRequest = @{
    faculty_id = 3
    preferences = @{
        preferred_days = @(1, 3)  # Monday, Wednesday
        preferred_times = @("10:00")
        delivery_mode = "physical"
        location = "Room 301"
    }
} | ConvertTo-Json -Depth 3

try {
    $schedulePreview = Invoke-RestMethod -Uri "http://localhost:3000/api/courses/1/auto-schedule" `
        -Method Post `
        -ContentType "application/json" `
        -Body $autoScheduleRequest
    
    Write-Host "✅ Schedule generated!" -ForegroundColor Green
    Write-Host "   Total Modules: $($schedulePreview.summary.total_modules)" -ForegroundColor Gray
    Write-Host "   Total Weeks: $($schedulePreview.summary.total_weeks)" -ForegroundColor Gray
    Write-Host "   Lectures Scheduled: $($schedulePreview.summary.lectures_scheduled)" -ForegroundColor Gray
    Write-Host "   Conflicts: $($schedulePreview.summary.conflicts)" -ForegroundColor Gray
    
    if ($schedulePreview.conflicts.Count -eq 0) {
        Write-Host ""
        Write-Host "   First 3 lectures:" -ForegroundColor Cyan
        $schedulePreview.schedule | Select-Object -First 3 | ForEach-Object {
            Write-Host "      Week $($_.week_number): $($_.module_title) on $($_.day_of_week) $($_.time_slot)" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to generate schedule" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "All tests complete!" -ForegroundColor Green
Write-Host ""
Write-Host "For more tests, see: PHASE2_API_TESTING.md" -ForegroundColor Cyan
