package com.example.TeamTrack_backend.models;

import java.time.LocalDateTime;

public class ChatMessage {
    
    private String id;
    
    private String teamId;
    
    private String userId;
    
    private String content;
    
    private LocalDateTime timestamp;
    
    private String messageType; // TEXT, IMAGE, FILE
    
    private String fileUrl;
    
    private String fileName;
    
    private java.util.Map<String, java.time.LocalDateTime> readBy;
    
    // Default constructor
    public ChatMessage() {
        this.timestamp = LocalDateTime.now();
        this.readBy = new java.util.HashMap<>();
    }
    
    // Constructor with required fields
    public ChatMessage(String teamId, String userId, String content, String messageType) {
        this();
        this.teamId = teamId;
        this.userId = userId;
        this.content = content;
        this.messageType = messageType;
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
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getMessageType() {
        return messageType;
    }
    
    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }
    
    public String getFileUrl() {
        return fileUrl;
    }
    
    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public java.util.Map<String, java.time.LocalDateTime> getReadBy() {
        return readBy;
    }
    
    public void setReadBy(java.util.Map<String, java.time.LocalDateTime> readBy) {
        this.readBy = readBy;
    }
    
    @Override
    public String toString() {
        return "ChatMessage{" +
                "id='" + id + '\'' +
                ", teamId='" + teamId + '\'' +
                ", userId='" + userId + '\'' +
                ", content='" + content + '\'' +
                ", timestamp=" + timestamp +
                ", messageType='" + messageType + '\'' +
                ", fileUrl='" + fileUrl + '\'' +
                ", fileName='" + fileName + '\'' +
                ", readBy=" + readBy +
                '}';
    }
}
