package com.example.TeamTrack_backend.controllers;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.dto.InviteUserRequest;
import com.example.TeamTrack_backend.dto.UserTeamWithUserDto;
import com.example.TeamTrack_backend.models.UserTeam;
import com.example.TeamTrack_backend.services.UserTeamService;

@RestController
@RequestMapping("/user-teams")
public class UserTeamController {

    @Autowired
    private UserTeamService userTeamService;
    
    public UserTeamController() {
        System.out.println("🎯 UserTeamController constructor called - controller is being instantiated!");
    }

    // Add user to team
    @PostMapping("/add")
    public CompletableFuture<ResponseEntity<UserTeam>> addUserToTeam(
            @RequestParam String userId,
            @RequestParam String teamId,
            @RequestParam String role) {
        
        return userTeamService.addUserToTeam(userId, teamId, role)
                .thenApply(userTeam -> ResponseEntity.ok(userTeam))
                .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }

    // Remove user from a team
    @DeleteMapping("/remove")
    public CompletableFuture<ResponseEntity<Void>> removeUserFromTeam(
            @RequestParam String userId,
            @RequestParam String teamId) {
        
        return userTeamService.removeUserFromTeam(userId, teamId)
                .thenApply(v -> ResponseEntity.ok().<Void>build())
                .exceptionally(throwable -> {
                    return ResponseEntity.badRequest().<Void>build();
                });
    }

    // Update user role in team
    @PutMapping("/update-role")
    public CompletableFuture<ResponseEntity<UserTeam>> updateUserRole(
            @RequestParam String userId,
            @RequestParam String teamId,
            @RequestParam String newRole) {
        
        return userTeamService.updateUserRole(userId, teamId, newRole)
                .thenApply(userTeam -> ResponseEntity.ok(userTeam))
                .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }

    // Get all teams for a specific user
    @GetMapping("/user/{userId}")
    public CompletableFuture<ResponseEntity<List<UserTeam>>> getUserTeams(@PathVariable String userId) {
        return userTeamService.getUserTeams(userId)
                .thenApply(userTeams -> ResponseEntity.ok(userTeams))
                .exceptionally(throwable -> {
                    return ResponseEntity.badRequest().build();
                });
    }

    // Get all users for a specific team
    @GetMapping("/team/{teamId}")
    public CompletableFuture<ResponseEntity<List<UserTeamWithUserDto>>> getTeamUsers(@PathVariable String teamId) {
        System.out.println("🎯 UserTeamController.getTeamUsers called with teamId: " + teamId);
        return userTeamService.getTeamUsers(teamId)
                .thenApply(teamUsers -> {
                    System.out.println("✅ UserTeamController: Retrieved " + teamUsers.size() + " team users");
                    return ResponseEntity.ok(teamUsers);
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ UserTeamController: Error getting team users: " + throwable.getMessage());
                    throwable.printStackTrace();
                    return ResponseEntity.<List<UserTeamWithUserDto>>badRequest().build();
                });
    }

    // Check if user is in a specific team
    @GetMapping("/check")
    public CompletableFuture<ResponseEntity<Boolean>> isUserInTeam(
            @RequestParam String userId,
            @RequestParam String teamId) {
        
        return userTeamService.isUserInTeam(userId, teamId)
                .thenApply(isInTeam -> ResponseEntity.ok(isInTeam))
                .exceptionally(throwable -> {
                    return ResponseEntity.badRequest().build();
                });
    }

    // Get user's role in a specific team
    @GetMapping("/role")
    public CompletableFuture<ResponseEntity<String>> getUserRoleInTeam(
            @RequestParam String userId,
            @RequestParam String teamId) {
        
        return userTeamService.getUserRoleInTeam(userId, teamId)
                .thenApply(role -> ResponseEntity.ok(role))
                .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }

    @PostMapping("/teams/{teamId}/invite")
    public CompletableFuture<ResponseEntity<UserTeam>> inviteUserToTeam(
            @PathVariable String teamId,
            @RequestBody InviteUserRequest inviteRequest) {
        System.out.println("🎯 UserTeamController.inviteUserToTeam called with teamId: " + teamId + ", email: " + inviteRequest.getEmail() + ", role: " + inviteRequest.getRole());
        return userTeamService.inviteUserToTeam(teamId, inviteRequest.getEmail(), inviteRequest.getRole())
            .thenApply(userTeam -> {
                System.out.println("✅ UserTeamController: User invited successfully");
                return ResponseEntity.ok(userTeam);
            })
            .exceptionally(throwable -> {
                System.err.println("❌ UserTeamController: Error inviting user: " + throwable.getMessage());
                throwable.printStackTrace();
                return ResponseEntity.<UserTeam>badRequest().build();
            });
    }

    // Accept an invite
    @PostMapping("/accept-invite/{userTeamId}")
    public CompletableFuture<ResponseEntity<UserTeam>> acceptInvite(@PathVariable String userTeamId) {
        return userTeamService.acceptInvite(userTeamId)
            .thenApply(userTeam -> ResponseEntity.ok(userTeam))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }

    // Decline an invite (delete the relationship)
    @DeleteMapping("/decline-invite/{userTeamId}")
    public CompletableFuture<ResponseEntity<Void>> declineInvite(@PathVariable String userTeamId) {
        return userTeamService.declineInvite(userTeamId)
            .thenApply(v -> ResponseEntity.ok().<Void>build())
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }

    // Leave a team (delete the relationship)
    @DeleteMapping("/leave-team/{userTeamId}")
    public CompletableFuture<ResponseEntity<Void>> leaveTeam(@PathVariable String userTeamId) {
        return userTeamService.leaveTeam(userTeamId)
            .thenApply(v -> ResponseEntity.ok().<Void>build())
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }

    // Fix existing UserTeam documents (admin endpoint)
    @PostMapping("/fix-invite-accepted-field")
    public CompletableFuture<ResponseEntity<String>> fixInviteAcceptedField() {
        return userTeamService.ensureInviteAcceptedField()
            .thenApply(v -> ResponseEntity.ok("Successfully updated existing UserTeam documents"))
            .exceptionally(throwable -> ResponseEntity.badRequest().body("Failed to update documents: " + throwable.getMessage()));
    }
    
    // Fix team creators invite status (admin endpoint)
    @PostMapping("/fix-team-creators-invite-status")
    public CompletableFuture<ResponseEntity<String>> fixTeamCreatorsInviteStatus() {
        return userTeamService.fixTeamCreatorsInviteStatus()
            .thenApply(v -> ResponseEntity.ok("Successfully fixed team creators invite status"))
            .exceptionally(throwable -> ResponseEntity.badRequest().body("Failed to fix team creators: " + throwable.getMessage()));
    }
}
