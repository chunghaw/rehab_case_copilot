import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Plus,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

async function getDashboardStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const [casesRes, tasksRes] = await Promise.all([
      fetch(`${baseUrl}/api/cases`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/tasks`, { cache: 'no-store' }),
    ]);

    const { cases } = await casesRes.json();
    const { tasks } = await tasksRes.json();

    const activeCases = cases.filter((c: any) => c.status === 'ACTIVE').length;
    const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING').length;
    const overdueTasks = tasks.filter((t: any) => t.status === 'OVERDUE').length;

    // Get recent interactions from last 7 days
    const recentActivity = cases
      .slice(0, 5)
      .map((c: any) => ({
        caseId: c.id,
        workerName: c.workerName,
        lastUpdate: c.updatedAt,
      }));

    return {
      totalCases: cases.length,
      activeCases,
      onHoldCases: cases.filter((c: any) => c.status === 'ON_HOLD').length,
      closedCases: cases.filter((c: any) => c.status === 'CLOSED').length,
      totalTasks: tasks.length,
      pendingTasks,
      overdueTasks,
      recentActivity,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      totalCases: 0,
      activeCases: 0,
      onHoldCases: 0,
      closedCases: 0,
      totalTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      recentActivity: [],
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your rehabilitation cases.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Link href="/cases">
          <Button variant="outline" className="w-full h-24 flex flex-col gap-2" size="lg">
            <FolderOpen className="h-6 w-6" />
            <span>View Cases</span>
          </Button>
        </Link>
        
        <Link href="/cases">
          <Button variant="outline" className="w-full h-24 flex flex-col gap-2" size="lg">
            <Plus className="h-6 w-6" />
            <span>New Case</span>
          </Button>
        </Link>

        <Link href="/cases">
          <Button variant="outline" className="w-full h-24 flex flex-col gap-2" size="lg">
            <Calendar className="h-6 w-6" />
            <span>Calendar</span>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </Button>
        </Link>

        <Link href="/cases">
          <Button variant="outline" className="w-full h-24 flex flex-col gap-2" size="lg">
            <FileText className="h-6 w-6" />
            <span>Reports</span>
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Active Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.onHoldCases > 0 && `${stats.onHoldCases} on hold`}
            </p>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            {stats.overdueTasks > 0 && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.overdueTasks} overdue
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.closedCases} closed
            </p>
          </CardContent>
        </Card>

        {/* All Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across all cases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Recently updated cases</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity. Create your first case to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity: any) => (
                <Link 
                  key={activity.caseId} 
                  href={`/cases/${activity.caseId}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.workerName}</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated {new Date(activity.lastUpdate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View →
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      {stats.totalCases === 0 && (
        <Card className="mt-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Create your first case by clicking "New Case" above</li>
              <li>Add interactions (text or audio) to document case progress</li>
              <li>Track tasks automatically extracted from interactions</li>
              <li>Generate professional reports with AI assistance</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
