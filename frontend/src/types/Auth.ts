export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string; // For verification
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
}

export type ReminderLeadTime = '1h' | '6h' | '1d' | '2d' | '3d';

export const REMINDER_LEAD_TIME_OPTIONS: { value: ReminderLeadTime; label: string }[] = [
  { value: '1h', label: '1 hour before' },
  { value: '6h', label: '6 hours before' },
  { value: '1d', label: '1 day before' },
  { value: '2d', label: '2 days before' },
  { value: '3d', label: '3 days before' },
];

export interface UserTeam {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
  inviteAccepted: boolean;
  emailNotificationsEnabled: boolean;
  reminderLeadTime: ReminderLeadTime;
}

export interface AuthResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  teams: UserTeam[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
}

export type ChatScope = 'team' | 'tournament';

export interface ChatMessage {
  id: string;
  teamId?: string;
  tournamentId?: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  content: string;
  timestamp: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatRoom {
  id: string;
  teamId?: string;
  teamName?: string;
  tournamentId?: string;
  tournamentName?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  lastActivity: string;
}

export interface Tournament {
  id: string;
  name: string;
  maxSize: number;
  teamCount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  organizerCount: number;
}

export interface CreateTournamentRequest {
  name: string;
  maxSize: number;
  description?: string;
}

export interface UpdateTournamentRequest {
  name: string;
  description?: string;
}