# Cloud Monitoring & Logging - Quick Reference Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Enable Logging (Already Done ✅)
- Logger enhanced: `src/lib/logger.ts`
- Middleware ready: `src/lib/logging-middleware.ts`
- CloudWatch integration: `src/lib/cloudwatch-logger.ts`
- Azure integration: `src/lib/azure-monitor-logger.ts`

### Step 2: Configure Environment
```env
# For AWS CloudWatch
CLOUDWATCH_ENABLED=true
CLOUDWATCH_LOG_GROUP=/ecs/foodontracks-api
AWS_REGION=us-east-1

# OR For Azure Monitor
AZURE_MONITOR_ENABLED=true
AZURE_INSTRUMENTATION_KEY=<your-key>
AZURE_LOG_ANALYTICS_WORKSPACE_ID=<your-id>
```

### Step 3: Run Setup Script (Choose One)
```powershell
# AWS
.\setup-cloudwatch-dashboard.ps1 -Region us-east-1
.\setup-cloudwatch-alarms.ps1 -Region us-east-1

# Azure
.\setup-azure-monitor.ps1 -ResourceGroup "foodontracks-rg"
```

### Step 4: Use in Your Code
```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('Order created');

// With context
logger.info('User signed up', {
  requestId: 'req-123',
  userId: 'user-456',
  endpoint: '/api/signup',
  method: 'POST',
  statusCode: 201,
  duration: 145
});

// In API routes
export const POST = loggingMiddleware(async (req) => {
  // Automatically logged!
  return NextResponse.json({ success: true });
});
```

### Step 5: Check Dashboard
- **AWS**: https://console.aws.amazon.com/cloudwatch/home#dashboards:
- **Azure**: https://portal.azure.com/#view/Microsoft_Azure_Monitoring

---

## 📊 Common Queries

### AWS CloudWatch Logs Insights

**Find All Errors**
```
fields @timestamp, message, context.errorDetail
| filter level = 'error'
```

**Response Time by Endpoint**
```
fields @timestamp, endpoint, duration
| stats avg(duration) as AvgTime, max(duration) as MaxTime by endpoint
```

**Errors for Specific User**
```
fields @timestamp, message, endpoint
| filter userId = 'user-123' and level = 'error'
```

**Slow Requests (>1s)**
```
fields @timestamp, endpoint, method, duration
| filter duration > 1000
```

### Azure Monitor KQL

**Error Count Timeline**
```kusto
traces
| where severityLevel >= 2
| summarize count() by bin(timestamp, 5m)
| render timechart
```

**Requests by Status Code**
```kusto
customEvents
| where name == "RequestLogged"
| summarize count() by tostring(customDimensions.statusCode)
```

---

## 🔔 Alerts Explained

### CloudWatch Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| HighErrorRate | 10+ errors / 5 min | Email notification |
| SlowRequests | 5+ requests >1s / 5 min | Email notification |
| HighErrorRate-Severe | 50+ errors / 1 min | Immediate escalation |
| LowSuccessRate | <5 successful / 5 min | Check availability |
| ApplicationHealth | Any alarm triggered | Central dashboard |

### Azure Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | Error rate > 5% | Medium |
| HighResponseTime | P95 > 2 seconds | Medium |
| LowAvailability | Uptime < 99% | High |

---

## 💡 Usage Examples

### Example 1: Log User Actions
```typescript
import { logger } from '@/lib/logger';

async function handleLogin(email: string, password: string) {
  const requestId = logger.generateRequestId();
  
  try {
    const user = await authenticate(email, password);
    
    logger.info('User logged in', {
      requestId,
      userId: user.id,
      endpoint: '/api/auth/login',
      method: 'POST',
      statusCode: 200,
      duration: 145
    });
    
    return { success: true, user };
  } catch (error) {
    logger.error('Login failed', error, {
      requestId,
      context: { email }
    });
    throw error;
  }
}
```

### Example 2: Log Database Operations
```typescript
const startTime = Date.now();

const orders = await db.orders.findMany();

logger.info('Orders fetched', {
  requestId: 'req-123',
  endpoint: '/api/orders',
  method: 'GET',
  statusCode: 200,
  duration: Date.now() - startTime,
  context: { orderCount: orders.length }
});
```

### Example 3: Automatic API Logging
```typescript
import { loggingMiddleware } from '@/lib/logging-middleware';

// All requests automatically logged!
export const GET = loggingMiddleware(async (req) => {
  const orders = await db.orders.findMany();
  
  return NextResponse.json(orders);
  // Logs: GET /api/orders 200 145ms
});
```

---

## 🔍 Troubleshooting Quick Tips

### "Logs not showing up"
- [ ] Check environment variables set correctly
- [ ] Verify app running in production mode
- [ ] Check CloudWatch log group exists
- [ ] Wait 2-3 minutes for logs to appear

