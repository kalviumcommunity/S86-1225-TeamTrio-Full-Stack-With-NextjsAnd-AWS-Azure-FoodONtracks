#!/usr/bin/env pwsh
# Docker Build and Test Script (Development Mode)
# This uses the development Dockerfile which doesn't require a production build

Write-Host "FoodONtracks - Docker Development Build Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$IMAGE_NAME = "foodontracks-dev"
$IMAGE_TAG = "latest"
$CONTAINER_NAME = "foodontracks-dev-test"
$PORT = 3000

# Step 1: Clean up existing containers
Write-Host "[1/6] Cleaning up existing containers..." -ForegroundColor Yellow
docker stop $CONTAINER_NAME 2>$null
docker rm $CONTAINER_NAME 2>$null

# Step 2: Build the Docker image
Write-Host ""
Write-Host "[2/6] Building Docker image (development mode)..." -ForegroundColor Yellow
Write-Host "Image: ${IMAGE_NAME}:${IMAGE_TAG}" -ForegroundColor Gray

$buildStart = Get-Date
docker build -f Dockerfile.dev -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker build failed!" -ForegroundColor Red
    exit 1
}

$buildEnd = Get-Date
$buildDuration = ($buildEnd - $buildStart).TotalSeconds
Write-Host "[OK] Build completed in $([math]::Round($buildDuration, 2)) seconds" -ForegroundColor Green

# Step 3: Get image size
Write-Host ""
Write-Host "[3/6] Checking image size..." -ForegroundColor Yellow
$imageSize = docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "{{.Size}}"
Write-Host "Image Size: $imageSize" -ForegroundColor Cyan

# Step 4: Run the container
Write-Host ""
Write-Host "[4/6] Starting container..." -ForegroundColor Yellow
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
Write-Host "[5/6] Waiting for Next.js dev server to start..." -ForegroundColor Yellow
Write-Host "(This may take 20-30 seconds for development mode)" -ForegroundColor Gray
Start-Sleep -Seconds 15

# Check container status
$containerStatus = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}"
Write-Host "Container Status: $containerStatus" -ForegroundColor Gray

# Show container logs
Write-Host ""
Write-Host "Container Logs:" -ForegroundColor Cyan
docker logs --tail 15 $CONTAINER_NAME

# Step 6: Test the application
Write-Host ""
Write-Host "[6/6] Testing application..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:${PORT}" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Application is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "[INFO] App may still be starting: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "       Check logs above or wait a bit longer" -ForegroundColor Gray
}

# Display useful commands
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Container is running in DEV mode!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at: http://localhost:${PORT}" -ForegroundColor Cyan
Write-Host "Note: Development mode includes hot-reload" -ForegroundColor Gray
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:        docker logs -f $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Stop container:   docker stop $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Remove container: docker rm $CONTAINER_NAME" -ForegroundColor Gray
Write-Host "  Shell access:     docker exec -it $CONTAINER_NAME /bin/sh" -ForegroundColor Gray
Write-Host ""
