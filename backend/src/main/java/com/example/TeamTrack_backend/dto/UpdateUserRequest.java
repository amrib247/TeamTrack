package com.example.TeamTrack_backend.dto;

public class UpdateUserRequest {
    private String email;
    private String password; // For verification
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profilePhotoUrl;

    // Default constructor
    public UpdateUserRequest() {}

    // Constructor with fields
    public UpdateUserRequest(String email, String password, String firstName, String lastName, String phoneNumber, String profilePhotoUrl) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
}
