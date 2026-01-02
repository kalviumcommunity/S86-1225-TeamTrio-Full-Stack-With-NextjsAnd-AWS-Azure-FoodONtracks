# Azure Monitor Setup Script for FoodONtracks Application
# This script creates Application Insights and Log Analytics Workspace for monitoring
#
# Prerequisites:
#   - Azure CLI installed and configured
#   - Appropriate Azure subscription and permissions
#   - Resource group already created
#
# Usage:
#   .\setup-azure-monitor.ps1 -ResourceGroup "foodontracks-rg" -Location "eastus"

param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroup,

    [Parameter(Mandatory = $false)]
    [string]$Location = "eastus",

    [Parameter(Mandatory = $false)]
    [string]$AppInsightsName = "foodontracks-insights",

    [Parameter(Mandatory = $false)]
    [string]$LogAnalyticsName = "foodontracks-logs"
)

$ErrorActionPreference = "Stop"

Write-Host "📊 Setting up Azure Monitor for FoodONtracks" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Gray
Write-Host "Location: $Location" -ForegroundColor Gray
Write-Host ""

# Verify Azure CLI is available
try {
    $azVersion = az --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Azure CLI found: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI." -ForegroundColor Red
    exit 1
}

# Check if resource group exists
Write-Host "Checking resource group..." -ForegroundColor Cyan
$rgExists = az group exists --name $ResourceGroup 2>&1
if ($rgExists -eq "false") {
    Write-Host "Creating resource group: $ResourceGroup" -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location
}

# Create Log Analytics Workspace
Write-Host ""
Write-Host "📝 Creating Log Analytics Workspace..." -ForegroundColor Cyan

try {
    $logAnalytics = az monitor log-analytics workspace create `
        --resource-group $ResourceGroup `
        --workspace-name $LogAnalyticsName `
        --location $Location `
        --output json 2>&1 | ConvertFrom-Json

    $workspaceId = $logAnalytics.id
    $workspaceKey = az monitor log-analytics workspace get-shared-keys `
        --resource-group $ResourceGroup `
        --workspace-name $LogAnalyticsName `
        --query "primarySharedKey" `
        --output tsv

    Write-Host "✅ Log Analytics Workspace created" -ForegroundColor Green
    Write-Host "   Name: $LogAnalyticsName" -ForegroundColor Green
    Write-Host "   Workspace ID: $($logAnalytics.customerId)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Log Analytics Workspace creation failed: $_" -ForegroundColor Yellow
    $workspaceId = ""
    $workspaceKey = ""
}

# Create Application Insights
Write-Host ""
Write-Host "📊 Creating Application Insights..." -ForegroundColor Cyan

try {
    $appInsights = az monitor app-insights component create `
        --app $AppInsightsName `
        --location $Location `
        --resource-group $ResourceGroup `
        --application-type web `
        --kind web `
        --output json 2>&1 | ConvertFrom-Json

    $instrumentationKey = $appInsights.instrumentationKey
    $appId = $appInsights.appId

    Write-Host "✅ Application Insights created" -ForegroundColor Green
    Write-Host "   Name: $AppInsightsName" -ForegroundColor Green
    Write-Host "   Instrumentation Key: $instrumentationKey" -ForegroundColor Yellow
    Write-Host "   App ID: $appId" -ForegroundColor Gray
} catch {
    Write-Host "❌ Application Insights creation failed: $_" -ForegroundColor Red
    exit 1
}

# Link Application Insights to Log Analytics Workspace
if ($workspaceId) {
    Write-Host ""
    Write-Host "🔗 Linking Application Insights to Log Analytics..." -ForegroundColor Cyan
    
    try {
        az monitor app-insights component linked-storage create `
            --resource-group $ResourceGroup `
            --app $AppInsightsName `
            --storage-account-id $workspaceId `
            --output json | Out-Null

        Write-Host "✅ Linked successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Linking failed: $_" -ForegroundColor Yellow
    }
}

