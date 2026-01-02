# CloudWatch Dashboard Setup Script for FoodONtracks Application
# This script creates CloudWatch dashboards for monitoring application health,
# performance, and errors in AWS ECS deployment.
#
# Prerequisites:
#   - AWS CLI installed and configured with appropriate credentials
#   - AWS_REGION environment variable set or --region parameter provided
#   - CloudWatch Logs group exists (/ecs/foodontracks-api)
#
# Usage:
#   .\setup-cloudwatch-dashboard.ps1 -Region us-east-1 -Environment production

param(
    [Parameter(Mandatory = $false)]
    [string]$Region = $env:AWS_REGION,

    [Parameter(Mandatory = $false)]
    [string]$Environment = "production",

    [Parameter(Mandatory = $false)]
    [string]$LogGroup = "/ecs/foodontracks-api",

    [Parameter(Mandatory = $false)]
    [string]$DashboardName = "FoodONtracks-Application-Health"
)

# Validate parameters
if (-not $Region) {
    $Region = "us-east-1"
    Write-Host "No region specified, using default: $Region" -ForegroundColor Yellow
}

$ErrorActionPreference = "Stop"

Write-Host "🔧 Setting up CloudWatch Dashboard for FoodONtracks" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Gray
Write-Host "Environment: $Environment" -ForegroundColor Gray
Write-Host "Log Group: $LogGroup" -ForegroundColor Gray
Write-Host ""

# Define dashboard widgets
$dashboardBody = @{
    widgets = @(
        @{
            type = "metric"
            properties = @{
                metrics = @(
                    @("AWS/Logs", "IncomingBytes", @{ stat = "Sum" }),
                    @("AWS/Logs", "IncomingLogEvents", @{ stat = "Sum" })
                )
                period = 300
                stat = "Average"
                region = $Region
                title = "Log Ingestion Rate"
                yAxis = @{
                    left = @{
                        min = 0
                    }
                }
            }
        },
        @{
            type = "log"
            properties = @{
                query = "fields @timestamp, level, duration, statusCode | filter level = 'error' | stats count() as ErrorCount by bin(5m)"
                region = $Region
                title = "Error Count (5-minute intervals)"
            }
        },
        @{
            type = "log"
            properties = @{
                query = "fields @timestamp, duration | stats avg(duration) as AvgResponseTime, max(duration) as MaxResponseTime, pct(duration, 95) as P95ResponseTime by bin(1m)"
                region = $Region
                title = "Response Time Metrics"
            }
        },
        @{
            type = "log"
            properties = @{
                query = "fields @timestamp, statusCode | stats count() as TotalRequests by statusCode"
                region = $Region
                title = "Requests by Status Code"
            }
        },
        @{
            type = "log"
            properties = @{
                query = "fields @timestamp, endpoint, method, duration | stats count() as RequestCount, avg(duration) as AvgDuration by endpoint, method | sort RequestCount desc"
                region = $Region
                title = "Top Endpoints by Request Count"
            }
        },
        @{
            type = "log"
            properties = @{
                query = "fields @timestamp, userId, statusCode | filter statusCode >= 400 | stats count() as ErrorCount by userId"
                region = $Region
                title = "User Errors"
            }
        },
        @{
            type = "metric"
            properties = @{
                metrics = @(
                    @("AWS/ECS", "CPUUtilization", @{ stat = "Average" }),
                    @("AWS/ECS", "MemoryUtilization", @{ stat = "Average" })
                )
                period = 300
                stat = "Average"
                region = $Region
                title = "ECS Task Resource Utilization"
                yAxis = @{
                    left = @{
                        min = 0
                        max = 100
                    }
                }
            }
        },
        @{
            type = "log"
            properties = @{
                query = "fields @timestamp, level | stats count() as LogCount by level"
                region = $Region
                title = "Log Level Distribution"
            }
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "📊 Creating CloudWatch Dashboard..." -ForegroundColor Cyan
    
    $result = aws cloudwatch put-dashboard `
        --dashboard-name $DashboardName `
        --dashboard-body $dashboardBody `
        --region $Region 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dashboard created successfully" -ForegroundColor Green
        Write-Host "Dashboard name: $DashboardName" -ForegroundColor Green
        Write-Host "View in AWS Console: https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=$DashboardName" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to create dashboard" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Create metric filters for better tracking
Write-Host ""
Write-Host "📈 Setting up Metric Filters..." -ForegroundColor Cyan

$metricFilters = @(
    @{
        name           = "ErrorCount"
        pattern        = "[time, request_id, level = \"error\", ...]"
        metricName     = "ApplicationErrors"
        metricValue    = "1"
        namespace      = "FoodONtracks"
        defaultValue   = 0
    },
    @{
        name           = "SlowRequests"
        pattern        = "[time, request_id, level, message, duration >= 1000, ...]"
        metricName     = "SlowRequestCount"
        metricValue    = "1"
        namespace      = "FoodONtracks"
        defaultValue   = 0
    },
    @{
        name           = "SuccessfulRequests"
        pattern        = "[time, request_id, level, message, status_code >= 200 && status_code < 300, ...]"
        metricName     = "SuccessfulRequests"
        metricValue    = "1"
        namespace      = "FoodONtracks"
        defaultValue   = 0
    }
)

foreach ($filter in $metricFilters) {
    try {
        Write-Host "Creating metric filter: $($filter.name)" -ForegroundColor Gray
        
        $transformations = @{
            metricName      = $filter.metricName
            metricNamespace = $filter.namespace
            metricValue     = $filter.metricValue
            defaultValue    = $filter.defaultValue
        } | ConvertTo-Json

        aws logs put-metric-filter `
            --log-group-name $LogGroup `
            --filter-name $filter.name `
            --filter-pattern $filter.pattern `
            --metric-transformations $transformations `
            --region $Region 2>&1 | Out-Null

        Write-Host "  ✅ Metric filter '$($filter.name)' created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Could not create metric filter '$($filter.name)': $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 CloudWatch Dashboard setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify the dashboard displays data: aws cloudwatch get-dashboard --dashboard-name $DashboardName --region $Region" -ForegroundColor Gray
Write-Host "2. Set up alarms for error metrics using: .\setup-cloudwatch-alarms.ps1" -ForegroundColor Gray
Write-Host "3. Monitor logs using CloudWatch Logs Insights queries" -ForegroundColor Gray
Write-Host "4. Review metrics in CloudWatch Metrics console" -ForegroundColor Gray
