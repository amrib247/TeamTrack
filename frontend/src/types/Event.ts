export interface Event {
  id: string;
  teamId: string;
  name: string;
  tournamentLeague: string;
  date: string; // ISO date string
  startTime: string;
  lengthMinutes: number;
  location: string;
  description?: string;
  score?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  teamId: string;
  name: string;
  tournamentLeague: string;
  date: string;
  startTime: string;
  lengthMinutes: number;
  location: string;
  description?: string;
  score?: string;
}

export interface UpdateEventRequest {
  name?: string;
  tournamentLeague?: string;
  date?: string;
  startTime?: string;
  lengthMinutes?: number;
  location?: string;
  score?: string;
}

