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

import com.example.TeamTrack_backend.dto.CreateEventRequest;
import com.example.TeamTrack_backend.models.Event;
import com.example.TeamTrack_backend.services.EventService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;

@RestController
@RequestMapping("/events")
public class EventController {
    
    @Autowired
    private EventService eventService;
    
    /**
     * Create a new event
     */
    @PostMapping
    public CompletableFuture<ResponseEntity<Event>> createEvent(@RequestBody CreateEventRequest request) {
        Event event = new Event(
            request.getTeamId(),
            request.getName(),
            request.getTournamentId(),
            request.getDate(),
            request.getStartTime(),
            request.getLengthMinutes(),
            request.getLocation(),
            request.getDescription(),
            request.getScore()
        );
        return eventService.createEvent(event)
            .thenApply(createdEvent -> ResponseEntity.ok(createdEvent))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Get all events for a specific team
     */
    @GetMapping("/team/{teamId}")
    public CompletableFuture<ResponseEntity<List<Event>>> getEventsByTeamId(@PathVariable String teamId) {
        return eventService.getEventsByTeamId(teamId)
            .thenApply(events -> ResponseEntity.ok(events))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Get a specific event by ID
     */
    @GetMapping("/{eventId}")
    public CompletableFuture<ResponseEntity<Event>> getEventById(@PathVariable String eventId) {
        return eventService.getEventById(eventId)
            .thenApply(event -> ResponseEntity.ok(event))
            .exceptionally(throwable -> ResponseEntity.notFound().build());
    }
    
    /**
     * Update an existing event
     */
    @PutMapping("/{eventId}")
    public CompletableFuture<ResponseEntity<Event>> updateEvent(@PathVariable String eventId, @RequestBody Event eventUpdate) {
        return eventService.updateEvent(eventId, eventUpdate)
            .thenApply(updatedEvent -> ResponseEntity.ok(updatedEvent))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Delete an event
     */
    @DeleteMapping("/{eventId}")
    public CompletableFuture<ResponseEntity<Void>> deleteEvent(@PathVariable String eventId) {
        return eventService.deleteEvent(eventId)
            .thenApply(v -> ResponseEntity.ok().<Void>build())
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Get events for a team within a date range
     */
    @GetMapping("/team/{teamId}/range")
    public CompletableFuture<ResponseEntity<List<Event>>> getEventsByDateRange(
            @PathVariable String teamId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return eventService.getEventsByDateRange(teamId, startDate, endDate)
            .thenApply(events -> ResponseEntity.ok(events))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Get all events for a specific tournament
     */
    @GetMapping("/tournament/{tournamentId}")
    public CompletableFuture<ResponseEntity<List<Event>>> getEventsByTournamentId(@PathVariable String tournamentId) {
        return eventService.getEventsByTournamentId(tournamentId)
            .thenApply(events -> ResponseEntity.ok(events))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Delete all events for a specific tournament
     */
    @DeleteMapping("/tournament/{tournamentId}")
    public CompletableFuture<ResponseEntity<String>> deleteEventsByTournamentId(@PathVariable String tournamentId) {
        return eventService.deleteEventsByTournamentId(tournamentId)
            .thenApply(deletedCount -> ResponseEntity.ok("Deleted " + deletedCount + " events for tournament " + tournamentId))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Clean up old events (more than a month old)
     * This endpoint can be called manually or scheduled
     */
    @PostMapping("/cleanup")
    public CompletableFuture<ResponseEntity<String>> cleanupOldEvents() {
        return eventService.cleanupOldEvents()
            .thenApply(deletedCount -> ResponseEntity.ok("Cleanup completed. Deleted " + deletedCount + " old events"));
    }
    
    /**
     * Test endpoint to see all events for debugging
     */
    @GetMapping("/debug/all")
    public CompletableFuture<ResponseEntity<String>> debugAllEvents() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = FirestoreClient.getFirestore();
                QuerySnapshot snapshot = firestore.collection("events").get().get();
                
                StringBuilder result = new StringBuilder();
                result.append("Total events in database: ").append(snapshot.size()).append("\n\n");
                
                for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                    Event event = document.toObject(Event.class);
                    if (event != null) {
                        result.append("Event ID: ").append(document.getId()).append("\n");
                        result.append("Name: ").append(event.getName()).append("\n");
                        result.append("Team ID: ").append(event.getTeamId()).append("\n");
                        result.append("Date: '").append(event.getDate()).append("'\n");
                        result.append("Time: '").append(event.getStartTime()).append("'\n");
                        result.append("---\n");
                    }
                }
                
                return ResponseEntity.ok(result.toString());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Error: " + e.getMessage());
            }
        });
    }
}
