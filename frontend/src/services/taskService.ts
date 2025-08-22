import type { Task, CreateTaskRequest, TaskUser } from '../types/Task';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class TaskService {
  
  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create task: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Get all tasks for a specific team
   */
  async getTasksByTeamId(teamId: string): Promise<Task[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/team/${teamId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get tasks: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(taskId: string): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get task: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, taskData: Partial<CreateTaskRequest>): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update task: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete task: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Sign up a user for a task
   */
  async signUpForTask(taskId: string, userId: string): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sign up for task: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error signing up for task:', error);
      throw error;
    }
  }

  /**
   * Remove a user from a task
   */
  async removeFromTask(taskId: string, userId: string): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove from task: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing from task:', error);
      throw error;
    }
  }

  /**
   * Get all users who have signed up for a task with their roles
   */
  async getTaskUsers(taskId: string): Promise<TaskUser[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/users`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get task users: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting task users:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
