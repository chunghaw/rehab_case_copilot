import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const participantRoleEnum = z.enum([
  'INSURER_CM',
  'EMPLOYER',
  'GP',
  'SPECIALIST',
  'PHYSIO',
  'CONSULTANT',
  'OTHER',
]);

const createParticipantSchema = z.object({
  role: participantRoleEnum,
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
});

const updateParticipantSchema = createParticipantSchema.partial().extend({
  role: participantRoleEnum.optional(),
  name: z.string().min(1).optional(),
});

// GET /api/cases/[id]/participants - Fetch all participants for a case
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participants = await prisma.participant.findMany({
      where: { caseId: params.id },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/participants - Create new participant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = createParticipantSchema.parse(body);

    // Verify case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: params.id },
    });

    if (!caseExists) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const participant = await prisma.participant.create({
      data: {
        caseId: params.id,
        role: validatedData.role,
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        notes: validatedData.notes || null,
      },
    });

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    console.error('Error creating participant:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 }
    );
  }
}

