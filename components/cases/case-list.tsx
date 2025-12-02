'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowRight, Calendar, MessageSquare, CheckSquare } from 'lucide-react';

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cases.map((caseItem, index) => {
        const statusConfig = getStatusConfig(caseItem.status);
        
        return (
          <Link
            key={caseItem.id}
            href={`/cases/${caseItem.id}`}
            className="group animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="h-full rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover-lift transition-smooth">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/5">
                    <span className="text-sm font-semibold text-primary">
                      {getInitials(caseItem.workerName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {caseItem.workerName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {caseItem.claimNumber}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}></span>
                  {statusConfig.label}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Insurer</span>
                  <span className="font-medium text-foreground">{caseItem.insurerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Employer</span>
                  <span className="font-medium text-foreground">{caseItem.employerName}</span>
                </div>
                {caseItem.nextKeyDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next Key Date</span>
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-chart-4" />
                      {format(new Date(caseItem.nextKeyDate), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {caseItem._count && (
                    <>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {caseItem._count.interactions}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {caseItem._count.tasks}
                      </span>
                    </>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View case
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
