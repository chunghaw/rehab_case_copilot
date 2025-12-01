import { CaseList } from '@/components/cases/case-list';
import { CaseForm } from '@/components/cases/case-form';
import { Suspense } from 'react';

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

export default async function CasesPage() {
  const { cases } = await getCases();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage your active rehabilitation cases
          </p>
        </div>
        <CaseForm />
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No cases yet</h2>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first case
          </p>
          <CaseForm />
        </div>
      ) : (
        <CaseList cases={cases} />
      )}
    </div>
  );
}
