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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Loader2, FileText, Mic, Sparkles, CheckCircle, Square, Radio, Edit2, X, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface AddInteractionDialogProps {
  caseId: string;
  onInteractionAdded: () => void;
}

export function AddInteractionDialog({
  caseId,
  onInteractionAdded,
}: AddInteractionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [participants, setParticipants] = useState<Array<{ id: string; role: string; name: string }>>([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  // Text interaction state
  const [textData, setTextData] = useState({
    type: 'NOTE',
    textContent: '',
  });

  // Summary sections selection
  const [summarySections, setSummarySections] = useState({
    mainIssues: { enabled: true, label: 'Main Issues' },
    currentCapacity: { enabled: true, label: 'Current Capacity & Duties' },
    treatmentAndMedical: { enabled: true, label: 'Treatment & Medical Input' },
    barriersToRTW: { enabled: true, label: 'Barriers to RTW' },
    agreedActions: { enabled: true, label: 'Agreed Actions' },
  });
  const [customSections, setCustomSections] = useState<Array<{ id: string; label: string; enabled: boolean }>>([]);
  const [showSectionOptions, setShowSectionOptions] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Audio interaction state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioData, setAudioData] = useState({
    type: 'CASE_CONFERENCE',
  });

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [voiceData, setVoiceData] = useState({
    type: 'PHONE_CALL',
  });

  // Fetch participants for the case
  useEffect(() => {
    if (open && caseId) {
      fetch(`/api/cases/${caseId}/participants`)
        .then(res => res.json())
        .then(data => setParticipants(data.participants || []))
        .catch(err => console.error('Error fetching participants:', err));
    }
  }, [open, caseId]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedParticipantIds.length === 0) {
        alert('Please select at least one participant');
        setLoading(false);
        return;
      }

      // Build summary sections object for API
      const sectionsForAPI: any = {};
      Object.keys(summarySections).forEach((key) => {
        sectionsForAPI[key] = summarySections[key as keyof typeof summarySections].enabled;
      });

      // Build custom sections mapping
      const customSectionsList = customSections.filter(s => s.enabled).map(s => s.label);

      // Build section labels mapping
      const sectionLabels: Record<string, string> = {};
      Object.entries(summarySections).forEach(([key, section]) => {
        sectionLabels[key] = section.label;
      });
      customSections.forEach((section) => {
        if (section.enabled) {
          sectionLabels[section.id] = section.label;
        }
      });

      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          type: textData.type,
          participantIds: selectedParticipantIds,
          textContent: textData.textContent,
          summarySections: sectionsForAPI,
          customSections: customSectionsList.length > 0 ? customSectionsList : undefined,
          sectionLabels: Object.keys(sectionLabels).length > 0 ? sectionLabels : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create interaction');

      setTextData({ type: 'NOTE', textContent: '' });
      setSelectedParticipantIds([]);
      setOpen(false);
      onInteractionAdded();
    } catch (error) {
      console.error('Error creating interaction:', error);
      alert('Failed to create interaction');
    } finally {
      setLoading(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        // Convert to File for upload
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        setAudioFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
      // Store timer to clear on stop
      (recorder as any).timer = timer;
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      if ((mediaRecorder as any).timer) {
        clearInterval((mediaRecorder as any).timer);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordedAudio) return;

    setLoading(true);

    try {
      // Convert recorded audio to File
      const audioFile = new File([recordedAudio], `recording-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      if (selectedParticipantIds.length === 0) {
        alert('Please select at least one participant');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('caseId', caseId);
      formData.append('type', voiceData.type);
      formData.append('participantIds', JSON.stringify(selectedParticipantIds));

      const response = await fetch('/api/interactions/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to transcribe audio');

      setRecordedAudio(null);
      setAudioFile(null);
      setVoiceData({ type: 'PHONE_CALL' });
      setSelectedParticipantIds([]);
      setOpen(false);
      onInteractionAdded();
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return;

    setLoading(true);

    try {
      if (selectedParticipantIds.length === 0) {
        alert('Please select at least one participant');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('caseId', caseId);
      formData.append('type', audioData.type);
      formData.append('participantIds', JSON.stringify(selectedParticipantIds));

      const response = await fetch('/api/interactions/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to transcribe audio');

      setAudioFile(null);
      setAudioData({ type: 'CASE_CONFERENCE' });
      setSelectedParticipantIds([]);
      setOpen(false);
      onInteractionAdded();
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup when dialog closes
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Stop recording if active
      if (isRecording && mediaRecorder) {
        stopRecording();
      }
      // Reset states
      setRecordedAudio(null);
      setAudioFile(null);
      setRecordingTime(0);
      setActiveTab('text');
      setSummarySections({
        mainIssues: { enabled: true, label: 'Main Issues' },
        currentCapacity: { enabled: true, label: 'Current Capacity & Duties' },
        treatmentAndMedical: { enabled: true, label: 'Treatment & Medical Input' },
        barriersToRTW: { enabled: true, label: 'Barriers to RTW' },
        agreedActions: { enabled: true, label: 'Agreed Actions' },
      });
      setCustomSections([]);
      setNewSectionName('');
      setEditingSection(null);
      setShowSectionOptions(false);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-soft">
          <Plus className="h-4 w-4" />
          Add Interaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Add Interaction
          </DialogTitle>
          <DialogDescription>
            Record a new case interaction from text or audio
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6 pt-4">
          <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50">
            <TabsTrigger value="text" className="gap-2 data-[state=active]:shadow-soft">
              <FileText className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2 data-[state=active]:shadow-soft">
              <Mic className="h-4 w-4" />
              Record Voice
            </TabsTrigger>
            <TabsTrigger value="audio" className="gap-2 data-[state=active]:shadow-soft">
              <Upload className="h-4 w-4" />
              Upload Audio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-6">
            <form onSubmit={handleTextSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Interaction Type</Label>
                <Select
                  value={textData.type}
                  onValueChange={(value) => setTextData({ ...textData, type: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                    <SelectItem value="IN_PERSON_MEETING">In-Person Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants" className="text-sm font-medium">
                  Participants
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">
                      No participants added yet. Add them in Case Overview.
                    </p>
                  ) : (
                    participants.map((participant) => {
                      const roleLabel = participant.role.replace('_', ' ');
                      const isSelected = selectedParticipantIds.includes(participant.id);
                      return (
                        <div key={participant.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`participant-${participant.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedParticipantIds([...selectedParticipantIds, participant.id]);
                              } else {
                                setSelectedParticipantIds(selectedParticipantIds.filter(id => id !== participant.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`participant-${participant.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            <span className="font-medium">{roleLabel}:</span> {participant.name}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textContent" className="text-sm font-medium">Content</Label>
                <Textarea
                  id="textContent"
                  required
                  rows={10}
                  value={textData.textContent}
                  onChange={(e) =>
                    setTextData({ ...textData, textContent: e.target.value })
                  }
                  placeholder="Paste email content, meeting notes, or case notes here..."
                  className="resize-none"
                />
              </div>

              {/* Summary Sections Selection */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Summary Sections
                  </Label>
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
                {showSectionOptions && (
                  <div className="space-y-3 pt-2">
                    {/* Standard Sections */}
                    {Object.entries(summarySections).map(([key, section]) => (
                      <div key={key} className="flex items-center gap-2 group">
                        <Checkbox
                          id={`section-${key}`}
                          checked={section.enabled}
                          onCheckedChange={(checked) =>
                            setSummarySections({
                              ...summarySections,
                              [key]: { ...section, enabled: checked as boolean },
                            })
                          }
                        />
                        {editingSection === key ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={section.label}
                              onChange={(e) =>
                                setSummarySections({
                                  ...summarySections,
                                  [key]: { ...section, label: e.target.value },
                                })
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
                          </div>
                        ) : (
                          <>
                            <Label
                              htmlFor={`section-${key}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {section.label}
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSection(key)}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Custom Sections */}
                    {customSections.map((section) => (
                      <div key={section.id} className="flex items-center gap-2 group">
                        <Checkbox
                          id={`custom-section-${section.id}`}
                          checked={section.enabled}
                          onCheckedChange={(checked) =>
                            setCustomSections(
                              customSections.map((s) =>
                                s.id === section.id ? { ...s, enabled: checked as boolean } : s
                              )
                            )
                          }
                        />
                        {editingSection === section.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={section.label}
                              onChange={(e) =>
                                setCustomSections(
                                  customSections.map((s) =>
                                    s.id === section.id ? { ...s, label: e.target.value } : s
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
                                setCustomSections(customSections.filter((s) => s.id !== section.id));
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
                              htmlFor={`custom-section-${section.id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {section.label}
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSection(section.id)}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCustomSections(customSections.filter((s) => s.id !== section.id));
                              }}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add Custom Section */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                      <Input
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="Add custom section..."
                        className="h-8 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSectionName.trim()) {
                            e.preventDefault();
                            setCustomSections([
                              ...customSections,
                              {
                                id: `custom-${Date.now()}`,
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
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newSectionName.trim()) {
                            setCustomSections([
                              ...customSections,
                              {
                                id: `custom-${Date.now()}`,
                                label: newSectionName.trim(),
                                enabled: true,
                              },
                            ]);
                            setNewSectionName('');
                          }
                        }}
                        disabled={!newSectionName.trim()}
                        className="h-8 px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Create Interaction
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-6">
            <form onSubmit={handleVoiceSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="voiceType" className="text-sm font-medium">Interaction Type</Label>
                <Select
                  value={voiceData.type}
                  onValueChange={(value) => setVoiceData({ ...voiceData, type: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                    <SelectItem value="IN_PERSON_MEETING">In-Person Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voiceParticipants" className="text-sm font-medium">
                  Participants
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">
                      No participants added yet. Add them in Case Overview.
                    </p>
                  ) : (
                    participants.map((participant) => {
                      const roleLabel = participant.role.replace('_', ' ');
                      const isSelected = selectedParticipantIds.includes(participant.id);
                      return (
                        <div key={participant.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`voice-participant-${participant.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedParticipantIds([...selectedParticipantIds, participant.id]);
                              } else {
                                setSelectedParticipantIds(selectedParticipantIds.filter(id => id !== participant.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`voice-participant-${participant.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            <span className="font-medium">{roleLabel}:</span> {participant.name}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Voice Recording</Label>
                <div className="rounded-xl border border-border/60 bg-card/50 p-6">
                  {!isRecording && !recordedAudio && (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <Mic className="h-10 w-10 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Ready to Record
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click the button below to start recording
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={startRecording}
                        size="lg"
                        className="gap-2"
                      >
                        <Radio className="h-4 w-4" />
                        Start Recording
                      </Button>
                    </div>
                  )}
                  {isRecording && (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 animate-pulse">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
                          <Square className="h-6 w-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-mono font-semibold text-foreground mb-1">
                          {formatTime(recordingTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">Recording in progress...</p>
                      </div>
                      <Button
                        type="button"
                        onClick={stopRecording}
                        variant="destructive"
                        size="lg"
                        className="gap-2"
                      >
                        <Square className="h-4 w-4" />
                        Stop Recording
                      </Button>
                    </div>
                  )}
                  {recordedAudio && !isRecording && (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Recording Complete
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {formatTime(recordingTime)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRecordedAudio(null);
                            setAudioFile(null);
                            setRecordingTime(0);
                          }}
                        >
                          Record Again
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-accent/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">AI Processing</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Audio transcription using OpenAI Whisper</li>
                  <li>• AI-generated summary and structure</li>
                  <li>• Automatic action item extraction</li>
                  <li>• Task creation from identified actions</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60">
                  Processing may take 10-30 seconds depending on recording length.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !recordedAudio} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Transcribe & Create
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4 mt-6">
            <form onSubmit={handleAudioSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="audioType" className="text-sm font-medium">Interaction Type</Label>
                <Select
                  value={audioData.type}
                  onValueChange={(value) => setAudioData({ ...audioData, type: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="IN_PERSON_MEETING">In-Person Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioParticipants" className="text-sm font-medium">
                  Participants
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">
                      No participants added yet. Add them in Case Overview.
                    </p>
                  ) : (
                    participants.map((participant) => {
                      const roleLabel = participant.role.replace('_', ' ');
                      const isSelected = selectedParticipantIds.includes(participant.id);
                      return (
                        <div key={participant.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`audio-participant-${participant.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedParticipantIds([...selectedParticipantIds, participant.id]);
                              } else {
                                setSelectedParticipantIds(selectedParticipantIds.filter(id => id !== participant.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`audio-participant-${participant.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            <span className="font-medium">{roleLabel}:</span> {participant.name}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioFile" className="text-sm font-medium">Audio File</Label>
                <div className="relative">
                  {!audioFile ? (
                    <label
                      htmlFor="audioFile"
                      className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">MP3, M4A, WAV (max 25MB)</p>
                      <input
                        id="audioFile"
                        type="file"
                        accept=".mp3,.m4a,.wav"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{audioFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAudioFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-accent/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">AI Processing</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Audio transcription using OpenAI Whisper</li>
                  <li>• AI-generated summary and structure</li>
                  <li>• Automatic action item extraction</li>
                  <li>• Task creation from identified actions</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60">
                  Processing may take 10-30 seconds depending on file size.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !audioFile} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload & Transcribe
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
