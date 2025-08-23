package com.example.TeamTrack_backend.dto;

public class CreateTournamentRequest {
    private String name;
    private int maxSize;
    private String description;

    public CreateTournamentRequest() {
    }

    public CreateTournamentRequest(String name, int maxSize, String description) {
        this.name = name;
        this.maxSize = maxSize;
        this.description = description;
    }

    // Getters and Setters
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
