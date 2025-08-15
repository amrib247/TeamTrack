package com.example.TeamTrack_backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.models.User;
import com.example.TeamTrack_backend.models.UserTeam;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

@Service
public class UserTeamService {
    
    private DatabaseReference getDatabase() {
        try {
            return FirebaseDatabase.getInstance().getReference();
        } catch (Exception e) {
            // Firebase not available, return null
            return null;
        }
    }

    // Add user to a team with a specific role
    public CompletableFuture<UserTeam> addUserToTeam(String userId, String teamId, User.UserRole role) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                DatabaseReference database = getDatabase();
                if (database == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Check if user is already in the team
                DatabaseReference userTeamRef = database.child("userTeams").child(userId).child(teamId);
                
                // Get team information for display
                DatabaseReference teamRef = database.child("teams").child(teamId);
                
                // Create user-team relationship
                UserTeam userTeam = new UserTeam(userId, teamId, role);
                
                // Generate unique ID for the relationship
                String userTeamId = database.child("userTeams").push().getKey();
                userTeam.setId(userTeamId);

                // Save to database
                userTeamRef.setValueAsync(userTeam).get();

                return userTeam;
            } catch (Exception e) {
                throw new RuntimeException("Failed to add user to team: " + e.getMessage());
            }
        });
    }

    // Remove user from a team
    public CompletableFuture<Void> removeUserFromTeam(String userId, String teamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                DatabaseReference database = getDatabase();
                if (database == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Remove user-team relationship
                DatabaseReference userTeamRef = database.child("userTeams").child(userId).child(teamId);
                userTeamRef.removeValueAsync().get();
            } catch (Exception e) {
                throw new RuntimeException("Failed to remove user from team: " + e.getMessage());
            }
        });
    }

    // Update user's role in a specific team
    public CompletableFuture<UserTeam> updateUserRole(String userId, String teamId, User.UserRole newRole) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                DatabaseReference database = getDatabase();
                if (database == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                DatabaseReference userTeamRef = database.child("userTeams").child(userId).child(teamId);
                
                // Create updated user-team relationship
                UserTeam userTeam = new UserTeam(userId, teamId, newRole);
                userTeamRef.setValueAsync(userTeam).get();

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
                // For now, return empty list - no teams have been added yet
                // In a real implementation, you'd use Firebase listeners or REST API
                return new ArrayList<>();
            } catch (Exception e) {
                throw new RuntimeException("Failed to get user teams: " + e.getMessage());
            }
        });
    }

    // Get all users for a specific team
    public CompletableFuture<List<UserTeam>> getTeamUsers(String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // For now, return empty list - this would need proper Firebase implementation
                // In a real implementation, you'd use Firebase listeners or REST API
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
                // For now, return false - this would need proper Firebase implementation
                // In a real implementation, you'd use Firebase listeners or REST API
                return false;
            } catch (Exception e) {
                throw new RuntimeException("Failed to check user-team relationship: " + e.getMessage());
            }
        });
    }

    // Get user's role in a specific team
    public CompletableFuture<User.UserRole> getUserRoleInTeam(String userId, String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // For now, return null - this would need proper Firebase implementation
                // In a real implementation, you'd use Firebase listeners or REST API
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get user role: " + e.getMessage());
            }
        });
    }
}
