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
} from 'firebase/firestore';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';
import { db } from '../firebase';
import { deleteQueryBatch, docToData, nowIso, omitUndefined, queryByField } from '../lib/firestoreUtils';
import { filterAndSortByDate } from '../lib/dateUtils';
import { normalizeScheduledFields, type ScheduledFields } from '../lib/timezoneUtils';

type EventDoc = Omit<Event, 'id'>;

/** Treat null, empty string, and legacy bad values as “no tournament”. */
export function normalizeTournamentId(
  tournamentId?: string | null
): string | undefined {
  if (!tournamentId || tournamentId === '' || tournamentId === 'null') {
    return undefined;
  }
  return tournamentId;
}

export function isTournamentManagedEvent(event: Pick<Event, 'tournamentId'>): boolean {
  return normalizeTournamentId(event.tournamentId) !== undefined;
}

function normalizeEvent(id: string, data: EventDoc): Event {
  const schedule = normalizeScheduledFields(data as ScheduledFields);
  const tournamentId = normalizeTournamentId(data.tournamentId);
  return {
    id,
    ...data,
    ...schedule,
    tournamentId,
  };
}

function buildEventDoc(
  data: CreateEventRequest | (UpdateEventRequest & ScheduledFields),
  existing?: Partial<EventDoc>
): EventDoc {
  const scheduleFieldsProvided =
    data.date !== undefined || data.startTime !== undefined || data.timeZone !== undefined;

  const merged: ScheduledFields = {
    date: data.date ?? existing?.date ?? '',
    startTime: data.startTime ?? existing?.startTime ?? '',
    timeZone: data.timeZone ?? existing?.timeZone,
    // Recompute UTC when date/time/zone change; keeping old startAtUtc would ignore edits
    startAtUtc: scheduleFieldsProvided ? undefined : existing?.startAtUtc,
  };
  const schedule = normalizeScheduledFields(merged);
  return {
    ...(existing as EventDoc | undefined),
    ...(data as Partial<EventDoc>),
    ...schedule,
  } as EventDoc;
}

class EventService {
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const eventRef = doc(collection(db, 'events'));
    const timestamp = nowIso();
    const docFields = buildEventDoc(eventData);
    const event: Event = {
      id: eventRef.id,
      ...docFields,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(
      eventRef,
      omitUndefined({
        teamId: event.teamId,
        name: event.name,
        tournamentId: normalizeTournamentId(event.tournamentId) ?? null,
        opposingTeamId: event.opposingTeamId ?? null,
        date: event.date,
        startTime: event.startTime,
        timeZone: event.timeZone,
        startAtUtc: event.startAtUtc,
        lengthMinutes: event.lengthMinutes,
        location: event.location,
        description: event.description ?? null,
        score: event.score ?? null,
        refereeUserIds: event.refereeUserIds ?? null,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      })
    );
    return event;
  }

  async assignRefereesToGame(
    eventIds: string[],
    refereeUserIds: string[],
    tournamentId: string
  ): Promise<void> {
    if (refereeUserIds.length > 3) {
      throw new Error('A game can have at most 3 referees');
    }

    const uniqueIds = [...new Set(refereeUserIds)];
    const { tournamentService } = await import('./tournamentService');
    const activeRefereeIds = await tournamentService.getActiveRefereeUserIds(tournamentId);
    for (const userId of uniqueIds) {
      if (!activeRefereeIds.includes(userId)) {
        throw new Error('All assigned users must be active referees for this tournament');
      }
    }

    const timestamp = nowIso();
    for (const eventId of eventIds) {
      const eventRef = doc(db, 'events', eventId);
      const snap = await getDoc(eventRef);
      if (!snap.exists()) {
        throw new Error(`Event not found: ${eventId}`);
      }
      await updateDoc(eventRef, {
        refereeUserIds: uniqueIds.length > 0 ? uniqueIds : [],
        updatedAt: timestamp,
      });
    }
  }

  async getEventsByTeamId(teamId: string): Promise<Event[]> {
    const events = await queryByField<EventDoc>('events', 'teamId', teamId);
    const mapped = events.map(({ id, ...rest }) => normalizeEvent(id, rest));
    return filterAndSortByDate(mapped, async (id) => {
      await deleteQueryBatch('availabilities', [where('eventId', '==', id)]);
      await deleteDoc(doc(db, 'events', id));
    });
  }

  async getEventById(eventId: string): Promise<Event> {
    const snap = await getDoc(doc(db, 'events', eventId));
    const data = docToData<EventDoc>(snap);
    if (!data) {
      throw new Error('Event not found');
    }
    const { id, ...rest } = data;
    return normalizeEvent(id, rest);
  }

  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<Event> {
    const eventRef = doc(db, 'events', eventId);
    const existing = await getDoc(eventRef);
    if (!existing.exists()) {
      throw new Error('Event not found');
    }
    const existingData = existing.data() as EventDoc;
    const docFields = buildEventDoc(
      { ...eventData, date: eventData.date ?? existingData.date, startTime: eventData.startTime ?? existingData.startTime },
      existingData
    );
    const merged: EventDoc = {
      ...existingData,
      ...eventData,
      ...docFields,
      updatedAt: nowIso(),
    };
    await setDoc(eventRef, omitUndefined(merged as Record<string, unknown>) as Record<string, unknown>, {
      merge: true,
    });
    return normalizeEvent(eventId, merged);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await deleteQueryBatch('availabilities', [where('eventId', '==', eventId)]);
    await deleteDoc(doc(db, 'events', eventId));
  }

  async getEventsByDateRange(teamId: string, startDate: string, endDate: string): Promise<Event[]> {
    const snapshot = await getDocs(
      query(
        collection(db, 'events'),
        where('teamId', '==', teamId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )
    );
    return snapshot.docs
      .map((d) => normalizeEvent(d.id, d.data() as EventDoc))
      .sort((a, b) => new Date(b.startAtUtc).getTime() - new Date(a.startAtUtc).getTime());
  }

  async getEventsByTournamentId(tournamentId: string): Promise<Event[]> {
    const events = await queryByField<EventDoc>('events', 'tournamentId', tournamentId);
    return events.map(({ id, ...rest }) => normalizeEvent(id, rest));
  }

  async deleteEventsByTournamentId(tournamentId: string): Promise<void> {
    const events = await queryByField<EventDoc>('events', 'tournamentId', tournamentId);
    for (const event of events) {
      await deleteQueryBatch('availabilities', [where('eventId', '==', event.id)]);
      await deleteDoc(doc(db, 'events', event.id));
    }
  }
}

export const eventService = new EventService();
export { EventService };
