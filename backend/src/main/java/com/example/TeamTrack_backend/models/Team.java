package com.example.TeamTrack_backend.models;

public class Team {
    private String id;
    private String teamName;
    private String sport;
    private String ageGroup;
    private String description;
    private String profilePhotoUrl;
    private String createdBy;
    private String createdAt;
    private String updatedAt;
    private boolean isActive;
    private int coachCount;

    // Default constructor
    public Team() {
    }

    // Constructor with required fields
    public Team(String teamName, String sport, String ageGroup, String createdBy) {
        this.teamName = teamName;
        this.sport = sport;
        this.ageGroup = ageGroup;
        this.createdBy = createdBy;
        this.createdAt = java.time.LocalDateTime.now().toString();
        this.updatedAt = java.time.LocalDateTime.now().toString();
        this.isActive = true;
        this.coachCount = 1; // Default to 1 coach (the creator)
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
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

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public int getCoachCount() {
        return coachCount;
    }

    public void setCoachCount(int coachCount) {
        this.coachCount = coachCount;
    }
}
