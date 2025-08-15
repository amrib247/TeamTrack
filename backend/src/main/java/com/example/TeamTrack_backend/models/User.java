package com.example.TeamTrack_backend.models;

public class User {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private UserRole role;
    private String teamId;
    private String createdAt; // String date
    private String updatedAt; // String date
    private boolean isActive;

    public enum UserRole {
        ADMIN,
        COACH,
        PLAYER,
        PARENT
    }

    // Default constructor
    public User() {}

    // Constructor with all fields
    public User(String email, String firstName, String lastName, String phoneNumber, UserRole role, String teamId) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.teamId = teamId;
        this.isActive = true;
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

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
