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
  email: string;
  password: string; // For verification
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  role: UserRole;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  PLAYER = 'PLAYER',
  PARENT = 'PARENT'
}
