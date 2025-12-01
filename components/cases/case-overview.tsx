'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  };
}

export function CaseOverview({ caseData }: CaseOverviewProps) {
  const contacts = caseData.keyContacts as Record<string, string>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{caseData.workerName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Claim #{caseData.claimNumber}
            </p>
          </div>
          <Badge
            className={
              caseData.status === 'ACTIVE'
                ? 'bg-green-500'
                : caseData.status === 'ON_HOLD'
                ? 'bg-yellow-500'
                : 'bg-gray-500'
            }
          >
            {caseData.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Insurer</p>
            <p className="mt-1">{caseData.insurerName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Employer</p>
            <p className="mt-1">{caseData.employerName}</p>
          </div>
        </div>

        {caseData.currentCapacitySummary && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Current Capacity
              </p>
              <p className="text-sm">{caseData.currentCapacitySummary}</p>
            </div>
          </>
        )}

        <Separator />
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Key Contacts</p>
          <div className="space-y-2 text-sm">
            {contacts.insurer_case_manager && (
              <div>
                <span className="text-muted-foreground">Insurer CM:</span>{' '}
                {contacts.insurer_case_manager}
              </div>
            )}
            {contacts.employer_contact && (
              <div>
                <span className="text-muted-foreground">Employer:</span>{' '}
                {contacts.employer_contact}
              </div>
            )}
            {contacts.gp && (
              <div>
                <span className="text-muted-foreground">GP:</span> {contacts.gp}
              </div>
            )}
            {contacts.specialist && (
              <div>
                <span className="text-muted-foreground">Specialist:</span>{' '}
                {contacts.specialist}
              </div>
            )}
            {contacts.physio && (
              <div>
                <span className="text-muted-foreground">Physio:</span> {contacts.physio}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

