# CloudWatch Alarms Setup Script for FoodONtracks Application
# This script creates CloudWatch alarms to monitor application health and performance
#
# Prerequisites:
#   - AWS CLI installed and configured
#   - SNS topic for notifications (created or specified)
#   - CloudWatch metric filters already configured
#
# Usage:
#   .\setup-cloudwatch-alarms.ps1 -Region us-east-1 -SNSTopicArn "arn:aws:sns:..."

param(
    [Parameter(Mandatory = $false)]
    [string]$Region = $env:AWS_REGION,

    [Parameter(Mandatory = $false)]
    [string]$SNSTopicArn,

    [Parameter(Mandatory = $false)]
    [string]$Environment = "production",

    [Parameter(Mandatory = $false)]
    [string]$MetricNamespace = "FoodONtracks"
)

if (-not $Region) {
    $Region = "us-east-1"
}

$ErrorActionPreference = "Stop"

Write-Host "🔔 Setting up CloudWatch Alarms for FoodONtracks" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Gray
Write-Host "Environment: $Environment" -ForegroundColor Gray
Write-Host ""

# Create SNS topic if not specified
if (-not $SNSTopicArn) {
    Write-Host "📨 Creating SNS topic for alarm notifications..." -ForegroundColor Cyan
    $topicName = "foodontracks-alarms-$Environment"
    
    try {
        $topicResponse = aws sns create-topic `
            --name $topicName `
            --region $Region `
            --output json | ConvertFrom-Json

        $SNSTopicArn = $topicResponse.TopicArn
        Write-Host "✅ SNS Topic created: $SNSTopicArn" -ForegroundColor Green
        Write-Host "   Note: Subscribe to this topic via AWS Console to receive notifications" -ForegroundColor Yellow
    } catch {
        Write-Host "⚠️  Could not create SNS topic (may already exist): $_" -ForegroundColor Yellow
        Write-Host "   Please provide SNS topic ARN using -SNSTopicArn parameter" -ForegroundColor Yellow
        exit 1
    }
}

# Define alarms
$alarms = @(
    @{
        name        = "FoodONtracks-HighErrorRate"
        metric      = "ApplicationErrors"
        threshold   = 10
        comparison  = "GreaterThanOrEqualToThreshold"
        statistic   = "Sum"
        period      = 300
        evaluations = 1
        description = "Alert when application error count >= 10 in 5 minutes"
    },
    @{
        name        = "FoodONtracks-SlowRequests"
        metric      = "SlowRequestCount"
        threshold   = 5
        comparison  = "GreaterThanOrEqualToThreshold"
        statistic   = "Sum"
        period      = 300
        evaluations = 2
        description = "Alert when slow requests (>1000ms) >= 5 in 5 minutes (2 consecutive periods)"
    },
    @{
        name        = "FoodONtracks-HighErrorRate-Severe"
        metric      = "ApplicationErrors"
        threshold   = 50
        comparison  = "GreaterThanOrEqualToThreshold"
        statistic   = "Sum"
        period      = 60
        evaluations = 1
        description = "Alert when application error count >= 50 in 1 minute (severe)"
    },
    @{
        name        = "FoodONtracks-LowSuccessRate"
        metric      = "SuccessfulRequests"
        threshold   = 5
        comparison  = "LessThanOrEqualToThreshold"
        statistic   = "Sum"
        period      = 300
        evaluations = 2
        description = "Alert when successful requests <= 5 in 5 minutes"
    }
)

Write-Host "🔔 Creating alarms..." -ForegroundColor Cyan

foreach ($alarm in $alarms) {
    try {
        Write-Host "Creating alarm: $($alarm.name)" -ForegroundColor Gray
        
        aws cloudwatch put-metric-alarm `
            --alarm-name $alarm.name `
            --alarm-description $alarm.description `
            --metric-name $alarm.metric `
            --namespace $MetricNamespace `
            --statistic $alarm.statistic `
            --period $alarm.period `
            --threshold $alarm.threshold `
            --comparison-operator $alarm.comparison `
            --evaluation-periods $alarm.evaluations `
            --alarm-actions $SNSTopicArn `
            --region $Region 2>&1 | Out-Null

        Write-Host "  ✅ Alarm '$($alarm.name)' created" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to create alarm '$($alarm.name)': $_" -ForegroundColor Red
    }
}

# Create composite alarm for overall health
Write-Host ""
Write-Host "🏥 Creating composite health alarm..." -ForegroundColor Cyan

try {
    $alarmRule = "ALARM(FoodONtracks-HighErrorRate) OR ALARM(FoodONtracks-SlowRequests) OR ALARM(FoodONtracks-LowSuccessRate)"
    
    aws cloudwatch put-composite-alarm `
        --alarm-name "FoodONtracks-Application-Health" `
        --alarm-description "Composite alarm for overall application health" `
        --alarm-rule $alarmRule `
        --alarm-actions $SNSTopicArn `
        --region $Region 2>&1 | Out-Null

    Write-Host "✅ Composite alarm 'FoodONtracks-Application-Health' created" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not create composite alarm: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 CloudWatch Alarms setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Subscribe to SNS topic: $SNSTopicArn" -ForegroundColor Gray
Write-Host "   aws sns subscribe --topic-arn $SNSTopicArn --protocol email --notification-endpoint your-email@example.com --region $Region" -ForegroundColor Gray
Write-Host "2. View alarms in CloudWatch Console" -ForegroundColor Gray
Write-Host "3. Test alarm notifications by triggering metrics" -ForegroundColor Gray
Write-Host "4. Adjust thresholds based on application baseline" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 CloudWatch Alarms Console:" -ForegroundColor Cyan
Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=$Region#alarmsV2:" -ForegroundColor Cyan
