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
import { Plus, Upload, Loader2 } from 'lucide-react';

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

  // Text interaction state
  const [textData, setTextData] = useState({
    type: 'NOTE',
    participants: '',
    textContent: '',
  });

  // Audio interaction state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioData, setAudioData] = useState({
    type: 'CASE_CONFERENCE',
    participants: '',
  });

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const participantsArray = textData.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          type: textData.type,
          participants: participantsArray,
          textContent: textData.textContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to create interaction');

      setTextData({ type: 'NOTE', participants: '', textContent: '' });
      setOpen(false);
      onInteractionAdded();
    } catch (error) {
      console.error('Error creating interaction:', error);
      alert('Failed to create interaction');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('caseId', caseId);
      formData.append('type', audioData.type);
      const participantsArray = audioData.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);
      formData.append('participants', JSON.stringify(participantsArray));

      const response = await fetch('/api/interactions/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to transcribe audio');

      setAudioFile(null);
      setAudioData({ type: 'CASE_CONFERENCE', participants: '' });
      setOpen(false);
      onInteractionAdded();
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Interaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Interaction</DialogTitle>
          <DialogDescription>
            Record a new case interaction from text or audio
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="audio">Upload Audio</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Interaction Type</Label>
                <Select
                  value={textData.type}
                  onValueChange={(value) => setTextData({ ...textData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                    <SelectItem value="IN_PERSON_MEETING">
                      In-Person Meeting
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants">Participants (comma-separated)</Label>
                <Input
                  id="participants"
                  value={textData.participants}
                  onChange={(e) =>
                    setTextData({ ...textData, participants: e.target.value })
                  }
                  placeholder="e.g., Worker, Employer, GP, Consultant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="textContent">Content</Label>
                <Textarea
                  id="textContent"
                  required
                  rows={10}
                  value={textData.textContent}
                  onChange={(e) =>
                    setTextData({ ...textData, textContent: e.target.value })
                  }
                  placeholder="Paste email content, meeting notes, or case notes here..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Create Interaction'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="audio" className="space-y-4">
            <form onSubmit={handleAudioSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audioType">Interaction Type</Label>
                <Select
                  value={audioData.type}
                  onValueChange={(value) => setAudioData({ ...audioData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="IN_PERSON_MEETING">
                      In-Person Meeting
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioParticipants">
                  Participants (comma-separated)
                </Label>
                <Input
                  id="audioParticipants"
                  value={audioData.participants}
                  onChange={(e) =>
                    setAudioData({ ...audioData, participants: e.target.value })
                  }
                  placeholder="e.g., Worker, Employer, GP, Consultant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioFile">Audio File (MP3, M4A, max 25MB)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="audioFile"
                    type="file"
                    accept=".mp3,.m4a,.wav"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                  {audioFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAudioFile(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {audioFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {audioFile.name} (
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Processing will include:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Audio transcription using OpenAI Whisper</li>
                  <li>AI-generated summary and structure</li>
                  <li>Automatic action item extraction</li>
                  <li>Task creation from identified actions</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  This may take 10-30 seconds depending on file size.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !audioFile}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
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

