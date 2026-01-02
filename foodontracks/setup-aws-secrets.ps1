#!/usr/bin/env pwsh
# AWS Secrets Manager Setup Script for FoodONtracks
# This script creates all necessary secrets for ECS deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$AwsRegion = "ap-south-1"
)

Write-Host "🔐 AWS Secrets Manager Setup for FoodONtracks" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Load .env file
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Loading environment variables from .env..." -ForegroundColor Yellow
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# Function to create or update secret
function Set-AWSSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue,
        [string]$Description
    )
    
    Write-Host "Creating/Updating secret: $SecretName" -ForegroundColor Yellow
    
    # Check if secret exists
    $exists = aws secretsmanager describe-secret --secret-id $SecretName --region $AwsRegion 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        # Update existing secret
        aws secretsmanager update-secret `
            --secret-id $SecretName `
            --secret-string $SecretValue `
            --region $AwsRegion | Out-Null
        Write-Host "  ✅ Updated: $SecretName" -ForegroundColor Green
    } else {
        # Create new secret
        aws secretsmanager create-secret `
            --name $SecretName `
            --description $Description `
            --secret-string $SecretValue `
            --region $AwsRegion | Out-Null
        Write-Host "  ✅ Created: $SecretName" -ForegroundColor Green
    }
}

# Create secrets
Write-Host ""
Write-Host "🔒 Creating secrets in AWS Secrets Manager..." -ForegroundColor Cyan
Write-Host ""

try {
    # Database URL
    if ($envVars.ContainsKey("DATABASE_URL")) {
        Set-AWSSecret `
            -SecretName "foodontracks/database-url" `
            -SecretValue $envVars["DATABASE_URL"] `
            -Description "PostgreSQL database connection string"
    }

    # JWT Secret
    if ($envVars.ContainsKey("JWT_SECRET")) {
        Set-AWSSecret `
            -SecretName "foodontracks/jwt-secret" `
            -SecretValue $envVars["JWT_SECRET"] `
            -Description "JWT signing secret"
    }

    # Redis URL
    if ($envVars.ContainsKey("REDIS_URL")) {
        Set-AWSSecret `
            -SecretName "foodontracks/redis-url" `
            -SecretValue $envVars["REDIS_URL"] `
            -Description "Redis connection string"
    }

    # AWS Access Key
    if ($envVars.ContainsKey("AWS_ACCESS_KEY_ID")) {
        Set-AWSSecret `
            -SecretName "foodontracks/aws-access-key" `
            -SecretValue $envVars["AWS_ACCESS_KEY_ID"] `
            -Description "AWS Access Key for S3/SES"
    }

    # AWS Secret Key
    if ($envVars.ContainsKey("AWS_SECRET_ACCESS_KEY")) {
        Set-AWSSecret `
            -SecretName "foodontracks/aws-secret-key" `
            -SecretValue $envVars["AWS_SECRET_ACCESS_KEY"] `
            -Description "AWS Secret Access Key"
    }

    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "✅ All secrets created/updated successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Secret ARNs (for task definition):" -ForegroundColor Yellow
    
    # Get AWS Account ID
    $accountId = aws sts get-caller-identity --query Account --output text
    
    $secrets = @(
        "foodontracks/database-url",
        "foodontracks/jwt-secret",
        "foodontracks/redis-url",
        "foodontracks/aws-access-key",
        "foodontracks/aws-secret-key"
    )
    
    foreach ($secret in $secrets) {
        $arn = "arn:aws:secretsmanager:${AwsRegion}:${accountId}:secret:${secret}"
        Write-Host "  $secret" -ForegroundColor Gray
        Write-Host "    $arn" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
    Write-Host "1. Update aws-ecs-task-definition.json with these ARNs" -ForegroundColor Gray
    Write-Host "2. Ensure ECS Task Execution Role has secretsmanager:GetSecretValue permission" -ForegroundColor Gray
    Write-Host "3. Secrets are encrypted at rest using AWS KMS" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "View in AWS Console:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/secretsmanager/home?region=${AwsRegion}#/listSecrets" -ForegroundColor Gray
