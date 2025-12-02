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
  let interactionId: string | undefined;
  try {
    const { id } = await params;
    interactionId = id;
    console.log(`[regenerate-summary] Starting for interaction: ${id}`);
    
    const body = await request.json();
    console.log(`[regenerate-summary] Request body:`, { 
      useEditedContent: body.useEditedContent,
      hasEditedContent: !!body.editedContent,
      hasCustomInstructions: !!body.customInstructions 
    });
    
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
    // If useEditedContent is true, we're regenerating from the edited summary (markdown format)
    // We need to extract plain text from the markdown for the AI to process
    let sourceText: string;
    let isFromSummary = false;
    let sectionsFromEditedSummary: any = null;
    let customSectionsFromEdited: string[] = [];
    let sectionLabelsFromEdited: Record<string, string> = {};
    let detectedSections: string[] = [];
    
    if (validatedData.useEditedContent && validatedData.editedContent) {
      // Parse the edited summary to extract sections
      const editedSummary = validatedData.editedContent;
      const sectionMatches = editedSummary.matchAll(/^##\s+(.+)$/gm);
      
      for (const match of sectionMatches) {
        const sectionTitle = match[1].trim();
        detectedSections.push(sectionTitle);
        sectionLabelsFromEdited[sectionTitle.toLowerCase().replace(/\s+/g, '')] = sectionTitle;
      }
      
      // Map detected sections to standard sections
      sectionsFromEditedSummary = {
        mainIssues: detectedSections.some(s => /main\s+issues?/i.test(s)),
        currentCapacity: detectedSections.some(s => /current\s+capacity/i.test(s)),
        treatmentAndMedical: detectedSections.some(s => /treatment|medical/i.test(s)),
        barriersToRTW: detectedSections.some(s => /barriers?.*rtw|rtw.*barriers?/i.test(s)),
        agreedActions: detectedSections.some(s => /agreed\s+actions?/i.test(s)),
      };
      
      // Find custom sections (sections that don't match standard ones)
      const standardSectionPatterns = [
        /main\s+issues?/i,
        /current\s+capacity/i,
        /treatment|medical/i,
        /barriers?.*rtw|rtw.*barriers?/i,
        /agreed\s+actions?/i,
      ];
      
      customSectionsFromEdited = detectedSections.filter(section => 
        !standardSectionPatterns.some(pattern => pattern.test(section))
      );
      
      console.log(`[regenerate-summary] Detected sections from edited summary:`, {
        allSections: detectedSections,
        customSections: customSectionsFromEdited,
        standardSections: sectionsFromEditedSummary,
        sectionLabels: sectionLabelsFromEdited,
      });
      
      // Store the order of sections as they appear in the edited summary
      const sectionOrder = detectedSections;
      
      // Extract text from markdown - remove headers and bullet points
      sourceText = editedSummary
        .replace(/^##\s+.+$/gm, '') // Remove headers
        .replace(/^-\s+/gm, '') // Remove bullet points
        .replace(/\n\n+/g, '\n') // Normalize line breaks
        .trim();
      
      isFromSummary = true;
      
      // If the extracted text is too short or empty, fall back to original transcript
      if (!sourceText || sourceText.length < 50) {
        sourceText = interaction.transcriptText || '';
        isFromSummary = false;
        sectionsFromEditedSummary = null;
        customSectionsFromEdited = [];
        sectionLabelsFromEdited = {};
      }
    } else {
      sourceText = interaction.transcriptText || '';
    }

    if (!sourceText || sourceText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No transcription or content available to summarize' },
        { status: 400 }
      );
    }

    // Use sections from edited summary if available, otherwise use stored sections
    const storedSections = sectionsFromEditedSummary || (interaction.summarySections as any) || {
      mainIssues: true,
      currentCapacity: true,
      treatmentAndMedical: true,
      barriersToRTW: true,
      agreedActions: true,
    };
    // Prioritize custom sections from edited summary, then fall back to stored
    const storedCustomSections = customSectionsFromEdited.length > 0 
      ? customSectionsFromEdited 
      : (interaction.customSections as string[]) || [];
    const storedSectionLabels = Object.keys(sectionLabelsFromEdited).length > 0
      ? sectionLabelsFromEdited
      : (interaction.sectionLabels as Record<string, string>) || {};
    
    console.log(`[regenerate-summary] Using sections:`, {
      storedSections,
      storedCustomSections,
      storedSectionLabels: Object.keys(storedSectionLabels),
      isFromSummary,
    });

    // Build custom instructions based on stored sections
    const instructions: string[] = [];
    if (!storedSections.mainIssues) instructions.push('Do not include main issues section');
    if (!storedSections.currentCapacity) instructions.push('Do not include current capacity section');
    if (!storedSections.treatmentAndMedical) instructions.push('Do not include treatment and medical section');
    if (!storedSections.barriersToRTW) instructions.push('Do not include barriers to RTW section');
    if (!storedSections.agreedActions) instructions.push('Do not include agreed actions section');

    // Add custom sections to instructions
    if (storedCustomSections.length > 0) {
      instructions.push(`Additionally, include these custom sections: ${storedCustomSections.join(', ')}. For each custom section, extract relevant information from the content and format as a list of bullet points.`);
      
      // If regenerating from edited summary, tell AI to preserve these custom sections
      if (isFromSummary && customSectionsFromEdited.length > 0) {
        instructions.push(`IMPORTANT: The following custom sections were present in the edited summary and must be included in the regenerated summary: ${storedCustomSections.join(', ')}. Extract information for these sections from the provided content.`);
      }
    }

    // Combine with any additional custom instructions
    let allInstructions = validatedData.customInstructions
      ? [...instructions, validatedData.customInstructions]
      : [...instructions];
    
    // If regenerating from edited summary, add instruction to treat it as a summary
    if (isFromSummary) {
      allInstructions.push('Note: The provided content is an edited summary. Extract and reorganize the information from this summary text.');
    }
    
    const finalInstructions = allInstructions.length > 0 ? allInstructions.join('\n') : undefined;

    console.log(`[regenerate-summary] Calling summarizeInteraction with:`, {
      sourceTextLength: sourceText.length,
      interactionType: interaction.type,
      participantCount: participantNames.length,
      hasInstructions: !!finalInstructions,
    });

    // Regenerate summary with stored sections and custom instructions
    let summary: any;
    try {
      summary = await summarizeInteraction(
        sourceText,
        interaction.type,
        participantNames,
        finalInstructions
      );
      
      console.log(`[regenerate-summary] Summary received:`, {
        hasMainIssues: !!summary.mainIssues,
        hasCurrentCapacity: !!summary.currentCapacity,
        hasTreatmentAndMedical: !!summary.treatmentAndMedical,
        hasBarriersToRTW: !!summary.barriersToRTW,
        hasAgreedActions: !!summary.agreedActions,
      });
      
      // Validate summary structure
      if (!summary || typeof summary !== 'object') {
        throw new Error('Invalid summary response from AI');
      }
    } catch (error) {
      console.error('Error calling summarizeInteraction:', error);
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Format the AI summary as text based on stored sections and labels
    const summaryParts: string[] = [];
    try {
      if (storedSections.mainIssues && summary.mainIssues && Array.isArray(summary.mainIssues)) {
        const label = storedSectionLabels.mainIssues || 'Main Issues';
        const issues = summary.mainIssues.filter((issue: any) => issue && String(issue).trim()).map((issue: any) => String(issue).trim());
        if (issues.length > 0) {
          summaryParts.push(`## ${label}\n${issues.map((issue: string) => `- ${issue}`).join('\n')}`);
        }
      }
      if (storedSections.currentCapacity && summary.currentCapacity) {
        const label = storedSectionLabels.currentCapacity || 'Current Capacity & Duties';
        const capacity = String(summary.currentCapacity).trim();
        if (capacity) {
          summaryParts.push(`## ${label}\n${capacity}`);
        }
      }
      if (storedSections.treatmentAndMedical && summary.treatmentAndMedical && Array.isArray(summary.treatmentAndMedical)) {
        const label = storedSectionLabels.treatmentAndMedical || 'Treatment & Medical Input';
        const items = summary.treatmentAndMedical.filter((item: any) => item && String(item).trim()).map((item: any) => String(item).trim());
        if (items.length > 0) {
          summaryParts.push(`## ${label}\n${items.map((item: string) => `- ${item}`).join('\n')}`);
        }
      }
      if (storedSections.barriersToRTW && summary.barriersToRTW && Array.isArray(summary.barriersToRTW)) {
        const label = storedSectionLabels.barriersToRTW || 'Barriers to RTW';
        const barriers = summary.barriersToRTW.filter((barrier: any) => barrier && String(barrier).trim()).map((barrier: any) => String(barrier).trim());
        if (barriers.length > 0) {
          summaryParts.push(`## ${label}\n${barriers.map((barrier: string) => `- ${barrier}`).join('\n')}`);
        }
      }
      if (storedSections.agreedActions && summary.agreedActions && Array.isArray(summary.agreedActions)) {
        const label = storedSectionLabels.agreedActions || 'Agreed Actions';
        const actions = summary.agreedActions.filter((action: any) => action && String(action).trim()).map((action: any) => String(action).trim());
        if (actions.length > 0) {
          summaryParts.push(`## ${label}\n${actions.map((action: string) => `- ${action}`).join('\n')}`);
        }
      }
    } catch (formatError) {
      console.error('Error formatting summary sections:', formatError);
      console.error('Summary object:', JSON.stringify(summary, null, 2));
      throw new Error(`Failed to format summary: ${formatError instanceof Error ? formatError.message : String(formatError)}`);
    }

    // Add custom sections - extract directly from edited content if regenerating from summary
    if (storedCustomSections.length > 0) {
      if (isFromSummary && validatedData.editedContent) {
        // When regenerating from edited summary, extract custom sections directly from the edited content
        // This preserves user-added sections that the AI might not return
        storedCustomSections.forEach((customSectionLabel) => {
          // Escape special regex characters in the label
          const escapedLabel = customSectionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // Extract custom section content directly from edited summary
          // Split content by sections first to make extraction more reliable
          const sections = validatedData.editedContent.split(/^##\s+/gm);
          let sectionContent = null;
          
          // Normalize the label for comparison (trim and lowercase)
          const normalizedLabel = customSectionLabel.trim().toLowerCase();
          
          for (const section of sections) {
            const trimmedSection = section.trim();
            if (!trimmedSection) continue;
            
            // Get the first line (section title)
            const firstLine = trimmedSection.split('\n')[0].trim();
            const normalizedFirstLine = firstLine.toLowerCase();
            
            // Check if this section matches (exact or case-insensitive)
            if (normalizedFirstLine === normalizedLabel || firstLine === customSectionLabel) {
              // Found the section - extract everything after the title
              const lines = trimmedSection.split('\n');
              lines.shift(); // Remove the title line
              sectionContent = lines.join('\n').trim();
              break;
            }
          }
          
          // Fallback to regex if split didn't work
          if (!sectionContent) {
            const patterns = [
              // Pattern 1: Exact match
              new RegExp(`^##\\s+${escapedLabel}\\s*$\\n([\\s\\S]*?)(?=\\n##|$)`, 'm'),
              // Pattern 2: Case-insensitive match
              new RegExp(`^##\\s+${escapedLabel}\\s*$\\n([\\s\\S]*?)(?=\\n##|$)`, 'mi'),
            ];
            
            for (const pattern of patterns) {
              const match = validatedData.editedContent.match(pattern);
              if (match && match[1]) {
                sectionContent = match[1].trim();
                if (sectionContent) break;
              }
            }
          }
          
          if (sectionContent) {
            // Preserve the original formatting of the custom section
            summaryParts.push(`## ${customSectionLabel}\n${sectionContent}`);
            console.log(`[regenerate-summary] Preserved custom section "${customSectionLabel}" from edited content (${sectionContent.length} chars)`);
          } else {
            console.log(`[regenerate-summary] Could not find custom section "${customSectionLabel}" in edited content`);
            // If not found in edited content, try to get from AI response (though unlikely for custom sections)
            const summaryAny = summary as any;
            const camelCaseName = customSectionLabel
              .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
              .replace(/\s/g, '')
              .replace(/^(.)/, (_, c) => c.toLowerCase());
            
            if (summaryAny[camelCaseName]) {
              const customSectionData = summaryAny[camelCaseName];
              if (Array.isArray(customSectionData) && customSectionData.length > 0) {
                summaryParts.push(`## ${customSectionLabel}\n${customSectionData.map((item: string) => `- ${item}`).join('\n')}`);
              } else if (typeof customSectionData === 'string' && customSectionData.trim()) {
                summaryParts.push(`## ${customSectionLabel}\n${customSectionData.trim()}`);
              }
            }
          }
        });
      } else {
        // When not regenerating from edited summary, try to get from AI response
        const summaryAny = summary as any;
        storedCustomSections.forEach((customSectionLabel) => {
          const camelCaseName = customSectionLabel
            .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
            .replace(/\s/g, '')
            .replace(/^(.)/, (_, c) => c.toLowerCase());
          
          if (summaryAny[camelCaseName]) {
            const customSectionData = summaryAny[camelCaseName];
            if (Array.isArray(customSectionData) && customSectionData.length > 0) {
              summaryParts.push(`## ${customSectionLabel}\n${customSectionData.map((item: string) => `- ${item}`).join('\n')}`);
            } else if (typeof customSectionData === 'string' && customSectionData.trim()) {
              summaryParts.push(`## ${customSectionLabel}\n${customSectionData.trim()}`);
            }
          }
        });
      }
    }

    // If regenerating from edited summary, preserve the original order of sections
    let finalSummaryParts = summaryParts;
    if (isFromSummary && detectedSections.length > 0) {
      // Reorder summaryParts to match the order in edited summary
      const orderedParts: string[] = [];
      const partsMap = new Map<string, string>();
      
      // Create a map of section title to content
      summaryParts.forEach(part => {
        const match = part.match(/^##\s+(.+)$/m);
        if (match) {
          partsMap.set(match[1].trim(), part);
        }
      });
      
      // Add sections in the order they appeared in edited summary
      detectedSections.forEach(sectionTitle => {
        const part = partsMap.get(sectionTitle);
        if (part) {
          orderedParts.push(part);
          partsMap.delete(sectionTitle); // Remove to avoid duplicates
        }
      });
      
      // Add any remaining parts that weren't in the original order
      partsMap.forEach(part => orderedParts.push(part));
      
      finalSummaryParts = orderedParts.length > 0 ? orderedParts : summaryParts;
      console.log(`[regenerate-summary] Reordered sections. Original: ${summaryParts.length}, Final: ${finalSummaryParts.length}`);
    }
    
    const aiSummaryText = finalSummaryParts.join('\n\n').trim();

    // Ensure we have at least some content
    if (!aiSummaryText) {
      return NextResponse.json(
        { error: 'No summary content generated. Please ensure at least one section is enabled.' },
        { status: 400 }
      );
    }
    
    console.log(`[regenerate-summary] Final summary has ${finalSummaryParts.length} sections, ${aiSummaryText.length} chars`);

    // Extract action items from the source text
    let actionItems: any[] = [];
    try {
      actionItems = await extractActionItems(
        sourceText,
        participantNames
      );
      
      // Ensure actionItems is an array
      if (!Array.isArray(actionItems)) {
        console.warn('extractActionItems did not return an array:', actionItems);
        actionItems = [];
      }
    } catch (actionItemsError) {
      console.error('Error extracting action items (non-fatal):', actionItemsError);
      // Continue without action items - this is not critical
      actionItems = [];
    }

    // Update the interaction - also update sections if they were detected from edited summary
    let updatedInteraction;
    try {
      const updateData: any = {
        aiSummary: aiSummaryText,
        aiActionItems: actionItems as any,
      };
      
      // If we detected new sections from the edited summary, update them
      if (sectionsFromEditedSummary) {
        updateData.summarySections = storedSections;
        updateData.customSections = storedCustomSections.length > 0 ? storedCustomSections : null;
        updateData.sectionLabels = Object.keys(storedSectionLabels).length > 0 ? storedSectionLabels : null;
      }
      
      updatedInteraction = await prisma.interaction.update({
        where: { id },
        data: updateData,
      });
    } catch (updateError) {
      console.error('Error updating interaction:', updateError);
      throw new Error(`Failed to update interaction: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
    }

    // Delete old tasks linked to this interaction
    try {
      await prisma.task.deleteMany({
        where: { interactionId: id },
      });
    } catch (deleteError) {
      console.error('Error deleting old tasks (non-fatal):', deleteError);
      // Continue - this is not critical
    }

    // Create new tasks from action items
    const tasks = [];
    if (actionItems.length > 0) {
      try {
        const createdTasks = await Promise.all(
          actionItems.map((item) =>
            prisma.task.create({
              data: {
                caseId: interaction.caseId,
                interactionId: id,
                description: item.description || 'Task',
                dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
                // assignedToParticipantId is optional - leave as null if no participant is specified
                assignedToParticipantId: null,
              },
            })
          )
        );
        tasks.push(...createdTasks);
      } catch (taskError) {
        console.error('Error creating tasks (non-fatal):', taskError);
        // Continue without tasks - this is not critical
      }
    }

    return NextResponse.json({
      interaction: updatedInteraction,
      tasks,
    });
  } catch (error) {
    console.error(`[regenerate-summary] Error for interaction ${interactionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`[regenerate-summary] Error message:`, errorMessage);
    if (errorStack) {
      console.error(`[regenerate-summary] Error stack:`, errorStack);
    }
    
    if (error instanceof z.ZodError) {
      console.error(`[regenerate-summary] Zod validation error:`, error.issues);
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    // Return detailed error in development
    const errorResponse: any = { 
      error: 'Failed to regenerate summary',
      message: errorMessage,
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = errorMessage;
      errorResponse.stack = errorStack;
      errorResponse.interactionId = interactionId;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

