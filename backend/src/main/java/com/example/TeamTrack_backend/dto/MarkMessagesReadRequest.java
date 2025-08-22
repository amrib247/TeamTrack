package com.example.TeamTrack_backend.dto;

import java.util.List;

public class MarkMessagesReadRequest {
    
    private List<String> messageIds;
    private String userId;
    
    // Default constructor
    public MarkMessagesReadRequest() {}
    
    // Constructor with message IDs
    public MarkMessagesReadRequest(List<String> messageIds) {
        this.messageIds = messageIds;
    }
    
    // Constructor with message IDs and user ID
    public MarkMessagesReadRequest(List<String> messageIds, String userId) {
        this.messageIds = messageIds;
        this.userId = userId;
    }
    
    // Getters and Setters
    public List<String> getMessageIds() {
        return messageIds;
    }
    
    public void setMessageIds(List<String> messageIds) {
        this.messageIds = messageIds;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    @Override
    public String toString() {
        return "MarkMessagesReadRequest{" +
                "messageIds=" + messageIds +
                ", userId='" + userId + '\'' +
                '}';
    }
}
