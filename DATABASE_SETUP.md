# Database Connection Setup for Neon

## Issue
Neon databases can have connection issues in serverless environments like Vercel. The database may be sleeping or the connection string may not be using the pooler.

## Solution

### 1. Use Connection Pooler URL

For Neon databases in production (Vercel), you **must** use the **pooler connection string**, not the direct connection string.

In your Neon dashboard:
1. Go to your project
2. Click on "Connection Details"
3. Select **"Pooled connection"** (not "Direct connection")
4. Copy the connection string

The pooled connection string will look like:
```
postgres://user:password@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Environment Variables

Make sure you have `POSTGRES_URL` set in Vercel:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add `POSTGRES_URL` with your **pooled connection string**

### 3. Connection String Format

The connection string should include:
- `?sslmode=require` (for SSL)
- Pooler endpoint (ends with `-pooler`)

Example:
```
POSTGRES_URL=postgres://user:password@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Database Schema

Make sure the schema name matches:
- Schema name: `rehab_copilot`
- This is configured in `prisma/schema.prisma`

### 5. Troubleshooting

If you still get connection errors:

1. **Check if database is awake**: Neon databases sleep after inactivity. The first request may take a few seconds.

2. **Verify connection string**: Make sure you're using the **pooler** URL, not the direct connection URL.

3. **Check Vercel environment variables**: 
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `POSTGRES_URL` is set correctly
   - Make sure it's set for **Production** environment

4. **Test connection locally**:
   ```bash
   npx prisma db pull
   ```

5. **Wake up the database**: Make a simple query to wake it up:
   ```bash
   npx prisma studio
   ```

### 6. Alternative: Use Direct Connection with Connection Pooling Library

If pooler doesn't work, you can use `@neondatabase/serverless` with Prisma:

```bash
npm install @neondatabase/serverless
```

But the pooler approach is recommended for Vercel.

## Current Configuration

- **Schema**: `rehab_copilot`
- **Environment Variable**: `POSTGRES_URL`
- **Connection Type**: Should use **pooler** in production
- **Retry Logic**: Implemented in `lib/db/prisma.ts`

