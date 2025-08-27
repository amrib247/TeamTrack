package com.example.TeamTrack_backend.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.UserTeamWithUserDto;
import com.example.TeamTrack_backend.models.Availability;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class AvailabilityService {
    
    private final UserTeamService userTeamService;
    
    public AvailabilityService(UserTeamService userTeamService) {
        this.userTeamService = userTeamService;
    }
    
    private Firestore getFirestore() {
        try {
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ AvailabilityService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as other services
            return FirestoreClient.getFirestore();
            
        } catch (Exception e) {
            System.err.println("❌ AvailabilityService: Failed to get Firestore instance: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Create or update availability for a user for a specific event
     */
    public CompletableFuture<Availability> setAvailability(String userId, String teamId, String eventId, String status) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                // Validate status
                if (!status.equals("YES") && !status.equals("NO") && !status.equals("MAYBE")) {
                    throw new IllegalArgumentException("Status must be YES, NO, or MAYBE");
                }
                
                // Check if availability already exists
                var existingQuery = firestore.collection("availabilities")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("teamId", teamId)
                    .whereEqualTo("eventId", eventId)
                    .get();
                
                QuerySnapshot existingSnapshot = existingQuery.get();
                
                if (!existingSnapshot.isEmpty()) {
                    // Update existing availability
                    QueryDocumentSnapshot existingDoc = existingSnapshot.getDocuments().get(0);
                    Availability existingAvailability = existingDoc.toObject(Availability.class);
                    if (existingAvailability != null) {
                        existingAvailability.setStatus(status);
                        existingAvailability.setUpdatedAt(java.time.LocalDateTime.now().toString());
                        
                        firestore.collection("availabilities").document(existingDoc.getId()).set(existingAvailability).get();
                        return existingAvailability;
                    }
                }
                
                // Create new availability
                String availabilityId = UUID.randomUUID().toString();
                Availability newAvailability = new Availability(userId, teamId, eventId, status);
                newAvailability.setId(availabilityId);
                
                firestore.collection("availabilities").document(availabilityId).set(newAvailability).get();
                return newAvailability;
                
            } catch (Exception e) {
                System.err.println("❌ AvailabilityService: Error setting availability: " + e.getMessage());
                throw new RuntimeException("Failed to set availability: " + e.getMessage());
            }
        });
    }
    
    /**
     * Get availability for all team members for a specific event
     */
    public CompletableFuture<Map<String, Object>> getTeamAvailabilityForEvent(String teamId, String eventId, String currentUserId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Use UserTeamService to get team members
                List<UserTeamWithUserDto> teamMembers = userTeamService.getTeamUsers(teamId).get();
                
                // Get all availabilities for this event
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                var availabilitiesQuery = firestore.collection("availabilities")
                    .whereEqualTo("eventId", eventId)
                    .get();
                
                QuerySnapshot availabilitiesSnapshot = availabilitiesQuery.get();
                Map<String, String> userAvailabilities = new HashMap<>();
                
                for (QueryDocumentSnapshot doc : availabilitiesSnapshot.getDocuments()) {
                    Availability availability = doc.toObject(Availability.class);
                    if (availability != null) {
                        userAvailabilities.put(availability.getUserId(), availability.getStatus());
                    }
                }
                
                // Build team availability from UserTeamWithUserDto
                List<Map<String, Object>> teamAvailability = new ArrayList<>();
                
                for (UserTeamWithUserDto teamMember : teamMembers) {
                    Map<String, Object> memberAvailability = new HashMap<>();
                    memberAvailability.put("userId", teamMember.getUserId());
                    memberAvailability.put("firstName", teamMember.getFirstName());
                    memberAvailability.put("lastName", teamMember.getLastName());
                    memberAvailability.put("role", teamMember.getRole());
                    memberAvailability.put("status", userAvailabilities.getOrDefault(teamMember.getUserId(), "UNKNOWN"));
                    memberAvailability.put("isCurrentUser", teamMember.getUserId().equals(currentUserId));
                    
                    teamAvailability.add(memberAvailability);
                }
                
                // Sort: current user first, then by role (COACH first), then by name
                teamAvailability.sort((a, b) -> {
                    // Current user first
                    if ((Boolean) a.get("isCurrentUser")) return -1;
                    if ((Boolean) b.get("isCurrentUser")) return 1;
                    
                    // Then by role (COACH first)
                    String roleA = (String) a.get("role");
                    String roleB = (String) b.get("role");
                    if ("COACH".equals(roleA) && !"COACH".equals(roleB)) return -1;
                    if ("COACH".equals(roleB) && !"COACH".equals(roleA)) return 1;
                    
                    // Then by last name, then first name
                    String lastNameA = (String) a.get("lastName");
                    String lastNameB = (String) b.get("lastName");
                    int lastNameCompare = lastNameA.compareToIgnoreCase(lastNameB);
                    if (lastNameCompare != 0) return lastNameCompare;
                    
                    String firstNameA = (String) a.get("firstName");
                    String firstNameB = (String) b.get("firstName");
                    return firstNameA.compareToIgnoreCase(firstNameB);
                });
                
                Map<String, Object> result = new HashMap<>();
                result.put("teamAvailability", teamAvailability);
                result.put("totalMembers", teamAvailability.size());
                return result;
                
            } catch (Exception e) {
                System.err.println("❌ AvailabilityService: Error getting team availability: " + e.getMessage());
                throw new RuntimeException("Failed to get team availability: " + e.getMessage());
            }
        });
    }
    
    /**
     * Get availability for a specific user for a specific event
     */
    public CompletableFuture<Availability> getUserAvailabilityForEvent(String userId, String teamId, String eventId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 AvailabilityService: Getting availability for user: " + userId + ", event: " + eventId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                var query = firestore.collection("availabilities")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("teamId", teamId)
                    .whereEqualTo("eventId", eventId)
                    .get();
                
                QuerySnapshot snapshot = query.get();
                
                if (!snapshot.isEmpty()) {
                    QueryDocumentSnapshot doc = snapshot.getDocuments().get(0);
                    Availability availability = doc.toObject(Availability.class);
                    if (availability != null) {
                        availability.setId(doc.getId());
                        return availability;
                    }
                }
                
                return null; // No availability found
                
            } catch (Exception e) {
                System.err.println("❌ AvailabilityService: Error getting user availability: " + e.getMessage());
                throw new RuntimeException("Failed to get user availability: " + e.getMessage());
            }
        });
    }
    
    /**
     * Delete availability for a user for a specific event
     */
    public CompletableFuture<Void> deleteAvailability(String userId, String teamId, String eventId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🔍 AvailabilityService: Deleting availability for user: " + userId + ", event: " + eventId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                var query = firestore.collection("availabilities")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("teamId", teamId)
                    .whereEqualTo("eventId", eventId)
                    .get();
                
                QuerySnapshot snapshot = query.get();
                
                if (!snapshot.isEmpty()) {
                    QueryDocumentSnapshot doc = snapshot.getDocuments().get(0);
                    firestore.collection("availabilities").document(doc.getId()).delete().get();
                    System.out.println("✅ AvailabilityService: Deleted availability");
                }
                
            } catch (Exception e) {
                System.err.println("❌ AvailabilityService: Error deleting availability: " + e.getMessage());
                throw new RuntimeException("Failed to delete availability: " + e.getMessage());
            }
        });
    }
    
    /**
     * Clean up all availabilities for a specific event
     */
    public CompletableFuture<Void> cleanupEventAvailabilities(String eventId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ AvailabilityService: Cleaning up availabilities for event: " + eventId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                var query = firestore.collection("availabilities")
                    .whereEqualTo("eventId", eventId)
                    .get();
                
                QuerySnapshot snapshot = query.get();
                int deletedCount = 0;
                
                for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                    try {
                        firestore.collection("availabilities").document(doc.getId()).delete().get();
                        deletedCount++;
                        System.out.println("🗑️ AvailabilityService: Deleted availability: " + doc.getId());
                    } catch (Exception e) {
                        System.err.println("⚠️ AvailabilityService: Warning - could not delete availability " + doc.getId() + ": " + e.getMessage());
                        // Continue with other availabilities even if one fails
                    }
                }
                
                System.out.println("✅ AvailabilityService: Cleaned up " + deletedCount + " availabilities for event: " + eventId);
                
            } catch (Exception e) {
                System.err.println("❌ AvailabilityService: Error cleaning up event availabilities: " + e.getMessage());
                throw new RuntimeException("Failed to cleanup event availabilities: " + e.getMessage());
            }
        });
    }
    
    /**
     * Clean up all availabilities for a specific team
     */
    public CompletableFuture<Void> cleanupTeamAvailabilities(String teamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ AvailabilityService: Cleaning up availabilities for team: " + teamId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                var query = firestore.collection("availabilities")
                    .whereEqualTo("teamId", teamId)
                    .get();
                
                QuerySnapshot snapshot = query.get();
                int deletedCount = 0;
                
                for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                    try {
                        firestore.collection("availabilities").document(doc.getId()).delete().get();
                        deletedCount++;
                        System.out.println("🗑️ AvailabilityService: Deleted availability: " + doc.getId());
                    } catch (Exception e) {
                        System.err.println("⚠️ AvailabilityService: Warning - could not delete availability " + doc.getId() + ": " + e.getMessage());
                        // Continue with other availabilities even if one fails
                    }
                }
                
                System.out.println("✅ AvailabilityService: Cleaned up " + deletedCount + " availabilities for team: " + teamId);
                
            } catch (Exception e) {
                System.err.println("❌ AvailabilityService: Error cleaning up team availabilities: " + e.getMessage());
                throw new RuntimeException("Failed to cleanup team availabilities: " + e.getMessage());
            }
        });
    }
    
    /**
     * Clean up all availabilities for events in a specific tournament
     */
    public CompletableFuture<Void> cleanupTournamentEventAvailabilities(String tournamentId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ AvailabilityService: Cleaning up availabilities for tournament events: " + tournamentId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                // First, get all events for this tournament
                var eventQuery = firestore.collection("events")
                    .whereEqualTo("tournamentId", tournamentId)
                    .get();
                
                QuerySnapshot eventSnapshot = eventQuery.get();
                int totalDeletedCount = 0;
                
                // For each event, clean up its availabilities
                for (QueryDocumentSnapshot eventDoc : eventSnapshot.getDocuments()) {
                    String eventId = eventDoc.getId();
                    System.out.println("🗑️ AvailabilityService: Cleaning up availabilities for event: " + eventId);
                    
                    var availabilityQuery = firestore.collection("availabilities")
                        .whereEqualTo("eventId", eventId)
                        .get();
                    
                    QuerySnapshot availabilitySnapshot = availabilityQuery.get();
                    int eventDeletedCount = 0;
                    
                    for (QueryDocumentSnapshot availabilityDoc : availabilitySnapshot.getDocuments()) {
                        try {
                            firestore.collection("availabilities").document(availabilityDoc.getId()).delete().get();
                            eventDeletedCount++;
                            System.out.println("🗑️ AvailabilityService: Deleted availability: " + availabilityDoc.getId());
                        } catch (Exception e) {
                            System.err.println("⚠️ AvailabilityService: Warning - could not delete availability " + availabilityDoc.getId() + ": " + e.getMessage());
                            // Continue with other availabilities even if one fails
                        }
                    }
                    
                    totalDeletedCount += eventDeletedCount;
                    System.out.println("✅ AvailabilityService: Cleaned up " + eventDeletedCount + " availabilities for event: " + eventId);
                }
                
                System.out.println("✅ AvailabilityService: Cleaned up " + totalDeletedCount + " total availabilities for tournament: " + tournamentId);
                
            } catch (Exception e) {
                System.err.println("❌ AvailabilityService: Error cleaning up tournament event availabilities: " + e.getMessage());
                throw new RuntimeException("Failed to cleanup tournament event availabilities: " + e.getMessage());
            }
        });
    }
}
