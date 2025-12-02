import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateInteractionSchema = z.object({
  type: z.enum(['CASE_CONFERENCE', 'PHONE_CALL', 'IN_PERSON_MEETING', 'EMAIL', 'NOTE']).optional(),
  participantIds: z.array(z.string()).optional(),
  transcriptText: z.string().optional(),
  dateTime: z.string().optional(),
  aiSummary: z.string().optional(),
});

// ============================================================================
// PATCH /api/interactions/[id] - Update interaction
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateInteractionSchema.parse(body);

    const updateData: any = {};
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.participantIds) updateData.participantIds = validatedData.participantIds;
    if (validatedData.transcriptText !== undefined) updateData.transcriptText = validatedData.transcriptText;
    if (validatedData.dateTime) updateData.dateTime = new Date(validatedData.dateTime);
    if (validatedData.aiSummary !== undefined) updateData.aiSummary = validatedData.aiSummary;

    const updatedInteraction = await prisma.interaction.update({
      where: { id },
      data: updateData,
    });

    // Fetch participant details for response
    const participants = await prisma.participant.findMany({
      where: { id: { in: updatedInteraction.participantIds } },
    });

    return NextResponse.json({
      interaction: {
        ...updatedInteraction,
        participants,
      },
    });
  } catch (error) {
    console.error('Error updating interaction:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update interaction' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/interactions/[id] - Delete interaction
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.interaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Interaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json({ error: 'Failed to delete interaction' }, { status: 500 });
  }
}

