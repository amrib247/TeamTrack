export interface Event {
  id: string;
  teamId: string;
  name: string;
  tournamentId?: string;
  opposingTeamId?: string;
  date: string; // YYYY-MM-DD in timeZone
  startTime: string; // HH:mm in timeZone
  timeZone: string; // IANA zone when the event was scheduled
  startAtUtc: string; // ISO 8601 UTC instant for reminders and cross-user display
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
  tournamentId?: string;
  opposingTeamId?: string;
  date: string;
  startTime: string;
  timeZone?: string;
  lengthMinutes: number;
  location: string;
  description?: string;
  score?: string;
}

export interface UpdateEventRequest {
  name?: string;
  tournamentId?: string;
  date?: string;
  startTime?: string;
  timeZone?: string;
  lengthMinutes?: number;
  location?: string;
  score?: string;
}

