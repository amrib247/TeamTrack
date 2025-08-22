export interface Task {
  id: string;
  teamId: string;
  name: string;
  location: string;
  description: string;
  date: string;
  startTime: string;
  maxSignups: number;
  minSignups: number;
  signedUpUserIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Helper methods (these will be computed properties)
  getCurrentSignups?: number;
  isFull?: boolean;
  hasMinimumSignups?: boolean;
  isUserSignedUp?: (userId: string) => boolean;
  canSignUp?: boolean;
}

export interface CreateTaskRequest {
  teamId: string;
  name: string;
  location: string;
  description: string;
  date: string;
  startTime: string;
  maxSignups: number;
  minSignups: number;
  createdBy: string;
}

export interface TaskUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}
