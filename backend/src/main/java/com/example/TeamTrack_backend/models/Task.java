package com.example.TeamTrack_backend.models;

import java.util.ArrayList;
import java.util.List;

public class Task {
    private String id;
    private String teamId;
    private String name;
    private String location;
    private String description;
    private String date;
    private String startTime;
    private int maxSignups;
    private int minSignups;
    private List<String> signedUpUserIds;
    private String createdBy;
    private String createdAt;
    private String updatedAt;

    public Task() {
        this.signedUpUserIds = new ArrayList<>();
        this.createdAt = java.time.LocalDateTime.now().toString();
        this.updatedAt = java.time.LocalDateTime.now().toString();
    }

    public Task(String teamId, String name, String location, String description, String date, String startTime, int maxSignups, int minSignups, String createdBy) {
        this.teamId = teamId;
        this.name = name;
        this.location = location;
        this.description = description;
        this.date = date;
        this.startTime = startTime;
        this.maxSignups = maxSignups;
        this.minSignups = minSignups;
        this.createdBy = createdBy;
        this.signedUpUserIds = new ArrayList<>();
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

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public int getMaxSignups() {
        return maxSignups;
    }

    public void setMaxSignups(int maxSignups) {
        this.maxSignups = maxSignups;
    }

    public int getMinSignups() {
        return minSignups;
    }

    public void setMinSignups(int minSignups) {
        this.minSignups = minSignups;
    }

    public List<String> getSignedUpUserIds() {
        return signedUpUserIds;
    }

    public void setSignedUpUserIds(List<String> signedUpUserIds) {
        this.signedUpUserIds = signedUpUserIds;
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

    // Helper methods
    public int getCurrentSignups() {
        return signedUpUserIds != null ? signedUpUserIds.size() : 0;
    }

    public boolean isFull() {
        return getCurrentSignups() >= maxSignups;
    }

    public boolean hasMinimumSignups() {
        return getCurrentSignups() >= minSignups;
    }

    public boolean isUserSignedUp(String userId) {
        return signedUpUserIds != null && signedUpUserIds.contains(userId);
    }

    public boolean canSignUp() {
        return !isFull();
    }

    @Override
    public String toString() {
        return "Task{" +
                "id='" + id + '\'' +
                ", teamId='" + teamId + '\'' +
                ", name='" + name + '\'' +
                ", location='" + location + '\'' +
                ", description='" + description + '\'' +
                ", date='" + date + '\'' +
                ", startTime='" + startTime + '\'' +
                ", maxSignups=" + maxSignups +
                ", minSignups=" + minSignups +
                ", signedUpUserIds=" + signedUpUserIds +
                ", createdBy='" + createdBy + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", updatedAt='" + updatedAt + '\'' +
                '}';
    }
}
