# PostgreSQL + TypeScript Build Error - Quick Fix Guide

## 🚨 The Error

```
Type error: Could not find a declaration file for module 'pg'
'/path/to/node_modules/pg/lib/index.js' implicitly has an 'any' type.
```

## ✅ The Fix (Already Applied)

```bash
npm install --save-dev @types/pg
```

```json
// package.json
{
  "dependencies": {
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0"  // ← This fixes the error
  }
}
```

## 🔍 Why This Happens

| Phase | What Happens | Needs Types? |
|-------|--------------|--------------|
| **Development** | TypeScript LSP checks types | ✅ Yes |
| **Build** | `tsc` compiles `.ts` → `.js` | ✅ Yes |
| **Runtime** | JavaScript executes | ❌ No |
| **Vercel Deploy** | Runs `npm run build` | ✅ Yes (fails without @types) |

## 📦 Package Roles

```typescript
// The 'pg' package (runtime)
import { Pool } from 'pg';  // Actual PostgreSQL driver
const pool = new Pool({ ... });

// The '@types/pg' package (build-time only)
// Provides TypeScript definitions:
// - Pool class structure
// - Method signatures  
// - Return types
// Never included in production bundle
```

## 🎯 Correct Usage Pattern

✅ **Static Import (Recommended)**
```typescript
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

⚠️ **Dynamic Import (Avoid in library code)**
```typescript
// This works at runtime but can cause build issues
const { Pool } = await import('pg');
```

## 🚀 Deployment Checklist

- [x] `pg` in `dependencies`
- [x] `@types/pg` in `devDependencies`
- [x] `DATABASE_URL` in environment variables
- [x] Static imports (not dynamic `await import()`)
- [x] SSL enabled for production
- [x] Connection pooling configured

## 🔧 Vercel-Specific Configuration

```typescript
// lib/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,  // Lower for serverless
  ssl: { rejectUnauthorized: false },  // Most cloud DBs need this
});

export default pool;
```

```typescript
// app/api/users/route.ts
import pool from '@/lib/database';

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM users');
  return Response.json(rows);
}
```

## ⚠️ Common Mistakes

❌ **Creating new pool per request**
```typescript
export async function GET() {
  const pool = new Pool({ ... });  // ❌ Leaks connections!
  const { rows } = await pool.query('...');
  return Response.json(rows);
}
```

❌ **Forgetting @types package**
```typescript
// package.json
{
  "dependencies": {
    "pg": "^8.16.3"  // ❌ No @types/pg = build fails
  }
}
```

❌ **Not handling errors**
```typescript
const { rows } = await pool.query('...');  // ❌ Unhandled promise
```

✅ **Correct pattern**
```typescript
let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({ ... });
  }
  return pool;
}

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query('...');
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
```

## 🎓 TypeScript Type Safety

```typescript
// Define result types
interface User {
  id: number;
  email: string;
  name: string;
}

// Type-safe query
const result = await pool.query<User>(
  'SELECT id, email, name FROM users WHERE id = $1',
  [userId]
);

const user: User | undefined = result.rows[0];  // ✅ Type-safe
```

## 📚 See Also

- Full documentation: `docs/POSTGRES_BEST_PRACTICES.md`
- Your database utility: `src/lib/database.ts`
- Example API route: `src/app/api/*/route.ts`
