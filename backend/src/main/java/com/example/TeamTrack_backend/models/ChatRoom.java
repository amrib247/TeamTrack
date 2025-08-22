package com.example.TeamTrack_backend.models;

import java.time.LocalDateTime;

public class ChatRoom {
    
    private String id;
    
    private String teamId;
    
    private String teamName;
    
    private ChatMessage lastMessage;
    
    private int unreadCount;
    
    private LocalDateTime lastActivity;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Default constructor
    public ChatRoom() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.lastActivity = LocalDateTime.now();
        this.unreadCount = 0;
    }
    
    // Constructor with required fields
    public ChatRoom(String teamId, String teamName) {
        this();
        this.teamId = teamId;
        this.teamName = teamName;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getTeamId() {
        return teamId;
    }
    
    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }
    
    public String getTeamName() {
        return teamName;
    }
    
    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }
    
    public ChatMessage getLastMessage() {
        return lastMessage;
    }
    
    public void setLastMessage(ChatMessage lastMessage) {
        this.lastMessage = lastMessage;
        if (lastMessage != null) {
            this.lastActivity = lastMessage.getTimestamp();
        }
    }
    
    public int getUnreadCount() {
        return unreadCount;
    }
    
    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }
    
    public LocalDateTime getLastActivity() {
        return lastActivity;
    }
    
    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Helper methods
    public void incrementUnreadCount() {
        this.unreadCount++;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void resetUnreadCount() {
        this.unreadCount = 0;
        this.updatedAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "ChatRoom{" +
                "id='" + id + '\'' +
                ", teamId='" + teamId + '\'' +
                ", teamName='" + teamName + '\'' +
                ", unreadCount=" + unreadCount +
                ", lastActivity=" + lastActivity +
                '}';
    }
}
