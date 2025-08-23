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

export interface UserTeam {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
  inviteAccepted: boolean;
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

export interface ChatMessage {
  id: string;
  teamId: string;
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
  teamId: string;
  teamName: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  lastActivity: string;
}

export interface Tournament {
  id: string;
  name: string;
  maxSize: number;
  teamIds: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
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