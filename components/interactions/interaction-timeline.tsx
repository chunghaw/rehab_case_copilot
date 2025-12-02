'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Phone,
  Users,
  Mail,
  FileText,
  Video,
  Sparkles,
  Clock,
  MessageSquare,
  Copy,
  Check,
  Edit,
  Trash2,
  Loader2,
  Plus,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MeetingDetectionDialog } from './meeting-detection-dialog';

// DetectedMeeting type definition (shared with meeting-detection-dialog)
export interface DetectedMeeting {
  date?: string;
  time?: string;
  type?: 'IN_PERSON_MEETING' | 'PHONE_CALL' | 'CASE_CONFERENCE';
  description?: string;
  participants?: string[];
}
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Interaction {
  id: string;
  type: string;
  dateTime: Date;
  participants?: Array<{ id: string; role: string; name: string }>;
  participantIds?: string[];
  aiSummary?: string | null;
  transcriptText?: string | null;
}

interface InteractionTimelineProps {
  interactions: Interaction[];
  onInteractionUpdated?: () => void;
  caseId?: string;
}

// Parse markdown-style AI summary into structured data
function parseAISummary(summary: string) {
  const sections: Array<{ title: string; content: string[]; type: 'list' | 'text' }> = [];
  const lines = summary.split('\n');
  let currentSection: { title: string; content: string[]; type: 'list' | 'text' } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if it's a heading (##)
    if (trimmed.startsWith('##')) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: trimmed.replace(/^##\s*/, ''),
        content: [],
        type: 'text', // Default to text, will change if we see list items
      };
    } else if (trimmed.startsWith('-')) {
      // It's a list item
      if (currentSection) {
        currentSection.content.push(trimmed.replace(/^-\s*/, ''));
        currentSection.type = 'list';
      }
    } else if (trimmed && currentSection) {
      // It's regular text
      currentSection.content.push(trimmed);
      // Only set to text if we haven't seen any list items yet
      if (currentSection.type !== 'list') {
        currentSection.type = 'text';
      }
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// Convert summary to Word-friendly plain text
function summaryToPlainText(summary: string): string {
  const sections = parseAISummary(summary);
  return sections
    .map((section) => {
      const title = section.title;
      const content = section.type === 'list' 
        ? section.content.map((item) => `• ${item}`).join('\n')
        : section.content.join('\n');
      return `${title}\n${content}`;
    })
    .join('\n\n');
}

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'PHONE_CALL':
      return {
        icon: Phone,
        label: 'Phone Call',
        color: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
        dotColor: 'bg-blue-500',
      };
    case 'CASE_CONFERENCE':
      return {
        icon: Video,
        label: 'Case Conference',
        color: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
        dotColor: 'bg-purple-500',
      };
    case 'IN_PERSON_MEETING':
      return {
        icon: Users,
        label: 'In-Person Meeting',
        color: 'bg-green-500/10 text-green-600 ring-green-500/20',
        dotColor: 'bg-green-500',
      };
    case 'EMAIL':
      return {
        icon: Mail,
        label: 'Email',
        color: 'bg-orange-500/10 text-orange-600 ring-orange-500/20',
        dotColor: 'bg-orange-500',
      };
    case 'NOTE':
      return {
        icon: FileText,
        label: 'Note',
        color: 'bg-gray-500/10 text-gray-600 ring-gray-500/20',
        dotColor: 'bg-gray-500',
      };
    default:
      return {
        icon: FileText,
        label: type.replace(/_/g, ' '),
        color: 'bg-gray-500/10 text-gray-600 ring-gray-500/20',
        dotColor: 'bg-gray-500',
      };
  }
};

