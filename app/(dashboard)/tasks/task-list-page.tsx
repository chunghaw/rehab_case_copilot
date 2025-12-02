'use client';

import { useEffect, useState } from 'react';
import { TaskList } from '@/components/tasks/task-list';
import { TaskFormWithCaseSelect } from '@/components/tasks/task-form-with-case-select';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, CalendarClock, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  description: string;
  dueDate?: Date | null;
  status: string;
  assignedToParticipant?: {
    id: string;
    role: string;
    name: string;
  } | null;
  case: {
    id: string;
    workerName: string;
    claimNumber: string;
  };
}

export function TaskListPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCase, setFilterCase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const handleTaskUpdate = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status }),
      });

      if (!response.ok) throw new Error('Failed to update task');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Get unique cases for filter
  const cases = Array.from(
    new Map(tasks.map((task) => [task.case.id, task.case])).values()
  );

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterCase !== 'all' && task.case.id !== filterCase) return false;
    if (searchQuery && !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group tasks by case
  const tasksByCase = filteredTasks.reduce((acc, task) => {
    const caseId = task.case.id;
    if (!acc[caseId]) {
      acc[caseId] = {
        case: task.case,
        tasks: [],
      };
    }
    acc[caseId].tasks.push(task);
    return acc;
  }, {} as Record<string, { case: Task['case']; tasks: Task[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                All Tasks
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage tasks across all cases
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TaskFormWithCaseSelect onTaskSaved={fetchTasks} />
              <Link href="/cases">
                <Button variant="outline">View Cases</Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCase} onValueChange={setFilterCase}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Cases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  {cases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.workerName} - {caseItem.claimNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {Object.keys(tasksByCase).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              No tasks found
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterCase !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Tasks will appear here when created'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(tasksByCase).map(({ case: caseItem, tasks: caseTasks }) => (
              <div key={caseItem.id} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href={`/cases/${caseItem.id}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {caseItem.workerName} - Claim #{caseItem.claimNumber}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    ({caseTasks.length} task{caseTasks.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <TaskList
                  tasks={caseTasks}
                  caseId={caseItem.id}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskSaved={fetchTasks}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

