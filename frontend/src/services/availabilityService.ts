const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface Availability {
  id: string;
  userId: string;
  teamId: string;
  eventId: string;
  status: 'YES' | 'NO' | 'MAYBE';
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberAvailability {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN';
  isCurrentUser: boolean;
}

export interface TeamAvailabilityResponse {
  teamAvailability: TeamMemberAvailability[];
  totalMembers: number;
}

class AvailabilityService {
  /**
   * Set availability for a user for a specific event
   */
  async setAvailability(
    userId: string,
    teamId: string,
    eventId: string,
    status: 'YES' | 'NO' | 'MAYBE'
  ): Promise<Availability> {
    try {
      const params = new URLSearchParams({ userId, teamId, eventId, status });
      const response = await fetch(`${API_BASE_URL}/availability/set?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to set availability: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  }

  /**
   * Get team availability for a specific event
   */
  async getTeamAvailabilityForEvent(
    teamId: string,
    eventId: string,
    currentUserId: string
  ): Promise<TeamAvailabilityResponse> {
    try {
      const params = new URLSearchParams({ currentUserId });
      const response = await fetch(`${API_BASE_URL}/availability/team/${teamId}/event/${eventId}?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get team availability: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting team availability:', error);
      throw error;
    }
  }

  /**
   * Get availability for a specific user for a specific event
   */
  async getUserAvailabilityForEvent(
    userId: string,
    teamId: string,
    eventId: string
  ): Promise<Availability | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/availability/user/${userId}/team/${teamId}/event/${eventId}`);

      if (response.status === 404) {
        return null; // No availability found
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get user availability: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user availability:', error);
      throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
