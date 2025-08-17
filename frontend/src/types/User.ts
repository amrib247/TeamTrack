export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: string;
    teamId?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

export interface CreateUserRequest {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: string;
    teamId?: string;
}

export interface UpdateUserRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
    teamId?: string;
}
