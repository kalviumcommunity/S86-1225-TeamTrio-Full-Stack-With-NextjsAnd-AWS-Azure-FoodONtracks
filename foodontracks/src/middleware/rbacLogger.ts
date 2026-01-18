/**
 * RBAC Audit Logger
 *
 * Logs all access control decisions for security auditing and debugging.
 * This helps track who attempted to access what resources and whether
 * they were allowed or denied.
 *
 * In production, these logs should be sent to a centralized logging service
 * like CloudWatch, DataDog, or Splunk.
 */

import { logger } from "@/lib/logger";

export interface RbacLogEntry {
  allowed: boolean;
  userId?: number;
  role: string;
  resource: string;
  permission: string;
  reason: string;
  ip: string;
  path: string;
  timestamp?: Date;
}

/**
 * In-memory log storage (for demonstration)
 * In production, replace with database or external logging service
 */
const rbacLogs: RbacLogEntry[] = [];
const MAX_LOGS = 1000; // Keep last 1000 logs in memory

/**
 * Log an RBAC decision
 *
 * @param entry - The log entry to record
 */
export function logRbacDecision(entry: Omit<RbacLogEntry, "timestamp">): void {
  const logEntry: RbacLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // Add to in-memory storage
  rbacLogs.push(logEntry);

  // Keep only the last MAX_LOGS entries
  if (rbacLogs.length > MAX_LOGS) {
    rbacLogs.shift();
  }

  // Format log message
  const status = logEntry.allowed ? "✅ ALLOWED" : "❌ DENIED";
  const userInfo = logEntry.userId
    ? `User ${logEntry.userId} (${logEntry.role})`
    : `Role: ${logEntry.role}`;

  // Emit structured RBAC log
  if (logEntry.allowed) {
    logger.info("rbac_decision", { context: { ...logEntry, status, userInfo } });
  } else {
    logger.warn("rbac_decision", { context: { ...logEntry, status, userInfo } });
  }

  // In production, also send to external logging service:
  // await sendToCloudWatch(logEntry);
  // await sendToDataDog(logEntry);
}

/**
 * Get all RBAC logs
 *
 * @param filters - Optional filters for logs
 * @returns Array of log entries
 */
export function getRbacLogs(filters?: {
  userId?: number;
  role?: string;
  resource?: string;
  allowed?: boolean;
  limit?: number;
}): RbacLogEntry[] {
  let filtered = [...rbacLogs];

  if (filters) {
    if (filters.userId !== undefined) {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }
    if (filters.role) {
      filtered = filtered.filter((log) => log.role === filters.role);
    }
    if (filters.resource) {
      filtered = filtered.filter((log) => log.resource === filters.resource);
    }
    if (filters.allowed !== undefined) {
      filtered = filtered.filter((log) => log.allowed === filters.allowed);
    }
    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }
  }

  return filtered.reverse(); // Most recent first
}

/**
 * Get RBAC statistics
 *
 * @returns Statistics about RBAC decisions
 */
export function getRbacStats() {
  const total = rbacLogs.length;
  const allowed = rbacLogs.filter((log) => log.allowed).length;
  const denied = rbacLogs.filter((log) => !log.allowed).length;

  const byRole: Record<string, { allowed: number; denied: number }> = {};
  const byResource: Record<string, { allowed: number; denied: number }> = {};

  rbacLogs.forEach((log) => {
    // Count by role
    if (!byRole[log.role]) {
      byRole[log.role] = { allowed: 0, denied: 0 };
    }
    if (log.allowed) {
      byRole[log.role].allowed++;
    } else {
      byRole[log.role].denied++;
    }

    // Count by resource
    if (!byResource[log.resource]) {
      byResource[log.resource] = { allowed: 0, denied: 0 };
    }
    if (log.allowed) {
      byResource[log.resource].allowed++;
    } else {
      byResource[log.resource].denied++;
    }
  });

  return {
    total,
    allowed,
    denied,
    allowedPercentage: total > 0 ? ((allowed / total) * 100).toFixed(2) : "0",
    deniedPercentage: total > 0 ? ((denied / total) * 100).toFixed(2) : "0",
    byRole,
    byResource,
  };
}

/**
 * Clear all logs (for testing purposes)
 */
export function clearRbacLogs(): void {
  rbacLogs.length = 0;
}

/**
 * Export logs to JSON (for analysis or backup)
 *
 * @returns JSON string of all logs
 */
export function exportRbacLogs(): string {
  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalEntries: rbacLogs.length,
      logs: rbacLogs,
      stats: getRbacStats(),
    },
    null,
    2
  );
}

/**
 * Get recent denied access attempts (potential security threats)
 *
 * @param limit - Number of recent denials to return
 * @returns Array of denied log entries
 */
export function getRecentDenials(limit: number = 50): RbacLogEntry[] {
  return rbacLogs
    .filter((log) => !log.allowed)
    .slice(-limit)
    .reverse();
}

/**
 * Get suspicious activity (multiple denials from same user/IP)
 *
 * @param threshold - Number of denials to trigger alert
 * @returns Object mapping userId/IP to denial count
 */
export function getSuspiciousActivity(threshold: number = 5): {
  byUser: Record<number, number>;
  byIp: Record<string, number>;
} {
  const byUser: Record<number, number> = {};
  const byIp: Record<string, number> = {};

  rbacLogs
    .filter((log) => !log.allowed)
    .forEach((log) => {
      if (log.userId) {
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
      }
      byIp[log.ip] = (byIp[log.ip] || 0) + 1;
    });

  // Filter by threshold
  const suspiciousUsers = Object.fromEntries(
    Object.entries(byUser).filter(([, count]) => count >= threshold)
  );
  const suspiciousIps = Object.fromEntries(
    Object.entries(byIp).filter(([, count]) => count >= threshold)
  );

  return {
    byUser: suspiciousUsers,
    byIp: suspiciousIps,
  };
}
