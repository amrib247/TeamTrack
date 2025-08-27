package com.example.TeamTrack_backend.controllers;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.models.Availability;
import com.example.TeamTrack_backend.services.AvailabilityService;

@RestController
@RequestMapping("/availability")
public class AvailabilityController {
    
    @Autowired
    private AvailabilityService availabilityService;
    
    /**
     * Set availability for a user for a specific event
     */
    @PostMapping("/set")
    public CompletableFuture<ResponseEntity<Availability>> setAvailability(
            @RequestParam String userId,
            @RequestParam String teamId,
            @RequestParam String eventId,
            @RequestParam String status) {
        
        return availabilityService.setAvailability(userId, teamId, eventId, status)
                .thenApply(availability -> ResponseEntity.ok(availability))
                .exceptionally(throwable -> {
                    System.err.println("❌ AvailabilityController: Error setting availability: " + throwable.getMessage());
                    return ResponseEntity.<Availability>badRequest().build();
                });
    }
    
    /**
     * Get team availability for a specific event
     */
    @GetMapping("/team/{teamId}/event/{eventId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getTeamAvailabilityForEvent(
            @PathVariable String teamId,
            @PathVariable String eventId,
            @RequestParam String currentUserId) {
        
        return availabilityService.getTeamAvailabilityForEvent(teamId, eventId, currentUserId)
                .thenApply(availability -> ResponseEntity.ok(availability))
                .exceptionally(throwable -> {
                    System.err.println("❌ AvailabilityController: Error getting team availability: " + throwable.getMessage());
                    return ResponseEntity.<Map<String, Object>>badRequest().build();
                });
    }
    
    /**
     * Get availability for a specific user for a specific event
     */
    @GetMapping("/user/{userId}/team/{teamId}/event/{eventId}")
    public CompletableFuture<ResponseEntity<Availability>> getUserAvailabilityForEvent(
            @PathVariable String userId,
            @PathVariable String teamId,
            @PathVariable String eventId) {
        
        return availabilityService.getUserAvailabilityForEvent(userId, teamId, eventId)
                .thenApply(availability -> ResponseEntity.ok(availability))
                .exceptionally(throwable -> {
                    System.err.println("❌ AvailabilityController: Error getting user availability: " + throwable.getMessage());
                    return ResponseEntity.<Availability>badRequest().build();
                });
    }
    
    /**
     * Clean up all availabilities for events in a specific tournament
     */
    @DeleteMapping("/tournament/{tournamentId}")
    public CompletableFuture<ResponseEntity<String>> cleanupTournamentEventAvailabilities(@PathVariable String tournamentId) {
        
        return availabilityService.cleanupTournamentEventAvailabilities(tournamentId)
                .thenApply(v -> ResponseEntity.ok("Successfully cleaned up availabilities for tournament " + tournamentId))
                .exceptionally(throwable -> {
                    System.err.println("❌ AvailabilityController: Error cleaning up tournament event availabilities: " + throwable.getMessage());
                    return ResponseEntity.<String>badRequest().build();
                });
    }
}