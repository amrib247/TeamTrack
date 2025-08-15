import type { LoginRequest, RegisterRequest, AuthResponse, UpdateUserRequest } from '../types/Auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Try to get error message from response body
        try {
          const errorText = await response.text();
          if (errorText && errorText.trim()) {
            errorMessage = errorText;
          }
        } catch (e) {
          // If we can't read the response body, use the status text
          errorMessage = `HTTP error! status: ${response.status}, message: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Auth request failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async test(): Promise<string> {
    return this.request<string>('/auth/test');
  }

  async deleteAccount(credentials: LoginRequest): Promise<string> {
    const response = await this.request<{message?: string, error?: string}>('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify(credentials),
    });
    
    if (response?.message) {
      return response.message;
    } else if (response?.error) {
      throw new Error(response.error);
    } else {
      return 'Account deleted successfully';
    }
  }

  async updateUser(userData: UpdateUserRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/update-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}

export const authService = new AuthService();
