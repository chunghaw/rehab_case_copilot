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
} from '@/components/ui/dialog';
import { Calendar, Clock, Users, Loader2 } from 'lucide-react';
import { format, parse } from 'date-fns';

// DetectedMeeting type definition (shared with interaction-timeline)
export interface DetectedMeeting {
  date?: string;
  time?: string;
  type?: 'IN_PERSON_MEETING' | 'PHONE_CALL' | 'CASE_CONFERENCE';
  description?: string;
  participants?: string[];
}

interface MeetingDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectedMeeting: DetectedMeeting | null;
  caseId: string;
  onConfirm: () => void;
}

export function MeetingDetectionDialog({
  open,
  onOpenChange,
  detectedMeeting,
  caseId,
  onConfirm,
}: MeetingDetectionDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!detectedMeeting) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Parse date - handle relative dates like "next Monday"
      let scheduledDate: Date;
      if (detectedMeeting.date) {
        // Try to parse as ISO date first
        if (detectedMeeting.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          scheduledDate = new Date(detectedMeeting.date);
        } else {
          // For relative dates, use a simple heuristic
          // In production, you'd want more sophisticated date parsing
          const today = new Date();
          scheduledDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to next week
        }
      } else {
        scheduledDate = new Date();
      }

      // Parse time
      let scheduledDateTime = scheduledDate;
      if (detectedMeeting.time) {
        const [hours, minutes] = detectedMeeting.time.split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
      } else {
        scheduledDateTime.setHours(9, 0, 0, 0); // Default to 9 AM
      }

      const type = detectedMeeting.type || 'IN_PERSON_MEETING';
      const description = detectedMeeting.description || `${type.replace('_', ' ')} scheduled`;

      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          type,
          participantIds: [], // Will need to be selected by user or extracted
          textContent: description,
          isScheduled: true,
          scheduledDateTime: scheduledDateTime.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule meeting');

      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type?: string) => {
    if (!type) return 'Meeting';
    return type.replace('_', ' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Meeting Detected
          </DialogTitle>
          <DialogDescription>
            We detected a meeting mentioned in this interaction. Would you like to add it to your calendar?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {detectedMeeting.date && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{detectedMeeting.date}</p>
              </div>
            </div>
          )}
          {detectedMeeting.time && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium">{detectedMeeting.time}</p>
              </div>
            </div>
          )}
          {detectedMeeting.type && (
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium">{getTypeLabel(detectedMeeting.type)}</p>
              </div>
            </div>
          )}
          {detectedMeeting.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{detectedMeeting.description}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Dismiss
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add to Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

