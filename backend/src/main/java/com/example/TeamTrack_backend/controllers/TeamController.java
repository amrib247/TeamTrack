package com.example.TeamTrack_backend.controllers;

import java.util.List;
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
    
    /**
     * Create a new team
     */
    @PostMapping
    public CompletableFuture<ResponseEntity<Team>> createTeam(
            @RequestBody CreateTeamRequest request,
            @RequestParam String createdByUserId) {
        
        return teamService.createTeam(request, createdByUserId)
                .thenApply(team -> ResponseEntity.ok(team))
                .exceptionally(throwable -> {
                    System.err.println("❌ TeamController: Error creating team: " + throwable.getMessage());
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
        
        return teamService.updateTeam(teamId, request)
                .thenApply(team -> ResponseEntity.ok(team))
                .exceptionally(throwable -> {
                    System.err.println("❌ TeamController: Error updating team: " + throwable.getMessage());
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
     * Terminate team
     */
    @DeleteMapping("/{teamId}/terminate")
    public CompletableFuture<ResponseEntity<Void>> terminateTeam(@PathVariable String teamId) {
        return teamService.terminateTeam(teamId)
                .thenApply(result -> ResponseEntity.ok().<Void>build())
                .exceptionally(throwable -> {
                    System.err.println("❌ TeamController: Error terminating team: " + throwable.getMessage());
                    return ResponseEntity.<Void>badRequest().build();
                });
    }
    
    /**
     * Get coach count for a team
     */
    @GetMapping("/{teamId}/coach-count")
    public CompletableFuture<ResponseEntity<Integer>> getCoachCount(@PathVariable String teamId) {
        return teamService.getCoachCount(teamId)
                .thenApply(count -> ResponseEntity.ok(count))
                .exceptionally(throwable -> ResponseEntity.<Integer>badRequest().build());
    }
    
    /**
     * Search teams by name
     */
    @GetMapping("/search")
    public CompletableFuture<ResponseEntity<List<Team>>> searchTeamsByName(@RequestParam String name) {
        return teamService.searchTeamsByName(name)
                .thenApply(teams -> ResponseEntity.ok(teams))
                .exceptionally(throwable -> {
                    System.err.println("❌ TeamController: Error searching teams: " + throwable.getMessage());
                    return ResponseEntity.<List<Team>>badRequest().build();
                });
    }
}