### "Alarms not triggering"
- [ ] Verify metric filters created
- [ ] Check SNS topic subscribed
- [ ] Test with intentional errors
- [ ] Check alarm thresholds match metrics

### "Dashboard empty"
- [ ] Send test traffic to app
- [ ] Wait 5 minutes for aggregation
- [ ] Check log ingestion in CloudWatch
- [ ] Verify metric filters are active

### "High costs"
- [ ] Reduce log retention (14-30 days)
- [ ] Lower log verbosity
- [ ] Use metric filters instead of queries
- [ ] Archive old logs to S3

---

## 📚 Full Documentation

- **README.md** - Complete setup and deployment guide
- **MONITORING_IMPLEMENTATION.md** - Detailed architecture and configuration
- **MONITORING_DELIVERABLES.md** - What was implemented

---

## 🎯 Key Metrics to Monitor

### Application Health
- **Error Rate**: Target < 1% (1 error per 100 requests)
- **Response Time (P95)**: Target < 2 seconds
- **Availability**: Target > 99.9%
- **Request Volume**: Baseline for comparison

### Resource Usage
- **CPU**: Alert if > 80%
- **Memory**: Alert if > 85%
- **Disk Space**: Alert if > 90%
- **Network**: Monitor for anomalies

### User Experience
- **Page Load Time**: Monitor distribution
- **Time to First Byte**: Track improvements
- **User Errors**: Investigate patterns
- **Error Rate by Endpoint**: Identify problem areas

---

## 🔐 Log Security Notes

✅ **Good Practices:**
- Logs contain request IDs for tracing
- Logs include user IDs for audit trails
- Logs capture error details for debugging
- Logs track response times for performance

⚠️ **Don't Log:**
- Passwords or API keys
- Personal data (SSN, credit cards)
- Private health information
- Sensitive business data

✅ **Set Log Retention:**
- Development: 3-7 days
- Staging: 14 days
- Production: 30 days (minimum compliance)

---

## 📋 Deployment Checklist

```
Pre-Deployment
- [ ] Read README.md and MONITORING_IMPLEMENTATION.md
- [ ] Test logging locally
- [ ] Configure environment variables
- [ ] Review cost estimates

Deployment
- [ ] Deploy with logging enabled
- [ ] Run setup scripts (CloudWatch/Azure)
- [ ] Configure notifications (email/Slack)
- [ ] Subscribe to alarms

Post-Deployment
- [ ] Verify dashboard receives logs
- [ ] Test alarms with sample errors
- [ ] Train team on dashboards
- [ ] Document baseline metrics
- [ ] Set up on-call procedures

Ongoing
- [ ] Monitor dashboard daily
- [ ] Review alerts for false positives
- [ ] Adjust thresholds based on baseline
- [ ] Archive old logs monthly
- [ ] Review costs quarterly
```

---

## 🔗 Quick Links

**AWS Console:**
- CloudWatch Dashboards: https://console.aws.amazon.com/cloudwatch/home#dashboards:
- CloudWatch Logs: https://console.aws.amazon.com/logs/
- CloudWatch Alarms: https://console.aws.amazon.com/cloudwatch/home#alarmsV2:

**Azure Portal:**
- Application Insights: https://portal.azure.com/#view/Microsoft_Azure_Monitoring
- Log Analytics: https://portal.azure.com/#view/Microsoft_OperationalInsights_Workspace
- Alerts: https://portal.azure.com/#view/Microsoft_Azure_Monitoring/Alerts

**Files in This Project:**
- `src/lib/logger.ts` - Main logging class
- `src/lib/logging-middleware.ts` - Request/response logging
- `src/lib/cloudwatch-logger.ts` - AWS integration
- `src/lib/azure-monitor-logger.ts` - Azure integration
- `setup-cloudwatch-*.ps1` - AWS automation scripts
- `setup-azure-monitor.ps1` - Azure automation script

---

## ❓ FAQ

**Q: Will logging impact performance?**
A: Minimal. Logging is async and buffered (batched every 5 seconds or 10 messages).

**Q: Can I use both CloudWatch and Azure?**
A: Yes, but set appropriate environment variables. Recommend one per environment.

**Q: How much data will be logged?**
A: ~500 bytes per request. 1000 req/day = ~500 KB/day = ~15 MB/month.

**Q: What if I have sensitive data in logs?**
A: Don't log passwords/keys. Use context filtering. Consider encryption.

**Q: How do I correlate logs across services?**
A: Use correlation IDs (requestId). Pass through all service calls.

**Q: Can I customize alerts?**
A: Yes! AWS/Azure have flexible alert rules. Adjust thresholds in setup scripts.

---

**Last Updated:** January 2024 | **Status:** ✅ Production Ready | **Version:** 1.0.0
