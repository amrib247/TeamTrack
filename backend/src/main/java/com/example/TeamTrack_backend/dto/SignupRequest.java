package com.example.TeamTrack_backend.dto;

public class SignupRequest {
    private String userId;

    public SignupRequest() {}

    public SignupRequest(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
