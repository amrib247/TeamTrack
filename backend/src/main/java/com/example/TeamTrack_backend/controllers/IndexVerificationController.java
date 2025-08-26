package com.example.TeamTrack_backend.controllers;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.services.IndexVerificationService;

@RestController
@RequestMapping("/admin/indices")
public class IndexVerificationController {

    private final IndexVerificationService indexVerificationService;

    @Autowired
    public IndexVerificationController(IndexVerificationService indexVerificationService) {
        System.out.println("? IndexVerificationController constructor called - controller is being instantiated!");
        this.indexVerificationService = indexVerificationService;
        System.out.println("? IndexVerificationController constructor completed");
    }

    /**
     * Verify all Firestore indices and return performance metrics
     */
    @GetMapping("/verify")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> verifyAllIndices() {
        return indexVerificationService.verifyAllIndices()
            .thenApply(results -> {
                if ("completed".equals(results.get("status"))) {
                    return ResponseEntity.ok(results);
                } else {
                    return ResponseEntity.status(500).body(results);
                }
            });
    }

    /**
     * Get index verification status and recommendations
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getIndexStatus() {
        Map<String, Object> status = Map.of(
            "message", "Index verification service is running",
            "endpoints", Map.of(
                "verify_all", "GET /api/admin/indices/verify",
                "status", "GET /api/admin/indices/status"
            ),
            "expected_indices", Map.of(
                "userTeams", "userId+teamId, teamId+role, userId+isActive",
                "tournamentInvites", "teamId+isActive, tournamentId+isActive, teamId+tournamentId",
                "tasks", "teamId+date, teamId+assignedUserId",
                "events", "teamId+date, teamId+eventType",
                "availabilities", "eventId+userId, userId+date",
                "teams", "createdByUserId+isActive, sport+ageGroup",
                "tournaments", "organizerId+status, sport+startDate",
                "chatMessages", "chatRoomId+timestamp",
                "chatRooms", "teamId+isActive"
            ),
            "performance_targets", Map.of(
                "excellent", "< 100ms",
                "good", "100-300ms",
                "needs_optimization", "> 300ms"
            )
        );
        
        return ResponseEntity.ok(status);
    }
}
