import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ReminderLeadTime } from '../types/Auth';
import { deleteQueryBatch, docData, docToData, nowIso, omitUndefined, queryByField, toNumber } from '../lib/firestoreUtils';

export const DEFAULT_REMINDER_LEAD_TIME: ReminderLeadTime = '1d';

export interface NotificationPreferences {
  emailNotificationsEnabled: boolean;
  reminderLeadTime: ReminderLeadTime;
}

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

export interface TournamentInviteRecord {
  id: string;
  teamId: string;
  tournamentId: string;
  createdAt?: string;
  isActive: boolean;
}

export interface CoachSafetyCheckResponse {
  canProceed: boolean;
  message: string;
  teamId: string | null;
  teamName: string | null;
  coachCount: number;
  action: 'LEAVE_TEAM' | 'DELETE_ACCOUNT';
}

type UserTeamDoc = {
  userId: string;
  teamId: string;
  role: string;
  joinedAt?: string;
  joinDate?: string;
  isActive: boolean;
  inviteAccepted: boolean;
  emailNotificationsEnabled?: boolean;
  reminderLeadTime?: ReminderLeadTime;
};

function notificationDefaults(): Pick<UserTeamDoc, 'emailNotificationsEnabled' | 'reminderLeadTime'> {
  return {
    emailNotificationsEnabled: true,
    reminderLeadTime: DEFAULT_REMINDER_LEAD_TIME,
  };
}

export function resolveNotificationPreferences(data: UserTeamDoc): NotificationPreferences {
  return {
    emailNotificationsEnabled: data.emailNotificationsEnabled !== false,
    reminderLeadTime: data.reminderLeadTime ?? DEFAULT_REMINDER_LEAD_TIME,
  };
}

type TeamDoc = {
  teamName: string;
  sport: string;
  ageGroup: string;
  description?: string;
  profilePhotoUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  coachCount?: number;
};

function mapTeam(id: string, data: TeamDoc): Team {
  return {
    id,
    teamName: data.teamName,
    sport: data.sport,
    ageGroup: data.ageGroup,
    description: data.description,
    profilePhotoUrl: data.profilePhotoUrl,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    isActive: data.isActive !== false,
  };
}

function joinedAtValue(data: UserTeamDoc): string {
  return data.joinedAt || data.joinDate || nowIso();
}

async function updateCoachCount(teamId: string, delta: number): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) {
    throw new Error('Team not found');
  }
  const current = toNumber(teamSnap.data()?.coachCount, 1);
  const next = current + delta;
  if (next < 1) {
    throw new Error('Cannot have zero coach count. At least one coach is required.');
  }
  await updateDoc(teamRef, { coachCount: next });
}

class TeamService {
  async createTeam(request: CreateTeamRequest, createdByUserId: string): Promise<Team> {
    const teamId = crypto.randomUUID();
    const timestamp = nowIso();
    const teamData: TeamDoc = {
      teamName: request.teamName,
      sport: request.sport,
      ageGroup: request.ageGroup,
      description: request.description,
      profilePhotoUrl: request.profilePhotoUrl,
      createdBy: createdByUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
      coachCount: 1,
    };

    await setDoc(doc(db, 'teams', teamId), omitUndefined(teamData));

    await addDoc(collection(db, 'userTeams'), {
      userId: createdByUserId,
      teamId,
      role: 'COACH',
      joinedAt: timestamp,
      isActive: true,
      inviteAccepted: true,
      ...notificationDefaults(),
    });

    return mapTeam(teamId, teamData);
  }

  async getTeam(teamId: string): Promise<Team> {
    const snap = await getDoc(doc(db, 'teams', teamId));
    const data = docToData<TeamDoc>(snap);
    if (!data) {
      throw new Error('Team not found');
    }
    return mapTeam(data.id, data);
  }

