package com.example.TeamTrack_backend.dto;

public class CreateTeamRequest {
    private String teamName;
    private String sport;
    private String ageGroup;
    private String description;
    private String profilePhotoUrl;

    // Default constructor
    public CreateTeamRequest() {
    }

    // Constructor with all fields
    public CreateTeamRequest(String teamName, String sport, String ageGroup, String description, String profilePhotoUrl) {
        this.teamName = teamName;
        this.sport = sport;
        this.ageGroup = ageGroup;
        this.description = description;
        this.profilePhotoUrl = profilePhotoUrl;
    }

    // Getters and Setters
    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getSport() {
        return sport;
    }

    public void setSport(String sport) {
        this.sport = sport;
    }

    public String getAgeGroup() {
        return ageGroup;
    }

    public void setAgeGroup(String ageGroup) {
        this.ageGroup = ageGroup;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }
}
