'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, User, Briefcase, Users, Phone, Mail, Loader2, Edit2, Check, X } from 'lucide-react';
import { ParticipantEditor } from './participant-editor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CaseOverviewProps {
  caseData: {
    id: string;
    workerName: string;
    claimNumber: string;
    insurerName: string;
    employerName: string;
    status: string;
    currentCapacitySummary?: string | null;
    nextKeyDate?: Date | null;
    keyContacts: any;
    participants?: Array<{
      id: string;
      role: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    }>;
  };
  onStatusChange?: () => void;
}

export function CaseOverview({ caseData, onStatusChange }: CaseOverviewProps) {
  const [status, setStatus] = useState(caseData.status);
  const [updating, setUpdating] = useState(false);
  const [participants, setParticipants] = useState(caseData.participants || []);
  const [editingInsurer, setEditingInsurer] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [insurerName, setInsurerName] = useState(caseData.insurerName);
  const [employerName, setEmployerName] = useState(caseData.employerName);
  const [currentCapacity, setCurrentCapacity] = useState(caseData.currentCapacitySummary || '');
  const [savingName, setSavingName] = useState(false);
  const contacts = caseData.keyContacts as Record<string, string>;

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/cases/${caseData.id}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [caseData.id]);

  useEffect(() => {
    setInsurerName(caseData.insurerName);
    setEmployerName(caseData.employerName);
    setCurrentCapacity(caseData.currentCapacitySummary || '');
  }, [caseData.insurerName, caseData.employerName, caseData.currentCapacitySummary]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setStatus(newStatus);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update case status');
      setStatus(caseData.status); // Revert on error
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveInsurer = async () => {
    if (!insurerName.trim()) {
      alert('Insurer name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insurerName: insurerName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to update insurer name');

      setEditingInsurer(false);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating insurer name:', error);
      alert('Failed to update insurer name');
      setInsurerName(caseData.insurerName); // Revert on error
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveEmployer = async () => {
    if (!employerName.trim()) {
      alert('Employer name cannot be empty');
      return;
    }
    setSavingName(true);
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerName: employerName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to update employer name');

      setEditingEmployer(false);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating employer name:', error);
      alert('Failed to update employer name');
      setEmployerName(caseData.employerName); // Revert on error
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveCapacity = async () => {
    setSavingName(true);
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCapacitySummary: currentCapacity.trim() || null }),
      });

      if (!response.ok) throw new Error('Failed to update current capacity');

      setEditingCapacity(false);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating current capacity:', error);
      alert('Failed to update current capacity');
      setCurrentCapacity(caseData.currentCapacitySummary || ''); // Revert on error
    } finally {
      setSavingName(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'bg-green-500/15 text-green-700 border-green-200',
          dot: 'bg-green-500',
          label: 'Active',
        };
      case 'ON_HOLD':
        return {
          color: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
          dot: 'bg-yellow-500',
          label: 'On Hold',
        };
      case 'CLOSED':
        return {
          color: 'bg-gray-500/15 text-gray-600 border-gray-200',
          dot: 'bg-gray-400',
          label: 'Closed',
        };
      default:
        return {
          color: 'bg-gray-500/15 text-gray-600 border-gray-200',
          dot: 'bg-gray-400',
          label: status,
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  const contactsList = [
    { key: 'insurer_case_manager', label: 'Insurer CM', icon: Building2 },
    { key: 'employer_contact', label: 'Employer', icon: Briefcase },
    { key: 'gp', label: 'GP', icon: User },
    { key: 'specialist', label: 'Specialist', icon: User },
    { key: 'physio', label: 'Physio', icon: User },
  ].filter((c) => contacts[c.key]);

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/60 bg-gradient-to-r from-card to-accent/20">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Case Overview
          </h3>
          <div className="flex items-center gap-2">
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className={`h-8 w-32 ${statusConfig.color} border`}>
                  <SelectValue>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}></span>
                      {statusConfig.label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="ON_HOLD">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                      On Hold
                    </span>
                  </SelectItem>
                  <SelectItem value="CLOSED">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                      Closed
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-3.5">
          {/* Insurer - Editable */}
          <div className="flex items-center gap-3 text-sm group p-2.5 rounded-lg hover:bg-accent/30 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-1/10 ring-1 ring-chart-1/20">
              <Building2 className="h-4.5 w-4.5 text-chart-1" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Insurer</p>
              {editingInsurer ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={insurerName}
                    onChange={(e) => setInsurerName(e.target.value)}
                    className="h-8 text-sm font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInsurer();
                      if (e.key === 'Escape') {
                        setInsurerName(caseData.insurerName);
                        setEditingInsurer(false);
                      }
                    }}
                    disabled={savingName}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveInsurer}
                    disabled={savingName}
                    className="h-8 w-8 p-0"
                  >
                    {savingName ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInsurerName(caseData.insurerName);
                      setEditingInsurer(false);
                    }}
                    disabled={savingName}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">{insurerName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingInsurer(true)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {/* Employer - Editable */}
          <div className="flex items-center gap-3 text-sm group p-2.5 rounded-lg hover:bg-accent/30 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-2/10 ring-1 ring-chart-2/20">
              <Briefcase className="h-4.5 w-4.5 text-chart-2" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Employer</p>
              {editingEmployer ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    className="h-8 text-sm font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEmployer();
                      if (e.key === 'Escape') {
                        setEmployerName(caseData.employerName);
                        setEditingEmployer(false);
                      }
                    }}
                    disabled={savingName}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveEmployer}
                    disabled={savingName}
                    className="h-8 w-8 p-0"
                  >
                    {savingName ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmployerName(caseData.employerName);
                      setEditingEmployer(false);
                    }}
                    disabled={savingName}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">{employerName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEmployer(true)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Capacity - Editable */}
      <div className="p-5 border-b border-border/60 bg-accent/20 group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Current Capacity
              </p>
              {!editingCapacity && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCapacity(true)}
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            {editingCapacity ? (
              <div className="space-y-2">
                <Textarea
                  value={currentCapacity}
                  onChange={(e) => setCurrentCapacity(e.target.value)}
                  className="text-sm min-h-[80px] resize-none"
                  placeholder="Enter current capacity summary..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setCurrentCapacity(caseData.currentCapacitySummary || '');
                      setEditingCapacity(false);
                    }
                  }}
                  disabled={savingName}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveCapacity}
                    disabled={savingName}
                    className="h-7 px-2 text-xs gap-1.5"
                  >
                    {savingName ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentCapacity(caseData.currentCapacitySummary || '');
                      setEditingCapacity(false);
                    }}
                    disabled={savingName}
                    className="h-7 px-2 text-xs gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">
                {currentCapacity || <span className="text-muted-foreground italic">No capacity summary yet. Click edit to add one.</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Participants
          </p>
        </div>
        <ParticipantEditor
          caseId={caseData.id}
          participants={participants}
          onParticipantsUpdated={fetchParticipants}
        />
      </div>
    </div>
  );
}
