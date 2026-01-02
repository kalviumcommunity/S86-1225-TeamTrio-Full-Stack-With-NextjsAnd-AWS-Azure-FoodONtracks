#!/usr/bin/env pwsh
# AWS ECS Deployment Script for FoodONtracks
# This script creates/updates ECS cluster, task definition, and service

param(
    [Parameter(Mandatory=$false)]
    [string]$ClusterName = "foodontracks-cluster",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "foodontracks-service",
    
    [Parameter(Mandatory=$false)]
    [string]$AwsRegion = "ap-south-1",
    
    [Parameter(Mandatory=$false)]
    [int]$DesiredCount = 1
)

Write-Host "🚀 AWS ECS Deployment Script for FoodONtracks" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Get AWS Account ID
Write-Host "🔍 Retrieving AWS Account ID..." -ForegroundColor Yellow
$awsAccountId = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get AWS Account ID. Ensure AWS CLI is configured." -ForegroundColor Red
    exit 1
}
Write-Host "✅ AWS Account ID: $awsAccountId" -ForegroundColor Green

# Step 1: Create ECS Cluster (if not exists)
Write-Host ""
Write-Host "📦 Creating/Checking ECS Cluster..." -ForegroundColor Yellow
$clusterExists = aws ecs describe-clusters --clusters $ClusterName --region $AwsRegion --query "clusters[0].status" --output text 2>$null

if ($clusterExists -ne "ACTIVE") {
    Write-Host "Creating ECS cluster: $ClusterName" -ForegroundColor Yellow
    aws ecs create-cluster --cluster-name $ClusterName --region $AwsRegion
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Cluster created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create cluster" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Cluster already exists" -ForegroundColor Green
}

# Step 2: Create CloudWatch Log Group
Write-Host ""
Write-Host "📊 Creating CloudWatch Log Group..." -ForegroundColor Yellow
$logGroupExists = aws logs describe-log-groups --log-group-name-prefix "/ecs/foodontracks" --region $AwsRegion --query "logGroups[0].logGroupName" --output text 2>$null

if ($logGroupExists -ne "/ecs/foodontracks") {
    aws logs create-log-group --log-group-name "/ecs/foodontracks" --region $AwsRegion
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Log group created" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Log group already exists" -ForegroundColor Green
}

# Step 3: Replace placeholders in task definition
Write-Host ""
Write-Host "📝 Preparing task definition..." -ForegroundColor Yellow
$taskDefContent = Get-Content "aws-ecs-task-definition.json" -Raw
$taskDefContent = $taskDefContent -replace '<AWS_ACCOUNT_ID>', $awsAccountId
$taskDefContent | Set-Content "aws-ecs-task-definition-prepared.json"

# Step 4: Register Task Definition
Write-Host ""
Write-Host "📋 Registering ECS Task Definition..." -ForegroundColor Yellow
$taskDefArn = aws ecs register-task-definition --cli-input-json file://aws-ecs-task-definition-prepared.json --region $AwsRegion --query "taskDefinition.taskDefinitionArn" --output text

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to register task definition" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Task Definition registered: $taskDefArn" -ForegroundColor Green

# Step 5: Check if service exists
Write-Host ""
Write-Host "🔍 Checking if service exists..." -ForegroundColor Yellow
$serviceExists = aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $AwsRegion --query "services[0].status" --output text 2>$null

if ($serviceExists -eq "ACTIVE") {
    # Update existing service
    Write-Host "Updating existing service..." -ForegroundColor Yellow
    aws ecs update-service `
        --cluster $ClusterName `
        --service $ServiceName `
        --task-definition $taskDefArn `
        --desired-count $DesiredCount `
        --region $AwsRegion
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Service updated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to update service" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Service doesn't exist. Creating service requires:" -ForegroundColor Yellow
    Write-Host "  - VPC ID" -ForegroundColor Gray
    Write-Host "  - Subnet IDs (at least 2)" -ForegroundColor Gray
    Write-Host "  - Security Group ID" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Please create the service manually using AWS Console or provide these parameters." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example AWS CLI command:" -ForegroundColor Cyan
    Write-Host @"
aws ecs create-service \
  --cluster $ClusterName \
  --service-name $ServiceName \
  --task-definition $taskDefArn \
  --desired-count $DesiredCount \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region $AwsRegion
"@ -ForegroundColor Gray
}

# Step 6: Display service information
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Configuration Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  Cluster: $ClusterName" -ForegroundColor Gray
Write-Host "  Service: $ServiceName" -ForegroundColor Gray
Write-Host "  Task Definition: $taskDefArn" -ForegroundColor Gray
Write-Host "  Region: $AwsRegion" -ForegroundColor Gray
Write-Host ""
Write-Host "View in AWS Console:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/ecs/v2/clusters/${ClusterName}/services?region=${AwsRegion}" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitor deployment:" -ForegroundColor Yellow
Write-Host "  aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $AwsRegion" -ForegroundColor Gray

# Cleanup
Remove-Item "aws-ecs-task-definition-prepared.json" -ErrorAction SilentlyContinue
