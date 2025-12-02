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
import { Plus, Edit2, Trash2, Loader2, Building2, Briefcase, User, Stethoscope, Users, Phone, Mail } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Participant {
  id: string;
  role: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

interface ParticipantEditorProps {
  caseId: string;
  participants: Participant[];
  onParticipantsUpdated: () => void;
}

const roleConfig: Record<string, { label: string; icon: any }> = {
  INSURER_CM: { label: 'Insurer Case Manager', icon: Building2 },
  EMPLOYER: { label: 'Employer', icon: Briefcase },
  GP: { label: 'GP', icon: User },
  SPECIALIST: { label: 'Specialist', icon: Stethoscope },
  PHYSIO: { label: 'Physio', icon: Users },
  CONSULTANT: { label: 'Consultant', icon: User },
  OTHER: { label: 'Other', icon: User },
};

const roleOptions = [
  'INSURER_CM',
  'EMPLOYER',
  'GP',
  'SPECIALIST',
  'PHYSIO',
  'CONSULTANT',
  'OTHER',
];

export function ParticipantEditor({
  caseId,
  participants,
  onParticipantsUpdated,
}: ParticipantEditorProps) {
  const [open, setOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: 'INSURER_CM',
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      role: 'INSURER_CM',
      name: '',
      email: '',
      phone: '',
      notes: '',
    });
    setEditingParticipant(null);
  };

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormData({
      role: participant.role,
      name: participant.name,
      email: participant.email || '',
      phone: participant.phone || '',
      notes: participant.notes || '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingParticipant
        ? `/api/cases/${caseId}/participants/${editingParticipant.id}`
        : `/api/cases/${caseId}/participants`;

      const method = editingParticipant ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formData.role,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to save participant');

      resetForm();
      setOpen(false);
      onParticipantsUpdated();
    } catch (error) {
      console.error('Error saving participant:', error);
      alert('Failed to save participant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingParticipant) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/cases/${caseId}/participants/${deletingParticipant.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete participant');

      setDeletingParticipant(null);
      onParticipantsUpdated();
    } catch (error) {
      console.error('Error deleting participant:', error);
      alert('Failed to delete participant');
    } finally {
      setLoading(false);
    }
  };

  // Group participants by role
  const participantsByRole = participants.reduce((acc, p) => {
    if (!acc[p.role]) acc[p.role] = [];
    acc[p.role].push(p);
    return acc;
  }, {} as Record<string, Participant[]>);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Participant
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingParticipant ? 'Edit Participant' : 'Add Participant'}
            </DialogTitle>
            <DialogDescription>
              Add or edit a participant for this case
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleConfig[role]?.label || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingParticipant ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingParticipant} onOpenChange={(open) => !open && setDeletingParticipant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingParticipant?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        {Object.entries(participantsByRole).map(([role, roleParticipants]) => {
          const config = roleConfig[role] || { label: role, icon: User };
          const Icon = config.icon;
          return (
            <div key={role} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-4 w-4" />
                {config.label}
              </div>
              <div className="space-y-2 pl-6">
                {roleParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{participant.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {participant.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {participant.email}
                          </span>
                        )}
                        {participant.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {participant.phone}
                          </span>
                        )}
                      </div>
                      {participant.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{participant.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(participant)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingParticipant(participant)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {participants.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No participants added yet. Click "Add Participant" to get started.
          </div>
        )}
      </div>
    </>
  );
}

