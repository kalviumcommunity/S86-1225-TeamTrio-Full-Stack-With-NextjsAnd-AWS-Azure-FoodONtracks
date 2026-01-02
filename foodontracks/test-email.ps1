# Email Service Testing Script
# Tests transactional email functionality

$baseUrl = "http://localhost:3000/api"
$testEmail = "test@example.com"  # Change this to your verified email in SES sandbox

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Email Service Testing Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Get Email Configuration
Write-Host "Test 1: Getting email configuration..." -ForegroundColor Yellow
try {
    $config = Invoke-RestMethod -Uri "$baseUrl/email" -Method GET
    if ($config.success) {
        Write-Host "✓ Configuration retrieved successfully" -ForegroundColor Green
        Write-Host "  Provider: $($config.data.provider)" -ForegroundColor Gray
        Write-Host "  Sender: $($config.data.sender)" -ForegroundColor Gray
        Write-Host "  Available Templates: $($config.data.availableTemplates -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to get configuration" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n"

# Test 2: Send Welcome Email
Write-Host "Test 2: Sending welcome email..." -ForegroundColor Yellow
try {
    $welcomeData = @{
        to = $testEmail
        template = "welcome"
        templateData = @{
            userName = "Test User"
            userEmail = $testEmail
        }
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/email" -Method POST -Body $welcomeData -ContentType "application/json"
    
    if ($result.success) {
        Write-Host "✓ Welcome email sent successfully" -ForegroundColor Green
        Write-Host "  Message ID: $($result.data.messageId)" -ForegroundColor Gray
        Write-Host "  To: $($result.data.to)" -ForegroundColor Gray
        Write-Host "  Subject: $($result.data.subject)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to send welcome email" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Note: Make sure '$testEmail' is verified in AWS SES if using sandbox mode" -ForegroundColor Yellow
}

Write-Host "`n----------------------------------------`n"

# Test 3: Send Order Confirmation Email
Write-Host "Test 3: Sending order confirmation email..." -ForegroundColor Yellow
try {
    $orderData = @{
        to = $testEmail
        template = "order-confirmation"
        templateData = @{
            userName = "Test User"
            orderNumber = "ORD-2025-001"
            totalAmount = 450.00
            deliveryAddress = "123 Test Street, Mumbai, Maharashtra 400001"
            estimatedDelivery = "30-45 minutes"
            orderItems = @(
                @{
                    name = "Butter Chicken"
                    quantity = 2
                    price = 180.00
                },
                @{
                    name = "Garlic Naan"
                    quantity = 3
                    price = 30.00
                }
            )
        }
    } | ConvertTo-Json -Depth 5

    $result = Invoke-RestMethod -Uri "$baseUrl/email" -Method POST -Body $orderData -ContentType "application/json"
    
    if ($result.success) {
        Write-Host "✓ Order confirmation email sent successfully" -ForegroundColor Green
        Write-Host "  Message ID: $($result.data.messageId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to send order confirmation" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n"

# Test 4: Send Password Reset Email
Write-Host "Test 4: Sending password reset email..." -ForegroundColor Yellow
try {
    $resetData = @{
        to = $testEmail
        template = "password-reset"
        templateData = @{
            userName = "Test User"
            resetLink = "https://foodontracks.com/reset-password?token=abc123xyz"
            expiryTime = "15 minutes"
        }
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/email" -Method POST -Body $resetData -ContentType "application/json"
    
    if ($result.success) {
        Write-Host "✓ Password reset email sent successfully" -ForegroundColor Green
        Write-Host "  Message ID: $($result.data.messageId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to send password reset email" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n"

# Test 5: Send Order Status Update Email
Write-Host "Test 5: Sending order status update email..." -ForegroundColor Yellow
try {
    $statusData = @{
        to = $testEmail
        template = "order-status"
        templateData = @{
            userName = "Test User"
            orderNumber = "ORD-2025-001"
            status = "PICKED_UP"
            trackingLink = "https://foodontracks.com/track/ORD-2025-001"
        }
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/email" -Method POST -Body $statusData -ContentType "application/json"
    
    if ($result.success) {
        Write-Host "✓ Order status email sent successfully" -ForegroundColor Green
        Write-Host "  Message ID: $($result.data.messageId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to send order status email" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n"

# Test 6: Send Payment Confirmation Email
Write-Host "Test 6: Sending payment confirmation email..." -ForegroundColor Yellow
try {
    $paymentData = @{
        to = $testEmail
        template = "payment-confirmation"
        templateData = @{
            userName = "Test User"
            orderNumber = "ORD-2025-001"
            amount = 450.00
            paymentMethod = "UPI"
            transactionId = "TXN123456789"
        }
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/email" -Method POST -Body $paymentData -ContentType "application/json"
    
    if ($result.success) {
        Write-Host "✓ Payment confirmation email sent successfully" -ForegroundColor Green
        Write-Host "  Message ID: $($result.data.messageId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to send payment confirmation" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n"

# Test 7: Send Custom HTML Email
Write-Host "Test 7: Sending custom HTML email..." -ForegroundColor Yellow
try {
    $customData = @{
        to = $testEmail
        subject = "Test Custom Email"
        message = "<h2>Hello from FoodONtracks!</h2><p>This is a test email with <strong>custom HTML</strong>.</p>"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/email" -Method POST -Body $customData -ContentType "application/json"
    
    if ($result.success) {
        Write-Host "✓ Custom email sent successfully" -ForegroundColor Green
        Write-Host "  Message ID: $($result.data.messageId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to send custom email" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Important Notes:" -ForegroundColor Yellow
Write-Host "1. If using AWS SES sandbox mode, verify recipient emails first" -ForegroundColor Gray
Write-Host "2. Check spam/junk folder if emails don't appear in inbox" -ForegroundColor Gray
Write-Host "3. Check AWS SES console for sending statistics and bounces" -ForegroundColor Gray
Write-Host "4. Update test email address at the top of this script`n" -ForegroundColor Gray
