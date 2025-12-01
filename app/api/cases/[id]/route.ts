import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateCaseSchema = z.object({
  workerName: z.string().optional(),
  workerInitials: z.string().optional(),
  insurerName: z.string().optional(),
  employerName: z.string().optional(),
  keyContacts: z.object({
    insurer_case_manager: z.string().optional(),
    employer_contact: z.string().optional(),
    gp: z.string().optional(),
    specialist: z.string().optional(),
    physio: z.string().optional(),
  }).optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CLOSED']).optional(),
  currentCapacitySummary: z.string().optional(),
  nextKeyDate: z.string().optional().nullable(),
});

// ============================================================================
// GET /api/cases/[id] - Get case details with interactions and tasks
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        interactions: {
          orderBy: { dateTime: 'desc' },
          include: {
            tasks: true,
          },
        },
        tasks: {
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        },
        reports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ case: caseData });
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/cases/[id] - Update case details
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCaseSchema.parse(body);

    // Convert nextKeyDate string to Date if provided
    const updateData: any = { ...validatedData };
    if (validatedData.nextKeyDate !== undefined) {
      updateData.nextKeyDate = validatedData.nextKeyDate
        ? new Date(validatedData.nextKeyDate)
        : null;
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error('Error updating case:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/cases/[id] - Archive/close case
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete by setting status to CLOSED
    const closedCase = await prisma.case.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    return NextResponse.json({ case: closedCase });
  } catch (error) {
    console.error('Error closing case:', error);
    return NextResponse.json({ error: 'Failed to close case' }, { status: 500 });
  }
}

