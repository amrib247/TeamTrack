package com.example.TeamTrack_backend.controllers;

import com.example.TeamTrack_backend.models.UserTeam;
import com.example.TeamTrack_backend.models.User;
import com.example.TeamTrack_backend.services.UserTeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/user-teams")
@CrossOrigin(origins = "*")
public class UserTeamController {

    @Autowired
    private UserTeamService userTeamService;

    // Add user to a team with a specific role
    @PostMapping("/add")
    public CompletableFuture<ResponseEntity<UserTeam>> addUserToTeam(
            @RequestParam String userId,
            @RequestParam String teamId,
            @RequestParam User.UserRole role) {
        
        return userTeamService.addUserToTeam(userId, teamId, role)
                .thenApply(userTeam -> ResponseEntity.ok(userTeam))
                .exceptionally(throwable -> {
                    return ResponseEntity.badRequest().build();
                });
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

    // Update user's role in a specific team
    @PutMapping("/update-role")
    public CompletableFuture<ResponseEntity<UserTeam>> updateUserRole(
            @RequestParam String userId,
            @RequestParam String teamId,
            @RequestParam User.UserRole newRole) {
        
        return userTeamService.updateUserRole(userId, teamId, newRole)
                .thenApply(userTeam -> ResponseEntity.ok(userTeam))
                .exceptionally(throwable -> {
                    return ResponseEntity.badRequest().build();
                });
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
    public CompletableFuture<ResponseEntity<List<UserTeam>>> getTeamUsers(@PathVariable String teamId) {
        return userTeamService.getTeamUsers(teamId)
                .thenApply(teamUsers -> ResponseEntity.ok(teamUsers))
                .exceptionally(throwable -> {
                    return ResponseEntity.badRequest().build();
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
    public CompletableFuture<ResponseEntity<User.UserRole>> getUserRoleInTeam(
            @RequestParam String userId,
            @RequestParam String teamId) {
        
        return userTeamService.getUserRoleInTeam(userId, teamId)
                .thenApply(role -> ResponseEntity.ok(role))
                .exceptionally(throwable -> {
                    return ResponseEntity.badRequest().build();
                });
    }
}
