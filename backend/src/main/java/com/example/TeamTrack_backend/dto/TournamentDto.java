package com.example.TeamTrack_backend.dto;

import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;

import com.example.TeamTrack_backend.models.Tournament;

@Component
public class TournamentDto {
    private String id;
    private String name;
    private int maxSize;
    private int teamCount;
    private String description;
    private String createdAt;
    private String updatedAt;
    private boolean isActive;
    private int organizerCount;

    public TournamentDto() {
    }

    public TournamentDto(Tournament tournament) {
        this.id = tournament.getId();
        this.name = tournament.getName();
        this.maxSize = tournament.getMaxSize();
        this.teamCount = tournament.getTeamCount();
        this.description = tournament.getDescription();
        this.createdAt = tournament.getCreatedAt() != null ? 
            tournament.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        this.updatedAt = tournament.getUpdatedAt() != null ? 
            tournament.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        this.isActive = tournament.isActive();
        this.organizerCount = tournament.getOrganizerCount();
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

    public int getMaxSize() {
        return maxSize;
    }

    public void setMaxSize(int maxSize) {
        this.maxSize = maxSize;
    }

    public int getTeamCount() {
        return teamCount;
    }

    public void setTeamCount(int teamCount) {
        this.teamCount = teamCount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public int getOrganizerCount() {
        return organizerCount;
    }

    public void setOrganizerCount(int organizerCount) {
        this.organizerCount = organizerCount;
    }
}
