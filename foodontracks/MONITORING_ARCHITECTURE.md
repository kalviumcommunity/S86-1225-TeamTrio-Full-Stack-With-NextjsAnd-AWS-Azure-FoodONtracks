# Cloud Monitoring & Logging Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER APPLICATIONS                                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                     HTTP/HTTPS Requests (port 3000/443)
                                       │
┌─────────────────────────────────────┴──────────────────────────────────────┐
│                      NEXT.JS APPLICATION                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  src/app/api/**                                                     │  │
│  │  POST /api/orders                                                   │  │
│  │  GET /api/users                                                     │  │
│  │  PUT /api/profile                                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            Application Code     Logging Middleware    Error Handling
                    │                   │                   │
         ┌──────────▼──────────┐  ┌─────▼──────┐  ┌─────────▼────────┐
         │  logger.info()      │  │  Auto Log  │  │  logger.error()  │
         │  logger.error()     │  │  Request   │  │  try/catch       │
         │  logger.warn()      │  │  Response  │  │  Stack Traces    │
         │  logger.debug()     │  │  Timing    │  │  Context Data    │
         └──────────┬──────────┘  └─────┬──────┘  └─────────┬────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │  STRUCTURED JSON      │
                            │  LOG ENTRY            │
                            │  (See Log Structure)  │
                            └───────────┬───────────┘
                                        │
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
    Development Mode              Production Mode                       │
    (Pretty Print)                (JSON Output)                         │
        │                               │                               │
        └───────────────────┬───────────┴───────────────────┬───────────┘
                            │                               │
                    ┌───────▼────────┐          ┌──────────▼─────────┐
                    │  Docker stdout │          │  Docker Container  │
                    │  Console logs  │          │  Logs (stdout)     │
                    └───────┬────────┘          └──────────┬─────────┘
                            │                               │
                            │        ┌──────────────────────┘
                            │        │
                    ┌───────▼────────▼──────────┐
                    │  ECS CloudWatch Logs      │
                    │  OR                       │
                    │  Azure App Service Logs   │
                    └───────┬────────┬──────────┘
                            │        │
        ┌───────────────────┤        ├───────────────────┐
        │                   │        │                   │
┌───────▼──────┐  ┌────────▼───┐  ┌─▼────────┐  ┌──────▼───────┐
│ CloudWatch   │  │  Metric    │  │ Log      │  │  Azure Log   │
│ Logs Group   │  │  Filters   │  │ Analytics│  │  Analytics   │
│              │  │  (Errors,  │  │          │  │  Workspace   │
│  Log Stream  │  │   Slow     │  │ Kusto    │  │  (KQL)       │
│              │  │   Requests)│  │ Queries  │  │              │
└───────┬──────┘  └────────┬───┘  └──────────┘  └──────┬───────┘
        │                  │                            │
        └──────────────┬───┴────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  DASHBOARDS & METRICS       │
        │  (CloudWatch/Azure Monitor) │
        │                             │
        │  8 Dashboard Widgets:       │
        │  1. Log Ingestion Rate      │
        │  2. Error Count Timeline    │
        │  3. Response Time Stats     │
        │  4. Status Code Distribution│
        │  5. Top Endpoints           │
        │  6. User Error Tracking     │
        │  7. Resource Utilization    │
        │  8. Log Level Distribution  │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  ALARMS & NOTIFICATIONS     │
        │  (CloudWatch/Azure Alerts)  │
        │                             │
        │  5 Alarms:                  │
        │  1. HighErrorRate (10+/5m)  │
        │  2. SlowRequests (5+/5m)    │
        │  3. HighErrorRate-Severe    │
        │  4. LowSuccessRate (<5/5m)  │
        │  5. ApplicationHealth       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  NOTIFICATIONS             │
        │  SNS Topic / Email / Slack  │
        │  (Team Alerted)             │
        └─────────────────────────────┘
```

---

## Data Flow - Single Request

```
User Request to POST /api/orders
        │
        ▼
┌───────────────────────────────┐
│ Next.js API Handler           │
│ export const POST = ...       │
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ Logging Middleware                │
│ - Generate requestId              │
│ - Record start time               │
│ - Set x-request-id header         │
└───────────┬───────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│ Handler Code                       │
│ - Process request                  │
│ - Call database                    │
│ - Perform business logic           │
│ - May call logger.info/error()     │
└────────────┬──────────────────────┘
             │
             ▼
┌───────────────────────────────────┐
│ Middleware Finalization           │
│ - Calculate duration              │
│ - Get response status              │
│ - Capture any errors              │
└───────────┬───────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ Automatic Request Logging         │
│ logger.logRequest(                │
│   requestId,                      │
│   method,                         │
│   endpoint,                       │
│   statusCode,                     │
│   duration,                       │
│   userId                          │
│ )                                 │
└───────────┬───────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│ Format Log Entry (JSON)            │
│ {                                  │
│   level: "info",                   │
│   message: "POST /api/orders 201", │
│   timestamp: "2024-01-15...",      │
│   requestId: "req-123",            │
│   userId: "user-456",              │
│   endpoint: "/api/orders",         │
│   method: "POST",                  │
│   statusCode: 201,                 │
│   duration: 145                    │
│ }                                  │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Console Output                     │
│ (Development): Pretty print        │
│ (Production): JSON                 │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Docker Container Logs              │
│ (stdout/stderr)                    │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ CloudWatch Logs / Azure Monitor    │
│ Ingestion                          │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Metric Filters / KQL Processing    │
│ - Error Detection                  │
│ - Slow Request Detection           │
│ - Rate Calculations                │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Metrics Available in Dashboard     │
│ Query Results in Log Analytics     │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ Alarms Evaluate Metrics            │
│ - Error rate > 10/5min?            │
│ - Response time > 1s?              │
│ - Success rate < 5/5min?           │
└────────────┬─────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│ If Alarm Triggered:                │
│ - SNS Notification                 │
│ - Email Sent                       │
│ - Dashboard Alert                  │
└────────────────────────────────────┘
```

---

## CloudWatch vs Azure Monitor

```
┌─────────────────────────────────────────────────────────────────────┐
│ FEATURE                    AWS CloudWatch        Azure Monitor       │
├─────────────────────────────────────────────────────────────────────┤
│ Log Ingestion              $0.50/GB              $0.30/GB            │
│ Storage                    $0.03/GB/month        $0.10-0.25/GB/mo    │
│ Metric Filters             $0.30/filter/month    N/A                 │
│ Query Language             CloudWatch Insights   Kusto (KQL)         │
│ Dashboard                  Native                Application Insights │
│ Alarms                     SNS + Email           Alert Rules + Teams │
│ Retention Default          30 days               30 days             │
│ Batch Size                 10-100 events         10-100 events       │
│ Real-time Dashboard        5 min refresh         1-5 min             │
│ Auto-scaling Integration   Yes (EC2, ECS, RDS)  Yes (App Service)   │
│ Log Correlation            Request IDs           Request IDs         │
│ Distributed Tracing        X-Ray integration     App Insights        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuration Flow

```
Application Start
        │
        ▼
┌──────────────────────────────────────┐
│ Load Environment Variables           │
│ - NODE_ENV                           │
│ - CLOUDWATCH_ENABLED / AZURE...      │
│ - AWS_REGION / AZURE_KEY / etc.      │
└──────────────┬───────────────────────┘
               │
        ┌──────▼──────┐
        │ AWS or      │
        │ Azure?      │
        └──┬───────┬──┘
           │       │
        AWS│       │Azure
           │       │
    ┌──────▼──┐  ┌─▼───────────┐
    │CloudWatch│  │Azure Monitor│
    │Logger    │  │Logger       │
    │Instance  │  │Instance     │
    └──────┬───┘  └─┬───────────┘
           │        │
    ┌──────▼────────▼──┐
    │Initialize Log    │
    │Buffers & Timers  │
    └──────┬───────────┘
           │
    ┌──────▼───────────────────┐
    │Logger Ready for Use       │
    │- Log methods available    │
    │- Buffering enabled        │
    │- Auto-flush on interval   │
    └──────┬───────────────────┘
           │
    ┌──────▼───────────────────┐
    │Middleware Ready           │
    │- RequestId generation     │
    │- Auto-logging enabled     │
    │- Timer recording started  │
    └───────────────────────────┘
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOODONTRACKS APPLICATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  API Routes                                            │   │
│  │  - User authentication                                 │   │
│  │  - Order management                                    │   │
│  │  - Payment processing                                  │   │
│  │  - Inventory tracking                                  │   │
│  │                                                        │   │
│  │  ├─ Logging Middleware (Auto Request Logging) ────┐   │   │
│  │  ├─ logger.info() / logger.error() calls          │   │   │
│  │  ├─ Request context with correlation IDs          │   │   │
│  │  └─ Error handling with detailed context           │   │   │
│  └────────────┬──────────────────────────────────────┘   │   │
│               │                                          │   │
│  ┌────────────▼────────────────────────────────────────┐   │   │
│  │  Database Layer                                    │   │   │
│  │  - Prisma ORM queries                              │   │   │
│  │  - Transaction logging                             │   │   │
│  │  - Error logging on query failure                  │   │   │
│  │                                                    │   │   │
│  │  logger.logRequest(...) for each DB operation     │   │   │
│  └────────────┬──────────────────────────────────────┘   │   │
│               │                                          │   │
│  ┌────────────▼────────────────────────────────────────┐   │   │
│  │  Authentication/RBAC                               │   │   │
│  │  - JWT validation                                   │   │   │
│  │  - Permission checks                               │   │   │
│  │  - User ID tracking in logs                         │   │   │
│  │  - Access denied logging                            │   │   │
│  └────────────┬──────────────────────────────────────┘   │   │
│               │                                          │   │
│  ┌────────────▼────────────────────────────────────────┐   │   │
│  │  External Services                                 │   │   │
│  │  - Email service                                    │   │   │
│  │  - Payment gateway                                  │   │   │
│  │  - Inventory system                                 │   │   │
│  │  - Notification service                             │   │   │
│  │                                                    │   │   │
│  │  logger.info() on service calls                    │   │   │
│  │  logger.error() on failures                        │   │   │
│  └────────────┬──────────────────────────────────────┘   │   │
│               │                                          │   │
│  ┌────────────▼────────────────────────────────────────┐   │   │
│  │  Cache Layer (Redis)                               │   │   │
│  │  - Cache hits/misses                                │   │   │
│  │  - Performance metrics                              │   │   │
│  │  - Invalidation logging                             │   │   │
│  └────────────┬──────────────────────────────────────┘   │   │
│               │                                          │   │
│  ┌────────────▼────────────────────────────────────────┐   │   │
│  │  All logs aggregated by Logger                      │   │   │
│  │  ✓ Correlation IDs propagated                       │   │   │
│  │  ✓ Request context available                        │   │   │
│  │  ✓ Errors tracked with full detail                  │   │   │
│  │  ✓ Performance metrics recorded                     │   │   │
│  └────────────┬──────────────────────────────────────┘   │   │
│               │                                          │   │
│               └──────────────────────────────────────────┼───┤
│                                                          │   │
│  ┌─────────────────────────────────────────────────────┼─┐ │
│  │ Monitoring & Logging System (This Implementation)  │ │ │
│  │                                                     │ │ │
│  │ ✓ Structured JSON Logging                         │ │ │
│  │ ✓ CloudWatch / Azure Monitor Integration         │ │ │
│  │ ✓ Automatic Dashboards                           │ │ │
│  │ ✓ Smart Alarms                                   │ │ │
│  │ ✓ Correlation ID Tracking                        │ │ │
│  │ ✓ User Activity Audit Trail                      │ │ │
│  │ ✓ Performance Insights                           │ │ │
│  │ ✓ Error Analysis                                 │ │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

**This architecture provides complete visibility into your application's behavior, performance, and health in production.**
