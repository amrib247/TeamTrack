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
import type { ChatMessage, ChatRoom, ChatScope } from '../types/Auth';
import { db } from '../firebase';
import { nowIso, omitUndefined } from '../lib/firestoreUtils';

type ChatMessageDoc = {
  teamId?: string;
  tournamentId?: string;
  userId: string;
  content: string;
  timestamp: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  readBy?: Record<string, string>;
};

function scopeField(scope: ChatScope): 'teamId' | 'tournamentId' {
  return scope === 'team' ? 'teamId' : 'tournamentId';
}

async function enrichMessage(docSnap: { id: string; data: () => ChatMessageDoc }): Promise<ChatMessage> {
  const data = docSnap.data();
  const profileSnap = await getDoc(doc(db, 'userProfiles', data.userId));
  const profile = profileSnap.data();
  return {
    id: docSnap.id,
    ...(data.teamId ? { teamId: data.teamId } : {}),
    ...(data.tournamentId ? { tournamentId: data.tournamentId } : {}),
    userId: data.userId,
    userFirstName: String(profile?.firstName ?? 'Unknown'),
    userLastName: String(profile?.lastName ?? 'User'),
    content: data.content,
    timestamp: data.timestamp,
    messageType: (data.messageType as ChatMessage['messageType']) ?? 'TEXT',
    fileUrl: data.fileUrl,
    fileName: data.fileName,
  };
}

