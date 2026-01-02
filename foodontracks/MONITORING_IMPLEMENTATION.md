# Cloud Monitoring & Logging Implementation Guide

## Overview

This guide documents the structured logging, CloudWatch (AWS), and Azure Monitor integration for the FoodONtracks Next.js application. The implementation provides:

- **Structured JSON logging** with correlation IDs for request tracing
- **CloudWatch Logs** (AWS) and **Azure Monitor** (Azure) integration
- **Metric filters** for error tracking, slow request detection, and success monitoring
- **Dashboards** for visualizing application health and performance
- **Alarms** for proactive problem detection with notifications
- **Log retention policies** and cost optimization

## Architecture

### Logging Flow

```
Application
    ↓
Logger (src/lib/logger.ts)
    ├→ Development: Pretty-printed console output
    └→ Production: JSON output
        ↓
    Container Logs (Docker/ECS)
        ↓
    CloudWatch Logs / Azure Monitor
        ↓
    Metric Filters / Log Analytics
        ↓
    Dashboards & Alerts
```

### Key Components

1. **Logger** (`src/lib/logger.ts`): Core logging with structured format, correlation IDs, request tracking
2. **Logging Middleware** (`src/lib/logging-middleware.ts`): Automatic API request/response logging with timing
3. **CloudWatch Integration** (`src/lib/cloudwatch-logger.ts`): AWS CloudWatch Logs buffering and batching
4. **Azure Monitor Integration** (`src/lib/azure-monitor-logger.ts`): Azure Application Insights and Log Analytics
5. **Setup Scripts**: PowerShell automation for dashboard and alarm creation

## Log Entry Structure

Each log entry includes:

```json
{
  "level": "info|error|warn|debug",
  "message": "Human-readable message",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "environment": "development|production",
  "service": "foodontracks-api",
  "version": "1.0.0",
  "requestId": "1705314645123-abc1234",
  "userId": "user-123",
  "endpoint": "/api/orders",
  "method": "POST",
  "statusCode": 201,
  "duration": 145,
  "context": {
    "responseTime": "145ms",
    "errorDetail": "Optional error details"
  },
  "meta": {
    "additionalData": "Optional metadata"
  }
}
```

## AWS CloudWatch Setup

### Prerequisites

- AWS CLI configured with appropriate credentials
- CloudWatch Logs group created (`/ecs/foodontracks-api`)
- ECS task definition with log configuration

### Configuration

Set environment variables:

```bash
# .env.production
CLOUDWATCH_ENABLED=true
CLOUDWATCH_LOG_GROUP=/ecs/foodontracks-api
CLOUDWATCH_LOG_STREAM=api-events
AWS_REGION=us-east-1
```

### Creating Dashboard

```powershell
.\setup-cloudwatch-dashboard.ps1 -Region us-east-1 -Environment production
```

This creates a dashboard with:
- Log ingestion rate
- Error count (5-minute intervals)
- Response time metrics (average, max, p95)
- Requests by status code
- Top endpoints by request count
- User errors
- ECS task resource utilization
- Log level distribution

### Creating Alarms

```powershell
.\setup-cloudwatch-alarms.ps1 -Region us-east-1 -SNSTopicArn "arn:aws:sns:..."
```

Alarms created:
- **FoodONtracks-HighErrorRate**: 10+ errors in 5 minutes
- **FoodONtracks-SlowRequests**: 5+ requests >1000ms in 5 minutes (2 consecutive periods)
- **FoodONtracks-HighErrorRate-Severe**: 50+ errors in 1 minute
- **FoodONtracks-LowSuccessRate**: 5 or fewer successful requests in 5 minutes
- **FoodONtracks-Application-Health**: Composite alarm

### CloudWatch Logs Insights Queries

**Request Volume (5-minute intervals)**
```
fields @timestamp, @message 
| stats count() as RequestCount by bin(5m)
```

**Error Analysis**
```
fields @timestamp, level, message, context.errorDetail
| filter level = 'error'
| stats count() as ErrorCount, latest(context.errorDetail) as LatestError by endpoint
```

**Response Time Analysis**
```
fields @timestamp, endpoint, duration
| filter duration > 0
| stats avg(duration) as AvgResponseTime, max(duration) as MaxResponseTime, pct(duration, 95) as P95ResponseTime by endpoint
```

**Slow Requests**
```
fields @timestamp, endpoint, method, duration, statusCode
| filter duration > 1000
| stats count() as SlowRequestCount by endpoint, method
| sort SlowRequestCount desc
```

**User Activity**
```
fields @timestamp, userId, endpoint, method, statusCode
| stats count() as RequestCount, sum(if(statusCode >= 400, 1, 0)) as ErrorCount by userId
```

### Cost Optimization

CloudWatch pricing:
- **Logs**: $0.50 per GB ingested, $0.03 per GB stored per month
- **Metric Filters**: $0.30 per filter per month
- **Log Insights Queries**: $0.0075 per GB analyzed

**Optimize with:**
- Set log retention: 14 days (default) to 30 days (production)
- Use metric filters instead of Log Insights for frequent queries
- Archive old logs to S3 for compliance

## Azure Monitor Setup

### Prerequisites

- Azure CLI installed and configured
- Appropriate Azure subscription and permissions
- Resource group created

### Configuration

Run setup script:

```powershell
.\setup-azure-monitor.ps1 -ResourceGroup "foodontracks-rg" -Location "eastus"
```

This creates:
- Log Analytics Workspace
- Application Insights instance
- Alert action group
- Metric alerts (high error rate, high response time, low availability)

Set environment variables:

