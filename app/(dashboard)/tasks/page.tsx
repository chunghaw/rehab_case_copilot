import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { TaskActions } from '@/components/tasks/task-actions';

interface Task {
  id: string;
  description: string;
  dueDate: string | null;
  status: 'PENDING' | 'DONE' | 'OVERDUE';
  assignedTo: string;
  caseId: string;
  case: {
    workerName: string;
    claimNumber: string;
  };
  createdAt: string;
}

async function getTasks() {
  const baseUrl = process.env.VERCEL_URL 
    ? \`https://\${process.env.VERCEL_URL}\` 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const res = await fetch(\`\${baseUrl}/api/tasks\`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return { tasks: [] };
  }

  return res.json();
}

function getTaskPriority(task: Task): 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'no-date' {
  if (!task.dueDate) return 'no-date';
  const dueDate = new Date(task.dueDate);
  if (isPast(dueDate) && !isToday(dueDate)) return 'overdue';
  if (isToday(dueDate)) return 'today';
  if (isTomorrow(dueDate)) return 'tomorrow';
  return 'upcoming';
}

function getPriorityStyles(priority: string) {
  switch (priority) {
    case 'overdue':
      return 'border-l-red-500 bg-red-50/50';
    case 'today':
      return 'border-l-orange-500 bg-orange-50/50';
    case 'tomorrow':
      return 'border-l-yellow-500 bg-yellow-50/50';
    case 'upcoming':
      return 'border-l-blue-500';
    default:
      return 'border-l-gray-300';
  }
}

export default async function TasksPage() {
  const { tasks } = await getTasks();

  const pendingTasks = tasks.filter((t: Task) => t.status === 'PENDING');
  const completedTasks = tasks.filter((t: Task) => t.status === 'DONE');

  const overdueTasks = pendingTasks.filter((t: Task) => getTaskPriority(t) === 'overdue');
  const todayTasks = pendingTasks.filter((t: Task) => getTaskPriority(t) === 'today');
  const upcomingTasks = pendingTasks.filter((t: Task) => ['tomorrow', 'upcoming'].includes(getTaskPriority(t)));
  const noDateTasks = pendingTasks.filter((t: Task) => getTaskPriority(t) === 'no-date');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">
          Manage and track all your case-related tasks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
          </CardContent>
        </Card>

        <Card className={overdueTasks.length > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className={\`h-4 w-4 \${overdueTasks.length > 0 ? 'text-red-500' : 'text-muted-foreground'}\`} />
          </CardHeader>
          <CardContent>
            <div className={\`text-2xl font-bold \${overdueTasks.length > 0 ? 'text-red-600' : ''}\`}>
              {overdueTasks.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {overdueTasks.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Overdue ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList tasks={overdueTasks} />
            </CardContent>
          </Card>
        )}

        {todayTasks.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Clock className="h-5 w-5" />
                Due Today ({todayTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList tasks={todayTasks} />
            </CardContent>
          </Card>
        )}

        {upcomingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming ({upcomingTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList tasks={upcomingTasks} />
            </CardContent>
          </Card>
        )}

        {noDateTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <CheckSquare className="h-5 w-5" />
                No Due Date ({noDateTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList tasks={noDateTasks} />
            </CardContent>
          </Card>
        )}

        {completedTasks.length > 0 && (
          <Card className="opacity-75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckSquare className="h-5 w-5" />
                Completed ({completedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList tasks={completedTasks} showCompleted />
            </CardContent>
          </Card>
        )}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-4">
                Tasks are automatically created when you add interactions to cases.
              </p>
              <Link href="/cases">
                <Button>View Cases</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TaskList({ tasks, showCompleted = false }: { tasks: Task[], showCompleted?: boolean }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const priority = getTaskPriority(task);
        return (
          <div 
            key={task.id} 
            className={\`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-card hover:bg-accent/50 transition-colors \${getPriorityStyles(priority)}\`}
          >
            <TaskActions taskId={task.id} currentStatus={task.status} />
            <div className="flex-1 min-w-0">
              <p className={\`font-medium \${showCompleted ? 'line-through text-muted-foreground' : ''}\`}>
                {task.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                <Link 
                  href={\`/cases/\${task.caseId}\`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <FolderOpen className="h-3 w-3" />
                  {task.case.workerName}
                </Link>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assignedTo}
                </span>
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.dueDate), 'dd MMM yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
