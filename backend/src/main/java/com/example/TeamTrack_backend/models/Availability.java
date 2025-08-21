package com.example.TeamTrack_backend.models;

public class Availability {
    private String id;
    private String userId;
    private String teamId;
    private String eventId;
    private String status; // "YES", "NO", "MAYBE"
    private String createdAt;
    private String updatedAt;

    public Availability() {}

    public Availability(String userId, String teamId, String eventId, String status) {
        this.userId = userId;
        this.teamId = teamId;
        this.eventId = eventId;
        this.status = status;
        this.createdAt = java.time.LocalDateTime.now().toString();
        this.updatedAt = java.time.LocalDateTime.now().toString();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "Availability{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", teamId='" + teamId + '\'' +
                ", eventId='" + eventId + '\'' +
                ", status='" + status + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", updatedAt='" + updatedAt + '\'' +
                '}';
    }
}