```bash
# .env.production
AZURE_MONITOR_ENABLED=true
AZURE_INSTRUMENTATION_KEY=<instrumentation-key>
AZURE_LOG_ANALYTICS_WORKSPACE_ID=<workspace-id>
```

### Kusto Query Language (KQL) Examples

**Request Volume Timeline**
```kusto
customEvents
| where name == "RequestLogged"
| summarize RequestCount = count() by bin(timestamp, 5m)
| render timechart
```

**Error Rate Over Time**
```kusto
traces
| where severityLevel >= 2
| summarize ErrorCount = count() by bin(timestamp, 5m)
| render timechart
```

**Response Time Metrics**
```kusto
customMetrics
| where name == "ResponseTime"
| summarize AvgTime = avg(value), MaxTime = max(value), P95 = percentile(value, 95) by bin(timestamp, 1m)
| render timechart
```

**Endpoint Performance**
```kusto
customEvents
| where name == "RequestLogged"
| summarize 
    RequestCount = count(),
    AvgDuration = avg(todouble(customDimensions.duration)),
    ErrorCount = sum(if(toint(customDimensions.statusCode) >= 400, 1, 0))
    by tostring(customDimensions.endpoint), tostring(customDimensions.method)
| order by RequestCount desc
```

**User Analysis**
```kusto
traces
| where severityLevel >= 2
| summarize ErrorCount = count() by tostring(customDimensions.userId)
| order by ErrorCount desc
```

### Cost Optimization

Azure Monitor pricing:
- **Log Analytics**: $0.30 per GB ingested, $0.10-$0.25 per GB stored per month (varies by commitment)
- **Application Insights**: $0.30 per GB ingested
- **Alerts**: $0.10 per alert rule per month

**Optimize with:**
- Use 30-day retention for production logs
- Set appropriate sampling rates (default 100%)
- Use alert action groups for consolidated notifications
- Archive to Azure Blob Storage for compliance

## Application Integration

### Using the Logger

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('Server started');

// With request context
logger.info('Processing order', {
  requestId: 'req-123',
  userId: 'user-456',
  endpoint: '/api/orders',
  method: 'POST',
  context: { orderId: '789' }
});

// Error logging
try {
  // Some operation
} catch (error) {
  logger.error('Failed to process order', error, {
    requestId: 'req-123',
    userId: 'user-456',
    statusCode: 500
  });
}

// API request logging
logger.logRequest(
  'req-123',           // requestId
  'POST',              // method
  '/api/orders',       // endpoint
  201,                 // statusCode
  145,                 // duration in ms
  'user-456',          // userId
  undefined            // error
);
```

### Using Logging Middleware

```typescript
import { loggingMiddleware } from '@/lib/logging-middleware';

export const POST = loggingMiddleware(async (req) => {
  // Handler code
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 201
  });
});
```

## Monitoring Best Practices

### 1. Correlation IDs

Always pass correlation IDs through request chains:

```typescript
const requestId = logger.generateRequestId();
// Include in all logs for this request
logger.info('Processing', { requestId, ... });
```

### 2. Structured Logging

Use the context object for structured data:

```typescript
logger.info('User logged in', {
  requestId: 'req-123',
  userId: 'user-456',
  context: {
    loginMethod: 'oauth',
    provider: 'google',
    ipAddress: '192.168.1.1'
  }
});
```

### 3. Error Context

Include error details in logs:

```typescript
try {
  // Database operation
} catch (error) {
  logger.error('Database query failed', error, {
    requestId: 'req-123',
    context: {
      query: 'SELECT * FROM orders',
      table: 'orders'
    }
  });
}
```

### 4. Performance Tracking

Log slow operations:

```typescript
const startTime = Date.now();
// Long operation
const duration = Date.now() - startTime;

logger.info('Batch processing complete', {
  requestId: 'req-123',
  duration,
  context: {
    itemsProcessed: 500,
    durationPerItem: duration / 500
  }
});
```

### 5. Alert Thresholds

- **Error Rate**: Alert when 10+ errors per 5 minutes (2% of typical 500 req/min)
- **Response Time**: Alert when P95 > 2 seconds or max > 5 seconds
- **Availability**: Alert when < 99% of requests succeed
- **Slow Requests**: Alert when >1% of requests exceed 1 second

Adjust based on your application's baseline performance.

## Troubleshooting

### Logs Not Appearing in CloudWatch

1. Verify log group exists: `/ecs/foodontracks-api`
2. Check ECS task role has CloudWatch Logs permissions
3. Verify environment variables are set correctly
4. Check application is running in production mode

### Alarms Not Triggering

1. Verify metric filters are created correctly
2. Check SNS topic is configured and subscribed
3. Verify alarm state in CloudWatch console
4. Test with intentional errors to validate pipeline

### High CloudWatch Costs

1. Check log retention settings (recommend 14-30 days)
2. Reduce log verbosity in production
3. Use metric filters instead of Log Insights for frequent queries
4. Archive old logs to S3

## Deployment Checklist

- [ ] Environment variables configured (.env.production)
- [ ] CloudWatch/Azure Monitor enabled in production
- [ ] Logger integrated in API handlers
- [ ] Logging middleware applied to routes
- [ ] Dashboard created and tested
- [ ] Alarms configured with SNS/email notifications
- [ ] Log retention policies set
- [ ] Cost estimates reviewed
- [ ] Team notified of alert recipients
- [ ] Dashboards bookmarked for monitoring

## Next Steps

1. Deploy application with monitoring enabled
2. Generate test traffic to populate logs and metrics
3. Review dashboards for baseline performance
4. Adjust alarm thresholds based on observed metrics
5. Train team on interpreting logs and dashboards
6. Establish incident response procedures for alarms

