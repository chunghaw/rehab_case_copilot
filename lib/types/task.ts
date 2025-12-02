export interface Task {
  id: string;
  description: string;
  dueDate?: Date | null;
  status: 'PENDING' | 'DONE' | 'OVERDUE';
  assignedToParticipant?: {
    id: string;
    role: string;
    name: string;
  } | null;
  case?: {
    id: string;
    workerName: string;
    claimNumber: string;
  };
}

