#!/usr/bin/env pwsh
# Docker Build and Test Script for FoodONtracks
# Run this script to build and test the Docker container locally

# Ensure we're in the correct directory (where the script is located)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($scriptPath) {
    Set-Location $scriptPath
}

Write-Host "FoodONtracks - Docker Build and Test Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Working Directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Configuration
$IMAGE_NAME = "foodontracks"
$IMAGE_TAG = "latest"
$CONTAINER_NAME = "foodontracks-test"
$PORT = 3000

# Step 1: Clean up existing containers and images
Write-Host "[1/7] Cleaning up existing containers..." -ForegroundColor Yellow
docker stop $CONTAINER_NAME 2>$null
docker rm $CONTAINER_NAME 2>$null

# Step 2: Build the Docker image
Write-Host ""
Write-Host "[2/7] Building Docker image..." -ForegroundColor Yellow
Write-Host "Image: ${IMAGE_NAME}:${IMAGE_TAG}" -ForegroundColor Gray

$buildStart = Get-Date
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker build failed!" -ForegroundColor Red
    exit 1
}

$buildEnd = Get-Date
$buildDuration = ($buildEnd - $buildStart).TotalSeconds
Write-Host "[OK] Build completed in $([math]::Round($buildDuration, 2)) seconds" -ForegroundColor Green

# Step 3: Get image size
Write-Host ""
Write-Host "[3/7] Checking image size..." -ForegroundColor Yellow
$imageSize = docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "{{.Size}}"
Write-Host "Image Size: $imageSize" -ForegroundColor Cyan

# Step 4: Run the container
Write-Host ""
Write-Host "[4/7] Starting container..." -ForegroundColor Yellow
Write-Host "Container: $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "Port: ${PORT}:${PORT}" -ForegroundColor Gray

# Load environment variables from .env file
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env" -ForegroundColor Gray
    docker run -d --name $CONTAINER_NAME -p "${PORT}:${PORT}" --env-file $envFile "${IMAGE_NAME}:${IMAGE_TAG}"
} else {
    Write-Host "[WARN] No .env file found, using defaults" -ForegroundColor Yellow
    docker run -d --name $CONTAINER_NAME -p "${PORT}:${PORT}" "${IMAGE_NAME}:${IMAGE_TAG}"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start container!" -ForegroundColor Red
    exit 1
}

# Step 5: Wait for container to be ready
Write-Host ""
Write-Host "[5/7] Waiting for container to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container status
$containerStatus = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}"
Write-Host "Container Status: $containerStatus" -ForegroundColor Gray

# Step 6: Show container logs
Write-Host ""
Write-Host "[6/7] Container Logs (last 20 lines):" -ForegroundColor Cyan
docker logs --tail 20 $CONTAINER_NAME

# Step 7: Test the application
Write-Host ""
Write-Host "[7/7] Testing application endpoints..." -ForegroundColor Yellow

Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:${PORT}" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Root endpoint (/) is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARN] Root endpoint test: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:${PORT}/api/health" -UseBasicParsing -TimeoutSec 10
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "[OK] Health endpoint (/api/health) is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARN] Health endpoint test: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 8: Display useful commands
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Container is running!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at: http://localhost:${PORT}" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:        docker logs -f $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Stop container:   docker stop $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Remove container: docker rm $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Shell access:     docker exec -it $CONTAINER_NAME /bin/sh" -ForegroundColor Gray
Write-Host ""
Write-Host "Container Stats:" -ForegroundColor Yellow
docker stats --no-stream $CONTAINER_NAME

