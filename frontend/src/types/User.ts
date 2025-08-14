export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
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

export interface CreateUserRequest {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: UserRole;
    teamId?: string;
}

export interface UpdateUserRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: UserRole;
    teamId?: string;
}
