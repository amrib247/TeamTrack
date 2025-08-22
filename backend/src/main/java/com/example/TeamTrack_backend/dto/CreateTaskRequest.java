package com.example.TeamTrack_backend.dto;

public class CreateTaskRequest {
    private String teamId;
    private String name;
    private String location;
    private String description;
    private String date;
    private String startTime;
    private int maxSignups;
    private int minSignups;
    private String createdBy;

    public CreateTaskRequest() {}

    public CreateTaskRequest(String teamId, String name, String location, String description, String date, String startTime, int maxSignups, int minSignups, String createdBy) {
        this.teamId = teamId;
        this.name = name;
        this.location = location;
        this.description = description;
        this.date = date;
        this.startTime = startTime;
        this.maxSignups = maxSignups;
        this.minSignups = minSignups;
        this.createdBy = createdBy;
    }

    // Getters and Setters
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
