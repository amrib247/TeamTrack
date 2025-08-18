package com.example.TeamTrack_backend.dto;

import java.util.List;

import com.example.TeamTrack_backend.models.UserTeam;

public class UserWithTeamsDto {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String dateOfBirth;
    private String profilePhotoUrl;
    private String createdAt;
    private String updatedAt;
    private boolean isActive;
    private List<UserTeam> teams;

    // Default constructor
    public UserWithTeamsDto() {}

    // Constructor with all fields
    public UserWithTeamsDto(String id, String email, String firstName, String lastName, 
                           String phoneNumber, String dateOfBirth, String profilePhotoUrl, String createdAt, 
                           String updatedAt, boolean isActive, List<UserTeam> teams) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.dateOfBirth = dateOfBirth;
        this.profilePhotoUrl = profilePhotoUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isActive = isActive;
        this.teams = teams;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public List<UserTeam> getTeams() { return teams; }
    public void setTeams(List<UserTeam> teams) { this.teams = teams; }
}
