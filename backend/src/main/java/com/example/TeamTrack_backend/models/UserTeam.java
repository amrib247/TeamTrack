package com.example.TeamTrack_backend.models;

public class UserTeam {
    private String id;
    private String userId;
    private String teamId;
    private String role; // Changed from User.UserRole to String
    private String joinedAt;
    private boolean isActive;
    private boolean inviteAccepted;

    // Default constructor
    public UserTeam() {}

    // Constructor with all fields
    public UserTeam(String id, String userId, String teamId, String role, String joinedAt, boolean isActive, boolean inviteAccepted) {
        this.id = id;
        this.userId = userId;
        this.teamId = teamId;
        this.role = role;
        this.joinedAt = joinedAt;
        this.isActive = isActive;
        this.inviteAccepted = inviteAccepted;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(String joinedAt) {
        this.joinedAt = joinedAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public boolean isInviteAccepted() {
        return inviteAccepted;
    }

    public void setInviteAccepted(boolean inviteAccepted) {
        this.inviteAccepted = inviteAccepted;
    }
}
