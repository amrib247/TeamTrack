import { apiService } from './api';
import type { User } from '../types/Auth';

class UserService {
    async getUserById(id: string): Promise<User | null> {
        try {
            const user = await apiService.getUserById(id);
            return user;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            return null;
        }
    }

    async getUsersByIds(ids: string[]): Promise<Map<string, User>> {
        const userMap = new Map<string, User>();
        const uniqueIds = [...new Set(ids)]; // Remove duplicates
        
        try {
            // Fetch users in parallel
            const userPromises = uniqueIds.map(async (id) => {
                try {
                    const user = await this.getUserById(id);
                    if (user) {
                        userMap.set(id, user);
                    }
                } catch (error) {
                    console.error(`Failed to fetch user ${id}:`, error);
                }
            });
            
            await Promise.all(userPromises);
            return userMap;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            return userMap;
        }
    }
}

export const userService = new UserService();
