import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'DONE', 'OVERDUE']).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

// GET /api/tasks - List tasks (filter by case or status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const status = searchParams.get('status');

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            workerName: true,
            claimNumber: true,
          },
        },
        interaction: {
          select: {
            id: true,
            type: true,
            dateTime: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// PATCH /api/tasks - Update task status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const { id, ...updateFields } = validatedData;

    const updateData: any = { ...updateFields };
    if (updateFields.dueDate !== undefined) {
      updateData.dueDate = updateFields.dueDate ? new Date(updateFields.dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
