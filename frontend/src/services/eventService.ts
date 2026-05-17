import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';
import { db } from '../firebase';
import { deleteQueryBatch, docToData, nowIso, omitUndefined, queryByField } from '../lib/firestoreUtils';
import { filterAndSortByDate } from '../lib/dateUtils';

type EventDoc = Omit<Event, 'id'>;

class EventService {
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const eventRef = doc(collection(db, 'events'));
    const timestamp = nowIso();
    const event: Event = {
      id: eventRef.id,
      ...eventData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(eventRef, {
      teamId: event.teamId,
      name: event.name,
      tournamentId: event.tournamentId ?? null,
      opposingTeamId: event.opposingTeamId ?? null,
      date: event.date,
      startTime: event.startTime,
      lengthMinutes: event.lengthMinutes,
      location: event.location,
      description: event.description ?? null,
      score: event.score ?? null,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    });
    return event;
  }

  async getEventsByTeamId(teamId: string): Promise<Event[]> {
    const events = await queryByField<EventDoc>('events', 'teamId', teamId);
    const mapped = events.map(({ id, ...rest }) => ({ id, ...rest }));
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
    return { id, ...rest };
  }

  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<Event> {
    const eventRef = doc(db, 'events', eventId);
    const existing = await getDoc(eventRef);
    if (!existing.exists()) {
      throw new Error('Event not found');
    }
    const merged = {
      ...existing.data(),
      ...eventData,
      updatedAt: nowIso(),
    };
    await setDoc(eventRef, omitUndefined(merged as Record<string, unknown>) as Record<string, unknown>, { merge: true });
    return { id: eventId, ...(merged as EventDoc) };
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
      .map((d) => ({ id: d.id, ...(d.data() as EventDoc) }))
      .sort((a, b) => {
        const keyA = `${a.date}T${a.startTime}`;
        const keyB = `${b.date}T${b.startTime}`;
        return keyB.localeCompare(keyA);
      });
  }

  async getEventsByTournamentId(tournamentId: string): Promise<Event[]> {
    const events = await queryByField<EventDoc>('events', 'tournamentId', tournamentId);
    return events.map(({ id, ...rest }) => ({ id, ...rest }));
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
