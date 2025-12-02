'use client';

import { useEffect, useState } from 'react';
import { CaseOverview } from '@/components/cases/case-overview';
import { InteractionTimeline } from '@/components/interactions/interaction-timeline';
import { AddInteractionDialog } from '@/components/interactions/add-interaction-dialog';
import { MeetingScheduler } from '@/components/calendar/meeting-scheduler';
import { TaskList } from '@/components/tasks/task-list';
import { ReportGenerator } from '@/components/reports/report-generator';
import { ReportEditor } from '@/components/reports/report-editor';
import { ReportList } from '@/components/reports/report-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Clock, MessageSquare, CheckSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CaseDetailClientProps {
  caseId: string;
}

export function CaseDetailClient({ caseId }: CaseDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteCase = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete case');

      // Redirect to cases list
      router.push('/cases');
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Failed to delete case');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Case not found
          </h2>
          <p className="text-muted-foreground mb-4">The case you're looking for doesn't exist.</p>
          <Link href="/cases">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Interactions',
      value: caseData.interactions?.length || 0,
      icon: MessageSquare,
    },
    {
      label: 'Tasks',
      value: caseData.tasks?.length || 0,
      icon: CheckSquare,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/cases">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Cases
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/10">
                <span className="text-lg font-semibold text-primary">
                  {caseData.workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {caseData.workerName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Claim #{caseData.claimNumber} · {caseData.insurerName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ReportGenerator
                caseId={caseId}
                onReportGenerated={handleReportGenerated}
              />
              <AddInteractionDialog
                caseId={caseId}
                onInteractionAdded={fetchCaseData}
              />
              <MeetingScheduler
                caseId={caseId}
                onMeetingScheduled={fetchCaseData}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Case
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/60">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-sm">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{stat.value}</span>
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Case Overview & Tasks */}
          <div className="lg:col-span-1 space-y-6">
            <div className="animate-fade-in-up">
              <CaseOverview caseData={caseData} onStatusChange={fetchCaseData} />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <TaskList 
                tasks={caseData.tasks || []} 
                caseId={caseId}
                onTaskUpdate={handleTaskUpdate}
                onTaskSaved={fetchCaseData}
              />
            </div>
          </div>

          {/* Main Column - Interactions Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Interaction Timeline
                </h2>
              </div>
              <InteractionTimeline 
                interactions={caseData.interactions || []} 
                onInteractionUpdated={fetchCaseData}
                caseId={caseId}
              />
            </div>

            {/* Reports List */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="mb-4">
                <h2 className="text-xl mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Reports
                </h2>
                <ReportList
                  reports={caseData.reports || []}
                  onReportDeleted={fetchCaseData}
                />
              </div>
            </div>

            {/* Show newly generated report */}
            {generatedReport && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <ReportEditor
                  report={generatedReport}
                  onReportSaved={fetchCaseData}
                  onReportDeleted={fetchCaseData}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this case? This action cannot be undone. All interactions, tasks, and reports associated with this case will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm font-medium text-foreground mb-1">
                {caseData?.workerName} - Claim #{caseData?.claimNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                This will delete {caseData?.interactions?.length || 0} interactions,{' '}
                {caseData?.tasks?.length || 0} tasks, and {caseData?.reports?.length || 0} reports.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCase}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Case
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
