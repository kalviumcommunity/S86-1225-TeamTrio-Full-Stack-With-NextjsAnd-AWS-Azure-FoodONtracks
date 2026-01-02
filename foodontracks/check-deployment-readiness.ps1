#!/usr/bin/env pwsh
# Deployment Readiness Check for FoodONtracks Container Deployment

Write-Host "FoodONtracks - Deployment Readiness Check" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$allChecks = @()

# Function to add check result
function Add-CheckResult {
    param(
        [string]$Category,
        [string]$Check,
        [bool]$Passed,
        [string]$Message
    )
    
    $script:allChecks += [PSCustomObject]@{
        Category = $Category
        Check = $Check
        Passed = $Passed
        Message = $Message
    }
    
    if ($Passed) {
        Write-Host "  [OK] $Check" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $Check" -ForegroundColor Red
        if ($Message) {
            Write-Host "     -> $Message" -ForegroundColor Yellow
        }
    }
}

# 1. Check Prerequisites
Write-Host "Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Docker
$dockerInstalled = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
Add-CheckResult "Prerequisites" "Docker installed" $dockerInstalled "Install Docker Desktop from https://docker.com"

if ($dockerInstalled) {
    $dockerRunning = $false
    try {
        docker ps 2>$null | Out-Null
        $dockerRunning = $LASTEXITCODE -eq 0
    } catch {}
    Add-CheckResult "Prerequisites" "Docker running" $dockerRunning "Start Docker Desktop"
}

# AWS CLI
$awsInstalled = $null -ne (Get-Command aws -ErrorAction SilentlyContinue)
Add-CheckResult "Prerequisites" "AWS CLI installed" $awsInstalled "Install from https://aws.amazon.com/cli/"

if ($awsInstalled) {
    $awsConfigured = $false
    try {
        aws sts get-caller-identity 2>$null | Out-Null
        $awsConfigured = $LASTEXITCODE -eq 0
    } catch {}
    Add-CheckResult "Prerequisites" "AWS CLI configured" $awsConfigured "Run 'aws configure'"
}

# Azure CLI
$azInstalled = $null -ne (Get-Command az -ErrorAction SilentlyContinue)
Add-CheckResult "Prerequisites" "Azure CLI installed (optional)" $azInstalled "Install from https://docs.microsoft.com/cli/azure/"

Write-Host ""

# 2. Check Files
Write-Host "Checking Required Files..." -ForegroundColor Yellow
Write-Host ""

$requiredFiles = @(
    @{ Path = "Dockerfile"; Name = "Dockerfile" },
    @{ Path = ".dockerignore"; Name = ".dockerignore" },
    @{ Path = ".env"; Name = "Environment file" },
    @{ Path = "docker-build-test.ps1"; Name = "Build and test script" },
    @{ Path = "docker-push-ecr.ps1"; Name = "ECR push script" },
    @{ Path = "deploy-ecs.ps1"; Name = "ECS deploy script" },
    @{ Path = "setup-aws-secrets.ps1"; Name = "Secrets setup script" },
    @{ Path = "aws-ecs-task-definition.json"; Name = "ECS task definition" },
    @{ Path = "src/app/api/health/route.ts"; Name = "Health check endpoint" },
    @{ Path = "next.config.ts"; Name = "Next.js config" }
)

foreach ($file in $requiredFiles) {
    $exists = Test-Path $file.Path
    Add-CheckResult "Files" $file.Name $exists "Missing: $($file.Path)"
}

Write-Host ""

# 3. Check Configuration
Write-Host "Checking Configuration..." -ForegroundColor Yellow
Write-Host ""

# Check .env file
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    $hasDatabase = $envContent -match 'DATABASE_URL=.+'
    Add-CheckResult "Configuration" "DATABASE_URL configured" $hasDatabase "Set in .env file"
    
    $hasJWT = $envContent -match 'JWT_SECRET=.+'
    Add-CheckResult "Configuration" "JWT_SECRET configured" $hasJWT "Set in .env file"
    
    $hasRedis = $envContent -match 'REDIS_URL=.+'
    Add-CheckResult "Configuration" "REDIS_URL configured" $hasRedis "Set in .env file"
    
    $hasAWSKey = $envContent -match 'AWS_ACCESS_KEY_ID=.+'
    Add-CheckResult "Configuration" "AWS credentials in .env" $hasAWSKey "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
}

# Check next.config.ts for standalone output
if (Test-Path "next.config.ts") {
    $nextConfig = Get-Content "next.config.ts" -Raw
    $hasStandalone = $nextConfig -match 'output:\s*[''"]standalone[''"]'
    Add-CheckResult "Configuration" "Next.js standalone mode" $hasStandalone "Add output: 'standalone' to next.config.ts"
}

Write-Host ""

# 4. Check GitHub Actions
Write-Host "Checking CI/CD Configuration..." -ForegroundColor Yellow
Write-Host ""

$githubDir = "../.github/workflows"
$awsWorkflow = Test-Path "$githubDir/deploy-aws-ecs.yml"
Add-CheckResult "CI/CD" "AWS ECS workflow" $awsWorkflow "Create .github/workflows/deploy-aws-ecs.yml"

$azureWorkflow = Test-Path "$githubDir/deploy-azure-app-service.yml"
Add-CheckResult "CI/CD" "Azure workflow" $azureWorkflow "Create .github/workflows/deploy-azure-app-service.yml"

Write-Host ""

# 5. Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$passed = ($allChecks | Where-Object { $_.Passed }).Count
$total = $allChecks.Count
if ($total -gt 0) {
    $percentage = [math]::Round(($passed / $total) * 100)
} else {
    $percentage = 0
}

Write-Host "Passed: $passed / $total ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" })
Write-Host ""

# Group by category
$categories = $allChecks | Group-Object Category
foreach ($category in $categories) {
    $catPassed = ($category.Group | Where-Object { $_.Passed }).Count
    $catTotal = $category.Group.Count
    Write-Host "$($category.Name): $catPassed / $catTotal" -ForegroundColor Gray
}

Write-Host ""

# 6. Next Steps
if ($percentage -eq 100) {
    Write-Host "All checks passed! You're ready to deploy." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test locally:        .\docker-build-test.ps1" -ForegroundColor Gray
    Write-Host "2. Setup AWS secrets:   .\setup-aws-secrets.ps1" -ForegroundColor Gray
    Write-Host "3. Push to ECR:         .\docker-push-ecr.ps1" -ForegroundColor Gray
    Write-Host "4. Deploy to ECS:       .\deploy-ecs.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or set up GitHub Actions for automatic deployment on push." -ForegroundColor Gray
} else {
    Write-Host "Some checks failed. Please address the issues above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Failed checks:" -ForegroundColor Red
    $allChecks | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Host "  - $($_.Check): $($_.Message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  Comprehensive guide: CONTAINER_DEPLOYMENT.md" -ForegroundColor Gray
Write-Host "  Quick reference:     DEPLOYMENT_QUICK_REFERENCE.md" -ForegroundColor Gray
Write-Host ""
