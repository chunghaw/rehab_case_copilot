import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Schema for creating a new case
const createCaseSchema = z.object({
  workerName: z.string().min(1),
  workerInitials: z.string().optional(),
  claimNumber: z.string().min(1),
  insurerName: z.string().min(1),
  employerName: z.string().min(1),
  keyContacts: z.object({
    insurer_case_manager: z.string().optional(),
    employer_contact: z.string().optional(),
    gp: z.string().optional(),
    specialist: z.string().optional(),
    physio: z.string().optional(),
  }),
  currentCapacitySummary: z.string().optional(),
  nextKeyDate: z.string().optional(),
});

// ============================================================================
// GET /api/cases - List all active cases
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACTIVE';

    const cases = await prisma.case.findMany({
      where: {
        status: status as any,
      },
      include: {
        _count: {
          select: {
            interactions: true,
            tasks: { where: { status: 'PENDING' } },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/cases - Create a new case
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCaseSchema.parse(body);

    // Convert nextKeyDate string to Date if provided
    const nextKeyDate = validatedData.nextKeyDate
      ? new Date(validatedData.nextKeyDate)
      : undefined;

    const newCase = await prisma.case.create({
      data: {
        ...validatedData,
        nextKeyDate,
      },
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}

