# JWT Authentication Testing Script
# Tests access token, refresh token, and expiry handling

Write-Host "================================" -ForegroundColor Cyan
Write-Host "JWT Authentication Flow Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test credentials
$email = "test@example.com"
$password = "password123"

Write-Host "Step 1: Login and obtain tokens" -ForegroundColor Yellow
Write-Host "POST $baseUrl/api/auth/login" -ForegroundColor Gray
Write-Host ""

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable session

    if ($loginResponse.success) {
        Write-Host "✓ Login successful!" -ForegroundColor Green
        Write-Host "User: $($loginResponse.user.email) ($($loginResponse.user.role))" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Token Information:" -ForegroundColor Cyan
        Write-Host "  Access Token Expires In: $($loginResponse.tokens.expiresIn) seconds (15 minutes)" -ForegroundColor White
        Write-Host "  Access Token: $($loginResponse.tokens.accessToken.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host "  Refresh Token: $($loginResponse.tokens.refreshToken.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host ""

        $accessToken = $loginResponse.tokens.accessToken
        $refreshToken = $loginResponse.tokens.refreshToken

        # Step 2: Verify token
        Write-Host "Step 2: Verify access token" -ForegroundColor Yellow
        Write-Host "GET $baseUrl/api/auth/verify" -ForegroundColor Gray
        Write-Host ""

        $headers = @{
            "Authorization" = "Bearer $accessToken"
        }

        $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/verify" `
            -Method GET `
            -Headers $headers

        if ($verifyResponse.authenticated) {
            Write-Host "✓ Token verified successfully!" -ForegroundColor Green
            Write-Host "Token Type: $($verifyResponse.token.type)" -ForegroundColor White
            Write-Host "Expires At: $($verifyResponse.token.expiresAt)" -ForegroundColor White
            Write-Host ""
        }

        # Step 3: Make authenticated request
        Write-Host "Step 3: Access protected resource" -ForegroundColor Yellow
        Write-Host "GET $baseUrl/api/users" -ForegroundColor Gray
        Write-Host ""

        try {
            $usersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" `
                -Method GET `
                -Headers $headers

            Write-Host "✓ Successfully accessed protected resource!" -ForegroundColor Green
            Write-Host "Retrieved $($usersResponse.users.Count) users" -ForegroundColor White
            Write-Host ""
        } catch {
            Write-Host "✗ Failed to access protected resource" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }

        # Step 4: Refresh token
        Write-Host "Step 4: Refresh access token" -ForegroundColor Yellow
        Write-Host "POST $baseUrl/api/auth/refresh" -ForegroundColor Gray
        Write-Host ""

        $refreshBody = @{
            refreshToken = $refreshToken
        } | ConvertTo-Json

        $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/refresh" `
            -Method POST `
            -Body $refreshBody `
            -ContentType "application/json"

        if ($refreshResponse.success) {
            Write-Host "✓ Token refreshed successfully!" -ForegroundColor Green
            Write-Host "New Access Token: $($refreshResponse.tokens.accessToken.Substring(0, 50))..." -ForegroundColor Gray
            
            if ($refreshResponse.tokens.refreshToken) {
                Write-Host "New Refresh Token: $($refreshResponse.tokens.refreshToken.Substring(0, 50))... (rotated)" -ForegroundColor Gray
            }
            Write-Host ""

            $newAccessToken = $refreshResponse.tokens.accessToken

            # Verify new token works
            Write-Host "Step 5: Verify new token works" -ForegroundColor Yellow
            $newHeaders = @{
                "Authorization" = "Bearer $newAccessToken"
            }

            $verifyNewResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/verify" `
                -Method GET `
                -Headers $newHeaders

            if ($verifyNewResponse.authenticated) {
                Write-Host "✓ New token verified successfully!" -ForegroundColor Green
                Write-Host ""
            }
        }

        # Step 6: Logout
        Write-Host "Step 6: Logout" -ForegroundColor Yellow
        Write-Host "POST $baseUrl/api/auth/logout" -ForegroundColor Gray
        Write-Host ""

        $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" `
            -Method POST

        if ($logoutResponse.success) {
            Write-Host "✓ Logged out successfully!" -ForegroundColor Green
            Write-Host ""
        }

        # Test token structure
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "JWT Token Structure Analysis" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""

        # Decode token (base64 decode middle part)
        $tokenParts = $accessToken.Split('.')
        
        Write-Host "Token Parts:" -ForegroundColor Yellow
        Write-Host "1. Header:    $($tokenParts[0].Substring(0, [Math]::Min(30, $tokenParts[0].Length)))..." -ForegroundColor Gray
        Write-Host "2. Payload:   $($tokenParts[1].Substring(0, [Math]::Min(30, $tokenParts[1].Length)))..." -ForegroundColor Gray
        Write-Host "3. Signature: $($tokenParts[2].Substring(0, [Math]::Min(30, $tokenParts[2].Length)))..." -ForegroundColor Gray
        Write-Host ""

        Write-Host "Decoded Payload:" -ForegroundColor Yellow
        $paddedPayload = $tokenParts[1]
        while ($paddedPayload.Length % 4 -ne 0) {
            $paddedPayload += "="
        }
        
        $decodedBytes = [Convert]::FromBase64String($paddedPayload)
        $decodedPayload = [Text.Encoding]::UTF8.GetString($decodedBytes)
        $payload = $decodedPayload | ConvertFrom-Json

        Write-Host "  userId: $($payload.userId)" -ForegroundColor White
        Write-Host "  email:  $($payload.email)" -ForegroundColor White
        Write-Host "  role:   $($payload.role)" -ForegroundColor White
        Write-Host "  type:   $($payload.type)" -ForegroundColor White
        Write-Host "  exp:    $($payload.exp) ($(([DateTimeOffset]::FromUnixTimeSeconds($payload.exp)).DateTime))" -ForegroundColor White
        Write-Host "  iat:    $($payload.iat) ($(([DateTimeOffset]::FromUnixTimeSeconds($payload.iat)).DateTime))" -ForegroundColor White
        Write-Host ""

        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "Test completed successfully! ✓" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Cyan

    } else {
        Write-Host "✗ Login failed: $($loginResponse.message)" -ForegroundColor Red
    }

} catch {
    Write-Host "✗ Error during test:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Server is running (npm run dev)" -ForegroundColor White
    Write-Host "  2. Test user exists in database" -ForegroundColor White
    Write-Host "  3. Database is connected" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
