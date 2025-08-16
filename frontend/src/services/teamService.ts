import { apiService } from './api';

export interface CreateTeamRequest {
  teamName: string;
  sport: string;
  ageGroup: string;
  description?: string;
  profilePhotoUrl?: string;
}

export interface Team {
  id: string;
  teamName: string;
  sport: string;
  ageGroup: string;
  description?: string;
  profilePhotoUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

class TeamService {
  private baseUrl = '/teams';

  async createTeam(request: CreateTeamRequest, createdByUserId: string): Promise<Team> {
    const response = await apiService.request<Team>(`${this.baseUrl}?createdByUserId=${createdByUserId}`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return response;
  }

  async getTeam(teamId: string): Promise<Team> {
    const response = await apiService.request<Team>(`${this.baseUrl}/${teamId}`);
    return response;
  }

  async updateTeam(teamId: string, request: CreateTeamRequest): Promise<Team> {
    const response = await apiService.request<Team>(`${this.baseUrl}/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(request)
    });
    return response;
  }

  async deactivateTeam(teamId: string): Promise<void> {
    await apiService.request<void>(`${this.baseUrl}/${teamId}`, {
      method: 'DELETE'
    });
  }
}

export const teamService = new TeamService();
