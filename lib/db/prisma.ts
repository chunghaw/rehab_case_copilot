import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma Client configuration for better connection handling
// This configuration helps prevent "Connection closed" errors with serverless databases like Neon
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Force Prisma to reconnect and refresh schema in development
if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
  // This ensures the client is fresh on server restart
  prisma.$connect().catch(() => {
    // Ignore connection errors during initialization
  });
}

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Cleanup on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Helper function to retry database operations on connection errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = 
        error?.message?.includes('Closed') ||
        error?.message?.includes('connection') ||
        error?.code === 'P1001' || // Prisma connection error code
        error?.code === 'P1008';    // Prisma timeout error code
      
      if (isConnectionError && i < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}
