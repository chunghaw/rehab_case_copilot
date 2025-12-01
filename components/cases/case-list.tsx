'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';

interface Case {
  id: string;
  workerName: string;
  claimNumber: string;
  insurerName: string;
  employerName: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'CLOSED';
  nextKeyDate?: Date | null;
  updatedAt: Date;
  _count?: {
    interactions: number;
    tasks: number;
  };
}

interface CaseListProps {
  cases: Case[];
}

export function CaseList({ cases }: CaseListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'ON_HOLD':
        return 'bg-yellow-500';
      case 'CLOSED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cases.map((caseItem) => (
        <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{caseItem.workerName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Claim: {caseItem.claimNumber}
                </p>
              </div>
              <Badge className={getStatusColor(caseItem.status)}>
                {caseItem.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Insurer</p>
                <p className="font-medium">{caseItem.insurerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Employer</p>
                <p className="font-medium">{caseItem.employerName}</p>
              </div>
              {caseItem.nextKeyDate && (
                <div>
                  <p className="text-muted-foreground">Next Key Date</p>
                  <p className="font-medium">
                    {format(new Date(caseItem.nextKeyDate), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}
              {caseItem._count && (
                <div className="flex gap-4 pt-2">
                  <div>
                    <span className="text-muted-foreground">Interactions: </span>
                    <span className="font-medium">{caseItem._count.interactions}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tasks: </span>
                    <span className="font-medium">{caseItem._count.tasks}</span>
                  </div>
                </div>
              )}
            </div>
            <Link href={`/cases/${caseItem.id}`} className="block mt-4">
              <Button className="w-full" variant="outline">
                View Case
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

