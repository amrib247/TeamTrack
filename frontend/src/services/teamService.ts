import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

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

interface TeamData {
  teamName: string;
  sport: string;
  ageGroup: string;
  description?: string;
  profilePhotoUrl?: string;
  createdBy: string;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  isActive: boolean;
}

class TeamService {
  
  async createTeam(request: CreateTeamRequest, createdByUserId: string): Promise<Team> {
    try {
      // Create team in Firestore
      const teamData = {
        teamName: request.teamName,
        sport: request.sport,
        ageGroup: request.ageGroup,
        description: request.description || '',
        profilePhotoUrl: request.profilePhotoUrl || '',
        createdBy: createdByUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };
      
      const docRef = await addDoc(collection(db, 'teams'), teamData);
      
      // Create userTeams record to associate the creator with the team as a coach
      const userTeamData = {
        userId: createdByUserId,
        teamId: docRef.id,
        role: 'COACH',
        teamName: request.teamName,
        sport: request.sport,
        joinedAt: serverTimestamp(),
        isActive: true
      };
      
      await addDoc(collection(db, 'userTeams'), userTeamData);
      
      // Get the created team with its ID
      const teamDoc = await getDoc(docRef);
      const team = teamDoc.data() as TeamData;
      
      return {
        id: docRef.id,
        ...team,
        createdAt: team.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: team.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to create team:', error);
      throw new Error('Failed to create team');
    }
  }

  async getTeam(teamId: string): Promise<Team> {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      
      if (!teamDoc.exists()) {
        throw new Error('Team not found');
      }
      
      const team = teamDoc.data() as TeamData;
      
      return {
        id: teamDoc.id,
        ...team,
        createdAt: team.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: team.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get team:', error);
      throw new Error('Failed to get team');
    }
  }

  async updateTeam(teamId: string, request: CreateTeamRequest): Promise<Team> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      
      // Update team in Firestore
      await updateDoc(teamRef, {
        teamName: request.teamName,
        sport: request.sport,
        ageGroup: request.ageGroup,
        description: request.description || '',
        profilePhotoUrl: request.profilePhotoUrl || '',
        updatedAt: serverTimestamp()
      });
      
      // Get the updated team
      return await this.getTeam(teamId);
    } catch (error) {
      console.error('Failed to update team:', error);
      throw new Error('Failed to update team');
    }
  }

  async deactivateTeam(teamId: string): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to deactivate team:', error);
      throw new Error('Failed to deactivate team');
    }
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      // Query teams where the user is the creator
      const teamsQuery = query(
        collection(db, 'teams'),
        where('createdBy', '==', userId),
        where('isActive', '==', true)
      );
      
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams: Team[] = [];
      
      teamsSnapshot.forEach((doc) => {
        const team = doc.data() as TeamData;
        teams.push({
          id: doc.id,
          ...team,
          createdAt: team.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: team.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });
      
      return teams;
    } catch (error) {
      console.error('Failed to get user teams:', error);
      throw new Error('Failed to get user teams');
    }
  }
}

export const teamService = new TeamService();
