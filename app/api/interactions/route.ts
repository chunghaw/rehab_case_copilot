import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { summarizeInteraction, extractActionItems } from '@/lib/openai';

// Schema for creating interaction from text
const createInteractionSchema = z.object({
  caseId: z.string(),
  type: z.enum(['CASE_CONFERENCE', 'PHONE_CALL', 'IN_PERSON_MEETING', 'EMAIL', 'NOTE']),
  dateTime: z.string().optional(),
  participants: z.array(z.string()),
  textContent: z.string().min(1),
});

// ============================================================================
// POST /api/interactions - Create interaction from text or audio
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createInteractionSchema.parse(body);

    const dateTime = validatedData.dateTime
      ? new Date(validatedData.dateTime)
      : new Date();

    // Summarize the interaction using AI
    const summary = await summarizeInteraction(
      validatedData.textContent,
      validatedData.type,
      validatedData.participants
    );

    // Extract action items
    const actionItems = await extractActionItems(
      validatedData.textContent,
      validatedData.participants
    );

    // Format the AI summary as text
    const aiSummaryText = `
## Main Issues
${summary.mainIssues.map((issue) => `- ${issue}`).join('\n')}

## Current Capacity & Duties
${summary.currentCapacity}

## Treatment & Medical Input
${summary.treatmentAndMedical.map((item) => `- ${item}`).join('\n')}

## Barriers to RTW
${summary.barriersToRTW.map((barrier) => `- ${barrier}`).join('\n')}

## Agreed Actions
${summary.agreedActions.map((action) => `- ${action}`).join('\n')}
    `.trim();

    // Create the interaction
    const interaction = await prisma.interaction.create({
      data: {
        caseId: validatedData.caseId,
        type: validatedData.type,
        dateTime,
        participants: validatedData.participants,
        rawInputSource: 'text',
        transcriptText: validatedData.textContent,
        aiSummary: aiSummaryText,
        aiActionItems: actionItems as any,
      },
    });

    // Create tasks from action items
    const tasks = await Promise.all(
      actionItems.map((item) =>
        prisma.task.create({
          data: {
            caseId: validatedData.caseId,
            interactionId: interaction.id,
            description: item.description,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
            assignedTo: item.owner || 'consultant',
          },
        })
      )
    );

    return NextResponse.json(
      {
        interaction,
        tasks,
        summary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating interaction:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/interactions - List interactions for a case
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    const interactions = await prisma.interaction.findMany({
      where: { caseId },
      include: {
        tasks: true,
      },
      orderBy: {
        dateTime: 'desc',
      },
    });

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

