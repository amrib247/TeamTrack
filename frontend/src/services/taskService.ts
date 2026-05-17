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
import type { Task, CreateTaskRequest, TaskUser } from '../types/Task';
import { db } from '../firebase';
import { docToData, nowIso, omitUndefined, queryByField } from '../lib/firestoreUtils';
import { filterAndSortByDate } from '../lib/dateUtils';

type TaskDoc = Omit<Task, 'id' | 'getCurrentSignups' | 'isFull' | 'hasMinimumSignups' | 'isUserSignedUp' | 'canSignUp'>;

function enrichTask(data: TaskDoc & { id: string }): Task {
  const signedUpUserIds = data.signedUpUserIds ?? [];
  const currentSignups = signedUpUserIds.length;
  return {
    ...data,
    signedUpUserIds,
    getCurrentSignups: currentSignups,
    isFull: currentSignups >= data.maxSignups,
    hasMinimumSignups: currentSignups >= data.minSignups,
    isUserSignedUp: (userId: string) => signedUpUserIds.includes(userId),
    canSignUp: currentSignups < data.maxSignups,
  };
}

class TaskService {
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const taskRef = doc(collection(db, 'tasks'));
    const timestamp = nowIso();
    const taskDoc: TaskDoc = {
      ...taskData,
      signedUpUserIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(taskRef, omitUndefined(taskDoc));
    return enrichTask({ id: taskRef.id, ...taskDoc });
  }

  async getTasksByTeamId(teamId: string): Promise<Task[]> {
    const tasks = await queryByField<TaskDoc>('tasks', 'teamId', teamId);
    const mapped = tasks.map((t) => enrichTask(t));
    const filtered = await filterAndSortByDate(
      mapped.map(({ id, date, startTime }) => ({ id, date, startTime })),
      async (id) => deleteDoc(doc(db, 'tasks', id))
    );
    const keptIds = new Set(filtered.map((t) => t.id));
    return mapped.filter((t) => keptIds.has(t.id));
  }

  async getTaskById(taskId: string): Promise<Task> {
    const snap = await getDoc(doc(db, 'tasks', taskId));
    const data = docToData<TaskDoc>(snap);
    if (!data) {
      throw new Error('Task not found');
    }
    return enrichTask(data);
  }

  async updateTask(taskId: string, taskData: Partial<CreateTaskRequest>): Promise<Task> {
    const existing = await this.getTaskById(taskId);
    const currentSignups = existing.signedUpUserIds?.length ?? 0;
    if (taskData.maxSignups !== undefined && taskData.maxSignups < currentSignups) {
      throw new Error('Maximum signups cannot be less than current signups');
    }

    const taskRef = doc(db, 'tasks', taskId);
    const merged = {
      ...existing,
      ...taskData,
      updatedAt: nowIso(),
    };
    await setDoc(taskRef, omitUndefined({
      teamId: merged.teamId,
      name: merged.name,
      location: merged.location,
      description: merged.description,
      date: merged.date,
      startTime: merged.startTime,
      maxSignups: merged.maxSignups,
      minSignups: merged.minSignups,
      signedUpUserIds: merged.signedUpUserIds,
      createdBy: merged.createdBy,
      createdAt: merged.createdAt,
      updatedAt: merged.updatedAt,
    }));
    return enrichTask({ id: taskId, ...(merged as TaskDoc) });
  }

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  }

  async signUpForTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTaskById(taskId);
    if (task.signedUpUserIds.length >= task.maxSignups) {
      throw new Error('Task is already full');
    }
    if (task.signedUpUserIds.includes(userId)) {
      throw new Error('User is already signed up for this task');
    }

    const signedUpUserIds = [...task.signedUpUserIds, userId];
    await setDoc(
      doc(db, 'tasks', taskId),
      { signedUpUserIds, updatedAt: nowIso() },
      { merge: true }
    );
    return this.getTaskById(taskId);
  }

  async removeFromTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTaskById(taskId);
    if (!task.signedUpUserIds.includes(userId)) {
      throw new Error('User is not signed up for this task');
    }

    const signedUpUserIds = task.signedUpUserIds.filter((id) => id !== userId);
    await setDoc(
      doc(db, 'tasks', taskId),
      { signedUpUserIds, updatedAt: nowIso() },
      { merge: true }
    );
    return this.getTaskById(taskId);
  }

  async getTaskUsers(taskId: string): Promise<TaskUser[]> {
    const task = await this.getTaskById(taskId);
    const users: TaskUser[] = [];

    for (const userId of task.signedUpUserIds) {
      const profileSnap = await getDoc(doc(db, 'userProfiles', userId));
      if (!profileSnap.exists()) continue;
      const profile = profileSnap.data();

      const userTeamSnap = await getDocs(
        query(
          collection(db, 'userTeams'),
          where('userId', '==', userId),
          where('teamId', '==', task.teamId)
        )
      );
      const role = userTeamSnap.empty ? 'UNKNOWN' : String(userTeamSnap.docs[0].data().role ?? 'UNKNOWN');

      users.push({
        userId,
        firstName: String(profile?.firstName ?? ''),
        lastName: String(profile?.lastName ?? ''),
        email: String(profile?.email ?? ''),
        role,
      });
    }

    return users.sort((a, b) => {
      if (a.role === 'COACH' && b.role !== 'COACH') return -1;
      if (b.role === 'COACH' && a.role !== 'COACH') return 1;
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }
}

export const taskService = new TaskService();
export { TaskService };
