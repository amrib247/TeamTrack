import type { User, CreateUserRequest, UpdateUserRequest } from '../types/User';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return null as T;
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // User endpoints
    async getUsers(): Promise<User[]> {
        return this.request<User[]>('/users');
    }

    async getUserById(id: string): Promise<User> {
        return this.request<User>(`/users/${id}`);
    }

    async createUser(userData: CreateUserRequest): Promise<User> {
        return this.request<User>('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
        return this.request<User>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id: string): Promise<void> {
        return this.request<void>(`/users/${id}`, {
            method: 'DELETE',
        });
    }

    // Test endpoint
    async testConnection(): Promise<string> {
        return this.request<string>('/users/test');
    }
}

export const apiService = new ApiService();
