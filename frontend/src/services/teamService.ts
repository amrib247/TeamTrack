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

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
  inviteAccepted: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
}

export interface CoachSafetyCheckResponse {
  canProceed: boolean;
  message: string;
  teamId: string | null;
  teamName: string | null;
  coachCount: number;
  action: 'LEAVE_TEAM' | 'DELETE_ACCOUNT';
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

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      console.log('🔍 Getting team members for team:', teamId);
      
      const response = await fetch(`${API_BASE_URL}/user-teams/team/${teamId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get team members:', response.status, errorText);
        throw new Error(`Failed to get team members: ${response.status} ${errorText}`);
      }

      const teamMembers = await response.json();
      console.log('✅ Team members retrieved successfully:', teamMembers);
      return teamMembers;
    } catch (error) {
      console.error('Failed to get team members:', error);
      throw error;
    }
  }

  // Invite user to team
  inviteUserToTeam(teamId: string, email: string, role: string): Promise<any> {
    return fetch(`${API_BASE_URL}/user-teams/teams/${teamId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role }),
    }).then(async response => {
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to invite user');
      }
      return response.json();
    });
  }

  // Accept team invite
  acceptInvite(userTeamId: string): Promise<any> {
    return fetch(`${API_BASE_URL}/user-teams/accept-invite/${userTeamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async response => {
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to accept invite');
      }
      return response.json();
    });
  }

  // Decline team invite (deletes the UserTeam relationship)
  declineInvite(userTeamId: string): Promise<void> {
    return fetch(`${API_BASE_URL}/user-teams/decline-invite/${userTeamId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async response => {
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to decline invite');
      }
    });
  }

  // Leave a team (deletes the UserTeam relationship)
  async leaveTeam(userTeamId: string, userId: string): Promise<void> {
    try {
      // First check if this user can safely leave (coach safety check)
      const safetyCheck = await this.checkCoachSafety(userId, 'LEAVE_TEAM');
      if (!safetyCheck.canProceed) {
        throw new Error(safetyCheck.message);
      }

      // If safety check passes, proceed with leaving the team
      const response = await fetch(`${API_BASE_URL}/user-teams/leave-team/${userTeamId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('🔍 Leave team error response:', errorData);
        throw new Error(errorData.error || 'Failed to leave team');
      }
    } catch (error) {
      console.error('Failed to leave team:', error);
      throw error;
    }
  }

  // Update user role in team
  updateUserRole(userTeamId: string, newRole: string): Promise<any> {
    return fetch(`${API_BASE_URL}/user-teams/update-role/${userTeamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRole }),
    }).then(async response => {
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to update user role');
      }
      return response.json();
    });
  }

  // Remove user from team
  removeUserFromTeam(userTeamId: string): Promise<void> {
    return fetch(`${API_BASE_URL}/user-teams/remove-user/${userTeamId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).then(async response => {
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to remove user from team');
      }
    });
  }

  // Get coach count for a team
  async getCoachCount(teamId: string): Promise<number> {
    try {
      console.log('👥 Getting coach count for team:', teamId);
      
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/coach-count`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get coach count:', response.status, errorText);
        throw new Error(`Failed to get coach count: ${response.status} ${errorText}`);
      }

      const count = await response.json();
      console.log('✅ Coach count retrieved successfully:', count);
      return count;
    } catch (error) {
      console.error('Failed to get coach count:', error);
      throw error;
    }
  }

  // Check if a coach can safely leave a team or delete their account
  async checkCoachSafety(userId: string, action: 'LEAVE_TEAM' | 'DELETE_ACCOUNT'): Promise<CoachSafetyCheckResponse> {
    try {
      console.log('🔒 Checking coach safety for user:', userId, 'action:', action);
      
      const response = await fetch(`${API_BASE_URL}/user-teams/check-coach-safety?userId=${userId}&action=${action}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to check coach safety:', response.status, errorText);
        throw new Error(`Failed to check coach safety: ${response.status} ${errorText}`);
      }

      const safetyResponse = await response.json();
      console.log('✅ Coach safety check completed:', safetyResponse);
      return safetyResponse;
    } catch (error) {
      console.error('Failed to check coach safety:', error);
      throw error;
    }
  }
}

export const teamService = new TeamService();
