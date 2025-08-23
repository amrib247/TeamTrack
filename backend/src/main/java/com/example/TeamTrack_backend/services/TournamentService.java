package com.example.TeamTrack_backend.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.CreateTournamentRequest;
import com.example.TeamTrack_backend.dto.UpdateTournamentRequest;
import com.example.TeamTrack_backend.models.Tournament;
import com.example.TeamTrack_backend.models.OrganizerTournament;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class TournamentService {
    
    private final OrganizerTournamentService organizerTournamentService;
    
    public TournamentService(OrganizerTournamentService organizerTournamentService) {
        this.organizerTournamentService = organizerTournamentService;
        System.out.println("🔧 TournamentService constructor called");
        System.out.println("🔧 TournamentService constructor completed");
    }
    
    private Firestore getFirestore() {
        try {
            System.out.println("🔍 TournamentService: Checking Firebase initialization...");
            System.out.println("🔍 TournamentService: FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
            System.out.println("🔍 TournamentService: FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
            
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ TournamentService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as other services
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("✅ TournamentService: Got Firestore from FirestoreClient: " + firestore);
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ TournamentService: Failed to get Firestore instance: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Creates a new tournament
     */
    public CompletableFuture<Tournament> createTournament(CreateTournamentRequest request, String userId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🚀 TournamentService.createTournament called");
                System.out.println("📝 Tournament details: " + request.getName() + " - Max Size: " + request.getMaxSize());
                
                // Generate unique tournament ID
                String tournamentId = UUID.randomUUID().toString();
                System.out.println("🆔 TournamentService: Generated tournament ID: " + tournamentId);
                
                // Create tournament object
                Tournament tournament = new Tournament(
                    request.getName(),
                    request.getMaxSize(),
                    request.getDescription()
                );
                tournament.setId(tournamentId);
                tournament.setTeamIds(new ArrayList<>()); // Start with empty team list
                
                System.out.println("🏗️ TournamentService: Tournament object created, saving to Firestore...");
                
                // Convert to HashMap for Firestore serialization
                Map<String, Object> tournamentData = new HashMap<>();
                tournamentData.put("id", tournament.getId());
                tournamentData.put("name", tournament.getName());
                tournamentData.put("maxSize", tournament.getMaxSize());
                tournamentData.put("teamIds", tournament.getTeamIds());
                tournamentData.put("description", tournament.getDescription());
                tournamentData.put("createdAt", tournament.getCreatedAt().toString());
                tournamentData.put("updatedAt", tournament.getUpdatedAt().toString());
                tournamentData.put("isActive", tournament.isActive());
                
                // Save tournament to Firestore
                firestore.collection("tournaments").document(tournamentId).set(tournamentData).get();
                
                System.out.println("💾 TournamentService: Tournament saved to Firestore successfully");
                
                // Create organizer relationship
                System.out.println("👤 TournamentService: Creating organizer relationship...");
                try {
                    organizerTournamentService.createOrganizerTournament(userId, tournamentId).get();
                    System.out.println("✅ TournamentService: Organizer relationship created successfully");
                } catch (Exception e) {
                    System.err.println("⚠️ TournamentService: Warning - could not create organizer relationship: " + e.getMessage());
                    // Continue even if organizer relationship fails
                }
                
                System.out.println("🎉 TournamentService: Tournament creation completed successfully!");
                
                return tournament;
                
            } catch (Exception e) {
                System.err.println("❌ TournamentService: Error during tournament creation: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to create tournament: " + e.getMessage(), e);
            }
        });
    }
    
    /**
     * Retrieves all tournaments
     */
    public CompletableFuture<List<Tournament>> getAllTournaments() {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 TournamentService: Retrieving all tournaments...");
                
                // Get all tournament documents from Firestore
                var querySnapshot = firestore.collection("tournaments")
                    .whereEqualTo("isActive", true)
                    .get()
                    .get();
                
                List<Tournament> tournaments = new ArrayList<>();
                
                for (var document : querySnapshot.getDocuments()) {
                    try {
                        // Manually reconstruct Tournament object from Firestore data
                        Tournament tournament = new Tournament();
                        tournament.setId(document.getId());
                        tournament.setName(document.getString("name"));
                        tournament.setMaxSize(document.getLong("maxSize") != null ? 
                            document.getLong("maxSize").intValue() : 0);
                        tournament.setTeamIds(document.get("teamIds") != null ? 
                            (List<String>) document.get("teamIds") : new ArrayList<>());
                        tournament.setDescription(document.getString("description"));
                        
                        // Parse timestamps
                        String createdAtStr = document.getString("createdAt");
                        if (createdAtStr != null) {
                            tournament.setCreatedAt(LocalDateTime.parse(createdAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                        }
                        
                        String updatedAtStr = document.getString("updatedAt");
                        if (updatedAtStr != null) {
                            tournament.setUpdatedAt(LocalDateTime.parse(updatedAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                        }
                        
                        tournament.setActive(document.getBoolean("isActive") != null ? 
                            document.getBoolean("isActive") : true);
                        
                        tournaments.add(tournament);
                        
                    } catch (Exception e) {
                        System.err.println("⚠️ TournamentService: Warning - could not parse tournament document " + document.getId() + ": " + e.getMessage());
                        // Continue with other documents
                    }
                }
                
                System.out.println("✅ TournamentService: Retrieved " + tournaments.size() + " tournaments successfully");
                return tournaments;
                
            } catch (Exception e) {
                System.err.println("❌ TournamentService: Error retrieving tournaments: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to retrieve tournaments: " + e.getMessage());
            }
        });
    }
    
    /**
     * Retrieves a tournament by ID
     */
    public CompletableFuture<Tournament> getTournamentById(String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 TournamentService: Retrieving tournament with ID: " + tournamentId);
                
                // Get tournament document from Firestore
                var document = firestore.collection("tournaments").document(tournamentId).get().get();
                
                if (!document.exists()) {
                    System.out.println("❌ TournamentService: Tournament not found with ID: " + tournamentId);
                    return null;
                }
                
                // Manually reconstruct Tournament object from Firestore data
                Tournament tournament = new Tournament();
                tournament.setId(document.getId());
                tournament.setName(document.getString("name"));
                tournament.setMaxSize(document.getLong("maxSize") != null ? 
                    document.getLong("maxSize").intValue() : 0);
                tournament.setTeamIds(document.get("teamIds") != null ? 
                    (List<String>) document.get("teamIds") : new ArrayList<>());
                tournament.setDescription(document.getString("description"));
                
                // Parse timestamps
                String createdAtStr = document.getString("createdAt");
                if (createdAtStr != null) {
                    tournament.setCreatedAt(LocalDateTime.parse(createdAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                }
                
                String updatedAtStr = document.getString("updatedAt");
                if (updatedAtStr != null) {
                    tournament.setUpdatedAt(LocalDateTime.parse(updatedAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                }
                
                tournament.setActive(document.getBoolean("isActive") != null ? 
                    document.getBoolean("isActive") : true);
                
                System.out.println("✅ TournamentService: Tournament retrieved successfully: " + tournament.getName());
                return tournament;
                
            } catch (Exception e) {
                System.err.println("❌ TournamentService: Error retrieving tournament: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to retrieve tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Adds a team to a tournament
     */
    public CompletableFuture<Boolean> addTeamToTournament(String tournamentId, String teamId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("👥 TournamentService: Adding team " + teamId + " to tournament " + tournamentId);
                
                // Get current tournament
                Tournament tournament = getTournamentById(tournamentId).get();
                if (tournament == null) {
                    throw new RuntimeException("Tournament not found");
                }
                
                // Check if tournament is full
                if (tournament.getTeamIds().size() >= tournament.getMaxSize()) {
                    throw new RuntimeException("Tournament is full");
                }
                
                // Check if team is already in tournament
                if (tournament.getTeamIds().contains(teamId)) {
                    throw new RuntimeException("Team is already in tournament");
                }
                
                // Add team to tournament
                List<String> updatedTeamIds = new ArrayList<>(tournament.getTeamIds());
                updatedTeamIds.add(teamId);
                
                // Update in Firestore
                Map<String, Object> updates = new HashMap<>();
                updates.put("teamIds", updatedTeamIds);
                updates.put("updatedAt", LocalDateTime.now().toString());
                
                firestore.collection("tournaments").document(tournamentId).update(updates).get();
                
                System.out.println("✅ TournamentService: Team added to tournament successfully");
                return true;
                
            } catch (Exception e) {
                System.err.println("❌ TournamentService: Error adding team to tournament: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to add team to tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Removes a team from a tournament
     */
    public CompletableFuture<Boolean> removeTeamFromTournament(String tournamentId, String teamId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("👥 TournamentService: Removing team " + teamId + " from tournament " + tournamentId);
                
                // Get current tournament
                Tournament tournament = getTournamentById(tournamentId).get();
                if (tournament == null) {
                    throw new RuntimeException("Tournament not found");
                }
                
                // Check if team is in tournament
                if (!tournament.getTeamIds().contains(teamId)) {
                    throw new RuntimeException("Team is not in tournament");
                }
                
                // Remove team from tournament
                List<String> updatedTeamIds = new ArrayList<>(tournament.getTeamIds());
                updatedTeamIds.remove(teamId);
                
                // Update in Firestore
                Map<String, Object> updates = new HashMap<>();
                updates.put("teamIds", updatedTeamIds);
                updates.put("updatedAt", LocalDateTime.now().toString());
                
                firestore.collection("tournaments").document(tournamentId).update(updates).get();
                
                System.out.println("✅ TournamentService: Team removed from tournament successfully");
                return true;
                
            } catch (Exception e) {
                System.err.println("❌ TournamentService: Error removing team from tournament: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to remove team from tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Gets tournaments organized by a specific user
     */
    public CompletableFuture<List<Tournament>> getTournamentsByOrganizer(String userId) {
        return organizerTournamentService.getTournamentIdsByOrganizer(userId)
            .thenCompose(tournamentIds -> {
                if (tournamentIds.isEmpty()) {
                    return CompletableFuture.completedFuture(new ArrayList<>());
                }
                
                // Get tournament details for each ID
                List<CompletableFuture<Tournament>> tournamentFutures = tournamentIds.stream()
                    .map(this::getTournamentById)
                    .collect(Collectors.toList());
                
                return CompletableFuture.allOf(tournamentFutures.toArray(new CompletableFuture[0]))
                    .thenApply(v -> tournamentFutures.stream()
                        .map(CompletableFuture::join)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList()));
            });
    }
    
    /**
     * Gets detailed organizer information for a tournament
     */
    public CompletableFuture<List<Map<String, Object>>> getTournamentOrganizers(String tournamentId) {
        return organizerTournamentService.getOrganizerDetailsByTournament(tournamentId);
    }
    
    /**
     * Invites a user to be an organizer of a tournament
     */
    public CompletableFuture<OrganizerTournament> inviteUserToTournament(String tournamentId, String userEmail) {
        return organizerTournamentService.inviteUserToTournament(tournamentId, userEmail);
    }
    
    /**
     * Gets pending organizer invites for a user
     */
    public CompletableFuture<List<Map<String, Object>>> getPendingOrganizerInvites(String userId) {
        return organizerTournamentService.getPendingOrganizerInvites(userId);
    }
    
    /**
     * Updates a tournament
     */
    public CompletableFuture<Tournament> updateTournament(String tournamentId, UpdateTournamentRequest request) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔄 TournamentService: Updating tournament with ID: " + tournamentId);
                
                // First check if tournament exists
                var documentSnapshot = firestore.collection("tournaments").document(tournamentId).get().get();
                if (!documentSnapshot.exists()) {
                    throw new RuntimeException("Tournament not found");
                }
                
                // Get current tournament data
                Map<String, Object> tournamentData = documentSnapshot.getData();
                
                // Update fields
                Map<String, Object> updateData = new HashMap<>();
                if (request.getName() != null && !request.getName().trim().isEmpty()) {
                    updateData.put("name", request.getName().trim());
                }
                if (request.getDescription() != null) {
                    updateData.put("description", request.getDescription().trim());
                }
                updateData.put("updatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                
                // Update document in Firestore
                firestore.collection("tournaments").document(tournamentId).update(updateData).get();
                
                // Return updated tournament
                Tournament updatedTournament = new Tournament();
                updatedTournament.setId(tournamentId);
                updatedTournament.setName((String) updateData.getOrDefault("name", tournamentData.get("name")));
                updatedTournament.setDescription((String) updateData.getOrDefault("description", tournamentData.get("description")));
                updatedTournament.setMaxSize(((Long) tournamentData.get("maxSize")).intValue());
                
                @SuppressWarnings("unchecked")
                List<String> teamIds = (List<String>) tournamentData.get("teamIds");
                updatedTournament.setTeamIds(teamIds != null ? teamIds : new ArrayList<>());
                
                // Parse dates
                String createdAtStr = (String) tournamentData.get("createdAt");
                String updatedAtStr = (String) updateData.get("updatedAt");
                
                if (createdAtStr != null) {
                    updatedTournament.setCreatedAt(LocalDateTime.parse(createdAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                }
                if (updatedAtStr != null) {
                    updatedTournament.setUpdatedAt(LocalDateTime.parse(updatedAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                }
                
                updatedTournament.setActive((Boolean) tournamentData.getOrDefault("isActive", true));
                
                System.out.println("✅ TournamentService: Tournament updated successfully");
                return updatedTournament;
                
            } catch (Exception e) {
                System.err.println("❌ TournamentService: Error updating tournament: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to update tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Deletes a tournament and all associated data
     * 
     * This method performs comprehensive cleanup similar to team termination:
     * 1. Delete all organizer relationships
     * 2. Delete all team registrations
     * 3. Delete tournament document
     * 
     * Note: If any step fails, it logs a warning but continues with the process
     * to ensure the tournament is deleted even if some cleanup operations fail.
     */
    public CompletableFuture<Void> deleteTournament(String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ TournamentService: Deleting tournament with ID: " + tournamentId);
                
                // First, delete all organizer relationships for this tournament
                System.out.println("👑 TournamentService: Deleting all organizer relationships...");
                try {
                    organizerTournamentService.deleteOrganizerTournaments(tournamentId).get();
                    System.out.println("✅ TournamentService: All organizer relationships deleted");
                } catch (Exception e) {
                    System.err.println("⚠️ TournamentService: Warning - could not delete organizer relationships: " + e.getMessage());
                    // Don't fail tournament deletion if organizer cleanup fails
                }
                
                // Second, remove all team registrations for this tournament
                System.out.println("👥 TournamentService: Removing all team registrations...");
                try {
                    if (firestore != null) {
                        // Get the tournament to see which teams are registered
                        var tournamentDoc = firestore.collection("tournaments").document(tournamentId).get().get();
                        if (tournamentDoc.exists()) {
                            var tournamentData = tournamentDoc.getData();
                            if (tournamentData != null && tournamentData.containsKey("teamIds")) {
                                @SuppressWarnings("unchecked")
                                var teamIds = (List<String>) tournamentData.get("teamIds");
                                if (teamIds != null && !teamIds.isEmpty()) {
                                    System.out.println("🔍 TournamentService: Found " + teamIds.size() + " teams to remove from tournament");
                                    
                                    // Update each team to remove this tournament from their tournament list
                                    for (String teamId : teamIds) {
                                        try {
                                            var teamDoc = firestore.collection("teams").document(teamId).get().get();
                                            if (teamDoc.exists()) {
                                                var teamData = teamDoc.getData();
                                                if (teamData != null && teamData.containsKey("tournamentIds")) {
                                                    @SuppressWarnings("unchecked")
                                                    var teamTournamentIds = (List<String>) teamData.get("tournamentIds");
                                                    if (teamTournamentIds != null) {
                                                        teamTournamentIds.remove(tournamentId);
                                                        
                                                        // Update the team document
                                                        var updateData = new HashMap<String, Object>();
                                                        updateData.put("tournamentIds", teamTournamentIds);
                                                        updateData.put("updatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                                                        
                                                        firestore.collection("teams").document(teamId).update(updateData).get();
                                                        System.out.println("🗑️ TournamentService: Removed tournament from team: " + teamId);
                                                    }
                                                }
                                            }
                                        } catch (Exception e) {
                                            System.err.println("⚠️ TournamentService: Warning - could not remove tournament from team " + teamId + ": " + e.getMessage());
                                            // Continue with other teams even if one fails
                                        }
                                    }
                                }
                            }
                        }
                        System.out.println("✅ TournamentService: All team registrations removed");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TournamentService: Warning - could not remove team registrations: " + e.getMessage());
                    // Don't fail tournament deletion if team removal fails
                }
                
                // Finally, delete the actual tournament document
                System.out.println("🗑️ TournamentService: Deleting tournament document...");
                firestore.collection("tournaments").document(tournamentId).delete().get();
                System.out.println("✅ TournamentService: Tournament document deleted");
                
                // Log comprehensive cleanup summary
                System.out.println("🎯 TournamentService: Tournament deletion cleanup completed successfully:");
                System.out.println("   • Organizer Relationships: Deleted (cascade cleanup)");
                System.out.println("   • Team Registrations: Removed (cascade cleanup)");
                System.out.println("   • Tournament Document: Deleted");
                
                System.out.println("✅ TournamentService: Tournament deleted successfully");
                
            } catch (Exception e) {
                System.err.println("❌ TournamentService: Error deleting tournament: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to delete tournament: " + e.getMessage());
            }
        });
    }
}
