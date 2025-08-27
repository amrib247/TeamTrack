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
                throw new RuntimeException("Failed to find organizers by tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Gets detailed organizer information for a tournament
     */
    public CompletableFuture<List<Map<String, Object>>> getOrganizerDetailsByTournament(String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 OrganizerTournamentService: Getting organizer details for tournament: " + tournamentId);
                
                // Query organizerTournaments collection for the tournament
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("tournamentId", tournamentId)
                    .whereEqualTo("isActive", true)
                    .get()
                    .get();
                
                List<Map<String, Object>> organizerDetails = new ArrayList<>();
                
                for (var document : querySnapshot.getDocuments()) {
                    try {
                        String userId = document.getString("userId");
                        if (userId != null) {
                            // Get user profile information
                            var userDoc = firestore.collection("userProfiles").document(userId).get().get();
                            if (userDoc.exists()) {
                                var userData = userDoc.getData();
                                if (userData != null) {
                                    Map<String, Object> organizerInfo = new HashMap<>();
                                    organizerInfo.put("userId", userId);
                                    organizerInfo.put("firstName", userData.get("firstName"));
                                    organizerInfo.put("lastName", userData.get("lastName"));
                                    organizerInfo.put("email", userData.get("email"));
                                    organizerInfo.put("profilePhotoUrl", userData.get("profilePhotoUrl"));
                                    organizerInfo.put("phoneNumber", userData.get("phoneNumber"));
                                    organizerInfo.put("role", "ORGANIZER"); // All organizers have the same role
                                    organizerInfo.put("organizerId", document.getId()); // The organizerTournament document ID
                                    
                                    organizerDetails.add(organizerInfo);
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ OrganizerTournamentService: Warning - could not get details for organizer document " + document.getId() + ": " + e.getMessage());
                    }
                }
                
                System.out.println("✅ OrganizerTournamentService: Retrieved details for " + organizerDetails.size() + " organizers");
                return organizerDetails;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error getting organizer details: " + e.getMessage());
                throw new RuntimeException("Failed to get organizer details: " + e.getMessage());
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
                throw new RuntimeException("Failed to delete organizer tournaments: " + e.getMessage());
            }
        });
    }
    
    /**
     * Invites a user to be an organizer of a tournament
     */
    public CompletableFuture<OrganizerTournament> inviteUserToTournament(String tournamentId, String userEmail) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🎯 OrganizerTournamentService: Inviting user to tournament: " + userEmail + " -> " + tournamentId);
                
                // First, find the user by email
                var userProfiles = firestore.collection("userProfiles")
                    .whereEqualTo("email", userEmail)
                    .get()
                    .get();
                
                if (userProfiles.isEmpty()) {
                    throw new RuntimeException("User with email " + userEmail + " not found");
                }
                
                var userProfile = userProfiles.getDocuments().get(0).toObject(com.example.TeamTrack_backend.models.UserProfile.class);
                if (userProfile == null) {
                    throw new RuntimeException("Failed to parse user profile");
                }
                
                String userId = userProfile.getUid();
                
                // Check if user is already an organizer of this tournament
                var existingOrganizer = firestore.collection("organizerTournaments")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("tournamentId", tournamentId)
                    .get()
                    .get();
                
                if (!existingOrganizer.isEmpty()) {
                    throw new RuntimeException("User is already an organizer of this tournament");
                }
                
                // Generate unique ID first
                String id = java.util.UUID.randomUUID().toString();
                
                // Create new OrganizerTournament document (inactive initially)
                OrganizerTournament newOrganizerTournament = new OrganizerTournament(userId, tournamentId);
                newOrganizerTournament.setId(id);
                newOrganizerTournament.setActive(false); // Set to inactive until accepted
                
                // Convert to HashMap for Firestore serialization to avoid LocalDateTime issues
                java.util.Map<String, Object> organizerTournamentData = new java.util.HashMap<>();
                organizerTournamentData.put("id", newOrganizerTournament.getId());
                organizerTournamentData.put("userId", newOrganizerTournament.getUserId());
                organizerTournamentData.put("tournamentId", newOrganizerTournament.getTournamentId());
                organizerTournamentData.put("createdAt", newOrganizerTournament.getCreatedAt().toString());
                organizerTournamentData.put("isActive", newOrganizerTournament.isActive());
                
                // Save to Firestore using the generated ID
                firestore.collection("organizerTournaments").document(id).set(organizerTournamentData).get();
                
                System.out.println("✅ OrganizerTournamentService: User invited to tournament successfully");
                return newOrganizerTournament;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error inviting user to tournament: " + e.getMessage());
                throw new RuntimeException("Failed to invite user to tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Accepts an organizer invite for a tournament
     */
    public CompletableFuture<OrganizerTournament> acceptOrganizerInvite(String organizerTournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("✅ OrganizerTournamentService: Accepting organizer invite: " + organizerTournamentId);
                
                // Get the existing OrganizerTournament document
                var docRef = firestore.collection("organizerTournaments").document(organizerTournamentId);
                var doc = docRef.get().get();
                
                if (!doc.exists()) {
                    throw new RuntimeException("OrganizerTournament relationship not found");
                }
                
                // Get the document data as a map to avoid LocalDateTime parsing issues
                var documentData = doc.getData();
                if (documentData == null) {
                    throw new RuntimeException("Failed to get OrganizerTournament document data");
                }
                
                // Create OrganizerTournament object from the data
                OrganizerTournament organizerTournament = new OrganizerTournament();
                organizerTournament.setId(organizerTournamentId);
                organizerTournament.setUserId((String) documentData.get("userId"));
                organizerTournament.setTournamentId((String) documentData.get("tournamentId"));
                
                // Parse the createdAt string back to LocalDateTime
                String createdAtStr = (String) documentData.get("createdAt");
                if (createdAtStr != null) {
                    organizerTournament.setCreatedAt(java.time.LocalDateTime.parse(createdAtStr));
                }
                
                // Update the isActive field to true
                organizerTournament.setActive(true);
                
                // Convert to HashMap for Firestore serialization
                java.util.Map<String, Object> updateData = new java.util.HashMap<>();
                updateData.put("isActive", true);
                updateData.put("updatedAt", java.time.LocalDateTime.now().toString());
                
                // Update the document
                docRef.update(updateData).get();
                
                // Increment the tournament's organizer count
                String tournamentId = organizerTournament.getTournamentId();
                try {
                    // Get current tournament
                    var tournamentDoc = firestore.collection("tournaments").document(tournamentId).get().get();
                    if (tournamentDoc.exists()) {
                        var tournamentData = tournamentDoc.getData();
                        if (tournamentData != null) {
                            int currentCount = tournamentData.get("organizerCount") != null ? 
                                ((Number) tournamentData.get("organizerCount")).intValue() : 1;
                            
                            // Update the organizer count
                            firestore.collection("tournaments").document(tournamentId)
                                .update("organizerCount", currentCount + 1).get();
                            
                            System.out.println("✅ OrganizerTournamentService: Tournament organizer count incremented to " + (currentCount + 1));
                        }
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ OrganizerTournamentService: Warning - could not update tournament organizer count: " + e.getMessage());
                }
                
                System.out.println("✅ OrganizerTournamentService: Organizer invite accepted successfully");
                return organizerTournament;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error accepting organizer invite: " + e.getMessage());
                throw new RuntimeException("Failed to accept organizer invite: " + e.getMessage());
            }
        });
    }
    
    /**
     * Declines an organizer invite for a tournament
     */
    public CompletableFuture<Void> declineOrganizerInvite(String organizerTournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("❌ OrganizerTournamentService: Declining organizer invite: " + organizerTournamentId);
                
                // Delete the OrganizerTournament document
                firestore.collection("organizerTournaments").document(organizerTournamentId).delete().get();
                
                System.out.println("✅ OrganizerTournamentService: Organizer invite declined successfully");
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error declining organizer invite: " + e.getMessage());
                throw new RuntimeException("Failed to decline organizer invite: " + e.getMessage());
            }
        });
    }
    
    /**
     * Gets pending organizer invites for a user
     */
    public CompletableFuture<List<Map<String, Object>>> getPendingOrganizerInvites(String userId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 OrganizerTournamentService: Getting pending organizer invites for user: " + userId);
                
                // Query organizerTournaments collection for the user with isActive = false
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("isActive", false)
                    .get()
                    .get();
                
                List<Map<String, Object>> pendingInvites = new ArrayList<>();
                
                for (var document : querySnapshot.getDocuments()) {
                    try {
                        String tournamentId = document.getString("tournamentId");
                        if (tournamentId != null) {
                            // Get tournament information
                            var tournamentDoc = firestore.collection("tournaments").document(tournamentId).get().get();
                            if (tournamentDoc.exists()) {
                                var tournamentData = tournamentDoc.getData();
                                if (tournamentData != null) {
                                    Map<String, Object> inviteInfo = new HashMap<>();
                                    inviteInfo.put("organizerTournamentId", document.getId());
                                    inviteInfo.put("tournamentId", tournamentId);
                                    inviteInfo.put("tournamentName", tournamentData.get("name"));
                                    inviteInfo.put("tournamentDescription", tournamentData.get("description"));
                                    
                                    pendingInvites.add(inviteInfo);
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ OrganizerTournamentService: Warning - could not parse pending invite document " + document.getId() + ": " + e.getMessage());
                    }
                }
                
                System.out.println("✅ OrganizerTournamentService: Found " + pendingInvites.size() + " pending organizer invites");
                return pendingInvites;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error getting pending organizer invites: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to get pending organizer invites: " + e.getMessage());
            }
        });
    }
    
    /**
     * Removes an organizer from a tournament by deleting their organizerTournament object
     */
    public CompletableFuture<Void> removeOrganizerFromTournament(String userId, String tournamentId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🚪 OrganizerTournamentService: Removing organizer from tournament");
                System.out.println("👤 User ID: " + userId + ", Tournament ID: " + tournamentId);
                
                // Query to find the organizerTournament document for this user and tournament
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("tournamentId", tournamentId)
                    .get()
                    .get();
                
                if (querySnapshot.isEmpty()) {
                    System.out.println("⚠️ OrganizerTournamentService: No organizerTournament found for user " + userId + " and tournament " + tournamentId);
                    return;
                }
                
                // Delete the organizerTournament document
                var document = querySnapshot.getDocuments().get(0);
                firestore.collection("organizerTournaments").document(document.getId()).delete().get();
                
                // Decrement the tournament's organizer count
                try {
                    // Get current tournament
                    var tournamentDoc = firestore.collection("tournaments").document(tournamentId).get().get();
                    if (tournamentDoc.exists()) {
                        var tournamentData = tournamentDoc.getData();
                        if (tournamentData != null) {
                            int currentCount = tournamentData.get("organizerCount") != null ? 
                                ((Number) tournamentData.get("organizerCount")).intValue() : 1;
                            
                            // Ensure count doesn't go below 1 (at least one organizer should remain)
                            int newCount = Math.max(1, currentCount - 1);
                            
                            // Update the organizer count
                            firestore.collection("tournaments").document(tournamentId)
                                .update("organizerCount", newCount).get();
                            
                            System.out.println("✅ OrganizerTournamentService: Tournament organizer count decremented to " + newCount);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ OrganizerTournamentService: Warning - could not update tournament organizer count: " + e.getMessage());
                }
                
                System.out.println("✅ OrganizerTournamentService: Organizer removed from tournament successfully");
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error removing organizer from tournament: " + e.getMessage());
                throw new RuntimeException("Failed to remove organizer from tournament: " + e.getMessage());
            }
        });
    }
    
    /**
     * Handles cleanup when a user deletes their account
     * Deletes all organizerTournament objects for the user and updates tournament organizer counts
     */
    public CompletableFuture<Void> cleanupUserOrganizerRelationships(String userId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ OrganizerTournamentService: Cleaning up organizer relationships for deleted user: " + userId);
                
                // Find all organizerTournament documents for this user
                var querySnapshot = firestore.collection("organizerTournaments")
                    .whereEqualTo("userId", userId)
                    .get()
                    .get();
                
                if (querySnapshot.isEmpty()) {
                    System.out.println("ℹ️ OrganizerTournamentService: No organizer relationships found for user: " + userId);
                    return;
                }
                
                System.out.println("🔍 OrganizerTournamentService: Found " + querySnapshot.size() + " organizer relationships to clean up");
                
                // Group by tournament ID to update organizer counts efficiently
                Map<String, Integer> tournamentDecrements = new HashMap<>();
                
                for (var document : querySnapshot.getDocuments()) {
                    try {
                        String tournamentId = document.getString("tournamentId");
                        if (tournamentId != null) {
                            // Count how many relationships we're removing for each tournament
                            tournamentDecrements.merge(tournamentId, 1, Integer::sum);
                            
                            // Delete the organizerTournament document
                            firestore.collection("organizerTournaments").document(document.getId()).delete().get();
                            System.out.println("🗑️ OrganizerTournamentService: Deleted organizer relationship: " + document.getId());
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ OrganizerTournamentService: Warning - could not delete organizer relationship " + document.getId() + ": " + e.getMessage());
                    }
                }
                
                // Update organizer counts for affected tournaments
                for (Map.Entry<String, Integer> entry : tournamentDecrements.entrySet()) {
                    String tournamentId = entry.getKey();
                    int decrementAmount = entry.getValue();
                    
                    try {
                        // Get current tournament
                        var tournamentDoc = firestore.collection("tournaments").document(tournamentId).get().get();
                        if (tournamentDoc.exists()) {
                            var tournamentData = tournamentDoc.getData();
                            if (tournamentData != null) {
                                int currentCount = tournamentData.get("organizerCount") != null ? 
                                    ((Number) tournamentData.get("organizerCount")).intValue() : 1;
                                
                                // Ensure count doesn't go below 1 (at least one organizer should remain)
                                int newCount = Math.max(1, currentCount - decrementAmount);
                                
                                // Update the organizer count
                                firestore.collection("tournaments").document(tournamentId)
                                    .update("organizerCount", newCount).get();
                                
                                System.out.println("✅ OrganizerTournamentService: Tournament " + tournamentId + " organizer count updated from " + currentCount + " to " + newCount);
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ OrganizerTournamentService: Warning - could not update tournament " + tournamentId + " organizer count: " + e.getMessage());
                    }
                }
                
                System.out.println("✅ OrganizerTournamentService: Successfully cleaned up " + querySnapshot.size() + " organizer relationships for user: " + userId);
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error cleaning up user organizer relationships: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to cleanup user organizer relationships: " + e.getMessage());
            }
        });
    }

    /**
     * Check if a user can safely leave a tournament without leaving it with no organizers
     * @param userId The user ID trying to leave
     * @param tournamentId The tournament ID
     * @param action The action being performed (LEAVE_TOURNAMENT, DELETE_ACCOUNT)
     * @return true if safe to proceed, false if it would leave tournament with no organizers
     */
    public CompletableFuture<Boolean> checkOrganizerSafety(String userId, String tournamentId, String action) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔒 OrganizerTournamentService: Checking organizer safety for user: " + userId + 
                                 ", tournament: " + tournamentId + ", action: " + action);
                
                // Count active organizers for this tournament
                var organizerQuery = firestore.collection("organizerTournaments")
                    .whereEqualTo("tournamentId", tournamentId)
                    .whereEqualTo("isActive", true)
                    .get();
                
                var organizerDocs = organizerQuery.get().getDocuments();
                int activeOrganizerCount = organizerDocs.size();
                
                System.out.println("🔒 OrganizerTournamentService: Found " + activeOrganizerCount + " active organizers for tournament: " + tournamentId);
                
                // Check if this user is an active organizer
                boolean isUserActiveOrganizer = organizerDocs.stream()
                    .anyMatch(doc -> doc.getString("userId").equals(userId) && doc.getBoolean("isActive"));
                
                if (!isUserActiveOrganizer) {
                    System.out.println("🔒 OrganizerTournamentService: User is not an active organizer - safe to proceed");
                    return true; // User is not an organizer, so safe to proceed
                }
                
                // If user is the only organizer, prevent the action
                if (activeOrganizerCount <= 1) {
                    System.out.println("❌ OrganizerTournamentService: User is the last organizer - action blocked for safety");
                    return false; // Would leave tournament with no organizers
                }
                
                System.out.println("✅ OrganizerTournamentService: Multiple organizers exist - safe to proceed");
                return true; // Multiple organizers exist, safe to proceed
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error checking organizer safety: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to check organizer safety: " + e.getMessage(), e);
            }
        });
    }

    /**
     * Check if a user can be safely removed from all tournaments without leaving any with no organizers
     * @param userId The user ID trying to be removed
     * @return true if safe to proceed, false if any tournament would be left with no organizers
     */
    public CompletableFuture<Boolean> checkUserCanBeRemovedFromAllTournaments(String userId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔒 OrganizerTournamentService: Checking if user can be removed from all tournaments: " + userId);
                
                // Find all tournaments where this user is an active organizer
                var userOrganizerQuery = firestore.collection("organizerTournaments")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("isActive", true)
                    .get();
                
                var userOrganizerDocs = userOrganizerQuery.get().getDocuments();
                
                if (userOrganizerDocs.isEmpty()) {
                    System.out.println("🔒 OrganizerTournamentService: User is not an organizer of any tournaments - safe to proceed");
                    return true; // User is not an organizer of any tournaments
                }
                
                // Check each tournament to see if user is the last organizer
                for (var userOrganizerDoc : userOrganizerDocs) {
                    String tournamentId = userOrganizerDoc.getString("tournamentId");
                    
                    // Count active organizers for this tournament
                    var tournamentOrganizerQuery = firestore.collection("organizerTournaments")
                        .whereEqualTo("tournamentId", tournamentId)
                        .whereEqualTo("isActive", true)
                        .get();
                    
                    var tournamentOrganizerDocs = tournamentOrganizerQuery.get().getDocuments();
                    int activeOrganizerCount = tournamentOrganizerDocs.size();
                    
                    System.out.println("🔒 OrganizerTournamentService: Tournament " + tournamentId + " has " + activeOrganizerCount + " active organizers");
                    
                    // If user is the only organizer, prevent the action
                    if (activeOrganizerCount <= 1) {
                        System.out.println("❌ OrganizerTournamentService: User is the last organizer of tournament " + tournamentId + " - action blocked");
                        return false; // Would leave tournament with no organizers
                    }
                }
                
                System.out.println("✅ OrganizerTournamentService: User can be safely removed from all tournaments");
                return true; // Safe to proceed
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error checking user removal safety: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to check user removal safety: " + e.getMessage(), e);
            }
        });
    }
}
