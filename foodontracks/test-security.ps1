# Security Test Runner
# Run comprehensive security tests for XSS and SQL injection prevention

Write-Host ""
Write-Host "🔒 FoodONtracks Security Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to foodontracks directory
Set-Location -Path "$PSScriptRoot"

# Run the security tests
Write-Host "▶ Running security tests..." -ForegroundColor Yellow
Write-Host ""

try {
    npx tsx scripts/test_security.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ All security tests passed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📚 To see interactive demo:" -ForegroundColor Cyan
        Write-Host "   npm run dev" -ForegroundColor White
        Write-Host "   Visit: http://localhost:3000/security-demo" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Some tests failed. Please review the output above." -ForegroundColor Red
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running tests: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
