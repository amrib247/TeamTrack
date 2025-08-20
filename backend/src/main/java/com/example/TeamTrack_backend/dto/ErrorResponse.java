package com.example.TeamTrack_backend.dto;

public class ErrorResponse {
    private String error;
    private String message;

    public ErrorResponse() {}

    public ErrorResponse(String message) {
        this.error = message;
        this.message = message;
    }

    public ErrorResponse(String error, String message) {
        this.error = error;
        this.message = message;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
