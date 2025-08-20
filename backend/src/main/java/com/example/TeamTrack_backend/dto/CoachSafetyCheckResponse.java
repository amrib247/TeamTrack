package com.example.TeamTrack_backend.dto;

public class CoachSafetyCheckResponse {
    private boolean canProceed;
    private String message;
    private String teamId;
    private String teamName;
    private int coachCount;
    private String action; // "LEAVE_TEAM" or "DELETE_ACCOUNT"
    
    public CoachSafetyCheckResponse() {}
    
    public CoachSafetyCheckResponse(boolean canProceed, String message, String teamId, String teamName, int coachCount, String action) {
        this.canProceed = canProceed;
        this.message = message;
        this.teamId = teamId;
        this.teamName = teamName;
        this.coachCount = coachCount;
        this.action = action;
    }
    
    // Getters and Setters
    public boolean isCanProceed() {
        return canProceed;
    }
    
    public void setCanProceed(boolean canProceed) {
        this.canProceed = canProceed;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getTeamId() {
        return teamId;
    }
    
    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }
    
    public String getTeamName() {
        return teamName;
    }
    
    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }
    
    public int getCoachCount() {
        return coachCount;
    }
    
    public void setCoachCount(int coachCount) {
        this.coachCount = coachCount;
    }
    
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
}
