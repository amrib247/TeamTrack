package com.example.TeamTrack_backend.dto;

import java.time.LocalDateTime;

public class TournamentInviteDto {
    private String id;
    private String teamId;
    private String tournamentId;
    private LocalDateTime createdAt;
    private boolean isActive;

    public TournamentInviteDto() {}

    public TournamentInviteDto(String id, String teamId, String tournamentId, LocalDateTime createdAt, boolean isActive) {
        this.id = id;
        this.teamId = teamId;
        this.tournamentId = tournamentId;
        this.createdAt = createdAt;
        this.isActive = isActive;
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
