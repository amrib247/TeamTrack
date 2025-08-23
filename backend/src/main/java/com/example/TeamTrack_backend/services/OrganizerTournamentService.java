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
                e.printStackTrace();
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
                e.printStackTrace();
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
                
                System.out.println("✅ OrganizerTournamentService: Organizer invite accepted successfully");
                return organizerTournament;
                
            } catch (Exception e) {
                System.err.println("❌ OrganizerTournamentService: Error accepting organizer invite: " + e.getMessage());
                e.printStackTrace();
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
                e.printStackTrace();
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
}