// Editable Summary Content Component
function EditableSummaryContent({
  sections,
  onSectionsChange,
}: {
  sections: Array<{ title: string; content: string[]; type: 'list' | 'text' }>;
  onSectionsChange: (sections: Array<{ title: string; content: string[]; type: 'list' | 'text' }>) => void;
}) {
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [newSectionName, setNewSectionName] = useState('');

  const handleAddPoint = (sectionIndex: number) => {
    const newSections = [...sections];
    if (newSections[sectionIndex].type === 'list') {
      newSections[sectionIndex].content.push('');
    } else {
      newSections[sectionIndex].type = 'list';
      newSections[sectionIndex].content = ['', ...newSections[sectionIndex].content];
    }
    onSectionsChange(newSections);
  };

  const handleEditPoint = (sectionIndex: number, pointIndex: number, value: string) => {
    const newSections = [...sections];
    newSections[sectionIndex].content[pointIndex] = value;
    onSectionsChange(newSections);
  };

  const handleDeletePoint = (sectionIndex: number, pointIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].content = newSections[sectionIndex].content.filter(
      (_, i) => i !== pointIndex
    );
    onSectionsChange(newSections);
  };

  const handleEditText = (sectionIndex: number, value: string) => {
    const newSections = [...sections];
    newSections[sectionIndex].content = [value];
    onSectionsChange(newSections);
  };

  const handleEditTitle = (sectionIndex: number, value: string) => {
    const newSections = [...sections];
    newSections[sectionIndex].title = value;
    onSectionsChange(newSections);
  };

  const handleDeleteSection = (sectionIndex: number) => {
    const newSections = sections.filter((_, i) => i !== sectionIndex);
    onSectionsChange(newSections);
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      const newSections = [
        ...sections,
        {
          title: newSectionName.trim(),
          content: [''],
          type: 'list' as const,
        },
      ];
      onSectionsChange(newSections);
      setNewSectionName('');
    }
  };

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2 p-3 border border-border/60 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 group">
            {editingTitle === sectionIndex ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={section.title}
                  onChange={(e) => handleEditTitle(sectionIndex, e.target.value)}
                  className="text-sm font-semibold h-8 flex-1"
                  placeholder="Section title..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingTitle(null);
                    }
                    if (e.key === 'Escape') {
                      setEditingTitle(null);
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTitle(null)}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 flex-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {section.title}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTitle(sectionIndex)}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSection(sectionIndex)}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
          {section.type === 'list' ? (
            <div className="space-y-2 ml-4">
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start gap-2 group">
                  <span className="text-primary mt-1.5 shrink-0">•</span>
                  <Input
                    value={item}
                    onChange={(e) => handleEditPoint(sectionIndex, itemIndex, e.target.value)}
                    className="text-sm h-8 flex-1"
                    placeholder="Enter point..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePoint(sectionIndex, itemIndex)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddPoint(sectionIndex)}
                className="h-8 text-xs gap-1.5 ml-6"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Point
              </Button>
            </div>
          ) : (
            <div className="ml-4">
              <Textarea
                value={section.content.join(' ')}
                onChange={(e) => handleEditText(sectionIndex, e.target.value)}
                className="text-sm min-h-[60px] resize-none"
                placeholder="Enter text..."
              />
            </div>
          )}
        </div>
      ))}
      
      {/* Add New Section */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/60">
        <Input
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          placeholder="Add new section..."
          className="h-8 text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newSectionName.trim()) {
              handleAddSection();
            }
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddSection}
          className="h-8 px-2 gap-1.5"
          disabled={!newSectionName.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>
    </div>
  );
}

