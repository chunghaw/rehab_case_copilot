'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';

interface ReportGeneratorProps {
  caseId: string;
  onReportGenerated: (report: any) => void;
}

export function ReportGenerator({ caseId, onReportGenerated }: ReportGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reportType: 'PROGRESS_REPORT',
    tone: 'neutral',
    length: 'standard',
    audience: 'mixed',
  });

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          reportType: formData.reportType,
          controls: {
            tone: formData.tone,
            length: formData.length,
            audience: formData.audience,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const { report } = await response.json();
      setOpen(false);
      onReportGenerated(report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Create an AI-generated report based on case interactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) =>
                setFormData({ ...formData, reportType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROGRESS_REPORT">Progress Report</SelectItem>
                <SelectItem value="RTW_PLAN">RTW Plan</SelectItem>
                <SelectItem value="CASE_CONFERENCE">Case Conference Minutes</SelectItem>
                <SelectItem value="INITIAL_NEEDS_ASSESSMENT">
                  Initial Needs Assessment
                </SelectItem>
                <SelectItem value="CLOSURE">Closure Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select
              value={formData.tone}
              onValueChange={(value) => setFormData({ ...formData, tone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral (Professional standard)</SelectItem>
                <SelectItem value="supportive">
                  Supportive (Emphasize wellbeing)
                </SelectItem>
                <SelectItem value="assertive">
                  Assertive (Clear expectations)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Length</Label>
            <Select
              value={formData.length}
              onValueChange={(value) => setFormData({ ...formData, length: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (1-2 pages)</SelectItem>
                <SelectItem value="standard">Standard (2-4 pages)</SelectItem>
                <SelectItem value="extended">Extended (4+ pages)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Audience</Label>
            <Select
              value={formData.audience}
              onValueChange={(value) => setFormData({ ...formData, audience: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed (All stakeholders)</SelectItem>
                <SelectItem value="insurer-focused">Insurer-focused</SelectItem>
                <SelectItem value="employer-focused">Employer-focused</SelectItem>
                <SelectItem value="worker-friendly">Worker-friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
            This will use AI to generate a draft report based on recent case interactions.
            Review and edit before sending to any external party.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

