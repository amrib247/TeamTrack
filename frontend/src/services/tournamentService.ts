import type { Tournament, CreateTournamentRequest, UpdateTournamentRequest } from '../types/Auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class TournamentService {
  private baseUrl = `${API_BASE_URL}/tournaments`;

  async getAllTournaments(): Promise<Tournament[]> {
    try {
      const response = await fetch(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to get tournaments: ${response.status}`);
      }
      
      const tournaments = await response.json();
      return tournaments;
    } catch (error) {
      console.error('Failed to get tournaments:', error);
      throw error;
    }
  }

  async getTournamentsByOrganizer(userId: string): Promise<Tournament[]> {
    try {
      const response = await fetch(`${this.baseUrl}/organizer/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get tournaments by organizer: ${response.status}`);
      }
      
      const tournaments = await response.json();
      return tournaments;
    } catch (error) {
      console.error('Failed to get tournaments by organizer:', error);
      throw error;
    }
  }

  async getTournamentById(tournamentId: string): Promise<Tournament | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get tournament: ${response.status}`);
      }
      
      const tournament = await response.json();
      return tournament;
    } catch (error) {
      console.error('Failed to get tournament:', error);
      throw error;
    }
  }

  async getTournamentOrganizers(tournamentId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/organizers`);
      
      if (!response.ok) {
        throw new Error(`Failed to get tournament organizers: ${response.status}`);
      }
      
      const organizers = await response.json();
      return organizers;
    } catch (error) {
      console.error('Failed to get tournament organizers:', error);
      throw error;
    }
  }
  
  async inviteUserToTournament(tournamentId: string, email: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/organizers/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to invite user to tournament: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to invite user to tournament:', error);
      throw error;
    }
  }
  
  async getPendingOrganizerInvites(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/organizers/invites/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get pending organizer invites: ${response.status}`);
      }
      
      const invites = await response.json();
      return invites;
    } catch (error) {
      console.error('Failed to get pending organizer invites:', error);
      throw error;
    }
  }
  
  async acceptOrganizerInvite(organizerTournamentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/organizers/invites/${organizerTournamentId}/accept`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to accept organizer invite: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to accept organizer invite:', error);
      throw error;
    }
  }
  
  async declineOrganizerInvite(organizerTournamentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/organizers/invites/${organizerTournamentId}/decline`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to decline organizer invite: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to decline organizer invite:', error);
      throw error;
    }
  }

  async removeOrganizerFromTournament(tournamentId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/organizers/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove organizer from tournament: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to remove organizer from tournament:', error);
      throw error;
    }
  }

  async cleanupUserOrganizerRelationships(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/organizers/cleanup/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to cleanup user organizer relationships: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to cleanup user organizer relationships:', error);
      throw error;
    }
  }

  async createTournament(request: CreateTournamentRequest, userId: string): Promise<Tournament> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create tournament: ${response.status}`);
      }
      
      const tournament = await response.json();
      return tournament;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw error;
    }
  }

  async addTeamToTournament(tournamentId: string, teamId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/teams/${teamId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add team to tournament: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to add team to tournament:', error);
      throw error;
    }
  }

  async removeTeamFromTournament(tournamentId: string, teamId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/teams/${teamId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove team from tournament: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to remove team from tournament:', error);
      throw error;
    }
  }

  async updateTournament(tournamentId: string, request: UpdateTournamentRequest): Promise<Tournament> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update tournament: ${response.status}`);
      }
      
      const tournament = await response.json();
      return tournament;
    } catch (error) {
      console.error('Failed to update tournament:', error);
      throw error;
    }
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete tournament: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      throw error;
    }
  }

  async checkOrganizerSafety(userId: string, tournamentId: string, action: string): Promise<{ canProceed: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/check-organizer-safety?userId=${userId}&tournamentId=${tournamentId}&action=${action}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check organizer safety: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to check organizer safety:', error);
      throw error;
    }
  }
}

export const tournamentService = new TournamentService();
