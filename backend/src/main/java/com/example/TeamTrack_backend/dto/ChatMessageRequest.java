package com.example.TeamTrack_backend.dto;

public class ChatMessageRequest {
    
    private String userId;
    
    private String content;
    
    private String messageType; // TEXT, IMAGE, FILE
    
    private String fileUrl;
    
    private String fileName;
    
    // Default constructor
    public ChatMessageRequest() {}
    
    // Constructor with required fields
    public ChatMessageRequest(String userId, String content, String messageType) {
        this.userId = userId;
        this.content = content;
        this.messageType = messageType;
    }
    
    // Constructor with all fields
    public ChatMessageRequest(String userId, String content, String messageType, String fileUrl, String fileName) {
        this.userId = userId;
        this.content = content;
        this.messageType = messageType;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
    }
    
    // Getters and Setters
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
    
    @Override
    public String toString() {
        return "ChatMessageRequest{" +
                "userId='" + userId + '\'' +
                ", content='" + content + '\'' +
                ", messageType='" + messageType + '\'' +
                ", fileUrl='" + fileUrl + '\'' +
                ", fileName='" + fileName + '\'' +
                '}';
    }
}
