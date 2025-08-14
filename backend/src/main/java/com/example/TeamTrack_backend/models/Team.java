package com.example.TeamTrack_backend.models;

import java.time.LocalDateTime;
import java.util.List;

public class Team {
    private String id;
    private String name;
    private String description;
    private String sport;
    private String ageGroup;
    private String season;
    private String coachId;
    private List<String> playerIds;
    private TeamStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isActive;

    public enum TeamStatus {
        ACTIVE,
        INACTIVE,
        SEASON_ENDED,
        DISBANDED
    }

    // Default constructor
    public Team() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isActive = true;
        this.status = TeamStatus.ACTIVE;
    }

    // Constructor with required fields
    public Team(String name, String sport, String ageGroup, String season) {
        this();
        this.name = name;
        this.sport = sport;
        this.ageGroup = ageGroup;
        this.season = season;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public String getCoachId() {
        return coachId;
    }

    public void setCoachId(String coachId) {
        this.coachId = coachId;
    }

    public List<String> getPlayerIds() {
        return playerIds;
    }

    public void setPlayerIds(List<String> playerIds) {
        this.playerIds = playerIds;
    }

    public TeamStatus getStatus() {
        return status;
    }

    public void setStatus(TeamStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    // Helper methods
    public void addPlayer(String playerId) {
        if (this.playerIds != null && !this.playerIds.contains(playerId)) {
            this.playerIds.add(playerId);
        }
    }

    public void removePlayer(String playerId) {
        if (this.playerIds != null) {
            this.playerIds.remove(playerId);
        }
    }

    public int getPlayerCount() {
        return this.playerIds != null ? this.playerIds.size() : 0;
    }
}
