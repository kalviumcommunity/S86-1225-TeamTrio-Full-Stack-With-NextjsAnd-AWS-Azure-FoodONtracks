/**
 * Database Connection Pool
 * Manages PostgreSQL connections with pooling and error handling
 */

import { Pool, PoolClient } from 'pg';
import { logger } from '@/lib/logger';

interface PoolConfig {
  connectionString: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean;
}

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export function initializePool(config?: PoolConfig): Pool {
  if (pool) {
    return pool;
  }

  const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    ...config,
  };

  if (!poolConfig.connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  pool = new Pool(poolConfig);

  // Error handler
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', { error: String(err) });
  });

  return pool;
}

/**
 * Get current pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Execute query with automatic retry
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[],
  retries: number = 3
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await pool.query(query, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw new Error(
    `Query failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Get single row
 */
export async function getRow<T = any>(
  query: string,
  params?: any[]
): Promise<T | null> {
  const result = await executeQuery<T>(query, params);
  return result.rows[0] || null;
}

/**
 * Get all rows
 */
export async function getRows<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const result = await executeQuery<T>(query, params);
  return result.rows;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT NOW()');
    logger.info('database_connection_success', { result: result.rows[0] });
    return true;
  } catch (error) {
    logger.error('database_connection_failed', { error: String(error) });
    return false;
  }
}

/**
 * Close connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  const p = getPool();
  return {
    totalCount: p.totalCount,
    idleCount: p.idleCount,
    waitingCount: p.waitingCount,
  };
}

/**
 * Transaction wrapper
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
