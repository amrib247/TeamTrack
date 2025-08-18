import { API_BASE_URL } from './api';

export interface CreateTeamRequest {
  teamName: string;
  sport: string;
  ageGroup: string;
  description?: string;
  profilePhotoUrl?: string;
}

export interface UpdateTeamRequest {
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
  
  async createTeam(request: CreateTeamRequest, createdByUserId: string): Promise<Team> {
    try {
      console.log('🚀 Creating team with data:', request);
      
      const response = await fetch(`${API_BASE_URL}/teams?createdByUserId=${createdByUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create team:', response.status, errorText);
        throw new Error(`Failed to create team: ${response.status} ${errorText}`);
      }

      const createdTeam = await response.json();
      console.log('✅ Team created successfully:', createdTeam);
      return createdTeam;
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  async getTeam(teamId: string): Promise<Team> {
    try {
      console.log('🔍 Getting team:', teamId);
      
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get team:', response.status, errorText);
        throw new Error(`Failed to get team: ${response.status} ${errorText}`);
      }

      const team = await response.json();
      console.log('✅ Team retrieved successfully:', team);
      return team;
    } catch (error) {
      console.error('Failed to get team:', error);
      throw error;
    }
  }

  async updateTeam(teamId: string, request: UpdateTeamRequest): Promise<Team> {
    try {
      console.log('🔄 Updating team:', teamId, 'with data:', request);
      console.log('🔍 API URL:', `${API_BASE_URL}/teams/${teamId}`);
      console.log('🔍 Request body:', JSON.stringify(request, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update team:', response.status, errorText);
        throw new Error(`Failed to update team: ${response.status} ${errorText}`);
      }

      const updatedTeam = await response.json();
      console.log('✅ Team updated successfully:', updatedTeam);
      return updatedTeam;
    } catch (error) {
      console.error('Failed to update team:', error);
      throw error;
    }
  }

  async deactivateTeam(teamId: string): Promise<void> {
    try {
      console.log('🔄 Deactivating team:', teamId);
      
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to deactivate team:', response.status, errorText);
        throw new Error(`Failed to deactivate team: ${response.status} ${errorText}`);
      }

      console.log('✅ Team deactivated successfully');
    } catch (error) {
      console.error('Failed to deactivate team:', error);
      throw error;
    }
  }

  async terminateTeam(teamId: string): Promise<void> {
    try {
      console.log('🗑️ Terminating team:', teamId);
      
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/terminate`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to terminate team:', response.status, errorText);
        throw new Error(`Failed to terminate team: ${response.status} ${errorText}`);
      }

      console.log('✅ Team terminated successfully');
    } catch (error) {
      console.error('Failed to terminate team:', error);
      throw error;
    }
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      console.log('🔍 Getting teams for user:', userId);
      
      // This method is not needed in the backend API since teams are fetched through userTeams
      // For now, return empty array - teams are fetched through the auth service
      return [];
    } catch (error) {
      console.error('Failed to get user teams:', error);
      throw error;
    }
  }
}

export const teamService = new TeamService();
