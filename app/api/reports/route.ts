import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { generateReport } from '@/lib/prompts/generate';
import { format } from 'date-fns';

const generateReportSchema = z.object({
  caseId: z.string(),
  reportType: z.enum([
    'PROGRESS_REPORT',
    'RTW_PLAN',
    'CASE_CONFERENCE',
    'INITIAL_NEEDS_ASSESSMENT',
    'CLOSURE',
  ]),
  interactionIds: z.array(z.string()).optional(),
  controls: z.object({
    tone: z.enum(['neutral', 'supportive', 'assertive']).default('neutral'),
    length: z.enum(['short', 'standard', 'extended']).default('standard'),
    audience: z
      .enum(['insurer-focused', 'employer-focused', 'worker-friendly', 'mixed'])
      .default('mixed'),
  }),
});

// ============================================================================
// POST /api/reports - Generate a new report
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateReportSchema.parse(body);

    // Fetch case details
    const caseData = await prisma.case.findUnique({
      where: { id: validatedData.caseId },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch interactions (either specified ones or recent ones)
    let interactions;
    if (validatedData.interactionIds && validatedData.interactionIds.length > 0) {
      interactions = await prisma.interaction.findMany({
        where: {
          id: { in: validatedData.interactionIds },
          caseId: validatedData.caseId,
        },
        orderBy: { dateTime: 'desc' },
      });
    } else {
      // Default: fetch interactions from last 6 weeks
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

      interactions = await prisma.interaction.findMany({
        where: {
          caseId: validatedData.caseId,
          dateTime: { gte: sixWeeksAgo },
        },
        orderBy: { dateTime: 'desc' },
        take: 20, // Limit to prevent token overflow
      });
    }

    // Prepare case context for report generation
    const caseContext = {
      workerName: caseData.workerName,
      claimNumber: caseData.claimNumber,
      insurerName: caseData.insurerName,
      employerName: caseData.employerName,
      keyContacts: caseData.keyContacts as any,
      currentCapacitySummary: caseData.currentCapacitySummary || undefined,
    };

    // Prepare interaction data
    const interactionData = interactions.map((i) => ({
      dateTime: format(i.dateTime, 'dd/MM/yyyy HH:mm'),
      type: i.type,
      aiSummary: i.aiSummary || undefined,
      participants: i.participants,
    }));

    // Generate the report
    const reportContent = await generateReport(
      validatedData.reportType,
      caseContext,
      interactionData,
      validatedData.controls
    );

    // Save the report
    const report = await prisma.report.create({
      data: {
        caseId: validatedData.caseId,
        type: validatedData.reportType,
        title: `${validatedData.reportType.replace(/_/g, ' ')} - ${format(
          new Date(),
          'dd/MM/yyyy'
        )}`,
        contentDraft: reportContent,
        generatedFromInteractions: interactions.map((i) => i.id),
        generationControls: validatedData.controls,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

// ============================================================================
// GET /api/reports - List reports for a case
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    const reports = await prisma.report.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

