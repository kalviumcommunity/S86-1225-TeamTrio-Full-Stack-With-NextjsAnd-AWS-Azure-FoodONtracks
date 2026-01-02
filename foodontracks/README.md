# FoodONtracks Application - Complete Deployment & Monitoring Guide

## 📋 Table of Contents

1. [🌐 Custom Domain & HTTPS Configuration](#custom-domain--https-configuration)
2. [📊 Cloud Monitoring & Logging](#cloud-monitoring--logging)
3. [🔐 RBAC & Security](#rbac--security)
4. [🚀 Deployment](#deployment)
5. [🧪 Testing](#testing)
6. [📝 Environment Configuration](#environment-configuration)

---

## 🌐 Custom Domain & HTTPS Configuration

### Overview

This section documents the complete process to configure a custom domain and secure your FoodONtracks application with HTTPS and SSL/TLS certificates. By the end of this setup, your application will be accessible via `https://yourdomain.com` with a secure padlock icon 🔒 in the browser.

### Architecture

```
User Browser → CloudFront/CDN (optional)
    ↓
Custom Domain (yourdomain.com)
    ↓
DNS Resolution (Route 53 or Azure DNS)
    ↓
AWS Load Balancer / Azure App Service
    ↓
ECS Tasks / App Service Instances
    ↓
Next.js Application (port 443 HTTPS)
    ↓
Database (PostgreSQL)
```

### Prerequisites

**AWS Setup:**
- AWS Account with appropriate IAM permissions
- Domain registered (via Route 53 or external registrar)
- AWS Certificate Manager access

**Azure Setup:**
- Azure Account with appropriate permissions
- Domain registered (via GoDaddy, Namecheap, etc.)
- App Service Plan (Basic or higher)

### Step 1: Domain Registration & DNS Configuration

#### AWS Route 53 Setup

```powershell
# Register or transfer domain to Route 53
# Or create hosted zone for existing domain

# Create hosted zone
aws route53 create-hosted-zone `
    --name yourdomain.com `
    --caller-reference "$(Get-Date -Format 'yyyyMMddHHmmss')"

# List hosted zones to get ID
aws route53 list-hosted-zones
```

#### Azure DNS Setup

```powershell
# Create DNS zone in Azure
az network dns zone create `
    --resource-group foodontracks-rg `
    --name yourdomain.com

# Get nameservers
az network dns zone show `
    --resource-group foodontracks-rg `
    --name yourdomain.com `
    --query nameServers
```

### Step 2: SSL Certificate Setup

#### AWS Certificate Manager (ACM)

**Cost:** FREE for use with AWS services (ALB, CloudFront, ECS, etc.)

```powershell
# Request certificate
aws acm request-certificate `
    --domain-name yourdomain.com `
    --subject-alternative-names "*.yourdomain.com" `
    --validation-method DNS `
    --region us-east-1

# Wait for certificate validation
# ACM will provide DNS validation records to add to your hosted zone
aws route53 change-resource-record-sets `
    --hosted-zone-id Z1234567890ABC `
    --change-batch file://validation-records.json
```

#### Azure App Service Certificates

**Cost:** FREE managed certificates for App Service domains

```powershell
# Create App Service Certificate
az appservice certificate create `
    --resource-group foodontracks-rg `
    --name "foodontracks-cert" `
    --key-vault-name "foodontracks-kv" `
    --domain-name yourdomain.com

# Bind to App Service
az webapp config ssl bind `
    --resource-group foodontracks-rg `
    --name foodontracks-app `
    --certificate-thumbprint <thumbprint>
```

### Step 3: HTTPS Configuration in Next.js

The application is pre-configured with HTTPS enforcement in `next.config.js`:

```javascript
// next.config.js - HTTPS Redirects & Security Headers
export default async function config() {
  return {
    redirects: async () => {
      return [
        {
          source: '/:path*',
          has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
          destination: 'https://:host/:path*',
          permanent: true,
        },
      ];
    },
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
          ],
        },
      ];
    },
  };
}
```

### Step 4: Automated Setup Scripts

Three PowerShell scripts automate the entire process:

#### setup-domain-dns.ps1

Configures Route 53 or Azure DNS with your domain:

```powershell
.\setup-domain-dns.ps1 -Domain yourdomain.com -Provider aws -HostedZoneId Z123456
```

**Features:**
- Domain validation
- Hosted zone creation
- A/CNAME record configuration
- Nameserver retrieval
- Local hosts file update for testing

#### setup-ssl-certificate.ps1

Manages SSL certificate creation and validation:

```powershell
.\setup-ssl-certificate.ps1 -Domain yourdomain.com -Provider aws -Region us-east-1
```

**Features:**
- Certificate request from ACM/Azure
- DNS validation record creation
- Certificate status monitoring
- Self-signed cert generation for testing

#### verify-https-setup.ps1

Comprehensive verification of HTTPS configuration:

```powershell
.\verify-https-setup.ps1 -Domain yourdomain.com -Verbose
```

**Verification Checks:**
- URL format validation
- DNS resolution (should return your server IP)
- HTTPS connectivity (when server is running)
- Security header verification
- HTTP→HTTPS redirect testing

### Step 5: Docker Configuration

The Dockerfile and docker-compose.yml are pre-configured for HTTPS:

```yaml
# docker-compose.yml - Port 443 configuration
services:
  app:
    ports:
      - "3000:3000"  # HTTP development
      - "443:443"    # HTTPS production
    volumes:
      - ./certs:/app/certs:ro  # SSL certificates
    environment:
      - NEXT_PUBLIC_APP_URL=https://yourdomain.com
      - HTTPS_PORT=443
```

### Step 6: Deployment to AWS ECS

```powershell
# Build Docker image
docker build -t foodontracks:latest -f Dockerfile .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag foodontracks:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/foodontracks:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/foodontracks:latest

# Update ECS service
aws ecs update-service `
    --cluster foodontracks-cluster `
    --service foodontracks-service `
    --force-new-deployment
```

### Step 7: Verification in Browser

1. Open `https://yourdomain.com` in your browser
2. Look for the padlock icon 🔒 in the address bar
3. Click the padlock to verify certificate details
4. The certificate should be issued by AWS or Azure
5. Certificate should be valid (not expired)
6. Should match your domain name

### Troubleshooting

**DNS Resolution Issues:**
```powershell
# Test DNS resolution
nslookup yourdomain.com
dig yourdomain.com @<nameserver>

# Wait 24-48 hours for DNS propagation
# Use https://mxtoolbox.com/ to verify globally
```

**Certificate Validation Timeout:**
```powershell
# Verify DNS validation records created in Route 53
aws route53 list-resource-record-sets --hosted-zone-id Z123456

# Certificate may take 15-30 minutes to issue
# Monitor in AWS Certificate Manager console
```

**HTTPS Connection Failed:**
```
# Ensure load balancer/ECS has certificate configured
# Verify security group allows port 443 inbound
# Check application logs for TLS errors
```

**Mixed Content Warnings:**
- All resources (CSS, JS, images) must load via HTTPS
- Update all resource URLs to use `https://`
- Check browser console for mixed content warnings

### Cost Analysis

**SSL/TLS Certificates:**
- AWS ACM: **FREE** (public certificates only)
- Azure Managed: **FREE** (App Service only)
- External providers: $10-100/year

**DNS Services:**
- AWS Route 53: **$0.50/month** per hosted zone + $0.40 per million queries
- Azure DNS: **$0.50/month** per hosted zone

**Total Monthly Cost:** ~$1.00 for Route 53 + minimal query costs

### Security Best Practices

✅ **Always Use HTTPS**
- Encrypts all data in transit
- Prevents man-in-the-middle attacks
- Required for modern web standards

✅ **Enable HSTS (HTTP Strict-Transport-Security)**
- Forces browsers to use HTTPS
- Included in configuration
- max-age=31536000 (1 year)

✅ **Certificate Auto-Renewal**
- AWS ACM: Automatic renewal
- Azure: Managed renewal
- External: 90-day certificates (Let's Encrypt)

✅ **Monitor Certificate Expiration**
```powershell
# List certificates and expiration
aws acm list-certificates --region us-east-1
aws acm describe-certificate --certificate-arn <arn> --region us-east-1
```

### Production Checklist

- [ ] Domain registered and verified
- [ ] Hosted zone created in Route 53/Azure DNS
- [ ] SSL certificate requested and validated
- [ ] DNS records configured
- [ ] HTTPS enforced in next.config.js
- [ ] Docker configured with HTTPS ports
- [ ] Certificate deployed to ECS/App Service
- [ ] HTTPS connectivity verified
- [ ] Security headers confirmed
- [ ] Browser padlock icon visible ✅
- [ ] HTTP→HTTPS redirect working
- [ ] Team notified of new domain URL
- [ ] Update environment variables in deployment
- [ ] Monitor certificate expiration dates
- [ ] Document domain renewal process

---

## 📊 Cloud Monitoring & Logging

### Overview

Comprehensive monitoring and logging infrastructure for tracking application health, performance, and errors. The system provides:

- **Structured JSON logging** with correlation IDs for request tracing
- **Real-time dashboards** for visualizing application metrics
- **Automated alarms** with email/Slack notifications
- **Distributed tracing** across services
- **Error tracking** with context and stack traces
- **Performance insights** with response time percentiles

### Architecture

```
Application Logs
    ↓
Logger (Structured JSON)
    ↓
CloudWatch Logs / Azure Monitor
    ├→ Metric Filters
    ├→ Log Analytics Queries
    └→ Log Storage
        ↓
    Dashboards & Visualizations
        ↓
    Alarms & Notifications
```

### Core Components

#### 1. Logger (`src/lib/logger.ts`)

Provides structured logging with automatic correlation IDs:

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('Server started');

// Request context logging
logger.info('User logged in', {
  requestId: 'req-123',
  userId: 'user-456',
  endpoint: '/api/auth/login',
  method: 'POST',
  statusCode: 200,
  duration: 145
});

// Error logging with context
logger.error('Database connection failed', error, {
  requestId: 'req-123',
  context: { database: 'postgres', host: 'db.example.com' }
});

// API request logging
logger.logRequest(
  'req-123',        // Request ID
  'POST',           // Method
  '/api/orders',    // Endpoint
  201,              // Status Code
  145,              // Duration (ms)
  'user-456'        // User ID
);
```

#### 2. Logging Middleware (`src/lib/logging-middleware.ts`)

Automatically logs all API requests with timing:

```typescript
import { loggingMiddleware } from '@/lib/logging-middleware';

export const POST = loggingMiddleware(async (req) => {
  // Handler code
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 201
  });
});
```

#### 3. CloudWatch Integration (`src/lib/cloudwatch-logger.ts`)

AWS CloudWatch Logs integration with batching and buffering:

```typescript
import { cloudWatchLogger } from '@/lib/cloudwatch-logger';

// Automatic batching (10 messages or 5 seconds)
cloudWatchLogger.log(JSON.stringify(logEntry));
```

#### 4. Azure Monitor Integration (`src/lib/azure-monitor-logger.ts`)

Azure Application Insights integration:

```typescript
import { azureMonitorLogger } from '@/lib/azure-monitor-logger';

// Trace logging
azureMonitorLogger.logTrace('User action', 1, {
  userId: 'user-456',
  action: 'order_created'
});

// Metric logging
azureMonitorLogger.logMetric('order_total', 99.99, {
  currency: 'USD'
});
```

### AWS CloudWatch Setup

#### Configuration

Set environment variables:

```bash
# .env.production
CLOUDWATCH_ENABLED=true
CLOUDWATCH_LOG_GROUP=/ecs/foodontracks-api
CLOUDWATCH_LOG_STREAM=api-events
AWS_REGION=us-east-1
```

#### Create Dashboard

Automated dashboard creation with 8 widgets:

```powershell
.\setup-cloudwatch-dashboard.ps1 `
  -Region us-east-1 `
  -Environment production `
  -DashboardName "FoodONtracks-Health"
```

**Dashboard Widgets:**
1. **Log Ingestion Rate** - Incoming bytes and events
2. **Error Count** - Errors by 5-minute intervals
3. **Response Time Metrics** - Average, max, P95 latency
4. **Status Code Distribution** - Success vs error requests
5. **Top Endpoints** - Most-used endpoints by request count
6. **User Errors** - Errors grouped by user ID
7. **Resource Utilization** - ECS CPU and memory
8. **Log Level Distribution** - Info/warn/error/debug split

#### Create Alarms

Automated alarm setup with SNS notifications:

```powershell
.\setup-cloudwatch-alarms.ps1 `
  -Region us-east-1 `
  -SNSTopicArn "arn:aws:sns:us-east-1:123456789:foodontracks-alarms"
```

**Alarms Created:**
- **HighErrorRate**: 10+ errors in 5 minutes → Severity Normal
- **SlowRequests**: 5+ requests >1000ms → Severity Normal
- **HighErrorRate-Severe**: 50+ errors in 1 minute → Severity Critical
- **LowSuccessRate**: ≤5 successful requests in 5 minutes → Severity Normal
- **ApplicationHealth**: Composite health status → All resources

#### CloudWatch Logs Insights Queries

**Request Volume Over Time**
```
fields @timestamp, @message 
| stats count() as RequestCount by bin(5m)
```

**Error Analysis by Endpoint**
```
fields @timestamp, endpoint, level, message
| filter level = 'error'
| stats count() as ErrorCount, latest(message) as LatestError by endpoint
```

**Response Time Percentiles**
```
fields @timestamp, duration
| filter duration > 0
| stats avg(duration) as AvgTime, max(duration) as MaxTime, pct(duration, 95) as P95 by bin(1m)
```

**Slow Requests**
```
fields @timestamp, endpoint, method, duration
| filter duration > 1000
| stats count() as SlowCount by endpoint, method
| sort SlowCount desc
```

**User Activity**
```
fields @timestamp, userId, statusCode, duration
| stats count() as RequestCount, avg(duration) as AvgDuration by userId
```

### Azure Monitor Setup

#### Configuration

```powershell
.\setup-azure-monitor.ps1 `
  -ResourceGroup "foodontracks-rg" `
  -Location "eastus"
```

Set environment variables:

```bash
# .env.production
AZURE_MONITOR_ENABLED=true
AZURE_INSTRUMENTATION_KEY=<instrumentation-key>
AZURE_LOG_ANALYTICS_WORKSPACE_ID=<workspace-id>
```

**Resources Created:**
- Log Analytics Workspace
- Application Insights instance
- Alert action group
- Metric alerts

#### Kusto Query Language (KQL) Examples

**Request Timeline**
```kusto
customEvents
| where name == "RequestLogged"
| summarize RequestCount = count() by bin(timestamp, 5m)
| render timechart
```

**Error Rate**
```kusto
traces
| where severityLevel >= 2
| summarize ErrorCount = count() by bin(timestamp, 5m)
| render timechart
```

**Endpoint Performance**
```kusto
customEvents
| where name == "RequestLogged"
| summarize 
    Requests = count(),
    AvgDuration = avg(todouble(customDimensions.duration)),
    Errors = sum(if(toint(customDimensions.statusCode) >= 400, 1, 0))
    by tostring(customDimensions.endpoint)
| order by Requests desc
```

### Log Entry Structure

Each log automatically includes:

```json
{
  "level": "info|error|warn|debug",
  "message": "Human-readable message",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "environment": "production",
  "service": "foodontracks-api",
  "version": "1.0.0",
  "requestId": "1705314645123-abc1234",
  "userId": "user-123",
  "endpoint": "/api/orders",
  "method": "POST",
  "statusCode": 201,
  "duration": 145,
  "context": {
    "additionalData": "Optional structured data"
  },
  "meta": {
    "customFields": "Optional metadata"
  }
}
```

### Cost Optimization

**CloudWatch Costs:**
- Logs: $0.50/GB ingested, $0.03/GB/month stored
- Metric Filters: $0.30/filter/month
- Log Insights: $0.0075/GB analyzed

**Recommendations:**
- Set log retention: 14-30 days (avoid long-term storage)
- Use metric filters instead of Log Insights for frequent queries
- Archive old logs to S3 for compliance
- Monitor ingestion rate and adjust log verbosity

**Azure Costs:**
- Log Analytics: $0.30/GB ingested, $0.10-0.25/GB/month
- Application Insights: $0.30/GB ingested
- Alerts: $0.10/rule/month

**Recommendations:**
- Use 30-day retention
- Set appropriate sampling (default 100%)
- Use commitment tiers for predictable costs
- Archive to Azure Blob Storage

### Monitoring Best Practices

✅ **Use Correlation IDs**
```typescript
const requestId = logger.generateRequestId();
logger.info('Processing order', { requestId, ... });
// Pass through all service calls
```

✅ **Log at Appropriate Levels**
- **DEBUG**: Detailed flow (development only)
- **INFO**: Normal operations and important events
- **WARN**: Potential issues (deprecated features)
- **ERROR**: Failures requiring attention

✅ **Include Context**
```typescript
logger.error('Payment failed', error, {
  context: {
    orderId: '789',
    amount: 99.99,
    provider: 'stripe'
  }
});
```

✅ **Monitor Performance**
```typescript
const start = Date.now();
// Operation
logger.info('Batch processed', {
  duration: Date.now() - start,
  context: { itemCount: 500 }
});
```

✅ **Alert on Anomalies**
- Error rate > 2%
- Response time P95 > 2 seconds
- Availability < 99%
- CPU/Memory > 80%

### Deployment Checklist

- [ ] Environment variables configured
- [ ] CloudWatch/Azure Monitor enabled
- [ ] Logger imported and used in handlers
- [ ] Logging middleware applied
- [ ] Dashboard created and tested
- [ ] Alarms configured with notifications
- [ ] Log retention policies set
- [ ] Cost estimates reviewed
- [ ] Team trained on monitoring
- [ ] Incident response procedures documented
- [ ] Dashboard bookmarked for quick access

### Troubleshooting

**Logs Not Appearing:**
- Verify environment variables are set
- Check application running in production mode
- Verify IAM permissions for CloudWatch/Azure access

**Alarms Not Triggering:**
- Confirm metric filters are created
- Verify SNS subscription is active
- Check alarm thresholds match actual metrics

**High Costs:**
- Reduce log retention (14 days minimum)
- Adjust log verbosity in production
- Use metric filters instead of queries

---

## 🔐 RBAC & Security

Complete role-based access control implementation with fine-grained permissions, security headers, and JWT authentication.

**Key Features:**
- Role definitions (ADMIN, USER, GUEST, MODERATOR)
- Permission-based access control
- Middleware authentication
- Security headers (HSTS, CSP, X-Frame-Options)
- JWT token validation
- Request correlation IDs

See [RBAC_DOCUMENTATION.md](RBAC_DOCUMENTATION.md) for complete details.

---

## 🚀 Deployment

### Local Development

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

### Docker Local

```bash
# Build development image
docker-compose -f docker-compose.yml up -d

# Verify services
docker-compose logs -f app
```

### AWS ECS Deployment

```powershell
# Build and push image
.\docker-build-dev.ps1
.\docker-push-ecr.ps1

# Deploy to ECS
.\deploy-ecs.ps1 -Cluster foodontracks-cluster -Service foodontracks-service

# Verify deployment
aws ecs describe-services --cluster foodontracks-cluster --services foodontracks-service
```

### Azure App Service Deployment

```powershell
# Build Docker image
docker build -t foodontracks:latest .

# Push to Azure Container Registry
az acr build --registry foodontracksacr --image foodontracks:latest .

# Deploy to App Service
az webapp deployment container config --name foodontracks-app --resource-group foodontracks-rg
az webapp config container set --name foodontracks-app --resource-group foodontracks-rg --docker-custom-image-name foodontracksacr.azurecr.io/foodontracks:latest
```

---

## 🧪 Testing

### Database Connection

```powershell
.\test-api.ps1
.\test-db-connection.ps1
```

### Authentication

```powershell
.\test-jwt-auth.ps1
.\test-error-handling.ps1
```

### HTTPS & Security

```powershell
.\verify-https-setup.ps1
.\test-security-headers.ps1
```

---

## 📝 Environment Configuration

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/foodontracks

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=FoodONtracks
NODE_ENV=production

# AWS (CloudWatch)
AWS_REGION=us-east-1
CLOUDWATCH_ENABLED=true
CLOUDWATCH_LOG_GROUP=/ecs/foodontracks-api

# Azure (Monitor)
AZURE_MONITOR_ENABLED=false
AZURE_INSTRUMENTATION_KEY=
AZURE_LOG_ANALYTICS_WORKSPACE_ID=
```

---

## 📞 Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) sections above
2. Review application logs: CloudWatch Logs or Azure Monitor
3. Check dashboards for health status
4. Review documentation files in root directory

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Team:** FoodONtracks Development Team
