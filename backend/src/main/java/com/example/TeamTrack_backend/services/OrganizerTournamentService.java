package com.example.TeamTrack_backend.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.models.OrganizerTournament;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class OrganizerTournamentService {
    
    public OrganizerTournamentService() {
        System.out.println("🔧 OrganizerTournamentService constructor called");
        System.out.println("🔧 OrganizerTournamentService constructor completed");
    }
    
    private Firestore getFirestore() {
        try {
            System.out.println("🔍 OrganizerTournamentService: Checking Firebase initialization...");
            System.out.println("🔍 OrganizerTournamentService: FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
            System.out.println("🔍 OrganizerTournamentService: FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
            
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ OrganizerTournamentService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as other services
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("✅ OrganizerTournamentService: Got Firestore from FirestoreClient: " + firestore);
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ OrganizerTournamentService: Failed to get Firestore instance: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Creates a new organizer tournament relationship
     */
    public CompletableFuture<OrganizerTournament> createOrganizerTournament(String userId, String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🚀 OrganizerTournamentService.createOrganizerTournament called");
                System.out.println("👤 User ID: " + userId + ", Tournament ID: " + tournamentId);
                
                // Generate unique ID
                String id = UUID.randomUUID().toString();
                System.out.println("🆔 OrganizerTournamentService: Generated ID: " + id);
                
                // Create organizer tournament object
                OrganizerTournament organizerTournament = new OrganizerTournament(userId, tournamentId);
                organizerTournament.setId(id);
                
                System.out.println("🏗️ OrganizerTournamentService: OrganizerTournament object created, saving to Firestore...");
                
                // Convert to HashMap for Firestore serialization
                Map<String, Object> organizerTournamentData = new HashMap<>();
                organizerTournamentData.put("id", organizerTournament.getId());
                organizerTournamentData.put("userId", organizerTournament.getUserId());
                organizerTournamentData.put("tournamentId", organizerTournament.getTournamentId());
                organizerTournamentData.put("createdAt", organizerTournament.getCreatedAt().toString());
                organizerTournamentData.put("isActive", organizerTournament.isActive());
                
                // Save to Firestore
                firestore.collection("organizerTournaments").document(id).set(organizerTournamentData).get();
                
                System.out.println("💾 OrganizerTournamentService: OrganizerTournament saved to Firestore successfully");
                System.out.println("🎉 OrganizerTournamentService: OrganizerTournament creation completed successfully!");
                
                return organizerTournament;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error during organizer tournament creation: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to create organizer tournament: " + e.getMessage(), e);
            }
        });
    }
    
    /**
     * Finds all tournaments organized by a specific user
     */
    public CompletableFuture<List<String>> getTournamentIdsByOrganizer(String userId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 OrganizerTournamentService: Finding tournaments organized by user: " + userId);
                
                // Query organizerTournaments collection for the user
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("isActive", true)
                    .get()
                    .get();
                
                List<String> tournamentIds = new ArrayList<>();
                
                for (var document : querySnapshot.getDocuments()) {
                    try {
                        String tournamentId = document.getString("tournamentId");
                        if (tournamentId != null) {
                            tournamentIds.add(tournamentId);
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ OrganizerTournamentService: Warning - could not parse document " + document.getId() + ": " + e.getMessage());
                    }
                }
                
                System.out.println("✅ OrganizerTournamentService: Found " + tournamentIds.size() + " tournaments organized by user");
                return tournamentIds;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error finding tournaments by organizer: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to find tournaments by organizer: " + e.getMessage());
            }
        });
    }
    
    /**
     * Finds all organizers of a specific tournament
     */
    public CompletableFuture<List<String>> getOrganizerIdsByTournament(String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 OrganizerTournamentService: Finding organizers for tournament: " + tournamentId);
                
                // Query organizerTournaments collection for the tournament
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("tournamentId", tournamentId)
                    .whereEqualTo("isActive", true)
                    .get()
                    .get();
                
                List<String> organizerIds = new ArrayList<>();
                
                for (var document : querySnapshot.getDocuments()) {
                    try {
                        String userId = document.getString("userId");
                        if (userId != null) {
                            organizerIds.add(userId);
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ OrganizerTournamentService: Warning - could not parse document " + document.getId() + ": " + e.getMessage());
                    }
                }
                
                System.out.println("✅ OrganizerTournamentService: Found " + organizerIds.size() + " organizers for tournament");
                return organizerIds;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error finding organizers by tournament: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to find organizers by tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Deactivates organizer tournament relationships when a tournament is deleted
     */
    public CompletableFuture<Void> deactivateOrganizerTournaments(String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ OrganizerTournamentService: Deactivating organizer tournaments for tournament: " + tournamentId);
                
                // Find all organizer relationships for this tournament
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("tournamentId", tournamentId)
                    .whereEqualTo("isActive", true)
                    .get()
                    .get();
                
                // Deactivate each relationship
                for (var document : querySnapshot.getDocuments()) {
                    Map<String, Object> updates = new HashMap<>();
                    updates.put("isActive", false);
                    updates.put("updatedAt", LocalDateTime.now().toString());
                    
                    firestore.collection("organizerTournaments").document(document.getId()).update(updates).get();
                    System.out.println("🗑️ OrganizerTournamentService: Deactivated organizer relationship: " + document.getId());
                }
                
                System.out.println("✅ OrganizerTournamentService: Deactivated " + querySnapshot.size() + " organizer relationships");
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error deactivating organizer tournaments: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to deactivate organizer tournaments: " + e.getMessage());
            }
        });
    }
    
    /**
     * Deletes organizer tournament relationships when a tournament is deleted
     */
    public CompletableFuture<Void> deleteOrganizerTournaments(String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ OrganizerTournamentService: Deleting organizer tournaments for tournament: " + tournamentId);
                
                // Find all organizer relationships for this tournament
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("tournamentId", tournamentId)
                    .get()
                    .get();
                
                // Delete each relationship
                for (var document : querySnapshot.getDocuments()) {
                    firestore.collection("organizerTournaments").document(document.getId()).delete().get();
                    System.out.println("🗑️ OrganizerTournamentService: Deleted organizer relationship: " + document.getId());
                }
                
                System.out.println("✅ OrganizerTournamentService: Deleted " + querySnapshot.size() + " organizer relationships");
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error deleting organizer tournaments: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to delete organizer tournaments: " + e.getMessage());
            }
        });
    }
}
