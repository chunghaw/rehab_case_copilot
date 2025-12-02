import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createTaskSchema = z.object({
  caseId: z.string(),
  description: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  assignedToParticipantId: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
});

const updateTaskSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'DONE', 'OVERDUE']).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  assignedToParticipantId: z.string().optional().nullable(),
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
        assignedToParticipant: true,
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Combine description and details if details exist
    const fullDescription = validatedData.details
      ? `${validatedData.description}\n\nDetails:\n${validatedData.details}`
      : validatedData.description;

    const task = await prisma.task.create({
      data: {
        caseId: validatedData.caseId,
        description: fullDescription,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assignedToParticipantId: validatedData.assignedToParticipantId || null,
      },
      include: {
        assignedToParticipant: true,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
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
    if (updateFields.assignedToParticipantId !== undefined) {
      updateData.assignedToParticipantId = updateFields.assignedToParticipantId || null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedToParticipant: true,
      },
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

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
