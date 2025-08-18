package com.example.TeamTrack_backend.dto;

import com.example.TeamTrack_backend.models.UserTeam;

public class UserTeamWithUserDto {
    private String id;
    private String userId;
    private String teamId;
    private String role;
    private String joinedAt;
    private boolean isActive;
    private boolean inviteAccepted;
    
    // User information
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String profilePhotoUrl;

    // Default constructor
    public UserTeamWithUserDto() {}

    // Constructor with all fields
    public UserTeamWithUserDto(String id, String userId, String teamId, String role, 
                              String joinedAt, boolean isActive, boolean inviteAccepted,
                              String firstName, String lastName, String email, 
                              String phoneNumber, String profilePhotoUrl) {
        this.id = id;
        this.userId = userId;
        this.teamId = teamId;
        this.role = role;
        this.joinedAt = joinedAt;
        this.isActive = isActive;
        this.inviteAccepted = inviteAccepted;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    // Constructor from UserTeam and UserProfile
    public UserTeamWithUserDto(UserTeam userTeam, String firstName, String lastName, 
                              String email, String phoneNumber, String profilePhotoUrl) {
        this.id = userTeam.getId();
        this.userId = userTeam.getUserId();
        this.teamId = userTeam.getTeamId();
        this.role = userTeam.getRole();
        this.joinedAt = userTeam.getJoinedAt();
        this.isActive = userTeam.isActive();
        this.inviteAccepted = userTeam.isInviteAccepted();
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getJoinedAt() { return joinedAt; }
    public void setJoinedAt(String joinedAt) { this.joinedAt = joinedAt; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public boolean isInviteAccepted() { return inviteAccepted; }
    public void setInviteAccepted(boolean inviteAccepted) { this.inviteAccepted = inviteAccepted; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    // Helper method to get full name
    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "").trim();
    }
}
