import type { ChatMessage, ChatRoom } from '../types/Auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class ChatService {
  private baseUrl = `${API_BASE_URL}/chat`;

  async getTeamMessages(teamId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    try {
      const url = new URL(`${this.baseUrl}/team/${teamId}/messages`);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to get team messages: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to fetch team messages:', error);
      throw new Error('Failed to load chat messages');
    }
  }

  async sendMessage(
    teamId: string,
    content: string,
    userId: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT',
    fileUrl?: string,
    fileName?: string
  ): Promise<ChatMessage> {
    try {
      const messageData = {
        userId,
        content,
        messageType,
        fileUrl,
        fileName
      };

      const response = await fetch(`${this.baseUrl}/team/${teamId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to send message: ${response.status} ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async markMessagesAsRead(teamId: string, messageIds: string[], userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/team/${teamId}/messages/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds, userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to mark messages as read: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      // Don't throw error for this operation as it's not critical
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const url = new URL(`${this.baseUrl}/messages/${messageId}`);
      url.searchParams.append('userId', userId);

      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete message: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw new Error('Failed to delete message');
    }
  }

  async getChatRoom(teamId: string, userId: string): Promise<ChatRoom> {
    try {
      const url = new URL(`${this.baseUrl}/team/${teamId}/room`);
      url.searchParams.append('userId', userId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get chat room: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch chat room:', error);
      throw new Error('Failed to load chat room');
    }
  }
}

export const chatService = new ChatService();
