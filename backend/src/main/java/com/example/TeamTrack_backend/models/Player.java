package com.example.TeamTrack_backend.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class Player {
    private String id;
    private String userId; // Reference to User model
    private String teamId;
    private String jerseyNumber;
    private String position;
    private LocalDate dateOfBirth;
    private int height; // in centimeters
    private double weight; // in kilograms
    private String emergencyContact;
    private String emergencyPhone;
    private PlayerStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isActive;

    public enum PlayerStatus {
        ACTIVE,
        INJURED,
        SUSPENDED,
        INACTIVE
    }

    // Default constructor
    public Player() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isActive = true;
        this.status = PlayerStatus.ACTIVE;
    }

    // Constructor with required fields
    public Player(String userId, String teamId, String jerseyNumber, String position) {
        this();
        this.userId = userId;
        this.teamId = teamId;
        this.jerseyNumber = jerseyNumber;
        this.position = position;
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

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public String getJerseyNumber() {
        return jerseyNumber;
    }

    public void setJerseyNumber(String jerseyNumber) {
        this.jerseyNumber = jerseyNumber;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getEmergencyPhone() {
        return emergencyPhone;
    }

    public void setEmergencyPhone(String emergencyPhone) {
        this.emergencyPhone = emergencyPhone;
    }

    public PlayerStatus getStatus() {
        return status;
    }

    public void setStatus(PlayerStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    // Helper methods
    public int getAge() {
        if (dateOfBirth != null) {
            return LocalDate.now().getYear() - dateOfBirth.getYear();
        }
        return 0;
    }

    public boolean isAvailable() {
        return isActive && status == PlayerStatus.ACTIVE;
    }
}
