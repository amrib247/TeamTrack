package com.example.TeamTrack_backend.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.ChatMessageRequest;
import com.example.TeamTrack_backend.models.ChatMessage;
import com.example.TeamTrack_backend.models.ChatRoom;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class ChatService {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserTeamService userTeamService;
    
    public ChatService() {
        System.out.println("💬 ChatService constructor called - service is being instantiated!");
    }
    
    private Firestore getFirestore() {
        try {
            System.out.println("🔍 ChatService: Checking Firebase initialization...");
            System.out.println("🔍 ChatService: FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
            System.out.println("🔍 ChatService: FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
            
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ ChatService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as TeamService - this is the correct way!
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("✅ ChatService: Got Firestore from FirestoreClient: " + firestore);
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ ChatService: Failed to get Firestore instance: " + e.getMessage());
            return null;
        }
    }
    
    // Fallback in-memory storage when Firebase is not available
    private static final List<ChatMessage> fallbackMessages = new ArrayList<>();
    private static int fallbackMessageId = 1;
    
    /**
     * Get team messages with pagination
     */
    public CompletableFuture<List<ChatMessage>> getTeamMessages(String teamId, int limit, int offset) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("📥 ChatService.getTeamMessages called for teamId: " + teamId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    System.out.println("⚠️ ChatService: Firebase not available, using fallback in-memory storage");
                    // Return fallback messages
                    List<ChatMessage> teamMessages = fallbackMessages.stream()
                        .filter(msg -> msg.getTeamId().equals(teamId))
                        .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                        .skip(offset)
                        .limit(limit)
                        .collect(java.util.stream.Collectors.toList());
                    
                    System.out.println("✅ ChatService: Retrieved " + teamMessages.size() + " messages from fallback storage");
                    return teamMessages;
                }
                
                // Get messages from Firestore with safe empty collection handling
                try {
                    // First, check if the collection has any documents at all
                    var collectionCheck = firestore.collection("chat_messages").limit(1).get().get();
                    
                    if (collectionCheck.getDocuments().isEmpty()) {
                        System.out.println("ℹ️ ChatService: Collection 'chat_messages' is empty, returning empty list");
                        return new ArrayList<>();
                    }
                    
                    // Collection exists, now try the full query
                    // Remove orderBy to avoid composite index requirement - sort in memory instead
                    var messagesSnapshot = firestore.collection("chat_messages")
                        .whereEqualTo("teamId", teamId)
                        .limit(limit * 3) // Get more messages to account for filtering and sorting
                        .offset(offset)
                        .get()
                        .get();
                    
                    List<ChatMessage> messages = new ArrayList<>();
                    for (var doc : messagesSnapshot.getDocuments()) {
                        // Manually reconstruct ChatMessage from Firestore data to handle timestamp conversion
                        var data = doc.getData();
                        System.out.println("🔍 ChatService: Processing document " + doc.getId() + " with data: " + data);
                        
                        if (data != null) {
                            ChatMessage message = new ChatMessage();
                            message.setId(doc.getId());
                            message.setTeamId((String) data.get("teamId"));
                            message.setUserId((String) data.get("userId"));
                            message.setContent((String) data.get("content"));
                            message.setMessageType((String) data.get("messageType"));
                            message.setFileUrl((String) data.get("fileUrl"));
                            message.setFileName((String) data.get("fileName"));
                            
                            // Convert string timestamps back to LocalDateTime
                            String timestampStr = (String) data.get("timestamp");
                            if (timestampStr != null) {
                                try {
                                    message.setTimestamp(LocalDateTime.parse(timestampStr));
                                    System.out.println("✅ ChatService: Successfully parsed timestamp: " + timestampStr);
                                } catch (Exception e) {
                                    System.err.println("❌ ChatService: Failed to parse timestamp: " + timestampStr + " - " + e.getMessage());
                                    message.setTimestamp(LocalDateTime.now()); // Fallback to current time
                                }
                            } else {
                                System.err.println("⚠️ ChatService: No timestamp found in document data");
                                message.setTimestamp(LocalDateTime.now());
                            }
                            
                            // Handle readBy map if it exists
                            var readByData = data.get("readBy");
                            if (readByData instanceof java.util.Map) {
                                @SuppressWarnings("unchecked")
                                var readByMap = (java.util.Map<String, Object>) readByData;
                                var readBy = new java.util.HashMap<String, LocalDateTime>();
                                
                                for (var entry : readByMap.entrySet()) {
                                    if (entry.getValue() instanceof String) {
                                        try {
                                            readBy.put(entry.getKey(), LocalDateTime.parse((String) entry.getValue()));
                                        } catch (Exception e) {
                                            System.err.println("❌ ChatService: Failed to parse readBy timestamp: " + entry.getValue());
                                        }
                                    }
                                }
                                message.setReadBy(readBy);
                            }
                            
                            System.out.println("✅ ChatService: Successfully reconstructed message: " + message.toString());
                            messages.add(message);
                        } else {
                            System.err.println("❌ ChatService: Document data is null for document: " + doc.getId());
                        }
                    }
                    
                    // Sort messages by timestamp in descending order (newest first) in memory
                    messages.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
                    
                    // Apply pagination after sorting
                    List<ChatMessage> paginatedMessages = messages.stream()
                        .skip(offset)
                        .limit(limit)
                        .collect(java.util.stream.Collectors.toList());
                    
                    System.out.println("✅ ChatService: Retrieved " + paginatedMessages.size() + " messages from Firestore for team " + teamId);
                    System.out.println("🔍 ChatService: Final message list: " + paginatedMessages);
                    return paginatedMessages;
                    
                } catch (Exception firestoreError) {
                    System.err.println("❌ ChatService: Firestore query failed: " + firestoreError.getMessage());
                    System.out.println("⚠️ ChatService: Collection might not exist or query failed, falling back to empty list");
                    return new ArrayList<>();
                }
                
            } catch (Exception e) {
                System.err.println("❌ ChatService: Error retrieving messages: " + e.getMessage());
                System.out.println("⚠️ ChatService: Falling back to in-memory storage due to error");
                
                // Return fallback messages on error
                List<ChatMessage> teamMessages = fallbackMessages.stream()
                    .filter(msg -> msg.getTeamId().equals(teamId))
                    .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                    .skip(offset)
                    .limit(limit)
                    .collect(java.util.stream.Collectors.toList());
                
                System.out.println("✅ ChatService: Retrieved " + teamMessages.size() + " messages from fallback storage");
                return teamMessages;
            }
        });
    }
    
    /**
     * Send a new message
     */
    public CompletableFuture<ChatMessage> sendMessage(String teamId, ChatMessageRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("📥 ChatService.sendMessage called for teamId: " + teamId);
                
                // Get user information from the request
                String currentUserId = request.getUserId();
                
                // Validate user information
                if (currentUserId == null || currentUserId.trim().isEmpty()) {
                    throw new RuntimeException("User ID is required");
                }
                
                System.out.println("✅ ChatService: Using user ID: " + currentUserId);
                
                // Create chat message with essential fields only
                ChatMessage message = new ChatMessage(
                    teamId,
                    currentUserId,
                    request.getContent(),
                    request.getMessageType()
                );
                
                // Set file details if it's a file or image message
                if (request.getFileUrl() != null) {
                    message.setFileUrl(request.getFileUrl());
                    message.setFileName(request.getFileName());
                }
                
                // Save message to Firestore or fallback storage
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    System.out.println("⚠️ ChatService: Firebase not available, saving to fallback storage");
                    // Save to fallback storage
                    message.setId("fallback_" + fallbackMessageId++);
                    message.setTimestamp(LocalDateTime.now());
                    fallbackMessages.add(message);
                    System.out.println("✅ ChatService: Message saved to fallback storage with ID: " + message.getId());
                } else {
                    // Save to Firestore - convert LocalDateTime to String to avoid serialization issues
                    var docRef = firestore.collection("chat_messages").document();
                    message.setId(docRef.getId());
                    
                    // Create a Firestore-compatible message object
                    var firestoreMessage = new java.util.HashMap<String, Object>();
                    firestoreMessage.put("id", message.getId());
                    firestoreMessage.put("teamId", message.getTeamId());
                    firestoreMessage.put("userId", message.getUserId());
                    firestoreMessage.put("content", message.getContent());
                    firestoreMessage.put("timestamp", message.getTimestamp().toString()); // Convert to String
                    firestoreMessage.put("messageType", message.getMessageType());
                    firestoreMessage.put("fileUrl", message.getFileUrl());
                    firestoreMessage.put("fileName", message.getFileName());
                    firestoreMessage.put("readBy", message.getReadBy());
                    
                    docRef.set(firestoreMessage).get();
                    
                    // Update chat room
                    updateChatRoom(teamId, message);
                    
                    System.out.println("✅ ChatService: Message saved to Firestore with ID: " + message.getId());
                }
                
                System.out.println("✅ ChatService: Message sent successfully with ID: " + message.getId());
                return message;
                
            } catch (Exception e) {
                System.err.println("❌ ChatService: Error sending message: " + e.getMessage());
                throw new RuntimeException("Failed to send message", e);
            }
        });
    }
    
    /**
     * Mark messages as read
     */
    public CompletableFuture<Void> markMessagesAsRead(String teamId, List<String> messageIds, String userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("📥 ChatService.markMessagesAsRead called for teamId: " + teamId);
                
                if (messageIds == null || messageIds.isEmpty()) {
                    return;
                }
                
                // Validate user ID
                if (userId == null || userId.trim().isEmpty()) {
                    System.err.println("❌ ChatService: User ID is required for marking messages as read");
                    return;
                }
                
                // Update messages to mark as read
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    return;
                }
                
                for (String messageId : messageIds) {
                    firestore.collection("chat_messages").document(messageId)
                        .update("readBy." + userId, LocalDateTime.now().toString())
                        .get();
                }
                
                System.out.println("✅ ChatService: Messages marked as read successfully by user: " + userId);
                
            } catch (Exception e) {
                System.err.println("❌ ChatService: Error marking messages as read: " + e.getMessage());
                // Don't throw exception for this operation as it's not critical
            }
        });
    }
    
    /**
     * Delete a message
     */
    public CompletableFuture<Void> deleteMessage(String messageId, String userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("📥 ChatService.deleteMessage called for messageId: " + messageId);
                
                // Validate user ID
                if (userId == null || userId.trim().isEmpty()) {
                    throw new RuntimeException("User ID is required for deleting messages");
                }
                
                // Get the message from Firestore
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                var messageDoc = firestore.collection("chat_messages").document(messageId).get().get();
                if (!messageDoc.exists()) {
                    throw new RuntimeException("Message not found");
                }
                
                // Manually reconstruct ChatMessage from Firestore data to handle timestamp conversion
                var data = messageDoc.getData();
                if (data == null) {
                    throw new RuntimeException("Failed to get message data");
                }
                
                ChatMessage message = new ChatMessage();
                message.setId(messageDoc.getId());
                message.setTeamId((String) data.get("teamId"));
                message.setUserId((String) data.get("userId"));
                message.setContent((String) data.get("content"));
                message.setMessageType((String) data.get("messageType"));
                message.setFileUrl((String) data.get("fileUrl"));
                message.setFileName((String) data.get("fileName"));
                
                // Convert string timestamps back to LocalDateTime
                String timestampStr = (String) data.get("timestamp");
                if (timestampStr != null) {
                    try {
                        message.setTimestamp(LocalDateTime.parse(timestampStr));
                    } catch (Exception e) {
                        System.err.println("❌ ChatService: Failed to parse timestamp: " + timestampStr + " - " + e.getMessage());
                        message.setTimestamp(LocalDateTime.now());
                    }
                }
                
                // Handle readBy map if it exists
                var readByData = data.get("readBy");
                if (readByData instanceof java.util.Map) {
                    @SuppressWarnings("unchecked")
                    var readByMap = (java.util.Map<String, Object>) readByData;
                    var readBy = new java.util.HashMap<String, LocalDateTime>();
                    
                    for (var entry : readByMap.entrySet()) {
                        if (entry.getValue() instanceof String) {
                            try {
                                readBy.put(entry.getKey(), LocalDateTime.parse((String) entry.getValue()));
                            } catch (Exception e) {
                                System.err.println("❌ ChatService: Failed to parse readBy timestamp: " + entry.getValue());
                            }
                        }
                    }
                    message.setReadBy(readBy);
                }
                
                // Verify user can delete the message (either the author or a coach)
                // We'll need to get the user's role from UserTeamService
                boolean canDelete = message.getUserId().equals(userId);
                if (!canDelete) {
                    // Check if user is a coach
                    try {
                        var teamUsers = userTeamService.getTeamUsers(message.getTeamId()).get();
                        var userTeam = teamUsers.stream()
                            .filter(ut -> ut.getUserId().equals(userId))
                            .findFirst()
                            .orElse(null);
                        
                        if (userTeam != null && "COACH".equals(userTeam.getRole())) {
                            canDelete = true;
                        }
                    } catch (Exception e) {
                        System.err.println("❌ ChatService: Error checking user role: " + e.getMessage());
                    }
                }
                
                if (!canDelete) {
                    throw new RuntimeException("User not authorized to delete this message");
                }
                
                // Hard delete the message in Firestore
                firestore.collection("chat_messages").document(messageId)
                    .delete()
                    .get();
                
                System.out.println("✅ ChatService: Message deleted successfully by user: " + userId);
                
            } catch (Exception e) {
                System.err.println("❌ ChatService: Error deleting message: " + e.getMessage());
                throw new RuntimeException("Failed to delete message", e);
            }
        });
    }
    
    /**
     * Get chat room information
     */
    public CompletableFuture<ChatRoom> getChatRoom(String teamId, String userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("📥 ChatService.getChatRoom called for teamId: " + teamId);
                
                // Validate user ID
                if (userId == null || userId.trim().isEmpty()) {
                    throw new RuntimeException("User ID is required for accessing chat room");
                }
                
                // Get or create chat room
                ChatRoom chatRoom = getOrCreateChatRoom(teamId);
                
                System.out.println("✅ ChatService: Chat room retrieved successfully for user: " + userId);
                return chatRoom;
                
            } catch (Exception e) {
                System.err.println("❌ ChatService: Error retrieving chat room: " + e.getMessage());
                throw new RuntimeException("Failed to retrieve chat room", e);
            }
        });
    }
    
    /**
     * Get or create a chat room for a team
     */
    private ChatRoom getOrCreateChatRoom(String teamId) {
        try {
            Firestore firestore = getFirestore();
            if (firestore == null) {
                throw new RuntimeException("Firebase not available");
            }
            
            // Try to find existing chat room with safe collection handling
            try {
                var roomSnapshot = firestore.collection("chat_rooms")
                    .whereEqualTo("teamId", teamId)
                    .limit(1)
                    .get()
                    .get();
                
                if (!roomSnapshot.getDocuments().isEmpty()) {
                    var doc = roomSnapshot.getDocuments().get(0);
                    // Manually reconstruct ChatRoom from Firestore data to handle timestamp conversion
                    var data = doc.getData();
                    if (data != null) {
                        ChatRoom existingRoom = new ChatRoom();
                        existingRoom.setId(doc.getId());
                        existingRoom.setTeamId((String) data.get("teamId"));
                        existingRoom.setTeamName((String) data.get("teamName"));
                        existingRoom.setUnreadCount((Integer) data.get("unreadCount"));
                        
                        // Convert string timestamps back to LocalDateTime
                        String lastActivityStr = (String) data.get("lastActivity");
                        if (lastActivityStr != null) {
                            try {
                                existingRoom.setLastActivity(LocalDateTime.parse(lastActivityStr));
                            } catch (Exception e) {
                                System.err.println("❌ ChatService: Failed to parse lastActivity: " + lastActivityStr + " - " + e.getMessage());
                                existingRoom.setLastActivity(LocalDateTime.now());
                            }
                        }
                        
                        String createdAtStr = (String) data.get("createdAt");
                        if (createdAtStr != null) {
                            try {
                                existingRoom.setCreatedAt(LocalDateTime.parse(createdAtStr));
                            } catch (Exception e) {
                                System.err.println("❌ ChatService: Failed to parse createdAt: " + createdAtStr + " - " + e.getMessage());
                                existingRoom.setCreatedAt(LocalDateTime.now());
                            }
                        }
                        
                        String updatedAtStr = (String) data.get("updatedAt");
                        if (updatedAtStr != null) {
                            try {
                                existingRoom.setUpdatedAt(LocalDateTime.parse(updatedAtStr));
                            } catch (Exception e) {
                                System.err.println("❌ ChatService: Failed to parse updatedAt: " + updatedAtStr + " - " + e.getMessage());
                                existingRoom.setUpdatedAt(LocalDateTime.now());
                            }
                        }
                        
                        return existingRoom;
                    }
                }
            } catch (Exception queryError) {
                System.err.println("❌ ChatService: Error querying chat rooms: " + queryError.getMessage());
                System.out.println("⚠️ ChatService: Collection might not exist, will create new room");
            }
            
            // Create new chat room
            String teamName = "Team " + teamId; // Default name
            
            ChatRoom newRoom = new ChatRoom(teamId, teamName);
            var docRef = firestore.collection("chat_rooms").document();
            newRoom.setId(docRef.getId());
            
            // Create a Firestore-compatible chat room object
            var firestoreRoom = new java.util.HashMap<String, Object>();
            firestoreRoom.put("id", newRoom.getId());
            firestoreRoom.put("teamId", newRoom.getTeamId());
            firestoreRoom.put("teamName", newRoom.getTeamName());
            firestoreRoom.put("lastMessage", newRoom.getLastMessage());
            firestoreRoom.put("unreadCount", newRoom.getUnreadCount());
            firestoreRoom.put("lastActivity", newRoom.getLastActivity().toString()); // Convert to String
            firestoreRoom.put("createdAt", newRoom.getCreatedAt().toString()); // Convert to String
            firestoreRoom.put("updatedAt", newRoom.getUpdatedAt().toString()); // Convert to String
            
            docRef.set(firestoreRoom).get();
            
            System.out.println("✅ ChatService: Created new chat room for team " + teamId);
            return newRoom;
            
        } catch (Exception e) {
            System.err.println("❌ ChatService: Error in getOrCreateChatRoom: " + e.getMessage());
            throw new RuntimeException("Failed to get or create chat room", e);
        }
    }
    
    /**
     * Update chat room with new message
     */
    private void updateChatRoom(String teamId, ChatMessage message) {
        try {
            Firestore firestore = getFirestore();
            if (firestore == null) {
                return;
            }
            
            // Find the chat room and update it with safe collection handling
            try {
                var roomSnapshot = firestore.collection("chat_rooms")
                    .whereEqualTo("teamId", teamId)
                    .limit(1)
                    .get()
                    .get();
                
                if (!roomSnapshot.getDocuments().isEmpty()) {
                    var doc = roomSnapshot.getDocuments().get(0);
                    
                    // Create a Firestore-compatible lastMessage object
                    var firestoreLastMessage = new java.util.HashMap<String, Object>();
                    firestoreLastMessage.put("id", message.getId());
                    firestoreLastMessage.put("teamId", message.getTeamId());
                    firestoreLastMessage.put("userId", message.getUserId());
                    firestoreLastMessage.put("content", message.getContent());
                    firestoreLastMessage.put("timestamp", message.getTimestamp().toString());
                    firestoreLastMessage.put("messageType", message.getMessageType());
                    firestoreLastMessage.put("fileUrl", message.getFileUrl());
                    firestoreLastMessage.put("fileName", message.getFileName());
                    firestoreLastMessage.put("readBy", message.getReadBy());
                    
                    doc.getReference().update(
                        "lastMessage", firestoreLastMessage,
                        "lastActivity", message.getTimestamp().toString(),
                        "updatedAt", LocalDateTime.now().toString()
                    ).get();
                    System.out.println("✅ ChatService: Updated chat room for team " + teamId);
                } else {
                    System.out.println("⚠️ ChatService: No chat room found to update for team " + teamId);
                }
            } catch (Exception queryError) {
                System.err.println("❌ ChatService: Error updating chat room: " + queryError.getMessage());
                System.out.println("⚠️ ChatService: Collection might not exist, skipping update");
            }
            
        } catch (Exception e) {
            System.err.println("❌ ChatService: Error in updateChatRoom: " + e.getMessage());
            // Don't throw exception for this operation as it's not critical
        }
    }
}
