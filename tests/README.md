# Tests

This directory contains shell scripts to simulate server actions and test API endpoints.

## Prerequisites
- The Next.js server must be running locally on `http://localhost:3000`.
- You must have PowerShell installed (default on Windows).

## Scripts

### `auth-flow.ps1`
Tests the authentication flow via NextAuth API endpoints.

**Steps:**
1. Checks `GET /api/user/me` (Expects 401 Unauthorized).
2. Fetches a CSRF token from `/api/auth/csrf`.
3. Logs in via `POST /api/auth/callback/credentials`.
4. Checks `GET /api/user/me` again with the session cookie (Expects 200 OK).

**Usage:**
```powershell
.\tests\auth-flow.ps1
```

**Note:**
- Ensure you have registered a user with email `student@test.com` and password `password123` (or update the script variables) before running this test.
- Server Actions (like `registerUser`) are difficult to test via raw shell scripts due to Next.js internal serialization. This script focuses on the exposed API endpoints.
