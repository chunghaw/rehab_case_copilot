import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateReportSchema = z.object({
  contentDraft: z.string().optional(),
  title: z.string().optional(),
});

// ============================================================================
// PATCH /api/reports/[id] - Update report content
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    const updatedReport = await prisma.report.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('Error updating report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/reports/[id] - Delete report
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}