  async updateTeam(teamId: string, request: UpdateTeamRequest): Promise<Team> {
    const teamRef = doc(db, 'teams', teamId);
    const snap = await getDoc(teamRef);
    const existing = docToData<TeamDoc>(snap);
    if (!existing) {
      throw new Error('Team not found');
    }

    const updated: TeamDoc = {
      ...existing,
      teamName: request.teamName,
      sport: request.sport,
      ageGroup: request.ageGroup,
      description: request.description ?? existing.description,
      profilePhotoUrl: request.profilePhotoUrl ?? existing.profilePhotoUrl,
      updatedAt: nowIso(),
    };

    await setDoc(teamRef, omitUndefined(updated));
    return mapTeam(teamId, updated);
  }

  async deactivateTeam(teamId: string): Promise<void> {
    await updateDoc(doc(db, 'teams', teamId), { isActive: false });
  }

  async terminateTeam(teamId: string): Promise<void> {
    const events = await queryByField<{ tournamentId?: string; opposingTeamId?: string }>('events', 'teamId', teamId);

    for (const event of events) {
      if (event.tournamentId && event.opposingTeamId) {
        const partnerEvents = await getDocs(
          query(
            collection(db, 'events'),
            where('tournamentId', '==', event.tournamentId),
            where('teamId', '==', event.opposingTeamId),
            where('opposingTeamId', '==', teamId)
          )
        );
        for (const partnerDoc of partnerEvents.docs) {
          await deleteQueryBatch('availabilities', [where('eventId', '==', partnerDoc.id)]);
          await deleteDoc(partnerDoc.ref);
        }
      }
      await deleteQueryBatch('availabilities', [where('eventId', '==', event.id)]);
      await deleteDoc(doc(db, 'events', event.id));
    }

    await deleteQueryBatch('availabilities', [where('teamId', '==', teamId)]);
    await deleteQueryBatch('tasks', [where('teamId', '==', teamId)]);
    await deleteQueryBatch('chat_messages', [where('teamId', '==', teamId)]);
    await deleteQueryBatch('chat_rooms', [where('teamId', '==', teamId)]);

    const invites = await queryByField<{ tournamentId: string; isActive: boolean }>(
      'tournamentInvites',
      'teamId',
      teamId
    );
    for (const invite of invites) {
      if (invite.isActive) {
        const tournamentRef = doc(db, 'tournaments', invite.tournamentId);
        const tournamentSnap = await getDoc(tournamentRef);
        if (tournamentSnap.exists()) {
          const current = toNumber(tournamentSnap.data()?.teamCount, 0);
          await updateDoc(tournamentRef, { teamCount: Math.max(0, current - 1) });
        }
      }
      await deleteDoc(doc(db, 'tournamentInvites', invite.id));
    }

    await deleteQueryBatch('userTeams', [where('teamId', '==', teamId)]);
    await deleteDoc(doc(db, 'teams', teamId));
  }

  async getUserTeams(_userId: string): Promise<Team[]> {
    return [];
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const userTeams = await queryByField<UserTeamDoc>('userTeams', 'teamId', teamId);
    const members: TeamMember[] = [];

    for (const ut of userTeams) {
      const profileSnap = await getDoc(doc(db, 'userProfiles', ut.userId));
      const profile = profileSnap.data();
      if (!profile) continue;

      members.push({
        id: ut.id,
        userId: ut.userId,
        teamId: ut.teamId,
        role: ut.role,
        joinedAt: joinedAtValue(ut),
        isActive: ut.isActive !== false,
        inviteAccepted: !!ut.inviteAccepted,
        firstName: String(profile.firstName ?? ''),
        lastName: String(profile.lastName ?? ''),
        email: String(profile.email ?? ''),
        phoneNumber: profile.phoneNumber as string | undefined,
        profilePhotoUrl: profile.profilePhotoUrl as string | undefined,
      });
    }

    return members;
  }