// AI Summary Display Component
function AISummaryDisplay({ 
  summary, 
  interactionId, 
  onSummaryUpdated 
}: { 
  summary: string;
  interactionId: string;
  onSummaryUpdated?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary);
  const [saving, setSaving] = useState(false);
  const sections = parseAISummary(isEditing ? editedSummary : summary);
  
  // Update editedSummary when summary prop changes (but not while editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedSummary(summary);
    }
  }, [summary, isEditing]);

  const handleCopy = async () => {
    const plainText = summaryToPlainText(isEditing ? editedSummary : summary);
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/interactions/${interactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiSummary: editedSummary,
        }),
      });

      if (!response.ok) throw new Error('Failed to update summary');

      setIsEditing(false);
      if (onSummaryUpdated) {
        onSummaryUpdated();
      }
    } catch (error) {
      console.error('Error updating summary:', error);
      alert('Failed to update summary');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSummary(summary);
    setIsEditing(false);
  };

  const handleRegenerateFromEdit = async () => {
    setSaving(true);
    try {
      // Use the edited summary as the new source to regenerate
      const response = await fetch(`/api/interactions/${interactionId}/regenerate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useEditedContent: true,
          editedContent: editedSummary,
          customInstructions: 'Regenerate the summary based on the edited content provided. Extract information from the edited summary text.',
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate summary');

      if (onSummaryUpdated) {
        onSummaryUpdated();
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error regenerating summary:', error);
      alert('Failed to regenerate summary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 bg-accent/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AI Summary
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2 text-xs gap-1.5"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateFromEdit}
                className="h-7 px-2 text-xs gap-1.5"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Regenerate
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-7 px-2 text-xs gap-1.5"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 px-2 text-xs gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <EditableSummaryContent
          sections={sections}
          onSectionsChange={(newSections) => {
            // Convert sections back to markdown format
            const markdown = newSections
              .map((sec) => {
                const title = `## ${sec.title}`;
                const content =
                  sec.type === 'list'
                    ? sec.content.map((item) => `- ${item}`).join('\n')
                    : sec.content.join('\n');
                return `${title}\n${content}`;
              })
              .join('\n\n');
            setEditedSummary(markdown);
          }}
        />
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {section.title}
              </h4>
              {section.type === 'list' ? (
                <ul className="space-y-1.5 ml-4">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-foreground/90 leading-relaxed flex items-start gap-2">
                      <span className="text-primary mt-1.5 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/90 leading-relaxed ml-4">
                  {section.content.join(' ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Raw Transcription Display Component with inline editing
function RawTranscriptionDisplay({
  transcriptText,
  interactionId,
  onTranscriptUpdated,
}: {
  transcriptText: string;
  interactionId: string;
  onTranscriptUpdated?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcriptText);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditedText(transcriptText);
    }
  }, [transcriptText, isEditing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, update the transcription
      const updateResponse = await fetch(`/api/interactions/${interactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptText: editedText,
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update transcription');

      // Then, regenerate the AI summary based on the new transcription
      const regenerateResponse = await fetch(`/api/interactions/${interactionId}/regenerate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useEditedContent: false, // Use transcriptText from database
          customInstructions: undefined,
        }),
      });

      if (!regenerateResponse.ok) {
        console.warn('Failed to regenerate summary, but transcription was updated');
        // Don't throw - transcription update succeeded
      }

      setIsEditing(false);
      if (onTranscriptUpdated) {
        onTranscriptUpdated();
      }
    } catch (error) {
      console.error('Error updating transcription:', error);
      alert('Failed to update transcription');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedText(transcriptText);
    setIsEditing(false);
  };

  return (
    <div className="p-5 bg-muted/30 border-t border-border/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Raw Transcription
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2 text-xs gap-1.5"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-7 px-2 text-xs gap-1.5"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating & Regenerating...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 px-2 text-xs gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>
      {isEditing ? (
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="text-sm min-h-[200px] resize-none font-mono"
          placeholder="Raw transcription text..."
        />
      ) : (
        <div className="rounded-lg bg-background border border-border/60 p-4">
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {transcriptText}
          </p>
        </div>
      )}
    </div>
  );
}

