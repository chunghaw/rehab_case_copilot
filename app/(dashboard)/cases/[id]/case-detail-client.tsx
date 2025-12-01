'use client';

import { useEffect, useState } from 'react';
import { CaseOverview } from '@/components/cases/case-overview';
import { InteractionTimeline } from '@/components/interactions/interaction-timeline';
import { AddInteractionDialog } from '@/components/interactions/add-interaction-dialog';
import { TaskList } from '@/components/tasks/task-list';
import { ReportGenerator } from '@/components/reports/report-generator';
import { ReportEditor } from '@/components/reports/report-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CaseDetailClientProps {
  caseId: string;
}

export function CaseDetailClient({ caseId }: CaseDetailClientProps) {
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const fetchCaseData = async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}`);
      if (!response.ok) throw new Error('Failed to fetch case');
      const data = await response.json();
      setCaseData(data.case);
    } catch (error) {
      console.error('Error fetching case:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [caseId]);

  const handleTaskUpdate = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      // Refresh case data
      fetchCaseData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleReportGenerated = (report: any) => {
    setGeneratedReport(report);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Case not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/cases">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Case Overview */}
        <div className="lg:col-span-1 space-y-6">
          <CaseOverview caseData={caseData} />
          <TaskList tasks={caseData.tasks || []} onTaskUpdate={handleTaskUpdate} />
        </div>

        {/* Main Column - Interactions Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Interaction Timeline</h2>
            <div className="flex gap-2">
              <ReportGenerator
                caseId={caseId}
              interactions={caseData.interactions || []}
                onReportGenerated={handleReportGenerated}
              />
              <AddInteractionDialog
                caseId={caseId}
              interactions={caseData.interactions || []}
                onInteractionAdded={fetchCaseData}
              />
            </div>
          </div>

          <InteractionTimeline interactions={caseData.interactions || []} />

          {/* Show generated report */}
          {generatedReport && (
            <div className="mt-6">
              <ReportEditor report={generatedReport} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

