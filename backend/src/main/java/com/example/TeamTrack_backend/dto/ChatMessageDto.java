package com.example.TeamTrack_backend.dto;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.example.TeamTrack_backend.models.ChatMessage;
import com.example.TeamTrack_backend.services.UserService;

@Component
public class ChatMessageDto {
    private String id;
    private String teamId;
    private String userId;
    private String userFirstName;
    private String userLastName;
    private String content;
    private String timestamp;
    private String messageType;
    private String fileUrl;
    private String fileName;
    private Map<String, String> readBy;

    // Default constructor
    public ChatMessageDto() {}

    public ChatMessageDto(ChatMessage message, UserService userService) {
        this.id = message.getId();
        this.teamId = message.getTeamId();
        this.userId = message.getUserId();
        this.content = message.getContent();
        this.timestamp = message.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        this.messageType = message.getMessageType();
        this.fileUrl = message.getFileUrl();
        this.fileName = message.getFileName();
        
        // Try to get user information from userProfiles collection
        System.out.println("🔍 ChatMessageDto: Attempting to get user info for userId: " + message.getUserId() + " from userProfiles");
        try {
            var user = userService.findUserById(message.getUserId());
            System.out.println("🔍 ChatMessageDto: UserService.findUserById returned: " + user);
            if (user != null) {
                this.userFirstName = user.getFirstName();
                this.userLastName = user.getLastName();
                System.out.println("✅ ChatMessageDto: Successfully set user name to: " + this.userFirstName + " " + this.userLastName);
            } else {
                this.userFirstName = "Unknown";
                this.userLastName = "User";
                System.out.println("❌ ChatMessageDto: User not found in userProfiles for userId: " + message.getUserId());
            }
        } catch (Exception e) {
            System.err.println("❌ ChatMessageDto: Exception occurred while getting user info for " + message.getUserId() + ": " + e.getMessage());
            e.printStackTrace();
            this.userFirstName = "Unknown";
            this.userLastName = "User";
        }
        
        // Convert readBy map from LocalDateTime to String
        this.readBy = new HashMap<>();
        if (message.getReadBy() != null) {
            for (Map.Entry<String, java.time.LocalDateTime> entry : message.getReadBy().entrySet()) {
                this.readBy.put(entry.getKey(), entry.getValue().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserFirstName() { return userFirstName; }
    public void setUserFirstName(String userFirstName) { this.userFirstName = userFirstName; }

    public String getUserLastName() { return userLastName; }
    public void setUserLastName(String userLastName) { this.userLastName = userLastName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Map<String, String> getReadBy() { return readBy; }
    public void setReadBy(Map<String, String> readBy) { this.readBy = readBy; }
}
