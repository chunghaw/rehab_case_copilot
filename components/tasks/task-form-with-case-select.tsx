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
import { Plus, Loader2, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Case {
  id: string;
  workerName: string;
  claimNumber: string;
}

interface TaskFormWithCaseSelectProps {
  onTaskSaved: () => void;
}

export function TaskFormWithCaseSelect({ onTaskSaved }: TaskFormWithCaseSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [participants, setParticipants] = useState<Array<{ id: string; role: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    caseId: '',
    description: '',
    dueDate: '',
    assignedToParticipantId: '',
    details: '',
  });

  useEffect(() => {
    if (open) {
      fetchCases();
    }
  }, [open]);

  useEffect(() => {
    if (formData.caseId) {
      fetchParticipants();
    } else {
      setParticipants([]);
    }
  }, [formData.caseId]);

  const fetchParticipants = async () => {
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
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: formData.caseId,
          description: formData.description,
          dueDate: formData.dueDate || null,
          assignedToParticipantId: formData.assignedToParticipantId || null,
          details: formData.details || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      setOpen(false);
      setFormData({ caseId: '', description: '', dueDate: '', assignedToParticipantId: '', details: '' });
      setParticipants([]);
      onTaskSaved();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to track
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToParticipantId">Assigned To (Optional)</Label>
            {formData.caseId ? (
              participants.length > 0 ? (
                <Select
                  value={formData.assignedToParticipantId}
                  onValueChange={(value) => setFormData({ ...formData, assignedToParticipantId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {participants.map((participant) => {
                      const roleLabel = participant.role.replace('_', ' ');
                      return (
                        <SelectItem key={participant.id} value={participant.id}>
                          {roleLabel}: {participant.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No participants added for this case. Add them in Case Overview.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a case first to assign a participant
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Details / Notes (Optional)</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Add any additional details or notes about this task..."
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.caseId}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

