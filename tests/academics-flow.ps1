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

Write-Host "1. Testing Faculty Grade Submission" -ForegroundColor Cyan
$facultySession = Get-Session -email $facultyEmail -password $facultyPassword

if ($facultySession) {
    # Note: In a real test, we'd need to seed enrollment/assignment IDs first.
    # For this smoke test, we'll check if the endpoint is protected/reachable.
    
    $gradePayload = @{
        type = "grade"
        enrollmentId = "invalid-id" # Expect 404 or validation error, but 200/400/404 means endpoint works
        assignmentId = "invalid-id"
        scoreObtained = 85
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/faculty/grades" -Method Post -Body $gradePayload -WebSession $facultySession -ContentType "application/json" -ErrorAction Stop
        Write-Host "   Response: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        # 404 is expected since IDs don't exist, but proves auth passed and logic ran
        if ($_.Exception.Response.StatusCode -eq 404) {
             Write-Host "   Success: Endpoint reached (Got 404 for invalid IDs as expected)" -ForegroundColor Green
        } elseif ($_.Exception.Response.StatusCode -eq 401) {
             Write-Host "   Failed: Unauthorized (Faculty role check failed)" -ForegroundColor Red
        } else {
             Write-Host "   Result: $($_.Exception.Response.StatusCode) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n2. Testing Student Progress" -ForegroundColor Cyan
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

Write-Host "`n3. Testing Recommendations (Explore)" -ForegroundColor Cyan
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
