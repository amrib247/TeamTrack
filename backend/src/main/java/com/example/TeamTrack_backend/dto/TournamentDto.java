package com.example.TeamTrack_backend.dto;

import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.example.TeamTrack_backend.models.Tournament;

@Component
public class TournamentDto {
    private String id;
    private String name;
    private int maxSize;
    private List<String> teamIds;
    private String description;
    private String createdAt;
    private String updatedAt;
    private boolean isActive;

    public TournamentDto() {
    }

    public TournamentDto(Tournament tournament) {
        this.id = tournament.getId();
        this.name = tournament.getName();
        this.maxSize = tournament.getMaxSize();
        this.teamIds = tournament.getTeamIds();
        this.description = tournament.getDescription();
        this.createdAt = tournament.getCreatedAt() != null ? 
            tournament.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        this.updatedAt = tournament.getUpdatedAt() != null ? 
            tournament.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        this.isActive = tournament.isActive();
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

    public List<String> getTeamIds() {
        return teamIds;
    }

    public void setTeamIds(List<String> teamIds) {
        this.teamIds = teamIds;
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
}
