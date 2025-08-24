package com.example.TeamTrack_backend.models;

import java.time.LocalDateTime;

public class TournamentInvite {
    private String id;
    private String teamId;
    private String tournamentId;
    private LocalDateTime createdAt;
    private boolean isActive;

    public TournamentInvite() {
        this.createdAt = LocalDateTime.now();
        this.isActive = false;
    }

    public TournamentInvite(String teamId, String tournamentId) {
        this();
        this.teamId = teamId;
        this.tournamentId = tournamentId;
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
