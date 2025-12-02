'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Calendar, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReportEditor } from './report-editor';

interface Report {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  contentDraft: string;
}

interface ReportListProps {
  reports: Report[];
  onReportDeleted?: () => void;
}

export function ReportList({ reports, onReportDeleted }: ReportListProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!reportToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/reports/${reportToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete report');

      setDeleteDialogOpen(false);
      setReportToDelete(null);
      if (selectedReport?.id === reportToDelete) {
        setSelectedReport(null);
      }
      if (onReportDeleted) {
        onReportDeleted();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg mb-1" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
          No reports yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate your first report using the button above
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
        <div className="p-5 border-b border-border/60">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            <FileText className="h-5 w-5 text-muted-foreground" />
            Reports ({reports.length})
          </h3>
        </div>
        <div className="divide-y divide-border/60">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {report.title}
                    </h4>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {getTypeLabel(report.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(report.createdAt), 'dd MMM yyyy · h:mm a')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReportToDelete(report.id);
                      setDeleteDialogOpen(true);
                    }}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Viewer Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <ReportEditor
              report={selectedReport}
              onReportSaved={() => {
                if (onReportDeleted) onReportDeleted();
              }}
              onReportDeleted={() => {
                setSelectedReport(null);
                if (onReportDeleted) onReportDeleted();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setReportToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

