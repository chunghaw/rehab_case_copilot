import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, CheckSquare, Calendar, TrendingUp } from 'lucide-react';

async function getDashboardStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Fetch active cases
  const casesRes = await fetch(`${baseUrl}/api/cases?status=ACTIVE`, {
    cache: 'no-store',
  });
  const casesData = await casesRes.json();
  const cases = casesData.cases || [];
  
  // Fetch all tasks
  const tasksRes = await fetch(`${baseUrl}/api/tasks`, {
    cache: 'no-store',
  });
  const tasksData = await tasksRes.json();
  const tasks = tasksData.tasks || [];
  
  const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING').length;
  const overdueTasks = tasks.filter((t: any) => t.status === 'OVERDUE').length;
  
  // Count total interactions
  const totalInteractions = cases.reduce((sum: number, c: any) => sum + (c._count?.interactions || 0), 0);
  
  // Find upcoming key dates
  const upcomingKeyDates = cases
    .filter((c: any) => c.nextKeyDate)
    .map((c: any) => ({
      caseId: c.id,
      workerName: c.workerName,
      nextKeyDate: new Date(c.nextKeyDate),
    }))
    .sort((a: any, b: any) => a.nextKeyDate - b.nextKeyDate)
    .slice(0, 3);
  
  return {
    activeCases: cases.length,
    pendingTasks,
    overdueTasks,
    totalInteractions,
    upcomingKeyDates,
    recentCases: cases.slice(0, 5),
  };
}

function StatsCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </CardHeader>
    </Card>
  );
}

async function DashboardStats() {
  const stats = await getDashboardStats();
  
  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cases
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently managed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.pendingTasks}
              {stats.overdueTasks > 0 && (
                <span className="text-lg text-red-600 ml-2">
                  ({stats.overdueTasks} overdue)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Action items to complete
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalInteractions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Key Dates
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.upcomingKeyDates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cases requiring attention
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/cases">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Plus className="h-6 w-6" />
                <div className="text-sm font-semibold">New Case</div>
                <div className="text-xs text-muted-foreground">Start managing a new worker</div>
              </Button>
            </Link>
            
            <Link href="/cases">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <FolderOpen className="h-6 w-6" />
                <div className="text-sm font-semibold">View All Cases</div>
                <div className="text-xs text-muted-foreground">Browse active cases</div>
              </Button>
            </Link>
            
            <Link href="/cases">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <CheckSquare className="h-6 w-6" />
                <div className="text-sm font-semibold">My Tasks</div>
                <div className="text-xs text-muted-foreground">{stats.pendingTasks} pending</div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Cases */}
      {stats.recentCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Your most recently updated cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentCases.map((caseItem: any) => (
                <Link 
                  key={caseItem.id} 
                  href={`/cases/${caseItem.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{caseItem.workerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {caseItem.claimNumber} • {caseItem.insurerName}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {caseItem._count?.interactions || 0} interactions
                  </div>
                </Link>
              ))}
            </div>
            
            <Link href="/cases">
              <Button variant="ghost" className="w-full mt-4">
                View All Cases →
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      {/* Upcoming Key Dates */}
      {stats.upcomingKeyDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Key Dates</CardTitle>
            <CardDescription>Cases requiring attention soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingKeyDates.map((item: any) => (
                <Link
                  key={item.caseId}
                  href={`/cases/${item.caseId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{item.workerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.nextKeyDate.toLocaleDateString('en-AU', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your active cases and tasks.
        </p>
      </div>
      
      {/* Main Content */}
      <div className="space-y-6">
        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        }>
          <DashboardStats />
        </Suspense>
      </div>
    </div>
  );
}
