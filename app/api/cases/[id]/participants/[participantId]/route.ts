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

const updateParticipantSchema = z.object({
  role: participantRoleEnum.optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
});

// PATCH /api/cases/[id]/participants/[participantId] - Update participant
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateParticipantSchema.parse(body);

    // Verify participant belongs to case
    const participant = await prisma.participant.findFirst({
      where: {
        id: params.participantId,
        caseId: params.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;

    const updated = await prisma.participant.update({
      where: { id: params.participantId },
      data: updateData,
    });

    return NextResponse.json({ participant: updated });
  } catch (error) {
    console.error('Error updating participant:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id]/participants/[participantId] - Delete participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    // Verify participant belongs to case
    const participant = await prisma.participant.findFirst({
      where: {
        id: params.participantId,
        caseId: params.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    await prisma.participant.delete({
      where: { id: params.participantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: 500 }
    );
  }
}

