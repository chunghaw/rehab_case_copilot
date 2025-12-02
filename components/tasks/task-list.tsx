'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, isPast } from 'date-fns';
import { CalendarClock, CheckCircle2, AlertTriangle, Clock, Trash2, Pencil } from 'lucide-react';
import { TaskForm } from './task-form';
import { useState } from 'react';

interface Task {
  id: string;
  description: string;
  dueDate?: Date | null;
  status: 'PENDING' | 'DONE' | 'OVERDUE';
  assignedToParticipant?: {
    id: string;
    role: string;
    name: string;
  } | null;
}

interface TaskListProps {
  tasks: Task[];
  caseId: string;
  onTaskUpdate: (taskId: string, status: string) => void;
  onTaskSaved?: () => void;
}

export function TaskList({ tasks, caseId, onTaskUpdate, onTaskSaved }: TaskListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const handleToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
    onTaskUpdate(taskId, newStatus);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/tasks?id=${taskToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      if (onTaskSaved) {
        onTaskSaved();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskSaved = () => {
    if (onTaskSaved) {
      onTaskSaved();
    }
  };

  const getTaskStatus = (task: Task) => {
    if (task.status === 'DONE') return 'DONE';
    if (task.dueDate && isPast(new Date(task.dueDate))) return 'OVERDUE';
    return 'PENDING';
  };

  const pendingTasks = tasks.filter((t) => getTaskStatus(t) !== 'DONE');
  const completedTasks = tasks.filter((t) => getTaskStatus(t) === 'DONE');

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <CalendarClock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
          No tasks yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Tasks will be extracted from interactions
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            Tasks
          </h3>
          <div className="flex items-center gap-2">
            {pendingTasks.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {pendingTasks.length} pending
              </span>
            )}
            <TaskForm caseId={caseId} onTaskSaved={handleTaskSaved} />
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="divide-y divide-border/60">
          {pendingTasks.map((task) => {
            const status = getTaskStatus(task);
            const isOverdue = status === 'OVERDUE';
            
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-4 transition-colors hover:bg-accent/30 ${
                  isOverdue ? 'bg-destructive/5' : ''
                }`}
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => handleToggle(task.id, task.status)}
                  className="mt-0.5 rounded-md"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium leading-snug">{task.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.dueDate), 'dd MMM yyyy')}
                      </span>
                    )}
                    {task.assignedToParticipant && (
                      <span>· {task.assignedToParticipant.role.replace('_', ' ')}: {task.assignedToParticipant.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </span>
                  )}
                  <TaskForm caseId={caseId} task={task} onTaskSaved={handleTaskSaved} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setTaskToDelete(task.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <>
          <div className="px-4 py-3 border-t border-border/60 bg-muted/30">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed ({completedTasks.length})
            </p>
          </div>
          <div className="divide-y divide-border/60">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-4 bg-muted/20"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => handleToggle(task.id, task.status)}
                  className="mt-0.5 rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground line-through">
                    {task.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTaskToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