# Create action group for alerts
Write-Host ""
Write-Host "🔔 Creating Alert Action Group..." -ForegroundColor Cyan

$actionGroupName = "foodontracks-alerts"
try {
    $actionGroup = az monitor action-group create `
        --resource-group $ResourceGroup `
        --name $actionGroupName `
        --short-name "FOT" `
        --output json 2>&1 | ConvertFrom-Json

    Write-Host "✅ Action Group created: $actionGroupName" -ForegroundColor Green
    Write-Host "   Add email recipients via Azure Portal" -ForegroundColor Yellow
} catch {
    Write-Host "⚠️  Action Group creation failed: $_" -ForegroundColor Yellow
}

# Create metric alerts
Write-Host ""
Write-Host "📈 Creating Metric Alerts..." -ForegroundColor Cyan

$alerts = @(
    @{
        name        = "HighErrorRate"
        description = "Alert when error rate exceeds 5%"
        condition   = "failed requests percentage"
        operator    = "GreaterThan"
        threshold   = 5
    },
    @{
        name        = "HighResponseTime"
        description = "Alert when response time exceeds 2 seconds"
        condition   = "server response time"
        operator    = "GreaterThan"
        threshold   = 2000
    },
    @{
        name        = "LowAvailability"
        description = "Alert when availability falls below 99%"
        condition   = "availability"
        operator    = "LessThan"
        threshold   = 99
    }
)

foreach ($alert in $alerts) {
    try {
        Write-Host "Creating alert: $($alert.name)" -ForegroundColor Gray
        
        az monitor metrics alert create `
            --name "foodontracks-$($alert.name)" `
            --resource-group $ResourceGroup `
            --scopes "/subscriptions/$(az account show --query id -o tsv)/resourcegroups/$ResourceGroup/providers/microsoft.insights/components/$AppInsightsName" `
            --description $alert.description `
            --condition "avg $($alert.condition) $($alert.operator) $($alert.threshold)" `
            --window-size 5m `
            --evaluation-frequency 1m `
            --action $actionGroupName `
            --output json | Out-Null

        Write-Host "  ✅ Alert '$($alert.name)' created" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Failed to create alert '$($alert.name)': $_" -ForegroundColor Yellow
    }
}

# Output configuration for Next.js application
Write-Host ""
Write-Host "🎉 Azure Monitor setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Application Configuration:" -ForegroundColor Cyan
Write-Host "Add these to your .env.production file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "AZURE_MONITOR_ENABLED=true" -ForegroundColor Cyan
Write-Host "AZURE_INSTRUMENTATION_KEY=$instrumentationKey" -ForegroundColor Cyan
Write-Host "AZURE_LOG_ANALYTICS_WORKSPACE_ID=$(if ($workspaceId) { $logAnalytics.customerId } else { '<workspace-id>' })" -ForegroundColor Cyan
Write-Host ""

# Provide Kusto query examples
Write-Host "📊 Sample Kusto Queries for Log Analytics:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Request volume over time:" -ForegroundColor Yellow
Write-Host "  customEvents | where name == 'RequestLogged' | summarize count() by bin(timestamp, 5m) | render timechart" -ForegroundColor Gray
Write-Host ""
Write-Host "Error rate:" -ForegroundColor Yellow
Write-Host "  traces | where severityLevel >= 2 | summarize count() by bin(timestamp, 5m) | render timechart" -ForegroundColor Gray
Write-Host ""
Write-Host "Average response time:" -ForegroundColor Yellow
Write-Host "  customMetrics | where name == 'ResponseTime' | summarize avg(value) by bin(timestamp, 1m) | render timechart" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Portal Links:" -ForegroundColor Cyan
Write-Host "Application Insights: https://portal.azure.com/#@/resource$($appInsights.id)" -ForegroundColor Cyan
Write-Host "Log Analytics: https://portal.azure.com/#@/resource$(if ($workspaceId) { $workspaceId })" -ForegroundColor Cyan
