/**
 * Azure Monitor / Application Insights integration for Next.js application
 * 
 * Configuration:
 * - AZURE_INSTRUMENTATION_KEY: Application Insights instrumentation key
 * - AZURE_LOG_ANALYTICS_WORKSPACE_ID: Log Analytics Workspace ID
 * - AZURE_MONITOR_ENABLED: Enable Azure Monitor integration (default: false in development)
 * 
 * Kusto Query Language (KQL) examples:
 * - Request volume: customMetrics | where name == "RequestCount" | summarize count() by bin(timestamp, 5m)
 * - Error rate: traces | where severityLevel >= 2 | summarize count() by bin(timestamp, 5m)
 * - Response time: customMetrics | where name == "ResponseTime" | summarize avg(value) by bin(timestamp, 1m)
 */

interface AzureMonitorConfig {
  instrumentationKey: string;
  workspaceId: string;
  enabled: boolean;
}

export class AzureMonitorLogger {
  private config: AzureMonitorConfig;
  private eventBuffer: Array<{
    timestamp: number;
    severity: number;
    message: string;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
  }> = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private flushIntervalMs = 5000; // 5 seconds

  constructor() {
    this.config = {
      instrumentationKey:
        process.env.AZURE_INSTRUMENTATION_KEY || '',
      workspaceId:
        process.env.AZURE_LOG_ANALYTICS_WORKSPACE_ID || '',
      enabled:
        process.env.AZURE_MONITOR_ENABLED === 'true' &&
        process.env.NODE_ENV === 'production' &&
        !!process.env.AZURE_INSTRUMENTATION_KEY,
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Log trace event to Application Insights
   */
  logTrace(
    message: string,
    severity: number = 1, // 0=Verbose, 1=Information, 2=Warning, 3=Error, 4=Critical
    properties?: Record<string, string>,
    measurements?: Record<string, number>
  ): void {
    if (!this.config.enabled) {
      return;
    }

    this.eventBuffer.push({
      timestamp: Date.now(),
      severity,
      message,
      properties,
      measurements,
    });

    if (this.eventBuffer.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Log metric to Application Insights
   */
  logMetric(
    name: string,
    value: number,
    properties?: Record<string, string>
  ): void {
    if (!this.config.enabled) {
      return;
    }

    this.eventBuffer.push({
      timestamp: Date.now(),
      severity: 1,
      message: `Metric: ${name}`,
      properties: {
        metricName: name,
        ...properties,
      },
      measurements: {
        value,
      },
    });
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);

    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }

  /**
   * Flush buffered events to Application Insights
   */
  private flush(): void {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const batch = this.eventBuffer.splice(0, this.batchSize);
    this.sendBatch(batch).catch((error) => {
      console.error('Failed to send events to Azure Monitor:', error);
    });
  }

  /**
   * Send batch to Application Insights
   */
  private async sendBatch(
    batch: Array<{
      timestamp: number;
      severity: number;
      message: string;
      properties?: Record<string, string>;
      measurements?: Record<string, number>;
    }>
  ): Promise<void> {
    // This is a placeholder for Azure SDK integration
    // In production deployment, implement actual Azure Monitor client:
    /*
    const appInsights = new TelemetryClient(this.config.instrumentationKey);
    
    batch.forEach((event) => {
      appInsights.trackTrace({
        message: event.message,
        severity: event.severity,
        properties: event.properties,
      });

      if (event.measurements) {
        for (const [name, value] of Object.entries(event.measurements)) {
          appInsights.trackEvent({
            name: `metric_${name}`,
            properties: event.properties,
            measurements: { value },
          });
        }
      }
    });

    appInsights.flush();
    */
  }

  /**
   * Kusto Query Examples for Log Analytics Workspace
   * 
   * 1. Request Volume over time:
   * customEvents
   * | where name == "RequestLogged"
   * | summarize RequestCount = count() by bin(timestamp, 5m)
   * | render timechart
   * 
   * 2. Error Rate:
   * traces
   * | where severityLevel >= 2
   * | summarize ErrorCount = count() by bin(timestamp, 5m)
   * | render timechart
   * 
   * 3. Average Response Time:
   * customMetrics
   * | where name == "ResponseTime"
   * | summarize AvgResponseTime = avg(value) by bin(timestamp, 1m)
   * | render timechart
   * 
   * 4. Request distribution by endpoint:
   * customEvents
   * | where name == "RequestLogged"
   * | summarize RequestCount = count() by tostring(customDimensions.endpoint)
   * | render barchart
   * 
   * 5. Errors by user:
   * traces
   * | where severityLevel >= 2
   * | summarize ErrorCount = count() by tostring(customDimensions.userId)
   * | render barchart
   */

  /**
   * Setup Application Insights alerts
   * Run this once during deployment
   */
  static async setupAlerts(): Promise<void> {
    // ARM template should define these alerts:
    /*
    {
      "type": "Microsoft.Insights/metricAlerts",
      "name": "HighErrorRate",
      "properties": {
        "description": "Alert when error rate exceeds 5%",
        "severity": 2,
        "enabled": true,
        "scopes": ["<appInsights resource id>"],
        "evaluationFrequency": "PT5M",
        "windowSize": "PT15M",
        "criteria": {
          "odata.type": "Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria",
          "allOf": [
            {
              "name": "ErrorRate",
              "metricName": "failed requests percentage",
              "operator": "GreaterThan",
              "threshold": 5,
              "timeAggregation": "Average"
            }
          ]
        },
        "actions": [
          {
            "actionGroupId": "<actionGroup resource id>"
          }
        ]
      }
    }
    */
  }

  /**
   * Cleanup on application shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    if (this.eventBuffer.length > 0) {
      await this.flush();
    }
  }
}

// Export singleton instance
export const azureMonitorLogger = new AzureMonitorLogger();
