import { CaseList } from '@/components/cases/case-list';
import { CaseForm } from '@/components/cases/case-form';
import { Suspense } from 'react';
import { FolderOpen, Plus, Search } from 'lucide-react';

async function getCases() {
  // Use absolute URL for server-side fetch
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const res = await fetch(`${baseUrl}/api/cases`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch cases');
  }

  return res.json();
}

function CaseListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted"></div>
              <div>
                <div className="h-5 bg-muted rounded w-32 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-muted rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CasesPage() {
  const { cases } = await getCases();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Manage</p>
              <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Cases
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <CaseForm />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {cases.length === 0 ? (
          <div className="animate-fade-in-up">
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                No cases yet
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Get started by creating your first rehabilitation case. You'll be able to track interactions, tasks, and generate reports.
              </p>
              <CaseForm />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex items-center gap-6 text-sm animate-fade-in-up">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">
                  {cases.filter((c: any) => c.status === 'ACTIVE').length} Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-muted-foreground">
                  {cases.filter((c: any) => c.status === 'ON_HOLD').length} On Hold
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                <span className="text-muted-foreground">
                  {cases.filter((c: any) => c.status === 'CLOSED').length} Closed
                </span>
              </div>
            </div>

            <Suspense fallback={<CaseListSkeleton />}>
              <CaseList cases={cases} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
