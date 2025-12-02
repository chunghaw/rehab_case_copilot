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
import { Building2, User, Briefcase, Users, Phone, Mail, Loader2 } from 'lucide-react';
import { ParticipantEditor } from './participant-editor';

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
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
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
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10">
              <Building2 className="h-4 w-4 text-chart-1" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Insurer</p>
              <p className="font-medium">{caseData.insurerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10">
              <Briefcase className="h-4 w-4 text-chart-2" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Employer</p>
              <p className="font-medium">{caseData.employerName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Capacity */}
      {caseData.currentCapacitySummary && (
        <div className="p-6 border-b border-border/60 bg-accent/30">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Current Capacity
          </p>
          <p className="text-sm leading-relaxed">{caseData.currentCapacitySummary}</p>
        </div>
      )}

      {/* Participants */}
      <div className="p-6 border-t border-border/60">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
