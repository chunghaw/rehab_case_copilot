import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Transcribe audio file using Whisper
// ============================================================================
export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  try {
    // Create a File object from the buffer
    const file = new File([audioBuffer as any], filename, {
      type: filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/m4a',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// ============================================================================
// Summarize interaction and extract structured information
// ============================================================================
export interface InteractionSummary {
  mainIssues: string[];
  currentCapacity: string;
  treatmentAndMedical: string[];
  barriersToRTW: string[];
  agreedActions: string[];
}

export async function summarizeInteraction(
  transcript: string,
  interactionType: string,
  participants: string[]
): Promise<InteractionSummary> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional rehabilitation consultant assistant working within a WorkCover-style scheme (similar to WorkSafe Victoria). 
          
Your role is to analyze meeting transcripts, phone calls, emails, and case notes with the following principles:
- Maintain professional, objective, and non-judgmental tone
- Focus on functional impact and work capacity
- Distinguish between subjective reports and objective findings
- Never invent facts, dates, diagnoses, or names
- Use only information provided in the input
- Clearly indicate when information is missing or unclear

When summarizing interactions, organize information into these categories:
1. Main Issues - key concerns, problems, or topics discussed
2. Current Capacity & Duties - work capacity, restrictions, current duties
3. Treatment & Medical Input - medical opinions, treatment progress, certificates
4. Barriers to RTW - obstacles preventing return to work
5. Agreed Actions - commitments made, next steps, responsibilities`,
        },
        {
          role: 'user',
          content: `Please analyze this ${interactionType} with participants: ${participants.join(', ')}

Transcript/Content:
${transcript}

Provide a structured summary in JSON format with these fields:
{
  "mainIssues": ["array of key issues"],
  "currentCapacity": "summary of current work capacity and restrictions",
  "treatmentAndMedical": ["array of medical/treatment points"],
  "barriersToRTW": ["array of barriers to return to work"],
  "agreedActions": ["array of agreed actions and next steps"]
}

Use "Not discussed" or "Not provided" if information is not available.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error summarizing interaction:', error);
    throw new Error('Failed to summarize interaction');
  }
}

// ============================================================================
// Extract action items from interaction
// ============================================================================
export interface ActionItem {
  description: string;
  owner?: string;
  dueDate?: string;
}

export async function extractActionItems(
  transcript: string,
  participants: string[]
): Promise<ActionItem[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional rehabilitation consultant assistant. Your role is to extract action items, commitments, and follow-up tasks from meeting transcripts and case notes.

For each action item, identify:
- Clear description of what needs to be done
- Who is responsible (if mentioned)
- Due date or timeframe (if mentioned)

Only extract explicit commitments or actions, not general discussion points.`,
        },
        {
          role: 'user',
          content: `Extract all action items from this interaction. Participants: ${participants.join(', ')}

Content:
${transcript}

Return a JSON array of action items:
{
  "actionItems": [
    {
      "description": "task description",
      "owner": "person responsible (optional)",
      "dueDate": "date or timeframe (optional)"
    }
  ]
}

If no action items are found, return an empty array.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.actionItems || [];
  } catch (error) {
    console.error('Error extracting action items:', error);
    return [];
  }
}

