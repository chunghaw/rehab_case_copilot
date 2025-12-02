'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, FileText, Check, AlertTriangle, Sparkles, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReportEditorProps {
  report: {
    id: string;
    title: string;
    contentDraft: string;
    type: string;
    createdAt: Date;
  };
  onReportSaved?: () => void;
  onReportDeleted?: () => void;
}

export function ReportEditor({ report, onReportSaved, onReportDeleted }: ReportEditorProps) {
  const [content, setContent] = useState(report.contentDraft);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentDraft: content }),
      });

      if (!response.ok) throw new Error('Failed to save report');

      if (onReportSaved) {
        onReportSaved();
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete report');

      setDeleteDialogOpen(false);
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

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {report.type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="px-6 py-4 bg-yellow-500/10 border-b border-yellow-200/50 flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20 shrink-0">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-yellow-800">Draft Report - Review Required</p>
          <p className="text-sm text-yellow-700 mt-0.5">
            This is an AI-generated draft. Please review and edit before sending to any external party.
          </p>
        </div>
      </div>

      {/* Editor */}
      <div className="p-6">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="font-mono text-sm resize-none bg-muted/30 border-border/60 focus:border-primary"
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{charCount.toLocaleString()} characters</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI Generated
          </span>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

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
              onClick={() => setDeleteDialogOpen(false)}
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
    </div>
  );
}
