import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class EventService {
  
  /**
   * Create a new event
   */
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Get all events for a specific team
   */
  async getEventsByTeamId(teamId: string): Promise<Event[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/team/${teamId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get events: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(eventId: string): Promise<Event> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<Event> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete event: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Get events for a team within a date range
   */
  async getEventsByDateRange(teamId: string, startDate: string, endDate: string): Promise<Event[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/team/${teamId}/range?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get events by date range: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting events by date range:', error);
      throw error;
    }
  }

  /**
   * Get all events for a specific tournament
   */
  async getEventsByTournamentId(tournamentId: string): Promise<Event[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/tournament/${tournamentId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get tournament events: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tournament events:', error);
      throw error;
    }
  }

  /**
   * Delete all events for a specific tournament
   */
  async deleteEventsByTournamentId(tournamentId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/tournament/${tournamentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete events for tournament: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting events for tournament:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
