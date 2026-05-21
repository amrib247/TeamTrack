import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { ReminderLeadTime, Tournament, CreateTournamentRequest, UpdateTournamentRequest } from '../types/Auth';
import { auth, db } from '../firebase';
import { deleteQueryBatch, docToData, nowIso, omitUndefined, queryByField, toNumber } from '../lib/firestoreUtils';
import {
  DEFAULT_REMINDER_LEAD_TIME,
  type NotificationPreferences,
} from './teamService';

export type { NotificationPreferences };

type RefereeTournamentDoc = {
  id: string;
  userId: string;
  tournamentId: string;
  createdAt: string;
  isActive: boolean;
  updatedAt?: string;
  emailNotificationsEnabled?: boolean;
  reminderLeadTime?: ReminderLeadTime;
};

export interface RefereeTournamentMembership {
  id: string;
  userId: string;
  tournamentId: string;
  isActive: boolean;
  emailNotificationsEnabled: boolean;
  reminderLeadTime: ReminderLeadTime;
}

function refereeNotificationDefaults(): Pick<
  RefereeTournamentDoc,
  'emailNotificationsEnabled' | 'reminderLeadTime'
> {
  return {
    emailNotificationsEnabled: true,
    reminderLeadTime: DEFAULT_REMINDER_LEAD_TIME,
  };
}

export function resolveRefereeNotificationPreferences(
  data: Pick<RefereeTournamentDoc, 'emailNotificationsEnabled' | 'reminderLeadTime'>
): NotificationPreferences {
  return {
    emailNotificationsEnabled: data.emailNotificationsEnabled !== false,
    reminderLeadTime: data.reminderLeadTime ?? DEFAULT_REMINDER_LEAD_TIME,
  };
}

type TournamentDoc = {
  name: string;
  maxSize: number;
  teamCount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  organizerCount: number;
};

function mapTournament(id: string, data: TournamentDoc): Tournament {
  return {
    id,
    name: data.name,
    maxSize: toNumber(data.maxSize),
    teamCount: toNumber(data.teamCount),
    description: data.description,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    isActive: data.isActive !== false,
    organizerCount: toNumber(data.organizerCount, 1),
  };
}

export class TournamentService {
  async getAllTournaments(): Promise<Tournament[]> {
    const snapshot = await getDocs(
      query(collection(db, 'tournaments'), where('isActive', '==', true))
    );
    return snapshot.docs.map((d) => mapTournament(d.id, d.data() as TournamentDoc));
  }

  async getTournamentsByOrganizer(userId: string): Promise<Tournament[]> {
    const organizerLinks = await queryByField<{ tournamentId: string; isActive: boolean }>(
      'organizerTournaments',
      'userId',
      userId
    );
    const activeIds = organizerLinks.filter((o) => o.isActive).map((o) => o.tournamentId);
    const tournaments: Tournament[] = [];
    for (const id of activeIds) {
      const t = await this.getTournamentById(id);
      if (t) tournaments.push(t);
    }
    return tournaments;
  }