  inviteUserToTeam(teamId: string, email: string, role: string): Promise<UserTeamDoc & { id: string }> {
    return (async () => {
      const users = await getDocs(query(collection(db, 'userProfiles'), where('email', '==', email)));
      if (users.empty) {
        throw new Error(`User with email ${email} not found`);
      }
      const userId = users.docs[0].id;

      const existing = await getDocs(
        query(collection(db, 'userTeams'), where('userId', '==', userId), where('teamId', '==', teamId))
      );
      if (!existing.empty) {
        throw new Error('User is already a member of this team');
      }

      const userTeamRef = await addDoc(collection(db, 'userTeams'), {
        userId,
        teamId,
        role,
        joinedAt: nowIso(),
        isActive: true,
        inviteAccepted: false,
        ...notificationDefaults(),
      });

      return {
        id: userTeamRef.id,
        userId,
        teamId,
        role,
        joinedAt: nowIso(),
        isActive: true,
        inviteAccepted: false,
        ...notificationDefaults(),
      };
    })();
  }

  async acceptInvite(userTeamId: string): Promise<UserTeamDoc & { id: string }> {
    const userTeamRef = doc(db, 'userTeams', userTeamId);
    const snap = await getDoc(userTeamRef);
    const data = docToData<UserTeamDoc>(snap);
    if (!data) {
      throw new Error('UserTeam relationship not found');
    }

    await setDoc(userTeamRef, omitUndefined({ ...data, inviteAccepted: true }));

    if (data.role === 'COACH') {
      await updateCoachCount(data.teamId, 1);
    }

    return { ...data, id: userTeamId, inviteAccepted: true };
  }

  async declineInvite(userTeamId: string): Promise<void> {
    const snap = await getDoc(doc(db, 'userTeams', userTeamId));
    const data = docToData<UserTeamDoc>(snap);
    if (data?.role === 'COACH' && data.teamId) {
      try {
        await updateCoachCount(data.teamId, -1);
      } catch {
        // invite not accepted yet — coach count unchanged
      }
    }
    await deleteDoc(doc(db, 'userTeams', userTeamId));
  }

  async updateNotificationPreferences(
    userTeamId: string,
    userId: string,
    prefs: NotificationPreferences
  ): Promise<NotificationPreferences> {
    const userTeamRef = doc(db, 'userTeams', userTeamId);
    const snap = await getDoc(userTeamRef);
    const data = docToData<UserTeamDoc>(snap);
    if (!data) {
      throw new Error('UserTeam not found');
    }
    if (data.userId !== userId) {
      throw new Error('You can only update your own notification preferences');
    }

    await updateDoc(userTeamRef, {
      emailNotificationsEnabled: prefs.emailNotificationsEnabled,
      reminderLeadTime: prefs.reminderLeadTime,
    });

    return prefs;
  }

  async leaveTeam(userTeamId: string, userId: string): Promise<void> {
    const safetyCheck = await this.checkCoachSafety(userId, 'LEAVE_TEAM');
    if (!safetyCheck.canProceed) {
      throw new Error(safetyCheck.message);
    }

    const snap = await getDoc(doc(db, 'userTeams', userTeamId));
    const data = docToData<UserTeamDoc>(snap);
    if (!data) {
      throw new Error('UserTeam not found');
    }

    await deleteDoc(doc(db, 'userTeams', userTeamId));

    if (data.role === 'COACH') {
      await updateCoachCount(data.teamId, -1);
    }
  }

  async updateUserRole(userTeamId: string, newRole: string): Promise<UserTeamDoc & { id: string }> {
    const userTeamRef = doc(db, 'userTeams', userTeamId);
    const snap = await getDoc(userTeamRef);
    const data = docToData<UserTeamDoc>(snap);
    if (!data) {
      throw new Error('UserTeam not found');
    }

    const oldRole = data.role;
    await setDoc(userTeamRef, omitUndefined({ ...data, role: newRole }));

    let delta = 0;
    if (oldRole === 'COACH') delta -= 1;
    if (newRole === 'COACH') delta += 1;
    if (delta !== 0) {
      await updateCoachCount(data.teamId, delta);
    }

    return { ...data, id: userTeamId, role: newRole };
  }

  async removeUserFromTeam(userTeamId: string): Promise<void> {
    const snap = await getDoc(doc(db, 'userTeams', userTeamId));
    const data = docToData<UserTeamDoc>(snap);
    await deleteDoc(doc(db, 'userTeams', userTeamId));
    if (data?.role === 'COACH') {
      await updateCoachCount(data.teamId, -1);
    }
  }

