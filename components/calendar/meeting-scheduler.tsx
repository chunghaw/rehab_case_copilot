'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2, Plus, Clock } from 'lucide-react';

interface MeetingSchedulerProps {
  caseId: string;
  onMeetingScheduled: () => void;
}

export function MeetingScheduler({ caseId, onMeetingScheduled }: MeetingSchedulerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'CASE_CONFERENCE',
    participants: '',
    scheduledDateTime: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const participantsArray = formData.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      const scheduledDate = new Date(formData.scheduledDateTime);

      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          type: formData.type,
          participants: participantsArray,
          dateTime: scheduledDate.toISOString(),
          isScheduled: true,
          scheduledDateTime: scheduledDate.toISOString(),
          textContent: `Scheduled ${formData.type.replace(/_/g, ' ').toLowerCase()} meeting`,
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule meeting');

      setFormData({ type: 'CASE_CONFERENCE', participants: '', scheduledDateTime: '' });
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
        <Button variant="outline" size="sm" className="gap-2">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.scheduledDateTime}>
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

