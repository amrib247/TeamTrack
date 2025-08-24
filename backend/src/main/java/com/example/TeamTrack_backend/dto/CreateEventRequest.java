package com.example.TeamTrack_backend.dto;

public class CreateEventRequest {
    private String teamId;
    private String name;
    private String tournamentId;
    private String date;
    private String startTime;
    private int lengthMinutes;
    private String location;
    private String description;
    private String score;

    public CreateEventRequest() {}

    public CreateEventRequest(String teamId, String name, String tournamentId, String date, String startTime, int lengthMinutes, String location, String description, String score) {
        this.teamId = teamId;
        this.name = name;
        this.tournamentId = tournamentId;
        this.date = date;
        this.startTime = startTime;
        this.lengthMinutes = lengthMinutes;
        this.location = location;
        this.description = description;
        this.score = score;
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

    public String getTournamentId() {
        return tournamentId;
    }

    public void setTournamentId(String tournamentId) {
        this.tournamentId = tournamentId;
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

    public int getLengthMinutes() {
        return lengthMinutes;
    }

    public void setLengthMinutes(int lengthMinutes) {
        this.lengthMinutes = lengthMinutes;
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
    
    public String getScore() {
        return score;
    }
    
    public void setScore(String score) {
        this.score = score;
    }
}
