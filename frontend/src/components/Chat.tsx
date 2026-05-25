import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Send, Trash2, X } from 'lucide-react';
import { chatService } from '../services/chatService';
import { storageService } from '../services/storageService';
import type { ChatMessage, ChatScope } from '../types/Auth';
import { Button } from './ui/button';
import { Input } from './ui/input';

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

  const subtitle =
    scope === 'team' ? 'Team communication hub' : 'Tournament communication hub';

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
      uploading: false,
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

  const renderHeader = () => (
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">{displayName} Chat</h2>
      <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
    </div>
  );

  const renderErrorBanner = () => {
    if (!error) return null;
    return (
      <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        <p className="m-0 flex-1">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadMessages()}
          className="border-red-300 bg-white text-red-700 hover:bg-red-100"
        >
          Retry
        </Button>
      </div>
    );
  };

  if (messages.length === 0 && error) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-md flex flex-col h-[calc(100vh-120px)] min-h-[480px] mt-2 mx-2">
        {renderHeader()}
        {renderErrorBanner()}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-md flex flex-col h-[calc(100vh-120px)] min-h-[480px] mt-2 mx-2">
      {renderHeader()}

      {renderErrorBanner()}

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {hasMoreMessages && (
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="border-gray-300"
            >
              {loadingMore ? 'Loading...' : 'Load Older Messages'}
            </Button>
          </div>
        )}

        {messages.map((message) => {
          const isOwn = message.userId === currentUserId;
          return (
            <div
              key={message.id}
              className={`group flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600">
                {getUserInitials(message)}
              </div>

              <div
                className={`relative max-w-[70%] border p-3 ${
                  isOwn
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-gray-100 text-gray-900 border-gray-200'
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1">{getUserDisplayName(message)}</p>
                )}

                <div className="text-sm break-words leading-snug">
                  {message.messageType === 'TEXT' && message.content}
                  {message.messageType === 'IMAGE' && message.fileUrl && (
                    <div className="mt-1">
                      <img
                        src={message.fileUrl}
                        alt="Shared image"
                        className="max-w-full max-h-72 rounded-md border border-black/10"
                      />
                    </div>
                  )}
                  {message.messageType === 'FILE' && message.fileUrl && (
                    <div className="mt-1">
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-sm no-underline ${
                          isOwn
                            ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Paperclip className="size-4" /> {message.fileName || 'Download file'}
                      </a>
                    </div>
                  )}
                </div>

                <p
                  className={`text-xs mt-1 ${
                    isOwn ? 'text-primary-foreground/70' : 'text-gray-500'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </p>

                {canDeleteMessage(message) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(message.id)}
                    title="Delete message"
                    className={`absolute -top-2 ${
                      isOwn ? '-left-2' : '-right-2'
                    } flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-red-600 opacity-0 shadow-sm transition-opacity hover:bg-red-50 group-hover:opacity-100`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-gray-50 p-4">
        {fileUpload && (
          <div className="mb-3 flex items-center gap-3 rounded-md border border-gray-200 bg-white p-2">
            {fileUpload.preview && (
              <img
                src={fileUpload.preview}
                alt="File preview"
                className="h-14 w-14 rounded-sm border border-gray-200 object-cover"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-gray-900">
                {fileUpload.file.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatFileSize(fileUpload.file.size)}
              </span>
              {fileUpload.error && (
                <span className="text-xs text-red-600">{fileUpload.error}</span>
              )}
            </div>
            <button
              type="button"
              onClick={removeFile}
              title="Remove file"
              className="flex h-7 w-7 items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept="*/*"
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            className="flex-shrink-0 border-gray-300"
          >
            <Paperclip className="size-5" />
          </Button>

          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={fileUpload ? 'Add a message (optional)...' : 'Type a message...'}
            disabled={sending}
            maxLength={1000}
            className="flex-1"
          />

          <Button
            type="submit"
            disabled={(!newMessage.trim() && !fileUpload) || sending}
            className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {sending ? (
              'Sending...'
            ) : (
              <>
                <Send className="size-5" />
              </>
            )}
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">{newMessage.length}/1000</span>
          <span className="italic">Press Enter to send</span>
        </div>
      </form>
    </div>
  );
}

export default Chat;
