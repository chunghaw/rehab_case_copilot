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
import { useRouter } from 'next/navigation';

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">New Case</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Enter the details for the new WorkCover case
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workerName">Worker Name *</Label>
              <Input
                id="workerName"
                required
                value={formData.workerName}
                onChange={(e) =>
                  setFormData({ ...formData, workerName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claimNumber">Claim Number *</Label>
              <Input
                id="claimNumber"
                required
                value={formData.claimNumber}
                onChange={(e) =>
                  setFormData({ ...formData, claimNumber: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="insurerName">Insurer *</Label>
              <Input
                id="insurerName"
                required
                value={formData.insurerName}
                onChange={(e) =>
                  setFormData({ ...formData, insurerName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employerName">Employer *</Label>
              <Input
                id="employerName"
                required
                value={formData.employerName}
                onChange={(e) =>
                  setFormData({ ...formData, employerName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Key Contacts</Label>
            <div className="grid gap-2">
              <Input
                placeholder="Insurer Case Manager"
                value={formData.keyContacts.insurer_case_manager}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keyContacts: {
                      ...formData.keyContacts,
                      insurer_case_manager: e.target.value,
                    },
                  })
                }
              />
              <Input
                placeholder="Employer Contact"
                value={formData.keyContacts.employer_contact}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keyContacts: {
                      ...formData.keyContacts,
                      employer_contact: e.target.value,
                    },
                  })
                }
              />
              <Input
                placeholder="GP"
                value={formData.keyContacts.gp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keyContacts: { ...formData.keyContacts, gp: e.target.value },
                  })
                }
              />
              <Input
                placeholder="Specialist"
                value={formData.keyContacts.specialist}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keyContacts: {
                      ...formData.keyContacts,
                      specialist: e.target.value,
                    },
                  })
                }
              />
              <Input
                placeholder="Physiotherapist"
                value={formData.keyContacts.physio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    keyContacts: { ...formData.keyContacts, physio: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentCapacitySummary">Current Capacity Summary</Label>
            <Textarea
              id="currentCapacitySummary"
              rows={3}
              value={formData.currentCapacitySummary}
              onChange={(e) =>
                setFormData({ ...formData, currentCapacitySummary: e.target.value })
              }
              placeholder="Brief summary of current work capacity..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

