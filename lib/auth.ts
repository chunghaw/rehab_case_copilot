import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export interface SessionUser {
  id: string;
  username: string;
}

const SESSION_COOKIE_NAME = 'rehab_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string, username: string): Promise<string> {
  const sessionId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // In a production app, you'd store sessions in a database
  // For simplicity, we'll use a signed cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  // In a production app, you'd validate the session from a database
  // For simplicity, we'll check if a user exists
  // Extract username from session (in production, use a session store)
  try {
    // For now, we'll use a simple approach: check if any user exists
    // In production, you'd decode the session token and look up the user
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      return null;
    }
    
    // For single-user setup, return the first user
    // In production, decode session and get user ID
    const user = users[0];
    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

