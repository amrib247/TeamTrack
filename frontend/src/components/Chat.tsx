import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { storageService } from '../services/storageService';
import type { ChatMessage, ChatScope } from '../types/Auth';
import AppIcon from './icons/AppIcon';
import './Chat.css';

interface ChatProps {
  scope: ChatScope;
  scopeId: string;
  currentUserId: string;
  displayName: string;
}

interface FileUpload {
  file: File;
  preview?: string;
  uploading: boolean;
  error?: string;
}

function Chat({ scope, scopeId, currentUserId, displayName }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fileUpload, setFileUpload] = useState<FileUpload | null>(null);

  const subtitle = scope === 'team' ? 'Team communication hub' : 'Tournament communication hub';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageLimit = 50;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, [scopeId, scope]);

  const loadMessages = async (offset: number = 0) => {
    try {
      setError('');

      const fetchedMessages = await chatService.getMessages(scope, scopeId, messageLimit, offset);

      if (offset === 0) {
        setMessages(fetchedMessages);
      } else {
        setMessages(prev => [...fetchedMessages, ...prev]);
      }

      setHasMoreMessages(fetchedMessages.length === messageLimit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Unable to connect to the server. Please check if the backend is running and try again.');
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages) return;

    setLoadingMore(true);
    await loadMessages(messages.length);
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'text/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument',
      'image/', 'video/', 'audio/'
    ];

    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      setError('File type not supported');
      return;
    }

    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setFileUpload({
      file,
      preview,
      uploading: false
    });
    setError('');
  };

  const removeFile = () => {
    if (fileUpload?.preview) {
      URL.revokeObjectURL(fileUpload.preview);
    }
    setFileUpload(null);
  };

  const uploadFile = async (): Promise<{ fileUrl: string; fileName: string } | null> => {
    if (!fileUpload) return null;

    setFileUpload(prev => prev ? { ...prev, uploading: true, error: undefined } : null);

    try {
      const fileUrl = await storageService.uploadChatFile(fileUpload.file, scopeId);
      return {
        fileUrl,
        fileName: fileUpload.file.name,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      setFileUpload(prev => prev ? { ...prev, uploading: false, error: errorMessage } : null);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && !fileUpload) || sending) return;

    try {
      setSending(true);
      setError('');

      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT';

      if (fileUpload) {
        const uploadResult = await uploadFile();
        if (uploadResult) {
          fileUrl = uploadResult.fileUrl;
          fileName = uploadResult.fileName;
          messageType = fileUpload.file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
        } else {
          setError('Failed to upload file');
          return;
        }
      }

      const sentMessage = await chatService.sendMessage(
        scope,
        scopeId,
        newMessage.trim() || (fileUpload ? `Shared ${fileUpload.file.name}` : ''),
        currentUserId,
        messageType,
        fileUrl,
        fileName
      );

      setMessages(prev => [...prev, sentMessage]);

      setNewMessage('');
      removeFile();

      await chatService.markMessagesAsRead(scopeId, [sentMessage.id], currentUserId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await chatService.deleteMessage(messageId, currentUserId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const canDeleteMessage = (message: ChatMessage) => {
    return message.userId === currentUserId;
  };

  const getUserDisplayName = (message: ChatMessage): string => {
    return `${message.userFirstName} ${message.userLastName}`;
  };

  const getUserInitials = (message: ChatMessage): string => {
    return `${message.userFirstName.charAt(0)}${message.userLastName.charAt(0)}`.toUpperCase();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (messages.length === 0 && error) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h2 className="section-heading"><AppIcon name="message" size={22} /> {displayName} Chat</h2>
          <p className="chat-subtitle">{subtitle}</p>
        </div>
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => loadMessages()} className="btn btn-secondary btn-small">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="section-heading"><AppIcon name="message" size={22} /> {displayName} Chat</h2>
        <p className="chat-subtitle">{subtitle}</p>
      </div>

      {error && (
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => loadMessages()} className="btn btn-secondary btn-small">
            Retry
          </button>
        </div>
      )}

      <div className="chat-messages" ref={chatContainerRef}>
        {hasMoreMessages && (
          <div className="load-more-container">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="btn btn-secondary btn-small"
            >
              {loadingMore ? 'Loading...' : 'Load More Messages'}
            </button>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.userId === currentUserId ? 'own-message' : 'other-message'}`}
          >
            <div className="message-avatar">
              <div className="message-initials">
                {getUserInitials(message)}
              </div>
            </div>

            <div className="message-content">
              <div className="message-header">
                <span className="message-author">
                  {getUserDisplayName(message)}
                </span>
                <span className="message-time">{formatTimestamp(message.timestamp)}</span>
              </div>

              <div className="message-text">
                {message.messageType === 'TEXT' && message.content}
                {message.messageType === 'IMAGE' && message.fileUrl && (
                  <div className="message-image">
                    <img src={message.fileUrl} alt="Shared image" />
                  </div>
                )}
                {message.messageType === 'FILE' && message.fileUrl && (
                  <div className="message-file">
                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                      <AppIcon name="paperclip" size={14} /> {message.fileName || 'Download file'}
                    </a>
                  </div>
                )}
              </div>

              {canDeleteMessage(message) && (
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="message-delete-btn"
                  title="Delete message"
                >
                  <AppIcon name="trash" size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        {fileUpload && (
          <div className="file-preview-container">
            <div className="file-preview">
              {fileUpload.preview && (
                <img src={fileUpload.preview} alt="File preview" className="file-preview-image" />
              )}
              <div className="file-info">
                <span className="file-name">{fileUpload.file.name}</span>
                <span className="file-size">{formatFileSize(fileUpload.file.size)}</span>
                {fileUpload.error && <span className="file-error">{fileUpload.error}</span>}
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="remove-file-btn"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="chat-input-container">
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept="*/*"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary add-file-btn"
            title="Add file attachment"
          >
            <span className="add-file-label">File upload</span>
            <span className="add-file-icon">+</span>
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={fileUpload ? "Add a message (optional)..." : "Type your message..."}
            className="chat-input"
            disabled={sending}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !fileUpload) || sending}
            className="btn btn-primary chat-send-btn"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="chat-input-info">
          <span className="character-count">{newMessage.length}/1000</span>
          <span className="input-hint">Press Enter to send</span>
        </div>
      </form>
    </div>
  );
}

export default Chat;
