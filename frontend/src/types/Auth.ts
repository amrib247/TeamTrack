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
