package com.example.TeamTrack_backend.controllers;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.dto.CreateTournamentRequest;
import com.example.TeamTrack_backend.dto.TournamentDto;
import com.example.TeamTrack_backend.dto.UpdateTournamentRequest;
import com.example.TeamTrack_backend.services.OrganizerTournamentService;
import com.example.TeamTrack_backend.services.TournamentService;

@RestController
@RequestMapping("/tournaments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TournamentController {
    
    @Autowired
    private TournamentService tournamentService;
    
    @Autowired
    private OrganizerTournamentService organizerTournamentService;
    
    /**
     * Create a new tournament
     */
    @PostMapping
    public CompletableFuture<ResponseEntity<TournamentDto>> createTournament(
            @RequestBody CreateTournamentRequest request,
            @RequestParam String userId) {
        return tournamentService.createTournament(request, userId)
                .thenApply(tournament -> ResponseEntity.ok(new TournamentDto(tournament)));
    }
    
    /**
     * Get all tournaments
     */
    @GetMapping
    public CompletableFuture<ResponseEntity<List<TournamentDto>>> getAllTournaments() {
        return tournamentService.getAllTournaments()
                .thenApply(tournaments -> ResponseEntity.ok(
                    tournaments.stream()
                        .map(TournamentDto::new)
                        .collect(Collectors.toList())
                ));
    }
    
    /**
     * Get tournaments organized by a specific user
     */
    @GetMapping("/organizer/{userId}")
    public CompletableFuture<ResponseEntity<List<TournamentDto>>> getTournamentsByOrganizer(@PathVariable String userId) {
        return tournamentService.getTournamentsByOrganizer(userId)
                .thenApply(tournaments -> ResponseEntity.ok(
                    tournaments.stream()
                        .map(TournamentDto::new)
                        .collect(Collectors.toList())
                ));
    }
    
    /**
     * Get a tournament by ID
     */
    @GetMapping("/{tournamentId}")
    public CompletableFuture<ResponseEntity<TournamentDto>> getTournamentById(@PathVariable String tournamentId) {
        return tournamentService.getTournamentById(tournamentId)
                .thenApply(tournament -> {
                    if (tournament != null) {
                        return ResponseEntity.ok(new TournamentDto(tournament));
                    } else {
                        return ResponseEntity.notFound().build();
                    }
                });
    }
    
    /**
     * Get tournament organizers
     */
    @GetMapping("/{tournamentId}/organizers")
    public CompletableFuture<ResponseEntity<List<Map<String, Object>>>> getTournamentOrganizers(@PathVariable String tournamentId) {
        return tournamentService.getTournamentOrganizers(tournamentId)
                .thenApply(organizers -> ResponseEntity.ok(organizers));
    }
    
    /**
     * Invite a user to be an organizer of a tournament
     */
    @PostMapping("/{tournamentId}/organizers/invite")
    public CompletableFuture<ResponseEntity<Map<String, String>>> inviteUserToTournament(
            @PathVariable String tournamentId,
            @RequestBody Map<String, String> inviteRequest) {
        String userEmail = inviteRequest.get("email");
        if (userEmail == null || userEmail.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                ResponseEntity.badRequest().body(Map.of("error", "Email is required"))
            );
        }
        
        return tournamentService.inviteUserToTournament(tournamentId, userEmail.trim())
                .thenApply(result -> ResponseEntity.ok(Map.of("message", "User invited successfully")));
    }
    
    /**
     * Get pending organizer invites for a user
     */
    @GetMapping("/organizers/invites/{userId}")
    public CompletableFuture<ResponseEntity<List<Map<String, Object>>>> getPendingOrganizerInvites(@PathVariable String userId) {
        return tournamentService.getPendingOrganizerInvites(userId)
                .thenApply(invites -> ResponseEntity.ok(invites));
    }
    
    /**
     * Accept an organizer invite
     */
    @PostMapping("/organizers/invites/{organizerTournamentId}/accept")
    public CompletableFuture<ResponseEntity<Map<String, String>>> acceptOrganizerInvite(@PathVariable String organizerTournamentId) {
        return organizerTournamentService.acceptOrganizerInvite(organizerTournamentId)
                .thenApply(result -> ResponseEntity.ok(Map.of("message", "Invite accepted successfully")));
    }
    
    /**
     * Decline an organizer invite
     */
    @PostMapping("/organizers/invites/{organizerTournamentId}/decline")
    public CompletableFuture<ResponseEntity<Map<String, String>>> declineOrganizerInvite(@PathVariable String organizerTournamentId) {
        return organizerTournamentService.declineOrganizerInvite(organizerTournamentId)
                .thenApply(result -> ResponseEntity.ok(Map.of("message", "Invite declined successfully")));
    }
    
    /**
     * Add a team to a tournament
     */
    @PostMapping("/{tournamentId}/teams/{teamId}")
    public CompletableFuture<ResponseEntity<Void>> addTeamToTournament(
            @PathVariable String tournamentId,
            @PathVariable String teamId) {
        return tournamentService.addTeamToTournament(tournamentId, teamId)
                .thenApply(success -> ResponseEntity.ok().build());
    }
    
    /**
     * Remove a team from a tournament
     */
    @DeleteMapping("/{tournamentId}/teams/{teamId}")
    public CompletableFuture<ResponseEntity<Void>> removeTeamFromTournament(
            @PathVariable String tournamentId,
            @PathVariable String teamId) {
        return tournamentService.removeTeamFromTournament(tournamentId, teamId)
                .thenApply(success -> ResponseEntity.ok().build());
    }
    
    /**
     * Update a tournament
     */
    @PutMapping("/{tournamentId}")
    public CompletableFuture<ResponseEntity<TournamentDto>> updateTournament(
            @PathVariable String tournamentId,
            @RequestBody UpdateTournamentRequest request) {
        return tournamentService.updateTournament(tournamentId, request)
                .thenApply(tournament -> ResponseEntity.ok(new TournamentDto(tournament)));
    }
    
    /**
     * Delete a tournament
     */
    @DeleteMapping("/{tournamentId}")
    public CompletableFuture<ResponseEntity<Void>> deleteTournament(@PathVariable String tournamentId) {
        return tournamentService.deleteTournament(tournamentId)
                .thenApply(result -> ResponseEntity.ok().build());
    }
    
    /**
     * Remove an organizer from a tournament
     */
    @DeleteMapping("/{tournamentId}/organizers/{userId}")
    public CompletableFuture<ResponseEntity<Map<String, String>>> removeOrganizerFromTournament(
            @PathVariable String tournamentId,
            @PathVariable String userId) {
        // First check if it's safe to remove this organizer
        return organizerTournamentService.checkOrganizerSafety(userId, tournamentId, "LEAVE_TOURNAMENT")
                .thenCompose(canProceed -> {
                    if (!canProceed) {
                        return CompletableFuture.completedFuture(
                            ResponseEntity.badRequest().body(Map.of(
                                "error", "Cannot remove organizer",
                                "message", "Cannot remove the last organizer. Please invite other organizers or delete the tournament first."
                            ))
                        );
                    }
                    
                    // Safe to proceed with removal
                    return organizerTournamentService.removeOrganizerFromTournament(userId, tournamentId)
                            .thenApply(result -> ResponseEntity.ok(Map.of("message", "Organizer removed successfully")));
                });
    }
    
    /**
     * Clean up organizer relationships when a user deletes their account
     */
    @DeleteMapping("/organizers/cleanup/{userId}")
    public CompletableFuture<ResponseEntity<Map<String, String>>> cleanupUserOrganizerRelationships(
            @PathVariable String userId) {
        // First check if it's safe to remove this user from all tournaments
        return organizerTournamentService.checkUserCanBeRemovedFromAllTournaments(userId)
                .thenCompose(canProceed -> {
                    if (!canProceed) {
                        return CompletableFuture.completedFuture(
                            ResponseEntity.badRequest().body(Map.of(
                                "error", "Cannot delete account",
                                "message", "Cannot delete account - you are the last organizer of one or more tournaments. Please invite other organizers or delete the tournaments first."
                            ))
                        );
                    }
                    
                    // Safe to proceed with cleanup
                    return organizerTournamentService.cleanupUserOrganizerRelationships(userId)
                            .thenApply(result -> ResponseEntity.ok(Map.of("message", "User organizer relationships cleaned up successfully")));
                });
    }
    
    /**
     * Check if a user can safely leave a tournament without leaving it with no organizers
     */
    @GetMapping("/check-organizer-safety")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> checkOrganizerSafety(
            @RequestParam String userId,
            @RequestParam String tournamentId,
            @RequestParam String action) {
        return organizerTournamentService.checkOrganizerSafety(userId, tournamentId, action)
                .thenApply(canProceed -> {
                    Map<String, Object> response = Map.of(
                        "canProceed", canProceed,
                        "message", canProceed ? 
                            "Safe to proceed" : 
                            "Cannot proceed - would leave tournament with no organizers"
                    );
                    return ResponseEntity.ok(response);
                });
    }

    /**
     * Test endpoint to verify the controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Tournament controller is working!");
    }
}
