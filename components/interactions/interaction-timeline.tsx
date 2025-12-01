'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Phone,
  Users,
  Mail,
  FileText,
  Video,
} from 'lucide-react';

interface Interaction {
  id: string;
  type: string;
  dateTime: Date;
  participants: string[];
  aiSummary?: string | null;
  transcriptText?: string | null;
}

interface InteractionTimelineProps {
  interactions: Interaction[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'PHONE_CALL':
      return <Phone className="h-4 w-4" />;
    case 'CASE_CONFERENCE':
      return <Video className="h-4 w-4" />;
    case 'IN_PERSON_MEETING':
      return <Users className="h-4 w-4" />;
    case 'EMAIL':
      return <Mail className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'PHONE_CALL':
      return 'bg-blue-500';
    case 'CASE_CONFERENCE':
      return 'bg-purple-500';
    case 'IN_PERSON_MEETING':
      return 'bg-green-500';
    case 'EMAIL':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

export function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  if (interactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No interactions recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction, index) => (
        <Card key={interaction.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div
                className={`p-2 rounded-full ${getTypeColor(
                  interaction.type
                )} text-white`}
              >
                {getTypeIcon(interaction.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {interaction.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(interaction.dateTime), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>

                {interaction.participants.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {interaction.participants.map((participant, i) => (
                      <Badge key={i} variant="secondary">
                        {participant}
                      </Badge>
                    ))}
                  </div>
                )}

                {interaction.aiSummary && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">AI Summary</p>
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: interaction.aiSummary.replace(/\n/g, '<br />'),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

