# PostgreSQL + Next.js + Vercel Best Practices

## ✅ Issue Resolution Summary

### Problem
```
Type error: Could not find a declaration file for module 'pg'
```

### Root Cause
TypeScript requires type definitions (`.d.ts` files) during build-time compilation. The `pg` package is written in JavaScript and needs separate type definitions.

### Solution Applied ✅
```json
{
  "dependencies": {
    "pg": "^8.16.3"  // Runtime PostgreSQL driver
  },
  "devDependencies": {
    "@types/pg": "^8.11.0"  // TypeScript definitions
  }
}
```

---

## 🏗️ Architecture Best Practices

### 1. **Connection Pooling (Current Implementation)**

✅ **DO THIS** (Your current approach):
```typescript
// lib/database.ts
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,  // Max 20 connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}
```

❌ **DON'T DO THIS**:
```typescript
// Creating new Pool on every request
export async function GET() {
  const pool = new Pool({ ... }); // ❌ Connection leak!
  const result = await pool.query('SELECT * FROM users');
  return NextResponse.json(result.rows);
}
```

**Why**: Each Pool creates 20 connections. On Vercel, every serverless function invocation could create a new pool, exhausting database connection limits.

---

### 2. **Environment Variables**

✅ **Production Setup**:
```bash
# .env.production
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Vercel Environment Variables
DATABASE_URL = postgresql://...
NODE_ENV = production
```

**Vercel-Specific Tips**:
- Use Vercel Postgres or managed PostgreSQL (Supabase, Neon, Railway)
- Enable connection pooling via services like PgBouncer
- Set `max: 10` for serverless (Vercel limits)

---

### 3. **SSL Configuration**

✅ **Your current approach is correct**:
```typescript
ssl: process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false }  // Most cloud DBs need this
  : false
```

**For stricter security** (if you have CA certificates):
```typescript
ssl: process.env.NODE_ENV === 'production' 
  ? {
      rejectUnauthorized: true,
      ca: fs.readFileSync('/path/to/ca-certificate.crt').toString()
    }
  : false
```

---

### 4. **API Route Patterns**

✅ **Best Practice**:
```typescript
// app/api/users/route.ts
import { getPool } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM users LIMIT 10');
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

✅ **With Transactions**:
```typescript
import { withTransaction } from '@/lib/database';

export async function POST(req: Request) {
  const { userId, orderId } = await req.json();
  
  try {
    const result = await withTransaction(async (client) => {
      // Multiple queries in a transaction
      await client.query(
        'INSERT INTO orders (user_id) VALUES ($1)',
        [userId]
      );
      
      await client.query(
        'UPDATE users SET order_count = order_count + 1 WHERE id = $1',
        [userId]
      );
      
      return { success: true };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 }
    );
  }
}
```

---

### 5. **Error Handling**

✅ **Production-Grade Error Handling**:
```typescript
export async function executeQuery<T>(
  query: string,
  params?: any[],
  retries = 3
): Promise<{ rows: T[] }> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const pool = getPool();
      const result = await pool.query(query, params);
      return { rows: result.rows };
    } catch (error) {
      const err = error as any;
      
      // Retry on connection errors
      if (
        err.code === 'ECONNREFUSED' || 
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('Connection terminated')
      ) {
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
          continue;
        }
      }
      
      throw error;
    }
  }
  throw new Error('Query failed after retries');
}
```

---

### 6. **Vercel Serverless Optimization**

**Key Differences from Traditional Servers**:

| Traditional Server | Vercel Serverless |
|-------------------|-------------------|
| Long-running process | Cold starts |
| Persistent connections | Connection per invocation |
| Unlimited connections | Limited to 10-20 |
| Shared pool | Isolated instances |

**Optimization Strategies**:

1. **Use Connection Pooling Services**:
   ```bash
   # Instead of direct PostgreSQL
   DATABASE_URL="postgres://user:pass@db.host:5432/db"
   
   # Use PgBouncer or Supabase pooler
   DATABASE_URL="postgres://user:pass@pooler.supabase.com:6543/db"
   ```

2. **Reduce Pool Size**:
   ```typescript
   max: process.env.VERCEL ? 10 : 20  // Smaller on Vercel
   ```

3. **Consider Prisma or Drizzle ORM**:
   - Built-in connection management
   - Better TypeScript support
   - Query builder for safety

---

### 7. **Monitoring & Debugging**

✅ **Add Pool Monitoring**:
```typescript
export function logPoolStats() {
  const pool = getPool();
  console.log({
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
}

// In your API route
export async function GET() {
  logPoolStats();  // See connection usage
  // ... rest of code
}
```

---

## 🚀 Migration Path (Optional Improvements)

### Option 1: Continue with `pg` (Current ✅)
- ✅ Already working
- ✅ Direct control
- ⚠️ Manual query building
- ⚠️ Manual type safety

### Option 2: Add Prisma (Recommended for large apps)
```bash
npm install prisma @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String?
}
```

```typescript
// app/api/users/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    where: { email: { contains: '@' } }
  });
  return NextResponse.json(users);
}
```

### Option 3: Drizzle ORM (Lightweight alternative)
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
});

const db = drizzle(pool);
const result = await db.select().from(users).where(eq(users.email, 'test@test.com'));
```

---

## 📊 Summary

### Current Status: **PRODUCTION READY** ✅

Your implementation already follows best practices:

1. ✅ `@types/pg` installed for TypeScript
2. ✅ Connection pooling with singleton pattern
3. ✅ SSL enabled for production
4. ✅ Error handling on pool
5. ✅ Transaction support via `withTransaction`

### Only Add If Needed:

- **Connection Pooling Service** (if hitting connection limits on Vercel)
- **ORM** (if you want type-safe queries and migrations)
- **Monitoring** (if you need to track performance)

---

## 🔧 Troubleshooting

### Issue: "Too many connections"
**Solution**: Reduce pool size or use PgBouncer
```typescript
max: 5,  // Reduce from 20
```

### Issue: "Connection timeout"
**Solution**: Increase timeout
```typescript
connectionTimeoutMillis: 10000,  // 10 seconds
```

### Issue: "SSL required"
**Solution**: Enable SSL
```typescript
ssl: { rejectUnauthorized: false }
```

### Issue: Cold starts are slow
**Solution**: 
- Use Vercel Edge Functions (if applicable)
- Pre-warm connections with cron jobs
- Consider Prisma Accelerate or Neon serverless

---

## 📚 Resources

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [node-postgres Best Practices](https://node-postgres.com/features/pooling)
- [Next.js Database Guides](https://nextjs.org/learn/dashboard-app/setting-up-your-database)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
