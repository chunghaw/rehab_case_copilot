'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
  highlightedDate?: Date | null;
}

export function CalendarView({ events, onEventClick, onDayClick, highlightedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = getDay(monthStart);
  
  // Create array with empty cells for days before month starts
  const daysArray = [
    ...Array(firstDayOfWeek).fill(null),
    ...daysInMonth,
  ];

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = event.scheduledDateTime 
        ? new Date(event.scheduledDateTime)
        : new Date(event.dateTime);
      return isSameDay(eventDate, date);
    });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'CASE_CONFERENCE':
        return { color: 'bg-purple-500/10 text-purple-600 border-purple-200', label: 'Conference' };
      case 'IN_PERSON_MEETING':
        return { color: 'bg-green-500/10 text-green-600 border-green-200', label: 'Meeting' };
      case 'PHONE_CALL':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-200', label: 'Call' };
      case 'EMAIL':
        return { color: 'bg-orange-500/10 text-orange-600 border-orange-200', label: 'Email' };
      case 'NOTE':
        return { color: 'bg-gray-500/10 text-gray-600 border-gray-200', label: 'Note' };
      default:
        return { color: 'bg-gray-500/10 text-gray-600 border-gray-200', label: type };
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {events.filter((e) => e.isScheduled).length} scheduled, {events.filter((e) => !e.isScheduled).length} past
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((day, index) => {
            const isCurrentMonth = day && isSameMonth(day, currentMonth);
            const isToday = day && isSameDay(day, new Date());
            const isHighlighted = day && highlightedDate && isSameDay(day, highlightedDate);
            const dayEvents = day ? getEventsForDay(day) : [];

            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'aspect-square rounded-lg border border-border/60 p-1.5 transition-colors',
                  isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                  isToday && 'ring-2 ring-primary',
                  isHighlighted && 'ring-2 ring-chart-4 bg-chart-4/10',
                  (dayEvents.length > 0 || onDayClick) && 'hover:bg-accent/50 cursor-pointer'
                )}
                onClick={() => {
                  if (dayEvents.length > 0 && onEventClick) {
                    onEventClick(dayEvents[0]);
                  } else if (dayEvents.length === 0 && onDayClick && isCurrentMonth) {
                    onDayClick(day);
                  }
                }}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={cn(
                      'text-xs font-medium mb-1',
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
                      isToday && 'text-primary font-semibold'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex-1 overflow-hidden space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => {
                      const config = getTypeConfig(event.type);
                      const eventDate = event.scheduledDateTime 
                        ? new Date(event.scheduledDateTime)
                        : new Date(event.dateTime);
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded border truncate',
                            config.color,
                            event.isScheduled && 'font-semibold'
                          )}
                          title={`${config.label} - ${format(eventDate, 'h:mm a')} - ${event.case?.workerName || ''}`}
                        >
                          {format(eventDate, 'h:mm')} {config.label}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-border/60 bg-muted/30">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-purple-500/10 border border-purple-200"></div>
            <span>Conference</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-500/10 border border-green-200"></div>
            <span>Meeting</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-blue-500/10 border border-blue-200"></div>
            <span>Call</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Bold</span>
            <span>= Scheduled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

