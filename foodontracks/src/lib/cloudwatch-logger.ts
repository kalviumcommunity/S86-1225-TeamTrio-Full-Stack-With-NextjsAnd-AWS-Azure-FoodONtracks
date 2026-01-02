/**
 * AWS CloudWatch Logs integration for Next.js application
 * 
 * Configuration:
 * - AWS_REGION: AWS region (default: us-east-1)
 * - CLOUDWATCH_LOG_GROUP: Log group name (default: /ecs/foodontracks-api)
 * - CLOUDWATCH_LOG_STREAM: Log stream name (default: api-events)
 * - CLOUDWATCH_ENABLED: Enable CloudWatch integration (default: false in development)
 */

interface CloudWatchConfig {
  logGroup: string;
  logStream: string;
  region: string;
  enabled: boolean;
}

export class CloudWatchLogger {
  private config: CloudWatchConfig;
  private logBuffer: Array<{ timestamp: number; message: string }> = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private flushIntervalMs = 5000; // 5 seconds

  constructor() {
    this.config = {
      logGroup: process.env.CLOUDWATCH_LOG_GROUP || '/ecs/foodontracks-api',
      logStream: process.env.CLOUDWATCH_LOG_STREAM || 'api-events',
      region: process.env.AWS_REGION || 'us-east-1',
      enabled:
        process.env.CLOUDWATCH_ENABLED === 'true' &&
        process.env.NODE_ENV === 'production',
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Log message to CloudWatch
   */
  log(message: string): void {
    if (!this.config.enabled) {
      return;
    }

    this.logBuffer.push({
      timestamp: Date.now(),
      message,
    });

    // Flush if buffer is full
    if (this.logBuffer.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);

    // Ensure timer doesn't prevent process from exiting
    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }

  /**
   * Flush buffered logs to CloudWatch (async, doesn't wait)
   */
  private flush(): void {
    if (this.logBuffer.length === 0) {
      return;
    }

    const batch = this.logBuffer.splice(0, this.batchSize);

    // Send to CloudWatch asynchronously (fire and forget)
    // In production, AWS SDK would handle the actual sending
    this.sendBatch(batch).catch((error) => {
      console.error('Failed to send logs to CloudWatch:', error);
    });
  }

  /**
   * Send batch to CloudWatch
   * In production, this would use AWS SDK
   */
  private async sendBatch(
    batch: Array<{ timestamp: number; message: string }>
  ): Promise<void> {
    // This is a placeholder for AWS SDK integration
    // In production deployment, implement actual CloudWatch client:
    /*
    const cloudwatch = new CloudWatchLogsClient({ region: this.config.region });
    const logEvents = batch.map((log) => ({
      timestamp: log.timestamp,
      message: log.message,
    }));

    try {
      await cloudwatch.send(
        new PutLogEventsCommand({
          logGroupName: this.config.logGroup,
          logStreamName: this.config.logStream,
          logEvents,
        })
      );
    } catch (error) {
      // Log errors locally
      console.error('CloudWatch PutLogEvents failed:', error);
    }
    */
  }

  /**
   * Create metric filter for error tracking
   * Run this once during deployment to set up metric filters
   */
  static async setupMetricFilters(): Promise<void> {
    // CloudFormation or Terraform should manage this
    // Here's the metric filter configuration as documentation:
    /*
    {
      "logGroupName": "/ecs/foodontracks-api",
      "filterName": "ErrorCount",
      "filterPattern": "[time, request_id, level = \"error\", ...]",
      "metricTransformations": [
        {
          "metricName": "ApplicationErrors",
          "metricNamespace": "FoodONtracks",
          "metricValue": "1",
          "defaultValue": 0
        }
      ]
    }

    {
      "logGroupName": "/ecs/foodontracks-api",
      "filterName": "SlowRequests",
      "filterPattern": "[time, request_id, level, message, duration >= 1000, ...]",
      "metricTransformations": [
        {
          "metricName": "SlowRequestCount",
          "metricNamespace": "FoodONtracks",
          "metricValue": "1",
          "defaultValue": 0
        }
      ]
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

    // Final flush of remaining logs
    if (this.logBuffer.length > 0) {
      await this.flush();
    }
  }
}

// Export singleton instance
export const cloudWatchLogger = new CloudWatchLogger();
