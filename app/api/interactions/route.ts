import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { summarizeInteraction, extractActionItems } from '@/lib/openai';

// Schema for creating interaction from text
const createInteractionSchema = z.object({
  caseId: z.string(),
  type: z.enum(['CASE_CONFERENCE', 'PHONE_CALL', 'IN_PERSON_MEETING', 'EMAIL', 'NOTE']),
  dateTime: z.string().optional(),
  participantIds: z.array(z.string()),
  textContent: z.string().min(1),
  isScheduled: z.boolean().optional().default(false),
  scheduledDateTime: z.string().optional(),
  summarySections: z.object({
    mainIssues: z.boolean().optional(),
    currentCapacity: z.boolean().optional(),
    treatmentAndMedical: z.boolean().optional(),
    barriersToRTW: z.boolean().optional(),
    agreedActions: z.boolean().optional(),
  }).optional(),
  customSections: z.array(z.string()).optional(),
  sectionLabels: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// POST /api/interactions - Create interaction from text or audio
// ============================================================================
export async function POST(request: NextRequest) {
  let interactionData: any = null;
  try {
    const body = await request.json();
    const validatedData = createInteractionSchema.parse(body);

    const dateTime = validatedData.dateTime
      ? new Date(validatedData.dateTime)
      : new Date();

    // Build custom instructions based on selected sections
    const sections = validatedData.summarySections ? {
      mainIssues: validatedData.summarySections.mainIssues ?? true,
      currentCapacity: validatedData.summarySections.currentCapacity ?? true,
      treatmentAndMedical: validatedData.summarySections.treatmentAndMedical ?? true,
      barriersToRTW: validatedData.summarySections.barriersToRTW ?? true,
      agreedActions: validatedData.summarySections.agreedActions ?? true,
    } : {
      mainIssues: true,
      currentCapacity: true,
      treatmentAndMedical: true,
      barriersToRTW: true,
      agreedActions: true,
    };

    const sectionLabels = validatedData.sectionLabels || {};

    const instructions: string[] = [];
    if (!sections.mainIssues) instructions.push('Do not include main issues section');
    if (!sections.currentCapacity) instructions.push('Do not include current capacity section');
    if (!sections.treatmentAndMedical) instructions.push('Do not include treatment and medical section');
    if (!sections.barriersToRTW) instructions.push('Do not include barriers to RTW section');
    if (!sections.agreedActions) instructions.push('Do not include agreed actions section');

    // Add custom sections to instructions
    if (validatedData.customSections && validatedData.customSections.length > 0) {
      instructions.push(`Additionally, include these custom sections: ${validatedData.customSections.join(', ')}. For each custom section, extract relevant information from the transcript and format as a list of bullet points.`);
    }


    // Fetch participant details for AI processing
    const participants = await prisma.participant.findMany({
      where: { id: { in: validatedData.participantIds } },
    });
    const participantNames = participants.map(p => `${p.role.replace('_', ' ')}: ${p.name}`);

    // Summarize the interaction using AI
    const summary = await summarizeInteraction(
      validatedData.textContent,
      validatedData.type,
      participantNames,
      instructions.length > 0 ? instructions.join('\n') : undefined
    );

    // Extract action items
    const actionItems = await extractActionItems(
      validatedData.textContent,
      participantNames
    );

    // Format the AI summary as text based on selected sections and custom labels
    const summaryParts: string[] = [];
    if (sections.mainIssues) {
      const label = sectionLabels.mainIssues || 'Main Issues';
      summaryParts.push(`## ${label}\n${summary.mainIssues.map((issue) => `- ${issue}`).join('\n')}`);
    }
    if (sections.currentCapacity) {
      const label = sectionLabels.currentCapacity || 'Current Capacity & Duties';
      summaryParts.push(`## ${label}\n${summary.currentCapacity}`);
    }
    if (sections.treatmentAndMedical) {
      const label = sectionLabels.treatmentAndMedical || 'Treatment & Medical Input';
      summaryParts.push(`## ${label}\n${summary.treatmentAndMedical.map((item) => `- ${item}`).join('\n')}`);
    }
    if (sections.barriersToRTW) {
      const label = sectionLabels.barriersToRTW || 'Barriers to RTW';
      summaryParts.push(`## ${label}\n${summary.barriersToRTW.map((barrier) => `- ${barrier}`).join('\n')}`);
    }
    if (sections.agreedActions) {
      const label = sectionLabels.agreedActions || 'Agreed Actions';
      summaryParts.push(`## ${label}\n${summary.agreedActions.map((action) => `- ${action}`).join('\n')}`);
    }

    // Add custom sections
    if (validatedData.customSections && validatedData.customSections.length > 0) {
      const summaryAny = summary as any;
      validatedData.customSections.forEach((customSectionLabel) => {
        // Try to find the section in the AI response
        const camelCaseName = customSectionLabel
          .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
          .replace(/\s/g, '')
          .replace(/^(.)/, (_, c) => c.toLowerCase());
        
        if (summaryAny[camelCaseName] && Array.isArray(summaryAny[camelCaseName])) {
          summaryParts.push(`## ${customSectionLabel}\n${summaryAny[camelCaseName].map((item: string) => `- ${item}`).join('\n')}`);
        } else {
          // If not in response, add a placeholder
          summaryParts.push(`## ${customSectionLabel}\n- Information to be extracted`);
        }
      });
    }

    const aiSummaryText = summaryParts.join('\n\n').trim();

    // Create the interaction data object
    // Use InteractionUncheckedCreateInput type structure
    interactionData = {
      caseId: validatedData.caseId,
      type: validatedData.type,
      dateTime: validatedData.isScheduled && validatedData.scheduledDateTime
        ? new Date(validatedData.scheduledDateTime)
        : dateTime,
      participantIds: validatedData.participantIds,
      rawInputSource: 'text',
      transcriptText: validatedData.textContent,
      aiSummary: aiSummaryText,
      aiActionItems: actionItems as any,
      summarySections: sections as any,
      customSections: validatedData.customSections && validatedData.customSections.length > 0 
        ? validatedData.customSections 
        : null,
      sectionLabels: Object.keys(sectionLabels).length > 0 ? sectionLabels : null,
    };

    // Set scheduled fields - these are optional in the schema
    if (validatedData.isScheduled !== undefined) {
      interactionData.isScheduled = validatedData.isScheduled;
    }
    
    if (validatedData.scheduledDateTime) {
      interactionData.scheduledDateTime = new Date(validatedData.scheduledDateTime);
    }

    // Remove undefined values to avoid Prisma errors
    Object.keys(interactionData).forEach((key) => {
      if (interactionData[key] === undefined) {
        delete interactionData[key];
      }
    });

    // Validate interaction data before creating
    if (!interactionData.caseId || !interactionData.type) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId or type' },
        { status: 400 }
      );
    }

    const interaction = await prisma.interaction.create({
      data: interactionData,
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (interactionData) {
      console.error('Error details:', { errorMessage, interactionData });
    } else {
      console.error('Error details:', { errorMessage });
    }
    return NextResponse.json(
      { error: 'Failed to create interaction', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/interactions - List interactions for a case or all interactions
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    const where: any = {};
    if (caseId) {
      where.caseId = caseId;
    }

    const interactions = await prisma.interaction.findMany({
      where,
      include: {
        tasks: true,
        case: caseId ? false : {
          select: {
            id: true,
            workerName: true,
            claimNumber: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });

    // Fetch participants for all interactions
    const allParticipantIds = interactions.flatMap(i => i.participantIds);
    const participants = await prisma.participant.findMany({
      where: { id: { in: allParticipantIds } },
    });

    const participantsMap = new Map(participants.map(p => [p.id, p]));

    // Map interactions with participant details
    const interactionsWithParticipants = interactions.map(interaction => ({
      ...interaction,
      participants: interaction.participantIds
        .map(id => participantsMap.get(id))
        .filter(Boolean),
    }));

    return NextResponse.json({ interactions: interactionsWithParticipants });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

