# Academics API Test Script
# Usage: .\tests\academics-flow.ps1

$baseUrl = "http://localhost:3000"
$studentEmail = "john.doe@university.edu"
$studentPassword = "student"
$facultyEmail = "dr.wilson@university.edu"
$facultyPassword = "faculty"

# Helper function to login and get session
function Get-Session {
    param ($email, $password)
    
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    
    # 1. Get CSRF
    $csrfResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/csrf" -Method Get -SessionVariable session
    $csrfToken = ($csrfResponse.Content | ConvertFrom-Json).csrfToken
    
    # 2. Login
    $body = @{
        csrfToken = $csrfToken
        email = $email
        password = $password
        redirect = "false"
        callbackUrl = "$baseUrl"
        json = "true"
    }
    
    try {
        Invoke-WebRequest -Uri "$baseUrl/api/auth/callback/credentials" -Method Post -Body $body -WebSession $session -ErrorAction Stop | Out-Null
        return $session
    } catch {
        Write-Error "Login failed for $email"
        return $null
    }
}

Write-Host "1. Testing Faculty Course Creation" -ForegroundColor Cyan
$facultySession = Get-Session -email $facultyEmail -password $facultyPassword

if ($facultySession) {
    $courseCode = "TEST" + (Get-Random -Minimum 100 -Maximum 999)
    $coursePayload = @{
        code = $courseCode
        title = "Test Course $courseCode"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/faculty/courses" -Method Post -Body $coursePayload -WebSession $facultySession -ContentType "application/json" -ErrorAction Stop
        Write-Host "   Success: Created course $courseCode" -ForegroundColor Green
    } catch {
        Write-Host "   Failed to create course: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n2. Testing Faculty Grade Submission" -ForegroundColor Cyan
    
    # Use known IDs from seed data
    $enrollmentId = "enrollment-student-01-cs101"
    $assignmentId = "assignment-cs101-midterm"
    
    $gradePayload = @{
        type = "grade"
        enrollmentId = $enrollmentId
        assignmentId = $assignmentId
        scoreObtained = 92
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/faculty/grades" -Method Post -Body $gradePayload -WebSession $facultySession -ContentType "application/json" -ErrorAction Stop
        Write-Host "   Success: Submitted grade for $enrollmentId" -ForegroundColor Green
    } catch {
        Write-Host "   Failed to submit grade: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n3. Testing Faculty Attendance Submission" -ForegroundColor Cyan
    $attendancePayload = @{
        type = "attendance"
        enrollmentId = $enrollmentId
        date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        status = "PRESENT"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/faculty/grades" -Method Post -Body $attendancePayload -WebSession $facultySession -ContentType "application/json" -ErrorAction Stop
        Write-Host "   Success: Submitted attendance for $enrollmentId" -ForegroundColor Green
    } catch {
        Write-Host "   Failed to submit attendance: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n4. Testing Student Progress" -ForegroundColor Cyan
$studentSession = Get-Session -email $studentEmail -password $studentPassword

if ($studentSession) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/student/progress" -Method Get -WebSession $studentSession -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved progress data" -ForegroundColor Green
        # Write-Host ($data | Out-String)
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n5. Testing Recommendations (Explore)" -ForegroundColor Cyan
if ($studentSession) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/academics/explore" -Method Get -WebSession $studentSession -ErrorAction Stop
        $recs = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved recommendations" -ForegroundColor Green
        # Write-Host ($recs | Out-String)
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
