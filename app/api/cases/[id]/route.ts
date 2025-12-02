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
  let caseId: string | undefined;
  try {
    const { id } = await params;
    caseId = id;
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
        participants: {
          orderBy: [
            { role: 'asc' },
            { name: 'asc' },
          ],
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch participants for all interactions and tasks
    let participantsMap = new Map();
    try {
      // Get participant IDs from interactions
      const interactionParticipantIds = caseData.interactions.flatMap(i => {
        const ids = i.participantIds;
        return Array.isArray(ids) ? ids : [];
      });
      
      // Get participant IDs from tasks
      const taskParticipantIds = (caseData.tasks || [])
        .map((t: any) => t.assignedToParticipantId)
        .filter((id: string | null | undefined): id is string => Boolean(id));
      
      // Combine all participant IDs
      const allParticipantIds = [...new Set([...interactionParticipantIds, ...taskParticipantIds])];
      
      if (allParticipantIds.length > 0) {
        const participants = await prisma.participant.findMany({
          where: { id: { in: allParticipantIds } },
        });
        participantsMap = new Map(participants.map(p => [p.id, p]));
      }
    } catch (participantError) {
      console.error('Error fetching participants (non-fatal):', participantError);
      // Continue without participants if there's an error
    }

    // Map interactions with participant details
    const interactionsWithParticipants = caseData.interactions.map(interaction => {
      // Safely get participantIds - handle both array and potential null/undefined
      const participantIds = Array.isArray((interaction as any).participantIds) 
        ? (interaction as any).participantIds 
        : [];
      
      const participants = participantIds
        .map((id: string) => participantsMap.get(id))
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
          role: p.role,
          name: p.name,
        }));

      return {
        id: interaction.id,
        caseId: interaction.caseId,
        dateTime: interaction.dateTime,
        type: interaction.type,
        participantIds: participantIds,
        participants: participants,
        rawInputSource: interaction.rawInputSource,
        transcriptText: interaction.transcriptText,
        aiSummary: interaction.aiSummary,
        aiActionItems: interaction.aiActionItems,
        isScheduled: interaction.isScheduled,
        scheduledDateTime: interaction.scheduledDateTime,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
        tasks: interaction.tasks || [],
      };
    });

    // Return case data with populated participants in interactions
    return NextResponse.json({
      case: {
        id: caseData.id,
        workerName: caseData.workerName,
        workerInitials: caseData.workerInitials,
        claimNumber: caseData.claimNumber,
        insurerName: caseData.insurerName,
        employerName: caseData.employerName,
        keyContacts: caseData.keyContacts,
        status: caseData.status,
        currentCapacitySummary: caseData.currentCapacitySummary,
        nextKeyDate: caseData.nextKeyDate,
        createdAt: caseData.createdAt,
        updatedAt: caseData.updatedAt,
        interactions: interactionsWithParticipants,
        tasks: (caseData.tasks || []).map((task: any) => {
          const assignedParticipantId = (task as any).assignedToParticipantId;
          const assignedParticipant = assignedParticipantId && typeof assignedParticipantId === 'string'
            ? participantsMap.get(assignedParticipantId)
            : null;
          
          return {
            id: task.id,
            caseId: task.caseId,
            interactionId: task.interactionId,
            description: task.description,
            dueDate: task.dueDate,
            status: task.status,
            assignedToParticipantId: assignedParticipantId || null,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            assignedToParticipant: assignedParticipant ? {
              id: assignedParticipant.id,
              role: assignedParticipant.role,
              name: assignedParticipant.name,
            } : null,
          };
        }),
        reports: caseData.reports || [],
        participants: caseData.participants || [],
      },
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack, caseId });
    
    // Return detailed error in development
    const errorResponse: any = { 
      error: 'Failed to fetch case',
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = errorMessage;
      errorResponse.stack = errorStack;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
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
// DELETE /api/cases/[id] - Delete case and all related data
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if case exists
    const caseExists = await prisma.case.findUnique({
      where: { id },
    });

    if (!caseExists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Delete case (cascading deletes will handle interactions, tasks, and reports)
    // Prisma schema has onDelete: Cascade for all relations
    await prisma.case.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}

