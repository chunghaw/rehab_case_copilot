'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarView } from '@/components/calendar/calendar-view';
import { MeetingSchedulerWithCaseSelect } from '@/components/calendar/meeting-scheduler-with-case-select';
import { QuickScheduleDialog } from '@/components/calendar/quick-schedule-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Calendar, Plus, Clock, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  dateTime: Date;
  type: string;
  participants: string[];
  isScheduled?: boolean;
  scheduledDateTime?: Date | null;
  case?: {
    id: string;
    workerName: string;
    claimNumber: string;
  };
}

export function CalendarPageClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [quickScheduleOpen, setQuickScheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Get highlighted date from URL query parameter
  const dateParam = searchParams.get('date');
  const highlightedDate = dateParam ? new Date(dateParam) : null;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch all interactions (both scheduled and past)
      const response = await fetch('/api/interactions');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      
      // Transform interactions to calendar events
      const calendarEvents: CalendarEvent[] = (data.interactions || []).map((interaction: any) => ({
        id: interaction.id,
        dateTime: new Date(interaction.dateTime),
        type: interaction.type,
        participants: interaction.participants 
          ? interaction.participants.map((p: any) => typeof p === 'string' ? p : `${p.role.replace('_', ' ')}: ${p.name}`)
          : [],
        isScheduled: interaction.isScheduled || false,
        scheduledDateTime: interaction.scheduledDateTime ? new Date(interaction.scheduledDateTime) : null,
        case: interaction.case ? {
          id: interaction.case.id,
          workerName: interaction.case.workerName,
          claimNumber: interaction.case.claimNumber,
        } : undefined,
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'CASE_CONFERENCE':
        return { icon: Users, label: 'Case Conference', color: 'text-purple-600' };
      case 'IN_PERSON_MEETING':
        return { icon: Users, label: 'In-Person Meeting', color: 'text-green-600' };
      case 'PHONE_CALL':
        return { icon: Clock, label: 'Phone Call', color: 'text-blue-600' };
      case 'EMAIL':
        return { icon: FileText, label: 'Email', color: 'text-orange-600' };
      case 'NOTE':
        return { icon: FileText, label: 'Note', color: 'text-gray-600' };
      default:
        return { icon: Calendar, label: type, color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Calendar
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View scheduled meetings and past interactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MeetingSchedulerWithCaseSelect onMeetingScheduled={fetchEvents} />
              <Link href="/cases">
                <Button variant="outline">View Cases</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        <CalendarView
          events={events}
          onEventClick={(event) => setSelectedEvent(event)}
          onDayClick={(date) => {
            setSelectedDate(date);
            setQuickScheduleOpen(true);
          }}
          highlightedDate={highlightedDate || selectedDate}
        />
      </div>

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const config = getTypeConfig(selectedEvent.type);
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      {config.label}
                    </>
                  );
                })()}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent.isScheduled ? 'Scheduled Meeting' : 'Past Interaction'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Date & Time</p>
                <p className="text-sm">
                  {format(
                    selectedEvent.scheduledDateTime || selectedEvent.dateTime,
                    'EEEE, d MMMM yyyy · h:mm a'
                  )}
                </p>
              </div>
              {selectedEvent.case && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Case</p>
                  <Link
                    href={`/cases/${selectedEvent.case.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedEvent.case.workerName} - Claim #{selectedEvent.case.claimNumber}
                  </Link>
                </div>
              )}
              {selectedEvent.participants.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Participants</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.participants.map((participant, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.case && (
                <div className="pt-4 border-t">
                  <Link href={`/cases/${selectedEvent.case.id}`}>
                    <Button className="w-full">View Case Details</Button>
                  </Link>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Schedule Dialog */}
      <QuickScheduleDialog
        open={quickScheduleOpen}
        onOpenChange={setQuickScheduleOpen}
        selectedDate={selectedDate}
        onScheduled={fetchEvents}
      />
    </div>
  );
}

