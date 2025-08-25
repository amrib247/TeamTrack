package com.example.TeamTrack_backend.services;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.Map;
import java.util.HashMap;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.CreateTeamRequest;
import com.example.TeamTrack_backend.dto.UpdateTeamRequest;
import com.example.TeamTrack_backend.models.Team;
import com.example.TeamTrack_backend.services.FileUploadService;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class TeamService {
    
    private final FileUploadService fileUploadService;
    
    public TeamService(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
        System.out.println("🔧 TeamService constructor called");
        System.out.println("🔧 TeamService constructor completed");
    }
    
    private Firestore getFirestore() {
        try {
            System.out.println("🔍 TeamService: Checking Firebase initialization...");
            System.out.println("🔍 TeamService: FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
            System.out.println("🔍 TeamService: FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
            
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ TeamService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as UserService - this is the correct way!
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("✅ TeamService: Got Firestore from FirestoreClient: " + firestore);
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ TeamService: Failed to get Firestore instance: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Creates a new team and automatically adds the creator as a coach
     */
    public CompletableFuture<Team> createTeam(CreateTeamRequest request, String createdByUserId) {
        System.out.println("🚀 TeamService.createTeam called with userId: " + createdByUserId);
        System.out.println("📝 Team details: " + request.getTeamName() + " - " + request.getSport() + " - " + request.getAgeGroup());
        
        Firestore firestore = getFirestore();
        if (firestore == null) {
            System.err.println("❌ TeamService: Firestore is null, cannot create team");
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔄 TeamService: Starting team creation in async thread");
                
                // Generate unique team ID
                String teamId = UUID.randomUUID().toString();
                System.out.println("🆔 TeamService: Generated team ID: " + teamId);
                
                // Create team object
                Team team = new Team(
                    request.getTeamName(),
                    request.getSport(),
                    request.getAgeGroup(),
                    createdByUserId
                );
                team.setId(teamId);
                team.setDescription(request.getDescription());
                team.setProfilePhotoUrl(request.getProfilePhotoUrl());
                
                System.out.println("🏗️ TeamService: Team object created, saving to Firestore...");
                
                // Save team to Firestore
                firestore.collection("teams").document(teamId).set(team).get();
                
                System.out.println("💾 TeamService: Team saved to Firestore successfully");
                System.out.println("👥 TeamService: Adding user to team as coach...");
                
                // Create UserTeam relationship directly in Firestore
                try {
                    if (firestore != null) {
                        // Create UserTeam document for the creator
                        var userTeamData = new java.util.HashMap<String, Object>();
                        userTeamData.put("userId", createdByUserId);
                        userTeamData.put("teamId", teamId);
                        userTeamData.put("role", "COACH");
                        userTeamData.put("joinDate", java.time.LocalDateTime.now().toString());
                        userTeamData.put("isActive", true);
                        userTeamData.put("inviteAccepted", true);
                        
                        firestore.collection("userTeams").add(userTeamData).get();
                        System.out.println("✅ TeamService: User added to team as coach successfully");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not create UserTeam relationship: " + e.getMessage());
                    // Don't fail team creation if UserTeam creation fails
                }
                
                System.out.println("🎉 TeamService: Team creation completed successfully!");
                
                return team;
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error during team creation: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to create team: " + e.getMessage(), e);
            }
        });
    }
    
    /**
     * Retrieves a team by ID
     */
    public CompletableFuture<Team> getTeamById(String teamId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 TeamService: Retrieving team with ID: " + teamId);
                
                // Get team document from Firestore
                var document = firestore.collection("teams").document(teamId).get().get();
                
                if (!document.exists()) {
                    System.out.println("❌ TeamService: Team not found with ID: " + teamId);
                    return null;
                }
                
                // Convert document to Team object
                Team team = document.toObject(Team.class);
                if (team != null) {
                    team.setId(teamId);
                    System.out.println("✅ TeamService: Team retrieved successfully: " + team.getTeamName());
                }
                
                return team;
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error retrieving team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to retrieve team: " + e.getMessage());
            }
        });
    }
    
    /**
     * Updates an existing team
     */
    public CompletableFuture<Team> updateTeam(String teamId, UpdateTeamRequest request) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔄 TeamService: Updating team with ID: " + teamId);
                System.out.println("📝 Update details: " + request.getTeamName() + " - " + request.getSport() + " - " + request.getAgeGroup());
                
                // Get existing team document directly
                var document = firestore.collection("teams").document(teamId).get().get();
                
                if (!document.exists()) {
                    System.err.println("❌ TeamService: Team document not found with ID: " + teamId);
                    throw new RuntimeException("Team not found with ID: " + teamId);
                }
                
                System.out.println("✅ TeamService: Found team document, updating...");
                
                // Convert document to Team object
                Team existingTeam = document.toObject(Team.class);
                if (existingTeam == null) {
                    throw new RuntimeException("Failed to parse team data");
                }
                
                existingTeam.setId(teamId);
                
                // Update fields
                existingTeam.setTeamName(request.getTeamName());
                existingTeam.setSport(request.getSport());
                existingTeam.setAgeGroup(request.getAgeGroup());
                if (request.getDescription() != null) {
                    existingTeam.setDescription(request.getDescription());
                }
                if (request.getProfilePhotoUrl() != null) {
                    existingTeam.setProfilePhotoUrl(request.getProfilePhotoUrl());
                }
                existingTeam.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                System.out.println("💾 TeamService: Saving updated team to Firestore...");
                
                // Save updated team document
                firestore.collection("teams").document(teamId).set(existingTeam).get();
                System.out.println("✅ TeamService: Team document updated successfully");
                
                // No need to update userTeams records since they no longer store redundant team details
                System.out.println("ℹ️ TeamService: userTeams records no longer store team details, skipping update");
                
                System.out.println("✅ TeamService: Team updated successfully");
                
                return existingTeam;
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error updating team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to update team: " + e.getMessage());
            }
        });
    }
    
    /**
     * Terminates a team by deleting all associated data and the team itself
     * This method performs a complete cascade deletion to prevent data orphanage:
     * 
     * 1. Events: All team events are deleted
     * 2. Availability: All team availability entries are deleted
     * 3. Tasks: All team tasks are deleted
     * 4. User Relationships: All user-team relationships are deleted
     * 5. Team Document: The team itself is deleted
     * 
     * Note: If any step fails, it logs a warning but continues with the process
     * to ensure the team is terminated even if some cleanup operations fail.
     */
    public CompletableFuture<Void> terminateTeam(String teamId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ TeamService: Terminating team with ID: " + teamId);
                
                // First, delete all events associated with this team
                System.out.println("📅 TeamService: Deleting all events for team...");
                try {
                    if (firestore != null) {
                        // Query for all events for this team
                        var eventsFuture = firestore.collection("events")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var eventsSnapshot = eventsFuture.get();
                        System.out.println("🔍 TeamService: Found " + eventsSnapshot.size() + " events to delete");
                        
                        // Delete all events for this team, handling tournament events specially
                        for (var eventDoc : eventsSnapshot.getDocuments()) {
                            Map<String, Object> eventData = eventDoc.getData();
                            String eventId = eventDoc.getId();
                            String tournamentId = (String) eventData.get("tournamentId");
                            
                            if (tournamentId != null && !tournamentId.isEmpty()) {
                                // This is a tournament event - find and delete the corresponding partner event
                                System.out.println("🏆 TeamService: Found tournament event " + eventId + " for tournament " + tournamentId);
                                
                                try {
                                    // Find the partner event using the opposingTeamId field
                                    String opposingTeamId = (String) eventData.get("opposingTeamId");
                                    if (opposingTeamId != null && !opposingTeamId.isEmpty()) {
                                        // Find the event where the opposing team is playing against the deleted team
                                        var partnerEventQuery = firestore.collection("events")
                                            .whereEqualTo("tournamentId", tournamentId)
                                            .whereEqualTo("teamId", opposingTeamId)
                                            .whereEqualTo("opposingTeamId", teamId)
                                            .get();
                                        
                                        var partnerEventSnapshot = partnerEventQuery.get();
                                        if (!partnerEventSnapshot.isEmpty()) {
                                            // We found the partner event - delete it first
                                            var partnerDoc = partnerEventSnapshot.getDocuments().get(0);
                                            String partnerEventId = partnerDoc.getId();
                                            
                                            System.out.println("🔍 TeamService: Found partner event: " + partnerEventId + " for team: " + opposingTeamId);
                                            
                                            // Delete the partner event first
                                            firestore.collection("events").document(partnerEventId).delete().get();
                                            System.out.println("🗑️ TeamService: Deleted partner tournament event: " + partnerEventId);
                                            
                                            // Also clean up availabilities for the partner event
                                            try {
                                                var availabilitiesQuery = firestore.collection("availabilities")
                                                    .whereEqualTo("eventId", partnerEventId)
                                                    .get();
                                                
                                                var availabilitiesSnapshot = availabilitiesQuery.get();
                                                int deletedAvailabilities = 0;
                                                
                                                for (var availabilityDoc : availabilitiesSnapshot.getDocuments()) {
                                                    firestore.collection("availabilities").document(availabilityDoc.getId()).delete().get();
                                                    deletedAvailabilities++;
                                                }
                                                
                                                if (deletedAvailabilities > 0) {
                                                    System.out.println("🧹 TeamService: Cleaned up " + deletedAvailabilities + " availabilities for partner event " + partnerEventId);
                                                }
                                            } catch (Exception availabilityError) {
                                                System.err.println("⚠️ TeamService: Warning - could not cleanup availabilities for partner event " + partnerEventId + ": " + availabilityError.getMessage());
                                            }
                                        } else {
                                            System.out.println("⚠️ TeamService: Warning - could not find partner event for tournament event " + eventId + " (opposingTeamId: " + opposingTeamId + ")");
                                        }
                                    } else {
                                        System.out.println("⚠️ TeamService: Warning - tournament event " + eventId + " does not have opposingTeamId set");
                                    }
                                } catch (Exception partnerError) {
                                    System.err.println("⚠️ TeamService: Warning - could not find/delete partner event for tournament event " + eventId + ": " + partnerError.getMessage());
                                }
                            }
                            
                            // Delete the current event
                            firestore.collection("events").document(eventId).delete().get();
                            System.out.println("🗑️ TeamService: Deleted event: " + eventId);
                        }
                        System.out.println("✅ TeamService: All events deleted for team");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not delete events: " + e.getMessage());
                    // Don't fail team termination if event deletion fails
                }
                
                // Second, delete all availability entries associated with this team
                // Note: Tournament event availabilities are handled during event deletion above
                System.out.println("📋 TeamService: Deleting all availability entries for team...");
                try {
                    if (firestore != null) {
                        // Query for all availabilities for this team
                        var availabilitiesFuture = firestore.collection("availabilities")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var availabilitiesSnapshot = availabilitiesFuture.get();
                        System.out.println("🔍 TeamService: Found " + availabilitiesSnapshot.size() + " availability entries to delete");
                        
                        // Delete all availabilities for this team
                        for (var availabilityDoc : availabilitiesSnapshot.getDocuments()) {
                            firestore.collection("availabilities").document(availabilityDoc.getId()).delete().get();
                            System.out.println("🗑️ TeamService: Deleted availability: " + availabilityDoc.getId());
                        }
                        System.out.println("✅ TeamService: All availability entries deleted for team");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not delete availability entries: " + e.getMessage());
                    // Don't fail team termination if availability deletion fails
                }
                
                // Third, delete all tasks associated with this team
                System.out.println("📝 TeamService: Deleting all tasks for team...");
                try {
                    if (firestore != null) {
                        // Query for all tasks for this team
                        var tasksFuture = firestore.collection("tasks")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var tasksSnapshot = tasksFuture.get();
                        System.out.println("🔍 TeamService: Found " + tasksSnapshot.size() + " tasks to delete");
                        
                        // Delete all tasks for this team
                        for (var taskDoc : tasksSnapshot.getDocuments()) {
                            firestore.collection("tasks").document(taskDoc.getId()).delete().get();
                            System.out.println("🗑️ TeamService: Deleted task: " + taskDoc.getId());
                        }
                        System.out.println("✅ TeamService: All tasks deleted for team");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not delete tasks: " + e.getMessage());
                    // Don't fail team termination if task deletion fails
                }
                
                // Fourth, delete all chat messages associated with this team
                System.out.println("💬 TeamService: Deleting all chat messages for team...");
                try {
                    if (firestore != null) {
                        // Query for all chat messages for this team
                        var chatMessagesFuture = firestore.collection("chat_messages")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var chatMessagesSnapshot = chatMessagesFuture.get();
                        System.out.println("🔍 TeamService: Found " + chatMessagesSnapshot.size() + " chat messages to delete");
                        
                        // Delete all chat messages for this team
                        for (var messageDoc : chatMessagesSnapshot.getDocuments()) {
                            firestore.collection("chat_messages").document(messageDoc.getId()).delete().get();
                            System.out.println("🗑️ TeamService: Deleted chat message: " + messageDoc.getId());
                        }
                        System.out.println("✅ TeamService: All chat messages deleted for team");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not delete chat messages: " + e.getMessage());
                    // Don't fail team termination if chat message deletion fails
                }
                
                // Fifth, delete all chat rooms associated with this team
                System.out.println("🏠 TeamService: Deleting all chat rooms for team...");
                try {
                    if (firestore != null) {
                        // Query for all chat rooms for this team
                        var chatRoomsFuture = firestore.collection("chat_rooms")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var chatRoomsSnapshot = chatRoomsFuture.get();
                        System.out.println("🔍 TeamService: Found " + chatRoomsSnapshot.size() + " chat rooms to delete");
                        
                        // Delete all chat rooms for this team
                        for (var roomDoc : chatRoomsSnapshot.getDocuments()) {
                            firestore.collection("chat_rooms").document(roomDoc.getId()).delete().get();
                            System.out.println("🗑️ TeamService: Deleted chat room: " + roomDoc.getId());
                        }
                        System.out.println("✅ TeamService: All chat rooms deleted for team");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not delete chat rooms: " + e.getMessage());
                    // Don't fail team termination if chat room deletion fails
                }
                
                // Sixth, delete all files associated with this team
                System.out.println("📁 TeamService: Deleting all files for team...");
                try {
                    if (fileUploadService != null) {
                        boolean filesDeleted = fileUploadService.deleteAllTeamFiles(teamId);
                        if (filesDeleted) {
                            System.out.println("✅ TeamService: All files deleted for team");
                        } else {
                            System.out.println("⚠️ TeamService: Some files may not have been deleted");
                        }
                    } else {
                        System.out.println("⚠️ TeamService: FileUploadService not available, skipping file cleanup");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not delete files: " + e.getMessage());
                    // Don't fail team termination if file deletion fails
                }
                
                // Seventh, cleanup all tournament invites and update team counts
                System.out.println("🏆 TeamService: Cleaning up tournament invites for team...");
                try {
                    if (firestore != null) {
                        // Query for all tournament invites for this team (both pending and accepted)
                        var tournamentInvitesFuture = firestore.collection("tournamentInvites")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var tournamentInvitesSnapshot = tournamentInvitesFuture.get();
                        System.out.println("🔍 TeamService: Found " + tournamentInvitesSnapshot.size() + " tournament invites to cleanup");
                        
                        // Process each tournament invite
                        for (var inviteDoc : tournamentInvitesSnapshot.getDocuments()) {
                            Map<String, Object> inviteData = inviteDoc.getData();
                            String tournamentId = (String) inviteData.get("tournamentId");
                            Boolean isActive = (Boolean) inviteData.get("isActive");
                            
                            // If the invite was accepted (isActive = true), decrement team count in tournament
                            if (Boolean.TRUE.equals(isActive)) {
                                try {
                                    DocumentReference tournamentRef = firestore.collection("tournaments").document(tournamentId);
                                    ApiFuture<DocumentSnapshot> tournamentFuture = tournamentRef.get();
                                    DocumentSnapshot tournamentDoc = tournamentFuture.get();
                                    
                                    if (tournamentDoc.exists()) {
                                        Map<String, Object> tournamentData = tournamentDoc.getData();
                                        Object teamCountObj = tournamentData.get("teamCount");
                                        Integer currentTeamCount = null;
                                        
                                        // Handle different numeric types that Firestore might return
                                        if (teamCountObj instanceof Long) {
                                            currentTeamCount = ((Long) teamCountObj).intValue();
                                        } else if (teamCountObj instanceof Integer) {
                                            currentTeamCount = (Integer) teamCountObj;
                                        } else if (teamCountObj instanceof Number) {
                                            currentTeamCount = ((Number) teamCountObj).intValue();
                                        }
                                        
                                        if (currentTeamCount != null && currentTeamCount > 0) {
                                            int newTeamCount = Math.max(0, currentTeamCount - 1);
                                            Map<String, Object> tournamentUpdates = new HashMap<>();
                                            tournamentUpdates.put("teamCount", newTeamCount);
                                            tournamentRef.update(tournamentUpdates).get();
                                            System.out.println("📊 TeamService: Updated tournament " + tournamentId + " team count from " + currentTeamCount + " to " + newTeamCount);
                                        }
                                    }
                                } catch (Exception e) {
                                    System.err.println("⚠️ TeamService: Warning - could not update tournament " + tournamentId + " team count: " + e.getMessage());
                                    // Don't fail team termination if tournament update fails
                                }
                            }
                            
                            // Delete the tournament invite
                            firestore.collection("tournamentInvites").document(inviteDoc.getId()).delete().get();
                            System.out.println("🗑️ TeamService: Deleted tournament invite: " + inviteDoc.getId());
                        }
                        System.out.println("✅ TeamService: All tournament invites cleaned up for team");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not cleanup tournament invites: " + e.getMessage());
                    // Don't fail team termination if tournament cleanup fails
                }
                
                // Eighth, remove all user associations for this team
                System.out.println("👥 TeamService: Removing all users from team...");
                try {
                    if (firestore != null) {
                        // Query for all user-team relationships for this team
                        var future = firestore.collection("userTeams")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var querySnapshot = future.get();
                        System.out.println("🔍 TeamService: Found " + querySnapshot.size() + " user-team relationships to remove");
                        
                        // Delete all user-team relationships for this team
                        for (var document : querySnapshot.getDocuments()) {
                            firestore.collection("userTeams").document(document.getId()).delete().get();
                            System.out.println("🗑️ TeamService: Removed user-team relationship: " + document.getId());
                        }
                        System.out.println("✅ TeamService: All users removed from team");
                        
                        // Verify that all userTeams records were deleted
                        var verificationFuture = firestore.collection("userTeams")
                            .whereEqualTo("teamId", teamId)
                            .get();
                        
                        var verificationSnapshot = verificationFuture.get();
                        if (verificationSnapshot.size() > 0) {
                            System.err.println("⚠️ TeamService: Warning - " + verificationSnapshot.size() + " userTeams records still exist after deletion");
                            // Force delete any remaining records
                            for (var remainingDoc : verificationSnapshot.getDocuments()) {
                                try {
                                    firestore.collection("userTeams").document(remainingDoc.getId()).delete().get();
                                    System.out.println("🗑️ TeamService: Force deleted remaining user-team relationship: " + remainingDoc.getId());
                                } catch (Exception forceDeleteError) {
                                    System.err.println("❌ TeamService: Critical error - could not force delete user-team relationship " + remainingDoc.getId() + ": " + forceDeleteError.getMessage());
                                }
                            }
                        } else {
                            System.out.println("✅ TeamService: Verified all userTeams records were deleted successfully");
                        }
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ TeamService: Warning - could not remove user associations: " + e.getMessage());
                    // Don't fail team termination if user removal fails
                }
                
                // Finally, delete the actual team document
                System.out.println("🗑️ TeamService: Deleting team document...");
                firestore.collection("teams").document(teamId).delete().get();
                System.out.println("✅ TeamService: Team document deleted");
                
                // Final verification - ensure no orphaned data remains
                System.out.println("🔍 TeamService: Performing final verification...");
                try {
                    // Check if team document still exists
                    var teamVerification = firestore.collection("teams").document(teamId).get().get();
                    if (teamVerification.exists()) {
                        System.err.println("❌ TeamService: Critical error - team document still exists after deletion!");
                    } else {
                        System.out.println("✅ TeamService: Team document verified as deleted");
                    }
                    
                    // Check if any userTeams records still exist
                    var userTeamsVerification = firestore.collection("userTeams")
                        .whereEqualTo("teamId", teamId)
                        .get();
                    
                    var userTeamsSnapshot = userTeamsVerification.get();
                    if (userTeamsSnapshot.size() > 0) {
                        System.err.println("❌ TeamService: Critical error - " + userTeamsSnapshot.size() + " userTeams records still exist after cleanup!");
                    } else {
                        System.out.println("✅ TeamService: All userTeams records verified as deleted");
                    }
                    
                    // Check if any events still exist
                    var eventsVerification = firestore.collection("events")
                        .whereEqualTo("teamId", teamId)
                        .get();
                    
                    var eventsSnapshot = eventsVerification.get();
                    if (eventsSnapshot.size() > 0) {
                        System.err.println("❌ TeamService: Critical error - " + eventsSnapshot.size() + " events still exist after cleanup!");
                    } else {
                        System.out.println("✅ TeamService: All events verified as deleted");
                    }
                    
                } catch (Exception verificationError) {
                    System.err.println("⚠️ TeamService: Warning - could not perform final verification: " + verificationError.getMessage());
                }
                
                // Log comprehensive cleanup summary
                System.out.println("🎯 TeamService: Team termination cleanup completed successfully:");
                System.out.println("   • Events: Deleted (cascade cleanup)");
                System.out.println("   • Availability: Deleted (cascade cleanup)");
                System.out.println("   • Tasks: Deleted (cascade cleanup)");
                System.out.println("   • Chat Messages: Deleted (cascade cleanup)");
                System.out.println("   • Chat Rooms: Deleted (cascade cleanup)");
                System.out.println("   • Files: Deleted (cascade cleanup)");
                System.out.println("   • Tournament Invites: Cleaned up and team counts updated");
                System.out.println("   • User Relationships: Removed (cascade cleanup)");
                System.out.println("   • Team Document: Deleted");
                
                System.out.println("✅ TeamService: Team terminated successfully");
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error terminating team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to terminate team: " + e.getMessage());
            }
        });
    }
    
    /**
     * Deactivates a team (keeps user associations)
     */
    public CompletableFuture<Void> deactivateTeam(String teamId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🔄 TeamService: Deactivating team with ID: " + teamId);
                
                firestore.collection("teams").document(teamId).update("isActive", false).get();
                
                System.out.println("✅ TeamService: Team deactivated successfully");
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error deactivating team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to deactivate team: " + e.getMessage());
            }
        });
    }

    /**
     * Updates the coach count for a team
     */
    public CompletableFuture<Void> updateCoachCount(String teamId, int delta) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }

        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("👥 TeamService: Updating coach count for team: " + teamId + " with delta: " + delta);
                
                // Get current team document
                var document = firestore.collection("teams").document(teamId).get().get();
                
                if (!document.exists()) {
                    System.err.println("❌ TeamService: Team not found with ID: " + teamId);
                    throw new RuntimeException("Team not found with ID: " + teamId);
                }
                
                Team team = document.toObject(Team.class);
                if (team == null) {
                    throw new RuntimeException("Failed to parse team data");
                }
                
                int newCoachCount = team.getCoachCount() + delta;
                
                // Prevent negative coach count
                if (newCoachCount < 0) {
                    System.err.println("❌ TeamService: Cannot have negative coach count. Current: " + team.getCoachCount() + ", Delta: " + delta);
                    throw new RuntimeException("Cannot have negative coach count");
                }
                
                // Prevent zero coach count
                if (newCoachCount == 0) {
                    System.err.println("❌ TeamService: Cannot have zero coach count. At least one coach is required.");
                    throw new RuntimeException("Cannot have zero coach count. At least one coach is required.");
                }
                
                System.out.println("👥 TeamService: Updating coach count from " + team.getCoachCount() + " to " + newCoachCount);
                
                // Update the coach count in Firestore
                firestore.collection("teams").document(teamId).update("coachCount", newCoachCount).get();
                
                System.out.println("✅ TeamService: Coach count updated successfully to: " + newCoachCount);
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error updating coach count: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to update coach count: " + e.getMessage());
            }
        });
    }

    /**
     * Gets the current coach count for a team
     */
    public CompletableFuture<Integer> getCoachCount(String teamId) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }

        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("👥 TeamService: Getting coach count for team: " + teamId);
                
                var document = firestore.collection("teams").document(teamId).get().get();
                
                if (!document.exists()) {
                    System.err.println("❌ TeamService: Team not found with ID: " + teamId);
                    return 0;
                }
                
                Team team = document.toObject(Team.class);
                if (team == null) {
                    return 0;
                }
                
                System.out.println("✅ TeamService: Current coach count: " + team.getCoachCount());
                return team.getCoachCount();
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error getting coach count: " + e.getMessage());
                e.printStackTrace();
                return 0;
            }
        });
    }

    /**
     * Search teams by name (partial match)
     */
    public CompletableFuture<List<Team>> searchTeamsByName(String teamName) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }

        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 TeamService: Searching teams by name: " + teamName);
                
                // Get all teams and filter by name (case-insensitive partial match)
                var querySnapshot = firestore.collection("teams").get().get();
                List<Team> matchingTeams = new java.util.ArrayList<>();
                
                for (var document : querySnapshot.getDocuments()) {
                    Team team = document.toObject(Team.class);
                    if (team != null && team.getTeamName().toLowerCase().contains(teamName.toLowerCase())) {
                        matchingTeams.add(team);
                    }
                }
                
                System.out.println("✅ TeamService: Found " + matchingTeams.size() + " matching teams");
                return matchingTeams;
                
            } catch (Exception e) {
                System.err.println("❌ TeamService: Error searching teams by name: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to search teams by name: " + e.getMessage());
            }
        });
    }
}

