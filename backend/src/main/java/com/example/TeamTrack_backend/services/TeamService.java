package com.example.TeamTrack_backend.services;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.CreateTeamRequest;
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
                
                // Automatically add creator as coach using the correct method signature
                System.out.println("👥 TeamService: About to call userTeamService.addUserToTeam with:");
                System.out.println("  - createdByUserId: " + createdByUserId);
                System.out.println("  - teamId: " + teamId);
                System.out.println("  - role: COACH");
                System.out.println("  - teamName: " + request.getTeamName());
                System.out.println("  - sport: " + request.getSport());
                
                userTeamService.addUserToTeam(createdByUserId, teamId, "COACH", request.getTeamName(), request.getSport());
                
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
                // Note: This is a simplified implementation
                // In a real app, you'd want to properly handle the async Firestore operations
                return null; // Placeholder for now
            } catch (Exception e) {
                throw new RuntimeException("Failed to retrieve team: " + e.getMessage());
            }
        });
    }
    
    /**
     * Updates an existing team
     */
    public CompletableFuture<Team> updateTeam(String teamId, CreateTeamRequest request) {
        Firestore firestore = getFirestore();
        if (firestore == null) {
            return CompletableFuture.failedFuture(
                new RuntimeException("Firebase Firestore not available")
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Get existing team
                Team existingTeam = getTeamById(teamId).get();
                if (existingTeam == null) {
                    throw new RuntimeException("Team not found");
                }
                
                // Update fields
                existingTeam.setTeamName(request.getTeamName());
                existingTeam.setSport(request.getSport());
                existingTeam.setAgeGroup(request.getAgeGroup());
                existingTeam.setDescription(request.getDescription());
                existingTeam.setProfilePhotoUrl(request.getProfilePhotoUrl());
                existingTeam.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                // Save updated team
                firestore.collection("teams").document(teamId).set(existingTeam).get();
                
                return existingTeam;
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to update team: " + e.getMessage());
            }
        });
    }
    
    /**
     * Deactivates a team
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
                firestore.collection("teams").document(teamId).update("isActive", false).get();
            } catch (Exception e) {
                throw new RuntimeException("Failed to deactivate team: " + e.getMessage());
            }
        });
    }
}
