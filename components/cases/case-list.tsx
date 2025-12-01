'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { Search, Calendar, MessageSquare, CheckSquare } from 'lucide-react';

interface Case {
  id: string;
  workerName: string;
  claimNumber: string;
  insurerName: string;
  employerName: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'CLOSED';
  currentCapacitySummary?: string | null;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredCases = useMemo(() => {
    return cases.filter((caseItem) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        caseItem.workerName.toLowerCase().includes(searchLower) ||
        caseItem.claimNumber.toLowerCase().includes(searchLower) ||
        caseItem.insurerName.toLowerCase().includes(searchLower) ||
        caseItem.employerName.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'ALL' || caseItem.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cases, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'ON_HOLD':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'CLOSED':
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const statusCounts = useMemo(() => {
    return {
      ALL: cases.length,
      ACTIVE: cases.filter(c => c.status === 'ACTIVE').length,
      ON_HOLD: cases.filter(c => c.status === 'ON_HOLD').length,
      CLOSED: cases.filter(c => c.status === 'CLOSED').length,
    };
  }, [cases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by worker, claim number, insurer, or employer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'ACTIVE', 'ON_HOLD', 'CLOSED'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="whitespace-nowrap"
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              <Badge variant="secondary" className="ml-2 text-xs">
                {statusCounts[status]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </p>
      )}

      {filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cases found matching your criteria.</p>
          <Button 
            variant="link" 
            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {caseItem.workerName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-mono">
                        #{caseItem.claimNumber}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(caseItem.status)}>
                      {caseItem.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Insurer</p>
                        <p className="font-medium truncate">{caseItem.insurerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">Employer</p>
                        <p className="font-medium truncate">{caseItem.employerName}</p>
                      </div>
                    </div>
                    
                    {caseItem.currentCapacitySummary && (
                      <p className="text-muted-foreground text-xs line-clamp-2 border-t pt-2">
                        {caseItem.currentCapacitySummary}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {caseItem._count && (
                          <>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {caseItem._count.interactions}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckSquare className="h-3.5 w-3.5" />
                              {caseItem._count.tasks}
                            </span>
                          </>
                        )}
                      </div>
                      {caseItem.nextKeyDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(caseItem.nextKeyDate), 'dd MMM')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
