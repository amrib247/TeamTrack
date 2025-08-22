import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import type { ChatMessage } from '../types/Auth';
import './Chat.css';

interface ChatProps {
    teamId: string;
    currentUserId: string;
    teamName: string;
}

interface FileUpload {
    file: File;
    preview?: string;
    uploading: boolean;
    error?: string;
}

function Chat({ teamId, currentUserId, teamName }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fileUpload, setFileUpload] = useState<FileUpload | null>(null);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageLimit = 50;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [teamId]);

  const loadMessages = async (offset: number = 0) => {
    try {
      setError('');
      
      const fetchedMessages = await chatService.getTeamMessages(teamId, messageLimit, offset);
      
      if (offset === 0) {
        setMessages(fetchedMessages);
      } else {
        setMessages(prev => [...fetchedMessages, ...prev]);
      }
      
      setHasMoreMessages(fetchedMessages.length === messageLimit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
      
      // If it's a network error, show a more helpful message
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
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'text/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument',
      'image/', 'video/', 'audio/'
    ];
    
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      setError('File type not supported');
      return;
    }

    // Create preview for images
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
      const formData = new FormData();
      formData.append('file', fileUpload.file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      return {
        fileUrl: result.downloadUrl,
        fileName: result.originalFilename
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

      // Upload file if present
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
        teamId,
        newMessage.trim() || (fileUpload ? `Shared ${fileUpload.file.name}` : ''),
        currentUserId,
        messageType,
        fileUrl,
        fileName
      );
      
      // Add the new message to the local state
      setMessages(prev => [...prev, sentMessage]);
      
      // Clear the input and file
      setNewMessage('');
      removeFile();
      
      // Mark messages as read
      await chatService.markMessagesAsRead(teamId, [sentMessage.id], currentUserId);
      
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

  // Show error state when there are no messages and an error
  if (messages.length === 0 && error) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h2>💬 {teamName} Chat</h2>
          <p className="chat-subtitle">Team communication hub</p>
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
        <h2>💬 {teamName} Chat</h2>
        <p className="chat-subtitle">Team communication hub</p>
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
                      📎 {message.fileName || 'Download file'}
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
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        {/* File Preview Area - only show when file is selected */}
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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept="*/*"
            style={{ display: 'none' }}
          />
          
          {/* Add file button */}
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
