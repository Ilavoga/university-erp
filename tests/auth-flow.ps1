# Auth API Test Script
# Usage: .\tests\auth-flow.ps1

$baseUrl = "http://localhost:3000"
$email = "john.doe@university.edu" # Ensure this user exists or register them manually first
$password = "student"   # Use the password you registered with

Write-Host "1. Testing Unauthenticated Access to /api/user/me"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/user/me" -Method Get -ErrorAction Stop
    Write-Host "   Unexpected Success: $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Unauthorized) {
        Write-Host "   Success: Got 401 Unauthorized as expected." -ForegroundColor Green
    } else {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n2. Getting CSRF Token"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$csrfResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/csrf" -Method Get -SessionVariable session
$csrfJson = $csrfResponse.Content | ConvertFrom-Json
$csrfToken = $csrfJson.csrfToken
Write-Host "   CSRF Token: $csrfToken" -ForegroundColor Gray

Write-Host "`n3. Attempting Login (NextAuth Credentials)"
# NextAuth v5 Credentials Signin
$body = @{
    csrfToken = $csrfToken
    email = $email
    password = $password
    redirect = "false"
    callbackUrl = "$baseUrl"
    json = "true"
}

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/callback/credentials" -Method Post -Body $body -WebSession $session -ErrorAction Stop
    Write-Host "   Login Request Sent. Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    
    # Check if we got a session cookie
    $cookies = $session.Cookies.GetCookies($baseUrl)
    $sessionCookie = $cookies | Where-Object { $_.Name -like "*authjs.session-token*" -or $_.Name -like "*next-auth.session-token*" }
    
    if ($sessionCookie) {
        Write-Host "   Success: Session cookie found." -ForegroundColor Green
    } else {
        Write-Host "   Warning: No session cookie found. Login might have failed." -ForegroundColor Yellow
    }

} catch {
    Write-Host "   Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    # Print detailed error if available
    # $_.Exception.Response.GetResponseStream() ...
}

Write-Host "`n4. Testing Authenticated Access to /api/user/me"
try {
    $meResponse = Invoke-WebRequest -Uri "$baseUrl/api/user/me" -Method Get -WebSession $session -ErrorAction Stop
    $meJson = $meResponse.Content | ConvertFrom-Json
    
    if ($meResponse.StatusCode -eq 200) {
        Write-Host "   Success: Authenticated! User: $($meJson.email) ($($meJson.role))" -ForegroundColor Green
    }
} catch {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
}
