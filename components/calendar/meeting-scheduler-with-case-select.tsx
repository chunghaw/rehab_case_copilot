'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2, Clock } from 'lucide-react';

interface Case {
  id: string;
  workerName: string;
  claimNumber: string;
}

interface MeetingSchedulerWithCaseSelectProps {
  onMeetingScheduled: () => void;
}

export function MeetingSchedulerWithCaseSelect({ onMeetingScheduled }: MeetingSchedulerWithCaseSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [formData, setFormData] = useState({
    caseId: '',
    type: 'CASE_CONFERENCE',
    participants: '',
    scheduledDateTime: '',
    details: '',
  });

  useEffect(() => {
    if (open) {
      fetchCases();
    }
  }, [open]);

  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const response = await fetch('/api/cases');
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      setCases(data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId) {
      alert('Please select a case');
      return;
    }
    setLoading(true);

    try {
      const participantsArray = formData.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      const scheduledDate = new Date(formData.scheduledDateTime);

      const textContent = formData.details
        ? `Scheduled ${formData.type.replace(/_/g, ' ').toLowerCase()} meeting\n\nDetails:\n${formData.details}`
        : `Scheduled ${formData.type.replace(/_/g, ' ').toLowerCase()} meeting`;

      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: formData.caseId,
          type: formData.type,
          participants: participantsArray,
          dateTime: scheduledDate.toISOString(),
          isScheduled: true,
          scheduledDateTime: scheduledDate.toISOString(),
          textContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule meeting');

      setFormData({ caseId: '', type: 'CASE_CONFERENCE', participants: '', scheduledDateTime: '', details: '' });
      setOpen(false);
      onMeetingScheduled();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime (now)
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Calendar className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Create a scheduled meeting that will appear on your calendar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caseId">Case</Label>
            {loadingCases ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={formData.caseId}
                onValueChange={(value) => setFormData({ ...formData, caseId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.workerName} - Claim #{caseItem.claimNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Meeting Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                <SelectItem value="IN_PERSON_MEETING">In-Person Meeting</SelectItem>
                <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Participants</Label>
            <Input
              id="participants"
              value={formData.participants}
              onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
              placeholder="e.g., Worker, Employer, GP, Consultant"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDateTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </Label>
            <Input
              id="scheduledDateTime"
              type="datetime-local"
              value={formData.scheduledDateTime}
              onChange={(e) => setFormData({ ...formData, scheduledDateTime: e.target.value })}
              min={minDateTime}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Details / Notes (Optional)</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Add any additional details, agenda items, or notes about this meeting..."
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.caseId || !formData.scheduledDateTime}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

