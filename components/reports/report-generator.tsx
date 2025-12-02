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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Loader2, Sparkles, FileStack, Users, Gauge, MessageSquare, FileEdit, Edit2, Save, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface Interaction {
  id: string;
  type: string;
  dateTime: Date;
  participants: string[];
  aiSummary?: string | null;
}

interface ReportGeneratorProps {
  caseId: string;
  onReportGenerated: (report: any) => void;
}

export function ReportGenerator({ caseId, onReportGenerated }: ReportGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [formData, setFormData] = useState({
    reportType: 'PROGRESS_REPORT',
    tone: 'neutral',
    length: 'standard',
    audience: 'mixed',
    selectedInteractionIds: [] as string[],
    extraContext: '',
  });
  const [showSectionOptions, setShowSectionOptions] = useState(false);
  const [reportPoints, setReportPoints] = useState<Array<{ id: string; label: string; enabled: boolean }>>([
    { id: 'main-issues', label: 'Main Issues', enabled: true },
    { id: 'current-capacity', label: 'Current Capacity & Duties', enabled: true },
    { id: 'treatment-medical', label: 'Treatment & Medical Input', enabled: true },
    { id: 'barriers-rtw', label: 'Barriers to RTW', enabled: true },
    { id: 'agreed-actions', label: 'Agreed Actions', enabled: true },
  ]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Fetch interactions when dialog opens
  useEffect(() => {
    if (open && caseId) {
      setLoadingInteractions(true);
      fetch(`/api/interactions?caseId=${caseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.interactions) {
            setInteractions(data.interactions);
          }
        })
        .catch((error) => {
          console.error('Error fetching interactions:', error);
        })
        .finally(() => {
          setLoadingInteractions(false);
        });

      // Load saved report points from localStorage
      const saved = localStorage.getItem(`report-points-${caseId}`);
      if (saved) {
        try {
          const savedData = JSON.parse(saved);
          if (savedData.points && Array.isArray(savedData.points)) {
            setReportPoints(savedData.points);
          }
        } catch (e) {
          console.error('Error loading saved report points:', e);
        }
      }
    }
  }, [open, caseId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        reportType: 'PROGRESS_REPORT',
        tone: 'neutral',
        length: 'standard',
        audience: 'mixed',
        selectedInteractionIds: [],
        extraContext: '',
      });
      setReportPoints([
        { id: 'main-issues', label: 'Main Issues', enabled: true },
        { id: 'current-capacity', label: 'Current Capacity & Duties', enabled: true },
        { id: 'treatment-medical', label: 'Treatment & Medical Input', enabled: true },
        { id: 'barriers-rtw', label: 'Barriers to RTW', enabled: true },
        { id: 'agreed-actions', label: 'Agreed Actions', enabled: true },
      ]);
      setNewSectionName('');
      setEditingSection(null);
      setShowSectionOptions(false);
    }
  }, [open]);

  const handleInteractionToggle = (interactionId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedInteractionIds: prev.selectedInteractionIds.includes(interactionId)
        ? prev.selectedInteractionIds.filter((id) => id !== interactionId)
        : [...prev.selectedInteractionIds, interactionId],
    }));
  };

  const handleSelectAll = () => {
    if (formData.selectedInteractionIds.length === interactions.length) {
      setFormData((prev) => ({ ...prev, selectedInteractionIds: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedInteractionIds: interactions.map((i) => i.id),
      }));
    }
  };

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const requestBody: any = {
        caseId,
        reportType: formData.reportType,
        controls: {
          tone: formData.tone,
          length: formData.length,
          audience: formData.audience,
        },
      };

      // Include selected interactions if any are selected
      if (formData.selectedInteractionIds.length > 0) {
        requestBody.interactionIds = formData.selectedInteractionIds;
      }

      // Include extra context if provided
      if (formData.extraContext.trim()) {
        requestBody.extraContext = formData.extraContext.trim();
      }

      // Build report points - only include enabled ones
      const enabledPoints = reportPoints.filter(p => p.enabled);
      const customSectionsList = enabledPoints.map(p => p.label);
      const sectionLabels: Record<string, string> = {};
      enabledPoints.forEach((point) => {
        sectionLabels[point.id] = point.label;
      });

      // Include sections in request
      if (customSectionsList.length > 0) {
        requestBody.customSections = customSectionsList;
        requestBody.sectionLabels = sectionLabels;
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const reportTypes = [
    { value: 'PROGRESS_REPORT', label: 'Progress Report' },
    { value: 'RTW_PLAN', label: 'RTW Plan' },
    { value: 'CASE_CONFERENCE', label: 'Case Conference Minutes' },
    { value: 'INITIAL_NEEDS_ASSESSMENT', label: 'Initial Needs Assessment' },
    { value: 'CLOSURE', label: 'Closure Report' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Create an AI-generated report based on case interactions
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileStack className="h-4 w-4 text-muted-foreground" />
              Report Type
            </Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) =>
                setFormData({ ...formData, reportType: value })
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              Tone
            </Label>
            <Select
              value={formData.tone}
              onValueChange={(value) => setFormData({ ...formData, tone: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral (Professional standard)</SelectItem>
                <SelectItem value="supportive">Supportive (Emphasize wellbeing)</SelectItem>
                <SelectItem value="assertive">Assertive (Clear expectations)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Length</Label>
              <Select
                value={formData.length}
                onValueChange={(value) => setFormData({ ...formData, length: value })}
              >
                <SelectTrigger className="h-11">
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
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Audience
              </Label>
              <Select
                value={formData.audience}
                onValueChange={(value) => setFormData({ ...formData, audience: value })}
              >
                <SelectTrigger className="h-11">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Select Interactions
              </Label>
              {interactions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  {formData.selectedInteractionIds.length === interactions.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              )}
            </div>
            <div className="rounded-xl border border-border/60 bg-card/50 max-h-48 overflow-y-auto p-3 space-y-2">
              {loadingInteractions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading interactions...</span>
                </div>
              ) : interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interactions found. Recent interactions will be used by default.
                </p>
              ) : (
                interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={formData.selectedInteractionIds.includes(interaction.id)}
                      onCheckedChange={() => handleInteractionToggle(interaction.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {getTypeLabel(interaction.type)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interaction.dateTime), 'dd MMM yyyy')}
                        </span>
                      </div>
                      {interaction.participants.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {interaction.participants.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.selectedInteractionIds.length === 0
                ? 'Leave unselected to use recent interactions (last 6 weeks)'
                : `${formData.selectedInteractionIds.length} interaction${formData.selectedInteractionIds.length === 1 ? '' : 's'} selected`}
            </p>
          </div>

          {/* Report Points Selection */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/60">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Report Points & Sections
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Save to localStorage
                    const savedPoints = {
                      reportType: formData.reportType,
                      points: reportPoints,
                    };
                    localStorage.setItem(`report-points-${caseId}`, JSON.stringify(savedPoints));
                    alert('Report points saved!');
                  }}
                  className="h-7 px-2 text-xs gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSectionOptions(!showSectionOptions)}
                  className="h-7 px-2 text-xs"
                >
                  {showSectionOptions ? 'Hide' : 'Customize'}
                </Button>
              </div>
            </div>
            {showSectionOptions && (
              <div className="space-y-3 pt-2">
                {/* All Points (Standard + Custom) */}
                {reportPoints.map((point) => (
                  <div key={point.id} className="flex items-center gap-2 group">
                    <Checkbox
                      id={`point-${point.id}`}
                      checked={point.enabled}
                      onCheckedChange={(checked) =>
                        setReportPoints(
                          reportPoints.map((p) =>
                            p.id === point.id ? { ...p, enabled: checked as boolean } : p
                          )
                        )
                      }
                    />
                    {editingSection === point.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={point.label}
                          onChange={(e) =>
                            setReportPoints(
                              reportPoints.map((p) =>
                                p.id === point.id ? { ...p, label: e.target.value } : p
                              )
                            )
                          }
                          className="h-8 text-sm flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingSection(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingSection(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSection(null)}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportPoints(reportPoints.filter((p) => p.id !== point.id));
                            setEditingSection(null);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Label
                          htmlFor={`point-${point.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {point.label}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSection(point.id)}
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportPoints(reportPoints.filter((p) => p.id !== point.id));
                          }}
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add New Point */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Add new point or section..."
                    className="h-8 text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSectionName.trim()) {
                        setReportPoints([
                          ...reportPoints,
                          {
                            id: `point-${Date.now()}`,
                            label: newSectionName.trim(),
                            enabled: true,
                          },
                        ]);
                        setNewSectionName('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (newSectionName.trim()) {
                        setReportPoints([
                          ...reportPoints,
                          {
                            id: `point-${Date.now()}`,
                            label: newSectionName.trim(),
                            enabled: true,
                          },
                        ]);
                        setNewSectionName('');
                      }
                    }}
                    className="h-8 px-2 gap-1.5"
                    disabled={!newSectionName.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-muted-foreground" />
              Additional Context (Optional)
            </Label>
            <Textarea
              value={formData.extraContext}
              onChange={(e) => setFormData({ ...formData, extraContext: e.target.value })}
              placeholder="Add any additional context, specific points to emphasize, or instructions for the report generation..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Provide any additional information or specific requirements for the report.
            </p>
          </div>

          <div className="rounded-xl bg-accent/50 p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">AI-Powered Generation</p>
              <p className="text-sm text-muted-foreground mt-1">
                This will use AI to generate a draft report based on recent case interactions. 
                Always review and edit before sending to any external party.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
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
