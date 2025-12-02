import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSession, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session
    try {
      await createSession(user.id, user.username);
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // Still return success but log the error
      // In production, you might want to handle this differently
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    // Provide more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Login error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to login',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}

