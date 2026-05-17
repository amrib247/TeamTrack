import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { nowIso, queryByField } from '../lib/firestoreUtils';
import { teamService } from './teamService';

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

type AvailabilityDoc = Omit<Availability, 'id'>;

class AvailabilityService {
  async setAvailability(
    userId: string,
    teamId: string,
    eventId: string,
    status: 'YES' | 'NO' | 'MAYBE'
  ): Promise<Availability> {
    const existing = await getDocs(
      query(
        collection(db, 'availabilities'),
        where('userId', '==', userId),
        where('teamId', '==', teamId),
        where('eventId', '==', eventId)
      )
    );

    const timestamp = nowIso();

    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      const data = existing.docs[0].data() as AvailabilityDoc;
      const updated: Availability = {
        id: existing.docs[0].id,
        ...data,
        status,
        updatedAt: timestamp,
      };
      await setDoc(docRef, { ...data, status, updatedAt: timestamp });
      return updated;
    }

    const id = crypto.randomUUID();
    const availability: Availability = {
      id,
      userId,
      teamId,
      eventId,
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(doc(db, 'availabilities', id), {
      userId,
      teamId,
      eventId,
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return availability;
  }

  async getTeamAvailabilityForEvent(
    teamId: string,
    eventId: string,
    currentUserId: string
  ): Promise<TeamAvailabilityResponse> {
    const teamMembers = await teamService.getTeamMembers(teamId);
    const availabilities = await queryByField<AvailabilityDoc>('availabilities', 'eventId', eventId);

    const userAvailabilities = new Map(availabilities.map((a) => [a.userId, a.status]));

    const teamAvailability: TeamMemberAvailability[] = teamMembers.map((member) => ({
      userId: member.userId,
      firstName: member.firstName,
      lastName: member.lastName,
      role: member.role,
      status: (userAvailabilities.get(member.userId) as TeamMemberAvailability['status']) ?? 'UNKNOWN',
      isCurrentUser: member.userId === currentUserId,
    }));

    teamAvailability.sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      if (a.role === 'COACH' && b.role !== 'COACH') return -1;
      if (b.role === 'COACH' && a.role !== 'COACH') return 1;
      const lastCmp = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' });
      if (lastCmp !== 0) return lastCmp;
      return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' });
    });

    return { teamAvailability, totalMembers: teamAvailability.length };
  }

  async getUserAvailabilityForEvent(
    userId: string,
    teamId: string,
    eventId: string
  ): Promise<Availability | null> {
    const snapshot = await getDocs(
      query(
        collection(db, 'availabilities'),
        where('userId', '==', userId),
        where('teamId', '==', teamId),
        where('eventId', '==', eventId)
      )
    );

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as AvailabilityDoc;
    return {
      id: docSnap.id,
      ...data,
    };
  }
}

export const availabilityService = new AvailabilityService();
