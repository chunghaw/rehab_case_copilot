'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import { CalendarClock, CheckCircle2 } from 'lucide-react';

interface Task {
  id: string;
  description: string;
  dueDate?: Date | null;
  status: 'PENDING' | 'DONE' | 'OVERDUE';
  assignedTo: string;
}

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, status: string) => void;
}

export function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const handleToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
    onTaskUpdate(taskId, newStatus);
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
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No tasks yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Tasks
          {pendingTasks.length > 0 && (
            <Badge variant="secondary">{pendingTasks.length} pending</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Tasks */}
        <div className="space-y-2">
          {pendingTasks.map((task) => {
            const status = getTaskStatus(task);
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  status === 'OVERDUE' ? 'border-red-300 bg-red-50' : 'bg-muted/30'
                }`}
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => handleToggle(task.id, task.status)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{task.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <span
                        className={
                          status === 'OVERDUE' ? 'text-red-600 font-medium' : ''
                        }
                      >
                        Due: {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                      </span>
                    )}
                    {task.assignedTo && <span>· {task.assignedTo}</span>}
                  </div>
                </div>
                {status === 'OVERDUE' && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedTasks.length})
            </div>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => handleToggle(task.id, task.status)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm line-through text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