export function InteractionTimeline({ interactions, onInteractionUpdated, caseId }: InteractionTimelineProps) {
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interactionToDelete, setInteractionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
  const [focusAreas, setFocusAreas] = useState({
    mainIssues: true,
    currentCapacity: true,
    treatmentAndMedical: true,
    barriersToRTW: true,
    agreedActions: true,
  });
  const [customInstructions, setCustomInstructions] = useState('');
  const [editFormData, setEditFormData] = useState({
    type: '',
    participants: '',
    transcriptText: '',
    dateTime: '',
  });
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [detectedMeeting, setDetectedMeeting] = useState<DetectedMeeting | null>(null);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [expandedInteractions, setExpandedInteractions] = useState<Set<string>>(new Set());
  if (interactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <MessageSquare className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
          No interactions yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Add your first interaction by clicking the button above. You can paste text or upload audio recordings.
        </p>
      </div>
    );
  }

  const handleEdit = (interaction: Interaction) => {
    setEditFormData({
      type: interaction.type,
      participants: interaction.participants 
        ? interaction.participants.map(p => `${p.role.replace('_', ' ')}: ${p.name}`).join(', ')
        : '',
      transcriptText: interaction.transcriptText || '',
      dateTime: new Date(interaction.dateTime).toISOString().slice(0, 16),
    });
    setEditingInteraction(interaction);
    setShowRegenerateOptions(false);
    setFocusAreas({
      mainIssues: true,
      currentCapacity: true,
      treatmentAndMedical: true,
      barriersToRTW: true,
      agreedActions: true,
    });
    setCustomInstructions('');
  };

  const handleSaveEdit = async () => {
    if (!editingInteraction) return;
    setSaving(true);

    try {
      const participantsArray = editFormData.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      const response = await fetch(`/api/interactions/${editingInteraction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editFormData.type,
          participants: participantsArray,
          transcriptText: editFormData.transcriptText || null,
          dateTime: editFormData.dateTime,
        }),
      });

      if (!response.ok) throw new Error('Failed to update interaction');

      // Check for meetings in the transcript (if API exists)
      if (editFormData.transcriptText && caseId) {
        try {
          const response = await fetch('/api/interactions/detect-meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: editFormData.transcriptText }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.meeting) {
              setCurrentCaseId(caseId);
              setDetectedMeeting(data.meeting);
              setMeetingDialogOpen(true);
            }
          } else if (response.status === 404) {
            // API route doesn't exist, silently skip meeting detection
            console.log('Meeting detection API not available');
          }
        } catch (error) {
          // Don't block the save if meeting detection fails
          console.log('Meeting detection not available:', error);
        }
      }

      setEditingInteraction(null);
      if (onInteractionUpdated) {
        onInteractionUpdated();
      }
    } catch (error) {
      console.error('Error updating interaction:', error);
      alert('Failed to update interaction');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!editingInteraction) return;
    setRegenerating(true);

    try {
      // Build custom instructions based on focus areas
      const instructions: string[] = [];
      
      if (!focusAreas.mainIssues) {
        instructions.push('Do not include main issues section');
      }
      if (!focusAreas.currentCapacity) {
        instructions.push('Do not include current capacity section');
      }
      if (!focusAreas.treatmentAndMedical) {
        instructions.push('Do not include treatment and medical section');
      }
      if (!focusAreas.barriersToRTW) {
        instructions.push('Do not include barriers to RTW section');
      }
      if (!focusAreas.agreedActions) {
        instructions.push('Do not include agreed actions section');
      }

      if (customInstructions.trim()) {
        instructions.push(`Additional focus: ${customInstructions.trim()}`);
      }

      const response = await fetch(`/api/interactions/${editingInteraction.id}/regenerate-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customInstructions: instructions.length > 0 ? instructions.join('\n') : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate summary');

      setShowRegenerateOptions(false);
      if (onInteractionUpdated) {
        onInteractionUpdated();
      }
    } catch (error) {
      console.error('Error regenerating summary:', error);
      alert('Failed to regenerate summary');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!interactionToDelete) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/interactions/${interactionToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete interaction');

      setDeleteDialogOpen(false);
      setInteractionToDelete(null);
      if (onInteractionUpdated) {
        onInteractionUpdated();
      }
    } catch (error) {
      console.error('Error deleting interaction:', error);
      alert('Failed to delete interaction');
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpanded = (interactionId: string) => {
    setExpandedInteractions((prev) => {
      const next = new Set(prev);
      if (next.has(interactionId)) {
        next.delete(interactionId);
      } else {
        next.add(interactionId);
      }
      return next;
    });
  };

  const isExpanded = (interactionId: string) => expandedInteractions.has(interactionId);

  // Get preview text from AI summary
  const getSummaryPreview = (summary: string | null | undefined): string => {
    if (!summary) return '';
    const firstSection = summary.split('##')[1];
    if (!firstSection) return '';
    const firstLine = firstSection.split('\n').find(line => line.trim() && !line.trim().startsWith('-'));
    return firstLine ? firstLine.trim().substring(0, 100) + '...' : '';
  };

  return (
    <>
      <div className="space-y-3">
        {interactions.map((interaction, index) => {
          const config = getTypeConfig(interaction.type);
          const TypeIcon = config.icon;
          const expanded = isExpanded(interaction.id);
          const hasContent = !!(interaction.aiSummary || interaction.transcriptText);
          const summaryPreview = getSummaryPreview(interaction.aiSummary);

          return (
            <div
              key={interaction.id}
              className="group rounded-xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              {/* Compact Header - Always Visible */}
              <div 
                className={`p-4 cursor-pointer transition-colors ${expanded ? 'bg-accent/30' : 'hover:bg-accent/20'}`}
                onClick={() => hasContent && toggleExpanded(interaction.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${config.color} shrink-0`}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{config.label}</p>
                          {hasContent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(interaction.id);
                              }}
                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            >
                              {expanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(interaction.dateTime), 'd MMM yyyy · h:mm a')}
                          </div>
                          {summaryPreview && !expanded && (
                            <span className="text-muted-foreground/70 truncate max-w-md">
                              {summaryPreview}
                            </span>
                          )}
                        </div>
                        {/* Participants - Compact */}
                        {interaction.participants && interaction.participants.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {interaction.participants.slice(0, 3).map((participant, i) => {
                              const displayText = typeof participant === 'string' 
                                ? participant 
                                : `${participant.role.replace('_', ' ')}: ${participant.name}`;
                              return (
                                <span
                                  key={typeof participant === 'string' ? i : participant.id || i}
                                  className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                                >
                                  {displayText}
                                </span>
                              );
                            })}
                            {interaction.participants.length > 3 && (
                              <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                +{interaction.participants.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(interaction);
                          }}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInteractionToDelete(interaction.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Content */}
              {expanded && hasContent && (
                <div className="border-t border-border/60 animate-in slide-in-from-top-2 duration-200">
                  {/* AI Summary */}
                  {interaction.aiSummary && (
                    <AISummaryDisplay 
                      summary={interaction.aiSummary} 
                      interactionId={interaction.id}
                      onSummaryUpdated={onInteractionUpdated}
                    />
                  )}

                  {/* Raw Transcription */}
                  {interaction.transcriptText && (
                    <RawTranscriptionDisplay
                      transcriptText={interaction.transcriptText}
                      interactionId={interaction.id}
                      onTranscriptUpdated={onInteractionUpdated}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      {editingInteraction && (
        <Dialog open={!!editingInteraction} onOpenChange={(open) => !open && setEditingInteraction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Interaction</DialogTitle>
              <DialogDescription>
                Update the interaction details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editType">Type</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                    <SelectItem value="IN_PERSON_MEETING">In-Person Meeting</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="NOTE">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editParticipants">Participants</Label>
                <Input
                  id="editParticipants"
                  value={editFormData.participants}
                  onChange={(e) => setEditFormData({ ...editFormData, participants: e.target.value })}
                  placeholder="e.g., Worker, Employer, GP, Consultant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDateTime">Date & Time</Label>
                <Input
                  id="editDateTime"
                  type="datetime-local"
                  value={editFormData.dateTime}
                  onChange={(e) => setEditFormData({ ...editFormData, dateTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editTranscript">Transcription</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRegenerateOptions(!showRegenerateOptions)}
                    className="gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Regenerate AI Summary
                  </Button>
                </div>
                <Textarea
                  id="editTranscript"
                  value={editFormData.transcriptText}
                  onChange={(e) => setEditFormData({ ...editFormData, transcriptText: e.target.value })}
                  placeholder="Raw transcription text..."
                  rows={8}
                  className="resize-none font-mono text-sm"
                />
              </div>

              {/* Regenerate Summary Options */}
              {showRegenerateOptions && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/60 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">
                      Focus Areas (select what to include in summary)
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="focus-mainIssues"
                          checked={focusAreas.mainIssues}
                          onCheckedChange={(checked) =>
                            setFocusAreas({ ...focusAreas, mainIssues: checked as boolean })
                          }
                        />
                        <Label htmlFor="focus-mainIssues" className="text-sm font-normal cursor-pointer">
                          Main Issues
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="focus-currentCapacity"
                          checked={focusAreas.currentCapacity}
                          onCheckedChange={(checked) =>
                            setFocusAreas({ ...focusAreas, currentCapacity: checked as boolean })
                          }
                        />
                        <Label htmlFor="focus-currentCapacity" className="text-sm font-normal cursor-pointer">
                          Current Capacity & Duties
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="focus-treatmentAndMedical"
                          checked={focusAreas.treatmentAndMedical}
                          onCheckedChange={(checked) =>
                            setFocusAreas({ ...focusAreas, treatmentAndMedical: checked as boolean })
                          }
                        />
                        <Label htmlFor="focus-treatmentAndMedical" className="text-sm font-normal cursor-pointer">
                          Treatment & Medical Input
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="focus-barriersToRTW"
                          checked={focusAreas.barriersToRTW}
                          onCheckedChange={(checked) =>
                            setFocusAreas({ ...focusAreas, barriersToRTW: checked as boolean })
                          }
                        />
                        <Label htmlFor="focus-barriersToRTW" className="text-sm font-normal cursor-pointer">
                          Barriers to RTW
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="focus-agreedActions"
                          checked={focusAreas.agreedActions}
                          onCheckedChange={(checked) =>
                            setFocusAreas({ ...focusAreas, agreedActions: checked as boolean })
                          }
                        />
                        <Label htmlFor="focus-agreedActions" className="text-sm font-normal cursor-pointer">
                          Agreed Actions
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customInstructions">Additional Instructions (Optional)</Label>
                    <Textarea
                      id="customInstructions"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g., Focus on work capacity restrictions, highlight any new medical certificates, emphasize return to work timeline..."
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleRegenerateSummary}
                    disabled={regenerating || !editFormData.transcriptText}
                    className="w-full gap-2"
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Regenerating Summary...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Regenerate AI Summary
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingInteraction(null);
                  setShowRegenerateOptions(false);
                  setCustomInstructions('');
                }}
                disabled={saving || regenerating}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving || regenerating}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Interaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this interaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setInteractionToDelete(null);
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
              {deleting ? 'Deleting...' : 'Delete Interaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Detection Dialog */}
      {currentCaseId && (
        <MeetingDetectionDialog
          open={meetingDialogOpen}
          onOpenChange={setMeetingDialogOpen}
          detectedMeeting={detectedMeeting}
          caseId={currentCaseId}
          onConfirm={() => {
            if (onInteractionUpdated) {
              onInteractionUpdated();
            }
          }}
        />
      )}
    </>
  );
}