export class ChatService {
  async getMessages(
    scope: ChatScope,
    scopeId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const field = scopeField(scope);
      const snapshot = await getDocs(
        query(collection(db, 'chat_messages'), where(field, '==', scopeId))
      );

      const messages = await Promise.all(
        snapshot.docs.map((d) => enrichMessage({ id: d.id, data: () => d.data() as ChatMessageDoc }))
      );

      return messages
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      throw new Error('Failed to load chat messages');
    }
  }

  async getTeamMessages(teamId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    return this.getMessages('team', teamId, limit, offset);
  }

  async sendMessage(
    scope: ChatScope,
    scopeId: string,
    content: string,
    userId: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT',
    fileUrl?: string,
    fileName?: string
  ): Promise<ChatMessage> {
    const timestamp = nowIso();
    const messageData: ChatMessageDoc = {
      ...(scope === 'team' ? { teamId: scopeId } : { tournamentId: scopeId }),
      userId,
      content,
      timestamp,
      messageType,
      ...(fileUrl ? { fileUrl } : {}),
      ...(fileName ? { fileName } : {}),
      readBy: {},
    };

    const docRef = await addDoc(collection(db, 'chat_messages'), omitUndefined(messageData));
    await this.updateChatRoom(scope, scopeId, { ...messageData, id: docRef.id });

    const profileSnap = await getDoc(doc(db, 'userProfiles', userId));
    const profile = profileSnap.data();

    return {
      id: docRef.id,
      ...(scope === 'team' ? { teamId: scopeId } : { tournamentId: scopeId }),
      userId,
      userFirstName: String(profile?.firstName ?? 'Unknown'),
      userLastName: String(profile?.lastName ?? 'User'),
      content,
      timestamp,
      messageType,
      fileUrl,
      fileName,
    };
  }

  async markMessagesAsRead(_scopeId: string, messageIds: string[], userId: string): Promise<void> {
    try {
      const readAt = nowIso();
      await Promise.all(
        messageIds.map((messageId) =>
          updateDoc(doc(db, 'chat_messages', messageId), {
            [`readBy.${userId}`]: readAt,
          })
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db, 'chat_messages', messageId);
    const snap = await getDoc(messageRef);
    if (!snap.exists()) {
      throw new Error('Message not found');
    }

    const data = snap.data() as ChatMessageDoc;
    let canDelete = data.userId === userId;

    if (!canDelete && data.teamId) {
      const members = await getDocs(
        query(
          collection(db, 'userTeams'),
          where('teamId', '==', data.teamId),
          where('userId', '==', userId)
        )
      );
      if (!members.empty && members.docs[0].data().role === 'COACH') {
        canDelete = true;
      }
    }

    if (!canDelete && data.tournamentId) {
      const organizers = await getDocs(
        query(
          collection(db, 'organizerTournaments'),
          where('tournamentId', '==', data.tournamentId),
          where('userId', '==', userId),
          where('isActive', '==', true)
        )
      );
      if (!organizers.empty) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      throw new Error('User not authorized to delete this message');
    }

    await deleteDoc(messageRef);
  }

  async getChatRoom(scope: ChatScope, scopeId: string, _userId: string): Promise<ChatRoom> {
    return this.getOrCreateChatRoom(scope, scopeId);
  }

  private async getOrCreateChatRoom(scope: ChatScope, scopeId: string): Promise<ChatRoom> {
    const field = scopeField(scope);
    const existing = await getDocs(
      query(collection(db, 'chat_rooms'), where(field, '==', scopeId))
    );

    if (!existing.empty) {
      const d = existing.docs[0];
      const data = d.data();
      if (scope === 'team') {
        return {
          id: d.id,
          teamId: String(data.teamId),
          teamName: String(data.teamName ?? `Team ${scopeId}`),
          unreadCount: Number(data.unreadCount ?? 0),
          lastActivity: String(data.lastActivity ?? nowIso()),
        };
      }
      return {
        id: d.id,
        tournamentId: String(data.tournamentId),
        tournamentName: String(data.tournamentName ?? `Tournament ${scopeId}`),
        unreadCount: Number(data.unreadCount ?? 0),
        lastActivity: String(data.lastActivity ?? nowIso()),
      };
    }

    const timestamp = nowIso();
    const roomRef = doc(collection(db, 'chat_rooms'));

    if (scope === 'team') {
      const teamSnap = await getDoc(doc(db, 'teams', scopeId));
      const teamName = teamSnap.exists()
        ? String(teamSnap.data()?.teamName ?? `Team ${scopeId}`)
        : `Team ${scopeId}`;
      const roomData = {
        teamId: scopeId,
        teamName,
        unreadCount: 0,
        lastActivity: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await setDoc(roomRef, roomData);
      return {
        id: roomRef.id,
        teamId: scopeId,
        teamName,
        unreadCount: 0,
        lastActivity: timestamp,
      };
    }

    const tournamentSnap = await getDoc(doc(db, 'tournaments', scopeId));
    const tournamentName = tournamentSnap.exists()
      ? String(tournamentSnap.data()?.name ?? `Tournament ${scopeId}`)
      : `Tournament ${scopeId}`;
    const roomData = {
      tournamentId: scopeId,
      tournamentName,
      unreadCount: 0,
      lastActivity: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(roomRef, roomData);
    return {
      id: roomRef.id,
      tournamentId: scopeId,
      tournamentName,
      unreadCount: 0,
      lastActivity: timestamp,
    };
  }

  private async updateChatRoom(
    scope: ChatScope,
    scopeId: string,
    message: ChatMessageDoc & { id: string }
  ): Promise<void> {
    const field = scopeField(scope);
    const rooms = await getDocs(query(collection(db, 'chat_rooms'), where(field, '==', scopeId)));
    if (rooms.empty) {
      await this.getOrCreateChatRoom(scope, scopeId);
      const created = await getDocs(query(collection(db, 'chat_rooms'), where(field, '==', scopeId)));
      if (created.empty) return;
      await updateDoc(created.docs[0].ref, {
        lastMessage: message,
        lastActivity: message.timestamp,
        updatedAt: nowIso(),
      });
      return;
    }

    const roomDoc = rooms.docs[0];
    await updateDoc(roomDoc.ref, {
      lastMessage: message,
      lastActivity: message.timestamp,
      updatedAt: nowIso(),
    });
  }
}

export const chatService = new ChatService();
