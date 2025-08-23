package com.example.TeamTrack_backend.controllers;

import java.util.List;
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
import com.example.TeamTrack_backend.services.TournamentService;

@RestController
@RequestMapping("/tournaments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TournamentController {
    
    @Autowired
    private TournamentService tournamentService;
    
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
     * Test endpoint to verify the controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Tournament controller is working!");
    }
}
