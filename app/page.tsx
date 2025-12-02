import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, CheckSquare, Calendar, TrendingUp, ArrowRight, Clock, AlertCircle } from 'lucide-react';

async function getDashboardStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
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
  } catch (error) {
    return {
      activeCases: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      totalInteractions: 0,
      upcomingKeyDates: [],
      recentCases: [],
    };
  }
}

function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft animate-pulse">
      <div className="h-4 bg-muted rounded w-24 mb-3"></div>
      <div className="h-8 bg-muted rounded w-16 mb-2"></div>
      <div className="h-3 bg-muted rounded w-32"></div>
    </div>
  );
}

async function DashboardStats() {
  const stats = await getDashboardStats();
  
  const statCards = [
    {
      title: 'Active Cases',
      value: stats.activeCases,
      subtitle: 'Currently managed',
      icon: FolderOpen,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      subtitle: stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : 'Action items',
      icon: CheckSquare,
      color: stats.overdueTasks > 0 ? 'text-destructive' : 'text-chart-2',
      bgColor: stats.overdueTasks > 0 ? 'bg-destructive/10' : 'bg-chart-2/10',
      alert: stats.overdueTasks > 0,
    },
    {
      title: 'Interactions',
      value: stats.totalInteractions,
      subtitle: 'This month',
      icon: TrendingUp,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: 'Key Dates',
      value: stats.upcomingKeyDates.length,
      subtitle: 'Upcoming',
      icon: Calendar,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ];
  
  return (
    <>
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="group rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover-lift animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`rounded-xl ${stat.bgColor} p-2.5`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              {stat.alert && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Needs attention
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-xl mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/cases" className="group">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover-lift transition-smooth h-full">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">New Case</p>
                  <p className="text-sm text-muted-foreground">Start managing a new worker</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
            </div>
          </Link>
          
          <Link href="/cases" className="group">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover-lift transition-smooth h-full">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-chart-2/10 p-3">
                  <FolderOpen className="h-6 w-6 text-chart-2" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">View Cases</p>
                  <p className="text-sm text-muted-foreground">Browse all active cases</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
            </div>
          </Link>
          
          <Link href="/cases" className="group">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover-lift transition-smooth h-full">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-chart-3/10 p-3">
                  <CheckSquare className="h-6 w-6 text-chart-3" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">My Tasks</p>
                  <p className="text-sm text-muted-foreground">{stats.pendingTasks} pending items</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Cases */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Recent Cases</h2>
            <Link href="/cases">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
            {stats.recentCases.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FolderOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No cases yet</p>
                <Link href="/cases">
                  <Button size="sm" className="mt-4">
                    Create your first case
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {stats.recentCases.map((caseItem: any, index: number) => (
                  <Link 
                    key={caseItem.id} 
                    href={`/cases/${caseItem.id}`}
                    className="flex items-center justify-between p-4 hover:bg-accent/50 transition-smooth group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <span className="text-sm font-semibold text-primary">
                          {caseItem.workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{caseItem.workerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.claimNumber} · {caseItem.insurerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {caseItem._count?.interactions || 0} interactions
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Key Dates */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Upcoming Key Dates</h2>
          </div>
          
          <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
            {stats.upcomingKeyDates.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No upcoming dates</p>
                <p className="text-xs text-muted-foreground mt-1">Key dates will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {stats.upcomingKeyDates.map((item: any) => {
                  const dateStr = item.nextKeyDate.toISOString().split('T')[0];
                  return (
                    <Link
                      key={item.caseId}
                      href={`/calendar?date=${dateStr}`}
                      className="flex items-center justify-between p-4 hover:bg-accent/50 transition-smooth group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10">
                          <Calendar className="h-5 w-5 text-chart-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.workerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.nextKeyDate.toLocaleDateString('en-AU', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  // Get current time greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{greeting}</p>
              <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date().toLocaleDateString('en-AU', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        <Suspense fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