  async getTournamentById(tournamentId: string): Promise<Tournament | null> {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId));
    const data = docToData<TournamentDoc>(snap);
    if (!data) return null;
    return mapTournament(data.id, data);
  }

  async getTournamentOrganizers(tournamentId: string): Promise<Array<Record<string, unknown>>> {
    const organizers = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', true)
      )
    );

    const details: Array<Record<string, unknown>> = [];
    for (const orgDoc of organizers.docs) {
      const userId = String(orgDoc.data().userId);
      const profileSnap = await getDoc(doc(db, 'userProfiles', userId));
      if (!profileSnap.exists()) continue;
      const profile = profileSnap.data();
      details.push({
        userId,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        email: profile?.email,
        profilePhotoUrl: profile?.profilePhotoUrl,
        phoneNumber: profile?.phoneNumber,
        role: 'ORGANIZER',
        organizerId: orgDoc.id,
      });
    }
    return details;
  }

  async inviteUserToTournament(tournamentId: string, email: string): Promise<void> {
    const users = await getDocs(query(collection(db, 'userProfiles'), where('email', '==', email)));
    if (users.empty) {
      throw new Error(`User with email ${email} not found`);
    }
    const userId = users.docs[0].id;

    const existing = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId)
      )
    );
    if (!existing.empty) {
      throw new Error('User is already an organizer of this tournament');
    }

    if (await this.hasRefereeTournamentLink(userId, tournamentId)) {
      throw new Error('User is already a referee for this tournament');
    }

    const id = crypto.randomUUID();
    await setDoc(doc(db, 'organizerTournaments', id), {
      id,
      userId,
      tournamentId,
      createdAt: nowIso(),
      isActive: false,
    });
  }

  async getPendingOrganizerInvites(userId: string): Promise<Array<Record<string, unknown>>> {
    const pending = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('userId', '==', userId),
        where('isActive', '==', false)
      )
    );

    const invites: Array<Record<string, unknown>> = [];
    for (const inviteDoc of pending.docs) {
      const tournamentId = String(inviteDoc.data().tournamentId);
      const tournamentSnap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (!tournamentSnap.exists()) continue;
      const tournament = tournamentSnap.data();
      invites.push({
        organizerTournamentId: inviteDoc.id,
        tournamentId,
        tournamentName: tournament?.name,
        tournamentDescription: tournament?.description,
      });
    }
    return invites;
  }

  async acceptOrganizerInvite(organizerTournamentId: string): Promise<void> {
    const orgRef = doc(db, 'organizerTournaments', organizerTournamentId);
    const snap = await getDoc(orgRef);
    if (!snap.exists()) {
      throw new Error('OrganizerTournament relationship not found');
    }

    const tournamentId = String(snap.data().tournamentId);
    const userId = String(snap.data().userId);
    await updateDoc(orgRef, { isActive: true, updatedAt: nowIso() });

    await this.removeRefereeFromTournament(tournamentId, userId);

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);
    if (tournamentSnap.exists()) {
      const current = toNumber(tournamentSnap.data()?.organizerCount, 1);
      await updateDoc(tournamentRef, { organizerCount: current + 1 });
    }
  }

  async declineOrganizerInvite(organizerTournamentId: string): Promise<void> {
    await deleteDoc(doc(db, 'organizerTournaments', organizerTournamentId));
  }

  async removeOrganizerFromTournament(tournamentId: string, userId: string): Promise<void> {
    const links = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId)
      )
    );
    if (links.empty) return;

    await deleteDoc(links.docs[0].ref);

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);
    if (tournamentSnap.exists()) {
      const current = toNumber(tournamentSnap.data()?.organizerCount, 1);
      await updateDoc(tournamentRef, { organizerCount: Math.max(1, current - 1) });
    }
  }

  async cleanupUserOrganizerRelationships(userId: string): Promise<void> {
    const links = await queryByField<{ tournamentId: string }>('organizerTournaments', 'userId', userId);
    const decrements = new Map<string, number>();

    for (const link of links) {
      decrements.set(link.tournamentId, (decrements.get(link.tournamentId) ?? 0) + 1);
      await deleteDoc(doc(db, 'organizerTournaments', link.id));
    }

    for (const [tournamentId, amount] of decrements) {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentSnap = await getDoc(tournamentRef);
      if (!tournamentSnap.exists()) continue;
      const current = toNumber(tournamentSnap.data()?.organizerCount, 1);
      await updateDoc(tournamentRef, { organizerCount: Math.max(1, current - amount) });
    }
  }

  async checkUserCanBeRemovedFromAllTournaments(userId: string): Promise<boolean> {
    const links = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      )
    );

    for (const linkDoc of links.docs) {
      const tournamentId = String(linkDoc.data().tournamentId);
      const organizers = await getDocs(
        query(
          collection(db, 'organizerTournaments'),
          where('tournamentId', '==', tournamentId),
          where('isActive', '==', true)
        )
      );
      if (organizers.size <= 1) {
        return false;
      }
    }
    return true;
  }

  async createTournament(request: CreateTournamentRequest, userId: string): Promise<Tournament> {
    const authUid = auth.currentUser?.uid;
    if (!authUid) {
      throw new Error('You must be signed in to create a tournament');
    }
    const organizerUserId = authUid;

    const tournamentId = crypto.randomUUID();
    const orgId = crypto.randomUUID();
    const timestamp = nowIso();
    const tournamentData: TournamentDoc = {
      name: request.name,
      maxSize: request.maxSize,
      teamCount: 0,
      description: request.description,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
      organizerCount: 1,
    };

    const batch = writeBatch(db);
    batch.set(
      doc(db, 'tournaments', tournamentId),
      omitUndefined({ id: tournamentId, ...tournamentData })
    );
    batch.set(doc(db, 'organizerTournaments', orgId), {
      id: orgId,
      userId: organizerUserId,
      tournamentId,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
    });

    try {
      await batch.commit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tournament';
      if (message.includes('permission') || message.includes('PERMISSION_DENIED')) {
        throw new Error(
          'Could not create tournament membership. Deploy the latest Firestore rules (firebase deploy --only firestore:rules) and ensure your email is verified.'
        );
      }
      throw err;
    }

    if (userId !== organizerUserId) {
      console.warn('createTournament: passed userId did not match auth uid; used auth uid for membership');
    }

    return mapTournament(tournamentId, tournamentData);
  }

  async addTeamToTournament(tournamentId: string, _teamId: string): Promise<void> {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.teamCount >= tournament.maxSize) {
      throw new Error('Tournament is full');
    }
    await updateDoc(doc(db, 'tournaments', tournamentId), {
      teamCount: tournament.teamCount + 1,
      updatedAt: nowIso(),
    });
  }

  async updateTournament(tournamentId: string, request: UpdateTournamentRequest): Promise<Tournament> {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!snap.exists()) throw new Error('Tournament not found');
    const existing = snap.data() as TournamentDoc;

    const updates: Partial<TournamentDoc> = {
      updatedAt: nowIso(),
    };
    if (request.name?.trim()) updates.name = request.name.trim();
    if (request.description !== undefined) updates.description = request.description.trim();

    await updateDoc(doc(db, 'tournaments', tournamentId), omitUndefined(updates));
    return mapTournament(tournamentId, { ...existing, ...updates } as TournamentDoc);
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    try {
      const { eventService } = await import('./eventService');
      await eventService.deleteEventsByTournamentId(tournamentId);
    } catch (eventError) {
      console.warn('Failed to delete tournament events:', eventError);
    }

    await deleteQueryBatch('organizerTournaments', [where('tournamentId', '==', tournamentId)]);
    await deleteQueryBatch('refereeTournaments', [where('tournamentId', '==', tournamentId)]);
    await deleteQueryBatch('tournamentInvites', [where('tournamentId', '==', tournamentId)]);
    await deleteDoc(doc(db, 'tournaments', tournamentId));
  }

  async isUserOrganizer(userId: string, tournamentId: string): Promise<boolean> {
    const links = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', true)
      )
    );
    return !links.empty;
  }

  async isUserReferee(userId: string, tournamentId: string): Promise<boolean> {
    const links = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', true)
      )
    );
    return !links.empty;
  }

  async hasRefereeTournamentLink(userId: string, tournamentId: string): Promise<boolean> {
    const links = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId)
      )
    );
    return !links.empty;
  }

  async hasOrganizerTournamentLink(userId: string, tournamentId: string): Promise<boolean> {
    const links = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId)
      )
    );
    return !links.empty;
  }

  async getUserTournamentRole(
    userId: string,
    tournamentId: string
  ): Promise<'organizer' | 'referee' | null> {
    if (await this.isUserOrganizer(userId, tournamentId)) return 'organizer';
    if (await this.isUserReferee(userId, tournamentId)) return 'referee';
    return null;
  }

  async getTournamentsByReferee(userId: string): Promise<Tournament[]> {
    const refereeLinks = await queryByField<{ tournamentId: string; isActive: boolean }>(
      'refereeTournaments',
      'userId',
      userId
    );
    const activeIds = refereeLinks.filter((r) => r.isActive).map((r) => r.tournamentId);
    const tournaments: Tournament[] = [];
    for (const id of activeIds) {
      const t = await this.getTournamentById(id);
      if (t) tournaments.push(t);
    }
    return tournaments;
  }

  async getTournamentReferees(tournamentId: string): Promise<Array<Record<string, unknown>>> {
    const referees = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', true)
      )
    );

    const details: Array<Record<string, unknown>> = [];
    for (const refDoc of referees.docs) {
      const userId = String(refDoc.data().userId);
      const profileSnap = await getDoc(doc(db, 'userProfiles', userId));
      if (!profileSnap.exists()) continue;
      const profile = profileSnap.data();
      details.push({
        userId,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        email: profile?.email,
        profilePhotoUrl: profile?.profilePhotoUrl,
        phoneNumber: profile?.phoneNumber,
        role: 'REFEREE',
        refereeId: refDoc.id,
      });
    }
    return details;
  }

  async getPendingRefereeInvitesForTournament(
    tournamentId: string
  ): Promise<Array<Record<string, unknown>>> {
    const pending = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', false)
      )
    );

    const invites: Array<Record<string, unknown>> = [];
    for (const inviteDoc of pending.docs) {
      const userId = String(inviteDoc.data().userId);
      const profileSnap = await getDoc(doc(db, 'userProfiles', userId));
      if (!profileSnap.exists()) continue;
      const profile = profileSnap.data();
      invites.push({
        refereeTournamentId: inviteDoc.id,
        userId,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        email: profile?.email,
      });
    }
    return invites;
  }

  async getRefereeTournamentMembership(
    userId: string,
    tournamentId: string
  ): Promise<RefereeTournamentMembership | null> {
    const links = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId)
      )
    );
    if (links.empty) return null;

    const activeDoc = links.docs.find((d) => d.data().isActive === true);
    const docSnap = activeDoc ?? links.docs[0];
    const data = docSnap.data() as RefereeTournamentDoc;
    const prefs = resolveRefereeNotificationPreferences(data);
    return {
      id: docSnap.id,
      userId: String(data.userId),
      tournamentId: String(data.tournamentId),
      isActive: data.isActive === true,
      ...prefs,
    };
  }

  async updateRefereeNotificationPreferences(
    refereeTournamentId: string,
    userId: string,
    prefs: NotificationPreferences
  ): Promise<NotificationPreferences> {
    const refRef = doc(db, 'refereeTournaments', refereeTournamentId);
    const snap = await getDoc(refRef);
    const data = docToData<RefereeTournamentDoc>(snap);
    if (!data) {
      throw new Error('Referee tournament membership not found');
    }
    if (data.userId !== userId) {
      throw new Error('You can only update your own notification preferences');
    }

    await updateDoc(refRef, {
      emailNotificationsEnabled: prefs.emailNotificationsEnabled,
      reminderLeadTime: prefs.reminderLeadTime,
    });

    return prefs;
  }

  async inviteRefereeToTournament(tournamentId: string, email: string): Promise<void> {
    const users = await getDocs(query(collection(db, 'userProfiles'), where('email', '==', email)));
    if (users.empty) {
      throw new Error(`User with email ${email} not found`);
    }
    const userId = users.docs[0].id;

    if (await this.hasOrganizerTournamentLink(userId, tournamentId)) {
      throw new Error('User is already an organizer or has a pending organizer invite for this tournament');
    }

    if (await this.hasRefereeTournamentLink(userId, tournamentId)) {
      throw new Error('User is already a referee or has a pending referee invite for this tournament');
    }

    const id = crypto.randomUUID();
    await setDoc(doc(db, 'refereeTournaments', id), {
      id,
      userId,
      tournamentId,
      createdAt: nowIso(),
      isActive: false,
      ...refereeNotificationDefaults(),
    });
  }

  async getPendingRefereeInvites(userId: string): Promise<Array<Record<string, unknown>>> {
    const pending = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('userId', '==', userId),
        where('isActive', '==', false)
      )
    );

    const invites: Array<Record<string, unknown>> = [];
    for (const inviteDoc of pending.docs) {
      const tournamentId = String(inviteDoc.data().tournamentId);
      const tournamentSnap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (!tournamentSnap.exists()) continue;
      const tournament = tournamentSnap.data();
      invites.push({
        refereeTournamentId: inviteDoc.id,
        tournamentId,
        tournamentName: tournament?.name,
        tournamentDescription: tournament?.description,
      });
    }
    return invites;
  }

  async acceptRefereeInvite(refereeTournamentId: string): Promise<void> {
    const refRef = doc(db, 'refereeTournaments', refereeTournamentId);
    const snap = await getDoc(refRef);
    if (!snap.exists()) {
      throw new Error('RefereeTournament relationship not found');
    }

    const userId = String(snap.data().userId);
    const tournamentId = String(snap.data().tournamentId);
    if (await this.hasOrganizerTournamentLink(userId, tournamentId)) {
      throw new Error('You cannot be a referee while you are an organizer for this tournament');
    }

    const existing = snap.data() as RefereeTournamentDoc;
    const defaults = refereeNotificationDefaults();
    await updateDoc(refRef, {
      isActive: true,
      updatedAt: nowIso(),
      ...(existing.emailNotificationsEnabled === undefined
        ? { emailNotificationsEnabled: defaults.emailNotificationsEnabled }
        : {}),
      ...(existing.reminderLeadTime === undefined
        ? { reminderLeadTime: defaults.reminderLeadTime }
        : {}),
    });
  }

  async declineRefereeInvite(refereeTournamentId: string): Promise<void> {
    await deleteDoc(doc(db, 'refereeTournaments', refereeTournamentId));
  }

  async removeRefereeFromTournament(tournamentId: string, userId: string): Promise<void> {
    const links = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('userId', '==', userId),
        where('tournamentId', '==', tournamentId)
      )
    );
    if (links.empty) return;
    await deleteDoc(links.docs[0].ref);
  }

  async cleanupUserRefereeRelationships(userId: string): Promise<void> {
    const links = await queryByField<{ id: string }>('refereeTournaments', 'userId', userId);
    for (const link of links) {
      await deleteDoc(doc(db, 'refereeTournaments', link.id));
    }
  }

  async getActiveRefereeUserIds(tournamentId: string): Promise<string[]> {
    const referees = await getDocs(
      query(
        collection(db, 'refereeTournaments'),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', true)
      )
    );
    return referees.docs.map((d) => String(d.data().userId));
  }

  async checkOrganizerSafety(
    userId: string,
    tournamentId: string,
    _action: string
  ): Promise<{ canProceed: boolean; message: string }> {
    const organizers = await getDocs(
      query(
        collection(db, 'organizerTournaments'),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', true)
      )
    );

    const isOrganizer = organizers.docs.some((d) => d.data().userId === userId);
    if (!isOrganizer) {
      return { canProceed: true, message: 'Safe to proceed' };
    }

    if (organizers.size <= 1) {
      return {
        canProceed: false,
        message: 'Cannot proceed - would leave tournament with no organizers',
      };
    }

    return { canProceed: true, message: 'Safe to proceed' };
  }

  async inviteTeamToTournament(tournamentId: string, teamId: string): Promise<void> {
    const tournamentSnap = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!tournamentSnap.exists()) throw new Error('Tournament not found');

    const tournament = tournamentSnap.data();
    const teamCount = toNumber(tournament?.teamCount);
    const maxSize = toNumber(tournament?.maxSize);
    if (teamCount >= maxSize) {
      throw new Error(`Tournament is already at maximum capacity (${teamCount}/${maxSize} teams)`);
    }

    const inviteRef = doc(collection(db, 'tournamentInvites'));
    await setDoc(inviteRef, {
      id: inviteRef.id,
      teamId,
      tournamentId,
      createdAt: nowIso(),
      isActive: false,
    });
  }

  async getTournamentTeamInvites(tournamentId: string): Promise<Array<Record<string, unknown>>> {
    const invites = await getDocs(
      query(
        collection(db, 'tournamentInvites'),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', false)
      )
    );
    return invites.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getAcceptedTournamentTeamInvites(
    tournamentId: string
  ): Promise<Array<{ id: string; teamId: string; tournamentId: string }>> {
    const invites = await getDocs(
      query(
        collection(db, 'tournamentInvites'),
        where('tournamentId', '==', tournamentId),
        where('isActive', '==', true)
      )
    );
    return invites.docs.map((d) => ({
      id: d.id,
      teamId: String(d.data().teamId),
      tournamentId: String(d.data().tournamentId),
    }));
  }

  async acceptTournamentInvite(inviteId: string): Promise<void> {
    const inviteRef = doc(db, 'tournamentInvites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Tournament invite not found');

    const tournamentId = String(inviteSnap.data().tournamentId);
    await updateDoc(inviteRef, { isActive: true });

    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);
    if (tournamentSnap.exists()) {
      const current = toNumber(tournamentSnap.data()?.teamCount, 0);
      await updateDoc(tournamentRef, { teamCount: current + 1 });
    }
  }

  async declineTournamentInvite(inviteId: string): Promise<void> {
    await deleteDoc(doc(db, 'tournamentInvites', inviteId));
  }

  async checkExistingInvite(tournamentId: string, teamId: string): Promise<boolean> {
    const invites = await getDocs(
      query(
        collection(db, 'tournamentInvites'),
        where('teamId', '==', teamId),
        where('tournamentId', '==', tournamentId)
      )
    );
    return !invites.empty;
  }

  async removeTeamFromTournament(tournamentId: string, teamId: string): Promise<void> {
    await this.leaveTournament(teamId, tournamentId);
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
}

export const tournamentService = new TournamentService();
