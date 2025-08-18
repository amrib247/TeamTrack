package com.example.TeamTrack_backend.controllers;

import java.util.Optional;
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

import com.example.TeamTrack_backend.dto.CreateTeamRequest;
import com.example.TeamTrack_backend.dto.UpdateTeamRequest;
import com.example.TeamTrack_backend.models.Team;
import com.example.TeamTrack_backend.services.TeamService;

@RestController
@RequestMapping("/teams")
public class TeamController {
    
    @Autowired
    private TeamService teamService;
    
    public TeamController() {
        System.out.println("🎯 TeamController constructor called - controller is being instantiated!");
    }
    
    /**
     * Create a new team
     */
    @PostMapping
    public CompletableFuture<ResponseEntity<Team>> createTeam(
            @RequestBody CreateTeamRequest request,
            @RequestParam String createdByUserId) {
        
        System.out.println("📥 TeamController.createTeam called with request: " + request.getTeamName());
        System.out.println("👤 Created by user ID: " + createdByUserId);
        
        return teamService.createTeam(request, createdByUserId)
                .thenApply(team -> {
                    System.out.println("✅ TeamController: Team created successfully, returning response");
                    return ResponseEntity.ok(team);
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ TeamController: Error creating team: " + throwable.getMessage());
                    throwable.printStackTrace();
                    return ResponseEntity.<Team>badRequest().build();
                });
    }
    
    /**
     * Get team by ID
     */
    @GetMapping("/{teamId}")
    public CompletableFuture<ResponseEntity<Team>> getTeam(@PathVariable String teamId) {
        return teamService.getTeamById(teamId)
                .thenApply(team -> ResponseEntity.of(Optional.ofNullable(team)))
                .exceptionally(throwable -> ResponseEntity.<Team>badRequest().build());
    }
    
    /**
     * Update team
     */
    @PutMapping("/{teamId}")
    public CompletableFuture<ResponseEntity<Team>> updateTeam(
            @PathVariable String teamId,
            @RequestBody UpdateTeamRequest request) {
        
        System.out.println("📥 TeamController.updateTeam called with teamId: " + teamId);
        System.out.println("📝 Update request: " + request.getTeamName() + " - " + request.getSport() + " - " + request.getAgeGroup());
        
        return teamService.updateTeam(teamId, request)
                .thenApply(team -> {
                    System.out.println("✅ TeamController: Team updated successfully");
                    return ResponseEntity.ok(team);
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ TeamController: Error updating team: " + throwable.getMessage());
                    throwable.printStackTrace();
                    return ResponseEntity.<Team>badRequest().build();
                });
    }
    
    /**
     * Deactivate team
     */
    @DeleteMapping("/{teamId}")
    public CompletableFuture<ResponseEntity<Void>> deactivateTeam(@PathVariable String teamId) {
        return teamService.deactivateTeam(teamId)
                .thenApply(result -> ResponseEntity.ok().<Void>build())
                .exceptionally(throwable -> ResponseEntity.<Void>badRequest().build());
    }
    
    /**
     * Terminate team (deactivates and removes all user associations)
     */
    @DeleteMapping("/{teamId}/terminate")
    public CompletableFuture<ResponseEntity<Void>> terminateTeam(@PathVariable String teamId) {
        System.out.println("📥 TeamController.terminateTeam called with teamId: " + teamId);
        
        return teamService.terminateTeam(teamId)
                .thenApply(result -> {
                    System.out.println("✅ TeamController: Team terminated successfully");
                    return ResponseEntity.ok().<Void>build();
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ TeamController: Error terminating team: " + throwable.getMessage());
                    throwable.printStackTrace();
                    return ResponseEntity.<Void>badRequest().build();
                });
    }
}