  async getCoachCount(teamId: string): Promise<number> {
    const snap = await getDoc(doc(db, 'teams', teamId));
    if (!snap.exists()) return 0;
    return toNumber(snap.data()?.coachCount, 0);
  }

  async checkCoachSafety(
    userId: string,
    action: 'LEAVE_TEAM' | 'DELETE_ACCOUNT'
  ): Promise<CoachSafetyCheckResponse> {
    const coachTeams = await getDocs(
      query(collection(db, 'userTeams'), where('userId', '==', userId), where('role', '==', 'COACH'))
    );

    for (const coachDoc of coachTeams.docs) {
      const ut = docData<UserTeamDoc>(coachDoc);
      const coachCount = await this.getCoachCount(ut.teamId);

      if (coachCount === 1) {
        const teamSnap = await getDoc(doc(db, 'teams', ut.teamId));
        const teamName = teamSnap.exists() ? String(teamSnap.data()?.teamName ?? 'Unknown Team') : 'Unknown Team';
        const actionText =
          action === 'DELETE_ACCOUNT' ? 'delete your account' : 'leave the team';
        return {
          canProceed: false,
          message: `You are the only coach of '${teamName}'. You must either promote someone else to coach or delete the team before you can ${actionText}.`,
          teamId: ut.teamId,
          teamName,
          coachCount,
          action,
        };
      }
    }

    return {
      canProceed: true,
      message: 'You can safely proceed with this action.',
      teamId: null,
      teamName: null,
      coachCount: 0,
      action,
    };
  }

  async searchTeamsByName(name: string): Promise<Team[]> {
    const snapshot = await getDocs(collection(db, 'teams'));
    const lower = name.toLowerCase();
    return snapshot.docs
      .map((d) => mapTeam(d.id, d.data() as TeamDoc))
      .filter((t) => t.teamName.toLowerCase().includes(lower));
  }

  async getTournamentInvites(teamId: string): Promise<TournamentInviteRecord[]> {
    const invites = await getDocs(
      query(
        collection(db, 'tournamentInvites'),
        where('teamId', '==', teamId),
        where('isActive', '==', false)
      )
    );
    return invites.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        teamId: String(data.teamId),
        tournamentId: String(data.tournamentId),
        createdAt: data.createdAt as string | undefined,
        isActive: false,
      };
    });
  }

  async getAcceptedTournamentInvites(teamId: string): Promise<TournamentInviteRecord[]> {
    const invites = await getDocs(
      query(
        collection(db, 'tournamentInvites'),
        where('teamId', '==', teamId),
        where('isActive', '==', true)
      )
    );
    return invites.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        teamId: String(data.teamId),
        tournamentId: String(data.tournamentId),
        createdAt: data.createdAt as string | undefined,
        isActive: true,
      };
    });
  }

  async leaveTournament(teamId: string, tournamentId: string): Promise<void> {
    const invites = await getDocs(
      query(
        collection(db, 'tournamentInvites'),
        where('teamId', '==', teamId),
        where('tournamentId', '==', tournamentId)
      )
    );

    if (!invites.empty) {
      await deleteDoc(invites.docs[0].ref);
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentSnap = await getDoc(tournamentRef);
      if (tournamentSnap.exists()) {
        const current = toNumber(tournamentSnap.data()?.teamCount, 0);
        await updateDoc(tournamentRef, { teamCount: Math.max(0, current - 1) });
      }
    }
  }

  async removeAllTeamsForUser(userId: string): Promise<void> {
    const userTeams = await queryByField<UserTeamDoc>('userTeams', 'userId', userId);
    for (const ut of userTeams) {
      if (ut.role === 'COACH') {
        try {
          await updateCoachCount(ut.teamId, -1);
        } catch (e) {
          console.warn('Could not decrement coach count:', e);
        }
      }
      await deleteDoc(doc(db, 'userTeams', ut.id));
    }
  }
}

export const teamService = new TeamService();
