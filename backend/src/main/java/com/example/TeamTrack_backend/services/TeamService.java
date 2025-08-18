package com.example.TeamTrack_backend.services;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.CreateTeamRequest;
import com.example.TeamTrack_backend.dto.UpdateTeamRequest;
import com.example.TeamTrack_backend.models.Team;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class TeamService {
    
    @Autowired
    private UserTeamService userTeamService;
    
    public TeamService() {
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
                
                // Automatically add creator as coach (no redundant team details needed)
                System.out.println("👥 TeamService: About to call userTeamService.addUserToTeam with:");
                System.out.println("  - createdByUserId: " + createdByUserId);
                System.out.println("  - teamId: " + teamId);
                System.out.println("  - role: COACH");
                
                userTeamService.addUserToTeam(createdByUserId, teamId, "COACH");
                
                System.out.println("✅ TeamService: User added to team as coach successfully");
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
     * Terminates a team (deactivates and removes all user associations)
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
                
                // First, remove all user associations for this team
                System.out.println("👥 TeamService: Removing all users from team...");
                userTeamService.removeAllUsersFromTeam(teamId);
                System.out.println("✅ TeamService: All users removed from team");
                
                // Then delete the actual team document
                System.out.println("🗑️ TeamService: Deleting team document...");
                firestore.collection("teams").document(teamId).delete().get();
                System.out.println("✅ TeamService: Team document deleted");
                
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
}

