import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transcribeAudio, summarizeInteraction, extractActionItems } from '@/lib/openai';
import { put } from '@vercel/blob';

// ============================================================================
// POST /api/interactions/transcribe - Upload audio, transcribe, and create interaction
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const caseId = formData.get('caseId') as string;
    const type = formData.get('type') as string;
    const participantIdsStr = formData.get('participantIds') as string;
    const dateTimeStr = formData.get('dateTime') as string;

    if (!audioFile || !caseId || !type || !participantIdsStr) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file size (25MB limit for Whisper)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      );
    }

    const participantIds = JSON.parse(participantIdsStr);
    const dateTime = dateTimeStr ? new Date(dateTimeStr) : new Date();

    // Fetch participant details for AI processing
    const participants = await prisma.participant.findMany({
      where: { id: { in: participantIds } },
    });
    const participantNames = participants.map(p => `${p.role.replace('_', ' ')}: ${p.name}`);

    // Upload to Vercel Blob (if token is available)
    let blobUrl: string | undefined;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(audioFile.name, audioFile, {
        access: 'public',
      });
      blobUrl = blob.url;
    }

    // Convert file to buffer for transcription
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe audio
    const transcript = await transcribeAudio(buffer, audioFile.name);

    // Summarize the interaction
    const summary = await summarizeInteraction(transcript, type, participantNames);

    // Extract action items
    const actionItems = await extractActionItems(transcript, participantNames);

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
        caseId,
        type: type as any,
        dateTime,
        participantIds: participantIds,
        rawInputSource: blobUrl || 'audio file (not stored)',
        transcriptText: transcript,
        aiSummary: aiSummaryText,
        aiActionItems: actionItems as any,
      },
    });

    // Create tasks from action items
    const tasks = await Promise.all(
      actionItems.map((item) =>
        prisma.task.create({
          data: {
            caseId,
            interactionId: interaction.id,
            description: item.description,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
            assignedTo: item.owner || 'consultant',
          },
        })
      )
    );

    // Fetch participant details for response
    const interactionParticipants = await prisma.participant.findMany({
      where: { id: { in: interaction.participantIds } },
    });

    return NextResponse.json(
      {
        interaction: {
          ...interaction,
          participants: interactionParticipants,
        },
        tasks,
        summary,
        transcript,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio file' },
      { status: 500 }
    );
  }
}

