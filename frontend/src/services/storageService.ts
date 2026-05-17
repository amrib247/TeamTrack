import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

class StorageService {
  async uploadChatFile(file: File, teamId: string): Promise<string> {
    const uuid = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `chat-files/${teamId}/${uuid}_${safeName}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }
}

export const storageService = new StorageService();
