package com.example.TeamTrack_backend.models;

import java.time.LocalDateTime;

public class OrganizerTournament {
    private String id;
    private String userId;
    private String tournamentId;
    private LocalDateTime createdAt;
    private boolean isActive;

    public OrganizerTournament() {
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }

    public OrganizerTournament(String userId, String tournamentId) {
        this();
        this.userId = userId;
        this.tournamentId = tournamentId;
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

    public String getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(String tournamentId) {
        this.tournamentId = tournamentId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
