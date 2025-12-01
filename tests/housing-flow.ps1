# Housing API Test Script
# Usage: .\tests\housing-flow.ps1

$baseUrl = "http://localhost:3000"
$studentEmail = "john.doe@university.edu"
$studentPassword = "student"
$landlordEmail = "johnson.properties@email.com"
$landlordPassword = "landlord"

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

Write-Host "=== PHASE 3: HOUSING API TESTS ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get Internal Housing (Hostel Blocks & Rooms)
Write-Host "1. Testing Internal Housing - Get Hostel Blocks" -ForegroundColor Cyan
$studentSession = Get-Session -email $studentEmail -password $studentPassword

if ($studentSession) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/internal" -Method Get -WebSession $studentSession -ErrorAction Stop
        $blocks = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved $($blocks.Count) hostel blocks" -ForegroundColor Green
        
        # Display first block info
        if ($blocks.Count -gt 0) {
            $firstBlock = $blocks[0]
            Write-Host "   - Block: $($firstBlock.name) in $($firstBlock.location)" -ForegroundColor Gray
            Write-Host "   - Rooms: $($firstBlock.rooms.Count) rooms available" -ForegroundColor Gray
            Write-Host "   - Images: $($firstBlock.images.Count) (Sample: $($firstBlock.images[0]))" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 2: Create Room Booking
Write-Host "`n2. Testing Room Booking - Create Booking" -ForegroundColor Cyan
if ($studentSession) {
    $bookingPayload = @{
        roomId = "room-a-102"
        semester = "Spring 2026"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/bookings" -Method Post -Body $bookingPayload -WebSession $studentSession -ContentType "application/json" -ErrorAction Stop
        $booking = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Created booking with ID $($booking.id)" -ForegroundColor Green
        Write-Host "   - Status: $($booking.status)" -ForegroundColor Gray
        Write-Host "   - Room: $($booking.roomId)" -ForegroundColor Gray
        
        # Store booking ID for later tests
        $script:bookingId = $booking.id
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
        # If booking already exists, that's okay for testing
        if ($_.Exception.Message -like "*already have an active booking*") {
            Write-Host "   (Expected: User already has a booking)" -ForegroundColor Yellow
        }
    }
}

# Test 3: Get User's Bookings
Write-Host "`n3. Testing Room Booking - Get My Bookings" -ForegroundColor Cyan
if ($studentSession) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/bookings" -Method Get -WebSession $studentSession -ErrorAction Stop
        $bookings = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved $($bookings.Count) booking(s)" -ForegroundColor Green
        
        foreach ($booking in $bookings) {
            Write-Host "   - Booking ID: $($booking.id) | Status: $($booking.status) | Room: $($booking.room.roomNumber)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: External Listings - Landlord Creates Listing
Write-Host "`n4. Testing External Listings - Create Listing (Landlord)" -ForegroundColor Cyan
$landlordSession = Get-Session -email $landlordEmail -password $landlordPassword

if ($landlordSession) {
    $listingPayload = @{
        title = "Modern Studio Apartment"
        description = "Brand new studio with all amenities, perfect for students."
        location = "City Center, 10 min to campus"
        price = 7500
        images = @("/images/studio1.jpg", "/images/studio2.jpg")
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/external" -Method Post -Body $listingPayload -WebSession $landlordSession -ContentType "application/json" -ErrorAction Stop
        $listing = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Created listing with ID $($listing.id)" -ForegroundColor Green
        Write-Host "   - Title: $($listing.title)" -ForegroundColor Gray
        Write-Host "   - Price: $($listing.price) per month" -ForegroundColor Gray
        
        # Store listing ID for later tests
        $script:listingId = $listing.id
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Get External Listings (Student View)
Write-Host "`n5. Testing External Listings - Browse Listings (Student)" -ForegroundColor Cyan
if ($studentSession) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/external?available=true" -Method Get -WebSession $studentSession -ErrorAction Stop
        $listings = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved $($listings.Count) available listing(s)" -ForegroundColor Green
        
        foreach ($listing in $listings | Select-Object -First 3) {
            Write-Host "   - $($listing.title) | $($listing.price)/mo | by $($listing.landlord.name)" -ForegroundColor Gray
            Write-Host "     Images: $($listing.images.Count) (Sample: $($listing.images[0]))" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Get Single Listing Details
Write-Host "`n6. Testing External Listings - Get Listing Details" -ForegroundColor Cyan
if ($studentSession) {
    # Use first seeded listing ID
    $testListingId = "listing-01"
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/external/$testListingId" -Method Get -WebSession $studentSession -ErrorAction Stop
        $listing = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved listing details" -ForegroundColor Green
        Write-Host "   - Title: $($listing.title)" -ForegroundColor Gray
        Write-Host "   - Location: $($listing.location)" -ForegroundColor Gray
        Write-Host "   - Description: $($listing.description)" -ForegroundColor Gray
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 7: Create Inquiry
Write-Host "`n7. Testing Inquiries - Send Inquiry (Student)" -ForegroundColor Cyan
if ($studentSession) {
    $inquiryPayload = @{
        listingId = "listing-01"
        message = "Hi, I'm interested in viewing this property. Is it available for viewing this week?"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/inquiries" -Method Post -Body $inquiryPayload -WebSession $studentSession -ContentType "application/json" -ErrorAction Stop
        $inquiry = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Sent inquiry with ID $($inquiry.id)" -ForegroundColor Green
        Write-Host "   - Message: $($inquiry.message.Substring(0, [Math]::Min(50, $inquiry.message.Length)))..." -ForegroundColor Gray
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 8: Get Student's Inquiries
Write-Host "`n8. Testing Inquiries - Get My Inquiries (Student)" -ForegroundColor Cyan
if ($studentSession) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/inquiries" -Method Get -WebSession $studentSession -ErrorAction Stop
        $inquiries = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved $($inquiries.Count) inquiry/inquiries" -ForegroundColor Green
        
        foreach ($inquiry in $inquiries | Select-Object -First 3) {
            Write-Host "   - To: $($inquiry.listing.title) | From: $($inquiry.student.name)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 9: Get Landlord's Inquiries
Write-Host "`n9. Testing Inquiries - Get Received Inquiries (Landlord)" -ForegroundColor Cyan
if ($landlordSession) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/inquiries" -Method Get -WebSession $landlordSession -ErrorAction Stop
        $inquiries = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Retrieved $($inquiries.Count) inquiry/inquiries" -ForegroundColor Green
        
        foreach ($inquiry in $inquiries | Select-Object -First 3) {
            Write-Host "   - About: $($inquiry.listing.title) | From: $($inquiry.student.name)" -ForegroundColor Gray
            Write-Host "     Message: $($inquiry.message.Substring(0, [Math]::Min(60, $inquiry.message.Length)))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 10: Update Listing (Landlord)
Write-Host "`n10. Testing External Listings - Update Listing (Landlord)" -ForegroundColor Cyan
if ($landlordSession -and $script:listingId) {
    $updatePayload = @{
        isAvailable = $false
        price = 8000
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/external/$($script:listingId)" -Method Patch -Body $updatePayload -WebSession $landlordSession -ContentType "application/json" -ErrorAction Stop
        $updated = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Updated listing" -ForegroundColor Green
        Write-Host "   - New Price: $($updated.price)" -ForegroundColor Gray
        Write-Host "   - Available: $($updated.isAvailable)" -ForegroundColor Gray
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 11: Cancel Booking (Student)
Write-Host "`n11. Testing Room Booking - Cancel Booking (Student)" -ForegroundColor Cyan
if ($studentSession -and $script:bookingId) {
    $cancelPayload = @{
        status = "CANCELLED"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/bookings/$($script:bookingId)" -Method Patch -Body $cancelPayload -WebSession $studentSession -ContentType "application/json" -ErrorAction Stop
        $updated = $response.Content | ConvertFrom-Json
        Write-Host "   Success: Cancelled booking" -ForegroundColor Green
        Write-Host "   - Status: $($updated.status)" -ForegroundColor Gray
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Message -like "*Booking not found*") {
            Write-Host "   (Note: Booking was not created in Test 2, so cancellation skipped)" -ForegroundColor Yellow
        }
    }
}

# Test 12: Upload Image & Create Listing
Write-Host "`n12. Testing Image Upload & Listing Creation" -ForegroundColor Cyan
$imagePath = "src/assets/bradley-lembach-76RsgeCiekY-unsplash.jpg"
if (Test-Path $imagePath) {
    try {
        Write-Host "   Uploading image: $imagePath" -ForegroundColor Gray
        # Call Node.js helper script
        $uploadOutput = node tests/upload-image.js $landlordEmail $landlordPassword $imagePath
        
        if ($LASTEXITCODE -eq 0) {
            $uploadResult = $uploadOutput | ConvertFrom-Json
            $imageUrl = $uploadResult.url
            Write-Host "   Success: Uploaded image" -ForegroundColor Green
            Write-Host "   - URL: $imageUrl" -ForegroundColor Gray
            
            # Create listing with this image
            if ($landlordSession) {
                $listingPayload = @{
                    title = "Luxury Penthouse with View"
                    description = "Top floor apartment with amazing city views."
                    location = "Sky Tower, City Center"
                    price = 12000
                    images = @($imageUrl)
                } | ConvertTo-Json
                
                $response = Invoke-WebRequest -Uri "$baseUrl/api/housing/external" -Method Post -Body $listingPayload -WebSession $landlordSession -ContentType "application/json" -ErrorAction Stop
                $listing = $response.Content | ConvertFrom-Json
                Write-Host "   Success: Created listing with uploaded image" -ForegroundColor Green
                Write-Host "   - ID: $($listing.id)" -ForegroundColor Gray
                Write-Host "   - Image Count: $($listing.images.Count)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   Failed to upload image: $uploadOutput" -ForegroundColor Red
        }
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   Skipped: Image file not found at $imagePath" -ForegroundColor Yellow
}

Write-Host "`n=== HOUSING API TESTS COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
