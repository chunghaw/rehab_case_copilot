'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, Loader2, User, Building2, Briefcase, Users, Sparkles } from 'lucide-react';

export function CaseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workerName: '',
    claimNumber: '',
    insurerName: '',
    employerName: '',
    currentCapacitySummary: '',
    keyContacts: {
      insurer_case_manager: '',
      employer_contact: '',
      gp: '',
      specialist: '',
      physio: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create case');

      const { case: newCase } = await response.json();
      setOpen(false);
      router.push(`/cases/${newCase.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const updateKeyContact = (key: string, value: string) => {
    setFormData({
      ...formData,
      keyContacts: { ...formData.keyContacts, [key]: value },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-soft">
          <Plus className="h-4 w-4" />
          New Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Create New Case
          </DialogTitle>
          <DialogDescription>
            Enter the details for a new rehabilitation case
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Worker Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="uppercase tracking-wide">Worker Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workerName" className="text-sm font-medium">Worker Name *</Label>
                <Input
                  id="workerName"
                  required
                  value={formData.workerName}
                  onChange={(e) =>
                    setFormData({ ...formData, workerName: e.target.value })
                  }
                  placeholder="Full name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimNumber" className="text-sm font-medium">Claim Number *</Label>
                <Input
                  id="claimNumber"
                  required
                  value={formData.claimNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, claimNumber: e.target.value })
                  }
                  placeholder="e.g., CLM-2024-001"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Organization Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="uppercase tracking-wide">Organization Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurerName" className="text-sm font-medium">Insurer Name *</Label>
                <Input
                  id="insurerName"
                  required
                  value={formData.insurerName}
                  onChange={(e) =>
                    setFormData({ ...formData, insurerName: e.target.value })
                  }
                  placeholder="Insurance company"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerName" className="text-sm font-medium">Employer Name *</Label>
                <Input
                  id="employerName"
                  required
                  value={formData.employerName}
                  onChange={(e) =>
                    setFormData({ ...formData, employerName: e.target.value })
                  }
                  placeholder="Employer company"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Current Capacity */}
          <div className="space-y-2">
            <Label htmlFor="currentCapacitySummary" className="text-sm font-medium">
              Current Capacity Summary
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <Textarea
              id="currentCapacitySummary"
              value={formData.currentCapacitySummary}
              onChange={(e) =>
                setFormData({ ...formData, currentCapacitySummary: e.target.value })
              }
              placeholder="Brief description of worker's current work capacity..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Key Contacts Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="uppercase tracking-wide">Key Contacts</span>
              <span className="text-xs font-normal">(optional)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurerCM" className="text-sm font-medium">Insurer Case Manager</Label>
                <Input
                  id="insurerCM"
                  value={formData.keyContacts.insurer_case_manager}
                  onChange={(e) => updateKeyContact('insurer_case_manager', e.target.value)}
                  placeholder="Name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerContact" className="text-sm font-medium">Employer Contact</Label>
                <Input
                  id="employerContact"
                  value={formData.keyContacts.employer_contact}
                  onChange={(e) => updateKeyContact('employer_contact', e.target.value)}
                  placeholder="Name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gp" className="text-sm font-medium">GP</Label>
                <Input
                  id="gp"
                  value={formData.keyContacts.gp}
                  onChange={(e) => updateKeyContact('gp', e.target.value)}
                  placeholder="Name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialist" className="text-sm font-medium">Specialist</Label>
                <Input
                  id="specialist"
                  value={formData.keyContacts.specialist}
                  onChange={(e) => updateKeyContact('specialist', e.target.value)}
                  placeholder="Name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physio" className="text-sm font-medium">Physiotherapist</Label>
                <Input
                  id="physio"
                  value={formData.keyContacts.physio}
                  onChange={(e) => updateKeyContact('physio', e.target.value)}
                  placeholder="Name"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* AI Hint */}
          <div className="rounded-xl bg-accent/50 p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">AI-Powered Features</p>
              <p className="text-sm text-muted-foreground mt-1">
                Once created, you can add interactions and the AI will automatically extract action items and generate summaries.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Case
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
