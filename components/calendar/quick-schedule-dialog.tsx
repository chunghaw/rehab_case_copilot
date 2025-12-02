'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Participant {
  id: string;
  role: string;
  name: string;
}

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  caseId?: string;
  onScheduled: () => void;
}

export function QuickScheduleDialog({
  open,
  onOpenChange,
  selectedDate,
  caseId,
  onScheduled,
}: QuickScheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<Array<{ id: string; workerName: string; claimNumber: string }>>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [formData, setFormData] = useState({
    caseId: caseId || '',
    type: 'IN_PERSON_MEETING',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: '09:00',
    selectedParticipantIds: [] as string[],
    description: '',
    isTask: false,
  });

  useEffect(() => {
    if (open) {
      if (caseId) {
        fetchParticipants();
      } else {
        fetchCases();
      }
      if (selectedDate) {
        setFormData(prev => ({
          ...prev,
          date: format(selectedDate, 'yyyy-MM-dd'),
        }));
      }
    }
  }, [open, caseId, selectedDate]);

  useEffect(() => {
    if (formData.caseId && open) {
      fetchParticipants();
    }
  }, [formData.caseId, open]);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchParticipants = async () => {
    if (!formData.caseId) return;
    try {
      const response = await fetch(`/api/cases/${formData.caseId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
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
      if (formData.isTask) {
        // Create a task
        const dueDateTime = new Date(`${formData.date}T${formData.time}`);
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: formData.caseId,
            description: formData.description || 'Task reminder',
            dueDate: dueDateTime.toISOString(),
            assignedToParticipantId: formData.selectedParticipantIds[0] || null,
          }),
        });

        if (!response.ok) throw new Error('Failed to create task');
      } else {
        // Create a scheduled interaction
        const scheduledDateTime = new Date(`${formData.date}T${formData.time}`);
        const response = await fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: formData.caseId,
            type: formData.type,
            participantIds: formData.selectedParticipantIds,
            textContent: formData.description || `${formData.type.replace('_', ' ')} scheduled`,
            isScheduled: true,
            scheduledDateTime: scheduledDateTime.toISOString(),
          }),
        });

        if (!response.ok) throw new Error('Failed to schedule interaction');
      }

      onScheduled();
      onOpenChange(false);
      setFormData({
        caseId: caseId || '',
        type: 'IN_PERSON_MEETING',
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        time: '09:00',
        selectedParticipantIds: [],
        description: '',
        isTask: false,
      });
    } catch (error) {
      console.error('Error scheduling:', error);
      alert('Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Event</DialogTitle>
          <DialogDescription>
            Create a meeting, call, or task reminder
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!caseId && (
            <div className="space-y-2">
              <Label htmlFor="caseId">Case</Label>
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
            </div>
          )}

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isTask"
                  checked={formData.isTask}
                  onCheckedChange={(checked) => setFormData({ ...formData, isTask: checked as boolean })}
                />
                <Label htmlFor="isTask" className="font-normal cursor-pointer">
                  Task Reminder
                </Label>
              </div>
            </div>
            {!formData.isTask && (
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_PERSON_MEETING">In-Person Meeting</SelectItem>
                  <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                  <SelectItem value="CASE_CONFERENCE">Case Conference</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          {formData.caseId && (
            <div className="space-y-2">
              <Label>Participants (Optional)</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No participants added yet
                  </p>
                ) : (
                  participants.map((participant) => {
                    const roleLabel = participant.role.replace('_', ' ');
                    const isSelected = formData.selectedParticipantIds.includes(participant.id);
                    return (
                      <div key={participant.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`schedule-participant-${participant.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                selectedParticipantIds: [...formData.selectedParticipantIds, participant.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedParticipantIds: formData.selectedParticipantIds.filter(id => id !== participant.id),
                              });
                            }
                          }}
                        />
                        <Label
                          htmlFor={`schedule-participant-${participant.id}`}
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
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any notes or details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

