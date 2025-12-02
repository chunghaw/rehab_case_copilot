import { NextRequest, NextResponse } from 'next/server';
import { detectMeetings } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      );
    }

    const detectedMeeting = await detectMeetings(transcript);

    return NextResponse.json({ meeting: detectedMeeting });
  } catch (error) {
    console.error('Error detecting meetings:', error);
    return NextResponse.json(
      { error: 'Failed to detect meetings' },
      { status: 500 }
    );
  }
}

