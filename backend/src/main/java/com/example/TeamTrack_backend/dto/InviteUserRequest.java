package com.example.TeamTrack_backend.dto;

public class InviteUserRequest {
    private String email;
    private String role;

    // Default constructor
    public InviteUserRequest() {}

    // Constructor with fields
    public InviteUserRequest(String email, String role) {
        this.email = email;
        this.role = role;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
