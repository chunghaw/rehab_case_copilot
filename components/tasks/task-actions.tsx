'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface TaskActionsProps {
  taskId: string;
  currentStatus: 'PENDING' | 'DONE' | 'OVERDUE';
}

export function TaskActions({ taskId, currentStatus }: TaskActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      if (res.ok) {
        toast.success(newStatus === 'DONE' ? 'Task completed!' : 'Task reopened');
        router.refresh();
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Checkbox
      checked={currentStatus === 'DONE'}
      onCheckedChange={handleToggle}
      disabled={isLoading}
      className="mt-1"
    />
  );
}
