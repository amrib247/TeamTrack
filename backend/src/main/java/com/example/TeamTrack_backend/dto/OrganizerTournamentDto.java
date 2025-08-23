package com.example.TeamTrack_backend.dto;

import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;

import com.example.TeamTrack_backend.models.OrganizerTournament;

@Component
public class OrganizerTournamentDto {
    private String id;
    private String userId;
    private String tournamentId;
    private String createdAt;
    private boolean isActive;

    public OrganizerTournamentDto() {
    }

    public OrganizerTournamentDto(OrganizerTournament organizerTournament) {
        this.id = organizerTournament.getId();
        this.userId = organizerTournament.getUserId();
        this.tournamentId = organizerTournament.getTournamentId();
        this.createdAt = organizerTournament.getCreatedAt() != null ? 
            organizerTournament.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        this.isActive = organizerTournament.isActive();
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

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
