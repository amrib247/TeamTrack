package com.example.TeamTrack_backend.dto;

public class UpdateRoleRequest {
    private String newRole;

    public UpdateRoleRequest() {}

    public UpdateRoleRequest(String newRole) {
        this.newRole = newRole;
    }

    public String getNewRole() {
        return newRole;
    }

    public void setNewRole(String newRole) {
        this.newRole = newRole;
    }
}
