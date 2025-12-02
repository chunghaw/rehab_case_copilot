import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { summarizeInteraction, extractActionItems } from '@/lib/openai';
import { z } from 'zod';

const regenerateSummarySchema = z.object({
  customInstructions: z.string().optional(),
  useEditedContent: z.boolean().optional().default(false),
  editedContent: z.string().optional(),
});

// ============================================================================
// POST /api/interactions/[id]/regenerate-summary - Regenerate AI summary
// ============================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = regenerateSummarySchema.parse(body);

    // Get the interaction
    const interaction = await prisma.interaction.findUnique({
      where: { id },
      include: {
        case: true,
      },
    });

    if (!interaction) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
    }

    // Fetch participants for the interaction
    let participantNames: string[] = [];
    if (interaction.participantIds && interaction.participantIds.length > 0) {
      const participants = await prisma.participant.findMany({
        where: { id: { in: interaction.participantIds } },
      });
      participantNames = participants.map(p => `${p.role.replace('_', ' ')}: ${p.name}`);
    }

    // Use edited content if provided, otherwise use transcript
    const sourceText = validatedData.useEditedContent && validatedData.editedContent
      ? validatedData.editedContent
      : interaction.transcriptText;

    if (!sourceText) {
      return NextResponse.json(
        { error: 'No transcription or content available to summarize' },
        { status: 400 }
      );
    }

    // Get stored sections from interaction, or use defaults
    const storedSections = (interaction.summarySections as any) || {
      mainIssues: true,
      currentCapacity: true,
      treatmentAndMedical: true,
      barriersToRTW: true,
      agreedActions: true,
    };
    const storedCustomSections = (interaction.customSections as string[]) || [];
    const storedSectionLabels = (interaction.sectionLabels as Record<string, string>) || {};

    // Build custom instructions based on stored sections
    const instructions: string[] = [];
    if (!storedSections.mainIssues) instructions.push('Do not include main issues section');
    if (!storedSections.currentCapacity) instructions.push('Do not include current capacity section');
    if (!storedSections.treatmentAndMedical) instructions.push('Do not include treatment and medical section');
    if (!storedSections.barriersToRTW) instructions.push('Do not include barriers to RTW section');
    if (!storedSections.agreedActions) instructions.push('Do not include agreed actions section');

    // Add custom sections to instructions
    if (storedCustomSections.length > 0) {
      instructions.push(`Additionally, include these custom sections: ${storedCustomSections.join(', ')}. For each custom section, extract relevant information from the transcript and format as a list of bullet points.`);
    }

    // Combine with any additional custom instructions
    const allInstructions = validatedData.customInstructions
      ? [...instructions, validatedData.customInstructions].join('\n')
      : instructions.length > 0 ? instructions.join('\n') : undefined;

    // Regenerate summary with stored sections and custom instructions
    const summary = await summarizeInteraction(
      sourceText,
      interaction.type,
      participantNames,
      allInstructions
    );

    // Format the AI summary as text based on stored sections and labels
    const summaryParts: string[] = [];
    if (storedSections.mainIssues) {
      const label = storedSectionLabels.mainIssues || 'Main Issues';
      summaryParts.push(`## ${label}\n${summary.mainIssues.map((issue) => `- ${issue}`).join('\n')}`);
    }
    if (storedSections.currentCapacity) {
      const label = storedSectionLabels.currentCapacity || 'Current Capacity & Duties';
      summaryParts.push(`## ${label}\n${summary.currentCapacity}`);
    }
    if (storedSections.treatmentAndMedical) {
      const label = storedSectionLabels.treatmentAndMedical || 'Treatment & Medical Input';
      summaryParts.push(`## ${label}\n${summary.treatmentAndMedical.map((item) => `- ${item}`).join('\n')}`);
    }
    if (storedSections.barriersToRTW) {
      const label = storedSectionLabels.barriersToRTW || 'Barriers to RTW';
      summaryParts.push(`## ${label}\n${summary.barriersToRTW.map((barrier) => `- ${barrier}`).join('\n')}`);
    }
    if (storedSections.agreedActions) {
      const label = storedSectionLabels.agreedActions || 'Agreed Actions';
      summaryParts.push(`## ${label}\n${summary.agreedActions.map((action) => `- ${action}`).join('\n')}`);
    }

    // Add custom sections
    if (storedCustomSections.length > 0) {
      const summaryAny = summary as any;
      storedCustomSections.forEach((customSectionLabel) => {
        const camelCaseName = customSectionLabel
          .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
          .replace(/\s/g, '')
          .replace(/^(.)/, (_, c) => c.toLowerCase());
        
        if (summaryAny[camelCaseName] && Array.isArray(summaryAny[camelCaseName])) {
          summaryParts.push(`## ${customSectionLabel}\n${summaryAny[camelCaseName].map((item: string) => `- ${item}`).join('\n')}`);
        } else {
          summaryParts.push(`## ${customSectionLabel}\n- Information to be extracted`);
        }
      });
    }

    const aiSummaryText = summaryParts.join('\n\n').trim();

    // Extract action items from the source text
    const actionItems = await extractActionItems(
      sourceText,
      participantNames
    );

    // Update the interaction
    const updatedInteraction = await prisma.interaction.update({
      where: { id },
      data: {
        aiSummary: aiSummaryText,
        aiActionItems: actionItems as any,
      },
    });

    // Delete old tasks linked to this interaction
    await prisma.task.deleteMany({
      where: { interactionId: id },
    });

    // Create new tasks from action items
    const tasks = await Promise.all(
      actionItems.map((item) =>
        prisma.task.create({
          data: {
            caseId: interaction.caseId,
            interactionId: id,
            description: item.description,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
            assignedTo: item.owner || 'consultant',
          },
        })
      )
    );

    return NextResponse.json({
      interaction: updatedInteraction,
      tasks,
    });
  } catch (error) {
    console.error('Error regenerating summary:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to regenerate summary' },
      { status: 500 }
    );
  }
}

