#!/usr/bin/env pwsh
# AWS ECR Push Script for FoodONtracks
# Prerequisites: AWS CLI configured with appropriate credentials

param(
    [Parameter(Mandatory=$false)]
    [string]$AwsRegion = "ap-south-1",
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "foodontracks",
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest"
)

Write-Host "🚀 AWS ECR Push Script for FoodONtracks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get AWS Account ID
Write-Host "🔍 Retrieving AWS Account ID..." -ForegroundColor Yellow
try {
    $awsAccountId = aws sts get-caller-identity --query Account --output text
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get AWS Account ID"
    }
    Write-Host "✅ AWS Account ID: $awsAccountId" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Make sure AWS CLI is configured with: aws configure" -ForegroundColor Yellow
    exit 1
}

# Construct ECR repository URL
$ecrUrl = "${awsAccountId}.dkr.ecr.${AwsRegion}.amazonaws.com"
$fullImageName = "${ecrUrl}/${RepositoryName}:${ImageTag}"

Write-Host ""
Write-Host "📦 Configuration:" -ForegroundColor Cyan
Write-Host "  Region: $AwsRegion" -ForegroundColor Gray
Write-Host "  Repository: $RepositoryName" -ForegroundColor Gray
Write-Host "  Tag: $ImageTag" -ForegroundColor Gray
Write-Host "  Full Image: $fullImageName" -ForegroundColor Gray

# Step 1: Create ECR repository if it doesn't exist
Write-Host ""
Write-Host "📁 Checking ECR repository..." -ForegroundColor Yellow
$repoExists = aws ecr describe-repositories --repository-names $RepositoryName --region $AwsRegion 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating ECR repository: $RepositoryName" -ForegroundColor Yellow
    aws ecr create-repository --repository-name $RepositoryName --region $AwsRegion --image-scanning-configuration scanOnPush=true
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repository created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create repository" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Repository exists" -ForegroundColor Green
}

# Step 2: Authenticate Docker to ECR
Write-Host ""
Write-Host "🔐 Authenticating Docker to ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $ecrUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker authentication failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker authenticated successfully" -ForegroundColor Green

# Step 3: Build the image
Write-Host ""
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t "${RepositoryName}:${ImageTag}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Image built successfully" -ForegroundColor Green

# Step 4: Tag the image
Write-Host ""
Write-Host "🏷️  Tagging image for ECR..." -ForegroundColor Yellow
docker tag "${RepositoryName}:${ImageTag}" $fullImageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Image tagging failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Image tagged successfully" -ForegroundColor Green

# Step 5: Push to ECR
Write-Host ""
Write-Host "📤 Pushing image to ECR..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

docker push $fullImageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Image push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Image successfully pushed to ECR!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Image URI: $fullImageName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create an ECS cluster (if not exists)" -ForegroundColor Gray
Write-Host "2. Create a task definition using this image" -ForegroundColor Gray
Write-Host "3. Create an ECS service to run the task" -ForegroundColor Gray
Write-Host ""
Write-Host "View in AWS Console:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/ecr/repositories/${RepositoryName}?region=${AwsRegion}" -ForegroundColor Gray
