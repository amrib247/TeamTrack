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
import type { ChatMessage, ChatRoom } from '../types/Auth';
import { db } from '../firebase';
import { nowIso, omitUndefined } from '../lib/firestoreUtils';

type ChatMessageDoc = {
  teamId: string;
  userId: string;
  content: string;
  timestamp: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  readBy?: Record<string, string>;
};

async function enrichMessage(docSnap: { id: string; data: () => ChatMessageDoc }): Promise<ChatMessage> {
  const data = docSnap.data();
  const profileSnap = await getDoc(doc(db, 'userProfiles', data.userId));
  const profile = profileSnap.data();
  return {
    id: docSnap.id,
    teamId: data.teamId,
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
  async getTeamMessages(teamId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'chat_messages'), where('teamId', '==', teamId))
      );

      const messages = await Promise.all(
        snapshot.docs.map((d) => enrichMessage({ id: d.id, data: () => d.data() as ChatMessageDoc }))
      );

      return messages
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to fetch team messages:', error);
      throw new Error('Failed to load chat messages');
    }
  }

  async sendMessage(
    teamId: string,
    content: string,
    userId: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT',
    fileUrl?: string,
    fileName?: string
  ): Promise<ChatMessage> {
    const timestamp = nowIso();
    const messageData: ChatMessageDoc = {
      teamId,
      userId,
      content,
      timestamp,
      messageType,
      ...(fileUrl ? { fileUrl } : {}),
      ...(fileName ? { fileName } : {}),
      readBy: {},
    };

    const docRef = await addDoc(collection(db, 'chat_messages'), omitUndefined(messageData));
    await this.updateChatRoom(teamId, { ...messageData, id: docRef.id });

    const profileSnap = await getDoc(doc(db, 'userProfiles', userId));
    const profile = profileSnap.data();

    return {
      id: docRef.id,
      teamId,
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

  async markMessagesAsRead(_teamId: string, messageIds: string[], userId: string): Promise<void> {
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

    if (!canDelete) {
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

    if (!canDelete) {
      throw new Error('User not authorized to delete this message');
    }

    await deleteDoc(messageRef);
  }

  async getChatRoom(teamId: string, _userId: string): Promise<ChatRoom> {
    return this.getOrCreateChatRoom(teamId);
  }

  private async getOrCreateChatRoom(teamId: string): Promise<ChatRoom> {
    const existing = await getDocs(
      query(collection(db, 'chat_rooms'), where('teamId', '==', teamId))
    );

    if (!existing.empty) {
      const d = existing.docs[0];
      const data = d.data();
      return {
        id: d.id,
        teamId: String(data.teamId),
        teamName: String(data.teamName ?? `Team ${teamId}`),
        unreadCount: Number(data.unreadCount ?? 0),
        lastActivity: String(data.lastActivity ?? nowIso()),
      };
    }

    const teamSnap = await getDoc(doc(db, 'teams', teamId));
    const teamName = teamSnap.exists() ? String(teamSnap.data()?.teamName ?? `Team ${teamId}`) : `Team ${teamId}`;
    const timestamp = nowIso();

    const roomRef = doc(collection(db, 'chat_rooms'));
    const roomData = {
      teamId,
      teamName,
      unreadCount: 0,
      lastActivity: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(roomRef, roomData);

    return {
      id: roomRef.id,
      teamId,
      teamName,
      unreadCount: 0,
      lastActivity: timestamp,
    };
  }

  private async updateChatRoom(teamId: string, message: ChatMessageDoc & { id: string }): Promise<void> {
    const rooms = await getDocs(query(collection(db, 'chat_rooms'), where('teamId', '==', teamId)));
    if (rooms.empty) return;

    const roomDoc = rooms.docs[0];
    await updateDoc(roomDoc.ref, {
      lastMessage: message,
      lastActivity: message.timestamp,
      updatedAt: nowIso(),
    });
  }
}

export const chatService = new ChatService();
