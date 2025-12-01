'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Interaction {
  id: string;
  type: string;
  dateTime: Date | string;
  participants: string[];
  aiSummary?: string | null;
}

interface ReportGeneratorProps {
  caseId: string;
  interactions?: Interaction[];
  onReportGenerated: (report: any) => void;
}

const getTypeLabel = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'PHONE_CALL':
      return '📞';
    case 'CASE_CONFERENCE':
      return '🎥';
    case 'IN_PERSON_MEETING':
      return '👥';
    case 'EMAIL':
      return '✉️';
    default:
      return '📝';
  }
};

export function ReportGenerator({ caseId, interactions = [], onReportGenerated }: ReportGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedInteractionIds, setSelectedInteractionIds] = useState<string[]>([]);
  const [extraContext, setExtraContext] = useState('');
  const [formData, setFormData] = useState({
    reportType: 'PROGRESS_REPORT',
    tone: 'neutral',
    length: 'standard',
    audience: 'mixed',
  });

  // Select all interactions by default when dialog opens
  useEffect(() => {
    if (open && interactions.length > 0) {
      setSelectedInteractionIds(interactions.map(i => i.id));
    }
  }, [open, interactions]);

  const handleToggleInteraction = (interactionId: string) => {
    setSelectedInteractionIds(prev =>
      prev.includes(interactionId)
        ? prev.filter(id => id !== interactionId)
        : [...prev, interactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInteractionIds.length === interactions.length) {
      setSelectedInteractionIds([]);
    } else {
      setSelectedInteractionIds(interactions.map(i => i.id));
    }
  };

  const handleGenerate = async () => {
    if (selectedInteractionIds.length === 0 && !extraContext.trim()) {
      toast.error('Please select at least one interaction or provide extra context');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          reportType: formData.reportType,
          interactionIds: selectedInteractionIds.length > 0 ? selectedInteractionIds : undefined,
          extraContext: extraContext.trim() || undefined,
          controls: {
            tone: formData.tone,
            length: formData.length,
            audience: formData.audience,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const { report } = await response.json();
      setOpen(false);
      setExtraContext('');
      toast.success('Report generated successfully!');
      onReportGenerated(report);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Select interactions and add context to generate an AI-powered report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type and Controls */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Interaction Selection */}
          {interactions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Interactions to Include</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedInteractionIds.length === interactions.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
              <Card>
                <div className="max-h-[200px] overflow-y-auto">
                  <CardContent className="p-4 space-y-2">
                    {interactions.map((interaction) => {
                      const isSelected = selectedInteractionIds.includes(interaction.id);
                      const date = new Date(interaction.dateTime);
                      
                      return (
                        <div
                          key={interaction.id}
                          className={\`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/5 border-primary'
                              : 'hover:bg-accent'
                          }\`}
                          onClick={() => handleToggleInteraction(interaction.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleInteraction(interaction.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{getTypeIcon(interaction.type)}</span>
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(interaction.type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(date, 'dd MMM yyyy HH:mm')}
                              </span>
                            </div>
                            {interaction.participants.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Users className="h-3 w-3" />
                                {interaction.participants.join(', ')}
                              </div>
                            )}
                            {interaction.aiSummary && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {interaction.aiSummary}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </div>
              </Card>
              <p className="text-xs text-muted-foreground">
                {selectedInteractionIds.length} of {interactions.length} interactions selected
              </p>
            </div>
          )}

          {/* Extra Context */}
          <div className="space-y-2">
            <Label htmlFor="extra-context">
              Additional Context or Instructions
              <span className="text-muted-foreground text-xs font-normal ml-1">
                (Optional - will be included in report generation)
              </span>
            </Label>
            <Textarea
              id="extra-context"
              placeholder="Add any additional information, specific points to emphasize, or special instructions for the report generation..."
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This context will be provided to the AI to help generate a more tailored report.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">Note:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Select specific interactions to include, or leave all selected for comprehensive report</li>
              <li>Add extra context to guide the AI on specific points to emphasize</li>
              <li>Review and edit the generated report before sending to any external party</li>
            </ul>
          </div>

          {/* Actions */}
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
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
