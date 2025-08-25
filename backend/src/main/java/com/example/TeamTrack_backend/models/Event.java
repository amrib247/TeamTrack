package com.example.TeamTrack_backend.models;

public class Event {
    private String id;
    private String teamId;
    private String name;
    private String tournamentId;
    private String opposingTeamId;
    private String date;
    private String startTime;
    private int lengthMinutes;
    private String location;
    private String description;
    private String score;
    private String createdAt;
    private String updatedAt;

    public Event() {}

    public Event(String teamId, String name, String tournamentId, String opposingTeamId, String date, String startTime, int lengthMinutes, String location, String description, String score) {
        this.teamId = teamId;
        this.name = name;
        this.tournamentId = tournamentId;
        this.opposingTeamId = opposingTeamId;
        this.date = date;
        this.startTime = startTime;
        this.lengthMinutes = lengthMinutes;
        this.location = location;
        this.description = description;
        this.score = score;
        this.createdAt = java.time.LocalDateTime.now().toString();
        this.updatedAt = java.time.LocalDateTime.now().toString();
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

    public String getOpposingTeamId() {
        return opposingTeamId;
    }

    public void setOpposingTeamId(String opposingTeamId) {
        this.opposingTeamId = opposingTeamId;
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
    
    @Override
    public String toString() {
        return "Event{" +
                "id='" + id + '\'' +
                ", teamId='" + teamId + '\'' +
                ", name='" + name + '\'' +
                ", tournamentId='" + tournamentId + '\'' +
                ", opposingTeamId='" + opposingTeamId + '\'' +
                ", date='" + date + '\'' +
                ", startTime='" + startTime + '\'' +
                ", lengthMinutes=" + lengthMinutes +
                ", location='" + location + '\'' +
                ", description='" + description + '\'' +
                ", score='" + score + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", updatedAt='" + updatedAt + '\'' +
                '}';
    }
}
