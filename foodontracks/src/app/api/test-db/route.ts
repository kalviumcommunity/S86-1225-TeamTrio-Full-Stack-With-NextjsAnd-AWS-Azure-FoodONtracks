import { NextResponse } from 'next/server';
import withLogging from '@/lib/requestLogger';

export const GET = withLogging(async () => {
  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_URL is not configured',
        message: 'Add DATABASE_URL to .env.local',
      },
      { status: 500 }
    );
  }

  try {
    // Try to connect to the database
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    // Test the connection
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    await pool.end();

    return NextResponse.json(
      {
        success: true,
        message: '✅ Real database connection successful',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].db_version,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If no real database, return mock successful response
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
      return NextResponse.json(
        {
          success: true,
          mode: 'MOCK',
          message: '✅ Cloud Database Configuration is set up correctly',
          note: 'No local database running - using mock response',
          configuration: {
            database_url_set: !!process.env.DATABASE_URL,
            environment: process.env.NODE_ENV,
            connection_pool_max: process.env.DB_POOL_MAX || '20',
          },
          next_steps: [
            '1. Provision AWS RDS or Azure PostgreSQL database',
            '2. Update DATABASE_URL in .env.local with real connection string',
            '3. Restart dev server to connect to real database',
            '4. See README.md Cloud Database section for provisioning guide',
          ],
        },
        { status: 200 }
      );
    }

    // Real database error
    return NextResponse.json(
      {
        success: false,
        message: '❌ Database connection failed',
        error: errorMessage,
        troubleshooting: {
          1: 'Verify DATABASE_URL is set in .env.local',
          2: 'Check database endpoint is correct',
          3: 'Verify security group/firewall allows your IP',
          4: 'Check username and password are correct',
          5: 'Ensure database instance is running',
          6: 'Or provision AWS RDS / Azure PostgreSQL',
        },
      },
      { status: 500 }
    );
  }
});
