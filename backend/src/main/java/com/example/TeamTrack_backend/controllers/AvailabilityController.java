package com.example.TeamTrack_backend.controllers;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    
    public AvailabilityController() {
        System.out.println("🎯 AvailabilityController constructor called - controller is being instantiated!");
    }
    
    /**
     * Set availability for a user for a specific event
     */
    @PostMapping("/set")
    public CompletableFuture<ResponseEntity<Availability>> setAvailability(
            @RequestParam String userId,
            @RequestParam String teamId,
            @RequestParam String eventId,
            @RequestParam String status) {
        
        System.out.println("📥 AvailabilityController.setAvailability called");
        System.out.println("👤 User ID: " + userId + ", Team ID: " + teamId + ", Event ID: " + eventId + ", Status: " + status);
        
        return availabilityService.setAvailability(userId, teamId, eventId, status)
                .thenApply(availability -> {
                    System.out.println("✅ AvailabilityController: Availability set successfully");
                    return ResponseEntity.ok(availability);
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ AvailabilityController: Error setting availability: " + throwable.getMessage());
                    throwable.printStackTrace();
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
        
        System.out.println("📥 AvailabilityController.getTeamAvailabilityForEvent called");
        System.out.println("🏀 Team ID: " + teamId + ", Event ID: " + eventId + ", Current User ID: " + currentUserId);
        
        return availabilityService.getTeamAvailabilityForEvent(teamId, eventId, currentUserId)
                .thenApply(availability -> {
                    System.out.println("✅ AvailabilityController: Team availability retrieved successfully");
                    return ResponseEntity.ok(availability);
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ AvailabilityController: Error getting team availability: " + throwable.getMessage());
                    throwable.printStackTrace();
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
        
        System.out.println("📥 AvailabilityController.getUserAvailabilityForEvent called");
        System.out.println("👤 User ID: " + userId + ", Team ID: " + teamId + ", Event ID: " + eventId);
        
        try {
            return availabilityService.getUserAvailabilityForEvent(userId, teamId, eventId)
                    .thenApply(availability -> {
                        if (availability != null) {
                            System.out.println("✅ AvailabilityController: User availability retrieved successfully");
                            return ResponseEntity.ok(availability);
                        } else {
                            System.out.println("ℹ️ AvailabilityController: No availability found for user");
                            return ResponseEntity.<Availability>notFound().build();
                        }
                    });
        } catch (Exception e) {
            System.err.println("❌ AvailabilityController: Error getting user availability: " + e.getMessage());
            e.printStackTrace();
            return CompletableFuture.completedFuture(ResponseEntity.<Availability>badRequest().build());
        }
    }
}
