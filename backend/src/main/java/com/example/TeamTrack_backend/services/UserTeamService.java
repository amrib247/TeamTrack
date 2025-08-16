package com.example.TeamTrack_backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.models.UserTeam;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class UserTeamService {
    
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

    // Add user to a team with a specific role (overloaded for backward compatibility)
    public CompletableFuture<UserTeam> addUserToTeam(String userId, String teamId, String role) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Create user-team relationship (without team details)
                UserTeam userTeam = new UserTeam(userId, teamId, role);
                
                // Generate unique ID for the relationship
                String userTeamId = firestore.collection("userTeams").document().getId();
                userTeam.setId(userTeamId);

                // Save to Firestore
                firestore.collection("userTeams").document(userTeamId).set(userTeam).get();

                return userTeam;
            } catch (Exception e) {
                throw new RuntimeException("Failed to add user to team: " + e.getMessage());
            }
        });
    }

    // Add user to a team with a specific role and team details
    public CompletableFuture<UserTeam> addUserToTeam(String userId, String teamId, String role, String teamName, String sport) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                System.out.println("🔍 UserTeamService: Adding user to team with details:");
                System.out.println("  - userId: " + userId);
                System.out.println("  - teamId: " + teamId);
                System.out.println("  - role: " + role);
                System.out.println("  - teamName: " + teamName);
                System.out.println("  - sport: " + sport);
                
                // Create user-team relationship with team details
                UserTeam userTeam = new UserTeam(userId, teamId, role);
                userTeam.setTeamName(teamName);
                userTeam.setSport(sport);
                
                System.out.println("🔍 UserTeamService: Created UserTeam object: " + userTeam.getTeamName() + " - " + userTeam.getSport());
                System.out.println("🔍 UserTeamService: UserTeam isActive: " + userTeam.isActive());
                
                // Generate unique ID for the relationship
                String userTeamId = firestore.collection("userTeams").document().getId();
                userTeam.setId(userTeamId);
                
                System.out.println("🔍 UserTeamService: Generated userTeamId: " + userTeamId);

                // Save to Firestore
                firestore.collection("userTeams").document(userTeamId).set(userTeam).get();
                
                System.out.println("🔍 UserTeamService: Successfully saved UserTeam to Firestore");

                return userTeam;
            } catch (Exception e) {
                System.err.println("❌ UserTeamService: Failed to add user to team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to add user to team: " + e.getMessage());
            }
        });
    }

    // Remove user from a team
    public CompletableFuture<Void> removeUserFromTeam(String userId, String teamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Remove user-team relationship
                firestore.collection("userTeams").document(userId + "_" + teamId).delete().get();
            } catch (Exception e) {
                throw new RuntimeException("Failed to remove user from team: " + e.getMessage());
            }
        });
    }

    // Update user's role in a specific team
    public CompletableFuture<UserTeam> updateUserRole(String userId, String teamId, String newRole) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Create updated user-team relationship
                UserTeam userTeam = new UserTeam(userId, teamId, newRole);
                firestore.collection("userTeams").document(userId + "_" + teamId).set(userTeam).get();

                return userTeam;
            } catch (Exception e) {
                throw new RuntimeException("Failed to update user role: " + e.getMessage());
            }
        });
    }

    // Get all teams for a specific user
    public CompletableFuture<List<UserTeam>> getUserTeams(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                System.out.println("🔍 UserTeamService: Querying Firestore for user teams, userId: " + userId);
                
                // Query Firestore for all user-team relationships for this user
                // Temporarily removed isActive filter to debug the issue
                var future = firestore.collection("userTeams")
                    .whereEqualTo("userId", userId)
                    .get();
                
                var querySnapshot = future.get();
                List<UserTeam> userTeams = new ArrayList<>();
                
                System.out.println("🔍 UserTeamService: Query returned " + querySnapshot.size() + " documents");
                
                for (var document : querySnapshot.getDocuments()) {
                    System.out.println("🔍 UserTeamService: Processing document: " + document.getId());
                    System.out.println("🔍 UserTeamService: Document data: " + document.getData());
                    
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null) {
                        userTeam.setId(document.getId());
                        System.out.println("🔍 UserTeamService: Created UserTeam object: " + userTeam.getTeamName() + " - " + userTeam.getSport());
                        userTeams.add(userTeam);
                    } else {
                        System.err.println("❌ UserTeamService: Failed to convert document to UserTeam object");
                    }
                }
                
                System.out.println("🔍 UserTeamService: Found " + userTeams.size() + " teams for user " + userId);
                return userTeams;
                
            } catch (Exception e) {
                System.err.println("❌ UserTeamService: Error getting user teams: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to get user teams: " + e.getMessage());
            }
        });
    }

    // Get all users for a specific team
    public CompletableFuture<List<UserTeam>> getTeamUsers(String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // For now, return empty list - this would need proper Firestore implementation
                // In a real implementation, you'd use Firestore listeners or REST API
                return new ArrayList<>();
            } catch (Exception e) {
                throw new RuntimeException("Failed to get team users: " + e.getMessage());
            }
        });
    }

    // Check if user is in a specific team
    public CompletableFuture<Boolean> isUserInTeam(String userId, String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // For now, return false - this would need proper Firestore implementation
                // In a real implementation, you'd use Firestore listeners or REST API
                return false;
            } catch (Exception e) {
                throw new RuntimeException("Failed to check user-team relationship: " + e.getMessage());
            }
        });
    }

    // Get user's role in a specific team
    public CompletableFuture<String> getUserRoleInTeam(String userId, String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // For now, return null - this would need proper Firestore implementation
                // In a real implementation, you'd use Firestore listeners or REST API
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get user role: " + e.getMessage());
            }
        });
    }
}
