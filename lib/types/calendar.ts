export interface CalendarEvent {
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

